import { useEffect, useState } from "react";
import { adminFetch } from "../../utils/adminFetch";

/* ======================================================
   ADMIN LOGS PAGE
====================================================== */
export default function AdminLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);

    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("");

    /* ======================================================
       FETCH LOGS
    ====================================================== */
    const fetchLogs = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                page,
                limit: 10,
            });

            if (search) params.append("search", search);
            if (actionFilter) params.append("action", actionFilter);

            const res = await adminFetch(
                `/api/admin/logs?${params.toString()}`
            );

            if (!res.ok) throw new Error("Failed to fetch logs");

            const data = await res.json();

            setLogs(Array.isArray(data.logs) ? data.logs : []);
            setPages(data.pagination?.pages || 1);

        } catch (err) {
            console.error("Logs error:", err);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    /* ======================================================
       AUTO FETCH
    ====================================================== */
    useEffect(() => {
        fetchLogs();
    }, [page, actionFilter]);

    /* ======================================================
       SEARCH SUBMIT
    ====================================================== */
    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchLogs();
    };

    return (
        <div className="min-h-screen bg-black text-white p-10">

            {/* HEADER */}
            <div className="mb-12">
                <p className="tracking-widest text-sm opacity-60">
                    ADMIN PANEL
                </p>
                <h1 className="text-4xl mt-2">
                    Activity Logs
                </h1>
            </div>

            {/* ================= FILTER + SEARCH ================= */}
            <div className="flex flex-wrap gap-4 mb-8 items-center">

                {/* SEARCH */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search by admin name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-black border border-white/20 px-4 py-2 text-sm focus:outline-none"
                    />
                    <button
                        type="submit"
                        className="border border-white px-4 py-2 text-sm hover:bg-white hover:text-black transition"
                    >
                        Search
                    </button>
                </form>

                {/* ACTION FILTER */}
                <select
                    value={actionFilter}
                    onChange={(e) => {
                        setActionFilter(e.target.value);
                        setPage(1);
                    }}
                    className="bg-black border border-white/20 px-4 py-2 text-sm focus:outline-none"
                >
                    <option value="">All Actions</option>
                    <option value="Created team member">
                        Created Team
                    </option>
                    <option value="Updated team member">
                        Updated Team
                    </option>
                    <option value="Deleted team member">
                        Deleted Team
                    </option>
                </select>
            </div>

            {/* ================= LOG TABLE ================= */}
            <div className="border border-white/10 p-6">

                {loading && (
                    <p className="text-white/60">
                        Loading logs...
                    </p>
                )}

                {!loading && logs.length === 0 && (
                    <p className="text-white/60">
                        No logs found
                    </p>
                )}

                {!loading && logs.length > 0 && (
                    <div className="space-y-4">
                        {logs.map((log) => (
                            <div
                                key={log._id}
                                className="border border-white/10 p-4 hover:border-white/30 transition"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">
                                            {log.admin?.name || "Unknown"}
                                        </p>
                                        <p className="text-xs opacity-50">
                                            {log.admin?.email}
                                        </p>
                                    </div>

                                    <p className="text-xs opacity-50">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </p>
                                </div>

                                <p className="mt-2 text-sm text-yellow-400">
                                    {log.action}
                                </p>

                                {log.details && (
                                    <p className="mt-1 text-xs opacity-70">
                                        {log.details}
                                    </p>
                                )}

                                {log.ipAddress && (
                                    <p className="mt-1 text-xs opacity-40">
                                        IP: {log.ipAddress}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ================= PAGINATION ================= */}
            <div className="flex gap-4 mt-8 items-center">

                <button
                    disabled={page === 1}
                    onClick={() => setPage((prev) => prev - 1)}
                    className="border border-white px-4 py-2 text-sm disabled:opacity-40"
                >
                    Prev
                </button>

                <p className="text-sm opacity-70">
                    Page {page} of {pages}
                </p>

                <button
                    disabled={page === pages}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="border border-white px-4 py-2 text-sm disabled:opacity-40"
                >
                    Next
                </button>

            </div>

        </div>
    );
}