import React, { useState, useEffect } from "react";
import { FiX, FiCheck, FiUserPlus, FiShield } from "react-icons/fi";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

const LeadAssignModal = ({ isOpen, onClose, lead, onAssigned, isStandalone = false }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [selectedUser, setSelectedUser] = useState("");
    const toast = useToast();

    useEffect(() => {
        if (isOpen || isStandalone) {
            setSelectedUser(lead?.assignedTo?._id || lead?.assignedTo || "");
            fetchUsers();
        }
    }, [isOpen, isStandalone, lead]);

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

    if (!isOpen && !isStandalone) return null;

    const content = (
        <div className={`bg-white ${isStandalone ? "" : "rounded-[2rem] max-w-md shadow-2xl relative z-10 border border-gray-100"} w-full overflow-hidden animate-in zoom-in-95 duration-300`}>
            <div className={`p-4 border-b border-gray-50 flex items-center justify-between ${isStandalone ? "bg-white" : "bg-gray-50/30"}`}>
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl shadow-sm">
                        <FiUserPlus size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-900 tracking-tight text-left leading-none">Assign Lead</h3>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 text-left">Assign lead to a user.</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-all shadow-sm">
                    <FiX size={18} />
                </button>
            </div>

            <div className="p-5 space-y-4 text-left">
                <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white border border-teal-100 flex items-center justify-center font-black text-teal-700 text-xs">
                        {lead?.name?.charAt(0)}
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-gray-900 leading-none">{lead?.name}</p>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{lead?.companyName || "No Company"}</p>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1 text-left block">Select User</label>
                    <div className="relative group">
                        <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-600 transition-colors" size={14} />
                        <select
                            className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-500 transition-all font-black text-gray-700 text-xs appearance-none cursor-pointer"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            disabled={fetching}
                        >
                            <option value="">Select User...</option>
                            {users.map(u => (
                                <option key={u._id} value={u._id}>{u.name} ({u.role?.replace("_", " ")})</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300 text-[10px]">▼</div>
                    </div>
                </div>
            </div>

            <div className={`p-5 bg-gray-50 flex gap-3 ${isStandalone ? "border-t border-gray-50" : "border-t border-gray-100"}`}>
                <button onClick={onClose} className="flex-1 py-3 bg-white text-gray-400 font-black rounded-xl hover:bg-gray-100 transition-all text-[10px] uppercase tracking-widest border border-gray-200">
                    Cancel
                </button>
                <button
                    onClick={handleAssign}
                    disabled={loading || fetching}
                    className="flex-[2] flex items-center justify-center gap-2 py-3 bg-teal-700 text-white font-black rounded-xl hover:bg-teal-800 active:scale-95 transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-teal-600/20 disabled:opacity-50"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><FiCheck size={16} /> Confirm</>}
                </button>
            </div>
        </div>
    );

    if (isStandalone) return content;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            {content}
        </div>
    );
};

export default LeadAssignModal;
