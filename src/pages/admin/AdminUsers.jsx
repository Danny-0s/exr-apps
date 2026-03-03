import { useEffect, useState, useMemo } from "react";
import API_BASE_URL from "../../utils/api";

const USERS_PER_PAGE = 6;

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const adminToken = localStorage.getItem("adminToken");

            const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${adminToken}` },
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to load users");

            setUsers(data.users || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    /* ================= FILTER + SORT ================= */

    const filteredUsers = useMemo(() => {
        let filtered = users.filter(user =>
            user.name?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase())
        );

        switch (sortBy) {
            case "wallet":
                filtered.sort((a, b) =>
                    (b.walletBalance || 0) - (a.walletBalance || 0)
                );
                break;

            case "spent":
                filtered.sort((a, b) =>
                    (b.totalSpent || 0) - (a.totalSpent || 0)
                );
                break;

            default:
                filtered.sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
        }

        return filtered;
    }, [users, search, sortBy]);

    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

    const paginatedUsers = filteredUsers.slice(
        (page - 1) * USERS_PER_PAGE,
        page * USERS_PER_PAGE
    );

    if (loading)
        return <div className="text-white p-10">Loading users...</div>;

    if (error)
        return <div className="text-red-500 p-10">{error}</div>;

    return (
        <div className="text-white relative">

            <h1 className="text-3xl font-bold tracking-widest mb-10">
                USERS
            </h1>

            {/* SEARCH + SORT */}
            <div className="flex justify-between mb-8 gap-6">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="bg-zinc-900 border border-zinc-800 px-4 py-3 w-96 rounded-lg"
                />

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-lg"
                >
                    <option value="newest">Newest</option>
                    <option value="wallet">Wallet</option>
                    <option value="spent">Total Spent</option>
                </select>
            </div>

            {/* TABLE */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
                <table className="w-full text-left">
                    <thead className="bg-zinc-800 text-xs uppercase tracking-widest">
                        <tr>
                            <th className="p-4">Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Total Orders</th>
                            <th>Total Spent</th>
                            <th>Wallet</th>
                            <th>Joined</th>
                            <th></th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedUsers.map(user => (
                            <tr
                                key={user._id}
                                className="border-t border-zinc-800 hover:bg-zinc-800/60 transition"
                            >
                                <td className="p-4 font-semibold">
                                    {user.name}
                                </td>

                                <td>{user.email}</td>

                                <td>
                                    <span
                                        className={`px-3 py-1 text-xs rounded-full ${user.isActive !== false
                                                ? "bg-green-600/20 text-green-400"
                                                : "bg-red-600/20 text-red-400"
                                            }`}
                                    >
                                        {user.isActive !== false
                                            ? "ACTIVE"
                                            : "BLOCKED"}
                                    </span>
                                </td>

                                <td>{user.totalOrders || 0}</td>
                                <td>NPR {(user.totalSpent || 0).toLocaleString()}</td>
                                <td>NPR {(user.walletBalance || 0).toLocaleString()}</td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>

                                <td>
                                    <button
                                        onClick={() => setSelectedUser(user)}
                                        className="text-sm px-3 py-1 border border-white/20 rounded hover:bg-white hover:text-black transition"
                                    >
                                        Manage
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-3">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`px-4 py-2 border rounded ${page === i + 1
                                    ? "bg-white text-black"
                                    : "border-white/20"
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            {selectedUser && (
                <UserModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onUpdate={(updatedUser) => {
                        setUsers(prev =>
                            prev.map(u =>
                                u._id === updatedUser._id ? updatedUser : u
                            )
                        );
                        setSelectedUser(updatedUser);
                    }}
                    onDelete={(id) => {
                        setUsers(prev =>
                            prev.filter(u => u._id !== id)
                        );
                        setSelectedUser(null);
                    }}
                />
            )}
        </div>
    );
}

/* ================= MODAL ================= */

function UserModal({ user, onClose, onUpdate, onDelete }) {
    const [loading, setLoading] = useState(false);
    const [walletAmount, setWalletAmount] = useState("");

    const adminToken = localStorage.getItem("adminToken");
    const isSuperAdmin = user.role === "super-admin";

    const toggleBan = async () => {
        try {
            setLoading(true);

            const res = await fetch(
                `${API_BASE_URL}/api/admin/users/${user._id}/ban`,
                {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${adminToken}` },
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            onUpdate({ ...user, isActive: data.isActive });
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateWallet = async () => {
        if (!walletAmount) return;

        try {
            setLoading(true);

            const res = await fetch(
                `${API_BASE_URL}/api/admin/users/${user._id}/wallet`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${adminToken}`,
                    },
                    body: JSON.stringify({ amount: Number(walletAmount) }),
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setWalletAmount("");
            onUpdate(data.user);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async () => {
        if (!window.confirm("Delete this user permanently?")) return;

        try {
            setLoading(true);

            const res = await fetch(
                `${API_BASE_URL}/api/admin/users/${user._id}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${adminToken}` },
                }
            );

            if (!res.ok) throw new Error("Delete failed");

            onDelete(user._id);
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70" onClick={onClose} />

            <div className="relative bg-zinc-900 border border-zinc-700 p-8 w-[520px] rounded-xl shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/50 hover:text-white"
                >
                    ✕
                </button>

                <h2 className="text-xl font-bold mb-6 tracking-widest">
                    USER MANAGEMENT
                </h2>

                <div className="space-y-3 text-sm mb-6">
                    <Detail label="Name" value={user.name} />
                    <Detail label="Email" value={user.email} />
                    <Detail label="Role" value={user.role || "user"} />
                    <Detail
                        label="Status"
                        value={user.isActive !== false ? "ACTIVE" : "BLOCKED"}
                    />
                    <Detail
                        label="Wallet"
                        value={`NPR ${(user.walletBalance || 0).toLocaleString()}`}
                    />
                </div>

                {!isSuperAdmin && (
                    <>
                        <button
                            disabled={loading}
                            onClick={toggleBan}
                            className={`w-full py-2 mb-4 rounded font-semibold ${user.isActive !== false
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-green-600 hover:bg-green-700"
                                }`}
                        >
                            {user.isActive !== false
                                ? "Block User"
                                : "Unblock User"}
                        </button>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="number"
                                placeholder="Adjust wallet amount"
                                value={walletAmount}
                                onChange={(e) => setWalletAmount(e.target.value)}
                                className="flex-1 bg-zinc-800 border border-zinc-700 px-3 py-2 rounded"
                            />
                            <button
                                disabled={loading}
                                onClick={updateWallet}
                                className="bg-blue-600 hover:bg-blue-700 px-4 rounded font-semibold"
                            >
                                Update
                            </button>
                        </div>

                        <button
                            disabled={loading}
                            onClick={deleteUser}
                            className="w-full py-2 bg-zinc-800 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white rounded"
                        >
                            Delete User
                        </button>
                    </>
                )}

                {isSuperAdmin && (
                    <div className="text-center text-yellow-400 font-semibold">
                        Super Admin is protected
                    </div>
                )}
            </div>
        </div>
    );
}

function Detail({ label, value }) {
    return (
        <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-white/50">{label}</span>
            <span>{value}</span>
        </div>
    );
}
