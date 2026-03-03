import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { userFetch } from "../utils/userFetch";

export default function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await userFetch("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Registration failed");
            }

            // ✅ Auto login
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            navigate("/orders");

        } catch (err) {
            setError(err.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
            <form
                onSubmit={handleRegister}
                className="w-full max-w-md border border-zinc-800 p-8 space-y-6"
            >
                <h1 className="text-3xl tracking-widest">
                    REGISTER
                </h1>

                {error && (
                    <p className="text-red-500 text-sm">
                        {error}
                    </p>
                )}

                <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-black border border-zinc-700 p-3 outline-none focus:border-white"
                />

                <input
                    type="email"
                    placeholder="Email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-black border border-zinc-700 p-3 outline-none focus:border-white"
                />

                <input
                    type="password"
                    placeholder="Password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black border border-zinc-700 p-3 outline-none focus:border-white"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full border border-white py-3 tracking-widest hover:bg-white hover:text-black transition"
                >
                    {loading ? "Creating…" : "REGISTER"}
                </button>

                <p className="text-sm opacity-60">
                    Already have an account?{" "}
                    <Link to="/login" className="underline">
                        Login
                    </Link>
                </p>
            </form>
        </div>
    );
}