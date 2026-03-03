import { useEffect, useState } from "react";
import SectionRenderer from "../components/homepage/SectionRenderer";
import SplitHero from "../components/SplitHero";
import API_BASE_URL from "../utils/api";

export default function Home() {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/homepage`);
                const data = await res.json();

                if (!mounted) return;

                const resolvedSections = (data.sections || [])
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

                setSections(resolvedSections);
            } catch (err) {
                console.error("Homepage load failed", err);
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
            <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 text-center">
                <div className="animate-pulse text-lg md:text-2xl tracking-widest">
                    Loading EXR…
                </div>
            </div>
        );
    }

    /* ================= MAIN RENDER ================= */
    return (
        <div className="bg-black text-white w-full overflow-x-hidden">

            {/* 🔥 SPLIT HERO — ALWAYS FIRST */}
            <div className="w-full">
                <SplitHero />
            </div>

            {/* 🔥 ADMIN CONTROLLED SECTIONS */}
            <div className="w-full">
                {sections
                    .filter(
                        section =>
                            section.enabled !== false &&
                            section.type !== "contact"
                    )
                    .map(section => (
                        <SectionRenderer
                            key={section._id}
                            section={section}
                        />
                    ))}
            </div>

            {/* 🔥 SMALL END STRIP (QUOTE ONLY) */}
            <section className="w-full bg-black border-t border-zinc-900 py-20 px-6">

                <div className="max-w-5xl mx-auto text-center">

                    <p className="
                        font-serif
                        text-lg
                        sm:text-xl
                        md:text-2xl
                        text-white
                    ">
                        “We don't follow trends.
                        <span className="text-red-500"> We set them.</span>”
                    </p>

                    <div className="
                        mt-10
                        text-xs
                        tracking-[0.35em]
                        text-zinc-500
                    ">
                        KATHMANDU — EST. 2026
                    </div>

                </div>

            </section>

        </div>
    );
}