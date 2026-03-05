import React, { useState, useEffect } from "react";
import { FiX, FiBriefcase, FiMail, FiPhone } from "react-icons/fi";

const AddCompanyModal = ({ isOpen, onClose, onSubmit, editingData }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        status: "active"
    });

    useEffect(() => {
        if (editingData) {
            setFormData(editingData);
        } else {
            setFormData({ name: "", email: "", phone: "", status: "active" });
        }
    }, [editingData, isOpen]);

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

                {/* Profile Header */}
                <div className="px-10 py-8 text-center relative bg-green-50/30 border-b border-gray-50">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-all active:scale-90 shadow-sm border border-transparent hover:border-gray-100"
                    >
                        <FiX size={22} />
                    </button>
                    <div className="w-16 h-16 bg-green-100/50 rounded-2xl flex items-center justify-center text-green-600 font-black mx-auto mb-6 shadow-inner ring-4 ring-green-50 ring-offset-2 scale-110">
                        <FiBriefcase size={28} strokeWidth={2.5} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        {editingData ? "Profile Synchronization" : "Resource Initialization"}
                    </h2>
                    <p className="text-gray-400 text-[10px] font-black mt-2 tracking-tight uppercase tracking-[0.2em]">
                        Company Management Gateway
                    </p>
                </div>

                {/* Dynamic Interface Build */}
                <form onSubmit={handleFormSubmit} className="px-10 py-10 space-y-6">
                    <div className="space-y-4">

                        <div className="space-y-2">
                            <label htmlFor="name" className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Identity Name</label>
                            <div className="relative group">
                                <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors pointer-events-none" />
                                <input
                                    id="name"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="The Enterprise Name..."
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all text-gray-700 font-bold text-sm tracking-tight shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Network Email</label>
                            <div className="relative group">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors pointer-events-none" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="contact@enterprise.com"
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all text-gray-700 font-bold text-sm tracking-tight shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="phone" className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Contact Terminal</label>
                            <div className="relative group">
                                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-green-500 transition-colors pointer-events-none" />
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+ Country Code Mobile..."
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all text-gray-700 font-bold text-sm tracking-tight shadow-sm"
                                />
                            </div>
                        </div>

                        {editingData && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Lifecycle Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-700 text-sm tracking-tight appearance-none shadow-sm cursor-pointer"
                                >
                                    <option value="active">Operational (Active)</option>
                                    <option value="inactive">Decommissioned (Inactive)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="pt-8 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 font-black rounded-xl text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-2 px-10 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 text-xs uppercase tracking-widest hover:bg-green-600 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {editingData ? "Sync Cluster" : "Sync Database"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddCompanyModal;
