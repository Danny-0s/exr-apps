import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import adminAuth from "../middleware/adminAuth.js";
import { getRedis } from "../config/redis.js"; // ✅ ADDED

const router = express.Router();

/* =========================================
   GET DASHBOARD ANALYTICS
========================================= */
router.get("/dashboard", adminAuth(), async (req, res) => {
    try {

        /* ===============================
           REDIS CACHE CHECK (NEW)
        ================================ */
        const redis = getRedis();
        const cacheKey = `analytics:${JSON.stringify(req.query)}`;

        if (redis) {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                return res.json(JSON.parse(cachedData));
            }
        }

        const { from, to, storeId, groupBy = "daily" } = req.query;

        const matchFilter = {};
        let validStoreId = null;

        let currentFrom = null;
        let currentTo = null;

        if (from && to) {
            currentFrom = new Date(from);
            currentTo = new Date(to + "T23:59:59.999Z");

            matchFilter.createdAt = {
                $gte: currentFrom,
                $lte: currentTo,
            };
        }

        if (storeId && mongoose.Types.ObjectId.isValid(storeId)) {
            validStoreId = new mongoose.Types.ObjectId(storeId);
            matchFilter.store = validStoreId;
        }

        let groupFormat;

        if (groupBy === "monthly") {
            groupFormat = {
                $dateToString: { format: "%Y-%m", date: "$createdAt" },
            };
        } else if (groupBy === "weekly") {
            groupFormat = {
                $concat: [
                    { $toString: { $isoWeekYear: "$createdAt" } },
                    "-W",
                    { $toString: { $isoWeek: "$createdAt" } },
                ],
            };
        } else {
            groupFormat = {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            };
        }

        const currentStats = await Order.aggregate([
            {
                $match: {
                    orderStatus: { $in: ["paid", "delivered"] },
                    ...matchFilter,
                },
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                    totalOrders: { $sum: 1 },
                },
            },
        ]).allowDiskUse(true);

        const totalRevenue = currentStats[0]?.totalRevenue || 0;
        const totalOrders = currentStats[0]?.totalOrders || 0;
        const averageOrderValue =
            totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const customerStats = await Order.aggregate([
            {
                $match: {
                    orderStatus: { $in: ["paid", "delivered"] },
                    ...matchFilter,
                },
            },
            {
                $group: {
                    _id: "$user",
                    orderCount: { $sum: 1 },
                    lastOrder: { $max: "$createdAt" },
                },
            },
        ]).allowDiskUse(true);

        const totalCustomers = customerStats.length;
        const repeatCustomers =
            customerStats.filter(c => c.orderCount > 1).length;

        const retentionRate =
            totalCustomers > 0
                ? Number(((repeatCustomers / totalCustomers) * 100).toFixed(2))
                : 0;

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const churnedCustomers =
            customerStats.filter(c => c.lastOrder < sixtyDaysAgo).length;

        const churnRate =
            totalCustomers > 0
                ? Number(((churnedCustomers / totalCustomers) * 100).toFixed(2))
                : 0;

        let revenueGrowth = 0;
        let ordersGrowth = 0;

        if (currentFrom && currentTo) {
            const diffMs = currentTo.getTime() - currentFrom.getTime();

            const previousFrom = new Date(currentFrom.getTime() - diffMs);
            const previousTo = new Date(currentFrom.getTime() - 1);

            const previousMatch = {
                createdAt: {
                    $gte: previousFrom,
                    $lte: previousTo,
                },
            };

            if (validStoreId) {
                previousMatch.store = validStoreId;
            }

            const previousStats = await Order.aggregate([
                {
                    $match: {
                        orderStatus: { $in: ["paid", "delivered"] },
                        ...previousMatch,
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$totalAmount" },
                        totalOrders: { $sum: 1 },
                    },
                },
            ]);

            const prevRevenue = previousStats[0]?.totalRevenue || 0;
            const prevOrders = previousStats[0]?.totalOrders || 0;

            const calcGrowth = (current, previous) => {
                if (!previous) return 0;
                return Number(
                    (((current - previous) / previous) * 100).toFixed(2)
                );
            };

            revenueGrowth = calcGrowth(totalRevenue, prevRevenue);
            ordersGrowth = calcGrowth(totalOrders, prevOrders);
        }

        const revenueByDay = await Order.aggregate([
            {
                $match: {
                    orderStatus: { $in: ["paid", "delivered"] },
                    ...matchFilter,
                },
            },
            {
                $group: {
                    _id: groupFormat,
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]).allowDiskUse(true);

        const topProducts = await Order.aggregate([
            {
                $match: {
                    orderStatus: { $in: ["paid", "delivered"] },
                    ...matchFilter,
                },
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items._id",
                    title: { $first: "$items.title" },
                    totalSold: { $sum: "$items.quantity" },
                    totalRevenue: {
                        $sum: {
                            $multiply: ["$items.price", "$items.quantity"],
                        },
                    },
                },
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
        ]).allowDiskUse(true);

        const recentOrders = await Order.find(matchFilter)
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        /* ===============================
           FINAL RESPONSE
        ================================ */

        const responseData = {
            success: true,
            totalRevenue,
            totalOrders,
            totalCustomers,
            repeatCustomers,
            retentionRate,
            churnRate,
            averageOrderValue: Number(averageOrderValue.toFixed(2)),
            revenueGrowth,
            ordersGrowth,
            revenueByDay,
            topProducts,
            recentOrders,
        };

        // ✅ SAVE TO REDIS (60 seconds)
        if (redis) {
            await redis.setEx(cacheKey, 60, JSON.stringify(responseData));
        }

        res.json(responseData);

    } catch (err) {
        console.error("Dashboard analytics error:", err);
        res.status(500).json({ error: "Analytics failed" });
    }
});
export default router;