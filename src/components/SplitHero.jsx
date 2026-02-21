import { Link } from "react-router-dom";

export default function SplitHero() {
    return (
        <section className="relative bg-black text-white overflow-hidden">

            {/* Background Depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black opacity-60"></div>

            <div className="relative max-w-7xl mx-auto px-6 md:px-20 py-20 md:py-28 grid grid-cols-2 gap-12 md:gap-20 items-center">

                {/* LEFT SIDE */}
                <div className="max-w-xl space-y-8">

                    <p className="text-xs tracking-[0.4em] text-zinc-500 uppercase">
                        EST. 2025 • NEPAL
                    </p>

                    <h1 className="uppercase leading-none">

                        <span className="block text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight">
                            ESSENCE
                        </span>

                        <span className="block text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mt-2">
                            <span className="text-white/70">×</span>{" "}
                            <span className="text-red-600 drop-shadow-[0_0_20px_rgba(255,0,0,0.4)]">
                                REBIRTH
                            </span>
                        </span>

                    </h1>

                    <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
                        Streetwear born from identity, culture, and rebirth.
                    </p>

                    <p className="text-sm md:text-base text-zinc-500 leading-relaxed">
                        Browse through our diverse range of meticulously crafted garments,
                        designed to bring out your individuality and redefine your sense of style.
                    </p>

                    <Link to="/shop">
                        <button className="group relative px-8 md:px-12 py-3 md:py-4 border border-white rounded-xl overflow-hidden transition-all duration-500">

                            <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></span>

                            <span className="relative z-10 tracking-[0.3em] text-xs md:text-sm font-medium text-white group-hover:text-black transition-colors duration-500">
                                SHOP NOW
                            </span>

                        </button>
                    </Link>

                </div>

                {/* RIGHT SIDE */}
                <div className="flex justify-center items-center">
                    <img
                        src="/exr-logo.png"
                        alt="EXR"
                        className="w-48 sm:w-64 md:w-[420px] object-contain opacity-95"
                    />
                </div>

            </div>
        </section>
    );
}