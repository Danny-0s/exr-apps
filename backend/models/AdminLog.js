import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema(
    {
        /* ===============================
           WHO PERFORMED ACTION
        ================================ */
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            required: true,
            index: true,
        },

        /* ===============================
           ACTION DESCRIPTION
        ================================ */
        action: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        /* ===============================
           TARGET TYPE
        ================================ */
        targetType: {
            type: String,
            enum: [
                "admin",
                "product",
                "order",
                "coupon",
                "settings",
                "wallet",
                "login",
                "user",
                "other",
            ],
            default: "other",
        },

        /* ===============================
           TARGET DOCUMENT ID
        ================================ */
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },

        /* ===============================
           EXTRA DETAILS
        ================================ */
        details: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        /* ===============================
           IP ADDRESS
        ================================ */
        ipAddress: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

/* ===============================
   INDEXES (PERFORMANCE OPTIMIZED)
=============================== */
adminLogSchema.index({ createdAt: -1 });
adminLogSchema.index({ targetId: 1 });

/* ===============================
   SAFE MODEL EXPORT (PREVENTS
   OverwriteModelError IN DEV)
=============================== */
export default mongoose.models.AdminLog ||
    mongoose.model("AdminLog", adminLogSchema);