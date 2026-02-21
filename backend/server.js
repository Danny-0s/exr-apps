import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import path from "path";

import connectDB from "./config/db.js";

/* ================= ROUTES ================= */
import adminLogRoutes from "./routes/adminLogRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import homepageRoutes from "./routes/homepageRoutes.js";
import seoRoutes from "./routes/seoRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import khaltiRoutes from "./routes/khaltiRoutes.js";
import esewaRoutes from "./routes/esewaRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import adminProductRoutes from "./routes/adminProductRoutes.js";
import adminOrderRoutes from "./routes/adminOrderRoutes.js";
import adminWalletRoutes from "./routes/adminWalletRoutes.js";
import adminCouponRoutes from "./routes/adminCouponRoutes.js";
import adminSettingsRoutes from "./routes/adminSettingsRoutes.js";
import adminUploadRoutes from "./routes/adminUpload.js";
import adminRefreshRoutes from "./routes/adminRefresh.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import adminTeamRoutes from "./routes/adminTeamRoutes.js";
import couponPublicRoutes from "./routes/couponPublicRoutes.js";

/* ================= MODELS ================= */
import Order from "./models/order.js";
import Settings from "./models/Settings.js";
import Admin from "./models/Admin.js";

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ================= CONNECT DB ================= */
connectDB();

/* ================= CORS ================= */
const allowedOrigins = [
    "http://localhost:5173",
    "https://exr-apps-1.onrender.com",
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

/* =====================================================
   STRIPE WEBHOOK (BEFORE JSON PARSER)
===================================================== */
app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        const sig = req.headers["stripe-signature"];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error("❌ Stripe webhook signature error:", err.message);
            return res.status(400).send("Webhook Error");
        }

        try {
            if (event.type === "checkout.session.completed") {
                const session = event.data.object;
                const orderId = session.metadata?.orderId;

                if (orderId) {
                    await Order.findByIdAndUpdate(orderId, {
                        paymentStatus: "paid",
                        orderStatus: "paid",
                        stripePaymentIntentId: session.payment_intent,
                    });
                }
            }

            res.json({ received: true });
        } catch (err) {
            console.error("❌ Stripe webhook handler error:", err);
            res.status(500).json({ error: "Webhook handler failed" });
        }
    }
);

/* ================= BODY PARSERS ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= STATIC FILES ================= */
app.use("/uploads", express.static(path.resolve("uploads")));

/* ================= PUBLIC SETTINGS ================= */
app.get("/api/settings", async (_req, res) => {
    try {
        const settings = await Settings.getSingleton();

        res.json({
            codEnabled: settings.codEnabled,
            stripeEnabled: settings.stripeEnabled,
            esewaEnabled: settings.esewaEnabled,
            khaltiEnabled: settings.khaltiEnabled,
            shippingInsideValley: settings.shippingInsideValley,
            shippingOutsideValley: settings.shippingOutsideValley,
            maintenanceMode: settings.maintenanceMode,
        });
    } catch (err) {
        console.error("PUBLIC SETTINGS ERROR:", err);
        res.status(500).json({ error: "Failed to load settings" });
    }
});

/* ================= PUBLIC API ================= */
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/homepage", homepageRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/seo", seoRoutes);
app.use("/api/coupons", couponPublicRoutes);
app.use("/api/wishlist", wishlistRoutes);

/* ================= USER AUTH ================= */
app.use("/api/auth", authRoutes);

/* ================= PAYMENT ================= */
app.use("/api/payments/khalti", khaltiRoutes);
app.use("/api/payments/esewa", esewaRoutes);

/* ================= ADMIN API ================= */
app.use("/api/admin/logs", adminLogRoutes);
app.use("/api/admin/refresh", adminRefreshRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/wallet", adminWalletRoutes);
app.use("/api/admin/coupons", adminCouponRoutes);
app.use("/api/admin/settings", adminSettingsRoutes);
app.use("/api/admin/media", mediaRoutes);
app.use("/api/admin/upload", adminUploadRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/team", adminTeamRoutes);

/* ================= HEALTH ================= */
app.get("/", (_req, res) => {
    res.send("Backend running ✅");
});

/* =====================================================
   ADMIN LOGIN
===================================================== */
app.post("/api/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase() });

        if (!admin || !admin.isActive) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isMatch = await admin.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const accessToken = jwt.sign(
            { adminId: admin._id, role: admin.role },
            process.env.ADMIN_JWT_SECRET,
            { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
            { adminId: admin._id, role: admin.role },
            process.env.ADMIN_REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            accessToken,
            refreshToken,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            },
        });
    } catch (err) {
        console.error("ADMIN LOGIN ERROR:", err);
        res.status(500).json({ error: "Login failed" });
    }
});

/* =====================================================
   ADMIN VERIFY TOKEN
===================================================== */
app.get("/api/admin/verify", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.ADMIN_JWT_SECRET
        );

        return res.json({
            success: true,
            adminId: decoded.adminId,
            role: decoded.role,
        });

    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired token",
        });
    }
});
/* =====================================================
   STRIPE CHECKOUT SESSION
===================================================== */
app.post("/create-checkout-session", async (req, res) => {
    try {
        const { items, orderId } = req.body;

        const FRONTEND_URL =
            process.env.NODE_ENV === "production"
                ? "https://exr-apps-1.onrender.com"
                : "http://localhost:5173";

        const line_items = items.map((item) => ({
            price_data: {
                currency: "usd",
                product_data: { name: item.title },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity || 1,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items,
            mode: "payment",
            success_url: `${FRONTEND_URL}/success/${orderId}`,
            cancel_url: `${FRONTEND_URL}/cart`,
            metadata: { orderId },
        });

        await Order.findByIdAndUpdate(orderId, {
            stripeSessionId: session.id,
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error("STRIPE SESSION ERROR:", err);
        res.status(500).json({ error: "Stripe session failed" });
    }
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 4242;

app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
});