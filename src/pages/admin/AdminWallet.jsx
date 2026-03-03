import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminFetch } from "../../utils/adminFetch";

export default function AdminWallet() {
    const navigate = useNavigate();

    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [type, setType] = useState("credit");
    const [amount, setAmount] = useState("");
    const [note, setNote] = useState("");

    /* ===============================
       PAGINATION STATE
    ================================ */
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);

    /* ===============================
       LOAD WALLET (SERVER SIDE)
    ================================ */
    const fetchWallet = async () => {
        setLoading(true);

        try {
            const params = new URLSearchParams({
                page,
                limit,
            });

            const res = await adminFetch(
                `/api/admin/wallet?${params.toString()}`
            );

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to load wallet.");
                return;
            }

            setWallet(data);
            setTotalPages(data.totalPages || 1);

        } catch (err) {
            console.error(err);
            setError("Failed to load wallet.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallet();
    }, [page, limit]);

    /* ===============================
       ADJUST WALLET
    ================================ */
    const adjustWallet = async () => {
        if (!amount || Number(amount) <= 0) {
            setError("Enter a valid amount.");
            return;
        }

        setSaving(true);
        setError("");

        try {
            const res = await adminFetch(
                "/api/admin/wallet/adjust",
                {
                    method: "POST",
                    body: JSON.stringify({
                        type,
                        amount: Number(amount),
                        note,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Wallet update failed.");
                return;
            }

            setAmount("");
            setNote("");
            fetchWallet();

        } catch (err) {
            console.error(err);
            setError("Wallet update failed.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white opacity-60">
                Loading wallet...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white px-4 sm:px-6 md:px-10 py-10 max-w-6xl mx-auto">

            {/* HEADER */}
            <div className="mb-12">
                <p className="tracking-widest text-xs md:text-sm opacity-50">
                    ADMIN PANEL
                </p>
                <h1 className="text-3xl md:text-4xl mt-2">
                    Wallet Management
                </h1>
            </div>

            {/* ERROR */}
            {error && (
                <div className="mb-6 text-sm text-red-400 border border-red-400/30 bg-red-500/10 p-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* BALANCE */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 mb-14">
                <p className="text-xs tracking-widest opacity-50 mb-2">
                    CURRENT BALANCE
                </p>
                <p className="text-3xl md:text-5xl font-semibold">
                    {wallet?.currency || "NPR"} {wallet?.balance || 0}
                </p>
            </div>

            {/* ADJUST */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 mb-16 space-y-6">

                <p className="tracking-widest text-xs md:text-sm opacity-50">
                    MANUAL ADJUSTMENT
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => setType("credit")}
                        disabled={saving}
                        className={`flex-1 px-6 py-3 rounded-lg border ${type === "credit"
                                ? "bg-green-600 border-green-600"
                                : "border-white/20"
                            }`}
                    >
                        CREDIT
                    </button>

                    <button
                        onClick={() => setType("debit")}
                        disabled={saving}
                        className={`flex-1 px-6 py-3 rounded-lg border ${type === "debit"
                                ? "bg-red-600 border-red-600"
                                : "border-white/20"
                            }`}
                    >
                        DEBIT
                    </button>
                </div>

                <div className="flex flex-col gap-4">
                    <input
                        type="number"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-black border border-white/20 px-4 py-3 rounded-lg text-sm"
                    />

                    <input
                        placeholder="Note (optional)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="bg-black border border-white/20 px-4 py-3 rounded-lg text-sm"
                    />
                </div>

                <button
                    onClick={adjustWallet}
                    disabled={saving}
                    className="w-full sm:w-auto px-8 py-3 rounded-lg border border-white/30 hover:bg-white hover:text-black transition text-sm"
                >
                    {saving ? "APPLYING..." : "APPLY"}
                </button>
            </div>

            {/* TRANSACTIONS */}
            <div>

                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <p className="tracking-widest text-xs md:text-sm opacity-50">
                        TRANSACTION HISTORY
                    </p>

                    <select
                        value={limit}
                        onChange={(e) => {
                            setPage(1);
                            setLimit(Number(e.target.value));
                        }}
                        className="bg-black border border-white/20 px-3 py-2 rounded text-sm"
                    >
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                    </select>
                </div>

                <div className="space-y-4">
                    {wallet?.transactions?.length === 0 && (
                        <p className="text-sm opacity-40">
                            No transactions yet.
                        </p>
                    )}

                    {wallet?.transactions?.map((tx) => {
                        const isPositive =
                            tx.type === "credit" ||
                            tx.type === "refund" ||
                            tx.type === "coupon";

                        return (
                            <div
                                key={tx._id}
                                className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                            >
                                <div>
                                    <p
                                        className={`text-sm font-medium ${isPositive
                                                ? "text-green-400"
                                                : "text-red-400"
                                            }`}
                                    >
                                        {isPositive ? "↑" : "↓"}{" "}
                                        {tx.type.toUpperCase()} —{" "}
                                        {wallet.currency} {tx.amount}
                                    </p>

                                    {tx.relatedOrderId ? (
                                        <button
                                            onClick={() =>
                                                navigate("/admin/orders")
                                            }
                                            className="text-xs text-blue-400 hover:underline mt-1"
                                        >
                                            Order #
                                            {tx.relatedOrderId
                                                .toString()
                                                .slice(-6)}
                                        </button>
                                    ) : (
                                        <p className="text-xs opacity-40">
                                            {tx.note || "—"}
                                        </p>
                                    )}
                                </div>

                                <p className="text-xs opacity-40">
                                    {new Date(tx.createdAt).toLocaleString()}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* PAGINATION */}
                <div className="flex justify-center items-center gap-4 mt-10">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="px-4 py-2 border border-white/20 rounded disabled:opacity-30"
                    >
                        Previous
                    </button>

                    <span className="text-sm opacity-60">
                        Page {page} of {totalPages}
                    </span>

                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-4 py-2 border border-white/20 rounded disabled:opacity-30"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}