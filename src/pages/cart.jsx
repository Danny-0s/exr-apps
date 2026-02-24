import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { formatNPR } from "../utils/formatCurrency";
import API_BASE_URL from "../utils/api";

export default function Cart() {
    const {
        cart,
        addToCart,
        decreaseQty,
        removeFromCart,
    } = useCart();

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <h2 className="tracking-widest opacity-60">
                    YOUR CART IS EMPTY
                </h2>
            </div>
        );
    }

    const total = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    return (
        <div className="min-h-screen bg-black text-white px-8 py-12 max-w-5xl mx-auto">
            <h1 className="text-2xl tracking-widest mb-10">
                YOUR CART
            </h1>

            <div className="space-y-6">
                {cart.map(item => (
                    <div
                        key={`${item._id}-${item.selectedSize}`}
                        className="flex justify-between items-center border-b border-zinc-800 pb-6"
                    >
                        {/* LEFT */}
                        <div className="flex gap-4 items-center">
                            <img
                                src={
                                    item.images?.length
                                        ? `${API_BASE_URL}${item.images[0]}`
                                        : "/placeholder.png"
                                }
                                alt={item.title}
                                className="w-20 h-20 object-cover border border-zinc-800"
                            />

                            <div>
                                <p className="tracking-widest">
                                    {item.title}
                                </p>
                                <p className="text-sm opacity-60">
                                    Size: {item.selectedSize}
                                </p>
                                <p className="text-sm opacity-60">
                                    {formatNPR(item.price)}
                                </p>
                            </div>
                        </div>

                        {/* RIGHT */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() =>
                                        decreaseQty(
                                            item._id,
                                            item.selectedSize
                                        )
                                    }
                                    className="border px-3 py-1"
                                >
                                    −
                                </button>

                                <span>{item.quantity}</span>

                                <button
                                    onClick={() =>
                                        addToCart({
                                            ...item,
                                            selectedSize: item.selectedSize,
                                        })
                                    }
                                    className="border px-3 py-1"
                                >
                                    +
                                </button>
                            </div>

                            <button
                                onClick={() =>
                                    removeFromCart(
                                        item._id,
                                        item.selectedSize
                                    )
                                }
                                className="text-red-500 hover:text-red-700 tracking-widest text-sm"
                            >
                                REMOVE
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* TOTAL */}
            <div className="mt-10 flex justify-between items-center">
                <p className="text-xl tracking-widest">
                    TOTAL
                </p>
                <p className="text-xl">
                    {formatNPR(total)}
                </p>
            </div>

            {/* CHECKOUT */}
            <Link
                to="/checkout"
                className="inline-block mt-8 border px-10 py-4 tracking-widest hover:bg-white hover:text-black transition"
            >
                CHECKOUT
            </Link>
        </div>
    );
}