import express from "express";
import Order from "../models/OrderTemp.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

/* ======================================================
   ADMIN DASHBOARD STATS (PRODUCTION SAFE)
====================================================== */
router.get("/stats", adminAuth("owner"), async (_req, res) => {
    try {
        /* ================= TOTAL ORDERS ================= */
        const totalOrders = await Order.countDocuments();

        /* ================= PENDING ORDERS ================= */
        const pendingOrders = await Order.countDocuments({
            orderStatus: "pending",
        });

        /* ================= GROSS REVENUE (PAID ONLY) ================= */
        const revenueAgg = await Order.aggregate([
            { $match: { paymentStatus: "paid" } },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" },
                },
            },
        ]);

        const grossRevenue = revenueAgg[0]?.total || 0;

        /* ================= TOTAL REFUNDED ================= */
        const refundAgg = await Order.aggregate([
            { $match: { refundStatus: "approved" } },
            {
                $group: {
                    _id: null,
                    totalRefunded: { $sum: "$refundAmount" },
                },
            },
        ]);

        const totalRefundedAmount = refundAgg[0]?.totalRefunded || 0;

        /* ================= NET REVENUE ================= */
        const netRevenue = grossRevenue - totalRefundedAmount;

        /* ================= LOW STOCK ================= */
        const lowStockProducts = await Product.find({
            stock: { $lte: 5 },
            isActive: true,
        })
            .select("title stock")
            .limit(5);

        const lowStockCount = lowStockProducts.length;

        /* ================= USERS ================= */
        const totalUsers = await User.countDocuments();

        /* ================= REFUND METRICS ================= */
        const totalRefundRequests = await Order.countDocuments({
            refundStatus: "requested",
        });

        const approvedRefunds = await Order.countDocuments({
            refundStatus: "approved",
        });

        const rejectedRefunds = await Order.countDocuments({
            refundStatus: "rejected",
        });

        const refundRate =
            totalOrders > 0
                ? Number(
                    ((approvedRefunds / totalOrders) * 100).toFixed(2)
                )
                : 0;

        res.json({
            success: true,
            stats: {
                totalOrders,
                pendingOrders,
                grossRevenue,
                netRevenue,
                totalRefundedAmount,
                refundRate,
                totalRefundRequests,
                approvedRefunds,
                rejectedRefunds,
                lowStockCount,
                totalUsers,
            },
            lowStockProducts,
        });

    } catch (err) {
        console.error("DASHBOARD ERROR:", err);
        res.status(500).json({
            error: "Failed to load dashboard stats",
        });
    }
});

/* ======================================================
   RECENT ORDERS
====================================================== */
router.get("/recent", adminAuth("owner"), async (_req, res) => {
    try {
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select(
                "_id totalAmount paymentMethod orderStatus paymentStatus createdAt refundStatus"
            )
            .populate("user", "email");

        res.json({
            success: true,
            orders: recentOrders,
        });

    } catch (err) {
        console.error("RECENT ORDERS ERROR:", err);
        res.status(500).json({
            error: "Failed to load recent orders",
        });
    }
});

/* ======================================================
   DETAILED REFUND ANALYTICS
====================================================== */
router.get(
    "/refund-analytics",
    adminAuth("owner"),
    async (_req, res) => {
        try {
            const totalOrders = await Order.countDocuments();

            const refundBreakdown = await Order.aggregate([
                {
                    $group: {
                        _id: "$refundStatus",
                        count: { $sum: 1 },
                        amount: { $sum: "$refundAmount" },
                    },
                },
            ]);

            const formatted = {
                none: 0,
                requested: 0,
                approved: 0,
                rejected: 0,
            };

            refundBreakdown.forEach((item) => {
                if (formatted[item._id] !== undefined) {
                    formatted[item._id] = item.count;
                }
            });

            const refundRate =
                totalOrders > 0
                    ? Number(
                        (
                            (formatted.approved / totalOrders) *
                            100
                        ).toFixed(2)
                    )
                    : 0;

            res.json({
                success: true,
                totalOrders,
                refundRate,
                breakdown: formatted,
            });

        } catch (err) {
            console.error("REFUND ANALYTICS ERROR:", err);
            res.status(500).json({
                error: "Failed to load refund analytics",
            });
        }
    }
);

export default router;