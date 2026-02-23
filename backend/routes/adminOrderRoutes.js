import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import adminAuth from "../middleware/adminAuth.js";
import nodemailer from "nodemailer";

const router = express.Router();

/* ========================================
   EMAIL TRANSPORTER
======================================== */
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/* ========================================
   EMAIL TEMPLATE
======================================== */
const refundEmailTemplate = (type, orderId, amount, reason = "") => {
    if (type === "approved") {
        return {
            subject: "Your Refund Has Been Approved 🎉",
            html: `
        <div style="font-family:Arial;background:#111;padding:30px;color:#fff;">
          <h2 style="color:#4ade80;">Refund Approved</h2>
          <p>Order <b>${orderId}</b></p>
          <p><b>Amount:</b> NPR ${amount}</p>
          <p>The amount has been credited to your wallet.</p>
        </div>
      `,
        };
    }

    return {
        subject: "Refund Request Rejected",
        html: `
      <div style="font-family:Arial;background:#111;padding:30px;color:#fff;">
        <h2 style="color:#f87171;">Refund Rejected</h2>
        <p>Order <b>${orderId}</b></p>
        <p><b>Reason:</b> ${reason}</p>
      </div>
    `,
    };
};

/* ========================================
   GET ALL ORDERS
======================================== */
router.get("/", adminAuth(), async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "email fullName")
            .sort({ createdAt: -1 });

        res.json({ success: true, orders });
    } catch {
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

/* ========================================
   UPDATE ORDER STATUS (SAFE)
======================================== */
router.patch("/:id/status", adminAuth(), async (req, res) => {
    try {
        const { status } = req.body;

        const allowed = [
            "pending",
            "paid",
            "shipped",
            "delivered",
            "cancelled",
            "refunded",
        ];

        if (!allowed.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid order ID" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found" });

        order.orderStatus = status;
        await order.save();

        res.json({ success: true });
    } catch {
        res.status(500).json({ error: "Status update failed" });
    }
});

/* ========================================
   APPROVE REFUND (TRANSACTION SAFE)
======================================== */
router.put("/refund/:orderId", adminAuth(), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            throw new Error("Invalid order ID");
        }

        const order = await Order.findById(orderId).session(session);
        if (!order) throw new Error("Order not found");

        /* ===== SECURITY CHECKS ===== */
        if (order.refundStatus !== "requested") {
            throw new Error("Refund not in requested state");
        }

        if (order.paymentStatus !== "paid") {
            throw new Error("Only paid orders refundable");
        }

        if (order.orderStatus !== "delivered") {
            throw new Error("Refund allowed only after delivery");
        }

        const user = await User.findById(order.user).session(session);
        if (!user) throw new Error("User not found");

        /* ===== CREDIT WALLET ===== */
        user.creditWallet(
            order.totalAmount,
            order._id,
            `Refund for order ${order._id}`
        );

        await user.save({ session });

        /* ===== UPDATE ORDER ===== */
        order.refundStatus = "approved";
        order.orderStatus = "refunded";
        order.refundedAt = new Date();
        order.refundedBy = req.admin._id;
        order.refundAmount = order.totalAmount;
        order.refundMethod = "wallet";

        order.addRefundTimeline("approved", "Refund credited to wallet");

        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        /* ===== SEND EMAIL (AFTER COMMIT) ===== */
        const emailContent = refundEmailTemplate(
            "approved",
            order._id,
            order.totalAmount
        );

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: emailContent.subject,
            html: emailContent.html,
        });

        res.json({
            success: true,
            message: "Refund approved and wallet credited",
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        console.error("REFUND APPROVAL ERROR:", err.message);

        res.status(400).json({ error: err.message });
    }
});

/* ========================================
   REJECT REFUND (SAFE)
======================================== */
router.put("/refund/:orderId/reject", adminAuth(), async (req, res) => {
    try {
        const { reason } = req.body;
        const { orderId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ error: "Invalid order ID" });
        }

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ error: "Order not found" });

        if (order.refundStatus !== "requested") {
            return res.status(400).json({
                error: "Refund not in requested state",
            });
        }

        order.refundStatus = "rejected";
        order.refundRejectReason =
            reason || "Refund request rejected";
        order.refundedBy = req.admin._id;

        order.addRefundTimeline(
            "rejected",
            order.refundRejectReason
        );

        await order.save();

        const user = await User.findById(order.user);

        if (user) {
            const emailContent = refundEmailTemplate(
                "rejected",
                order._id,
                0,
                order.refundRejectReason
            );

            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: user.email,
                subject: emailContent.subject,
                html: emailContent.html,
            });
        }

        res.json({
            success: true,
            message: "Refund rejected",
        });

    } catch (err) {
        console.error("REFUND REJECTION ERROR:", err.message);
        res.status(400).json({ error: err.message });
    }
});

/* ========================================
   REFUND ANALYTICS
======================================== */
router.get("/refund-analytics", adminAuth(), async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const approvedRefunds = await Order.countDocuments({
            refundStatus: "approved",
        });

        const rejectedRefunds = await Order.countDocuments({
            refundStatus: "rejected",
        });

        const totalRefundAgg = await Order.aggregate([
            { $match: { refundStatus: "approved" } },
            { $group: { _id: null, total: { $sum: "$refundAmount" } } },
        ]);

        const refundRate =
            totalOrders > 0
                ? (approvedRefunds / totalOrders) * 100
                : 0;

        res.json({
            success: true,
            analytics: {
                totalOrders,
                approvedRefunds,
                rejectedRefunds,
                refundRate: Number(refundRate.toFixed(2)),
                totalRefundAmount:
                    totalRefundAgg[0]?.total || 0,
            },
        });

    } catch {
        res.status(500).json({ error: "Analytics failed" });
    }
});

export default router;