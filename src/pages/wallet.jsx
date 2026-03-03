import { useEffect, useState } from "react";
import { userFetch } from "../utils/userFetch";

export default function Wallet() {
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* ================= FETCH WALLET ================= */
    useEffect(() => {
        const fetchWallet = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await userFetch("/api/auth/profile");
                if (!data) return;

                setWallet(data);
            } catch (err) {
                setError(err.message || "Failed to load wallet");
            } finally {
                setLoading(false);
            }
        };

        fetchWallet();
    }, []);

    /* ================= LOADING ================= */
    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center opacity-60">
                Loading wallet...
            </div>
        );
    }

    /* ================= ERROR ================= */
    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white px-4 sm:px-8 py-12">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* HEADER */}
                <h1 className="text-3xl sm:text-4xl font-bold tracking-widest">
                    WALLET
                </h1>

                {/* BALANCE CARD */}
                <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-3xl p-8 sm:p-10 shadow-xl">
                    <p className="text-white/50 uppercase text-xs tracking-widest mb-3">
                        Available Balance
                    </p>

                    <p className="text-4xl sm:text-5xl font-bold text-green-500">
                        NPR {wallet?.walletBalance || 0}
                    </p>

                    <p className="text-white/40 text-sm mt-4">
                        Wallet credit is used automatically at checkout when selected.
                    </p>
                </div>

                {/* TRANSACTION HISTORY */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8">
                    <h2 className="text-lg sm:text-xl font-semibold tracking-widest mb-6">
                        TRANSACTION HISTORY
                    </h2>

                    {!wallet?.walletTransactions?.length && (
                        <p className="text-white/60">
                            No transactions yet.
                        </p>
                    )}

                    <div className="space-y-4">
                        {wallet?.walletTransactions
                            ?.slice()
                            .reverse()
                            .map((tx, index) => {
                                const isDebit = tx.type === "purchase";

                                return (
                                    <div
                                        key={index}
                                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-zinc-800 pb-4 gap-3"
                                    >
                                        {/* LEFT */}
                                        <div>
                                            <p className="capitalize font-medium">
                                                {tx.type.replace("_", " ")}
                                            </p>

                                            {tx.relatedOrder && (
                                                <p className="text-xs text-white/40">
                                                    Order ID: {tx.relatedOrder}
                                                </p>
                                            )}

                                            <p className="text-xs text-white/40 mt-1">
                                                {new Date(tx.createdAt).toLocaleString()}
                                            </p>

                                            {tx.note && (
                                                <p className="text-xs text-white/50 mt-1">
                                                    {tx.note}
                                                </p>
                                            )}
                                        </div>

                                        {/* RIGHT */}
                                        <p
                                            className={`text-lg font-semibold ${isDebit
                                                    ? "text-red-500"
                                                    : "text-green-500"
                                                }`}
                                        >
                                            {isDebit ? "-" : "+"}
                                            NPR {tx.amount}
                                        </p>
                                    </div>
                                );
                            })}
                    </div>
                </div>

            </div>
        </div>
    );
}