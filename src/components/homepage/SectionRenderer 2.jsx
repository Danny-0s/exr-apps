import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { FaInstagram, FaTiktok, FaEnvelope } from "react-icons/fa";

/* ===============================
   HELPERS
================================ */
const extractIds = items =>
    Array.isArray(items)
        ? items
            .map(p => (typeof p === "string" ? p : p?._id))
            .filter(Boolean)
        : [];

/* ===============================
   HERO – CLASSIC / FLOATING
================================ */
function HeroClassic({ data }) {
    const navigate = useNavigate();
    if (!data) return null;

    const {
        heroTitle,
        heroSubtitle,
        heroBackground,
        heroButtonText = "SHOP NOW",
        heroButtonLink = "/products",
        heroProducts = [],
    } = data;

    const ids = extractIds(heroProducts);

    const onShopNow = () => {
        if (ids.length) {
            navigate(`/products?ids=${ids.join(",")}`);
        } else {
            navigate(heroButtonLink);
        }
    };

    return (
        <section
            className="relative w-full min-h-screen flex items-center justify-center px-6"
            style={
                heroBackground
                    ? {
                        backgroundImage: `url(http://localhost:4242${heroBackground})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }
                    : {}
            }
        >
            <div className="absolute inset-0 bg-black/70" />

            <div className="relative z-10 text-center max-w-4xl">
                {heroTitle && (
                    <h1 className="text-5xl tracking-[0.35em] mb-6">
                        {heroTitle}
                    </h1>
                )}

                {heroSubtitle && (
                    <p className="opacity-70 tracking-widest mb-12">
                        {heroSubtitle}
                    </p>
                )}

                <Button variant="outline" onClick={onShopNow}>
                    {heroButtonText}
                </Button>
            </div>
        </section>
    );
}

/* ===============================
   HERO – PRODUCTS (PER HERO)
================================ */
function HeroProducts({ data }) {
    if (!data?.heroProducts?.length) {
        return <HeroClassic data={data} />;
    }

    return (
        <section className="min-h-screen bg-black text-white px-10 py-32">
            <h1 className="text-4xl tracking-widest mb-16 text-center">
                {data.heroTitle}
            </h1>

            <div className="grid md:grid-cols-3 gap-10">
                {data.heroProducts.map(p => (
                    <div
                        key={p._id || p}
                        className="border border-zinc-800 p-6 text-center"
                    >
                        <p className="tracking-widest">
                            {p.title || "PRODUCT"}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}

/* ===============================
   CONTACT – BASE44 STYLE
================================ */
function ContactSection({ data }) {
    if (!data) return null;

    const {
        title = "Talk To The Brand.",
        subtitle,
        email,
        instagram,
        tiktok,
    } = data;

    return (
        <section className="min-h-screen bg-black text-white px-6 md:px-20 py-32">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20">
                {/* LEFT */}
                <div>
                    <p className="tracking-widest text-sm opacity-70 mb-6">
                        GET IN TOUCH
                    </p>

                    <h1 className="text-5xl mb-8">{title}</h1>

                    {subtitle && (
                        <p className="opacity-70 mb-10">{subtitle}</p>
                    )}

                    {email && (
                        <div className="flex items-center gap-4 mb-6">
                            <FaEnvelope />
                            <span>{email}</span>
                        </div>
                    )}

                    {instagram && (
                        <div className="flex items-center gap-4 mb-4">
                            <FaInstagram />
                            <span>{instagram}</span>
                        </div>
                    )}

                    {tiktok && (
                        <div className="flex items-center gap-4">
                            <FaTiktok />
                            <span>{tiktok}</span>
                        </div>
                    )}
                </div>

                {/* RIGHT */}
                <form
                    className="border border-zinc-800 p-10"
                    onSubmit={e => e.preventDefault()}
                >
                    <input
                        placeholder="NAME"
                        className="w-full mb-4 p-3 bg-transparent border"
                    />
                    <input
                        placeholder="EMAIL"
                        className="w-full mb-4 p-3 bg-transparent border"
                    />
                    <textarea
                        placeholder="MESSAGE"
                        rows={5}
                        className="w-full mb-6 p-3 bg-transparent border"
                    />

                    <button
                        type="submit"
                        className="w-full border py-3 tracking-widest hover:bg-white hover:text-black transition"
                    >
                        SEND →
                    </button>
                </form>
            </div>
        </section>
    );
}

/* ===============================
   SECTION RENDERER (FINAL)
================================ */
export default function SectionRenderer({ section }) {
    if (!section || section.enabled === false) return null;

    if (section.type === "hero") {
        switch (section.data?.heroLayout) {
            case "products":
                return <HeroProducts data={section.data} />;
            case "classic":
            case "floating":
            default:
                return <HeroClassic data={section.data} />;
        }
    }

    if (section.type === "contact") {
        return <ContactSection data={section.data} />;
    }

    return null;
}