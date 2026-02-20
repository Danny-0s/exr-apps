import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

/* ======================================================
   ROLE LEVEL SYSTEM
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

/* ======================================================
   ADMIN AUTH MIDDLEWARE
   Usage:
   adminAuth() → default admin access
   adminAuth("owner") → owner only
   adminAuth("editor") → editor and above
====================================================== */
const adminAuth = (requiredRole = "admin") => {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;

            /* ===============================
               CHECK TOKEN EXISTS
            ================================ */
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({
                    error: "Authentication required",
                });
            }

            const token = authHeader.split(" ")[1];

            /* ===============================
               VERIFY TOKEN
            ================================ */
            const decoded = jwt.verify(
                token,
                process.env.ADMIN_JWT_SECRET
            );

            if (!decoded.adminId) {
                return res.status(401).json({
                    error: "Invalid token structure",
                });
            }

            /* ===============================
               FETCH ADMIN FROM DATABASE
            ================================ */
            const admin = await Admin.findById(decoded.adminId);

            if (!admin) {
                return res.status(401).json({
                    error: "Admin not found",
                });
            }

            if (!admin.isActive) {
                return res.status(403).json({
                    error: "Admin account disabled",
                });
            }

            /* ===============================
               CHECK ROLE EXISTS
            ================================ */
            const userRoleLevel = roleLevels[admin.role] || 0;
            const requiredRoleLevel = roleLevels[requiredRole] || 0;

            if (userRoleLevel < requiredRoleLevel) {
                return res.status(403).json({
                    error: "Insufficient permissions",
                });
            }

            /* ===============================
               ATTACH ADMIN TO REQUEST
            ================================ */
            req.admin = {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            };

            next();

        } catch (err) {
            return res.status(401).json({
                error: "Token expired or invalid",
            });
        }
    };
};

export default adminAuth;