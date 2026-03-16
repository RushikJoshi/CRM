import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import UserTable from "../components/UserTable";
import Pagination from "../components/Pagination";
import { FiPlus, FiSearch, FiUser } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;
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
            const res = await API.get(`${apiBase}?search=${encodeURIComponent(search)}&page=${page}&limit=${pageSize}`);
            const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setUsers(data);
            setTotalPages(res.data?.totalPages ?? 1);
            setTotal(res.data?.total ?? data.length);
        } catch (err) {
            console.error(err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this user?")) return;
        try {
            await API.delete(`${apiBase}/${id}`);
            toast.success("User deleted.");
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to remove user.");
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            const newStatus = user.status === "inactive" ? "active" : "inactive";
            await API.put(`${apiBase}/${user._id}`, { status: newStatus });
            toast.success("User status updated.");
            fetchUsers();
        } catch (err) {
            toast.error("Failed to update user status.");
        }
    };

    useEffect(() => { fetchUsers(); }, [search]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-16">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Users List</h1>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest opacity-80 flex items-center gap-2">
                        <FiUser className="text-sky-500" />
                        Manage your team and user permissions
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 relative z-10 w-full lg:w-auto">
                    <div className="relative group flex-1 lg:w-64">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-sky-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-200 transition-all font-bold text-gray-700 text-sm shadow-sm placeholder-gray-300"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => navigate(`${formBase}/create`)}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-3.5 bg-sky-500 text-white font-black rounded-2xl shadow-lg shadow-sky-500/20 hover:bg-sky-600 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest min-w-[180px]"
                    >
                        <FiPlus size={20} strokeWidth={3} />
                        Add New User
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-[400px] bg-white rounded-[32px] border border-gray-100 flex flex-col items-center justify-center space-y-6 shadow-sm border-dashed animate-pulse">
                    <div className="w-12 h-12 border-[4px] border-sky-50 border-t-sky-500 rounded-full animate-spin shadow-lg" />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[11px]">Loading users...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <UserTable
                        users={users}
                        onEdit={(u) => navigate(`${formBase}/${u._id}/edit`)}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                    />
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
                </div>
            )}
        </div>
    );
}

export default Users;
