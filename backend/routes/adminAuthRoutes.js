import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/* ===============================
   GENERATE ADMIN TOKEN
================================ */
const generateAdminToken = (adminId) =>
    jwt.sign({ adminId }, process.env.ADMIN_JWT_SECRET, {
        expiresIn: "7d",
    });

/* ===============================
   ADMIN LOGIN
================================ */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await User.findOne({ email });

        if (!admin || admin.role !== "super-admin") {
            return res.status(401).json({ error: "Not authorized" });
        }

        const match = await bcrypt.compare(password, admin.password);
        if (!match) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        res.json({
            success: true,
            token: generateAdminToken(admin._id),
        });

    } catch (err) {
        res.status(500).json({ error: "Admin login failed" });
    }
});

/* ===============================
   VERIFY ADMIN
================================ */
router.get("/verify", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "No token" });

        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

        res.json({ success: true, adminId: decoded.adminId });

    } catch {
        res.status(401).json({ error: "Unauthorized" });
    }
});

export default router;