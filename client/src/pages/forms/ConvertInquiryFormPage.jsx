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
                const allUsers = Array.isArray(usersRes.data?.data) ? usersRes.data.data : (Array.isArray(usersRes.data) ? usersRes.data : []);
                setUsers(allUsers);
            } catch (err) {
                toast.error("Failed to fetch inquiry details.");
            } finally {
                setFetching(false);
            }
        })();
    }, [id]);

    const handleConvert = async () => {
        setLoading(true);
        try {
            const res = await API.post(`/inquiries/${id}/convert`, { assignedTo: assignedTo || null });
            toast.success(res.data?.message || "Successfully converted to lead.");

            // Redirect based on role
            const role = currentUser.role;
            const base = (role === 'sales' ? '/sales' : (role === 'branch_manager' ? '/branch' : '/company'));
            navigate(`${base}/leads`);
        } catch (err) {
            console.error("Conversion error:", err);
            toast.error(err.response?.data?.message || "Failed to convert inquiry.");
        } finally {
            setLoading(false);
        }
    };

    const inputCls = (field) =>
        `w-full pl-14 pr-12 py-5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none font-black text-[#1A202C] text-sm transition-all
     focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 shadow-sm appearance-none cursor-pointer`;

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
                <div className="w-16 h-16 border-[6px] border-blue-50 border-t-blue-500 rounded-full animate-spin shadow-lg" />
                <p className="text-[#A0AEC0] font-black uppercase tracking-[0.3em] text-[11px]">Loading Data...</p>
            </div>
        );
    }

    if (!inquiry) {
        return (
            <div className="w-full mx-auto text-center py-32 space-y-8 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mx-auto shadow-xl shadow-red-500/10">
                    <FiX size={48} strokeWidth={3} />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-[#1A202C] tracking-tighter">Inquiry Not Found</h2>
                    <p className="text-[#A0AEC0] font-black uppercase tracking-[0.2em] text-[11px] mt-2">The requested inquiry data is missing or removed.</p>
                </div>
                <button onClick={() => navigate(-1)}
                    className="px-10 py-4 bg-[#F4F7FB] text-[#718096] rounded-[20px] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-100 transition-all border border-[#E5EAF2]">
                    Reset Navigation
                </button>
            </div>
        );
    }

    return (
        <div className="w-full space-y-10 pb-24 animate-in fade-in duration-1000">
            {/* Header */}
            <div className="bg-white rounded-[32px] border border-[#E5EAF2] shadow-sm p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
                <button onClick={() => navigate(-1)}
                    className="flex items-center gap-3 text-[11px] font-black text-[#A0AEC0] hover:text-blue-600 transition-all mb-8 group uppercase tracking-widest relative z-10">
                    <FiArrowLeft size={16} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                    Reset & Return
                </button>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-[24px] flex items-center justify-center shadow-xl shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                        <FiTrendingUp size={30} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-[#1A202C] tracking-tighter leading-none mb-2">
                            Convert Inquiry
                        </h1>
                        <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.25em] opacity-80">
                            Move this inquiry to the lead pipeline
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-[#E5EAF2] shadow-sm overflow-hidden w-full">
                <div className="p-12 space-y-10">
                    {/* Summary Box */}
                    <div className="p-8 bg-blue-50/30 border border-blue-100 rounded-[32px] space-y-5 relative group">
                        <div className="absolute top-4 right-8">
                            <FiInfo className="text-blue-400 opacity-20 group-hover:opacity-60 transition-opacity" size={40} />
                        </div>
                        <div className="flex items-center justify-between border-b border-blue-100 pb-4">
                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.25em] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Inquiry Person
                            </span>
                            <span className="text-lg font-black text-[#1A202C]">{inquiry.name}</span>
                        </div>
                        <div className="text-[13px] font-black text-[#718096] italic leading-relaxed py-2">
                            "{inquiry.message || "No message provided."}"
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="p-6 bg-[#F4F7FB] border border-[#E5EAF2] rounded-[24px] flex gap-5">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                            <FiCheckCircle size={20} strokeWidth={3} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em]">Important Info</p>
                            <p className="text-[12px] text-[#718096] font-bold leading-relaxed">
                                This will create a new Lead. The inquiry will then be marked as Converted.
                            </p>
                        </div>
                    </div>

                    {/* Assignment Matrix */}
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Assign To</label>
                        <div className="relative group">
                            <FiShield className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors z-10" />
                            <select
                                className={inputCls("assignedTo")}
                                value={assignedTo}
                                onChange={e => setAssignedTo(e.target.value)}
                            >
                                <option value="">Automated Distribution</option>
                                <option value={currentUser.id || currentUser._id}>Assign to Me (Self)</option>
                                {users.filter(u => u._id !== (currentUser.id || currentUser._id)).map(u => (
                                    <option key={u._id} value={u._id}>{u.name} — Core {u.role?.replace("_", " ").toUpperCase()}</option>
                                ))}
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#CBD5E0]">
                                <FiArrowLeft className="-rotate-90" size={16} strokeWidth={3} />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-6 pt-6 border-t border-[#F4F7FB]">
                        <button type="button" onClick={() => navigate(-1)}
                            className="flex-1 py-5 bg-[#F4F7FB] text-[#A0AEC0] font-black rounded-[24px] border border-[#E5EAF2] hover:bg-slate-100 hover:text-[#718096] transition-all text-[11px] uppercase tracking-[0.25em]">
                            Cancel
                        </button>
                        <button onClick={handleConvert} disabled={loading}
                            className="flex-[2] flex items-center justify-center gap-4 py-5 bg-blue-600 text-white font-black rounded-[24px] hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-blue-600/20 disabled:opacity-50 duration-300">
                            {loading ? (
                                <div className="w-5 h-5 border-[3px] border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><FiCheck size={20} strokeWidth={4} /> Finish Conversion</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
