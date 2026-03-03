import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import adminAuth from "../middleware/adminAuth.js";
import nodemailer from "nodemailer";

const router = express.Router();

/* ========================================
   SAFE EMAIL TRANSPORTER
======================================== */
let transporter = null;

if (
    process.env.EMAIL_HOST &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS
) {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}

/* ========================================
   GET ORDERS (FILTER + DATE + PAGINATION)
======================================== */
router.get("/", adminAuth(), async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status = "all",
            payment = "all",
            search = "",
            from,
            to,
        } = req.query;

        const query = {};

        if (status !== "all") query.orderStatus = status;
        if (payment !== "all") query.paymentMethod = payment;

        if (search && mongoose.Types.ObjectId.isValid(search)) {
            query._id = new mongoose.Types.ObjectId(search);
        }

        if (from && to) {
            query.createdAt = {
                $gte: new Date(from),
                $lte: new Date(to + "T23:59:59.999Z"),
            };
        }

        const totalOrders = await Order.countDocuments(query);

        const orders = await Order.find(query)
            .populate("user", "email name walletBalance")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            orders,
            totalOrders,
            totalPages: Math.ceil(totalOrders / limit),
            currentPage: Number(page),
        });

    } catch {
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

/* ========================================
   UPDATE ORDER STATUS
======================================== */
router.patch("/:orderId/status", adminAuth(), async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ error: "Invalid order ID" });
        }

        const allowedStatuses = [
            "pending",
            "paid",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
            "refunded",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status value" });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        order.orderStatus = status;

        // COD auto mark paid when delivered
        if (status === "delivered" && order.paymentMethod === "cod") {
            order.paymentStatus = "paid";
        }

        await order.save();

        res.json({
            success: true,
            message: "Order status updated",
        });

    } catch {
        res.status(500).json({ error: "Status update failed" });
    }
});

/* ========================================
   APPROVE REFUND (WALLET CREDIT)
======================================== */
router.put("/refund/:orderId", adminAuth(), async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            throw new Error("Invalid order ID");
        }

        const order = await Order.findById(orderId).session(session);
        if (!order) throw new Error("Order not found");

        if (order.refundStatus !== "requested") {
            throw new Error("Refund not in requested state");
        }

        const user = await User.findById(order.user).session(session);
        if (!user) throw new Error("User not found");

        // Credit wallet
        user.walletBalance += order.totalAmount;

        user.walletTransactions.push({
            type: "refund",
            amount: order.totalAmount,
            relatedOrderId: order._id,
            note: "Admin approved refund",
            createdAt: new Date(),
        });

        await user.save({ session });

        // Update order
        order.markAsRefunded(
            req.admin?._id || null,
            order.totalAmount,
            "wallet"
        );

        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Email (non-blocking)
        if (transporter && user.email) {
            transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: user.email,
                subject: "Refund Approved",
                html: `<h2>Your refund for order ${order._id} has been approved.</h2>`,
            }).catch(() => { });
        }

        res.json({ success: true });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ error: err.message });
    }
});

/* ========================================
   REJECT REFUND
======================================== */
router.put("/refund/:orderId/reject", adminAuth(), async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ error: "Invalid order ID" });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        if (order.refundStatus !== "requested") {
            return res.status(400).json({
                error: "Refund not in requested state",
            });
        }

        order.refundStatus = "rejected";
        order.refundRejectReason = reason || "Refund rejected";
        order.refundedBy = req.admin?._id || null;

        order.addRefundTimeline("rejected", reason);

        await order.save();

        const user = await User.findById(order.user);

        if (transporter && user?.email) {
            transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: user.email,
                subject: "Refund Rejected",
                html: `<h2>Your refund for order ${order._id} was rejected.</h2><p>${reason}</p>`,
            }).catch(() => { });
        }

        res.json({ success: true });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/* ========================================
   EXPORT CSV
======================================== */
router.get("/export", adminAuth(), async (req, res) => {
    try {
        const {
            status = "all",
            payment = "all",
            search = "",
            from,
            to,
        } = req.query;

        const query = {};

        if (status !== "all") query.orderStatus = status;
        if (payment !== "all") query.paymentMethod = payment;

        if (search && mongoose.Types.ObjectId.isValid(search)) {
            query._id = new mongoose.Types.ObjectId(search);
        }

        if (from && to) {
            query.createdAt = {
                $gte: new Date(from),
                $lte: new Date(to + "T23:59:59.999Z"),
            };
        }

        const orders = await Order.find(query)
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        let csv =
            "Order ID,Customer Name,Customer Email,Amount,Payment Method,Order Status,Refund Status,Created At\n";

        orders.forEach((order) => {
            csv += `"${order._id}","${order.user?.name || ""}","${order.user?.email || ""}","${order.totalAmount}","${order.paymentMethod}","${order.orderStatus}","${order.refundStatus || "none"}","${order.createdAt}"\n`;
        });

        res.header("Content-Type", "text/csv");
        res.attachment("orders-export.csv");
        res.send(csv);

    } catch {
        res.status(500).json({ error: "CSV export failed" });
    }
});

export default router;