import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        /* ================= BASIC INFO ================= */
        title: {
            type: String,
            required: [true, "Product title is required"],
            trim: true,
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        category: {
            type: String,
            required: [true, "Category is required"],
            lowercase: true,
            trim: true,
        },

        /* ================= PRICING ================= */
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"],
        },

        /* ================= MEDIA ================= */
        images: {
            type: [String],
            required: [true, "At least one image is required"],
            validate: {
                validator: arr => Array.isArray(arr) && arr.length > 0,
                message: "At least one image is required",
            },
        },

        /* ================= VARIANTS ================= */
        sizes: {
            type: [String],
            default: [],
        },

        /* ================= INVENTORY ================= */
        stock: {
            type: Number,
            required: [true, "Stock is required"],
            min: [0, "Stock cannot be negative"],
        },

        /* ================= VISIBILITY ================= */
        showInShop: {
            type: Boolean,
            default: true,
        },

        heroVisible: {
            type: Boolean,
            default: false,
        },

        /* ================= FLAGS ================= */
        featured: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        /* ================= ❤️ WAITLIST ================= */
        waitlist: [
            {
                email: {
                    type: String,
                    lowercase: true,
                    trim: true,
                    match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        waitlistCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

/* ======================================================
   AUTO CLEAR WAITLIST ONLY WHEN RESTOCKED (0 → >0)
====================================================== */
productSchema.pre("save", async function () {
    if (!this.isModified("stock")) {
        this.waitlistCount = this.waitlist.length;
        return;
    }

    const existingProduct = await this.constructor
        .findById(this._id)
        .select("stock");

    // Clear waitlist ONLY if previously out of stock
    if (existingProduct && existingProduct.stock === 0 && this.stock > 0) {
        this.waitlist = [];
    }

    this.waitlistCount = this.waitlist.length;
});

/* ======================================================
   PREVENT DUPLICATE WAITLIST EMAILS
====================================================== */
productSchema.methods.addToWaitlist = function (email) {
    const normalizedEmail = email.toLowerCase().trim();

    const exists = this.waitlist.some(
        w => w.email === normalizedEmail
    );

    if (exists) return false;

    this.waitlist.push({ email: normalizedEmail });
    this.waitlistCount = this.waitlist.length;

    return true;
};

export default mongoose.model("Product", productSchema);