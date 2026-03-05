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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-gray-100">
                <div className="px-10 py-8 text-center border-b border-gray-50 relative bg-green-50/30">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all active:scale-90 shadow-sm border border-transparent hover:border-gray-100">
                        <FiX size={22} />
                    </button>
                    <div className="w-16 h-16 bg-green-100/50 rounded-2xl flex items-center justify-center text-green-600 font-black mx-auto mb-6 shadow-inner ring-4 ring-green-50 ring-offset-2 scale-110">
                        <FiTrendingUp size={28} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        {editingData ? "Negotiation Sync" : "New Value Deployment"}
                    </h2>
                    <p className="text-gray-400 text-xs font-[800] uppercase tracking-widest mt-2">Capital Yield Management</p>
                </div>

                <form onSubmit={handleFormSubmit} className="px-10 py-10 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Deal Intelligence</label>
                            <div className="relative group">
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-green-500 transition-colors" />
                                <input name="title" required value={formData.title} onChange={handleChange} placeholder="Deal Identification..." className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" />
                            </div>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none font-black group-focus-within:text-green-500 transition-colors">₹</span>
                                <input name="value" type="number" required value={formData.value} onChange={handleChange} placeholder="Capital Extraction Value..." className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm" />
                            </div>
                            <div className="relative group">
                                <FiTarget className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-green-500 transition-colors" />
                                <select name="stage" required value={formData.stage} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 text-sm appearance-none shadow-sm cursor-pointer">
                                    <option value="">Deal Stage...</option>
                                    <option value="New">New Opportunity</option>
                                    {masterStages.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                                    <option value="Closed Won">Closed Won (Success)</option>
                                    <option value="Closed Lost">Closed Lost (Null)</option>
                                </select>
                            </div>

                            {formData.stage === "Closed Lost" && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-[10px] font-black text-red-400 uppercase tracking-widest px-1">Reason for Loss</label>
                                    <div className="relative group">
                                        <FiX className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-red-500 transition-colors" />
                                        <select name="lostReason" required value={formData.lostReason} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-red-50/30 border border-red-100 rounded-xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-400 transition-all font-black text-gray-700 text-sm appearance-none shadow-sm cursor-pointer">
                                            <option value="">Select Reason...</option>
                                            <option value="Price too high">Price too high</option>
                                            <option value="Competitor selected">Competitor selected</option>
                                            <option value="Budget issue">Budget issue</option>
                                            <option value="No response">No response</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Authority & Link</label>
                            <div className="relative group">
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-green-500 transition-colors" />
                                <select name="companyId" required value={formData.companyId} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 text-sm appearance-none shadow-sm cursor-pointer">
                                    <option value="">Target Platform...</option>
                                    {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="relative group">
                                <FiFlag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-green-500 transition-colors" />
                                <select name="leadId" required value={formData.leadId} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 text-sm appearance-none shadow-sm cursor-pointer">
                                    <option value="">Origin Lead...</option>
                                    {leads.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                                </select>
                            </div>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-green-500 transition-colors" />
                                <select name="assignedTo" required value={formData.assignedTo} onChange={handleChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 text-sm appearance-none shadow-sm cursor-pointer">
                                    <option value="">Overseer Node...</option>
                                    {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                                </select>
                            </div>
                        </div>

                    </div>

                    <div className="pt-8 flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 font-black rounded-xl text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">Abandon</button>
                        <button type="submit" className="flex-2 px-10 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 text-xs uppercase tracking-widest hover:bg-green-600 hover:scale-[1.02] active:scale-95 transition-all">Synchronize Deal</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDealModal;
