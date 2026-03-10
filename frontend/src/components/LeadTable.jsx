import React, { useState } from "react";
import {
    FiEdit2, FiUser, FiPhone, FiCheckCircle, FiBriefcase,
    FiFlag, FiEye, FiUserPlus, FiCalendar, FiMail,
    FiTrash2, FiRepeat, FiX, FiCheck, FiDownload
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

const LeadTable = ({ leads, onEdit, onDelete, onConvert, onView, onAssign, onAddTask, onBulkAction }) => {
    const [selectedIds, setSelectedIds] = useState([]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(leads.map(l => l._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const resetSelection = () => setSelectedIds([]);

    const handleExportCSV = () => {
        const selectedLeads = leads.filter(l => selectedIds.includes(l._id));
        const headers = ["Name", "Email", "Phone", "Company", "Status", "Value", "Assigned To"];
        const rows = selectedLeads.map(l => [
            l.name || "N/A",
            l.email || "N/A",
            l.phone || "N/A",
            l.companyName || "N/A",
            l.status?.name || l.status || "N/A",
            l.value || 0,
            l.assignedTo?.name || "Unassigned"
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Leads_Export_${new Date().toLocaleDateString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        resetSelection();
    };

    return (
        <div className="relative">
            <div className="canvas-card overflow-hidden min-h-[500px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 shadow-sm relative z-10">
                                <th className="px-6 py-5 w-10">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded-md border-[#E5EAF2] text-blue-600 focus:ring-blue-500 cursor-pointer transition-all"
                                        checked={selectedIds.length === leads.length && leads.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Lead Name</th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Quick Links</th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Value</th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Assigned To</th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F2F5]">
                            {leads.length > 0 ? (
                                leads.map((lead) => (
                                    <tr
                                        key={lead._id}
                                        className={`hover:bg-slate-50/80 transition-all group duration-300 ${selectedIds.includes(lead._id) ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <td className="px-6 py-6">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded-md border-[#E5EAF2] text-blue-600 focus:ring-blue-500 cursor-pointer transition-all"
                                                checked={selectedIds.includes(lead._id)}
                                                onChange={() => handleSelectRow(lead._id)}
                                            />
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center">
                                                <div className="relative">
                                                    <div className="w-12 h-12 rounded-[16px] bg-gray-50 text-gray-900 flex items-center justify-center text-[15px] font-black mr-4 group-hover:bg-sky-500 group-hover:text-white transition-all duration-500 shadow-sm border border-transparent group-hover:border-sky-200">
                                                        {lead.name?.charAt(0) || "L"}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="font-bold text-[#1A202C] text-[15px] tracking-tight hover:text-blue-600 cursor-pointer transition-colors block">{lead.name || "Anonymous Lead"}</span>
                                                    <div className="flex items-center text-[11px] font-black text-[#A0AEC0] uppercase tracking-widest mt-1.5 opacity-70">
                                                        <FiBriefcase className="mr-2" size={10} />
                                                        {lead.companyName || "Personal Lead"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center text-[#718096] text-[13px] font-bold">
                                                    <FiPhone className="mr-2.5 text-[#CBD5E0]" size={14} />
                                                    {lead.phone || "No direct line"}
                                                </div>
                                                <div className="flex items-center text-[#A0AEC0] text-[11px] font-medium mt-1">
                                                    <FiMail className="mr-2.5 text-[#CBD5E0]" size={12} />
                                                    {lead.email || "No email provided"}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                {lead.phone && (
                                                    <a
                                                        href={`https://wa.me/${lead.phone.replace(/\D/g, '') || lead.phone}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-10 h-10 bg-[#F4F7FB] text-[#718096] rounded-xl flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all shadow-sm border border-transparent hover:border-[#25D366] hover:scale-110"
                                                        title="WhatsApp Lead"
                                                    >
                                                        <FaWhatsapp size={18} />
                                                    </a>
                                                )}
                                                {lead.email && (
                                                    <a
                                                        href={`mailto:${lead.email}`}
                                                        className="w-10 h-10 bg-[#F4F7FB] text-[#718096] rounded-xl flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm border border-transparent hover:border-blue-200 hover:scale-110"
                                                        title="Send Email"
                                                    >
                                                        <FiMail size={16} />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-[0.1em] mb-1 leading-none">Estimate</span>
                                                <div className="flex items-center text-[#1A202C] font-black text-[15px]">
                                                    <span className="text-[#A0AEC0] mr-1.5 font-bold tracking-widest text-[12px]">₹</span>
                                                    {(lead.value || 0).toLocaleString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 w-fit">
                                                <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center text-[10px] font-black">
                                                    {lead.assignedTo?.name?.charAt(0) || "U"}
                                                </div>
                                                <span className="text-[12px] font-bold text-[#718096] truncate max-w-[100px]">{lead.assignedTo?.name || "Open Lead"}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${String(lead.status?.name || lead.status).toLowerCase().includes('qualified') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                String(lead.status?.name || lead.status).toLowerCase().includes('proposal') ? 'bg-sky-50 text-sky-600 border-sky-100' :
                                                    String(lead.status?.name || lead.status).toLowerCase().includes('negotiation') ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                        String(lead.status?.name || lead.status).toLowerCase().includes('lost') ? 'bg-red-50 text-red-600 border-red-100' :
                                                            String(lead.status?.name || lead.status).toLowerCase().includes('won') ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10' :
                                                                'bg-gray-50 text-gray-400 border-gray-100'
                                                }`}>
                                                <FiFlag className="mr-2" size={12} strokeWidth={3} />
                                                {lead.status?.name || lead.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => onView(lead)}
                                                    className="w-10 h-10 bg-white border border-[#E5EAF2] rounded-xl flex items-center justify-center text-[#718096] hover:text-blue-600 hover:border-blue-200 hover:bg-slate-50 transition-all shadow-sm"
                                                    title="Quick View"
                                                >
                                                    <FiEye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => onAddTask(lead)}
                                                    className="w-10 h-10 bg-white border border-[#E5EAF2] rounded-xl flex items-center justify-center text-[#718096] hover:text-indigo-600 hover:border-indigo-200 hover:bg-slate-50 transition-all shadow-sm"
                                                    title="Add Task"
                                                >
                                                    <FiCalendar size={16} />
                                                </button>
                                                <button
                                                    onClick={() => onEdit(lead)}
                                                    className="w-10 h-10 bg-sky-500 text-white rounded-xl flex items-center justify-center hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20"
                                                    title="Edit Lead"
                                                >
                                                    <FiEdit2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-8 py-32 text-center bg-[#F4F7FB]/30">
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-[#CBD5E0] mb-6">
                                                <FiUser size={36} />
                                            </div>
                                            <p className="text-[11px] font-black text-[#A0AEC0] uppercase tracking-[0.2em]">No records found for this criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Floating Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-[#1A202C] text-white px-10 py-6 rounded-[40px] shadow-2xl flex items-center gap-12 z-50 animate-in slide-in-from-bottom-24 duration-700 border border-white/10 backdrop-blur-xl">
                    <div className="flex items-center gap-5 pr-12 border-r border-white/10">
                        <div className="w-12 h-12 bg-sky-500 text-white rounded-2xl flex items-center justify-center text-lg font-black shadow-xl shadow-sky-500/20 animate-pulse">
                            {selectedIds.length}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Selected</p>
                            <p className="text-[13px] font-black text-white">Bulk Actions</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleExportCSV}
                            className="group flex items-center gap-3 px-6 py-4 hover:bg-white/5 rounded-[20px] transition-all text-[11px] font-black uppercase tracking-widest text-[#A0AEC0] hover:text-emerald-400"
                        >
                            <FiDownload size={18} className="text-emerald-500 transition-transform group-hover:scale-110" />
                            Export Data
                        </button>
                        <button
                            onClick={() => onBulkAction(selectedIds, 'update_status', resetSelection)}
                            className="group flex items-center gap-3 px-6 py-4 hover:bg-white/5 rounded-[20px] transition-all text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-sky-400"
                        >
                            <FiRepeat size={18} className="text-sky-500" />
                            Change Status
                        </button>
                        <button
                            onClick={() => onBulkAction(selectedIds, 'assign_user', resetSelection)}
                            className="group flex items-center gap-3 px-6 py-4 hover:bg-white/5 rounded-[20px] transition-all text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-400"
                        >
                            <FiUserPlus size={18} className="text-indigo-500" />
                            Reassign
                        </button>
                        <button
                            onClick={() => onBulkAction(selectedIds, 'delete', resetSelection)}
                            className="group flex items-center gap-3 px-6 py-4 hover:bg-red-500/10 rounded-[20px] transition-all text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500"
                        >
                            <FiTrash2 size={18} className="text-red-500" />
                            Delete
                        </button>
                    </div>

                    <button
                        onClick={resetSelection}
                        className="p-4 hover:bg-white/10 rounded-full transition-all text-[#A0AEC0] hover:text-white hover:rotate-90 duration-300"
                    >
                        <FiX size={24} strokeWidth={3} />
                    </button>
                </div>
            )}

        </div>
    );
};

export default LeadTable;
