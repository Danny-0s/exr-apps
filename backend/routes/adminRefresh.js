import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| ADMIN TOKEN REFRESH
|--------------------------------------------------------------------------
| Generates new access token using valid refresh token
|--------------------------------------------------------------------------
*/

router.post("/refresh", (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({
            error: "Refresh token missing",
        });
    }

    try {
        const decoded = jwt.verify(
            refreshToken,
            process.env.ADMIN_REFRESH_SECRET
        );

        // decoded must contain adminId + role
        if (!decoded.adminId || !decoded.role) {
            return res.status(403).json({
                error: "Invalid refresh token payload",
            });
        }

        // ✅ Issue NEW access token with SAME role
        const newAccessToken = jwt.sign(
            {
                adminId: decoded.adminId,
                role: decoded.role,
            },
            process.env.ADMIN_JWT_SECRET,
            { expiresIn: "15m" }
        );

        return res.json({
            success: true,
            accessToken: newAccessToken,
        });

    } catch (err) {
        return res.status(403).json({
            error: "Refresh token expired or invalid",
        });
    }
});

export default router;