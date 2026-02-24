import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API_BASE_URL from "../utils/api";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* ❤️ LOCAL WAITLIST */
    const [waitlisted, setWaitlisted] = useState([]);

    const [searchParams] = useSearchParams();

    /* ================= HERO FILTER ================= */
    const heroIds = useMemo(() => {
        const ids = searchParams.get("ids");
        return ids ? ids.split(",") : null;
    }, [searchParams]);

    /* ================= LOAD PRODUCTS ================= */
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/products`);
                if (!res.ok) throw new Error("Failed to fetch products");

                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Products page error:", err);
                setError("Failed to load products");
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);

    /* ================= LOAD WAITLIST ================= */
    useEffect(() => {
        const stored =
            JSON.parse(localStorage.getItem("waitlistedProducts")) || [];
        setWaitlisted(stored);
    }, []);

    /* ================= FILTER FOR HERO ================= */
    const visibleProducts = useMemo(() => {
        if (!heroIds) return products;
        return products.filter(p => heroIds.includes(p._id));
    }, [products, heroIds]);

    /* ================= TOGGLE WAITLIST ================= */
    const toggleWaitlist = (e, productId) => {
        e.preventDefault();
        e.stopPropagation();

        let updated;

        if (waitlisted.includes(productId)) {
            updated = waitlisted.filter(id => id !== productId);
        } else {
            updated = [...waitlisted, productId];
        }

        localStorage.setItem(
            "waitlistedProducts",
            JSON.stringify(updated)
        );
        setWaitlisted(updated);

        window.dispatchEvent(new Event("waitlist-updated"));
    };

    /* ================= LOADING ================= */
    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                Loading products…
            </div>
        );
    }

    /* ================= ERROR ================= */
    if (error) {
        return (
            <div className="min-h-screen bg-black text-red-500 flex items-center justify-center">
                {error}
            </div>
        );
    }

    /* ================= EMPTY ================= */
    if (visibleProducts.length === 0) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center opacity-60">
                No products found
            </div>
        );
    }

    /* ================= RENDER ================= */
    return (
        <div className="min-h-screen bg-black text-white px-6 md:px-12 py-16">
            <h1 className="text-3xl tracking-[0.35em] text-center mb-16">
                PRODUCTS
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
                {visibleProducts.map(product => {
                    const image =
                        Array.isArray(product.images) &&
                            product.images.length > 0
                            ? product.images[0]
                            : null;

                    const isWaitlisted =
                        waitlisted.includes(product._id);

                    const showHeart = product.stock !== 0;

                    return (
                        <Link
                            key={product._id}
                            to={`/products/${product._id}`}
                            className="group relative border border-zinc-800 p-4 hover:border-white transition"
                        >
                            {/* ❤️ HEART */}
                            {showHeart && (
                                <button
                                    onClick={e =>
                                        toggleWaitlist(e, product._id)
                                    }
                                    className={`absolute top-3 right-3 z-10 text-xl transition ${isWaitlisted
                                            ? "text-red-500"
                                            : "opacity-50 hover:opacity-100"
                                        }`}
                                    aria-label="Toggle waitlist"
                                >
                                    ❤️
                                </button>
                            )}

                            {image && (
                                <div className="mb-4 overflow-hidden">
                                    <img
                                        src={`${API_BASE_URL}${image}`}
                                        alt={product.title}
                                        className="w-full h-48 object-cover transition group-hover:scale-105"
                                    />
                                </div>
                            )}

                            <h2 className="text-sm tracking-wide mb-1">
                                {product.title}
                            </h2>

                            <p className="text-sm opacity-60">
                                ${product.price}
                            </p>

                            {product.stock === 0 && (
                                <p className="text-xs text-red-500 mt-1">
                                    SOLD OUT
                                </p>
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}