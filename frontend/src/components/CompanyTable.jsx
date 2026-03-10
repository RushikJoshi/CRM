import React from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiMail, FiPhone, FiCheckCircle, FiXCircle, FiExternalLink } from "react-icons/fi";

const CompanyTable = ({ companies, onEdit, onDelete, onStatusChange }) => {
    const navigate = useNavigate();
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Company</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact Info</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {companies.length > 0 ? (
                            companies.map((company) => (
                                <tr
                                    key={company._id}
                                    className="hover:bg-green-50/30 transition-all group animate-in fade-in duration-500"
                                >
                                    <td className="px-8 py-5">
                                        <div
                                            className="flex items-center cursor-pointer"
                                            onClick={() => navigate(`/superadmin/companies/${company._id}`)}
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-green-50 to-green-100/50 flex items-center justify-center text-green-600 font-black mr-4 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm">
                                                {company.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="font-black text-gray-900 tracking-tight group-hover:text-green-600 flex items-center gap-1.5 transition-colors">
                                                    {company.name}
                                                    <FiExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-green-500" />
                                                </span>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">Click to view details</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center text-gray-600 text-sm font-bold">
                                                <FiMail className="mr-2 text-gray-300" />
                                                {company.email}
                                            </div>
                                            <div className="flex items-center text-[11px] font-black tracking-widest text-gray-400">
                                                <FiPhone className="mr-2 text-gray-300" />
                                                {company.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${company.status === 'inactive' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                            }`}>
                                            {company.status === 'inactive' ? <FiXCircle className="mr-1.5" /> : <FiCheckCircle className="mr-1.5" />}
                                            {company.status || 'active'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform">
                                            <button
                                                onClick={() => onEdit(company)}
                                                className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all shadow-sm bg-white border border-transparent hover:border-green-100"
                                                title="Edit"
                                            >
                                                <FiEdit2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-8 py-20 text-center text-gray-400 font-bold bg-gray-50/20 italic">
                                    No companies found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CompanyTable;
