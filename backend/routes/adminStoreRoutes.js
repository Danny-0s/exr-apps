import express from "express";
import Store from "../models/Store.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

/* =========================================
   GET ALL STORES (ADMIN)
========================================= */
router.get("/", adminAuth(), async (req, res) => {
    try {
        const stores = await Store.find({ isActive: true })
            .sort({ createdAt: -1 })
            .select("_id name slug");

        res.json({
            success: true,
            stores,
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch stores" });
    }
});

export default router;