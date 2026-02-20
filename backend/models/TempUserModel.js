import mongoose from "mongoose";

/* =========================================
   WALLET TRANSACTION SCHEMA
========================================= */
const walletTransactionSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["refund", "purchase", "admin_credit"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        relatedOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
        },
        note: {
            type: String,
            default: "",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

/* =========================================
   ADMIN ACTIVITY LOG SCHEMA
========================================= */
const activityLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true,
        },
        details: {
            type: String,
            default: "",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

/* =========================================
   USER SCHEMA
========================================= */
const userSchema = new mongoose.Schema(
    {
        /* ===============================
           BASIC INFO
        ================================ */
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        /* ===============================
           ROLE SYSTEM
        ================================ */
        role: {
            type: String,
            enum: [
                "customer",
                "admin",
                "editor",
                "support",
                "finance",
                "owner",
            ],
            default: "customer",
        },

        lastLogin: {
            type: Date,
            default: null,
        },

        activityLog: [activityLogSchema],

        /* ===============================
           PHONE VERIFICATION
        ================================ */
        phone: {
            type: String,
            default: "",
        },

        phoneVerified: {
            type: Boolean,
            default: false,
        },

        phoneOTP: {
            type: String,
            default: null,
        },

        phoneOTPExpires: {
            type: Date,
            default: null,
        },

        /* ===============================
           WALLET
        ================================ */
        walletBalance: {
            type: Number,
            default: 0,
            min: 0,
        },

        walletTransactions: [walletTransactionSchema],

        /* ===============================
           WISHLIST
        ================================ */
        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],

        /* ===============================
           USER COUPONS
        ================================ */
        coupons: [
            {
                code: String,
                discount: Number,
                expiresAt: Date,
                isUsed: {
                    type: Boolean,
                    default: false,
                },
            },
        ],

        /* ===============================
           ACCOUNT CONTROL
        ================================ */
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

/* =========================================
   HELPER METHODS
========================================= */

/* ➕ Credit wallet */
userSchema.methods.creditWallet = function (
    amount,
    orderId = null,
    note = ""
) {
    this.walletBalance += amount;

    this.walletTransactions.push({
        type: "refund",
        amount,
        relatedOrder: orderId,
        note,
    });
};

/* ➖ Debit wallet */
userSchema.methods.debitWallet = function (
    amount,
    orderId = null,
    note = ""
) {
    if (this.walletBalance < amount) {
        throw new Error("Insufficient wallet balance");
    }

    this.walletBalance -= amount;

    this.walletTransactions.push({
        type: "purchase",
        amount,
        relatedOrder: orderId,
        note,
    });
};

/* 📝 Add Activity Log */
userSchema.methods.logActivity = function (action, details = "") {
    this.activityLog.push({
        action,
        details,
    });
};

/* =========================================
   SAFE MODEL EXPORT (NO OVERWRITE ERROR)
========================================= */
const User =
    mongoose.models.User ||
    mongoose.model("User", userSchema);

export default User;