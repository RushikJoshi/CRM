import { useEffect, useState } from "react";
import API from "../services/api";
import UserTable from "../components/UserTable";
import AddUserModal from "../components/AddUserModal";
import { FiPlus, FiFilter, FiSearch } from "react-icons/fi";

function Users() {
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        search: "",
        role: "",
        companyId: ""
    });

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user.role;
    const isSuperAdmin = role === "super_admin";
    const apiBase = isSuperAdmin ? "/super-admin/users" : "/users";

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const url = `${apiBase}?search=${filters.search}&role=${filters.role}${isSuperAdmin ? `&companyId=${filters.companyId}` : ""}`;
            const res = await API.get(url);
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddOrEdit = async (formData) => {
        try {
            if (editingUser) {
                await API.put(`${apiBase}/${editingUser._id}`, formData);
            } else {
                await API.post(apiBase, formData);
            }
            fetchUsers();
            setIsModalOpen(false);
            setEditingUser(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Confirm revocation of user access? Data associations will persist but the identity will be purged.")) {
            try {
                await API.delete(`${apiBase}/${id}`);
                fetchUsers();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            const newStatus = user.status === 'inactive' ? 'active' : 'inactive';
            await API.put(`${apiBase}/${user._id}`, { status: newStatus });
            fetchUsers();
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filters]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Identity Management</h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-75">Provision and audit authorized users across the entire CRM architecture.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group flex-1 lg:w-64">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search identities..."
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
                            value={filters.search}
                            onInput={(e) => setFilters({ ...filters, search: e.target.value })} // Local filter if needed
                        />
                    </div>
                    <button
                        onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                        className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                        <FiPlus size={20} />
                        Initialize Identity
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-[400px] bg-white rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center space-y-4 shadow-sm">
                    <div className="w-12 h-12 border-[6px] border-green-50 border-t-green-500 rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Encrypting Channel Link...</p>
                </div>
            ) : (
                <UserTable
                    users={users}
                    onEdit={(u) => { setEditingUser(u); setIsModalOpen(true); }}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                />
            )}

            <AddUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddOrEdit}
                editingData={editingUser}
            />
        </div>
    );
}

export default Users;
