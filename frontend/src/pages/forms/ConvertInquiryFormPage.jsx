import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FiCheckCircle, FiShield, FiUser, FiInfo, FiArrowLeft,
    FiTrendingUp, FiCheck, FiX
} from "react-icons/fi";
import API from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { getCurrentUser } from "../../context/AuthContext";

export default function ConvertInquiryFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const currentUser = getCurrentUser() || {};

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [inquiry, setInquiry] = useState(null);
    const [users, setUsers] = useState([]);
    const [assignedTo, setAssignedTo] = useState(currentUser.id || currentUser._id || "");

    useEffect(() => {
        (async () => {
            try {
                const [inqRes, usersRes] = await Promise.all([
                    API.get("/inquiries"),
                    API.get("/users")
                ]);
                const allInq = Array.isArray(inqRes.data?.data) ? inqRes.data.data : (Array.isArray(inqRes.data) ? inqRes.data : []);
                const found = allInq.find(i => i._id === id);
                if (found) setInquiry(found);
                setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
            } catch (err) {
                toast.error("Failed to fetch conversion context.");
            } finally {
                setFetching(false);
            }
        })();
    }, [id]);

    const handleConvert = async () => {
        setLoading(true);
        try {
            await API.post(`/inquiries/${id}/convert`, { assignedTo: assignedTo || null });
            toast.success("Lifecycle Promotion Successful! Lead record initialized.");
            navigate("/inquiries");
        } catch (err) {
            toast.error(err.response?.data?.message || "Internal Promotion protocol failed.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!inquiry) {
        return (
            <div className="max-w-xl mx-auto text-center py-20">
                <FiX className="text-red-300 mx-auto mb-4" size={48} />
                <h2 className="text-2xl font-black text-gray-900">Entity Disconnected</h2>
                <p className="text-gray-400 font-bold mt-2">Inquiry node not found or already purged.</p>
                <button onClick={() => navigate(-1)} className="mt-8 px-6 py-3 bg-gray-100 rounded-xl font-black text-xs uppercase tracking-widest">Return to Base</button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-black text-gray-400 hover:text-emerald-600 transition-colors mb-6 group">
                    <FiArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Abort Conversion
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                        <FiTrendingUp size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Convert to Lead</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            Lifecycle Promotion Protocol
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 space-y-8">
                    {/* Summary Box */}
                    <div className="p-6 bg-emerald-50/30 border border-emerald-100 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                Source Entity
                            </span>
                            <span className="text-sm font-black text-gray-900">{inquiry.name}</span>
                        </div>
                        <div className="text-[11px] font-bold text-gray-500 italic leading-relaxed">
                            "{inquiry.message || "Manual packet entry with no requirement description."}"
                        </div>
                    </div>

                    {/* Assessment */}
                    <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl flex gap-4">
                        <FiInfo className="text-blue-500 shrink-0 mt-1" size={18} />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Impact Assessment</p>
                            <p className="text-[11px] text-blue-500 font-bold leading-relaxed">
                                Promoting this signal will generate a **Lead** node in status **'new'**.
                                The inquiry node will be permanently associated with the lead and status updated to **'converted'**.
                            </p>
                        </div>
                    </div>

                    {/* Assignment Matrix */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tactical Ownership</label>
                        <div className="relative group">
                            <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <select
                                className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all font-black text-gray-700 text-sm appearance-none shadow-sm cursor-pointer"
                                value={assignedTo}
                                onChange={e => setAssignedTo(e.target.value)}
                            >
                                <option value="">Auto-assign / Unassigned</option>
                                <option value={currentUser.id || currentUser._id}>Assign to me (Self)</option>
                                {users.filter(u => u._id !== (currentUser.id || currentUser._id)).map(u => (
                                    <option key={u._id} value={u._id}>{u.name} ({u.role?.replace("_", " ")})</option>
                                ))}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">▼</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-50 mt-8">
                        <button type="button" onClick={() => navigate(-1)}
                            className="flex-1 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all text-sm uppercase tracking-widest">
                            Abandon
                        </button>
                        <button onClick={handleConvert} disabled={loading}
                            className="flex-[2] flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 active:scale-95 transition-all text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 disabled:opacity-50">
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><FiCheck size={18} /> Confirm Promotion</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
