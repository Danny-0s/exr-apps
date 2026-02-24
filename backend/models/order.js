import mongoose from "mongoose";

/* =====================================================
   REFUND TIMELINE SUBSCHEMA
===================================================== */
const refundTimelineSchema = new mongoose.Schema(
    {
        status: {
            type: String,
            required: true,
            trim: true,
        },
        note: {
            type: String,
            default: "",
            trim: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

/* =====================================================
   ORDER ITEM SUBSCHEMA
===================================================== */
const orderItemSchema = new mongoose.Schema(
    {
        _id: {
            type: String, // Product ID snapshot
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        image: {
            type: String,
            default: "",
        },
    },
    { _id: false }
);

/* =====================================================
   SHIPPING SUBSCHEMA
===================================================== */
const shippingSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        province: { type: String, required: true, trim: true },
        notes: { type: String, default: "", trim: true },
    },
    { _id: false }
);

/* =====================================================
   MAIN ORDER SCHEMA
===================================================== */
const orderSchema = new mongoose.Schema(
    {
        /* USER */
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        /* ORDER ITEMS */
        items: {
            type: [orderItemSchema],
            validate: (v) => v.length > 0,
            required: true,
        },

        /* SHIPPING */
        shipping: {
            type: shippingSchema,
            required: true,
        },

        /* TOTAL */
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        /* PAYMENT METHOD */
        paymentMethod: {
            type: String,
            enum: ["stripe", "cod", "esewa", "khalti", "wallet"],
            required: true,
            index: true,
        },

        /* PAYMENT STATUS */
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending",
            index: true,
        },

        /* ORDER STATUS */
        orderStatus: {
            type: String,
            enum: [
                "pending",
                "paid",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
                "refunded",
            ],
            default: "pending",
            index: true,
        },

        /* STRIPE META */
        stripeSessionId: {
            type: String,
            default: null,
            index: true,
        },

        stripePaymentIntentId: {
            type: String,
            default: null,
            index: true,
        },

        /* COUPON SNAPSHOT */
        coupon: {
            code: { type: String, trim: true },
            type: { type: String, trim: true },
            value: { type: Number, min: 0 },
            discount: { type: Number, min: 0 },
        },

        /* REFUND FLAGS */
        refundRequested: {
            type: Boolean,
            default: false,
        },

        refundRequestedAt: {
            type: Date,
            default: null,
        },

        refundReason: {
            type: String,
            enum: [
                "change_of_mind",
                "size_issue",
                "damaged_item",
                "wrong_item",
                null,
            ],
            default: null,
        },

        refundStatus: {
            type: String,
            enum: ["none", "requested", "approved", "rejected", "refunded"],
            default: "none",
            index: true,
        },

        refundRejectReason: {
            type: String,
            default: null,
            trim: true,
        },

        refundMethod: {
            type: String,
            enum: ["wallet", "original_payment", null],
            default: null,
        },

        refundAmount: {
            type: Number,
            min: 0,
            default: 0,
        },

        refundedAt: {
            type: Date,
            default: null,
        },

        refundedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default: null,
        },

        /* REFUND TIMELINE */
        refundTimeline: {
            type: [refundTimelineSchema],
            default: [],
        },

        /* ANALYTICS */
        analytics: {
            refundProcessed: {
                type: Boolean,
                default: false,
            },
        },
    },
    {
        timestamps: true,
    }
);

/* =====================================================
   INDEXES
===================================================== */
orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });

/* =====================================================
   HELPER METHODS
===================================================== */
orderSchema.methods.addRefundTimeline = function (status, note = "") {
    this.refundTimeline.push({
        status,
        note,
        createdAt: new Date(),
    });
};

orderSchema.methods.markAsRefunded = function (adminId, amount, method) {
    this.refundStatus = "refunded";
    this.orderStatus = "refunded";
    this.paymentStatus = "refunded";
    this.refundAmount = amount;
    this.refundMethod = method;
    this.refundedAt = new Date();
    this.refundedBy = adminId;
    this.analytics.refundProcessed = true;

    this.addRefundTimeline("refunded", "Refund completed");
};

/* =====================================================
   PRE-SAVE VALIDATION
===================================================== */
orderSchema.pre("save", function (next) {
    if (this.refundAmount > this.totalAmount) {
        return next(new Error("Refund amount cannot exceed total amount"));
    }
    next();
});

/* =====================================================
   SAFE EXPORT (Prevents OverwriteModelError)
===================================================== */
const Order =
    mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;