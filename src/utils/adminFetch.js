/* =========================================
   API BASE (AUTO DEV / PROD SAFE)
========================================= */
const API_BASE = import.meta.env.PROD
    ? "https://exr-apps-backend.onrender.com"
    : "http://localhost:4242";

/* =========================================
   CLEAN ENDPOINT HELPER
========================================= */
function normalizeEndpoint(endpoint) {
    if (!endpoint) return "";

    if (endpoint.startsWith("http")) {
        const url = new URL(endpoint);
        return url.pathname + url.search;
    }

    if (!endpoint.startsWith("/")) {
        return `/${endpoint}`;
    }

    return endpoint;
}

/* =========================================
   ADMIN FETCH (FINAL FIXED VERSION)
========================================= */
export async function adminFetch(endpoint, options = {}) {

    const accessToken = localStorage.getItem("adminToken");

    if (!accessToken) {
        forceLogout();
        throw new Error("No admin token found");
    }

    const cleanEndpoint = normalizeEndpoint(endpoint);

    const isFormData = options.body instanceof FormData;

    const headers = {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`,
    };

    try {
        const res = await fetch(`${API_BASE}${cleanEndpoint}`, {
            ...options,
            headers,
        });

        if (res.status === 401 || res.status === 403) {
            forceLogout();
            throw new Error("Session expired");
        }

        return res;

    } catch (err) {
        console.error("Admin fetch error:", err);
        throw err;
    }
}

/* =========================================
   FORCE LOGOUT
========================================= */
function forceLogout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRefreshToken");
    window.location.href = "/admin/login";
}