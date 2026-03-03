import { useEffect, useState } from "react";
import { adminFetch } from "../../utils/adminFetch";
import { formatNPR } from "../../utils/formatCurrency";

const ALL_SIZES = ["S", "M", "L", "XL"];

const stockBadge = stock => {
    if (stock === 0) return "bg-red-600";
    if (stock <= 5) return "bg-yellow-500";
    return "bg-green-600";
};

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        title: "",
        price: "",
        category: "",
        featured: false,
        sizes: [],
        stock: 0,
    });

    /* ================= LOAD PRODUCTS ================= */
    const loadProducts = async () => {
        try {
            setLoading(true);

            const res = await adminFetch("/api/admin/products");

            if (!res.ok) throw new Error("Failed to load");

            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Load products error:", err);
            alert("Failed to load admin products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    /* ================= CREATE PRODUCT ================= */
    const handleSubmit = async e => {
        e.preventDefault();

        if (!images.length) {
            alert("Please select at least one image");
            return;
        }

        try {
            setSubmitting(true);

            const formData = new FormData();
            formData.append("title", form.title.trim());
            formData.append("price", Number(form.price));
            formData.append("category", form.category.toLowerCase().trim());
            formData.append("featured", form.featured);
            formData.append("stock", Number(form.stock));
            formData.append("sizes", JSON.stringify(form.sizes));

            images.forEach(img => {
                formData.append("images", img); // MUST be "images"
            });

            const res = await adminFetch("/api/admin/products", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("Server error:", text);
                alert("Server error while creating product");
                return;
            }

            await res.json(); // safe now

            setForm({
                title: "",
                price: "",
                category: "",
                featured: false,
                sizes: [],
                stock: 0,
            });

            setImages([]);
            loadProducts();

        } catch (err) {
            console.error("Create product error:", err);
            alert("Create product failed");
        } finally {
            setSubmitting(false);
        }
    };

    const deleteProduct = async id => {
        if (!window.confirm("Delete this product?")) return;

        try {
            const res = await adminFetch(
                `/api/admin/products/${id}`,
                { method: "DELETE" }
            );

            if (!res.ok) throw new Error();

            setProducts(prev =>
                prev.filter(p => p._id !== id)
            );
        } catch (err) {
            console.error("Delete product error:", err);
            alert("Failed to delete product");
        }
    };

    const toggleSize = size => {
        setForm(prev => ({
            ...prev,
            sizes: prev.sizes.includes(size)
                ? prev.sizes.filter(s => s !== size)
                : [...prev.sizes, size],
        }));
    };

    return (
        <div className="min-h-screen bg-black text-white p-10 max-w-5xl mx-auto">
            <h1 className="text-3xl tracking-widest mb-10">
                ADMIN → PRODUCTS
            </h1>

            <form
                onSubmit={handleSubmit}
                className="border border-zinc-800 p-6 mb-16 space-y-5"
            >
                <h2 className="text-sm tracking-widest opacity-60">
                    ADD PRODUCT
                </h2>

                <input
                    placeholder="Product Title"
                    value={form.title}
                    onChange={e =>
                        setForm({ ...form, title: e.target.value })
                    }
                    className="w-full bg-black border p-3"
                    required
                />

                <input
                    type="number"
                    placeholder="Price (NPR)"
                    value={form.price}
                    onChange={e =>
                        setForm({ ...form, price: e.target.value })
                    }
                    className="w-full bg-black border p-3"
                    required
                />

                <input
                    placeholder="Category"
                    value={form.category}
                    onChange={e =>
                        setForm({ ...form, category: e.target.value })
                    }
                    className="w-full bg-black border p-3"
                    required
                />

                <div>
                    <p className="text-xs mb-2 opacity-60">SIZES</p>
                    <div className="flex gap-3">
                        {ALL_SIZES.map(size => (
                            <button
                                type="button"
                                key={size}
                                onClick={() => toggleSize(size)}
                                className={`border px-4 py-2 transition ${form.sizes.includes(size)
                                        ? "bg-white text-black"
                                        : "border-zinc-700 hover:border-white"
                                    }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                <input
                    type="number"
                    placeholder="Stock quantity"
                    value={form.stock}
                    onChange={e =>
                        setForm({ ...form, stock: e.target.value })
                    }
                    className="w-full bg-black border p-3"
                    min="0"
                />

                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={e =>
                            setForm({
                                ...form,
                                featured: e.target.checked,
                            })
                        }
                    />
                    Featured product
                </label>

                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={e => setImages([...e.target.files])}
                    className="w-full bg-black border p-3"
                />

                <button
                    disabled={submitting}
                    className="border px-8 py-3 hover:bg-white hover:text-black transition disabled:opacity-50"
                >
                    {submitting ? "ADDING..." : "ADD PRODUCT"}
                </button>
            </form>

            {loading ? (
                <p className="opacity-60">Loading products…</p>
            ) : (
                <div className="space-y-4">
                    {products.map(p => (
                        <div
                            key={p._id}
                            className="border border-zinc-800 p-4 flex justify-between items-center"
                        >
                            <div>
                                <p className="font-bold">{p.title}</p>

                                <span
                                    className={`inline-block mt-1 px-3 py-1 text-xs rounded ${stockBadge(
                                        p.stock
                                    )}`}
                                >
                                    STOCK: {p.stock}
                                </span>

                                <p className="text-sm opacity-60 mt-1">
                                    {formatNPR(p.price)}
                                    {p.featured && " · FEATURED"}
                                </p>

                                <p className="text-xs opacity-50">
                                    Sizes: {p.sizes?.join(", ") || "—"}
                                </p>
                            </div>

                            <button
                                onClick={() => deleteProduct(p._id)}
                                className="text-red-500 text-xs hover:underline"
                            >
                                DELETE
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}