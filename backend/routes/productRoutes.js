import express from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

/* ======================================================
   GET ALL PRODUCTS (PUBLIC)
====================================================== */
router.get("/", async (_req, res) => {
    try {
        const products = await Product.find({
            isActive: true,
            showInShop: true,
        }).sort({ createdAt: -1 });

        res.json(products);
    } catch (err) {
        console.error("Fetch products error:", err);
        res.status(500).json({ message: "Failed to fetch products" });
    }
});

/* ======================================================
   GET SINGLE PRODUCT (PUBLIC)
====================================================== */
router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const product = await Product.findById(req.params.id);

        if (!product || !product.isActive) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(product);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

/* ======================================================
   WAITLIST JOIN (PUBLIC)
====================================================== */
router.post("/:id/waitlist", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const email = String(req.body.email || "").toLowerCase().trim();

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const added = product.addToWaitlist(email);

        if (!added) {
            return res.json({
                success: true,
                message: "Already on waitlist",
            });
        }

        await product.save();

        res.json({
            success: true,
            message: "Added to waitlist",
        });

    } catch (err) {
        console.error("Waitlist error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to join waitlist",
        });
    }
});

/* ======================================================
   GET WAITLIST (ADMIN ONLY)
====================================================== */
router.get("/:id/admin-waitlist", adminAuth("admin"), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const product = await Product.findById(req.params.id)
            .select("title waitlist waitlistCount");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.json({
            success: true,
            productId: product._id,
            title: product.title,
            count: product.waitlistCount,
            waitlist: product.waitlist,
        });

    } catch (err) {
        console.error("Admin waitlist fetch error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch waitlist",
        });
    }
});

/* ======================================================
   CREATE PRODUCT (ADMIN)
====================================================== */
router.post(
    "/",
    adminAuth("admin"),
    upload.array("images", 6),
    async (req, res) => {
        try {
            const {
                title,
                description,
                category,
                price,
                stock,
                featured,
                sizes,
                showInShop,
                heroVisible,
            } = req.body;

            if (!title || !price || stock === undefined) {
                return res.status(400).json({
                    message: "Title, price, and stock are required",
                });
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    message: "At least one image is required",
                });
            }

            const images = req.files.map(
                file => `/uploads/${file.filename}`
            );

            let parsedSizes = [];
            try {
                parsedSizes = sizes ? JSON.parse(sizes) : [];
            } catch {
                return res.status(400).json({
                    message: "Invalid sizes format",
                });
            }

            const product = await Product.create({
                title,
                description,
                category,
                price: Number(price),
                stock: Number(stock),
                featured: featured === "true" || featured === true,
                showInShop: showInShop !== "false",
                heroVisible: heroVisible === "true",
                sizes: parsedSizes,
                images,
                isActive: true,
            });

            res.status(201).json(product);

        } catch (err) {
            console.error("Create product error:", err);
            res.status(500).json({ message: "Create failed" });
        }
    }
);

/* ======================================================
   UPDATE PRODUCT (ADMIN)
====================================================== */
router.put("/:id", adminAuth("admin"), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.json(updatedProduct);

    } catch (err) {
        console.error("Update product error:", err);
        res.status(500).json({ message: "Update failed" });
    }
});

/* ======================================================
   DELETE PRODUCT (ADMIN)
====================================================== */
router.delete("/:id", adminAuth("admin"), async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.json({ success: true });

    } catch (err) {
        console.error("Delete product error:", err);
        res.status(500).json({ message: "Delete failed" });
    }
});

export default router;