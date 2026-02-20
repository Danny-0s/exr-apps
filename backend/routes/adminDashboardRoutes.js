import express from "express";
import Order from "../models/order.js";
import Product from "../models/Product.js";
import User from "../models/UserModel.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

/* ======================================================
   ADMIN DASHBOARD STATS
====================================================== */
router.get("/stats", adminAuth("owner"), async (_req, res) => {
    try {
        /* ================= TOTAL ORDERS ================= */
        const totalOrders = await Order.countDocuments();

        /* ================= PENDING ORDERS ================= */
        const pendingOrders = await Order.countDocuments({
            orderStatus: "pending",
        });

        /* ================= TOTAL REVENUE (PAID ONLY) ================= */
        const revenueAgg = await Order.aggregate([
            { $match: { paymentStatus: "paid" } },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" },
                },
            },
        ]);

        const totalRevenue = revenueAgg[0]?.total || 0;

        /* ================= LOW STOCK ================= */
        const lowStockProducts = await Product.find({
            stock: { $lte: 5 },
        })
            .select("name stock")
            .limit(5);

        const lowStockCount = lowStockProducts.length;

        /* ================= REGISTERED USERS ================= */
        const totalUsers = await User.countDocuments();

        /* =====================================================
           🔥 REFUND ANALYTICS
        ====================================================== */

        const totalRefundRequests = await Order.countDocuments({
            refundRequested: true,
        });

        const approvedRefunds = await Order.countDocuments({
            refundStatus: "approved",
        });

        const rejectedRefunds = await Order.countDocuments({
            refundStatus: "rejected",
        });

        const refundedAgg = await Order.aggregate([
            { $match: { refundStatus: "approved" } },
            {
                $group: {
                    _id: null,
                    totalRefunded: { $sum: "$totalAmount" },
                },
            },
        ]);

        const totalRefundedAmount = refundedAgg[0]?.totalRefunded || 0;

        /* Refund percentage */
        const refundRate =
            totalOrders > 0
                ? ((approvedRefunds / totalOrders) * 100).toFixed(2)
                : 0;

        /* Revenue after refunds */
        const netRevenue = totalRevenue - totalRefundedAmount;

        res.json({
            success: true,
            stats: {
                totalOrders,
                pendingOrders,
                totalRevenue,
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
        console.error("DASHBOARD STATS ERROR:", err);
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
            );

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
   🔥 DETAILED REFUND ANALYTICS ENDPOINT
   GET /api/admin/dashboard/refund-analytics
====================================================== */
router.get(
    "/refund-analytics",
    adminAuth("owner"),
    async (_req, res) => {
        try {
            const totalOrders = await Order.countDocuments();

            const refundData = await Order.aggregate([
                {
                    $group: {
                        _id: "$refundStatus",
                        count: { $sum: 1 },
                        amount: { $sum: "$totalAmount" },
                    },
                },
            ]);

            const formatted = {
                requested: 0,
                approved: 0,
                rejected: 0,
                refunded: 0,
            };

            refundData.forEach(item => {
                if (formatted[item._id] !== undefined) {
                    formatted[item._id] = item.count;
                }
            });

            const refundRate =
                totalOrders > 0
                    ? (
                        ((formatted.approved +
                            formatted.refunded) /
                            totalOrders) *
                        100
                    ).toFixed(2)
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