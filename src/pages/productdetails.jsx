import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { formatNPR } from "../utils/formatCurrency";
import API_BASE_URL from "../utils/api";

export default function ProductDetails() {
    const { id } = useParams();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState(null);
    const [activeImage, setActiveImage] = useState(0);
    const [isWaitlisted, setIsWaitlisted] = useState(false);

    /* ================= FETCH PRODUCT ================= */
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(
                    `${API_BASE_URL}/api/products/${id}`
                );

                if (!res.ok) {
                    throw new Error("Failed to fetch product");
                }

                const data = await res.json();
                setProduct(data);

                const stored =
                    JSON.parse(
                        localStorage.getItem("waitlistedProducts")
                    ) || [];

                setIsWaitlisted(stored.includes(data._id));

            } catch (err) {
                console.error("Failed to load product", err);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    /* ================= LOADING ================= */
    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                Loading…
            </div>
        );
    }

    /* ================= NOT FOUND ================= */
    if (!product) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                Product not found
            </div>
        );
    }

    /* ================= SAFE DATA ================= */
    const images = Array.isArray(product.images) ? product.images : [];
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    const showWaitlist = product.stock !== 0;

    /* ================= ADD TO CART ================= */
    const handleAddToCart = () => {
        if (!selectedSize) {
            alert("Please select a size");
            return;
        }

        addToCart({
            _id: product._id,
            title: product.title,
            price: product.price,
            images,
            selectedSize,
            stock: product.stock,
        });
    };

    /* ================= WAITLIST ================= */
    const toggleWaitlist = () => {
        const stored =
            JSON.parse(
                localStorage.getItem("waitlistedProducts")
            ) || [];

        let updated;

        if (stored.includes(product._id)) {
            updated = stored.filter(id => id !== product._id);
            setIsWaitlisted(false);
        } else {
            updated = [...stored, product._id];
            setIsWaitlisted(true);
        }

        localStorage.setItem(
            "waitlistedProducts",
            JSON.stringify(updated)
        );

        window.dispatchEvent(new Event("waitlist-updated"));
    };

    /* ================= UI ================= */
    return (
        <div className="min-h-screen bg-black text-white px-6 md:px-12 py-16 grid grid-cols-1 md:grid-cols-2 gap-14">

            {/* ================= IMAGES ================= */}
            <div>
                {images.length > 0 && (
                    <img
                        src={`${API_BASE_URL}${images[activeImage]}`}
                        className="w-full h-[520px] object-cover border mb-6"
                        alt={product.title}
                    />
                )}

                <div className="flex gap-3">
                    {images.map((img, i) => (
                        <img
                            key={i}
                            src={`${API_BASE_URL}${img}`}
                            onClick={() => setActiveImage(i)}
                            className={`w-20 h-20 object-cover border cursor-pointer ${i === activeImage
                                    ? "border-white"
                                    : "border-zinc-700"
                                }`}
                            alt="thumbnail"
                        />
                    ))}
                </div>
            </div>

            {/* ================= DETAILS ================= */}
            <div>
                {product.category && (
                    <p className="text-xs tracking-widest opacity-60 mb-3">
                        {product.category.toUpperCase()}
                    </p>
                )}

                <h1 className="text-3xl tracking-widest mb-4">
                    {product.title}
                </h1>

                <p className="text-xl opacity-80 mb-6">
                    {formatNPR(product.price)}
                </p>

                <p className="text-xs tracking-widest mb-6 opacity-70">
                    {product.stock === 0
                        ? "OUT OF STOCK"
                        : `IN STOCK — ${product.stock} AVAILABLE`}
                </p>

                {product.description && (
                    <p className="opacity-70 leading-relaxed mb-10">
                        {product.description}
                    </p>
                )}

                {sizes.length > 0 && (
                    <div className="mb-10">
                        <p className="text-xs tracking-widest opacity-60 mb-3">
                            SIZE
                        </p>

                        <div className="flex gap-3">
                            {sizes.map(size => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`px-4 py-2 border tracking-widest transition ${selectedSize === size
                                            ? "bg-white text-black border-white"
                                            : "border-zinc-700 hover:border-white"
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <button
                        disabled={product.stock === 0}
                        onClick={handleAddToCart}
                        className={`border px-12 py-4 tracking-widest transition ${product.stock === 0
                                ? "opacity-40 cursor-not-allowed"
                                : "hover:bg-white hover:text-black"
                            }`}
                    >
                        ADD TO CART
                    </button>

                    {showWaitlist && (
                        <button
                            onClick={toggleWaitlist}
                            className={`text-2xl transition ${isWaitlisted
                                    ? "text-red-500"
                                    : "opacity-50 hover:opacity-100"
                                }`}
                            aria-label="Toggle waitlist"
                        >
                            ❤️
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}