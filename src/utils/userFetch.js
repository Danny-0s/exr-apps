/* ===============================
   API BASE (AUTO SWITCH DEV/PROD)
================================ */
const API_BASE =
    import.meta.env.PROD
        ? "https://exr-apps-1-backend.onrender.com"
        : "http://localhost:4242";

/* ===============================
   USER FETCH WRAPPER (FIXED)
================================ */
export async function userFetch(endpoint, options = {}) {

    const token = localStorage.getItem("token");

    const headers = {
        ...(options.headers || {}),
    };

    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    if (
        config.body &&
        typeof config.body === "object" &&
        !(config.body instanceof FormData)
    ) {
        config.body = JSON.stringify(config.body);
    }

    const res = await fetch(`${API_BASE}${endpoint}`, config);

    /* ===============================
       AUTO LOGOUT IF TOKEN EXPIRED
    ================================ */
    if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.replace("/login");
        return;
    }

    const data = await res.json(); // 🔥 THIS WAS MISSING

    if (!res.ok) {
        throw new Error(data.error || "Request failed");
    }

    return data; // 🔥 RETURN PARSED JSON
}