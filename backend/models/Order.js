import mongoose from "mongoose";

/* =====================================================
   REFUND TIMELINE SUBSCHEMA
===================================================== */
const refundTimelineSchema = new mongoose.Schema(
    {
        status: { type: String, required: true, trim: true },
        note: { type: String, default: "", trim: true },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

/* =====================================================
   ORDER ITEM SUBSCHEMA
===================================================== */
const orderItemSchema = new mongoose.Schema(
    {
        _id: { type: String, required: true },
        title: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String, default: "" },
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
        store: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            default: null,
            index: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: (v) => Array.isArray(v) && v.length > 0,
                message: "Order must contain at least one item",
            },
        },

        shipping: {
            type: shippingSchema,
            required: true,
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        paymentMethod: {
            type: String,
            enum: ["stripe", "cod", "esewa", "khalti", "wallet"],
            required: true,
            index: true,
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending",
            index: true,
        },

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

        stripeSessionId: { type: String, default: null },
        stripePaymentIntentId: { type: String, default: null },

        coupon: {
            code: { type: String, trim: true },
            type: { type: String, trim: true },
            value: { type: Number, min: 0 },
            discount: { type: Number, min: 0 },
        },

        refundRequested: { type: Boolean, default: false },
        refundRequestedAt: { type: Date, default: null },

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

        refundRejectReason: { type: String, default: null, trim: true },

        refundMethod: {
            type: String,
            enum: ["wallet", "original_payment", null],
            default: null,
        },

        refundAmount: { type: Number, default: 0, min: 0 },
        refundedAt: { type: Date, default: null },

        refundedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default: null,
        },

        refundTimeline: {
            type: [refundTimelineSchema],
            default: [],
        },

        analytics: {
            refundProcessed: { type: Boolean, default: false },
        },
    },
    {
        timestamps: true,
    }
);

/* =====================================================
   BASE INDEXES
===================================================== */
orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ store: 1, createdAt: -1 });

/* =====================================================
   PERFORMANCE INDEXES FOR 10K+ ORDERS
===================================================== */

// Fast analytics filtering
orderSchema.index({ orderStatus: 1, createdAt: -1 });

// Fast user retention queries
orderSchema.index({ user: 1, orderStatus: 1 });

// Fast store analytics filtering
orderSchema.index({ store: 1, orderStatus: 1, createdAt: -1 });

// Fast refund filtering
orderSchema.index({ refundStatus: 1, createdAt: -1 });

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
   EXPORT MODEL
===================================================== */
const Order =
    mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;