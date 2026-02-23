import { useEffect, useState } from "react";
import { Mail, Instagram, Music2 } from "lucide-react";
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

    /* ===============================
       LOAD CONTACT
    ================================ */
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

    /* ===============================
       FORM HANDLING
    ================================ */
    const handleChange = e => {
        setForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async e => {
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

    /* ===============================
       STATES
    ================================ */
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

    /* ===============================
       RENDER
    ================================ */
    return (
        <div className="relative min-h-screen bg-black text-white overflow-hidden">

            {/* 🔴 FLOATING RED GLOW BACKGROUND */}
            <div className="absolute inset-0 pointer-events-none">

                <div className="absolute top-32 left-[-150px] w-[450px] h-[450px] bg-red-600 opacity-25 blur-[200px] glow-animate" />

                <div className="absolute bottom-24 right-[-150px] w-[450px] h-[450px] bg-red-600 opacity-20 blur-[200px] glow-animate-reverse" />

            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-20 py-20 md:py-28">

                {/* LABEL */}
                <p className="tracking-[6px] text-xs md:text-sm text-gray-500 mb-6 uppercase">
                    GET IN TOUCH
                </p>

                {/* TITLE */}
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                    {data?.title ? (
                        <>
                            {data.title} <span className="text-red-600">.</span>
                        </>
                    ) : (
                        <>
                            Talk To The <span className="text-red-600">Brand.</span>
                        </>
                    )}
                </h1>

                {/* SUBTITLE */}
                <p className="text-gray-400 max-w-xl mb-14 leading-relaxed">
                    {data?.subtitle ||
                        "For inquiries regarding orders, collaborations, or general questions. We respond within 24 hours."}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

                    {/* LEFT SIDE */}
                    <div className="space-y-8">

                        {data?.email && (
                            <a
                                href={`mailto:${data.email}`}
                                className="flex items-center gap-6 group"
                            >
                                <div className="w-14 h-14 flex items-center justify-center rounded-full border border-red-600 shadow-[0_0_25px_rgba(220,38,38,0.6)]">
                                    <Mail className="text-red-500" />
                                </div>
                                <span className="text-lg text-gray-300 group-hover:text-white transition">
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
                                <div className="w-14 h-14 flex items-center justify-center rounded-full border border-gray-700 group-hover:border-red-600 transition">
                                    <Instagram className="text-gray-400 group-hover:text-red-500 transition" />
                                </div>
                                <span className="text-lg text-gray-300 group-hover:text-white transition">
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
                                <div className="w-14 h-14 flex items-center justify-center rounded-full border border-gray-700 group-hover:border-red-600 transition">
                                    <Music2 className="text-gray-400 group-hover:text-red-500 transition" />
                                </div>
                                <span className="text-lg text-gray-300 group-hover:text-white transition">
                                    TikTok
                                </span>
                            </a>
                        )}
                    </div>

                    {/* RIGHT SIDE FORM */}
                    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">

                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Name"
                            required
                            className="w-full bg-transparent border border-red-600 rounded-lg px-5 py-4 focus:outline-none focus:ring-2 focus:ring-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                        />

                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Email"
                            required
                            className="w-full bg-transparent border border-red-600 rounded-lg px-5 py-4 focus:outline-none focus:ring-2 focus:ring-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                        />

                        <textarea
                            name="message"
                            value={form.message}
                            onChange={handleChange}
                            rows="4"
                            placeholder="Message"
                            required
                            className="w-full bg-transparent border border-red-600 rounded-lg px-5 py-4 focus:outline-none focus:ring-2 focus:ring-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                        />

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full py-4 rounded-lg border border-red-600 text-white tracking-widest font-semibold 
                            shadow-[0_0_30px_rgba(220,38,38,0.8)]
                            hover:bg-red-600 hover:shadow-[0_0_45px_rgba(220,38,38,1)]
                            transition-all duration-300"
                        >
                            {sending ? "SENDING..." : "SEND"}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}