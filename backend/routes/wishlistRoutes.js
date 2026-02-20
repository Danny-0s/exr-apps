import express from "express";
<<<<<<< HEAD
import User from "../models/User.js";
=======
import User from "../models/UserModel.js";
>>>>>>> 4462b3f
import Product from "../models/Product.js";
import { userAuth } from "../middleware/userAuth.js";

const router = express.Router();

/* ===================================================
   GET USER WISHLIST
=================================================== */
router.get("/", userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .populate("wishlist");

        if (!user) {
            return res.status(404).json({
                error: "User not found",
            });
        }

        return res.json({
            success: true,
            wishlist: user.wishlist || [],
        });

    } catch (err) {
        console.error("Wishlist fetch error:", err);
        return res.status(500).json({
            error: "Failed to load wishlist",
        });
    }
});

/* ===================================================
   ADD TO WISHLIST
=================================================== */
router.post("/:productId", userAuth, async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                error: "Product not found",
            });
        }

        const user = await User.findById(req.user.userId);

        if (!user.wishlist.includes(productId)) {
            user.wishlist.push(productId);
            await user.save();
        }

        return res.json({
            success: true,
            message: "Added to wishlist",
        });

    } catch (err) {
        console.error("Wishlist add error:", err);
        return res.status(500).json({
            error: "Failed to add to wishlist",
        });
    }
});

/* ===================================================
   REMOVE FROM WISHLIST
=================================================== */
router.delete("/:productId", userAuth, async (req, res) => {
    try {
        const { productId } = req.params;

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                error: "User not found",
            });
        }

        user.wishlist = user.wishlist.filter(
            id => id.toString() !== productId
        );

        await user.save();

        return res.json({
            success: true,
            message: "Removed from wishlist",
        });

    } catch (err) {
        console.error("Wishlist remove error:", err);
        return res.status(500).json({
            error: "Failed to remove from wishlist",
        });
    }
});

export default router;