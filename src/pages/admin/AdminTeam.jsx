import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../utils/api";

export default function AdminTeam() {
    const navigate = useNavigate();

    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "editor",
    });

    const roles = [
        "super_admin",
        "owner",
        "admin",
        "editor",
        "support",
        "finance",
    ];

    const currentRole = localStorage.getItem("adminRole");
    const adminToken = localStorage.getItem("adminToken");

    /* =========================================
       LOAD TEAM
    ========================================= */
    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await fetch(`${API_BASE_URL}/api/admin/team`, {
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to load team");
            }

            setTeam(data.team || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    /* =========================================
       ADD MEMBER
    ========================================= */
    const handleAdd = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/team`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${adminToken}`,
                },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to add member");
            }

            setSuccess("Team member added successfully.");

            setForm({
                name: "",
                email: "",
                password: "",
                role: "editor",
            });

            fetchTeam();
        } catch (err) {
            setError(err.message);
        }
    };

    /* =========================================
       UPDATE ROLE / STATUS
    ========================================= */
    const handleUpdate = async (id, updateData) => {
        setError("");
        setSuccess("");

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/team/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${adminToken}`,
                },
                body: JSON.stringify(updateData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Update failed");
            }

            setSuccess("Updated successfully.");
            fetchTeam();
        } catch (err) {
            setError(err.message);
        }
    };

    /* =========================================
       DELETE MEMBER
    ========================================= */
    const handleDelete = async (id) => {
        if (!window.confirm("Remove this admin permanently?")) return;

        setError("");
        setSuccess("");

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/team/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Delete failed");
            }

            setSuccess("Admin removed successfully.");
            fetchTeam();
        } catch (err) {
            setError(err.message);
        }
    };

    /* =========================================
       FRONTEND PERMISSION GUARD
    ========================================= */
    const canManage =
        currentRole === "super_admin" || currentRole === "owner";

    if (loading) {
        return (
            <div className="text-white p-12">
                Loading team...
            </div>
        );
    }

    return (
        <div className="p-10 text-white max-w-6xl mx-auto">

            <h1 className="text-3xl mb-10 tracking-widest">
                ADMIN TEAM MANAGEMENT
            </h1>

            {error && (
                <div className="mb-6 text-red-500">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-6 text-green-500">
                    {success}
                </div>
            )}

            {/* ================= ADD FORM ================= */}
            {canManage && (
                <form
                    onSubmit={handleAdd}
                    className="mb-12 bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-4"
                >
                    <h2 className="text-lg tracking-widest">
                        ADD TEAM MEMBER
                    </h2>

                    <div className="grid md:grid-cols-4 gap-4">

                        <input
                            type="text"
                            placeholder="Name"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            className="bg-black border border-zinc-700 px-3 py-2"
                            required
                        />

                        <input
                            type="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                            className="bg-black border border-zinc-700 px-3 py-2"
                            required
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={form.password}
                            onChange={(e) =>
                                setForm({ ...form, password: e.target.value })
                            }
                            className="bg-black border border-zinc-700 px-3 py-2"
                            required
                        />

                        <select
                            value={form.role}
                            onChange={(e) =>
                                setForm({ ...form, role: e.target.value })
                            }
                            className="bg-black border border-zinc-700 px-3 py-2"
                        >
                            {roles.map(r => (
                                <option key={r} value={r}>
                                    {r.replace("_", " ").toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button className="border px-6 py-2 hover:bg-white hover:text-black transition">
                        ADD MEMBER
                    </button>
                </form>
            )}

            {/* ================= TEAM LIST ================= */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h2 className="text-lg tracking-widest mb-6">
                    TEAM MEMBERS
                </h2>

                <div className="space-y-4">
                    {team.map(member => (
                        <div
                            key={member._id}
                            className="flex justify-between items-center border-b border-zinc-800 pb-4"
                        >
                            <div>
                                <p>{member.name}</p>
                                <p className="text-sm opacity-60">
                                    {member.email}
                                </p>
                            </div>

                            <div className="flex items-center gap-6">

                                <select
                                    value={member.role}
                                    onChange={(e) =>
                                        handleUpdate(member._id, {
                                            role: e.target.value,
                                        })
                                    }
                                    className="bg-black border border-zinc-700 px-2 py-1 text-xs uppercase"
                                >
                                    {roles.map(r => (
                                        <option key={r} value={r}>
                                            {r.replace("_", " ").toUpperCase()}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    onClick={() =>
                                        handleUpdate(member._id, {
                                            isActive: !member.isActive,
                                        })
                                    }
                                    className={`text-xs px-3 py-1 border ${member.isActive
                                            ? "border-green-500 text-green-400"
                                            : "border-red-500 text-red-400"
                                        }`}
                                >
                                    {member.isActive ? "ACTIVE" : "DISABLED"}
                                </button>

                                {canManage && (
                                    <button
                                        onClick={() =>
                                            handleDelete(member._id)
                                        }
                                        className="text-red-500 text-sm"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}