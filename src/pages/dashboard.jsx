import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { userFetch } from "../utils/userFetch";

export default function UserDashboard() {
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [wishlistCount, setWishlistCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        loadDashboard();
    }, []);

    /* ================= LOAD DASHBOARD ================= */
    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            /* ===== PROFILE ===== */
            const profileData = await userFetch("/api/auth/profile");
            if (!profileData) return;
            setUser(profileData);

            /* ===== ORDERS ===== */
            const ordersData = await userFetch("/api/orders/my-orders");
            if (ordersData) {
                setOrders(ordersData.orders || []);
            }

            /* ===== WISHLIST ===== */
            const wishlistData = await userFetch("/api/wishlist");
            if (wishlistData) {
                setWishlistCount(wishlistData.items?.length || 0);
            }

        } catch (err) {
            setError(err.message || "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <p className="text-white/60 tracking-widest">
                    Loading dashboard...
                </p>
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
        <div className="min-h-screen bg-black text-white px-6 md:px-16 py-16">

            <div className="mb-16">
                <p className="text-white/50 tracking-widest text-sm">
                    USER DASHBOARD
                </p>
                <h1 className="text-4xl font-bold mt-2">
                    Welcome, {user?.name}
                </h1>
            </div>

            <div className="grid md:grid-cols-4 gap-8 mb-16">
                <DashboardCard
                    title="WALLET BALANCE"
                    value={`Rs ${user?.walletBalance?.toLocaleString() || 0}`}
                    color="text-green-400"
                />

                <DashboardCard
                    title="TOTAL ORDERS"
                    value={orders.length}
                />

                <DashboardCard
                    title="WISHLIST ITEMS"
                    value={wishlistCount}
                />

                <DashboardCard
                    title="ACCOUNT STATUS"
                    value={user?.isActive ? "ACTIVE" : "BLOCKED"}
                    color={user?.isActive ? "text-green-400" : "text-red-500"}
                />
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-16">
                <DashboardLink to="/orders" label="MY ORDERS" />
                <DashboardLink to="/wallet" label="MY WALLET" />
                <DashboardLink to="/coupons" label="MY COUPONS" />
                <DashboardLink to="/wishlist" label="MY WISHLIST" />
            </div>

            <div className="mb-16">
                <h2 className="text-xl mb-6 tracking-widest">
                    RECENT ORDERS
                </h2>

                {orders.length === 0 ? (
                    <p className="text-white/40">
                        No orders yet.
                    </p>
                ) : (
                    orders.slice(0, 3).map(order => (
                        <div
                            key={order._id}
                            className="border border-white/10 p-6 mb-4 rounded-xl"
                        >
                            <p className="text-xs text-white/40 mb-2">
                                ORDER ID
                            </p>
                            <p className="text-xs break-all opacity-80 mb-3">
                                {order._id}
                            </p>

                            <p className="mb-2">
                                Total: Rs {order.totalAmount}
                            </p>

                            <p className="text-sm opacity-60">
                                Status: {order.orderStatus?.toUpperCase()}
                            </p>
                        </div>
                    ))
                )}
            </div>

            <button
                onClick={logout}
                className="border border-red-500 text-red-500 px-6 py-3 tracking-widest hover:bg-red-500 hover:text-black transition"
            >
                LOGOUT
            </button>
        </div>
    );
}

function DashboardCard({ title, value, color = "text-white" }) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <p className="text-sm text-white/50 tracking-widest mb-2">
                {title}
            </p>
            <p className={`text-3xl font-bold ${color}`}>
                {value}
            </p>
        </div>
    );
}

function DashboardLink({ to, label }) {
    return (
        <Link
            to={to}
            className="border border-white/10 p-6 hover:bg-white hover:text-black transition tracking-widest text-center"
        >
            {label} →
        </Link>
    );
}