import express from "express";
import mongoose from "mongoose";
import Stripe from "stripe";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import Settings from "../models/Settings.js";
import User from "../models/User.js";
import Store from "../models/Store.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

/* =========================================
   SAFE STRIPE INITIALIZATION
========================================= */
let stripe = null;

if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
    console.log("⚠️ Stripe not initialized (missing STRIPE_SECRET_KEY)");
}

/* ===================================================
   GET USER ORDERS
=================================================== */
router.get("/my-orders", userAuth, async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user.userId,
        })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            orders,
        });
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
        res.status(500).json({ error: "Failed to fetch order" });
    }
});

/* ===================================================
   CREATE ORDER (YOUR ORIGINAL LOGIC)
=================================================== */
router.post("/", userAuth, async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const user = await User.findById(req.user.userId).session(session);
        if (!user) throw new Error("User not found");

        const {
            items,
            shipping,
            paymentMethod = "cod",
            coupon = null,
        } = req.body;

        const resolvedStore = await Store.findOne({ isActive: true }).session(session);
        if (!resolvedStore) throw new Error("No active store available");

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
                { returnDocument: "after", session }
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

        let appliedCoupon = null;
        let discountAmount = 0;

        if (coupon?.code) { 
            const couponDoc = await Coupon.findOne({
                code: coupon.code.toUpperCase().trim(),
                active: true,
            }).session(session);

            if (!couponDoc) throw new Error("Invalid coupon");

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

        /* =========================================
   WELCOME 20% DISCOUNT (FIRST ORDER ONLY)
========================================= */

        if (!user.welcomeDiscountUsed) {
            const welcomeDiscount = Math.round(subtotal * 0.2);

            discountAmount += welcomeDiscount;

            appliedCoupon = {
                ...(appliedCoupon || {}),
                welcomeDiscount: welcomeDiscount,
            };

            user.welcomeDiscountUsed = true;
            await user.save({ session });
        }

        let paymentStatus = "pending";
        let orderStatus = "pending";

        if (paymentMethod === "wallet") {
            const user = await User.findById(req.user.userId).session(session);
            if (!user) throw new Error("User not found");

            if (user.walletBalance < finalTotal) {
                throw new Error("Insufficient wallet balance");
            }

            user.walletBalance -= finalTotal;

            user.walletTransactions.push({
                type: "purchase",
                amount: finalTotal,
                note: "Order payment",
                createdAt: new Date(),
            });

            await user.save({ session });

            paymentStatus = "paid";
            orderStatus = "paid";
        }

        const order = new Order({
            store: resolvedStore._id,
            user: req.user.userId,
            items: orderItems,
            shipping,
            totalAmount: finalTotal,
            paymentMethod,
            paymentStatus,
            orderStatus,
            coupon: appliedCoupon,
        });

        await order.save({ session });
        await session.commitTransaction();

        res.status(201).json({
            success: true,
            orderId: order._id,
        });

    } catch (err) {
        await session.abortTransaction();
        res.status(400).json({ error: err.message });
    } finally {
        session.endSession();
    }
});

export default router;