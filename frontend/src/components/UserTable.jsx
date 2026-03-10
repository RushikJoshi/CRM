import React from "react";
import { FiEdit2, FiUser, FiCheckCircle, FiXCircle, FiShield, FiBriefcase, FiLayers } from "react-icons/fi";

const UserTable = ({ users, onEdit, onDelete, onToggleStatus }) => {
    return (
        <div className="canvas-card overflow-hidden min-h-[500px]">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-[#F0F2F5] shadow-sm relative z-10">
                            <th className="px-10 py-6 text-[10px] font-black text-[#A0AEC0] uppercase tracking-[.25em]">Identity Profile</th>
                            <th className="px-10 py-6 text-[10px] font-black text-[#A0AEC0] uppercase tracking-[.25em]">Operational Role</th>
                            <th className="px-10 py-6 text-[10px] font-black text-[#A0AEC0] uppercase tracking-[.25em]">Entity Assignment</th>
                            <th className="px-10 py-6 text-[10px] font-black text-[#A0AEC0] uppercase tracking-[.25em]">Cloud Status</th>
                            <th className="px-10 py-6 text-[10px] font-black text-[#A0AEC0] uppercase tracking-[.25em] text-right">Ops</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F2F5]">
                        {users.length > 0 ? (
                            users.map((user, i) => (
                                <tr
                                    key={user._id}
                                    className="hover:bg-slate-50/80 transition-all group animate-in slide-in-from-bottom-2 duration-700"
                                    style={{ animationDelay: `${i * 30}ms` }}
                                >
                                    <td className="px-10 py-6">
                                        <div className="flex items-center">
                                            <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5EAF2] text-[#1A202C] flex items-center justify-center text-xl font-black mr-5 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-700 transition-all shadow-sm group-hover:rotate-3">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="font-black text-[#1A202C] tracking-tight text-[15px] group-hover:text-blue-600 transition-colors">{user.name}</span>
                                                <p className="text-[11px] font-black text-[#A0AEC0] tracking-widest mt-1 lowercase">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl border shadow-sm transition-all group-hover:scale-110 ${user.role === 'super_admin' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : 'bg-slate-100/50 text-[#718096] border-[#E5EAF2]'}`}>
                                                <FiShield size={16} />
                                            </div>
                                            <span className="text-[11px] font-black text-[#1A202C] uppercase tracking-widest">{user.role.replace('_', ' ')}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center text-[11px] font-black text-[#718096] uppercase tracking-widest">
                                                <FiBriefcase className="mr-2 text-blue-500 opacity-60" size={12} />
                                                {user.companyId?.name || "Global Network"}
                                            </div>
                                            {user.branchId && (
                                                <div className="flex items-center text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">
                                                    <FiLayers className="mr-2 text-blue-400 opacity-40" size={12} />
                                                    {user.branchId?.name}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <button
                                            onClick={() => onToggleStatus(user)}
                                            className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${user.status === 'inactive' ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
                                                }`}
                                        >
                                            {user.status === 'inactive' ? <FiXCircle className="mr-2" /> : <FiCheckCircle className="mr-2" />}
                                            {user.status || 'active'}
                                        </button>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                            <button
                                                onClick={() => onEdit(user)}
                                                className="w-11 h-11 flex items-center justify-center bg-white border border-[#E5EAF2] text-[# CBD5E0] rounded-[14px] hover:text-blue-600 hover:bg-slate-50 hover:border-blue-200 transition-all shadow-sm"
                                                title="Edit Profile"
                                            >
                                                <FiEdit2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-10 py-48 text-center text-[#CBD5E0] font-black uppercase tracking-[0.3em] bg-slate-50/20">
                                    Queue Empty: No Members Found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserTable;
