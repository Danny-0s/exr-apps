import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

/* =========================================
   eSewa VERIFY PAYMENT (PRODUCTION READY)
   Called from success redirect URL
========================================= */
router.post("/verify", async (req, res) => {
    try {
        const { oid, amt, refId } = req.body;

        /* ===============================
           1️⃣ BASIC VALIDATION
        ================================ */
        if (!oid || !amt || !refId) {
            return res.status(400).json({
                success: false,
                error: "Missing verification parameters",
            });
        }

        if (!process.env.ESEWA_MERCHANT_CODE) {
            console.error("ESEWA_MERCHANT_CODE missing in env");
            return res.status(500).json({
                success: false,
                error: "Server configuration error",
            });
        }

        /* ===============================
           2️⃣ VERIFY WITH eSEWA SERVER
        ================================ */
        const verifyUrl = "https://uat.esewa.com.np/epay/transrec";

        const params = new URLSearchParams({
            amt: String(amt),
            rid: String(refId),
            pid: String(oid),
            scd: process.env.ESEWA_MERCHANT_CODE, // EPAYTEST for UAT
        });

        const esewaResponse = await fetch(verifyUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        const responseText = await esewaResponse.text();

        /* ===============================
           3️⃣ VALIDATE eSEWA RESPONSE
        ================================ */
        const successTag = "<response_code>Success</response_code>";

        if (!responseText || !responseText.includes(successTag)) {
            console.error("❌ eSewa verification failed:", responseText);
            return res.status(400).json({
                success: false,
                error: "eSewa payment verification failed",
            });
        }

        /* ===============================
           4️⃣ FIND ORDER
        ================================ */
        const order = await Order.findById(oid);

        if (!order) {
            return res.status(404).json({
                success: false,
                error: "Order not found",
            });
        }

        /* ===============================
           5️⃣ IDEMPOTENCY PROTECTION
        ================================ */
        if (order.paymentStatus === "paid") {
            return res.json({
                success: true,
                message: "Order already verified",
            });
        }

        /* ===============================
           6️⃣ UPDATE ORDER
        ================================ */
        order.paymentStatus = "paid";
        order.orderStatus = "paid";
        order.esewaRefId = refId;
        order.paymentMethod = "esewa";
        order.paidAt = new Date();

        await order.save();

        /* ===============================
           7️⃣ SUCCESS RESPONSE
        ================================ */
        return res.json({
            success: true,
            message: "eSewa payment verified successfully",
            orderId: order._id,
        });
    } catch (error) {
        console.error("❌ eSewa VERIFY ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error during eSewa verification",
        });
    }
});

export default router;