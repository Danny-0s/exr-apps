/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                neon: "#00fff5",
                cyberpink: "#ff2fd4",
                cyberpurple: "#7f00ff",
                cyberred: "#ff003c",
            },
            boxShadow: {
                neon: "0 0 20px #00fff5",
                pink: "0 0 20px #ff2fd4",
            },

            /* =========================
               FONT SYSTEM UPGRADE
            ========================= */
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                serif: ["Playfair Display", "serif"],
                cyber: ["Orbitron", "sans-serif"], // keeping your original
            },
        },
    },
    plugins: [],
};