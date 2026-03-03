import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatNPR } from "../utils/formatCurrency";
import API_BASE from "../utils/api";

export default function MyWaitlist() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeProduct, setActiveProduct] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);

    const { addToCart } = useCart();

    /* ================= LOAD WAITLIST ================= */
    const loadWaitlist = async () => {
        try {
            const storedIds = JSON.parse(
                localStorage.getItem("waitlistedProducts") || "[]"
            );

            if (!storedIds.length) {
                setProducts([]);
                return;
            }

            const res = await fetch(`${API_BASE}/api/products`);
            const allProducts = await res.json();

            setProducts(
                allProducts.filter(p => storedIds.includes(p._id))
            );
        } catch (err) {
            console.error("Waitlist load failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadWaitlist();

        const sync = () => loadWaitlist();
        window.addEventListener("waitlist-updated", sync);

        return () => {
            window.removeEventListener("waitlist-updated", sync);
        };
    }, []);

    /* ================= REMOVE ================= */
    const removeFromWaitlist = productId => {
        const stored =
            JSON.parse(localStorage.getItem("waitlistedProducts")) || [];

        localStorage.setItem(
            "waitlistedProducts",
            JSON.stringify(stored.filter(id => id !== productId))
        );

        window.dispatchEvent(new Event("waitlist-updated"));
    };

    /* ================= CONFIRM ADD ================= */
    const confirmAddToCart = () => {
        if (!selectedSize) {
            alert("Select a size");
            return;
        }

        addToCart({
            _id: activeProduct._id,
            title: activeProduct.title,
            price: activeProduct.price,
            images: activeProduct.images,
            selectedSize,
            stock: activeProduct.stock,
        });

        removeFromWaitlist(activeProduct._id);

        setActiveProduct(null);
        setSelectedSize(null);
    };

    /* ================= UI ================= */
    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center opacity-60">
                Loading waitlist…
            </div>
        );
    }

    if (!products.length) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center opacity-60">
                No waitlisted products
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-black text-white px-8 md:px-12 py-20">
                <h1 className="tracking-widest text-2xl mb-12">
                    MY WAITLIST
                </h1>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {products.map(p => (
                        <div
                            key={p._id}
                            className="border border-zinc-800 hover:border-white transition relative group"
                        >
                            <Link to={`/products/${p._id}`}>
                                <img
                                    src={`${API_BASE}${p.images?.[0]}`}
                                    className="w-full h-72 object-cover"
                                    alt={p.title}
                                />
                            </Link>

                            <div className="p-4 space-y-1">
                                <p className="tracking-widest text-sm">
                                    {p.title}
                                </p>
                                <p className="opacity-60 text-xs">
                                    {formatNPR(p.price)}
                                </p>
                                <p
                                    className={`text-xs ${p.stock === 0
                                            ? "text-red-500"
                                            : "text-green-500"
                                        }`}
                                >
                                    {p.stock === 0
                                        ? "SOLD OUT"
                                        : "IN STOCK"}
                                </p>
                            </div>

                            {p.stock > 0 && (
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <button
                                        onClick={() => setActiveProduct(p)}
                                        className="border px-6 py-2 tracking-widest hover:bg-white hover:text-black transition"
                                    >
                                        ADD TO CART
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ================= SIZE MODAL ================= */}
            {activeProduct && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-black border border-zinc-700 p-8 w-full max-w-md">
                        <h2 className="tracking-widest mb-6">
                            SELECT SIZE
                        </h2>

                        <div className="flex gap-3 mb-8">
                            {activeProduct.sizes.map(size => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`px-4 py-2 border tracking-widest ${selectedSize === size
                                            ? "bg-white text-black border-white"
                                            : "border-zinc-700 hover:border-white"
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={() => {
                                    setActiveProduct(null);
                                    setSelectedSize(null);
                                }}
                                className="opacity-60 hover:opacity-100"
                            >
                                CANCEL
                            </button>

                            <button
                                onClick={confirmAddToCart}
                                className="border px-6 py-2 tracking-widest hover:bg-white hover:text-black transition"
                            >
                                CONFIRM
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}