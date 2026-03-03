import { useEffect, useState, useRef } from "react";
import { adminFetch } from "../../utils/adminFetch";
import { formatNPR } from "../../utils/formatCurrency";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Legend,
} from "recharts";

export default function AdminDashboard() {
    const [analytics, setAnalytics] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [groupBy, setGroupBy] = useState("daily");
    const [loading, setLoading] = useState(true);

    const intervalRef = useRef(null);

    /* ================= FETCH ANALYTICS ================= */
    const fetchAnalytics = async (from = "", to = "", group = "daily") => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            if (from) params.append("from", from);
            if (to) params.append("to", to);
            if (group) params.append("groupBy", group);

            const res = await adminFetch(
                `/api/admin/analytics/dashboard?${params.toString()}`
            );

            const data = await res.json();
            if (!res.ok) throw new Error();

            setAnalytics(data);
            setRecentOrders(data.recentOrders || []);
            setTopProducts(data.topProducts || []);
        } catch {
            setAnalytics(null);
            setRecentOrders([]);
            setTopProducts([]);
        } finally {
            setLoading(false);
        }
    };

    /* ================= EXPORT CSV ================= */
    const exportCSV = async () => {
        try {
            const params = new URLSearchParams();
            if (fromDate) params.append("from", fromDate);
            if (toDate) params.append("to", toDate);
            if (groupBy) params.append("groupBy", groupBy);

            const res = await adminFetch(
                `/api/admin/analytics/export-csv?${params.toString()}`
            );

            if (!res.ok) throw new Error();

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "analytics.csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch {
            alert("CSV export failed");
        }
    };

    /* ================= INITIAL LOAD ================= */
    useEffect(() => {
        fetchAnalytics();
    }, []);

    /* ================= FILTER CHANGES ================= */
    useEffect(() => {
        fetchAnalytics(fromDate, toDate, groupBy);
    }, [fromDate, toDate, groupBy]);

    /* ================= AUTO REFRESH ================= */
    useEffect(() => {
        clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            fetchAnalytics(fromDate, toDate, groupBy);
        }, 30000);

        return () => clearInterval(intervalRef.current);
    }, [fromDate, toDate, groupBy]);

    if (loading && !analytics) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                Loading analytics...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white px-16 py-12">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-10">
                <div>
                    <p className="tracking-widest text-xs opacity-50">
                        ADMIN PANEL
                    </p>
                    <h1 className="text-4xl font-bold mt-2">
                        Revenue Dashboard
                    </h1>
                </div>

                <div className="flex gap-4 items-center">

                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl text-sm"
                    />

                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl text-sm"
                    />

                    <select
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-xl text-sm"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>

                    {/* CSV BUTTON */}
                    <button
                        onClick={exportCSV}
                        className="bg-white text-black px-4 py-2 rounded-xl text-sm font-semibold"
                    >
                        Export CSV
                    </button>

                </div>
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-6 gap-6 mb-16">
                <StatCard title="TOTAL REVENUE" value={formatNPR(analytics?.totalRevenue ?? 0)} growth={analytics?.revenueGrowth} />
                <StatCard title="TOTAL ORDERS" value={analytics?.totalOrders ?? 0} growth={analytics?.ordersGrowth} />
                <StatCard title="CUSTOMERS" value={analytics?.totalCustomers ?? 0} />
                <StatCard title="REPEAT CUSTOMERS" value={analytics?.repeatCustomers ?? 0} />
                <StatCard title="RETENTION RATE" value={`${analytics?.retentionRate ?? 0}%`} />
                <StatCard title="CHURN RATE" value={`${analytics?.churnRate ?? 0}%`} />
            </div>

            {/* AOV */}
            <div className="mb-12">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-64">
                    <p className="text-xs opacity-50 mb-2">AVG ORDER VALUE</p>
                    <p className="text-2xl font-semibold">
                        {formatNPR(analytics?.averageOrderValue ?? 0)}
                    </p>
                </div>
            </div>

            {/* REVENUE GRAPH */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-16">
                <h2 className="tracking-widest text-sm mb-8">
                    REVENUE ({groupBy.toUpperCase()})
                </h2>

                {analytics?.revenueByDay?.length > 0 && (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={analytics.revenueByDay}>
                            <CartesianGrid stroke="#222" />
                            <XAxis dataKey="_id" stroke="#aaa" />
                            <YAxis stroke="#aaa" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#111",
                                    border: "1px solid #333",
                                }}
                            />
                            <Legend />
                            <Bar dataKey="revenue" fill="#10b981" />
                            <Line
                                type="monotone"
                                dataKey="orders"
                                stroke="#3b82f6"
                                strokeWidth={2}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* TOP PRODUCTS */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-16">
                <h2 className="tracking-widest text-sm mb-6">TOP PRODUCTS</h2>

                {topProducts.length === 0 && (
                    <p className="text-white/60">No sales data</p>
                )}

                {topProducts.map((product) => (
                    <div key={product._id} className="flex justify-between bg-zinc-800 p-4 rounded-xl mb-4">
                        <div>
                            <p className="font-semibold">{product.title}</p>
                            <p className="text-xs text-gray-400">
                                {product.totalSold} units
                            </p>
                        </div>
                        <div className="font-medium">
                            {formatNPR(product.totalRevenue)}
                        </div>
                    </div>
                ))}
            </div>

            {/* RECENT ORDERS */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
                <h2 className="tracking-widest text-sm mb-6">RECENT ORDERS</h2>

                {recentOrders.length === 0 && (
                    <p className="text-white/60">No recent orders</p>
                )}

                {recentOrders.map((order) => (
                    <div key={order._id} className="flex justify-between items-center bg-zinc-800 p-4 rounded-xl mb-4">
                        <div>
                            <p className="text-sm font-semibold">
                                #{order._id.slice(-6)}
                            </p>
                            <p className="text-xs text-white/60">
                                {order.user?.name || "Guest"}
                            </p>
                        </div>

                        <div>{formatNPR(order.totalAmount)}</div>

                        <div className="text-xs bg-green-600 px-3 py-1 rounded-full">
                            {order.orderStatus}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ================= STAT CARD ================= */
function StatCard({ title, value, growth }) {
    const positive = growth > 0;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <p className="text-xs opacity-50 mb-2">{title}</p>
            <p className="text-xl font-semibold mb-1">{value}</p>

            {growth !== undefined && (
                <p className={`text-xs ${positive ? "text-green-400" : "text-red-400"}`}>
                    {positive ? "▲" : "▼"} {Math.abs(growth)}%
                </p>
            )}
        </div>
    );
}