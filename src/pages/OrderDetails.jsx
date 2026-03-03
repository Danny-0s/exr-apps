import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { userFetch } from "../utils/userFetch";

export default function OrderDetails() {
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processing, setProcessing] = useState(false);
    const [selectedReason, setSelectedReason] = useState("size_issue");

    /* ================= FETCH ORDER ================= */
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await userFetch(`/api/orders/${id}`);
                if (!data) return;

                const orderData = data.order ? data.order : data;
                setOrder(orderData);
            } catch (err) {
                setError(err.message || "Order not found");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    /* ================= CANCEL ORDER ================= */
    const cancelOrder = async () => {
        if (!window.confirm("Are you sure you want to cancel this order?"))
            return;

        setProcessing(true);

        try {
            await userFetch(
                `/api/orders/${order._id}/cancel`,
                { method: "PATCH" }
            );

            setOrder(prev => ({
                ...prev,
                orderStatus: "cancelled",
            }));
        } catch (err) {
            alert(err.message || "Cancel failed");
        } finally {
            setProcessing(false);
        }
    };

    /* ================= REQUEST REFUND ================= */
    const requestRefund = async () => {
        setProcessing(true);

        try {
            await userFetch(
                `/api/orders/${order._id}/refund-request`,
                {
                    method: "POST",
                    body: { reason: selectedReason },
                }
            );

            setOrder(prev => ({
                ...prev,
                refundStatus: "requested",
                refundReason: selectedReason,
            }));
        } catch (err) {
            alert(err.message || "Refund request failed");
        } finally {
            setProcessing(false);
        }
    };

    /* ================= STATUS COLOR ================= */
    const statusColor = (order) => {
        if (order.orderStatus === "cancelled")
            return "bg-red-600 text-white";

        if (order.orderStatus === "refunded")
            return "bg-white text-black";

        if (order.refundStatus === "requested")
            return "bg-yellow-500 text-black";

        switch (order.orderStatus) {
            case "paid":
                return "bg-green-600 text-white";
            case "processing":
                return "bg-yellow-500 text-black";
            case "shipped":
                return "bg-indigo-600 text-white";
            case "delivered":
                return "bg-purple-600 text-white";
            default:
                return "bg-yellow-600 text-black";
        }
    };

    if (loading)
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                Loading order...
            </div>
        );

    if (error || !order)
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p className="text-red-500">{error || "Order not found"}</p>
            </div>
        );

    const subtotal = order.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const shippingFee = Math.max(0, order.totalAmount - subtotal);

    const canCancel =
        ["pending", "paid", "processing"]
            .includes(order.orderStatus?.toLowerCase());

    return (
        <div className="min-h-screen bg-black text-white px-4 sm:px-8 py-12">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-widest">
                            ORDER DETAILS
                        </h1>
                        <p className="text-white/50 text-sm break-all mt-1">
                            {order._id}
                        </p>
                        <p className="text-white/40 text-xs mt-1">
                            {new Date(order.createdAt).toLocaleString()}
                        </p>
                    </div>

                    <span className={`px-4 py-2 rounded-full text-xs tracking-widest ${statusColor(order)}`}>
                        {order.refundStatus === "requested"
                            ? "REFUND REQUESTED"
                            : order.orderStatus?.toUpperCase()}
                    </span>
                </div>

                {/* ITEMS */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <div className="space-y-4">
                        {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between border-b border-zinc-800 pb-4">
                                <span>{item.title} × {item.quantity}</span>
                                <span>NPR {item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 border-t border-zinc-800 pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>NPR {subtotal}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Shipping</span>
                            <span>{shippingFee === 0 ? "FREE" : `NPR ${shippingFee}`}</span>
                        </div>
                        <div className="flex justify-between text-lg font-semibold">
                            <span>Total</span>
                            <span>NPR {order.totalAmount}</span>
                        </div>
                    </div>
                </div>

                {/* CANCEL BUTTON */}
                {canCancel && (
                    <div className="text-right">
                        <button
                            onClick={cancelOrder}
                            disabled={processing}
                            className="border border-red-500 text-red-500 px-6 py-2 tracking-widest hover:bg-red-500 hover:text-black transition disabled:opacity-50"
                        >
                            {processing ? "PROCESSING..." : "CANCEL ORDER"}
                        </button>
                    </div>
                )}

                {/* REFUND BUTTON */}
                {order.orderStatus === "delivered" &&
                    order.refundStatus === "none" && (
                        <div className="text-right">
                            <button
                                onClick={requestRefund}
                                disabled={processing}
                                className="border border-red-500 text-red-500 px-6 py-2 tracking-widest hover:bg-red-500 hover:text-black transition disabled:opacity-50"
                            >
                                {processing ? "PROCESSING..." : "REQUEST REFUND"}
                            </button>
                        </div>
                    )}

            </div>
        </div>
    );
}