import { useCart } from "../context/CartContext";
import { useState, useMemo, useEffect } from "react";
import { formatNPR } from "../utils/formatCurrency";
import API_BASE_URL from "../utils/api";

const KATHMANDU_VALLEY_CITIES = ["kathmandu", "lalitpur", "bhaktapur"];

export default function Checkout() {
    const { cart, clearCart } = useCart();
    const [loading, setLoading] = useState(false);

    const [settings, setSettings] = useState(null);
    const [settingsLoading, setSettingsLoading] = useState(true);

    const [shipping, setShipping] = useState({
        fullName: "",
        phone: "",
        address: "",
        city: "",
        province: "",
        notes: "",
    });

    /* ================= LOAD SETTINGS ================= */
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/settings`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                setSettings(data);
            } catch (err) {
                console.error("Failed to load settings", err);
            } finally {
                setSettingsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center opacity-60">
                YOUR CART IS EMPTY
            </div>
        );
    }

    const subtotal = useMemo(
        () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
        [cart]
    );

    const shippingFee = useMemo(() => {
        if (subtotal >= 10000) return 0;
        if (!shipping.city.trim()) return 0;

        const city = shipping.city.trim().toLowerCase();
        return KATHMANDU_VALLEY_CITIES.includes(city)
            ? settings?.shippingInsideValley ?? 150
            : settings?.shippingOutsideValley ?? 300;
    }, [shipping.city, subtotal, settings]);

    const grandTotal = subtotal + shippingFee;

    const validateShipping = () => {
        const required = [
            shipping.fullName,
            shipping.phone,
            shipping.address,
            shipping.city,
            shipping.province,
        ];

        if (required.some(v => !v.trim())) {
            alert("Please fill all required shipping details");
            return false;
        }
        return true;
    };

    const createOrder = async paymentMethod => {
        const orderItems = cart.map(item => ({
            _id: item._id || item.id,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
            image: item.image || "",
        }));

        const res = await fetch(`${API_BASE_URL}/api/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                items: orderItems,
                shipping,
                totalAmount: grandTotal,
                paymentMethod,
            }),
        });

        if (!res.ok) {
            const err = await res.json();
            console.error("ORDER ERROR:", err);
            throw new Error("Order creation failed");
        }

        return await res.json();
    };

    const handleCOD = async () => {
        if (!validateShipping()) return;
        setLoading(true);
        try {
            await createOrder("cod");
            clearCart();
            window.location.href = "/success";
        } catch {
            alert("Cash on Delivery failed");
            setLoading(false);
        }
    };

    const handleStripe = async () => {
        if (!validateShipping()) return;
        setLoading(true);
        try {
            const { orderId } = await createOrder("stripe");

            const res = await fetch(
                `${API_BASE_URL}/create-checkout-session`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ items: cart, orderId }),
                }
            );

            const data = await res.json();
            window.location.href = data.url;
        } catch {
            alert("Stripe payment failed");
            setLoading(false);
        }
    };

    const handleEsewa = async () => {
        if (!validateShipping()) return;
        setLoading(true);
        try {
            const { orderId } = await createOrder("esewa");

            const form = document.createElement("form");
            form.method = "POST";
            form.action = "https://uat.esewa.com.np/epay/main";

            const fields = {
                amt: grandTotal,
                tAmt: grandTotal,
                pid: orderId,
                scd: "EPAYTEST",
                su: `${window.location.origin}/success?orderId=${orderId}&payment=esewa`,
                fu: `${window.location.origin}/cart`,
            };

            Object.entries(fields).forEach(([k, v]) => {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = k;
                input.value = v;
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
        } catch {
            alert("eSewa payment failed");
            setLoading(false);
        }
    };

    const handleKhalti = async () => {
        if (!validateShipping()) return;
        setLoading(true);
        try {
            const { orderId } = await createOrder("khalti");

            const res = await fetch(
                `${API_BASE_URL}/api/payments/khalti/initiate`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId }),
                }
            );

            const data = await res.json();
            window.location.href = data.payment_url;
        } catch {
            alert("Khalti payment failed");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white px-8 py-12 max-w-5xl mx-auto">
            <h1 className="text-2xl tracking-widest mb-10">
                CHECKOUT
            </h1>

            <div className="border border-zinc-800 p-6 mb-10 space-y-4">
                {["fullName", "phone", "address", "city", "province"].map(field => (
                    <input
                        key={field}
                        placeholder={`${field.replace(/([A-Z])/g, " $1")} *`}
                        className="w-full bg-black border border-zinc-700 p-3"
                        value={shipping[field]}
                        onChange={e =>
                            setShipping({
                                ...shipping,
                                [field]: e.target.value,
                            })
                        }
                    />
                ))}
            </div>

            <div className="space-y-3 mb-10 text-sm">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatNPR(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shippingFee === 0 ? "FREE" : formatNPR(shippingFee)}</span>
                </div>

                <div className="flex justify-between text-xl border-t border-zinc-800 pt-4">
                    <span>TOTAL</span>
                    <span>{formatNPR(grandTotal)}</span>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {settings?.codEnabled && (
                    <button
                        onClick={handleCOD}
                        disabled={loading}
                        className="border border-white px-10 py-4 tracking-widest hover:bg-white hover:text-black transition"
                    >
                        CASH ON DELIVERY
                    </button>
                )}

                {settings?.stripeEnabled && (
                    <button
                        onClick={handleStripe}
                        disabled={loading}
                        className="border border-white px-10 py-4 tracking-widest hover:bg-white hover:text-black transition"
                    >
                        PAY WITH STRIPE
                    </button>
                )}

                {settings?.esewaEnabled && (
                    <button
                        onClick={handleEsewa}
                        disabled={loading}
                        className="border border-white px-10 py-4 tracking-widest hover:bg-green-500 hover:text-black transition"
                    >
                        PAY WITH ESEWA
                    </button>
                )}

                {settings?.khaltiEnabled && (
                    <button
                        onClick={handleKhalti}
                        disabled={loading}
                        className="border border-white px-10 py-4 tracking-widest hover:bg-purple-600 hover:text-white transition"
                    >
                        PAY WITH KHALTI
                    </button>
                )}
            </div>
        </div>
    );
}