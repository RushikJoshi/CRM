import React, { useState, useEffect } from "react";
import { FiX, FiCheckCircle, FiUser, FiTrendingUp, FiBriefcase, FiFlag, FiTarget } from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import API from "../services/api";

const AddDealModal = ({ isOpen, onClose, onSubmit, editingData }) => {
    const [formData, setFormData] = useState({
        title: "",
        value: 0,
        stage: "New",
        lostReason: "",
        leadId: "",
        companyId: "",
        assignedTo: ""
    });

    const [companies, setCompanies] = useState([]);
    const [leads, setLeads] = useState([]);
    const [users, setUsers] = useState([]);
    const [masterStages, setMasterStages] = useState([]);

    useEffect(() => {
        if (isOpen) {
            if (editingData) {
                setFormData({
                    ...editingData,
                    companyId: editingData.companyId?._id || editingData.companyId || "",
                    leadId: editingData.leadId?._id || editingData.leadId || "",
                    assignedTo: editingData.assignedTo?._id || editingData.assignedTo || ""
                });
            } else {
                setFormData({ title: "", value: 0, stage: "New", leadId: "", companyId: "", assignedTo: "" });
            }
            fetchCompanies();
            fetchMasterData();
        }
    }, [isOpen, editingData]);

    useEffect(() => {
        if (formData.companyId) {
            fetchLeads(formData.companyId);
            fetchUsers(formData.companyId);
        } else {
            setLeads([]);
            setUsers([]);
        }
    }, [formData.companyId]);

    const fetchCompanies = async () => {
        try {
            const res = await API.get("/super-admin/companies");
            setCompanies(res.data.companies || []);
        } catch (err) { console.error(err); }
    };

    const fetchMasterData = async () => {
        try {
            const res = await API.get("/master?type=deal_stage");
            setMasterStages(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchLeads = async (cid) => {
        try {
            const res = await API.get(`/super-admin/leads?companyId=${cid}`);
            setLeads(res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchUsers = async (cid) => {
        try {
            const res = await API.get(`/super-admin/users?companyId=${cid}`);
            setUsers(res.data || []);
        } catch (err) { console.error(err); }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl border border-[#E5EAF2] overflow-hidden animate-in zoom-in-95 duration-500 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-600/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

                {/* Header */}
                <div className="px-10 py-10 bg-white flex flex-col items-center justify-center border-b border-[#F0F2F5] relative z-10 text-center">
                    <button onClick={onClose} className="absolute top-8 right-8 p-3 text-[#A0AEC0] hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100 shadow-sm hover:rotate-90">
                        <FiX size={22} strokeWidth={3} />
                    </button>
                    <div className="w-16 h-16 bg-teal-700 text-white rounded-[22px] flex items-center justify-center shadow-2xl shadow-teal-600/30 transform -rotate-3 mb-6">
                        <FiTrendingUp size={32} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-3xl font-black text-[#1A202C] tracking-tighter">
                        {editingData ? "Refine Acquisition" : "Architect Negotiation"}
                    </h2>
                    <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.3em] mt-3 opacity-80">
                        Deal Pipeline Synchronization
                    </p>
                </div>

                <form onSubmit={handleFormSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2 font-black">Strategic Parameters</label>

                            <div className="relative group">
                                <FiBriefcase size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors" />
                                <input name="title" required value={formData.title} onChange={handleChange} placeholder="Strategic Title..." className="w-full pl-14 pr-6 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-teal-600/5 focus:border-teal-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]" />
                            </div>

                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] font-black group-focus-within:text-teal-700 transition-colors">₹</span>
                                <input name="value" type="number" required value={formData.value} onChange={handleChange} placeholder="Projected Value..." className="w-full pl-14 pr-6 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-teal-600/5 focus:border-teal-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]" />
                            </div>

                            <div className="relative group">
                                <FiTarget size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors z-10" />
                                <select name="stage" required value={formData.stage} onChange={handleChange} className="w-full pl-14 pr-12 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-teal-600/5 focus:border-teal-300 transition-all font-black text-[#1A202C] text-sm appearance-none shadow-sm cursor-pointer">
                                    <option value="">Pipeline Stage...</option>
                                    <option value="New">Discovery / New Node</option>
                                    {masterStages.map(s => <option key={s._id} value={s.name}>{s.name} Stage</option>)}
                                    <option value="Closed Won">Commit Won</option>
                                    <option value="Closed Lost">Archive Lost</option>
                                </select>
                            </div>

                            {formData.stage === "Closed Lost" && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <label className="text-[11px] font-black text-red-500 uppercase tracking-[0.15em] ml-2">Attrition Reason</label>
                                    <div className="relative group">
                                        <FiX size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-red-300 group-focus-within:text-red-500 transition-colors z-10" />
                                        <select name="lostReason" required value={formData.lostReason} onChange={handleChange} className="w-full pl-14 pr-12 py-4.5 bg-red-50/50 border border-red-100 rounded-[24px] outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-300 transition-all font-black text-red-900 text-sm appearance-none shadow-sm cursor-pointer">
                                            <option value="">Select Logic...</option>
                                            <option value="Price too high">Revenue Threshold Violation</option>
                                            <option value="Competitor selected">External Node Shift</option>
                                            <option value="Budget issue">Fiscal Constraint</option>
                                            <option value="No response">Communication Deadlock</option>
                                            <option value="Other">Miscellaneous Attrition</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2 font-black">Entity Linkage</label>

                            <div className="relative group">
                                <FiBriefcase size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors z-10" />
                                <select name="companyId" required value={formData.companyId} onChange={handleChange} className="w-full pl-14 pr-12 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-teal-600/5 focus:border-teal-300 transition-all font-black text-[#1A202C] text-sm appearance-none shadow-sm cursor-pointer">
                                    <option value="">Origin Enterprise...</option>
                                    {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="relative group">
                                <FiFlag size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors z-10" />
                                <select name="leadId" required value={formData.leadId} onChange={handleChange} className="w-full pl-14 pr-12 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-teal-600/5 focus:border-teal-300 transition-all font-black text-[#1A202C] text-sm appearance-none shadow-sm cursor-pointer">
                                    <option value="">Primary Prospect...</option>
                                    {leads.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                </select>
                            </div>

                            <div className="relative group">
                                <FiUser size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-teal-700 transition-colors z-10" />
                                <select name="assignedTo" required value={formData.assignedTo} onChange={handleChange} className="w-full pl-14 pr-12 py-4.5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-teal-600/5 focus:border-teal-300 transition-all font-black text-[#1A202C] text-sm appearance-none shadow-sm cursor-pointer">
                                    <option value="">Assigned Architect...</option>
                                    {users.map(u => <option key={u._id} value={u._id}>{u.name} [{u.role.split('_')[0].toUpperCase()}]</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 flex flex-col sm:flex-row gap-6 border-t border-[#F4F7FB]">
                        <button type="button" onClick={onClose} className="flex-1 py-5 bg-[#F4F7FB] text-[#A0AEC0] font-black rounded-[24px] border border-[#E5EAF2] hover:bg-slate-100 hover:text-[#718096] transition-all text-[11px] uppercase tracking-[0.25em]">Abort sync</button>
                        <button type="submit" className="flex-[2] py-5 bg-teal-700 text-white font-black rounded-[24px] hover:bg-teal-800 hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-teal-700/20 duration-300">
                            Commit Acquisition
                        </button>
                    </div>
                </form>
            </div>
        </div>

    );
};

export default AddDealModal;
