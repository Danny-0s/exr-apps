import express from "express";
import Product from "../models/Product.js";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

/* =====================================================
   GET ALL PRODUCTS (ADMIN)
===================================================== */
router.get("/", adminAuth("editor"), async (_req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        return res.json(products);
    } catch (err) {
        console.error("ADMIN FETCH PRODUCTS ERROR:", err);
        return res.status(500).json({
            error: "Failed to fetch products",
        });
    }
});

/* =====================================================
   CREATE PRODUCT (ADMIN)
===================================================== */
router.post(
    "/",
    adminAuth("editor"),
    (req, res, next) => {
        upload.array("images", 6)(req, res, err => {
            if (err) {
                console.error("UPLOAD ERROR:", err);
                return res.status(400).json({
                    error: err.message || "Image upload failed",
                });
            }
            next();
        });
    },
    async (req, res) => {
        try {
            const {
                title,
                category,
                price,
                stock,
                featured,
                sizes,
            } = req.body;

            /* ================= VALIDATION ================= */

            if (!title || !category || !price || stock === undefined) {
                return res.status(400).json({
                    error: "Title, category, price and stock are required",
                });
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    error: "At least one image is required",
                });
            }

            let parsedSizes = [];

            if (sizes) {
                try {
                    parsedSizes = JSON.parse(sizes);
                    if (!Array.isArray(parsedSizes)) {
                        return res.status(400).json({
                            error: "Sizes must be an array",
                        });
                    }
                } catch {
                    return res.status(400).json({
                        error: "Invalid sizes format",
                    });
                }
            }

            /* ================= BUILD IMAGE PATHS ================= */

            const images = req.files.map(
                file => `/uploads/${file.filename}`
            );

            /* ================= CREATE PRODUCT ================= */

            const product = await Product.create({
                title: title.trim(),
                category: category.toLowerCase().trim(),
                price: Number(price),
                stock: Number(stock),
                featured: featured === "true" || featured === true,
                sizes: parsedSizes,
                images,
                description: "",
                isActive: true,
            });

            return res.status(201).json(product);

        } catch (err) {
            console.error("ADMIN CREATE PRODUCT ERROR:", err);
            return res.status(500).json({
                error: "Failed to create product",
            });
        }
    }
);

/* =====================================================
   UPDATE STOCK (ADMIN)
===================================================== */
router.patch("/:id/stock", adminAuth("editor"), async (req, res) => {
    try {
        const { stock } = req.body;

        if (stock === undefined || Number(stock) < 0) {
            return res.status(400).json({
                error: "Invalid stock value",
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                error: "Product not found",
            });
        }

        product.stock = Number(stock);
        await product.save();

        return res.json(product);

    } catch (err) {
        console.error("UPDATE STOCK ERROR:", err);
        return res.status(500).json({
            error: "Failed to update stock",
        });
    }
});

/* =====================================================
   DELETE PRODUCT (ADMIN)
===================================================== */
router.delete("/:id", adminAuth("editor"), async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                error: "Product not found",
            });
        }

        return res.json({ success: true });

    } catch (err) {
        console.error("DELETE PRODUCT ERROR:", err);
        return res.status(500).json({
            error: "Failed to delete product",
        });
    }
});

export default router;