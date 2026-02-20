import express from "express";
import Order from "../models/order.js";
<<<<<<< HEAD
import User from "../models/User.js";
=======
import User from "../models/UserModel.js";
>>>>>>> 4462b3f
import AdminWallet from "../models/AdminWallet.js";
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
                <div style="font-family: Arial; background:#111; padding:30px; color:#fff;">
                    <h2 style="color:#4ade80;">Refund Approved</h2>
                    <p>Your refund for order <b>${orderId}</b> has been approved.</p>
                    <p><b>Amount Credited:</b> NPR ${amount}</p>
                    <p>The amount has been added to your wallet.</p>
                    <br/>
                    <p>Thank you for shopping with EXR.</p>
                </div>
            `,
        };
    }

    return {
        subject: "Your Refund Request Was Rejected",
        html: `
            <div style="font-family: Arial; background:#111; padding:30px; color:#fff;">
                <h2 style="color:#f87171;">Refund Rejected</h2>
                <p>Your refund request for order <b>${orderId}</b> was rejected.</p>
                <p><b>Reason:</b> ${reason}</p>
                <br/>
                <p>If you have questions, contact support.</p>
            </div>
        `,
    };
};

/* ========================================
   GET ALL ORDERS
======================================== */
router.get("/", adminAuth(), async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

/* ========================================
   UPDATE ORDER STATUS
======================================== */
router.patch("/:id/status", adminAuth(), async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = [
            "pending",
            "paid",
            "shipped",
            "delivered",
            "cancelled",
            "refunded",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        order.orderStatus = status;
        await order.save();

        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ error: "Failed to update status" });
    }
});

/* ========================================
   APPROVE REFUND
======================================== */
router.put("/refund/:orderId", adminAuth(), async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ error: "Order not found" });

        if (order.orderStatus === "refunded") {
            return res.status(400).json({ error: "Already refunded" });
        }

        if (order.paymentStatus !== "paid") {
            return res.status(400).json({ error: "Only paid orders refundable" });
        }

        const user = await User.findById(order.user);
        if (!user) return res.status(404).json({ error: "User not found" });

        /* CREDIT WALLET */
        user.creditWallet(
            order.totalAmount,
            order._id,
            `Refund approved for order ${order._id}`
        );

        user.logActivity(
            "refund_approved",
            `Refund approved. NPR ${order.totalAmount} credited to wallet.`
        );

        await user.save();

        /* SEND EMAIL */
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

        /* UPDATE ORDER */
        order.orderStatus = "refunded";
        order.refundStatus = "approved";
        order.refundedAt = new Date();
        await order.save();

        res.json({
            success: true,
            message: "Refund approved, wallet credited & email sent",
        });

    } catch (err) {
        console.error("REFUND APPROVAL ERROR:", err);
        res.status(500).json({ error: "Refund process failed" });
    }
});

/* ========================================
   REJECT REFUND
======================================== */
router.put("/refund/:orderId/reject", adminAuth(), async (req, res) => {
    try {
        const { reason } = req.body;

        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ error: "Order not found" });

        order.refundStatus = "rejected";
        order.refundRejectedReason = reason || "Refund request rejected";
        order.refundRejectedAt = new Date();
        await order.save();

        const user = await User.findById(order.user);

        if (user) {
            user.logActivity(
                "refund_rejected",
                `Refund rejected. Reason: ${order.refundRejectedReason}`
            );

            await user.save();

            /* SEND EMAIL */
            const emailContent = refundEmailTemplate(
                "rejected",
                order._id,
                0,
                order.refundRejectedReason
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
            message: "Refund rejected & email sent",
        });

    } catch (err) {
        console.error("REFUND REJECTION ERROR:", err);
        res.status(500).json({ error: "Refund rejection failed" });
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

        const refundRate =
            totalOrders > 0
                ? ((approvedRefunds / totalOrders) * 100).toFixed(2)
                : 0;

        const refundAmountAgg = await Order.aggregate([
            { $match: { refundStatus: "approved" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]);

        res.json({
            success: true,
            analytics: {
                totalOrders,
                approvedRefunds,
                rejectedRefunds,
                refundRate: Number(refundRate),
                totalRefundAmount: refundAmountAgg[0]?.total || 0,
            },
        });

    } catch (err) {
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
});

export default router;