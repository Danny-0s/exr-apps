import express from "express";
import Coupon from "../models/Coupon.js";

const router = express.Router();

/* ===============================
   APPLY COUPON (PUBLIC)
   Used by cart.jsx
================================ */
router.post("/apply", async (req, res) => {
    try {
        const { code, subtotal } = req.body;

        if (!code || subtotal === undefined) {
            return res.status(400).json({
                error: "Coupon code and subtotal required",
            });
        }

        const safeSubtotal = Number(subtotal);

        if (isNaN(safeSubtotal) || safeSubtotal <= 0) {
            return res.status(400).json({
                error: "Invalid subtotal",
            });
        }

        const coupon = await Coupon.findOne({
            code: code.toUpperCase().trim(),
        });

        if (!coupon) {
            return res.status(404).json({
                error: "Invalid coupon code",
            });
        }

        /* ================= STATUS CHECKS ================= */
        if (!coupon.active) {
            return res.status(400).json({
                error: "Coupon is inactive",
            });
        }

        if (
            coupon.expiresAt &&
            new Date(coupon.expiresAt) < new Date()
        ) {
            return res.status(400).json({
                error: "Coupon has expired",
            });
        }

        if (
            coupon.maxUses !== null &&
            coupon.usedCount >= coupon.maxUses
        ) {
            return res.status(400).json({
                error: "Coupon usage limit reached",
            });
        }

        /* ================= DISCOUNT LOGIC ================= */
        let discountAmount = 0;

        if (coupon.type === "fixed") {
            discountAmount = coupon.value;
        }

        if (coupon.type === "percent") {
            discountAmount = Math.round(
                (safeSubtotal * coupon.value) / 100
            );
        }

        if (discountAmount > safeSubtotal) {
            discountAmount = safeSubtotal;
        }

        const finalTotal = safeSubtotal - discountAmount;

        return res.json({
            success: true,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            discountAmount,
            finalTotal,
        });

    } catch (err) {
        console.error("COUPON APPLY ERROR:", err);
        return res.status(500).json({
            error: "Failed to apply coupon",
        });
    }
});

export default router;