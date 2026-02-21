import { Link } from "react-router-dom";

export default function SplitHero() {
    return (
        <section className="relative bg-black text-white overflow-hidden exr-section">

            {/* Background Depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900 to-black opacity-60"></div>

            <div className="relative exr-container grid grid-cols-2 gap-8 md:gap-20 items-center">

                {/* LEFT SIDE */}
                <div className="space-y-8">

                    {/* Label */}
                    <p className="exr-label text-zinc-500">
                        EST. 2025 • NEPAL
                    </p>

                    {/* Headline */}
                    <h1 className="uppercase leading-none">

                        <span className="block font-extrabold tracking-tight text-[clamp(2rem,6vw,5rem)]">
                            ESSENCE
                        </span>

                        <span className="block font-extrabold tracking-tight text-[clamp(2rem,6vw,5rem)] mt-2">
                            <span className="text-white/70">×</span>{" "}
                            <span className="text-red-600 drop-shadow-[0_0_20px_rgba(255,0,0,0.5)]">
                                REBIRTH
                            </span>
                        </span>

                    </h1>

                    {/* Sub text */}
                    <p className="exr-subtitle text-zinc-400">
                        Streetwear born from identity, culture, and rebirth.
                    </p>

                    {/* Description */}
                    <p className="exr-text text-zinc-500 max-w-xl">
                        Browse through our diverse range of meticulously crafted garments,
                        designed to bring out your individuality and redefine your sense of style.
                    </p>

                    {/* Button */}
                    <Link to="/shop">
                        <button className="group relative px-10 py-4 border border-white rounded-xl overflow-hidden transition-all duration-500">

                            <span className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></span>

                            <span className="relative z-10 tracking-[0.3em] text-sm font-medium text-white group-hover:text-black transition-colors duration-500">
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
                        className="w-[clamp(180px,40vw,500px)] object-contain opacity-95"
                    />

                    <div className="absolute top-16 right-10 w-4 h-4 bg-red-600 rotate-45 opacity-40"></div>
                    <div className="absolute bottom-16 left-10 w-3 h-3 bg-white rotate-45 opacity-40"></div>

                </div>

            </div>
        </section>
    );
}