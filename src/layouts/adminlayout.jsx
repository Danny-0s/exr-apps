import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [adminRole, setAdminRole] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("adminToken");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                setAdminRole(payload.role);
            } catch (err) {
                console.error("Invalid token");
            }
        }
    }, []);

    const logout = () => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminRefreshToken");
        navigate("/admin/login");
    };

    const isActive = path =>
        location.pathname === path
            ? "text-white font-semibold"
            : "text-white/60 hover:text-white";

    return (
        <div className="min-h-screen flex bg-black text-white">
            {/* SIDEBAR */}
            <aside className="w-64 border-r border-white/10 p-6">
                <h2 className="text-xl mb-8 tracking-widest">
                    ADMIN
                </h2>

                <nav className="flex flex-col gap-4 text-sm">

                    <Link to="/admin" className={isActive("/admin")}>
                        Dashboard
                    </Link>

                    <Link to="/admin/products" className={isActive("/admin/products")}>
                        Products
                    </Link>

                    <Link to="/admin/orders" className={isActive("/admin/orders")}>
                        Orders
                    </Link>

                    <Link to="/admin/coupons" className={isActive("/admin/coupons")}>
                        Coupons
                    </Link>

                    <Link to="/admin/wallet" className={isActive("/admin/wallet")}>
                        Wallet
                    </Link>

                    <Link to="/admin/settings" className={isActive("/admin/settings")}>
                        Settings
                    </Link>

                    {/* 🔥 SUPER ADMIN ONLY */}
                    {adminRole === "super_admin" && (
                        <Link
                            to="/admin/team"
                            className={isActive("/admin/team")}
                        >
                            Team Management
                        </Link>
                    )}

                    <Link to="/" className="text-white/60 hover:text-white">
                        View Store
                    </Link>

                    <button
                        onClick={logout}
                        className="mt-8 text-left text-red-400 hover:text-red-300"
                    >
                        Logout
                    </button>
                </nav>
            </aside>

            {/* CONTENT */}
            <main className="flex-1 p-10">
                <Outlet />
            </main>
        </div>
    );
}