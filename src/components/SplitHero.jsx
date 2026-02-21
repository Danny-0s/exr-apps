import { Link } from "react-router-dom";

export default function SplitHero() {
    return (
        <section className="relative bg-black text-white overflow-hidden">

            {/* Subtle Background Depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black opacity-60"></div>

            <div className="relative max-w-7xl mx-auto px-6 sm:px-8 py-20 sm:py-24 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-center">

                {/* LEFT SIDE */}
                <div className="space-y-8 md:space-y-10 text-center md:text-left">

                    {/* Small Tagline */}
                    <p className="text-[10px] sm:text-xs tracking-[0.4em] text-zinc-500 uppercase">
                        EST. 2025 • NEPAL
                    </p>

                    {/* Main Headline */}
                    <h1 className="uppercase leading-none">

                        <span className="block text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight">
                            ESSENCE
                        </span>

                        <span className="block text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mt-2">
                            <span className="text-white/70">×</span>{" "}
                            <span className="text-red-600 drop-shadow-[0_0_20px_rgba(255,0,0,0.5)]">
                                REBIRTH
                            </span>
                        </span>

                    </h1>

                    {/* Subtext */}
                    <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto md:mx-0 leading-relaxed">
                        Streetwear born from identity, culture, and rebirth.
                    </p>

                    {/* Description */}
                    <p className="text-sm sm:text-base text-zinc-500 max-w-xl mx-auto md:mx-0 leading-relaxed">
                        Browse through our diverse range of meticulously crafted garments,
                        designed to bring out your individuality and redefine your sense of style.
                    </p>

                    {/* SHOP BUTTON */}
                    <div className="flex justify-center md:justify-start">
                        <Link to="/shop">
                            <button className="group relative px-10 sm:px-12 py-3 sm:py-4 border border-white rounded-xl overflow-hidden transition-all duration-500">

                                {/* Fill Animation */}
                                <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></span>

                                <span className="relative z-10 tracking-[0.3em] text-xs sm:text-sm font-medium text-white group-hover:text-black transition-colors duration-500">
                                    SHOP NOW
                                </span>

                            </button>
                        </Link>
                    </div>

                </div>

                {/* RIGHT SIDE */}
                <div className="relative flex justify-center items-center">

                    <img
                        src="/exr-logo.png"
                        alt="EXR"
                        className="w-72 sm:w-80 md:w-[500px] object-contain opacity-95"
                    />

                    {/* Decorative Diamonds */}
                    <div className="absolute top-10 md:top-16 right-6 md:right-10 w-3 md:w-4 h-3 md:h-4 bg-red-600 rotate-45 opacity-40"></div>
                    <div className="absolute bottom-10 md:bottom-16 left-6 md:left-10 w-2 md:w-3 h-2 md:h-3 bg-white rotate-45 opacity-40"></div>

                </div>

            </div>
        </section>
    );
}