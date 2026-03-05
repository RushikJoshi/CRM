import React, { useState, useEffect } from "react";
import { FiX, FiLayers, FiMapPin, FiPhone, FiBriefcase } from "react-icons/fi";
import API from "../services/api";

const AddBranchModal = ({ isOpen, onClose, onSubmit, editingData }) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isSuperAdmin = user.role === "super_admin";

    const [formData, setFormData] = useState({
        name: "",
        address: "",
        phone: "",
        companyId: isSuperAdmin ? "" : user.companyId?._id || user.companyId || ""
    });
    const [companies, setCompanies] = useState([]);

    useEffect(() => {
        if (isOpen) {
            if (isSuperAdmin) {
                fetchCompanies();
            }

            if (editingData) {
                setFormData({
                    ...editingData,
                    companyId: editingData.companyId?._id || editingData.companyId
                });
            } else {
                setFormData({
                    name: "",
                    address: "",
                    phone: "",
                    companyId: isSuperAdmin ? "" : user.companyId?._id || user.companyId || ""
                });
            }
        }
    }, [isOpen, editingData]);

    const fetchCompanies = async () => {
        if (!isSuperAdmin) return;
        try {
            const res = await API.get("/super-admin/companies");
            setCompanies(res.data.companies || []);
        } catch (err) {
            console.error(err);
        }
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
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-gray-100">
                <div className="px-10 py-8 text-center relative bg-green-50/30 border-b border-gray-50">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100">
                        <FiX size={22} />
                    </button>
                    <div className="w-16 h-16 bg-green-100/50 rounded-2xl flex items-center justify-center text-green-600 font-black mx-auto mb-6 shadow-inner ring-4 ring-green-50 ring-offset-2 scale-110">
                        <FiLayers size={28} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        {editingData ? "Synchronize Cluster Node" : "Local Node Deployment"}
                    </h2>
                    <p className="text-gray-400 text-[10px] font-black mt-2 tracking-tight uppercase tracking-[0.2em]">
                        Decentralized Branch Gateway
                    </p>
                </div>

                <form onSubmit={handleFormSubmit} className="px-10 py-10 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Node Title</label>
                            <div className="relative group">
                                <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors pointer-events-none" />
                                <input
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Branch Identity..."
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all text-gray-700 font-bold text-sm tracking-tight shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Parent Identity - Only for Super Admin */}
                        {isSuperAdmin && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Parent Identity</label>
                                <div className="relative group">
                                    <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors pointer-events-none" />
                                    <select
                                        name="companyId"
                                        required
                                        value={formData.companyId}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all text-gray-700 font-black text-sm tracking-tight appearance-none shadow-sm cursor-pointer"
                                    >
                                        <option value="">Select Target Platform...</option>
                                        {companies.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Node Location</label>
                            <div className="relative group">
                                <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors pointer-events-none" />
                                <input
                                    name="address"
                                    required
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Physical Meta-coordinates..."
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all text-gray-700 font-bold text-sm tracking-tight shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Terminal Phone</label>
                            <div className="relative group">
                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors pointer-events-none" />
                                <input
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+ Country Phone Metadata..."
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all text-gray-700 font-bold text-sm tracking-tight shadow-sm"
                                />
                            </div>
                        </div>

                    </div>

                    <div className="pt-8 flex gap-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 font-black rounded-xl text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">Cancel</button>
                        <button type="submit" className="flex-2 px-10 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 text-xs uppercase tracking-widest hover:bg-green-600 hover:scale-[1.02] active:scale-95 transition-all">Deploy Node</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddBranchModal;
