import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userFetch } from "../utils/userFetch";

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    /* ===============================
       FETCH ORDERS
    ================================ */
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const data = await userFetch("/api/orders/my-orders");

                if (!data) return;

                setOrders(data.orders || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    /* ===============================
       STATUS COLOR SYSTEM
    ================================ */
    const statusColor = (order) => {
        if (order.orderStatus === "refunded")
            return "bg-white text-black";

        if (order.refundStatus === "requested")
            return "bg-yellow-500 text-black";

        switch (order.orderStatus) {
            case "paid":
                return "bg-green-600 text-white";
            case "processing":
                return "bg-blue-600 text-white";
            case "shipped":
                return "bg-indigo-600 text-white";
            case "delivered":
                return "bg-purple-600 text-white";
            case "cancelled":
                return "bg-red-600 text-white";
            default:
                return "bg-yellow-600 text-black";
        }
    };

    /* ===============================
       UI STATES
    ================================ */
    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center opacity-60">
                Loading orders...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white px-4 sm:px-8 py-12">
            <div className="max-w-6xl mx-auto">

                <h1 className="text-3xl sm:text-4xl font-bold mb-10 tracking-widest">
                    MY ORDERS
                </h1>

                {orders.length === 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
                        <p className="text-white/60">
                            You haven’t placed any orders yet.
                        </p>
                    </div>
                )}

                <div className="space-y-6">
                    {orders.map((order) => (
                        <div
                            key={order._id}
                            onClick={() => navigate(`/orders/${order._id}`)}
                            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-white/40 transition cursor-pointer"
                        >
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">

                                <div className="space-y-2">
                                    <p className="text-xs text-white/50 break-all">
                                        ORDER ID: {order._id}
                                    </p>
                                    <p className="text-xs text-white/40">
                                        {new Date(order.createdAt).toLocaleString()}
                                    </p>
                                </div>

                                <div className="flex flex-col items-start md:items-end gap-3">
                                    <p className="text-xl sm:text-2xl font-semibold">
                                        NPR {order.totalAmount}
                                    </p>

                                    <span
                                        className={`px-4 py-1 text-xs tracking-widest rounded-full ${statusColor(order)}`}
                                    >
                                        {order.refundStatus === "requested"
                                            ? "REFUND REQUESTED"
                                            : order.orderStatus?.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 border-t border-zinc-800 pt-4 text-sm text-white/70 space-y-1">
                                {order.items.slice(0, 3).map((item, index) => (
                                    <div key={index} className="flex justify-between">
                                        <span>
                                            {item.title} × {item.quantity}
                                        </span>
                                        <span>
                                            NPR {item.price * item.quantity}
                                        </span>
                                    </div>
                                ))}

                                {order.items.length > 3 && (
                                    <p className="text-white/40 text-xs pt-1">
                                        +{order.items.length - 3} more items
                                    </p>
                                )}
                            </div>

                            {order.refundStatus === "approved" && (
                                <div className="mt-4 text-xs text-green-400">
                                    Refund completed and credited to wallet
                                </div>
                            )}

                            {order.refundStatus === "rejected" && (
                                <div className="mt-4 text-xs text-red-400">
                                    Refund rejected
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}