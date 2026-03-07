import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import UserTable from "../components/UserTable";
import { FiPlus, FiSearch } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const toast = useToast();

    const currentUser = getCurrentUser();
    const isSuperAdmin = currentUser?.role === "super_admin";
    const apiBase = isSuperAdmin ? "/super-admin/users" : "/users";

    // Base path for form navigation depending on role
    const formBase = (() => {
        const path = window.location.pathname;
        if (path.startsWith("/superadmin")) return "/superadmin/users";
        if (path.startsWith("/company")) return "/company/users";
        if (path.startsWith("/branch")) return "/branch/users";
        return "/users";
    })();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await API.get(`${apiBase}?search=${search}`);
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this user? Their data associations will be preserved.")) return;
        try {
            await API.delete(`${apiBase}/${id}`);
            toast.success("User removed successfully.");
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to remove user.");
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            const newStatus = user.status === "inactive" ? "active" : "inactive";
            await API.put(`${apiBase}/${user._id}`, { status: newStatus });
            toast.success(`User ${newStatus === "active" ? "activated" : "deactivated"} successfully.`);
            fetchUsers();
        } catch (err) {
            toast.error("Failed to update user status.");
        }
    };

    useEffect(() => { fetchUsers(); }, [search]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">User Management</h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-75">
                        Provision and manage CRM user accounts.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group flex-1 lg:w-64">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => navigate(`${formBase}/create`)}
                        className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                        <FiPlus size={20} />
                        Add User
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-[400px] bg-white rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center space-y-4 shadow-sm">
                    <div className="w-12 h-12 border-[6px] border-green-50 border-t-green-500 rounded-full animate-spin" />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Loading Users...</p>
                </div>
            ) : (
                <UserTable
                    users={users}
                    onEdit={(u) => navigate(`${formBase}/${u._id}/edit`)}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                />
            )}
        </div>
    );
}

export default Users;
