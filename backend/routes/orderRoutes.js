import express from "express";
import mongoose from "mongoose";
import Order from "../models/order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import Settings from "../models/Settings.js";
import User from "../models/TempUserModel.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

/* ===================================================
   CREATE ORDER
   ✅ WALLET SUPPORTED
   ✅ SAFE STOCK
   ✅ SAFE COUPON
   ✅ TRANSACTION SAFE
=================================================== */
router.post("/", userAuth, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            items,
            shipping,
            paymentMethod = "cod",
            coupon = null,
        } = req.body;

        const settings = await Settings.getSingleton();

        if (settings.maintenanceMode) {
            throw new Error("Store is under maintenance");
        }

        if (!Array.isArray(items) || items.length === 0 || !shipping) {
            throw new Error("Invalid order data");
        }

        /* ===============================
           STOCK CHECK + SUBTOTAL
        ================================ */
        let subtotal = 0;

        for (const item of items) {
            const product = await Product.findOneAndUpdate(
                {
                    _id: item._id,
                    stock: { $gte: item.quantity },
                },
                { $inc: { stock: -item.quantity } },
                { new: true, session }
            );

            if (!product) {
                throw new Error(
                    `Insufficient stock for ${item.title}`
                );
            }

            subtotal += product.price * item.quantity;
        }

        /* ===============================
           COUPON VALIDATION
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
                throw new Error("Coupon usage limit reached");
            }

            if (couponDoc.type === "fixed") {
                discountAmount = couponDoc.value;
            }

            if (couponDoc.type === "percent") {
                discountAmount = Math.round(
                    (subtotal * couponDoc.value) / 100
                );
            }

            if (discountAmount > subtotal) {
                discountAmount = subtotal;
            }

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

        /* ===================================================
           💰 WALLET PAYMENT
        =================================================== */
        let paymentStatus = "pending";
        let orderStatus = "pending";

        if (paymentMethod === "wallet") {
            const user = await User.findById(
                req.user.userId
            ).session(session);

            if (!user) throw new Error("User not found");

            if (user.walletBalance < finalTotal) {
                throw new Error("Insufficient wallet balance");
            }

            // ✅ USE YOUR HELPER METHOD
            user.debitWallet(
                finalTotal,
                null,
                "Wallet payment for order"
            );

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
                    userId: req.user.userId,
                    items,
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

        /* ===============================
           LINK WALLET TRANSACTION TO ORDER
        ================================ */
        if (paymentMethod === "wallet") {
            const user = await User.findById(
                req.user.userId
            ).session(session);

            const lastTx =
                user.walletTransactions[
                user.walletTransactions.length - 1
                ];

            if (lastTx) {
                lastTx.relatedOrder = order._id;
            }

            await user.save({ session });
        }

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
            error: err.message || "Failed to create order",
        });
    }
});

/* ===================================================
   GET MY ORDERS
=================================================== */
router.get("/my-orders", userAuth, async (req, res) => {
    try {
        const orders = await Order.find({
            userId: req.user.userId,
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            orders,
        });
    } catch (err) {
        console.error("FETCH MY ORDERS ERROR:", err);
        res.status(500).json({
            error: "Failed to fetch orders",
        });
    }
});

/* ===================================================
   REQUEST REFUND
=================================================== */
router.post("/:id/refund-request", userAuth, async (req, res) => {
    try {
        const { reason } = req.body;

        const order = await Order.findOne({
            _id: req.params.id,
            userId: req.user.userId,
        });

        if (!order) {
            return res.status(404).json({
                error: "Order not found",
            });
        }

        if (order.refundRequested) {
            return res.status(400).json({
                error: "Refund already requested",
            });
        }

        const allowedReasons = [
            "size_issue",
            "damaged_item",
            "wrong_item",
        ];

        if (!allowedReasons.includes(reason)) {
            return res.status(400).json({
                error: "Invalid refund reason",
            });
        }

        order.refundRequested = true;
        order.refundRequestedAt = new Date();
        order.refundReason = reason;
        order.refundStatus = "requested";

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

/* ===================================================
   GET SINGLE ORDER
=================================================== */
router.get("/:id", userAuth, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            userId: req.user.userId,
        });

        if (!order) {
            return res.status(404).json({
                error: "Order not found",
            });
        }

        res.json(order);

    } catch (err) {
        console.error("FETCH ORDER ERROR:", err);
        res.status(500).json({
            error: "Failed to load order",
        });
    }
});

export default router;