import React from "react";
import {
    FiEdit2, FiPhone, FiUserPlus, FiCalendar, FiMail,
    FiBriefcase, FiFlag, FiEye, FiMoreHorizontal, FiTrash2
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

const LeadTable = ({ leads, selectedIds = [], setSelectedIds, onEdit, onDelete, onView, onAssign, onAddTask, onMerge }) => {
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
        if (s.includes('won') || s.includes('qualified')) return "bg-emerald-50 text-emerald-600";
        if (s.includes('lost')) return "bg-rose-50 text-rose-600";
        if (s.includes('proposal') || s.includes('negotiation')) return "bg-amber-50 text-amber-600";
        if (s.includes('new')) return "bg-indigo-50 text-indigo-600";
        return "bg-slate-100 text-slate-500";
    };

    return (
        <div className="saas-table-excel-container">
            <table className="saas-table-excel">
                <thead>
                    <tr>
                        <th className="saas-th-excel w-10 text-center">
                            <input
                                type="checkbox"
                                className="w-3 h-3 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                checked={selectedIds.length === leads.length && leads.length > 0}
                                onChange={handleSelectAll}
                            />
                        </th>
                        <th className="saas-th-excel">Prospect Profile</th>
                        <th className="saas-th-excel">Contact Info</th>
                        <th className="saas-th-excel text-center">Channels</th>
                        <th className="saas-th-excel">Assigned To</th>
                        <th className="saas-th-excel">Lifecycle</th>
                        <th className="saas-th-excel text-right px-6">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {leads.length > 0 ? (
                        leads.map((lead, idx) => {
                            const status = lead.status?.name || lead.status || "New";
                            const statusStyle = getStatusStyles(status);

                            return (
                                <tr
                                    key={lead._id}
                                    className={`saas-tr-excel group ${selectedIds.includes(lead._id) ? 'bg-indigo-50/40' : ''}`}
                                >
                                    <td className="saas-td-excel text-center" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="w-3 h-3 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            checked={selectedIds.includes(lead._id)}
                                            onChange={() => handleSelectRow(lead._id)}
                                        />
                                    </td>
                                    <td className="saas-td-excel" onClick={() => onView?.(lead)}>
                                        <div className="flex items-center gap-2.5 cursor-pointer">
                                            <div className="min-w-0">
                                                <div className="font-bold text-slate-800 text-[12px] hover:text-indigo-600 truncate transition-colors leading-tight">{lead.name || "Unknown"}</div>
                                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter truncate opacity-70">
                                                    {lead.customId || "No-ID"}
                                                </div>
                                                {lead.duplicateCount > 0 && (
                                                    <div className="mt-1 inline-flex px-2 py-0.5 rounded bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-100">
                                                        {lead.duplicateCount} Duplicate{lead.duplicateCount > 1 ? "s" : ""}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="saas-td-excel">
                                        <div className="flex flex-col leading-tight">
                                            <span className="text-[12px] font-bold text-slate-700">{lead.phone || "-"}</span>
                                            <span className="text-[10px] text-slate-400 truncate opacity-80">{lead.email || "-"}</span>
                                        </div>
                                    </td>
                                    <td className="saas-td-excel" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-center gap-3">
                                            {lead.phone && (
                                                <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black hover:text-emerald-600 transition-colors text-slate-400 uppercase tracking-widest">WA</a>
                                            )}
                                            {lead.email && (
                                                <a href={`mailto:${lead.email}`} className="text-[10px] font-black hover:text-indigo-600 transition-colors text-slate-400 uppercase tracking-widest">Mail</a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="saas-td-excel" onClick={(e) => { e.stopPropagation(); onAssign(lead); }}>
                                        <div className="flex items-center gap-2 cursor-pointer group/user">
                                            <span className="text-[11px] font-bold text-slate-600 truncate group-hover/user:text-indigo-600 transition-colors uppercase tracking-tight">{lead.assignedTo?.name?.split(' ')[0] || "Unassigned"}</span>
                                        </div>
                                    </td>
                                    <td className="saas-td-excel">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${statusStyle}`}>
                                            {status}
                                        </span>
                                    </td>
                                    <td className="saas-td-excel text-right px-6" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-3 translate-x-3">
                                            <button 
                                                onClick={() => onView?.(lead)} 
                                                className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-all"
                                            >
                                                <FiEye size={13} /> View
                                            </button>
                                            <button 
                                                onClick={() => onEdit(lead)} 
                                                className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-amber-600 uppercase tracking-widest transition-all"
                                            >
                                                <FiEdit2 size={13} /> Edit
                                            </button>
                                            {lead.duplicateCount > 0 && (
                                                <button
                                                    onClick={() => onMerge?.(lead)}
                                                    className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 hover:text-amber-600 uppercase tracking-widest transition-all"
                                                >
                                                    Merge
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="7" className="px-6 py-20 text-center bg-white">
                                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No matching records found</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default LeadTable;
