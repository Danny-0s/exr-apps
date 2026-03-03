import { useEffect, useState } from "react";
import { FaInstagram, FaTiktok } from "react-icons/fa";
import API_BASE from "../utils/api";

export default function Profiles() {
    const [profiles, setProfiles] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/homepage`);
                const data = await res.json();

                if (!mounted) return;

                const contactSection = (data.sections || []).find(
                    s => s.type === "contact" && s.enabled !== false
                );

                setProfiles(contactSection?.data || null);
            } catch (err) {
                console.error("Profiles load failed", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, []);

    /* ================= LOADING ================= */
    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                Loading…
            </div>
        );
    }

    /* ================= EMPTY ================= */
    if (!profiles) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center opacity-70">
                No profile data available
            </div>
        );
    }

    const {
        profileImage,
        profileTitle = "EXR Savage Streetwear",
        profileDescription,
        instagram,
        tiktok,
    } = profiles;

    return (
        <div className="min-h-screen bg-black text-white px-6 md:px-20 py-32">
            <div className="max-w-5xl mx-auto text-center">

                {/* ================= PROFILE CARD ================= */}
                <div
                    className="
                        mx-auto mb-24 max-w-md p-10 rounded-2xl
                        border border-zinc-800
                        transition-all duration-300 ease-out
                        hover:scale-[1.03]
                        hover:border-white
                        hover:shadow-[0_0_60px_rgba(255,255,255,0.18)]
                    "
                >
                    {profileImage && (
                        <img
                            src={`${API_BASE}${profileImage}`}
                            alt="EXR Profile"
                            className="
                                w-28 h-28 mx-auto rounded-xl mb-6
                                object-cover
                                transition-transform duration-300
                                hover:scale-105
                            "
                        />
                    )}

                    <h1 className="text-2xl tracking-widest mb-4">
                        {profileTitle}
                    </h1>

                    {profileDescription && (
                        <p className="opacity-70 text-sm leading-relaxed">
                            {profileDescription}
                        </p>
                    )}
                </div>

                {/* ================= SOCIALS ================= */}
                {(instagram || tiktok) && (
                    <>
                        <p className="text-xs tracking-widest opacity-60 mb-4">
                            OUR SOCIALS
                        </p>

                        <h2 className="text-4xl tracking-[0.35em] mb-16">
                            PROFILES
                        </h2>

                        <div className="grid md:grid-cols-2 gap-12">

                            {instagram && (
                                <a
                                    href={instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="
                                        group border border-zinc-800 p-12
                                        transition-all duration-300 ease-out
                                        hover:border-white
                                        hover:-translate-y-2
                                        hover:shadow-[0_0_45px_rgba(255,255,255,0.25)]
                                    "
                                >
                                    <FaInstagram className="text-5xl mx-auto mb-6 opacity-70 group-hover:opacity-100 transition" />
                                    <h3 className="tracking-widest">
                                        INSTAGRAM
                                    </h3>
                                </a>
                            )}

                            {tiktok && (
                                <a
                                    href={tiktok}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="
                                        group border border-zinc-800 p-12
                                        transition-all duration-300 ease-out
                                        hover:border-white
                                        hover:-translate-y-2
                                        hover:shadow-[0_0_45px_rgba(255,255,255,0.25)]
                                    "
                                >
                                    <FaTiktok className="text-5xl mx-auto mb-6 opacity-70 group-hover:opacity-100 transition" />
                                    <h3 className="tracking-widest">
                                        TIKTOK
                                    </h3>
                                </a>
                            )}

                        </div>
                    </>
                )}
            </div>
        </div>
    );
}