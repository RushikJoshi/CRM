import React, { useState, useEffect } from "react";
import { FiUserPlus, FiX, FiCheck, FiShield, FiUser } from "react-icons/fi";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

const LeadAssignModal = ({ isOpen, onClose, lead, onAssigned }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [selectedUser, setSelectedUser] = useState("");
    const toast = useToast();

    useEffect(() => {
        if (isOpen) {
            setSelectedUser(lead?.assignedTo?._id || lead?.assignedTo || "");
            fetchUsers();
        }
    }, [isOpen, lead]);

    const fetchUsers = async () => {
        setFetching(true);
        try {
            const currentUser = getCurrentUser();
            const isSuperAdmin = currentUser?.role === "super_admin";
            const url = isSuperAdmin
                ? `/super-admin/users?companyId=${lead?.companyId?._id || lead?.companyId}`
                : "/users";

            const res = await API.get(url);
            const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setFetching(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedUser) {
            toast.warning("Please select a user.");
            return;
        }
        setLoading(true);
        try {
            await API.put(`/leads/${lead._id}`, { assignedTo: selectedUser });
            toast.success("Lead assigned.");
            onAssigned();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Assignment failed.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm">
                            <FiUserPlus size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Assign Lead</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Assign this lead to a user.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white text-gray-400 hover:text-red-500 rounded-xl transition-all shadow-sm">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center font-black text-blue-600 text-sm">
                            {lead?.name?.charAt(0)}
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-900">{lead?.name}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lead?.companyName || "No Company"}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Select User</label>
                        <div className="relative group">
                            <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <select
                                className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-black text-gray-700 text-sm appearance-none cursor-pointer"
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                disabled={fetching}
                            >
                                <option value="">Select a User...</option>
                                {users.map(u => (
                                    <option key={u._id} value={u._id}>{u.name} ({u.role?.replace("_", " ")})</option>
                                ))}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">▼</div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-gray-50 flex gap-4 border-t border-gray-100">
                    <button onClick={onClose} className="flex-1 py-4 bg-white text-gray-400 font-black rounded-2xl hover:bg-gray-100 transition-all text-xs uppercase tracking-widest border border-gray-200">
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={loading || fetching}
                        className="flex-[2] flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 active:scale-95 transition-all text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 disabled:opacity-50"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><FiCheck size={18} /> Confirm</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeadAssignModal;
