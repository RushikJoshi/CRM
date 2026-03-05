import React from "react";
import { FiEdit2, FiTrash2, FiUser, FiPhone, FiCheckCircle, FiBriefcase, FiFlag, FiEye } from "react-icons/fi";

const LeadTable = ({ leads, onEdit, onDelete, onConvert, onView }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Prospect Intelligence</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Communication Link</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Ownership</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Phase</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-right">Operations</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {leads.length > 0 ? (
                            leads.map((lead) => (
                                <tr
                                    key={lead._id}
                                    className="hover:bg-green-50/30 transition-all group animate-in fade-in duration-500"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center">
                                            <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-lg font-black mr-4 group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm">
                                                {lead.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="font-black text-gray-900 tracking-tight">{lead.name}</span>
                                                <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                                    <FiBriefcase className="mr-1.5" />
                                                    {lead.company || "Independent Entity"}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center text-gray-600 text-sm font-bold">
                                            <FiPhone className="mr-2 text-gray-300 group-hover:text-green-500 transition-colors" />
                                            {lead.phone || "No terminal link"}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                                <FiUser size={14} />
                                            </div>
                                            <span className="text-xs font-black text-gray-500">{lead.assignedTo?.name || "Unassigned"}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${String(lead.status?.name || lead.status).toLowerCase() === 'qualified' ? 'bg-green-100 text-green-600' :
                                                String(lead.status?.name || lead.status).toLowerCase() === 'negotiation' ? 'bg-emerald-100 text-emerald-600' :
                                                    String(lead.status?.name || lead.status).toLowerCase() === 'lost' ? 'bg-red-100 text-red-600' :
                                                        String(lead.status?.name || lead.status).toLowerCase() === 'converted' ? 'bg-blue-100 text-blue-600' :
                                                            'bg-gray-100 text-gray-500'
                                            }`}>
                                            <FiFlag className="mr-1.5" />
                                            {lead.status?.name || lead.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform">
                                            <button
                                                onClick={() => onView(lead)}
                                                className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all hover:scale-110 active:scale-95 bg-white border border-transparent hover:border-green-100 shadow-sm"
                                                title="View Observations"
                                            >
                                                <FiEye size={16} />
                                            </button>
                                            <button
                                                onClick={() => onConvert(lead._id)}
                                                className="p-2.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all hover:scale-110 active:scale-95 bg-white border border-transparent hover:border-orange-100 shadow-sm"
                                                title="Execute Conversion"
                                            >
                                                <FiCheckCircle size={16} />
                                            </button>
                                            <button
                                                onClick={() => onEdit(lead)}
                                                className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all hover:scale-110 active:scale-95 bg-white border border-transparent hover:border-green-100 shadow-sm"
                                                title="Refine Metadata"
                                            >
                                                <FiEdit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(lead._id)}
                                                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-95 bg-white border border-transparent hover:border-red-100 shadow-sm"
                                                title="Purge Prospect"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-8 py-24 text-center text-gray-300 font-black uppercase tracking-[0.2em] italic">
                                    No records active in mission log.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeadTable;
