const API_BASE_URL =
    import.meta.env.MODE === "development"
        ? "http://localhost:4242"
        : "https://exr-apps.onrender.com";
export default API_BASE;