import React from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiMail, FiPhone, FiExternalLink, FiTrash2, FiClock } from "react-icons/fi";

const CompanyTable = ({ companies, onEdit, onDelete }) => {
    const navigate = useNavigate();
    
    return (
        <table className="saas-table">
            <thead>
                <tr>
                    <th className="saas-th">Company Name</th>
                    <th className="saas-th">Contact Details</th>
                    <th className="saas-th">Registration</th>
                    <th className="saas-th text-right">Actions</th>
                </tr>
            </thead>
            <tbody>
                {companies.length > 0 ? (
                    companies.map((company) => (
                        <tr key={company._id} className="saas-tr group">
                            <td className="saas-td">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-[12px] font-bold shrink-0">
                                        {(company.name || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div
                                        className="cursor-pointer group-hover:text-indigo-600 transition-colors"
                                        onClick={() => navigate(`/superadmin/companies/${company._id}`)}
                                    >
                                        <div className="font-semibold text-slate-900 flex items-center gap-1">
                                            {company.name}
                                            <FiArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">ID: {company._id?.substring(18)}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="saas-td">
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <FiMail size={12} className="text-slate-300" />
                                        <span>{company.email}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-400 text-[12px]">
                                        <FiPhone size={11} className="text-slate-200" />
                                        <span>{company.phone || "No phone"}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="saas-td">
                                <div className="flex items-center gap-1.5 text-slate-500">
                                    <FiClock size={12} className="text-slate-300" />
                                    <span>{new Date(company.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                            </td>
                            <td className="saas-td text-right">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onEdit(company)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                                        title="Edit"
                                    >
                                        <FiEdit2 size={15} />
                                    </button>
                                    <button
                                        onClick={() => onDelete?.(company._id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                                        title="Delete"
                                    >
                                        <FiTrash2 size={15} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan="4" className="saas-td text-center py-20 text-slate-400 italic">
                            No company records found.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

export default CompanyTable;
