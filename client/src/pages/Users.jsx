import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import UserTable from "../components/UserTable";
import Pagination from "../components/Pagination";
import { FiPlus, FiSearch } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;
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

    useEffect(() => { setPage(1); }, [search]);
    useEffect(() => { fetchUsers(); }, [page, search]);

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-700">
            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="w-64 relative">
                    <input
                        type="text"
                        placeholder="Search team members..."
                        className="w-full px-4 py-2 bg-gray-50 border border-transparent rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-gray-700 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl border shadow-sm p-12 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-teal-50 border-t-teal-600 rounded-full animate-spin" />
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Loading Users...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border shadow-sm p-4 overflow-hidden">
                        <UserTable
                            users={users}
                            onEdit={(u) => navigate(`${formBase}/${u._id}/edit`)}
                            onView={(u) => navigate(`${formBase}/${u._id}/edit?mode=view`)}
                            onDelete={handleDelete}
                            onToggleStatus={handleToggleStatus}
                            onAddNew={() => {}} // Disabled here, use Quick Create
                        />
                    </div>
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
                </div>
            )}
        </div>
    );
}

export default Users;
