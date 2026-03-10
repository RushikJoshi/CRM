import React from "react";
import { FiEdit2, FiMapPin, FiPhone, FiCheckCircle, FiXCircle, FiLayers } from "react-icons/fi";

const BranchTable = ({ branches, onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Branch</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Company</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact Info</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {branches.length > 0 ? (
                            branches.map((branch) => (
                                <tr
                                    key={branch._id}
                                    className="hover:bg-green-50/30 transition-all group animate-in fade-in duration-500"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center text-xl mb-0 mr-4 group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm">
                                                <FiLayers strokeWidth={2.5} size={20} />
                                            </div>
                                            <div>
                                                <span className="font-black text-gray-800 tracking-tight">{branch.name}</span>
                                                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                    <FiMapPin className="mr-1 shadow-xs" />
                                                    {branch.address || "No address"}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="inline-flex items-center px-4 py-2 bg-gray-50 rounded-xl border border-gray-100/50 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                            {branch.companyId?.name || "Independent"}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center text-gray-600 text-[11px] uppercase tracking-widest font-black">
                                            <FiPhone className="mr-2 text-gray-300 group-hover:text-green-500 transition-colors" />
                                            {branch.phone || "No phone"}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform">
                                            <button
                                                onClick={() => onEdit(branch)}
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
                                <td colSpan="4" className="px-8 py-24 text-center text-gray-300 font-black uppercase tracking-[0.2em] italic">
                                    No branches found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BranchTable;
