import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

/* ======================================================
   GOOGLE CLIENT
====================================================== */
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* ======================================================
   HELPER: GENERATE TOKEN
====================================================== */
const generateToken = (userId) =>
    jwt.sign({ userId }, process.env.USER_JWT_SECRET, {
        expiresIn: "7d",
    });

/* ======================================================
   REGISTER
====================================================== */
router.post("/register", async (req, res) => {
    try {
        let { name, email, password } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ error: "All fields are required" });

        name = name.trim();
        email = email.trim().toLowerCase();

        if (password.length < 6)
            return res.status(400).json({
                error: "Password must be at least 6 characters",
            });

        const existing = await User.findOne({ email });
        if (existing)
            return res.status(400).json({
                error: "Email already registered",
            });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        res.status(201).json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                walletBalance: user.walletBalance,
                isActive: user.isActive,
            },
        });
    } catch (err) {
        console.error("REGISTER ERROR:", err);
        res.status(500).json({ error: "Registration failed" });
    }
});

/* ======================================================
   LOGIN
====================================================== */
router.post("/login", async (req, res) => {
    try {
        let { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({
                error: "Email and password required",
            });

        email = email.trim().toLowerCase();

        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({
                error: "Invalid credentials",
            });

        if (!user.isActive)
            return res.status(403).json({
                error: "Account blocked",
            });

        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.status(400).json({
                error: "Invalid credentials",
            });

        res.json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                walletBalance: user.walletBalance,
                isActive: user.isActive,
            },
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({ error: "Login failed" });
    }
});

/* ======================================================
   GOOGLE LOGIN
   POST /api/auth/google
====================================================== */
router.post("/google", async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential)
            return res.status(400).json({
                error: "Google credential missing",
            });

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name } = payload;

        let user = await User.findOne({ email });

        // If user doesn't exist → create automatically
        if (!user) {
            user = await User.create({
                name,
                email,
                password: "google-auth",
                walletBalance: 0,
                isActive: true,
            });
        }

        // If blocked
        if (!user.isActive) {
            return res.status(403).json({
                error: "Account blocked",
            });
        }

        res.json({
            success: true,
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                walletBalance: user.walletBalance,
                isActive: user.isActive,
            },
        });
    } catch (err) {
        console.error("GOOGLE LOGIN ERROR:", err);
        res.status(401).json({
            error: "Google authentication failed",
        });
    }
});

/* ======================================================
   GET PROFILE
====================================================== */
router.get("/profile", userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user)
            return res.status(404).json({ error: "User not found" });

        res.json(user);
    } catch (err) {
        console.error("PROFILE ERROR:", err);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

/* ======================================================
   UPDATE PROFILE
====================================================== */
router.put("/profile", userAuth, async (req, res) => {
    try {
        const { name, phone, address } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user)
            return res.status(404).json({ error: "User not found" });

        user.name = name?.trim() || user.name;
        user.phone = phone?.trim() || "";
        user.address = address?.trim() || "";

        await user.save();

        res.json({
            success: true,
            message: "Profile updated",
            user,
        });
    } catch (err) {
        console.error("UPDATE PROFILE ERROR:", err);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

/* ======================================================
   CHANGE PASSWORD
====================================================== */
router.put("/change-password", userAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword)
            return res.status(400).json({
                error: "All fields required",
            });

        if (newPassword.length < 6)
            return res.status(400).json({
                error: "New password must be at least 6 characters",
            });

        const user = await User.findById(req.user.userId);

        const match = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!match)
            return res.status(400).json({
                error: "Current password incorrect",
            });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({
            success: true,
            message: "Password updated successfully",
        });
    } catch (err) {
        console.error("CHANGE PASSWORD ERROR:", err);
        res.status(500).json({
            error: "Failed to change password",
        });
    }
});

export default router;