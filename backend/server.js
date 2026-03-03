import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";

import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import adminAuth from "./middleware/adminAuth.js";

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
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import adminStoreRoutes from "./routes/adminStoreRoutes.js";

/* ================= MODELS ================= */
import Order from "./models/Order.js";
import Admin from "./models/Admin.js";
import Settings from "./models/Settings.js"; // ✅ FIXED IMPORT

const app = express();
app.set("trust proxy", 1);

/* ================= DATABASE ================= */
connectDB();

/* ================= REDIS ================= */
connectRedis();

/* ================= STRIPE ================= */
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
    console.warn("⚠️ Stripe not initialized (missing STRIPE_SECRET_KEY)");
}

/* =====================================================
   🔐 SECURITY HARDENING
===================================================== */

app.disable("x-powered-by");

app.use(
    helmet({
        crossOriginResourcePolicy: false,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https:"],
            },
        },
    })
);

app.use(compression());

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 300,
        standardHeaders: true,
        legacyHeaders: false,
    })
);

/* Force HTTPS in production */
if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
        if (req.headers["x-forwarded-proto"] !== "https") {
            return res.redirect(`https://${req.headers.host}${req.url}`);
        }
        next();
    });
}

/* =====================================================
   CORS
===================================================== */

app.use(
    cors({
        origin: ["http://localhost:5173", "https://exr-apps-1.onrender.com"],
        credentials: true,
    })
);

/* =====================================================
   STRIPE WEBHOOK
===================================================== */

app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        if (!stripe) return res.status(400).send("Stripe not configured");

        try {
            const sig = req.headers["stripe-signature"];

            const event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );

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
            console.error("Stripe webhook error:", err.message);
            res.status(400).send("Webhook Error");
        }
    }
);

/* JSON BODY */
app.use(express.json({ limit: "10kb" }));

/* STATIC */
app.use("/uploads", express.static(path.resolve("uploads")));

/* =====================================================
   PUBLIC ROUTES
===================================================== */

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/homepage", homepageRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/seo", seoRoutes);
app.use("/api/coupons", couponPublicRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payments/khalti", khaltiRoutes);
app.use("/api/payments/esewa", esewaRoutes);

/* =====================================================
   PUBLIC STORE SETTINGS (FOR CHECKOUT)
===================================================== */

app.get("/api/settings", async (req, res) => {
    try {
        const settings = await Settings.getSingleton();

        if (!settings) {
            return res.json({
                codEnabled: true,
                stripeEnabled: false,
                esewaEnabled: false,
                khaltiEnabled: false,
                shippingInsideValley: 150,
                shippingOutsideValley: 300,
            });
        }

        res.json({
            codEnabled: settings.codEnabled ?? true,
            stripeEnabled: settings.stripeEnabled ?? false,
            esewaEnabled: settings.esewaEnabled ?? false,
            khaltiEnabled: settings.khaltiEnabled ?? false,
            shippingInsideValley: settings.shippingInsideValley ?? 150,
            shippingOutsideValley: settings.shippingOutsideValley ?? 300,
        });

    } catch (err) {
        console.error("PUBLIC SETTINGS ERROR:", err);
        res.status(500).json({ error: "Failed to load settings" });
    }
});

/* =====================================================
   ADMIN ROUTES
===================================================== */

app.use("/api/admin/refresh", adminRefreshRoutes);
app.use("/api/admin/logs", adminAuth("admin"), adminLogRoutes);
app.use("/api/admin/dashboard", adminAuth("admin"), adminDashboardRoutes);
app.use("/api/admin/analytics", adminAuth("admin"), adminAnalyticsRoutes);
app.use("/api/admin/stores", adminAuth("owner"), adminStoreRoutes);
app.use("/api/admin/products", adminAuth("editor"), adminProductRoutes);
app.use("/api/admin/orders", adminAuth("support"), adminOrderRoutes);
app.use("/api/admin/wallet", adminAuth("finance"), adminWalletRoutes);
app.use("/api/admin/coupons", adminAuth("editor"), adminCouponRoutes);
app.use("/api/admin/settings", adminAuth("owner"), adminSettingsRoutes);
app.use("/api/admin/media", adminAuth("editor"), mediaRoutes);
app.use("/api/admin/upload", adminAuth("editor"), adminUploadRoutes);
app.use("/api/admin/users", adminAuth("super-admin"), adminUserRoutes);
app.use("/api/admin/team", adminAuth("owner"), adminTeamRoutes);

/* =====================================================
   ADMIN LOGIN
===================================================== */

app.post("/api/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;

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
        console.error("Login error:", err);
        res.status(500).json({ error: "Login failed" });
    }
});

/* =====================================================
   ADMIN VERIFY
===================================================== */

app.get("/api/admin/verify", (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ valid: false });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.ADMIN_JWT_SECRET
        );

        res.json({
            valid: true,
            adminId: decoded.adminId,
            role: decoded.role,
        });
    } catch {
        res.status(401).json({ valid: false });
    }
});

/* =====================================================
   404
===================================================== */

app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

/* =====================================================
   GLOBAL ERROR
===================================================== */

app.use((err, _req, res, _next) => {
    console.error("Global error:", err.message);

    res.status(500).json({
        error:
            process.env.NODE_ENV === "production"
                ? "Something went wrong"
                : err.message,
    });
});

/* =====================================================
   START SERVER
===================================================== */

const PORT = process.env.PORT || 4242;

app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
});