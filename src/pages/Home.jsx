import { useEffect, useState } from "react";
import SectionRenderer from "../components/homepage/SectionRenderer";
import SplitHero from "../components/SplitHero";
import API_BASE_URL from "../utils/api";   // ✅ ADD THIS

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
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                Loading EXR…
            </div>
        );
    }

    /* ================= MAIN RENDER ================= */
    return (
        <div className="bg-black text-white">

            {/* 🔥 SPLIT HERO — ALWAYS FIRST */}
            <SplitHero />

            {/* 🔥 ADMIN CONTROLLED SECTIONS BELOW */}
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
    );
}