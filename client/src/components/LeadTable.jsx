import React from "react";
import {
    FiEdit2, FiPhone, FiUserPlus, FiCalendar, FiMail,
    FiBriefcase, FiFlag, FiEye, FiMoreHorizontal
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
        if (s.includes('won') || s.includes('qualified')) return "bg-emerald-50 text-emerald-600";
        if (s.includes('lost')) return "bg-rose-50 text-rose-600";
        if (s.includes('proposal') || s.includes('negotiation')) return "bg-amber-50 text-amber-600";
        if (s.includes('new')) return "bg-indigo-50 text-indigo-600";
        return "bg-slate-100 text-slate-500";
    };

    return (
        <div className="saas-table-container">
            <table className="saas-table">
                <thead>
                    <tr>
                        <th className="saas-th w-10">
                            <input
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                checked={selectedIds.length === leads.length && leads.length > 0}
                                onChange={handleSelectAll}
                            />
                        </th>
                        <th className="saas-th">Prospect Profile</th>
                        <th className="saas-th">Contact Metadata</th>
                        <th className="saas-th">Omnichannel</th>
                        <th className="saas-th">Ownership</th>
                        <th className="saas-th">Lifecycle State</th>
                        <th className="saas-th text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {leads.length > 0 ? (
                        leads.map((lead, idx) => {
                            const status = lead.status?.name || lead.status || "New";
                            const statusStyle = getStatusStyles(status);

                            return (
                                <tr
                                    key={lead._id}
                                    className={`saas-tr group ${selectedIds.includes(lead._id) ? 'bg-indigo-50/30' : ''}`}
                                >
                                    <td className="saas-td" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            checked={selectedIds.includes(lead._id)}
                                            onChange={() => handleSelectRow(lead._id)}
                                        />
                                    </td>
                                    <td className="saas-td" onClick={() => onView?.(lead)}>
                                        <div className="flex items-center gap-3 cursor-pointer">
                                            <div className="w-7 h-7 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px] uppercase">
                                                {lead.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-900 text-[13px] hover:text-indigo-600 transition-colors">{lead.name || "Unknown Lead"}</div>
                                                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 uppercase tracking-tight">
                                                    <FiBriefcase size={10} className="text-slate-300" />
                                                    {lead.companyName || "Personal Interest"}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="saas-td">
                                        <div className="space-y-0.5">
                                            <div className="text-[12px] font-semibold text-slate-700">{lead.phone || "No contact"}</div>
                                            <div className="text-[11px] text-slate-400 lowercase tracking-tight">{lead.email || "No email record"}</div>
                                        </div>
                                    </td>
                                    <td className="saas-td" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-1.5">
                                            {lead.phone && (
                                                <a
                                                    href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="w-6 h-6 flex items-center justify-center rounded border border-emerald-100 text-emerald-600 bg-emerald-50/30 hover:bg-emerald-50 transition-all"
                                                    title="WhatsApp Direct"
                                                >
                                                    <FaWhatsapp size={12} />
                                                </a>
                                            )}
                                            {lead.email && (
                                                <a
                                                    href={`mailto:${lead.email}`}
                                                    className="w-6 h-6 flex items-center justify-center rounded border border-indigo-100 text-indigo-600 bg-indigo-50/30 hover:bg-indigo-50 transition-all"
                                                    title="Email Dispatch"
                                                >
                                                    <FiMail size={12} />
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="saas-td" onClick={(e) => { e.stopPropagation(); onAssign(lead); }}>
                                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-600 transition-colors">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500 uppercase">
                                                {lead.assignedTo?.name?.charAt(0) || <FiUserPlus size={10} />}
                                            </div>
                                            <span className="text-[12px] font-bold text-slate-700 uppercase tracking-tight">{lead.assignedTo?.name || "Unassigned"}</span>
                                        </div>
                                    </td>
                                    <td className="saas-td">
                                        <div className={`badge-saas uppercase text-[9px] ${statusStyle}`}>
                                            {status}
                                        </div>
                                    </td>
                                    <td className="saas-td text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => onView?.(lead)} 
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-all"
                                                title="View Details"
                                            >
                                                <FiEye size={13} />
                                            </button>
                                            <button 
                                                onClick={() => onEdit(lead)} 
                                                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-all"
                                                title="Modify Lead"
                                            >
                                                <FiEdit2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="7" className="px-6 py-20 text-center">
                                <p className="text-sm font-medium text-slate-400 italic">No lead records found matching these parameters</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default LeadTable;
