import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

/* ===============================
   INITIATE KHALTI PAYMENT
================================ */
router.post("/initiate", async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                error: "Order ID required",
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                error: "Order not found",
            });
        }

        if (order.paymentStatus === "paid") {
            return res.json({
                message: "Order already paid",
            });
        }

        /* ================= KHALTI INITIATE PAYLOAD ================= */
        const payload = {
            return_url: `${process.env.KHALTI_RETURN_URL}?orderId=${order._id}`,
            website_url: process.env.KHALTI_WEBSITE_URL,
            amount: order.totalAmount * 100, // paisa
            purchase_order_id: order._id.toString(),
            purchase_order_name: `Order ${order._id}`,
            customer_info: {
                name: order.shipping.fullName,
                phone: order.shipping.phone,
            },
        };

        const khaltiRes = await fetch(
            "https://a.khalti.com/api/v2/epayment/initiate/",
            {
                method: "POST",
                headers: {
                    Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            }
        );

        const khaltiData = await khaltiRes.json();

        if (!khaltiRes.ok) {
            console.error("❌ Khalti initiate error:", khaltiData);
            return res.status(400).json(khaltiData);
        }

        res.json({
            payment_url: khaltiData.payment_url,
            pidx: khaltiData.pidx, // useful for debugging/logging
        });
    } catch (err) {
        console.error("❌ Khalti initiate failed:", err);
        res.status(500).json({
            error: "Failed to initiate Khalti payment",
        });
    }
});

/* ===============================
   VERIFY KHALTI PAYMENT (REAL)
================================ */
router.post("/verify", async (req, res) => {
    try {
        const { pidx } = req.body;

        if (!pidx) {
            return res.status(400).json({
                error: "pidx required",
            });
        }

        const khaltiRes = await fetch(
            "https://a.khalti.com/api/v2/epayment/lookup/",
            {
                method: "POST",
                headers: {
                    Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ pidx }),
            }
        );

        const data = await khaltiRes.json();

        if (!khaltiRes.ok) {
            console.error("❌ Khalti lookup error:", data);
            return res.status(400).json(data);
        }

        if (data.status !== "Completed") {
            return res.status(400).json({
                error: "Payment not completed",
                status: data.status,
            });
        }

        const orderId = data.purchase_order_id;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                error: "Order not found",
            });
        }

        if (order.paymentStatus !== "paid") {
            order.paymentStatus = "paid";
            order.orderStatus = "paid";
            await order.save();
        }

        res.json({
            success: true,
            orderId,
        });
    } catch (err) {
        console.error("❌ Khalti verify error:", err);
        res.status(500).json({
            error: "Khalti verification failed",
        });
    }
});

export default router;