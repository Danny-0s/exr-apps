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
====================================================== */
const adminAuth = (requiredRole = "admin") => {
    return async (req, res, next) => {
        try {
            /* ===============================
               CHECK AUTH HEADER
            =============================== */
            const authHeader = req.headers.authorization;

            if (!authHeader?.startsWith("Bearer ")) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
            }

            const token = authHeader.split(" ")[1];

            /* ===============================
               VERIFY TOKEN
            =============================== */
            let decoded;

            try {
                decoded = jwt.verify(
                    token,
                    process.env.ADMIN_JWT_SECRET
                );
            } catch (error) {
                if (error.name === "TokenExpiredError") {
                    return res.status(401).json({
                        success: false,
                        message: "Token expired",
                    });
                }

                return res.status(401).json({
                    success: false,
                    message: "Invalid token",
                });
            }

            if (!decoded?.adminId) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token payload",
                });
            }

            /* ===============================
               FETCH ADMIN
            =============================== */
            const admin = await Admin.findOne({
                _id: decoded.adminId,
                isActive: true,
            }).select("_id name email role isActive");

            if (!admin) {
                return res.status(401).json({
                    success: false,
                    message: "Admin not found or inactive",
                });
            }

            /* ===============================
               ROLE CHECK
            =============================== */
            const userRoleLevel = roleLevels[admin.role] || 0;
            const requiredRoleLevel = roleLevels[requiredRole] || 0;

            if (userRoleLevel < requiredRoleLevel) {
                return res.status(403).json({
                    success: false,
                    message: "Insufficient permissions",
                });
            }

            /* ===============================
               ATTACH ADMIN TO REQUEST
            =============================== */
            req.admin = {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            };

            next();

        } catch (err) {
            console.error("AdminAuth Error:", err.message);

            return res.status(500).json({
                success: false,
                message: "Server authentication error",
            });
        }
    };
};

export default adminAuth;