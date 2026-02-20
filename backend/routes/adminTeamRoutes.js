import express from "express";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import AdminLog from "../models/AdminLog.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

/* ======================================================
   ROLE POWER SYSTEM
   Higher number = more power
====================================================== */
const roleLevels = {
    super_admin: 6,
    owner: 5,
    admin: 4,
    editor: 3,
    support: 2,
    finance: 1,
};

const getRoleLevel = (role) => roleLevels[role] || 0;

/* ======================================================
   HELPER: CREATE AUDIT LOG
====================================================== */
const createLog = async ({
    adminId,
    action,
    targetId = null,
    details = "",
    ip,
}) => {
    try {
        await AdminLog.create({
            admin: adminId,
            action,
            targetType: "admin",
            targetId,
            details,
            ipAddress: ip,
        });
    } catch (err) {
        console.error("ADMIN LOG ERROR:", err);
    }
};

/* ======================================================
   GET ALL TEAM MEMBERS
   GET /api/admin/team
   Owner and above
====================================================== */
router.get("/", adminAuth("owner"), async (req, res) => {
    try {
        const admins = await Admin.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            team: admins,
        });
    } catch (err) {
        console.error("GET TEAM ERROR:", err);
        res.status(500).json({ error: "Failed to fetch team" });
    }
});

/* ======================================================
   ADD TEAM MEMBER
   POST /api/admin/team
====================================================== */
router.post("/", adminAuth("owner"), async (req, res) => {
    try {
        const { name, email, password, role = "editor" } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: "All fields required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existing = await Admin.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(400).json({
                error: "Email already exists",
            });
        }

        const creatorLevel = getRoleLevel(req.admin.role);
        const newRoleLevel = getRoleLevel(role);

        if (newRoleLevel >= creatorLevel) {
            return res.status(403).json({
                error:
                    "You cannot create an admin with equal or higher role than yourself",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newAdmin = await Admin.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role,
            isActive: true,
        });

        await createLog({
            adminId: req.admin.id,
            action: "Created team member",
            targetId: newAdmin._id,
            details: `Created ${newAdmin.email} with role ${newAdmin.role}`,
            ip: req.ip,
        });

        res.status(201).json({
            success: true,
            message: "Team member added",
            admin: {
                id: newAdmin._id,
                name: newAdmin.name,
                email: newAdmin.email,
                role: newAdmin.role,
                isActive: newAdmin.isActive,
            },
        });
    } catch (err) {
        console.error("ADD TEAM ERROR:", err);
        res.status(500).json({ error: "Failed to add team member" });
    }
});

/* ======================================================
   UPDATE TEAM MEMBER
   PUT /api/admin/team/:id
====================================================== */
router.put("/:id", adminAuth("owner"), async (req, res) => {
    try {
        const { role, isActive } = req.body;

        const targetAdmin = await Admin.findById(req.params.id);
        if (!targetAdmin) {
            return res.status(404).json({
                error: "Admin not found",
            });
        }

        const currentAdminLevel = getRoleLevel(req.admin.role);
        const targetLevel = getRoleLevel(targetAdmin.role);

        // ❌ Cannot edit yourself
        if (targetAdmin._id.toString() === req.admin.id) {
            return res.status(400).json({
                error: "You cannot modify your own account",
            });
        }

        // ❌ Cannot edit equal or higher role
        if (targetLevel >= currentAdminLevel) {
            return res.status(403).json({
                error:
                    "You cannot modify an admin with equal or higher role",
            });
        }

        let changeDetails = [];

        if (role && role !== targetAdmin.role) {
            const newRoleLevel = getRoleLevel(role);

            if (newRoleLevel >= currentAdminLevel) {
                return res.status(403).json({
                    error:
                        "You cannot promote admin to equal or higher role than yourself",
                });
            }

            changeDetails.push(
                `Role changed from ${targetAdmin.role} to ${role}`
            );
            targetAdmin.role = role;
        }

        if (typeof isActive === "boolean" && isActive !== targetAdmin.isActive) {
            changeDetails.push(
                `Status changed to ${isActive ? "ACTIVE" : "DISABLED"}`
            );
            targetAdmin.isActive = isActive;
        }

        await targetAdmin.save();

        if (changeDetails.length > 0) {
            await createLog({
                adminId: req.admin.id,
                action: "Updated team member",
                targetId: targetAdmin._id,
                details: changeDetails.join(" | "),
                ip: req.ip,
            });
        }

        res.json({
            success: true,
            message: "Admin updated",
        });
    } catch (err) {
        console.error("UPDATE TEAM ERROR:", err);
        res.status(500).json({ error: "Failed to update admin" });
    }
});

/* ======================================================
   DELETE TEAM MEMBER
   DELETE /api/admin/team/:id
====================================================== */
router.delete("/:id", adminAuth("owner"), async (req, res) => {
    try {
        const targetAdmin = await Admin.findById(req.params.id);

        if (!targetAdmin) {
            return res.status(404).json({
                error: "Admin not found",
            });
        }

        const currentAdminLevel = getRoleLevel(req.admin.role);
        const targetLevel = getRoleLevel(targetAdmin.role);

        // ❌ Cannot delete yourself
        if (targetAdmin._id.toString() === req.admin.id) {
            return res.status(400).json({
                error: "You cannot delete yourself",
            });
        }

        // ❌ Cannot delete equal or higher role
        if (targetLevel >= currentAdminLevel) {
            return res.status(403).json({
                error:
                    "You cannot delete an admin with equal or higher role",
            });
        }

        await Admin.findByIdAndDelete(req.params.id);

        await createLog({
            adminId: req.admin.id,
            action: "Deleted team member",
            targetId: targetAdmin._id,
            details: `Deleted ${targetAdmin.email}`,
            ip: req.ip,
        });

        res.json({
            success: true,
            message: "Team member removed",
        });
    } catch (err) {
        console.error("DELETE TEAM ERROR:", err);
        res.status(500).json({ error: "Failed to remove admin" });
    }
});

export default router;