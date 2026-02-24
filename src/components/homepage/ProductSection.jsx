import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from "../../utils/api";

export default function ProductSection({ data }) {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const {
        title = "Featured Products",
        limit = 4,
        category = "",
        source = "latest",
    } = data || {};

    useEffect(() => {
        let mounted = true;

        axios
            .get(`${API_BASE_URL}/api/products`)
            .then(res => {
                if (!mounted) return;

                let list = Array.isArray(res.data) ? res.data : [];

                if (category) {
                    list = list.filter(
                        p =>
                            p.category &&
                            p.category.toLowerCase() === category.toLowerCase()
                    );
                }

                if (source === "featured") {
                    list = list.filter(p => p.featured === true);
                }

                if (source === "latest") {
                    list = [...list].sort(
                        (a, b) =>
                            new Date(b.createdAt) - new Date(a.createdAt)
                    );
                }

                list = list.slice(0, Number(limit) || 4);

                setProducts(list);
            })
            .catch(err => {
                console.error("ProductSection load failed:", err);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [limit, category, source]);

    if (loading) {
        return (
            <section className="py-24 text-center text-zinc-500">
                Loading products…
            </section>
        );
    }

    if (!products.length) {
        return (
            <section className="py-24 text-center text-zinc-500">
                No products match this section settings.
            </section>
        );
    }

    return (
        <section className="bg-black text-white py-24 px-6 md:px-12">
            {title && (
                <h2 className="text-2xl md:text-3xl tracking-[0.35em] text-center mb-16">
                    {title}
                </h2>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
                {products.map(product => {
                    const image =
                        Array.isArray(product.images) &&
                            product.images.length > 0
                            ? product.images[0]
                            : null;

                    return (
                        <div
                            key={product._id}
                            onClick={() =>
                                navigate(`/products/${product._id}`)
                            }
                            className="cursor-pointer border border-zinc-800 p-4 hover:border-white transition"
                        >
                            {image && (
                                <div className="mb-4 overflow-hidden">
                                    <img
                                        src={`${API_BASE_URL}${image}`}
                                        alt={product.title}
                                        className="w-full h-48 object-cover transition hover:scale-105"
                                    />
                                </div>
                            )}

                            <h3 className="text-sm tracking-wide mb-1">
                                {product.title}
                            </h3>

                            <p className="text-sm opacity-60">
                                ${product.price}
                            </p>

                            {product.stock === 0 && (
                                <p className="text-xs text-red-500 mt-1">
                                    SOLD OUT
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}