import express from "express";
import User from "../models/User.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

/* ===================================================
   GET ALL PUBLIC USERS
=================================================== */
router.get("/", adminAuth("super_admin"), async (_req, res) => {
    try {
        const users = await User.find({
            role: {
                $nin: [
                    "super_admin",
                    "owner",
                    "admin",
                    "editor",
                    "support",
                    "finance",
                ],
            },
        })
            .select("-password")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            users,
        });
    } catch (err) {
        console.error("FETCH USERS ERROR:", err);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

/* ===================================================
   BAN / UNBAN USER
=================================================== */
router.patch("/:id/ban", adminAuth("super_admin"), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            success: true,
            isActive: user.isActive,
        });
    } catch (err) {
        console.error("BAN USER ERROR:", err);
        res.status(500).json({ error: "Failed to update user status" });
    }
});

/* ===================================================
   UPDATE WALLET
=================================================== */
router.patch("/:id/wallet", adminAuth("super_admin"), async (req, res) => {
    try {
        const { amount } = req.body;

        if (typeof amount !== "number") {
            return res.status(400).json({ error: "Invalid amount" });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.walletBalance = (user.walletBalance || 0) + amount;
        await user.save();

        res.json({
            success: true,
            user,
        });
    } catch (err) {
        console.error("UPDATE WALLET ERROR:", err);
        res.status(500).json({ error: "Failed to update wallet" });
    }
});

/* ===================================================
   DELETE USER
=================================================== */
router.delete("/:id", adminAuth("super_admin"), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await user.deleteOne();

        res.json({
            success: true,
            message: "User deleted",
        });
    } catch (err) {
        console.error("DELETE USER ERROR:", err);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

export default router;