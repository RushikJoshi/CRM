import React, { useState, useEffect } from "react";
import { FiX, FiUser, FiInfo, FiCheckCircle, FiShield } from "react-icons/fi";
import API from "../services/api";

const ConvertInquiryModal = ({ isOpen, onClose, inquiry, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [users, setUsers] = useState([]);
    const [assignedTo, setAssignedTo] = useState("");

    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            setAssignedTo(currentUser.id || currentUser._id || "");
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            const res = await API.get("/users");
            setUsers(res.data?.data || (Array.isArray(res.data) ? res.data : []));
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
    };

    const handleConvert = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await API.post(`/inquiries/${inquiry._id}/convert`, {
                assignedTo: assignedTo || null
            });
            onSuccess(res.data?.message || "Successfully converted.");
            onClose();
        } catch (err) {
            console.error("Conversion error:", err);
            setError(err.response?.data?.message || "Failed to convert.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !inquiry) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-8 py-6 bg-gradient-to-r from-emerald-50 to-white flex items-center justify-between border-b border-gray-50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight text-emerald-600">Convert to Lead</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Convert Inquiry to Lead</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <FiX size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold animate-shake">
                            {error}
                        </div>
                    )}

                    {/* Inquiry Summary */}
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-200/50 pb-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inquiry Name</span>
                            <span className="text-xs font-black text-gray-900">{inquiry.name}</span>
                        </div>
                        <div className="text-[11px] font-bold text-gray-500 leading-relaxed italic">
                            "{inquiry.message || "No specific requirements provided."}"
                        </div>
                    </div>

                    {/* Information Box */}
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                        <FiInfo className="text-blue-500 shrink-0 mt-0.5" size={16} />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">What happens next?</p>
                            <p className="text-[11px] text-blue-500 font-bold leading-normal">
                                This will create a new Lead. The inquiry will be marked as 'converted'.
                            </p>
                        </div>
                    </div>

                    {/* Assignment */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Assign To</label>
                        <div className="relative group">
                            <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <select
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-bold text-gray-700 text-sm appearance-none cursor-pointer"
                                value={assignedTo}
                                onChange={e => setAssignedTo(e.target.value)}
                            >
                                <option value="">Auto assign / Unassigned</option>
                                <option value={currentUser.id || currentUser._id}>Assign to me</option>
                                {users.filter(u => u._id !== (currentUser.id || currentUser._id)).map(u => (
                                    <option key={u._id} value={u._id}>{u.name} ({u.role?.replace("_", " ")})</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs font-black">▼</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-8 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all text-xs uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConvert}
                            disabled={loading}
                            className="flex-[2] flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-70"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <FiCheckCircle size={18} />
                                    Convert to Lead
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConvertInquiryModal;
