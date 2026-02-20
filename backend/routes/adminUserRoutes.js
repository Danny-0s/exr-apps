import express from "express";
import User from "../models/user.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

/* ===================================================
   ROLE POWER SYSTEM
=================================================== */
const roleLevels = {
    super_admin: 6,
    owner: 5,
    admin: 4,
    editor: 3,
    support: 2,
    finance: 1,
};

const getRoleLevel = (role) => roleLevels[role] || 0;

/* ===================================================
   GET ALL USERS
   Owner and above only
=================================================== */
router.get("/", adminAuth("owner"), async (_req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            users,
        });
    } catch (err) {
        console.error("FETCH USERS ERROR:", err);
        res.status(500).json({
            error: "Failed to fetch users",
        });
    }
});

/* ===================================================
   TOGGLE USER ACTIVE / BLOCK
   Only owner and above
=================================================== */
router.patch("/:id/toggle", adminAuth("owner"), async (req, res) => {
    try {
        const currentAdminLevel = getRoleLevel(req.admin.role);

        // Extra safety (should already be owner+ from middleware)
        if (currentAdminLevel < roleLevels.owner) {
            return res.status(403).json({
                error: "Insufficient permissions",
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                error: "User not found",
            });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            success: true,
            isActive: user.isActive,
        });
    } catch (err) {
        console.error("TOGGLE USER ERROR:", err);
        res.status(500).json({
            error: "Failed to update user",
        });
    }
});

export default router;