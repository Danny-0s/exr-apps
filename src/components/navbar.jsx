import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext"; // ✅ ADD
import { useEffect, useRef, useState } from "react";
import {
    ShoppingCart,
    User,
    Search,
    ChevronDown,
} from "lucide-react";

export default function Navbar() {
    const { cartCount } = useCart();
    const { user, logout } = useAuth(); // ✅ USE AUTH
    const navigate = useNavigate();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    /* ================= LOGOUT ================= */
    const handleLogout = () => {
        logout(); // ✅ USE CONTEXT LOGOUT
        navigate("/");
    };

    /* ================= CLOSE DROPDOWN ================= */
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="w-full bg-black text-white border-b border-zinc-800 relative z-50">

            {!user && (
                <div className="text-center text-xs sm:text-sm py-2 border-b border-zinc-800 tracking-wide px-4">
                    Sign up and get 20% off your first order.{" "}
                    <Link
                        to="/login"
                        className="underline font-semibold hover:text-red-500 transition"
                    >
                        Sign Up
                    </Link>
                </div>
            )}

            <nav className="exr-container flex items-center justify-between py-4">

                {/* LOGO */}
                <Link
                    to="/"
                    className="exr-laser-wrapper"
                    onMouseMove={(e) => {
                        const spark = e.currentTarget.querySelector(".exr-spark");
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        spark.style.left = `${x}px`;
                        spark.style.opacity = 1;
                    }}
                    onMouseLeave={(e) => {
                        const spark = e.currentTarget.querySelector(".exr-spark");
                        spark.style.opacity = 0;
                    }}
                >
                    <div className="flex items-end relative">
                        <span className="exr-glow-text text-2xl sm:text-3xl md:text-4xl font-serif font-semibold tracking-[0.12em]">
                            EXR
                        </span>
                        <span className="text-xs sm:text-sm ml-1 lowercase text-red-500 font-semibold align-top">
                            .np
                        </span>
                    </div>

                    <span className="exr-laser-left"></span>
                    <span className="exr-laser-right"></span>
                    <span className="exr-spark"></span>
                </Link>
                
                {/* SEARCH */}
                <div className="hidden md:flex items-center bg-zinc-900/80 backdrop-blur-md px-6 py-3 rounded-full w-[420px] border border-zinc-800 focus-within:border-red-500 transition-all duration-300">
                    <Search size={18} className="text-white/40 mr-3" />
                    <input
                        type="text"
                        placeholder="Search for products..."
                        className="bg-transparent outline-none text-sm w-full placeholder:text-white/40"
                    />
                </div>

                {/* RIGHT SIDE */}
                <div className="flex items-center gap-6 sm:gap-8 relative">

                    {/* CART */}
                    <Link to="/cart" className="relative group">
                        <ShoppingCart
                            size={20}
                            className="transition group-hover:text-red-500"
                        />
                        {cartCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-white text-black text-xs px-2 py-[2px] rounded-full font-semibold">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* PROFILE */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-1 transition hover:text-red-500"
                        >
                            <User size={20} />
                            <ChevronDown
                                size={14}
                                className={`transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""
                                    }`}
                            />
                        </button>

                        <div
                            className={`
                            absolute right-0 mt-4 w-64
                            bg-zinc-900/95 backdrop-blur-xl
                            border border-zinc-800
                            rounded-2xl shadow-2xl
                            p-4 space-y-2
                            transform transition-all duration-300 origin-top
                            ${dropdownOpen
                                    ? "opacity-100 scale-100 translate-y-0"
                                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                                }
                        `}
                        >
                            {!user ? (
                                <Link
                                    to="/login"
                                    className="block px-3 py-2 hover:bg-zinc-800 rounded-lg"
                                >
                                    Sign In
                                </Link>
                            ) : (
                                <>
                                    <Link to="/orders" className="block px-3 py-2 hover:bg-zinc-800 rounded-lg">
                                        My Orders
                                    </Link>

                                    <Link to="/wishlist" className="block px-3 py-2 hover:bg-zinc-800 rounded-lg">
                                        Wishlist
                                    </Link>

                                    <Link to="/coupons" className="block px-3 py-2 hover:bg-zinc-800 rounded-lg">
                                        Coupons
                                    </Link>

                                    <Link to="/wallet" className="block px-3 py-2 hover:bg-zinc-800 rounded-lg">
                                        Refund Credit
                                    </Link>

                                    <div className="border-t border-zinc-800 my-2"></div>

                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-3 py-2 text-red-500 hover:bg-zinc-800 rounded-lg"
                                    >
                                        Logout
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

            </nav>
        </header>
    );
}