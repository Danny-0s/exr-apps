import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// ===============================
// 🔐 Protect Routes Middleware
// ===============================
export const protect = async (req, res, next) => {
    try {
        let token;

        // 1️⃣ Check Authorization Header
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        // 2️⃣ If No Token
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized. No token provided.",
            });
        }

        // 3️⃣ Verify Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4️⃣ Find User (without password)
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found.",
            });
        }

        // 5️⃣ Attach user to request
        req.user = user;

        next();
    } catch (error) {
        console.error("Auth Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Not authorized. Token invalid or expired.",
        });
    }
};

// ===============================
// 👑 Admin Middleware
// ===============================
export const admin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Not authorized. Please login.",
        });
    }

    if (!req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admins only.",
        });
    }

    next();
};