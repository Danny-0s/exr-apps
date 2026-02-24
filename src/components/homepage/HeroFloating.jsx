import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import API_BASE_URL from "../utils/api";

export default function HeroFloating({ data }) {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [visible, setVisible] = useState(false);

    const {
        heroTitle,
        heroSubtitle,
        heroBackground,
        heroButtonText = "SHOP NOW",
        heroButtonLink = "/products",
        heroProducts = [],
    } = data || {};

    /* ===============================
       LOAD PRODUCTS BY ID
    ================================ */
    useEffect(() => {
        let mounted = true;

        if (!Array.isArray(heroProducts) || heroProducts.length === 0) {
            setProducts([]);
            return;
        }

        Promise.all(
            heroProducts.map(id =>
                fetch(`${API_BASE_URL}/api/products/${id}`)
                    .then(res => (res.ok ? res.json() : null))
                    .catch(() => null)
            )
        ).then(result => {
            if (!mounted) return;
            setProducts(result.filter(Boolean));
        });

        return () => {
            mounted = false;
        };
    }, [heroProducts]);

    /* FADE IN */
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 150);
        return () => clearTimeout(t);
    }, []);

    return (
        <section
            className="relative min-h-screen flex items-center px-6 md:px-20 overflow-hidden"
            style={{
                backgroundImage: heroBackground
                    ? `url(${API_BASE_URL}${heroBackground})`
                    : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            <div className="absolute inset-0 bg-black/55" />

            {/* TEXT */}
            <div
                className={`relative z-10 max-w-xl transition-all duration-1000 ${visible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-6"
                    }`}
            >
                {heroTitle && (
                    <h1 className="text-4xl md:text-6xl tracking-[0.35em] mb-6">
                        {heroTitle}
                    </h1>
                )}

                {heroSubtitle && (
                    <p className="opacity-70 tracking-widest mb-12">
                        {heroSubtitle}
                    </p>
                )}

                <Button
                    variant="outline"
                    onClick={() => navigate(heroButtonLink)}
                >
                    {heroButtonText}
                </Button>
            </div>

            {/* FLOATING PRODUCTS */}
            {products.length > 0 && (
                <div className="absolute right-6 md:right-20 bottom-16 flex gap-6">
                    {products.slice(0, 3).map((p, i) => (
                        <div
                            key={p._id}
                            onClick={() => navigate(`/products/${p._id}`)}
                            className={`w-40 bg-black/60 backdrop-blur border border-zinc-700
                                cursor-pointer hover:border-white transition-all duration-700 ${visible
                                    ? "opacity-100 translate-y-0"
                                    : "opacity-0 translate-y-6"
                                }`}
                            style={{ transitionDelay: `${i * 150}ms` }}
                        >
                            {p?.images?.[0] && (
                                <img
                                    src={`${API_BASE_URL}${p.images[0]}`}
                                    alt={p.title || "product"}
                                    className="w-full h-48 object-cover"
                                />
                            )}

                            <div className="p-3">
                                <p className="text-xs tracking-widest mb-1">
                                    {p.title}
                                </p>
                                <p className="text-xs opacity-60">
                                    ${p.price}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}