import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import Order from "../models/OrderTemp.js";

const router = express.Router();

/* =========================================
   ADMIN ANALYTICS DASHBOARD
========================================= */
router.get("/", adminAuth(), async (_req, res) => {
    try {

        /* ===============================
           TOTAL REVENUE (PAID ORDERS)
        ================================ */
        const revenueData = await Order.aggregate([
            {
                $match: {
                    paymentStatus: { $in: ["paid", "completed", "succeeded"] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                    totalOrders: { $sum: 1 }
                }
            }
        ]);

        const totalRevenue = revenueData[0]?.totalRevenue || 0;
        const totalOrders = revenueData[0]?.totalOrders || 0;

        /* ===============================
           TOTAL REFUNDED
        ================================ */
        const refundedData = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "refunded"
                }
            },
            {
                $group: {
                    _id: null,
                    totalRefunded: { $sum: "$refundAmount" }
                }
            }
        ]);

        const totalRefunded = refundedData[0]?.totalRefunded || 0;

        /* ===============================
           PAYMENT METHOD BREAKDOWN
        ================================ */
        const paymentBreakdown = await Order.aggregate([
            {
                $match: {
                    paymentStatus: { $in: ["paid", "completed", "succeeded"] }
                }
            },
            {
                $group: {
                    _id: "$paymentMethod",
                    revenue: { $sum: "$totalAmount" }
                }
            }
        ]);

        /* ===============================
           LAST 7 DAYS REVENUE
        ================================ */
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const weeklyRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: last7Days },
                    paymentStatus: { $in: ["paid", "completed", "succeeded"] }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            totalRevenue,
            totalOrders,
            totalRefunded,
            netRevenue: totalRevenue - totalRefunded,
            paymentBreakdown,
            weeklyRevenue
        });

    } catch (err) {
        console.error("Analytics error:", err);
        res.status(500).json({ error: "Failed to load analytics" });
    }
});

export default router;