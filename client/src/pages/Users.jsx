import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import UserTable from "../components/UserTable";
import AddUserModal from "../components/AddUserModal";
import Pagination from "../components/Pagination";
import { FiPlus, FiSearch, FiShield, FiX, FiUser } from "react-icons/fi";
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
    
    const [activeTask, setActiveTask] = useState(null); // 'create', 'edit'
    const [editingUser, setEditingUser] = useState(null);

    const navigate = useNavigate();
    const toast = useToast();
    const currentUser = getCurrentUser();
    const isSuperAdmin = currentUser?.role === "super_admin";
    const apiBase = isSuperAdmin ? "/super-admin/users" : "/users";

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
            toast.success("User access updated.");
            fetchUsers();
        } catch (err) {
            toast.error("Failed to update user status.");
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (activeTask === 'edit' && editingUser) {
                await API.put(`${apiBase}/${editingUser._id}`, formData);
                toast.success("Identity updated successfully.");
            } else {
                await API.post(`${apiBase}/create`, formData);
                toast.success("New user onboarded successfully.");
            }
            setActiveTask(null);
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || "Operation failed.");
        }
    };

    useEffect(() => { setPage(1); }, [search]);
    useEffect(() => { fetchUsers(); }, [page, search]);

    const closeTask = () => {
        setActiveTask(null);
        setEditingUser(null);
    };

    if (activeTask === 'create' || activeTask === 'edit') {
        return (
            <div className="animate-fade-in bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
                <AddUserModal 
                    isOpen={true} 
                    onClose={closeTask} 
                    onSubmit={handleFormSubmit}
                    editingData={editingUser}
                    isStandalone={true}
                />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-3 pb-4">
            {/* Excel Filter Header */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
                <div className="relative group min-w-[240px]">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={12} />
                    <input
                        type="text"
                        placeholder="Search team members by name or email..."
                        className="w-full h-8 pl-9 pr-3 bg-slate-50 border border-transparent rounded-lg text-[12px] font-medium outline-none focus:bg-white focus:border-indigo-600/20 focus:ring-4 focus:ring-indigo-600/5 transition-all text-slate-700"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Hydrating Team...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <UserTable
                        users={users}
                        onEdit={(u) => { setEditingUser(u); setActiveTask('edit'); }}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                    />
                    <div className="flex items-center justify-between">
                         <div className="text-[12px] text-slate-500 font-medium">
                            Showing <span className="text-slate-900 font-bold">{users.length}</span> of <span className="text-slate-900 font-bold">{total}</span> total members
                         </div>
                         <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default Users;
