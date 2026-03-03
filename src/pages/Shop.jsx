import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatNPR } from "../utils/formatCurrency";
import API_BASE from "../utils/api";

export default function Shop() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");

    const [waitlisted, setWaitlisted] = useState([]);

    /* ================= LOAD PRODUCTS ================= */
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/products`);
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Shop load failed", err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    /* ================= LOAD WAITLIST ================= */
    useEffect(() => {
        const stored =
            JSON.parse(localStorage.getItem("waitlistedProducts")) || [];
        setWaitlisted(stored);
    }, []);

    /* ================= TOGGLE WAITLIST ================= */
    const toggleWaitlist = (e, productId) => {
        e.preventDefault();
        e.stopPropagation();

        const updated = waitlisted.includes(productId)
            ? waitlisted.filter(id => id !== productId)
            : [...waitlisted, productId];

        localStorage.setItem(
            "waitlistedProducts",
            JSON.stringify(updated)
        );
        setWaitlisted(updated);

        window.dispatchEvent(new Event("waitlist-updated"));
    };

    /* ================= CATEGORIES ================= */
    const categories = useMemo(() => {
        const set = new Set(
            products.map(p => p.category).filter(Boolean)
        );
        return ["All", ...Array.from(set)];
    }, [products]);

    /* ================= FILTER ================= */
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchCategory =
                category === "All" || p.category === category;

            const matchSearch =
                p.title?.toLowerCase().includes(search.toLowerCase());

            return matchCategory && matchSearch;
        });
    }, [products, search, category]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                Loading products…
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white px-6 md:px-20 py-32">
            <div className="max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="text-center mb-20">
                    <h1 className="text-4xl md:text-5xl tracking-[0.35em] mb-6">
                        ALL SAVAGE GEAR
                    </h1>
                    <p className="opacity-70 max-w-xl mx-auto">
                        Explore every drop. Filter by category or search your fit.
                    </p>
                </div>

                {/* FILTER BAR */}
                <div className="flex flex-col md:flex-row gap-6 mb-16">
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search products…"
                        className="flex-1 bg-transparent border border-zinc-700 px-4 py-3 outline-none"
                    />

                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="bg-black border border-zinc-700 px-4 py-3 outline-none"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                {/* PRODUCT GRID */}
                {filteredProducts.length === 0 ? (
                    <div className="text-center opacity-60 py-40">
                        No products found
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
                        {filteredProducts.map(product => {
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
                                    {showHeart && (
                                        <button
                                            onClick={e =>
                                                toggleWaitlist(e, product._id)
                                            }
                                            className={`absolute top-3 right-3 z-10 text-xl transition ${isWaitlisted
                                                    ? "text-red-500"
                                                    : "opacity-50 hover:opacity-100"
                                                }`}
                                        >
                                            ❤️
                                        </button>
                                    )}

                                    <div className="aspect-square bg-zinc-900 mb-4 overflow-hidden">
                                        {image ? (
                                            <img
                                                src={`${API_BASE}${image}`}
                                                alt={product.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-40 text-sm">
                                                NO IMAGE
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="tracking-widest text-sm mb-1">
                                        {product.title}
                                    </h3>

                                    <p className="opacity-60 text-xs">
                                        {formatNPR(product.price)}
                                    </p>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}