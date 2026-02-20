import express from "express";
import AdminLog from "../models/AdminLog.js";
import Admin from "../models/Admin.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

/* ======================================================
   GET ADMIN ACTIVITY LOGS
   GET /api/admin/logs
   Owner and super_admin only

   Query Params:
   ?page=1
   ?limit=20
   ?action=Created team member
   ?targetType=admin
   ?search=admin@email.com
====================================================== */
router.get("/", adminAuth("owner"), async (req, res) => {
    try {
        /* ===============================
           PAGINATION SAFE
        ================================ */
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;

        /* ===============================
           BUILD FILTER OBJECT
        ================================ */
        const filter = {};

        // Filter by action (case insensitive)
        if (req.query.action) {
            filter.action = {
                $regex: req.query.action,
                $options: "i",
            };
        }

        // Filter by target type
        if (req.query.targetType) {
            filter.targetType = req.query.targetType;
        }

        /* ===============================
           SEARCH BY ADMIN NAME OR EMAIL
        ================================ */
        if (req.query.search) {
            const searchValue = req.query.search.trim();

            if (searchValue.length > 0) {
                const admins = await Admin.find({
                    $or: [
                        { name: { $regex: searchValue, $options: "i" } },
                        { email: { $regex: searchValue, $options: "i" } },
                    ],
                }).select("_id");

                const adminIds = admins.map((a) => a._id);

                // If no matching admin → return empty result early
                if (adminIds.length === 0) {
                    return res.json({
                        success: true,
                        logs: [],
                        pagination: {
                            total: 0,
                            page,
                            pages: 1,
                        },
                    });
                }

                filter.admin = { $in: adminIds };
            }
        }

        /* ===============================
           FETCH LOGS
        ================================ */
        const logs = await AdminLog.find(filter)
            .populate("admin", "name email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // performance boost

        const total = await AdminLog.countDocuments(filter);

        res.json({
            success: true,
            logs,
            pagination: {
                total,
                page,
                pages: Math.max(Math.ceil(total / limit), 1),
            },
        });

    } catch (err) {
        console.error("FETCH ADMIN LOGS ERROR:", err);
        res.status(500).json({
            error: "Failed to fetch admin logs",
        });
    }
});

export default router;