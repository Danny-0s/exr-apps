import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

/* =========================================
   REGISTER USER
   POST /api/auth/register
========================================= */
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        /* VALIDATION */
        if (!name || !email || !password) {
            return res.status(400).json({
                error: "All fields are required",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters",
            });
        }

        /* CHECK EXISTING */
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                error: "Email already registered",
            });
        }

        /* HASH PASSWORD */
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        /* CREATE USER */
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        /* GENERATE TOKEN */
        const token = jwt.sign(
            { userId: user._id },
            process.env.USER_JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                walletBalance: user.walletBalance,
            },
        });
    } catch (err) {
        console.error("REGISTER ERROR:", err);
        res.status(500).json({
            error: "Registration failed",
        });
    }
});

/* =========================================
   LOGIN USER
   POST /api/auth/login
========================================= */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email and password required",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                error: "Invalid credentials",
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                error: "Invalid credentials",
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.USER_JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                walletBalance: user.walletBalance,
            },
        });
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({
            error: "Login failed",
        });
    }
});

/* =========================================
   GET PROFILE (WALLET SUPPORT)
   GET /api/auth/profile
========================================= */
router.get("/profile", userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                error: "User not found",
            });
        }

        res.json(user);
    } catch (err) {
        console.error("PROFILE ERROR:", err);
        res.status(500).json({
            error: "Failed to fetch profile",
        });
    }
});

export default router;
