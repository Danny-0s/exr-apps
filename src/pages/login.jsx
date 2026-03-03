import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authcontext";
import { GoogleLogin } from "@react-oauth/google";
import API_BASE_URL from "../utils/api";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    /* ================= VALIDATION ================= */

    const validate = () => {
        if (!email) return "Email is required";
        if (!/\S+@\S+\.\S+/.test(email)) return "Invalid email format";
        if (!password) return "Password is required";
        if (password.length < 6)
            return "Password must be at least 6 characters";
        return null;
    };

    /* ================= NORMAL LOGIN ================= */

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Login failed");
                return;
            }

            login(data.token);
            navigate("/");
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    /* ================= GOOGLE LOGIN ================= */

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setLoading(true);
            setError("");

            const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    credential: credentialResponse.credential,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Google login failed");
                return;
            }

            login(data.token);
            navigate("/");
        } catch (err) {
            setError("Google authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
            <div className="w-full max-w-md">

                {/* TITLE */}
                <h1 className="text-4xl font-serif text-center mb-2">
                    Sign In
                </h1>

                <p className="text-center text-zinc-400 mb-10">
                    Welcome back to EXR
                </p>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* EMAIL */}
                    <div>
                        <label className="text-xs tracking-widest text-zinc-500">
                            EMAIL
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`
                                w-full bg-black
                                border-b border-zinc-700
                                px-0 py-3 mt-2
                                outline-none
                                transition-all duration-300
                                focus:border-red-500
                            `}
                            placeholder="you@example.com"
                        />
                    </div>

                    {/* PASSWORD */}
                    <div>
                        <label className="text-xs tracking-widest text-zinc-500">
                            PASSWORD
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`
                                w-full bg-black
                                border-b border-zinc-700
                                px-0 py-3 mt-2
                                outline-none
                                transition-all duration-300
                                focus:border-red-500
                            `}
                            placeholder="••••••••"
                        />
                    </div>

                    {/* ERROR */}
                    {error && (
                        <div className="text-red-500 text-sm text-center animate-pulse">
                            {error}
                        </div>
                    )}

                    {/* BUTTON */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="
                            w-full
                            bg-white
                            text-black
                            py-4
                            tracking-widest
                            transition-all duration-300
                            hover:bg-red-500
                            hover:text-white
                        "
                    >
                        {loading ? "Signing In..." : "SIGN IN"}
                    </button>
                </form>

                {/* DIVIDER */}
                <div className="flex items-center my-8">
                    <div className="flex-1 h-px bg-zinc-700"></div>
                    <span className="px-4 text-zinc-500 text-xs tracking-widest">
                        OR CONTINUE WITH
                    </span>
                    <div className="flex-1 h-px bg-zinc-700"></div>
                </div>

                {/* GOOGLE LOGIN */}
                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError("Google login failed")}
                        theme="outline"
                        size="large"
                    />
                </div>

                <div className="text-center mt-8 text-zinc-500 text-sm">
                    Forgot password?
                </div>

                <div className="text-center mt-4 text-zinc-400 text-sm">
                    Don't have an account?{" "}
                    <span className="text-white hover:text-red-500 cursor-pointer transition">
                        Sign Up
                    </span>
                </div>

            </div>
        </div>
    );
}