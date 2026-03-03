const API_BASE_URL =
    import.meta.env.PROD
        ? "https://exr-apps-1.onrender.com"
        : "http://localhost:4242";

export default API_BASE_URL;