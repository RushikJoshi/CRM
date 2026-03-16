import React, { useState, useEffect } from "react";
import { FiX, FiCheck, FiUser, FiFlag } from "react-icons/fi";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

const BulkUpdateModal = ({ isOpen, onClose, ids, action, onUpdated }) => {
    const [status, setStatus] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (action === "assign_user" && isOpen) {
            const fetchUsers = async () => {
                try {
                    const currentUser = getCurrentUser();
                    const isSuperAdmin = currentUser?.role === "super_admin";
                    const url = isSuperAdmin ? "/super-admin/users" : "/users";
                    const res = await API.get(url);
                    setUsers(res.data?.data || []);
                } catch (err) {
                    console.error("Error fetching users:", err);
                }
            };
            fetchUsers();
        }
    }, [action, isOpen]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const updateData = {};
            if (action === "update_status") {
                updateData.status = status;
            } else if (action === "assign_user") {
                const userObj = users.find(u => u._id === selectedUser);
                updateData.assignedTo = selectedUser;
                updateData.assignedToName = userObj?.name;
            }

            await API.patch("/leads/bulk", {
                ids,
                action,
                updateData
            });

            toast.success(`Successfully updated ${ids.length} leads.`);
            onUpdated();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || "Bulk update failed.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>

            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Bulk Update</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Updating {ids.length} selected leads</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100 group">
                        <FiX size={20} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {action === "update_status" && (
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <FiFlag className="text-blue-500" /> Choose New Status
                            </label>
                            <select
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all font-bold text-gray-700 appearance-none cursor-pointer"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="">Select Status...</option>
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Qualified">Qualified</option>
                                <option value="Proposal">Proposal</option>
                                <option value="Negotiation">Negotiation</option>
                                <option value="Closed Won">Closed Won</option>
                                <option value="Closed Lost">Closed Lost</option>
                            </select>
                        </div>
                    )}

                    {action === "assign_user" && (
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <FiUser className="text-indigo-500" /> Select User to Assign
                            </label>
                            <select
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all font-bold text-gray-700 appearance-none cursor-pointer"
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                            >
                                <option value="">Select a user...</option>
                                {users.map(u => (
                                    <option key={u._id} value={u._id}>{u.name} ({u.role?.replace('_', ' ') || 'User'})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={loading || (action === 'update_status' && !status) || (action === 'assign_user' && !selectedUser)}
                        className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-gray-400/20 hover:bg-black hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Processing..." : (
                            <>
                                <FiCheck size={18} /> Apply Bulk Update
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkUpdateModal;
