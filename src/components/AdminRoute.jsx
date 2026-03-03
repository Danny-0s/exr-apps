import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import API_BASE_URL from "../utils/api";

export default function AdminRoute({ children }) {
    const location = useLocation();
    const [checking, setChecking] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem("adminToken");

            if (!token) {
                setAuthorized(false);
                setChecking(false);
                return;
            }

            try {
                const res = await fetch(
                    `${API_BASE_URL}/api/admin/verify`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!res.ok) {
                    throw new Error("Invalid token");
                }

                const data = await res.json();

                // Save role safely (optional use elsewhere)
                if (data?.role) {
                    localStorage.setItem("adminRole", data.role);
                }

                setAuthorized(true);

            } catch (err) {
                // Token invalid or expired
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminRefreshToken");
                localStorage.removeItem("adminRole");

                setAuthorized(false);
            } finally {
                setChecking(false);
            }
        };

        verifyToken();
    }, []); // ✅ run only once

    // ⏳ Loading state
    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                Checking authentication...
            </div>
        );
    }

    // 🔒 Not authorized → go to ADMIN login
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