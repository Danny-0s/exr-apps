import express from "express";
import mongoose from "mongoose";
import Order from "../models/OrderTemp.js";
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
   GET ORDERS (SERVER SIDE PAGINATION)
======================================== */
router.get("/", adminAuth(), async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status = "all",
            payment = "all",
            search = "",
        } = req.query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        const query = {};

        if (status !== "all") {
            query.orderStatus = status;
        }

        if (payment !== "all") {
            query.paymentMethod = payment;
        }

        if (search) {
            query._id = { $regex: search, $options: "i" };
        }

        const totalOrders = await Order.countDocuments(query);

        const orders = await Order.find(query)
            .populate("user", "email name")
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);

        res.json({
            success: true,
            orders,
            totalOrders,
            totalPages: Math.ceil(totalOrders / limitNumber),
            currentPage: pageNumber,
        });

    } catch (err) {
        console.error("Admin orders error:", err);
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
            "processing",
            "shipped",
            "delivered",
            "cancelled",
            "refunded",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid order ID" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        order.orderStatus = status;

        /* ===============================
           FORCE PAYMENT SYNC
        ================================ */

        if (status === "paid") {
            order.paymentStatus = "paid";
        }

        if (
            status === "delivered" &&
            (order.paymentMethod === "cod" ||
                order.paymentMethod === "cash_on_delivery")
        ) {
            order.paymentStatus = "paid";
        }

        await order.save();

        res.json({ success: true, order });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* ========================================
   APPROVE REFUND
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

        if (order.refundStatus !== "requested") {
            throw new Error("Refund not in requested state");
        }

        /* ===============================
           UNIVERSAL PAYMENT ELIGIBILITY
        ================================ */

        const isEligible =
            order.paymentStatus === "paid" ||
            order.paymentStatus === "succeeded" ||
            order.paymentStatus === "completed" ||
            (
                (order.paymentMethod === "cod" ||
                    order.paymentMethod === "cash_on_delivery")
                &&
                order.orderStatus === "delivered"
            );

        if (!isEligible) {
            throw new Error("Order not eligible for refund");
        }

        const user = await User.findById(order.user).session(session);
        if (!user) throw new Error("User not found");

        /* ===============================
           CREDIT WALLET
        ================================ */

        user.walletBalance =
            (user.walletBalance || 0) + order.totalAmount;

        user.walletTransactions = user.walletTransactions || [];

        user.walletTransactions.push({
            type: "refund",
            amount: order.totalAmount,
            relatedOrderId: order._id,
            note: `Refund for order ${order._id}`,
            createdAt: new Date(),
        });

        await user.save({ session });

        /* ===============================
           UPDATE ORDER
        ================================ */

        order.refundStatus = "approved";
        order.orderStatus = "refunded";
        order.paymentStatus = "refunded";
        order.refundedAt = new Date();
        order.refundedBy = req.admin._id;
        order.refundAmount = order.totalAmount;
        order.refundMethod = "wallet";

        order.refundTimeline = order.refundTimeline || [];
        order.refundTimeline.push({
            status: "approved",
            note: "Refund credited to wallet",
            createdAt: new Date(),
        });

        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        /* ===============================
           SEND EMAIL (SAFE)
        ================================ */
        try {
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
        } catch {
            console.log("Email failed but refund completed");
        }

        res.json({
            success: true,
            message: "Refund approved and wallet credited",
        });

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
        const { reason } = req.body;
        const { orderId } = req.params;

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
        order.refundRejectReason =
            reason || "Refund request rejected";
        order.refundedBy = req.admin._id;

        order.refundTimeline = order.refundTimeline || [];
        order.refundTimeline.push({
            status: "rejected",
            note: order.refundRejectReason,
            createdAt: new Date(),
        });

        await order.save();

        try {
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
        } catch {
            console.log("Reject email failed");
        }

        res.json({
            success: true,
            message: "Refund rejected",
        });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;