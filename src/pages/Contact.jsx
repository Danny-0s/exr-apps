import { useEffect, useState } from "react";
import { FaEnvelope, FaInstagram, FaTiktok } from "react-icons/fa";
import API_BASE_URL from "../utils/api";

export default function Contact() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        name: "",
        email: "",
        message: "",
    });

    /* ================= LOAD CONTACT ================= */
    useEffect(() => {
        const loadContact = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/contact`);
                if (!res.ok) throw new Error("Contact not available");

                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error(err);
                setError("Contact not available");
            } finally {
                setLoading(false);
            }
        };

        loadContact();
    }, []);

    /* ================= FORM HANDLERS ================= */
    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        setError("");

        try {
            const res = await fetch(`${API_BASE_URL}/api/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to send message");

            alert("Message sent successfully ✉️");
            setForm({ name: "", email: "", message: "" });
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                {error}
            </div>
        );
    }

    return (
        <section className="bg-black text-white px-6 md:px-20 py-20 md:py-28">

            <div className="max-w-4xl mx-auto">

                {/* LABEL */}
                <p className="text-xs tracking-[0.4em] text-zinc-500 uppercase mb-8">
                    GET IN TOUCH
                </p>

                {/* TITLE */}
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-10">
                    Talk To The Brand.
                </h1>

                {/* DESCRIPTION */}
                <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-12 max-w-2xl">
                    {data?.subtitle ||
                        "For inquiries regarding orders, collaborations, or general questions. We respond within 24 hours."}
                </p>

                {/* CONTACT LINKS */}
                <div className="space-y-8 mb-16">

                    {data?.email && (
                        <a
                            href={`mailto:${data.email}`}
                            className="flex items-center gap-6 group"
                        >
                            <span className="icon-circle glow">
                                <FaEnvelope />
                            </span>
                            <span className="text-lg text-zinc-300 group-hover:text-white transition">
                                {data.email}
                            </span>
                        </a>
                    )}

                    {data?.instagram && (
                        <a
                            href={data.instagram}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-6 group"
                        >
                            <span className="icon-circle">
                                <FaInstagram />
                            </span>
                            <span className="text-lg text-zinc-300 group-hover:text-white transition">
                                Instagram
                            </span>
                        </a>
                    )}

                    {data?.tiktok && (
                        <a
                            href={data.tiktok}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-6 group"
                        >
                            <span className="icon-circle">
                                <FaTiktok />
                            </span>
                            <span className="text-lg text-zinc-300 group-hover:text-white transition">
                                TikTok
                            </span>
                        </a>
                    )}
                </div>

                {/* FORM */}
                <form
                    onSubmit={handleSubmit}
                    className="border border-zinc-800 p-6 md:p-10 space-y-6"
                >
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Name"
                        className="w-full p-4 bg-transparent border border-zinc-700 focus:border-white outline-none transition"
                        required
                    />

                    <input
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Email"
                        type="email"
                        className="w-full p-4 bg-transparent border border-zinc-700 focus:border-white outline-none transition"
                        required
                    />

                    <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        placeholder="Message"
                        rows={5}
                        className="w-full p-4 bg-transparent border border-zinc-700 focus:border-white outline-none transition"
                        required
                    />

                    <button
                        disabled={sending}
                        className="w-full border border-white py-4 tracking-[0.3em] text-sm hover:bg-white hover:text-black transition duration-300"
                    >
                        {sending ? "SENDING..." : "SEND"}
                    </button>
                </form>

            </div>

            {/* ICON STYLES */}
            <style>{`
                .icon-circle {
                    width: 56px;
                    height: 56px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 9999px;
                    border: 1px solid rgba(255,255,255,0.3);
                    transition: all 0.3s ease;
                }

                .icon-circle svg {
                    font-size: 20px;
                }

                .group:hover .icon-circle {
                    border-color: white;
                    transform: scale(1.05);
                }

                .glow {
                    box-shadow: 0 0 20px rgba(255,255,255,0.3);
                }
            `}</style>

        </section>
    );
}