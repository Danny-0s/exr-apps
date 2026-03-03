export default function CenteredQuoteHero() {
    return (
        <section className="relative w-full bg-black text-white">

            {/* Full viewport height center */}
            <div className="min-h-screen flex items-center justify-center px-6">

                <div className="text-center max-w-5xl mx-auto">

                    <h1 className="
                        font-serif
                        text-3xl
                        sm:text-4xl
                        md:text-5xl
                        lg:text-6xl
                        leading-tight
                    ">
                        “We don't follow trends.{" "}
                        <span className="text-red-500">
                            We set them.
                        </span>”
                    </h1>

                    <p className="
                        mt-12
                        text-xs
                        sm:text-sm
                        tracking-[0.4em]
                        text-zinc-500
                    ">
                        KATHMANDU — EST. 2026
                    </p>

                </div>

            </div>

        </section>
    );
}