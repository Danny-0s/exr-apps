const API_BASE_URL =
    import.meta.env.MODE === "development"
        ? "http://localhost:4242"
        : "https://PASTE-YOUR-BACKEND-URL-HERE";

export default API_BASE_URL;