import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatNPR } from "../utils/formatCurrency";
import API_BASE_URL from "../utils/api";

export default function Success() {
    const { clearCart } = useCart();
    const [searchParams] = useSearchParams();

    const orderId = searchParams.get("orderId");
    const payment = searchParams.get("payment") || "stripe";
    const pidx = searchParams.get("pidx");

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const processSuccess = async () => {
            if (!orderId) {
                setError("Order not found");
                setLoading(false);
                return;
            }

            try {
                // Verify Khalti only if needed
                if (payment === "khalti" && pidx) {
                    const verifyRes = await fetch(
                        `${API_BASE_URL}/api/payments/khalti/verify`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ pidx }),
                        }
                    );

                    if (!verifyRes.ok) {
                        throw new Error("Khalti verification failed");
                    }
                }

                // Load order after verification
                const res = await fetch(
                    `${API_BASE_URL}/api/orders/${orderId}`
                );

                if (!res.ok) {
                    throw new Error("Order fetch failed");
                }

                const data = await res.json();
                setOrder(data);

                // Clear cart only after success
                clearCart();
            } catch (err) {
                console.error(err);
                setError("Order not found");
            } finally {
                setLoading(false);
            }
        };

        processSuccess();
    }, [orderId, payment, pidx, clearCart]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center opacity-60">
                Processing your order…
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
                <p className="text-red-400 tracking-widest">
                    ORDER NOT FOUND
                </p>
                <Link
                    to="/shop"
                    className="border px-6 py-3 tracking-widest hover:bg-white hover:text-black transition"
                >
                    RETURN TO SHOP
                </Link>
            </div>
        );
    }

    const subtotal = order.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const shippingFee = Math.max(
        0,
        order.totalAmount - subtotal
    );

    return (
        <div className="min-h-screen bg-black text-white px-6 py-16 flex justify-center">
            <div className="max-w-xl w-full border border-zinc-800 p-8 space-y-6">
                <h1 className="text-2xl tracking-widest text-green-500 text-center">
                    ORDER CONFIRMED ✅
                </h1>

                <p className="text-center opacity-70 text-sm">
                    Your payment via{" "}
                    <span className="uppercase">{payment}</span>{" "}
                    was successful.
                </p>

                <div className="border-t border-zinc-800 pt-6 text-sm space-y-1">
                    <h2 className="tracking-widest opacity-60 mb-2">
                        SHIPPING DETAILS
                    </h2>
                    <p>{order.shipping.fullName}</p>
                    <p>{order.shipping.phone}</p>
                    <p>
                        {order.shipping.address},{" "}
                        {order.shipping.city},{" "}
                        {order.shipping.province}
                    </p>
                    {order.shipping.notes && (
                        <p>Notes: {order.shipping.notes}</p>
                    )}
                </div>

                <div className="border-t border-zinc-800 pt-6 text-sm space-y-2">
                    <h2 className="tracking-widest opacity-60 mb-2">
                        ORDER SUMMARY
                    </h2>

                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatNPR(subtotal)}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>
                            {shippingFee === 0
                                ? "FREE"
                                : formatNPR(shippingFee)}
                        </span>
                    </div>

                    <div className="flex justify-between text-lg border-t border-zinc-800 pt-3">
                        <span>TOTAL</span>
                        <span>
                            {formatNPR(order.totalAmount)}
                        </span>
                    </div>

                    {subtotal >= 10000 && (
                        <p className="text-green-500 text-xs">
                            🎉 Free shipping applied
                        </p>
                    )}
                </div>

                <div className="flex justify-center gap-4 pt-4">
                    <Link
                        to="/shop"
                        className="border px-6 py-3 tracking-widest hover:bg-white hover:text-black transition"
                    >
                        CONTINUE SHOPPING
                    </Link>

                    <Link
                        to="/contact"
                        className="border px-6 py-3 tracking-widest hover:bg-zinc-700 transition"
                    >
                        CONTACT SUPPORT
                    </Link>
                </div>
            </div>
        </div>
    );
}