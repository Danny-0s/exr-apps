import express from "express";
import mongoose from "mongoose";
import AdminWallet from "../models/AdminWallet.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

/* =========================================
   GET ADMIN WALLET (WITH PAGINATED HISTORY)
========================================= */
router.get("/", adminAuth(), async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        let wallet = await AdminWallet.findOne();

        if (!wallet) {
            wallet = await AdminWallet.create({
                balance: 0,
                currency: "NPR",
                transactions: [],
            });
        }

        const totalTransactions = wallet.transactions.length;

        const paginatedTransactions = wallet.transactions
            .slice((pageNumber - 1) * limitNumber, pageNumber * limitNumber);

        res.json({
            success: true,
            currency: wallet.currency || "NPR",
            balance: wallet.balance || 0,
            transactions: paginatedTransactions,
            totalTransactions,
            totalPages: Math.ceil(totalTransactions / limitNumber),
            currentPage: pageNumber,
        });

    } catch (err) {
        console.error("Wallet fetch error:", err);
        res.status(500).json({
            error: "Failed to load wallet",
        });
    }
});

/* =========================================
   MANUAL WALLET ADJUSTMENT (ATOMIC SAFE)
========================================= */
router.post("/adjust", adminAuth(), async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { type, amount, note } = req.body;

        if (!["credit", "debit"].includes(type)) {
            throw new Error("Invalid transaction type");
        }

        const numericAmount = Number(amount);

        if (!numericAmount || numericAmount <= 0) {
            throw new Error("Invalid amount");
        }

        let wallet = await AdminWallet.findOne().session(session);

        if (!wallet) {
            const created = await AdminWallet.create([{
                balance: 0,
                currency: "NPR",
                transactions: [],
            }], { session });

            wallet = created[0];
        }

        /* =====================================
           PREVENT NEGATIVE BALANCE
        ===================================== */
        if (type === "debit" && wallet.balance < numericAmount) {
            throw new Error("Insufficient wallet balance");
        }

        /* =====================================
           UPDATE BALANCE
        ===================================== */
        wallet.balance =
            type === "credit"
                ? wallet.balance + numericAmount
                : wallet.balance - numericAmount;

        /* =====================================
           RECORD TRANSACTION
        ===================================== */
        wallet.transactions.unshift({
            type,
            amount: numericAmount,
            note: note || "Admin adjustment",
            createdAt: new Date(),
        });

        /* =====================================
           LIMIT HISTORY SIZE (PREVENT 100K ARRAY)
        ===================================== */
        if (wallet.transactions.length > 5000) {
            wallet.transactions = wallet.transactions.slice(0, 5000);
        }

        await wallet.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json({
            success: true,
            currency: wallet.currency,
            balance: wallet.balance,
            transactions: wallet.transactions.slice(0, 20),
        });

    } catch (err) {

        await session.abortTransaction();
        session.endSession();

        console.error("Wallet adjust error:", err);

        res.status(400).json({
            error: err.message || "Wallet update failed",
        });
    }
});

export default router;