import React from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiMail, FiPhone, FiTrash2, FiClock, FiArrowUpRight, FiCopy } from "react-icons/fi";

const CompanyTable = ({ companies, onEdit, onDelete }) => {
    const navigate = useNavigate();
    
    return (
        <div className="saas-table-excel-container">
            <table className="saas-table-excel">
                <thead>
                    <tr>
                        <th className="saas-th-excel">Company Profile</th>
                        <th className="saas-th-excel">Contact Details</th>
                        <th className="saas-th-excel">Registration</th>
                        <th className="saas-th-excel text-right px-6">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {companies.length > 0 ? (
                        companies.map((company) => (
                            <tr key={company._id} className="saas-tr-excel group">
                                <td className="saas-td-excel">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[9px] uppercase shrink-0 border border-slate-200">
                                            {(company.name || "?").charAt(0).toUpperCase()}
                                        </div>
                                        <div
                                            className="cursor-pointer group-hover:text-indigo-600 transition-colors"
                                            onClick={() => navigate(`/superadmin/companies/${company._id}`)}
                                        >
                                            <div className="font-bold text-slate-800 text-[12px] flex items-center gap-1 leading-tight">
                                                {company.name}
                                                <FiArrowUpRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter truncate opacity-70 flex items-center gap-1.5 mt-0.5">
                                                ID: {company.customId || company._id?.substring(0, 8)}
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(company.customId || company._id);
                                                        // toast or alert logic can be added if needed
                                                    }}
                                                    className="hover:text-indigo-600 transition-colors"
                                                    title="Copy ID"
                                                >
                                                    <FiCopy size={9} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="saas-td-excel">
                                    <div className="flex flex-col leading-tight">
                                        <span className="text-[12px] font-bold text-slate-700">{company.phone || "—"}</span>
                                        <span className="text-[10px] text-slate-400 truncate opacity-80">{company.email}</span>
                                    </div>
                                </td>
                                <td className="saas-td-excel">
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <FiClock size={11} className="text-slate-300" />
                                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">
                                            {new Date(company.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </td>
                                <td className="saas-td-excel text-right px-6">
                                    <div className="flex items-center justify-end gap-1.5 translate-x-3">
                                        <button 
                                            onClick={() => onEdit(company)} 
                                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                            title="Edit Company"
                                        >
                                            <FiEdit2 size={13} />
                                        </button>
                                        <button 
                                            onClick={() => onDelete?.(company._id)} 
                                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                            title="Delete Company"
                                        >
                                            <FiTrash2 size={13} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4" className="px-6 py-20 text-center bg-white">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No company records found</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CompanyTable;
