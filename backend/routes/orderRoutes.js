import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import Settings from "../models/Settings.js";
import User from "../models/User.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

/* ===================================================
   CREATE ORDER
=================================================== */
router.post("/", userAuth, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { items, shipping, paymentMethod = "cod", coupon = null } =
            req.body;

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("Invalid items");
        }

        if (!shipping?.fullName || !shipping?.address) {
            throw new Error("Invalid shipping information");
        }

        const settings = await Settings.getSingleton();
        if (settings.maintenanceMode) {
            throw new Error("Store under maintenance");
        }

        /* ===============================
           STOCK + PRICE SNAPSHOT
        ================================ */
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            if (!mongoose.Types.ObjectId.isValid(item._id)) {
                throw new Error("Invalid product ID");
            }

            const product = await Product.findOneAndUpdate(
                {
                    _id: item._id,
                    stock: { $gte: item.quantity },
                    isActive: true,
                },
                { $inc: { stock: -item.quantity } },
                { new: true, session }
            );

            if (!product) {
                throw new Error(`Insufficient stock for ${item.title}`);
            }

            subtotal += product.price * item.quantity;

            orderItems.push({
                _id: product._id.toString(),
                title: product.title,
                price: product.price,
                quantity: item.quantity,
                image: product.images?.[0] || "",
            });
        }

        /* ===============================
           COUPON
        ================================ */
        let appliedCoupon = null;
        let discountAmount = 0;

        if (coupon?.code) {
            const couponDoc = await Coupon.findOne({
                code: coupon.code.toUpperCase().trim(),
                active: true,
            }).session(session);

            if (!couponDoc) throw new Error("Invalid coupon");

            if (
                couponDoc.expiresAt &&
                new Date(couponDoc.expiresAt) < new Date()
            ) {
                throw new Error("Coupon expired");
            }

            if (
                couponDoc.maxUses !== null &&
                couponDoc.usedCount >= couponDoc.maxUses
            ) {
                throw new Error("Coupon limit reached");
            }

            discountAmount =
                couponDoc.type === "percent"
                    ? Math.round((subtotal * couponDoc.value) / 100)
                    : couponDoc.value;

            if (discountAmount > subtotal) discountAmount = subtotal;

            couponDoc.usedCount += 1;
            await couponDoc.save({ session });

            appliedCoupon = {
                code: couponDoc.code,
                type: couponDoc.type,
                value: couponDoc.value,
                discount: discountAmount,
            };
        }

        const finalTotal = subtotal - discountAmount;

        /* ===============================
           WALLET PAYMENT
        ================================ */
        let paymentStatus = "pending";
        let orderStatus = "pending";

        if (paymentMethod === "wallet") {
            const user = await User.findById(req.user.userId).session(session);

            if (!user) throw new Error("User not found");

            if (user.walletBalance < finalTotal) {
                throw new Error("Insufficient wallet balance");
            }

            user.debitWallet(finalTotal, null, "Order payment");
            await user.save({ session });

            paymentStatus = "paid";
            orderStatus = "paid";
        }

        /* ===============================
           CREATE ORDER
        ================================ */
        const [order] = await Order.create(
            [
                {
                    user: req.user.userId,
                    items: orderItems,
                    shipping,
                    totalAmount: finalTotal,
                    paymentMethod,
                    paymentStatus,
                    orderStatus,
                    coupon: appliedCoupon,
                },
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            success: true,
            orderId: order._id,
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        console.error("CREATE ORDER ERROR:", err);

        return res.status(400).json({
            error: err.message || "Order failed",
        });
    }
});

/* ===================================================
   GET MY ORDERS
=================================================== */
router.get("/my-orders", userAuth, async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user.userId,
        }).sort({ createdAt: -1 });

        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch orders" });
    }
});

/* ===================================================
   GET SINGLE ORDER
=================================================== */
router.get("/:id", userAuth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid order ID" });
        }

        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user.userId,
        });

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        res.json(order);

    } catch (err) {
        res.status(500).json({ error: "Failed to load order" });
    }
});

/* ===================================================
   REQUEST REFUND (SAFE VERSION)
=================================================== */
router.post("/:id/refund-request", userAuth, async (req, res) => {
    try {
        const { reason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid order ID" });
        }

        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user.userId,
        });

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        /* ===============================
           SECURITY CHECKS
        ================================ */

        if (order.paymentStatus !== "paid") {
            return res.status(400).json({
                error: "Only paid orders can be refunded",
            });
        }

        if (order.orderStatus !== "delivered") {
            return res.status(400).json({
                error: "Refund allowed only after delivery",
            });
        }

        if (order.refundStatus !== "none") {
            return res.status(400).json({
                error: "Refund already processed/requested",
            });
        }

        const allowedReasons = [
            "size_issue",
            "damaged_item",
            "wrong_item",
            "change_of_mind",
        ];

        if (!allowedReasons.includes(reason)) {
            return res.status(400).json({
                error: "Invalid refund reason",
            });
        }

        /* ===============================
           APPLY REFUND REQUEST
        ================================ */

        order.refundRequested = true;
        order.refundRequestedAt = new Date();
        order.refundReason = reason;
        order.refundStatus = "requested";

        order.addRefundTimeline("requested", reason);

        await order.save();

        res.json({
            success: true,
            message: "Refund request submitted",
        });

    } catch (err) {
        console.error("REFUND REQUEST ERROR:", err);
        res.status(500).json({
            error: "Failed to submit refund request",
        });
    }
});

export default router;