import { Link } from "react-router-dom";

export default function SplitHero() {
    return (
        <section className="relative bg-black text-white overflow-hidden">

            {/* Background Depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black opacity-60"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-20 md:py-28 grid grid-cols-2 gap-6 sm:gap-10 md:gap-20 items-center">

                {/* LEFT SIDE */}
                <div className="space-y-6 sm:space-y-8 md:space-y-10">

                    <p className="text-[9px] sm:text-xs tracking-[0.4em] text-zinc-500 uppercase">
                        EST. 2025 • NEPAL
                    </p>

                    <h1 className="uppercase leading-none">

                        <span className="block text-3xl sm:text-4xl md:text-7xl font-extrabold tracking-tight">
                            ESSENCE
                        </span>

                        <span className="block text-3xl sm:text-4xl md:text-7xl font-extrabold tracking-tight mt-1 sm:mt-2">
                            <span className="text-white/70">×</span>{" "}
                            <span className="text-red-600 drop-shadow-[0_0_20px_rgba(255,0,0,0.5)]">
                                REBIRTH
                            </span>
                        </span>

                    </h1>

                    <p className="text-xs sm:text-sm md:text-lg text-zinc-400 leading-relaxed">
                        Streetwear born from identity, culture, and rebirth.
                    </p>

                    <p className="text-[11px] sm:text-sm md:text-base text-zinc-500 leading-relaxed">
                        Browse through our diverse range of meticulously crafted garments,
                        designed to bring out your individuality and redefine your sense of style.
                    </p>

                    <Link to="/shop">
                        <button className="group relative px-6 sm:px-8 md:px-12 py-2 sm:py-3 md:py-4 border border-white rounded-xl overflow-hidden transition-all duration-500">

                            <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></span>

                            <span className="relative z-10 tracking-[0.3em] text-[10px] sm:text-xs md:text-sm font-medium text-white group-hover:text-black transition-colors duration-500">
                                SHOP NOW
                            </span>

                        </button>
                    </Link>

                </div>

                {/* RIGHT SIDE */}
                <div className="relative flex justify-center items-center">

                    <img
                        src="/exr-logo.png"
                        alt="EXR"
                        className="w-40 sm:w-56 md:w-[500px] object-contain opacity-95"
                    />

                    <div className="absolute top-6 sm:top-10 md:top-16 right-4 sm:right-6 md:right-10 w-2 sm:w-3 md:w-4 h-2 sm:h-3 md:h-4 bg-red-600 rotate-45 opacity-40"></div>
                    <div className="absolute bottom-6 sm:bottom-10 md:bottom-16 left-4 sm:left-6 md:left-10 w-2 sm:w-2 md:w-3 h-2 sm:h-2 md:h-3 bg-white rotate-45 opacity-40"></div>

                </div>

            </div>
        </section>
    );
}