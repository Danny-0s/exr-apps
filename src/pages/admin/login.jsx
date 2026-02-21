import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../utils/api";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const login = async () => {
        if (!email || !password) {
            alert("Enter email and password");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Login failed");
                return;
            }

            // ✅ SAVE TOKENS (unchanged)
            localStorage.setItem("adminToken", data.accessToken);
            localStorage.setItem("adminRefreshToken", data.refreshToken);

            // ✅ SAVE ROLE (SAFE + CORRECT)
            if (data.admin && data.admin.role) {
                localStorage.setItem("adminRole", data.admin.role);
            }

            // ✅ GO TO ADMIN
            navigate("/admin");

        } catch (err) {
            alert("Server error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="space-y-4 w-80">
                <h1 className="text-2xl font-semibold">Admin Login</h1>

                <input
                    className="w-full border bg-black px-3 py-2"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    className="w-full border bg-black px-3 py-2"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    onClick={login}
                    disabled={loading}
                    className="border px-4 py-2 w-full"
                >
                    {loading ? "Logging in..." : "LOGIN"}
                </button>
            </div>
        </div>
    );
}