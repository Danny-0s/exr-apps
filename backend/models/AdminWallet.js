import mongoose from "mongoose";

/* ===============================
   WALLET TRANSACTION
================================ */
const walletTransactionSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: [
                "credit",   // system credit
                "debit",    // system debit
                "refund",   // refund from order
                "coupon",   // coupon compensation
                "manual",   // admin adjustment
            ],
            required: true,
        },

        // ✅ FIX: backward compatible direction
        direction: {
            type: String,
            enum: ["credit", "debit"],
            default: function () {
                // Old code didn't send direction
                if (this.type === "debit") return "debit";
                return "credit"; // credit, refund, coupon, manual
            },
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        note: {
            type: String,
            default: "",
            trim: true,
        },

        relatedOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null,
        },

        // 🔒 Refund transactions should not be edited
        locked: {
            type: Boolean,
            default: false,
        },

        // Who created this transaction
        source: {
            type: String,
            enum: ["system", "admin"],
            default: "admin",
        },
    },
    {
        timestamps: true,
    }
);

/* ===============================
   ADMIN WALLET
================================ */
const adminWalletSchema = new mongoose.Schema(
    {
        balance: {
            type: Number,
            default: 0,
            min: 0,
        },

        currency: {
            type: String,
            default: "NPR",
        },

        transactions: {
            type: [walletTransactionSchema],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

/* ===============================
   SAFETY: NEVER NEGATIVE BALANCE
================================ */
adminWalletSchema.pre("save", function () {
    if (this.balance < 0) {
        this.balance = 0;
    }
});

/* ===============================
   HELPER: ADD TRANSACTION
================================ */
adminWalletSchema.methods.addTransaction = function ({
    type,
    amount,
    note = "",
    relatedOrderId = null,
    source = "admin",
}) {
    if (amount <= 0) return;

    const direction = type === "debit" ? "debit" : "credit";

    // Apply balance change
    if (direction === "credit") {
        this.balance += amount;
    } else {
        this.balance = Math.max(this.balance - amount, 0);
    }

    this.transactions.unshift({
        type,
        direction,
        amount,
        note,
        relatedOrderId,
        locked: type === "refund",
        source,
    });
};

/* ===============================
   HELPER: CHECK REFUND EXISTS
================================ */
adminWalletSchema.methods.hasRefundForOrder = function (orderId) {
    return this.transactions.some(
        (t) =>
            t.type === "refund" &&
            t.relatedOrderId?.toString() === orderId.toString()
    );
};

export default mongoose.model("AdminWallet", adminWalletSchema);