import jwt from "jsonwebtoken";
import mongoose from "mongoose";

/* =========================================
   STRICT USER AUTH (Protected Routes)
========================================= */
export const userAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Not authorized",
        });
    }

    try {
        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.USER_JWT_SECRET
        );

        // 🔥 Ensure userId always exists
        if (!decoded.userId) {
            return res.status(401).json({
                error: "Invalid token payload",
            });
        }

        // 🔥 Normalize ObjectId safely
        req.user = {
            userId: mongoose.Types.ObjectId.isValid(decoded.userId)
                ? new mongoose.Types.ObjectId(decoded.userId)
                : decoded.userId,
        };

        next();
    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired token",
        });
    }
};

/* =========================================
   OPTIONAL USER AUTH (Guest Allowed)
========================================= */
export const userAuthOptional = (req, _res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        req.user = null;
        return next();
    }

    try {
        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.USER_JWT_SECRET
        );

        if (decoded.userId && mongoose.Types.ObjectId.isValid(decoded.userId)) {
            req.user = {
                userId: new mongoose.Types.ObjectId(decoded.userId),
            };
        } else {
            req.user = null;
        }

    } catch {
        req.user = null;
    }

    next();
};