import { useEffect, useState } from "react";
import { userFetch } from "../utils/userFetch";
import { useNavigate } from "react-router-dom";

export default function MyAccount() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    /* ================= STATUS COLOR SYSTEM ================= */
    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case "delivered":
                return "bg-green-600/20 text-green-400 border-green-600";
            case "shipped":
                return "bg-yellow-600/20 text-yellow-400 border-yellow-600";
            case "cancelled":
            case "refunded":
                return "bg-red-600/20 text-red-400 border-red-600";
            case "pending":
                return "bg-zinc-700 text-zinc-300 border-zinc-600";
            default:
                return "bg-zinc-700 text-zinc-300 border-zinc-600";
        }
    };

    /* ================= REORDER ================= */
    const handleReorder = async (orderId) => {
        try {
            await userFetch("/api/orders/reorder", {
                method: "POST",
                body: JSON.stringify({ orderId }),
            });

            navigate("/cart");
        } catch {
            alert("Reorder failed");
        }
    };

    /* ================= RETURN ================= */
    const handleReturn = async (orderId) => {
        try {
            await userFetch(`/api/orders/${orderId}/return`, {
                method: "POST",
            });

            alert("Return request submitted");
        } catch {
            alert("Return request failed");
        }
    };

    /* ================= LOAD PROFILE + ORDERS ================= */
    useEffect(() => {
        const loadData = async () => {
            try {
                const profileRes = await userFetch("/api/auth/profile");
                if (!profileRes) return;
                const profileData = await profileRes.json();
                setUser(profileData);

                const orderRes = await userFetch("/api/orders/my");
                if (!orderRes) return;
                const orderData = await orderRes.json();
                setOrders(orderData.orders || []);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                Loading account...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white px-6 md:px-16 py-16 max-w-6xl mx-auto">

            <h1 className="text-3xl tracking-widest mb-12">
                MY ACCOUNT
            </h1>

            {/* ================= ACCOUNT SUMMARY ================= */}
            <div className="mb-16 p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                <p className="text-sm opacity-60">Name</p>
                <p className="mb-4">{user?.name}</p>

                <p className="text-sm opacity-60">Email</p>
                <p className="mb-4">{user?.email}</p>

                <p className="text-sm opacity-60">Wallet Balance</p>
                <p>NPR {user?.walletBalance || 0}</p>
            </div>

            {/* ================= ORDER HISTORY ================= */}
            <h2 className="text-xl tracking-widest mb-8">
                ORDER HISTORY
            </h2>

            {orders.length === 0 && (
                <p className="opacity-60">No orders found.</p>
            )}

            <div className="space-y-6">

                {orders.map(order => {

                    const isOpen = expandedOrder === order._id;

                    return (
                        <div
                            key={order._id}
                            className="border border-zinc-800 bg-zinc-900 rounded-xl overflow-hidden transition hover:border-white"
                        >

                            {/* ===== TOP SECTION ===== */}
                            <div
                                className="flex justify-between items-center p-6 cursor-pointer"
                                onClick={() =>
                                    setExpandedOrder(isOpen ? null : order._id)
                                }
                            >
                                <div>
                                    <p className="text-sm opacity-60">
                                        Order ID
                                    </p>
                                    <p className="text-xs opacity-50 break-all">
                                        {order._id}
                                    </p>
                                </div>

                                <div className="flex items-center gap-6">

                                    {/* ===== THUMBNAILS ===== */}
                                    <div className="flex -space-x-3">
                                        {(order.items || []).slice(0, 3).map((item, i) => (
                                            <img
                                                key={i}
                                                src={`http://localhost:4242${item.image}`}
                                                alt=""
                                                className="w-12 h-12 object-cover rounded-lg border border-zinc-800"
                                            />
                                        ))}
                                        {order.items?.length > 3 && (
                                            <div className="w-12 h-12 bg-zinc-800 flex items-center justify-center text-xs rounded-lg">
                                                +{order.items.length - 3}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-sm opacity-60">Total</p>
                                        <p>NPR {order.totalAmount}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm opacity-60">Status</p>
                                        <span
                                            className={`text-xs px-3 py-1 rounded-full border ${getStatusStyle(order.orderStatus)}`}
                                        >
                                            {order.orderStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* ===== SMOOTH ANIMATED ACCORDION ===== */}
                            <div
                                className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                                    }`}
                            >
                                <div className="border-t border-zinc-800 p-6 space-y-4">

                                    {(order.items || []).map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-4"
                                        >
                                            <img
                                                src={`http://localhost:4242${item.image}`}
                                                alt=""
                                                className="w-16 h-16 object-cover rounded-lg"
                                            />
                                            <div>
                                                <p>{item.name}</p>
                                                <p className="text-sm opacity-60">
                                                    Qty: {item.quantity}
                                                </p>
                                            </div>
                                            <div className="ml-auto">
                                                NPR {item.price}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="border-t border-zinc-800 pt-4 text-sm opacity-70">
                                        <p>
                                            <span className="opacity-60">
                                                Shipping Address:
                                            </span>{" "}
                                            {order.shippingAddress}
                                        </p>

                                        <p>
                                            <span className="opacity-60">
                                                Order Date:
                                            </span>{" "}
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* ===== ACTION BUTTONS ===== */}
                                    <div className="flex flex-wrap gap-4 pt-4 border-t border-zinc-800">

                                        <button
                                            onClick={() => handleReorder(order._id)}
                                            className="border px-6 py-2 text-sm hover:bg-white hover:text-black transition"
                                        >
                                            REORDER
                                        </button>

                                        {order.orderStatus?.toLowerCase() === "delivered" && (
                                            <button
                                                onClick={() => handleReturn(order._id)}
                                                className="border border-red-500 text-red-400 px-6 py-2 text-sm hover:bg-red-600 hover:text-white transition"
                                            >
                                                REQUEST RETURN
                                            </button>
                                        )}
                                    </div>

                                </div>
                            </div>

                        </div>
                    );
                })}
            </div>
        </div>
    );
}