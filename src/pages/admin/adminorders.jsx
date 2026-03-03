import { useEffect, useState } from "react";
import { adminFetch } from "../../utils/adminFetch";

/* ================= OPTIONS ================= */
const STATUS_OPTIONS = [
    "pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
];

const PAYMENT_OPTIONS = [
    "all",
    "cod",
    "wallet",
    "stripe",
    "khalti",
    "esewa",
];

const statusStyles = {
    pending: "bg-yellow-500 text-black",
    paid: "bg-green-600 text-white",
    processing: "bg-blue-600 text-white",
    shipped: "bg-indigo-600 text-white",
    delivered: "bg-purple-600 text-white",
    cancelled: "bg-red-600 text-white",
    refunded: "bg-white text-black",
};

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [confirmRefundId, setConfirmRefundId] = useState(null);
    const [rejectRefundId, setRejectRefundId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    /* ================= FETCH ORDERS ================= */
    const fetchOrders = async () => {
        setLoading(true);

        try {
            const params = new URLSearchParams({
                page,
                limit,
                status: statusFilter,
                payment: paymentFilter,
                search,
                from: fromDate,
                to: toDate,
            });

            const res = await adminFetch(
                `/api/admin/orders?${params.toString()}`
            );

            const data = await res.json();
            if (!res.ok) throw new Error();

            setOrders(Array.isArray(data.orders) ? data.orders : []);
            setTotalPages(data.totalPages || 1);
        } catch {
            setOrders([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page, limit, statusFilter, paymentFilter, search, fromDate, toDate]);

    /* ================= UPDATE STATUS ================= */
    const updateStatus = async (orderId, newStatus) => {
        setProcessingId(orderId);

        try {
            const res = await adminFetch(
                `/api/admin/orders/${orderId}/status`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: newStatus }),
                }
            );

            if (!res.ok) throw new Error();
            fetchOrders();
        } catch {
            alert("Status update failed");
        } finally {
            setProcessingId(null);
        }
    };

    /* ================= APPROVE REFUND ================= */
    const approveRefund = async () => {
        if (!confirmRefundId) return;

        setProcessingId(confirmRefundId);

        try {
            const res = await adminFetch(
                `/api/admin/orders/refund/${confirmRefundId}`,
                { method: "PUT" }
            );

            if (!res.ok) throw new Error();
            fetchOrders();
        } catch {
            alert("Refund approval failed");
        } finally {
            setProcessingId(null);
            setConfirmRefundId(null);
        }
    };

    /* ================= REJECT REFUND ================= */
    const rejectRefund = async () => {
        if (!rejectRefundId || !rejectReason.trim()) return;

        setProcessingId(rejectRefundId);

        try {
            const res = await adminFetch(
                `/api/admin/orders/refund/${rejectRefundId}/reject`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason: rejectReason }),
                }
            );

            if (!res.ok) throw new Error();
            fetchOrders();
        } catch {
            alert("Refund rejection failed");
        } finally {
            setProcessingId(null);
            setRejectRefundId(null);
            setRejectReason("");
        }
    };

    /* ================= EXPORT CSV ================= */
    const exportCSV = async () => {
        try {
            const params = new URLSearchParams({
                status: statusFilter,
                payment: paymentFilter,
                search,
                from: fromDate,
                to: toDate,
            });

            const res = await adminFetch(
                `/api/admin/orders/export?${params.toString()}`
            );

            if (!res.ok) throw new Error();

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "orders-export.csv";
            a.click();
        } catch {
            alert("Export failed");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white px-16 py-12">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl tracking-widest">
                    ORDERS MANAGEMENT
                </h1>

                <button
                    onClick={exportCSV}
                    className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl text-sm"
                >
                    EXPORT CSV
                </button>
            </div>

            {/* FILTER BAR */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                <div className="grid grid-cols-6 gap-4">

                    <input
                        placeholder="Search Order ID..."
                        value={search}
                        onChange={(e) => {
                            setPage(1);
                            setSearch(e.target.value);
                        }}
                        className="bg-black border border-white/20 px-4 py-3 rounded-lg text-sm"
                    />

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-black border border-white/20 px-4 py-3 rounded-lg text-sm"
                    >
                        <option value="all">ALL STATUS</option>
                        {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                                {s.toUpperCase()}
                            </option>
                        ))}
                    </select>

                    <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        className="bg-black border border-white/20 px-4 py-3 rounded-lg text-sm"
                    >
                        {PAYMENT_OPTIONS.map((m) => (
                            <option key={m} value={m}>
                                {m.toUpperCase()}
                            </option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="bg-black border border-white/20 px-4 py-3 rounded-lg text-sm"
                    />

                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="bg-black border border-white/20 px-4 py-3 rounded-lg text-sm"
                    />

                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="bg-black border border-white/20 px-4 py-3 rounded-lg text-sm"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            {/* ORDERS */}
            {loading && <p>Loading...</p>}

            <div className="space-y-6">
                {orders.map((order) => {
                    const refundRequested =
                        order.refundStatus === "requested";

                    return (
                        <div
                            key={order._id}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 flex justify-between"
                        >
                            <div>
                                <p className="text-xs opacity-40 break-all">
                                    {order._id}
                                </p>
                                <p className="mt-2 text-lg">
                                    NPR {order.totalAmount}
                                </p>
                                <p className="text-sm opacity-60">
                                    {order.paymentMethod?.toUpperCase()}
                                </p>
                            </div>

                            <div className="text-right space-y-3">

                                <span
                                    className={`px-3 py-1 rounded-full text-xs ${statusStyles[order.orderStatus]}`}
                                >
                                    {order.orderStatus.toUpperCase()}
                                </span>

                                <div>
                                    <select
                                        disabled={processingId === order._id}
                                        value={order.orderStatus}
                                        onChange={(e) =>
                                            updateStatus(
                                                order._id,
                                                e.target.value
                                            )
                                        }
                                        className="bg-black border border-white/20 text-xs px-3 py-2 rounded mt-2"
                                    >
                                        {STATUS_OPTIONS.map((s) => (
                                            <option key={s} value={s}>
                                                {s.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {refundRequested && (
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() =>
                                                setConfirmRefundId(order._id)
                                            }
                                            className="bg-green-600 px-3 py-2 text-xs rounded"
                                        >
                                            APPROVE
                                        </button>
                                        <button
                                            onClick={() =>
                                                setRejectRefundId(order._id)
                                            }
                                            className="bg-red-600 px-3 py-2 text-xs rounded"
                                        >
                                            REJECT
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* PAGINATION */}
            <div className="flex justify-center gap-4 mt-10">
                <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 border border-white/20 rounded"
                >
                    Previous
                </button>

                <span>Page {page} of {totalPages}</span>

                <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 border border-white/20 rounded"
                >
                    Next
                </button>
            </div>

            {/* APPROVE MODAL */}
            {confirmRefundId && (
                <Modal
                    title="Approve Refund?"
                    onCancel={() => setConfirmRefundId(null)}
                    onConfirm={approveRefund}
                />
            )}

            {/* REJECT MODAL */}
            {rejectRefundId && (
                <RejectModal
                    reason={rejectReason}
                    setReason={setRejectReason}
                    onCancel={() => setRejectRefundId(null)}
                    onConfirm={rejectRefund}
                />
            )}
        </div>
    );
}

/* ================= MODALS ================= */

function Modal({ title, onCancel, onConfirm }) {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
            <div className="bg-zinc-900 p-6 rounded-xl space-y-4">
                <h2>{title}</h2>
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel}>Cancel</button>
                    <button
                        onClick={onConfirm}
                        className="bg-green-600 px-4 py-2 rounded"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

function RejectModal({ reason, setReason, onCancel, onConfirm }) {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
            <div className="bg-zinc-900 p-6 rounded-xl space-y-4 w-96">
                <h2>Reject Refund</h2>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-black border border-white/20 p-3 rounded"
                />
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel}>Cancel</button>
                    <button
                        onClick={onConfirm}
                        className="bg-red-600 px-4 py-2 rounded"
                    >
                        Reject
                    </button>
                </div>
            </div>
        </div>
    );
}