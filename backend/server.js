import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";

import connectDB from "./config/db.js";
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

/* 🔥 NEW ANALYTICS ROUTE */
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";

/* ================= MODELS ================= */
import Order from "./models/Order.js";
import Settings from "./models/Settings.js";
import Admin from "./models/Admin.js";

const app = express();
app.set("trust proxy", 1);

connectDB();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* =====================================================
   🔐 GLOBAL SECURITY
===================================================== */

app.disable("x-powered-by");

app.use(
    helmet({
        crossOriginResourcePolicy: false,
    })
);

app.use(hpp());

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(globalLimiter);

/* ================= ADMIN LOGIN RATE LIMIT ================= */

const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
});

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

        try {
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

/* ================= BODY PARSERS ================= */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ================= STATIC FILES ================= */

app.use("/uploads", express.static(path.resolve("uploads")));

/* ================= PUBLIC SETTINGS ================= */

app.get("/api/settings", async (_req, res) => {
    try {
        const settings = await Settings.getSingleton();
        res.json(settings);
    } catch {
        res.status(500).json({ error: "Failed to load settings" });
    }
});

/* ================= PUBLIC ROUTES ================= */

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

/* ================= ADMIN VERIFY ================= */

app.get("/api/admin/verify", adminAuth("admin"), (req, res) => {
    res.json({
        success: true,
        admin: {
            id: req.admin._id,
            role: req.admin.role,
        },
    });
});

/* ================= ADMIN ROUTES ================= */

app.use("/api/admin/refresh", adminRefreshRoutes);
app.use("/api/admin/logs", adminAuth("admin"), adminLogRoutes);
app.use("/api/admin/dashboard", adminAuth("admin"), adminDashboardRoutes);

/* 🔥 NEW ANALYTICS ROUTE */
app.use("/api/admin/analytics", adminAuth("admin"), adminAnalyticsRoutes);

app.use("/api/admin/products", adminAuth("editor"), adminProductRoutes);
app.use("/api/admin/orders", adminAuth("support"), adminOrderRoutes);
app.use("/api/admin/wallet", adminAuth("finance"), adminWalletRoutes);
app.use("/api/admin/coupons", adminAuth("editor"), adminCouponRoutes);
app.use("/api/admin/settings", adminAuth("owner"), adminSettingsRoutes);
app.use("/api/admin/media", adminAuth("editor"), mediaRoutes);
app.use("/api/admin/upload", adminAuth("editor"), adminUploadRoutes);
app.use("/api/admin/users", adminAuth("owner"), adminUserRoutes);
app.use("/api/admin/team", adminAuth("owner"), adminTeamRoutes);

/* ================= ADMIN LOGIN ================= */

app.post("/api/admin/login", adminLoginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({
            email: email.toLowerCase(),
        });

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

    } catch {
        res.status(500).json({ error: "Login failed" });
    }
});

/* ================= 404 ================= */

app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

/* ================= GLOBAL ERROR ================= */

app.use((err, _req, res, _next) => {
    console.error("Global error:", err.message);

    res.status(500).json({
        error:
            process.env.NODE_ENV === "production"
                ? "Something went wrong"
                : err.message,
    });
});

/* ================= START ================= */

const PORT = process.env.PORT || 4242;

app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
});