import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import API_BASE_URL from "../utils/api";

export default function AdminRoute({ children }) {
    const location = useLocation();
    const [checking, setChecking] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    const token = localStorage.getItem("adminToken");

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setAuthorized(false);
                setChecking(false);
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/verify`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) {
                    throw new Error("Invalid token");
                }

                setAuthorized(true);
            } catch (err) {
                // ❌ Token invalid or expired → clear everything
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminRefreshToken");
                localStorage.removeItem("adminRole");

                setAuthorized(false);
            } finally {
                setChecking(false);
            }
        };

        verifyToken();
    }, [token]);

    // ⏳ While checking token
    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                Checking authentication...
            </div>
        );
    }

    // 🔒 Not authorized → redirect to login
    if (!authorized) {
        return (
            <Navigate
                to="/admin/login"
                replace
                state={{ from: location }}
            />
        );
    }

    // ✅ Authorized
    return children;
}