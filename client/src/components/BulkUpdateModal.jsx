import React, { useState, useEffect } from "react";
import { FiX, FiCheck, FiUser, FiFlag } from "react-icons/fi";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

const BulkUpdateModal = ({ isOpen, onClose, ids, action, onUpdated, isStandalone = false }) => {
    const [status, setStatus] = useState("");
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (action === "assign_user" && (isOpen || isStandalone)) {
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
    }, [action, isOpen, isStandalone]);

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

    if (!isOpen && !isStandalone) return null;

    const content = (
        <div className={`bg-white w-full ${isStandalone ? "" : "max-w-md rounded-3xl shadow-2xl relative z-10 border border-gray-100"} overflow-hidden animate-in zoom-in-95 duration-300`}>
            <div className={`p-4 border-b border-gray-50 flex items-center justify-between ${isStandalone ? "bg-white" : "bg-gray-50/50"}`}>
                <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight text-left leading-none">Bulk Update</h2>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 text-left">Updating {ids.length} selected leads</p>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-gray-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100 group">
                    <FiX size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                </button>
            </div>

            <div className="p-5 space-y-4 text-left">
                {action === "update_status" && (
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <FiFlag className="text-teal-600" /> Choose New Status
                        </label>
                        <select
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-500 transition-all font-bold text-gray-700 appearance-none cursor-pointer"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">Select Status...</option>
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="qualified">Qualified</option>
                            <option value="proposal">Out for Proposal</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="closed won">Closed Won</option>
                            <option value="closed lost">Closed Lost</option>
                        </select>
                    </div>
                )}

                {action === "assign_user" && (
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <FiUser className="text-teal-600" /> Select User to Assign
                        </label>
                        <select
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-teal-600/10 focus:border-teal-500 transition-all font-bold text-gray-700 appearance-none cursor-pointer"
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
                    className="w-full py-3.5 bg-gray-900 text-white font-black rounded-xl shadow-xl shadow-gray-400/20 hover:bg-black active:scale-95 transition-all text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {loading ? "Processing..." : (
                        <>
                            <FiCheck size={16} /> Apply Bulk Update
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    if (isStandalone) return content;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
            {content}
        </div>
    );
};

export default BulkUpdateModal;
