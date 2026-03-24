import React from "react";
import {
    FiEdit2, FiPhone, FiUserPlus, FiCalendar, FiMail,
    FiBriefcase, FiFlag
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

const LeadTable = ({ leads, selectedIds = [], setSelectedIds, onEdit, onDelete, onView, onAssign, onAddTask }) => {
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

    const getStatusStyles = (status) => {
        const s = String(status || "").toLowerCase();
        if (s.includes('won') || s.includes('qualified')) return "bg-[#ecfdf5] text-[#059669]";
        if (s.includes('lost')) return "bg-[#fef2f2] text-[#dc2626]";
        if (s.includes('proposal') || s.includes('negotiation')) return "bg-[#fffbeb] text-[#d97706]";
        if (s.includes('new')) return "bg-[#eff6ff] text-[#2563eb]";
        return "bg-[#f1f5f9] text-[#475569]";
    };

    const avatars = [
        "linear-gradient(135deg, #6366f1, #818cf8)",
        "linear-gradient(135deg, #7c3aed, #a78bfa)",
        "linear-gradient(135deg, #2563eb, #60a5fa)",
        "linear-gradient(135deg, #059669, #34d399)",
        "linear-gradient(135deg, #d97706, #fbbf24)",
        "linear-gradient(135deg, #e11d48, #fb7185)"
    ];

    return (
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr>
                        <th className="crm-table-header w-10">
                            <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded border-[#d4d8e8] text-[var(--indigo)] focus:ring-[var(--indigo)] cursor-pointer"
                                checked={selectedIds.length === leads.length && leads.length > 0}
                                onChange={handleSelectAll}
                            />
                        </th>
                        <th className="crm-table-header">Lead Details</th>
                        <th className="crm-table-header">Contact</th>
                        <th className="crm-table-header">Quick Links</th>
                        <th className="crm-table-header">Assigned To</th>
                        <th className="crm-table-header">Status</th>
                        <th className="crm-table-header text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                    {leads.length > 0 ? (
                        leads.map((lead, idx) => {
                            const status = lead.status?.name || lead.status || "New";
                            const statusStyle = getStatusStyles(status);
                            const initials = (lead.name || "U").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                            const avatarStyle = { background: avatars[idx % avatars.length] };

                            return (
                                <tr
                                    key={lead._id}
                                    onClick={() => onView?.(lead)}
                                    className={`crm-table-row cursor-pointer ${selectedIds.includes(lead._id) ? 'bg-[var(--sb-active)]' : ''}`}
                                >
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="w-3.5 h-3.5 rounded border-[#d4d8e8] text-[var(--indigo)] focus:ring-[var(--indigo)] cursor-pointer"
                                            checked={selectedIds.includes(lead._id)}
                                            onChange={() => handleSelectRow(lead._id)}
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-bold text-[var(--txt)] truncate">{lead.name || "---"}</p>
                                            <p className="text-[11px] text-[var(--txt3)] uppercase tracking-wider font-bold truncate">
                                                {lead.companyName || "Personal"}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="min-w-0 space-y-0.5">
                                            <p className="text-[12px] text-[var(--txt2)] font-medium truncate">
                                                {lead.phone || "---"}
                                            </p>
                                            <p className="text-[11px] text-[var(--txt3)] truncate">
                                                {lead.email || "---"}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            {lead.phone && (
                                                <a
                                                    href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="w-7 h-7 flex items-center justify-center rounded-md border border-teal-50 text-teal-500 hover:bg-teal-50 transition-all shadow-sm"
                                                    title="WhatsApp"
                                                >
                                                    <FaWhatsapp size={13} />
                                                </a>
                                            )}
                                            {lead.email && (
                                                <a
                                                    href={`mailto:${lead.email}`}
                                                    className="w-7 h-7 flex items-center justify-center rounded-md border border-blue-50 text-blue-500 hover:bg-blue-50 transition-all shadow-sm"
                                                    title="Email"
                                                >
                                                    <FiMail size={13} />
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div onClick={(e) => { e.stopPropagation(); onAssign(lead); }} className="hover:text-[var(--indigo)] cursor-pointer">
                                            <span className="text-[12px] font-bold text-gray-700">{lead.assignedTo?.name || "UNASSIGNED"}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest inline-block ${statusStyle}`}>
                                            {status}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            <button onClick={() => onEdit(lead)} className="hover:text-indigo-600 transition-colors">EDIT</button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="7" className="py-20 text-center text-[var(--txt4)] text-[12.5px]">No leads found matching your criteria</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default LeadTable;
