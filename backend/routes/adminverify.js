import express from "express";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// Verify token
router.get("/", adminAuth("admin"), (req, res) => {
    res.json({
        success: true,
        admin: {
            id: req.admin._id,
            role: req.admin.role,
        },
    });
});

export default router;