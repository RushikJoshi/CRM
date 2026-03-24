import React from "react";
import { FiEdit2, FiUser, FiCheckCircle, FiXCircle, FiShield, FiBriefcase, FiLayers, FiTrash2, FiEye } from "react-icons/fi";

const UserTable = ({ users, onEdit, onDelete, onToggleStatus, onAddNew, onView }) => {
    return (
        <div className="canvas-card overflow-hidden min-h-[500px]">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#F3F4F6] border-b border-[#E5E7EB] relative z-10">
                            <th className="px-4 py-3 text-[13px] font-semibold text-[#64748B] uppercase tracking-[0.03em]">User Name</th>
                            <th className="px-4 py-3 text-[13px] font-semibold text-[#64748B] uppercase tracking-[0.03em]">Role</th>
                            <th className="px-4 py-3 text-[13px] font-semibold text-[#64748B] uppercase tracking-[0.03em]">Company / Branch</th>
                            <th className="px-4 py-3 text-[13px] font-semibold text-[#64748B] uppercase tracking-[0.03em]">Status</th>
                            <th className="px-4 py-3 text-[13px] font-semibold text-[#64748B] uppercase tracking-[0.03em] text-right w-[160px]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F2F5]">
                        {users.length > 0 ? (
                            users.map((user, i) => (
                                <tr
                                    key={user._id}
                                    onClick={() => onEdit?.(user)}
                                    className="h-14 hover:bg-slate-50/80 transition-colors group animate-in slide-in-from-bottom-2 duration-700 cursor-pointer"
                                    style={{ animationDelay: `${i * 30}ms` }}
                                >
                                    <td className="px-4 py-2">
                                        <div>
                                            <span className="font-bold text-[#1A202C] text-[13px]">{user.name}</span>
                                            <p className="text-[11px] text-gray-500 font-medium">{user.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">{user.role?.replace('_', ' ')}</span>
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-tight">
                                                {user.companyId?.name || "Global Network"}
                                            </span>
                                            {user.branchId && (
                                                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">
                                                    {user.branchId?.name}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => onToggleStatus(user)}
                                            className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border transition-colors ${user.status === 'inactive' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-teal-50 text-teal-700 border-teal-100'
                                                }`}
                                        >
                                            {user.status || 'active'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-2 text-right w-[160px]" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            <button onClick={() => onEdit(user)} className="hover:text-indigo-600 transition-colors">EDIT</button>
                                            <button onClick={() => onDelete?.(user._id)} className="hover:text-red-600 transition-colors">DELETE</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-4 py-24 text-center bg-white">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-[#E5EAF2] flex items-center justify-center text-slate-400">
                                            <FiUser size={22} />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-600">No users found</p>
                                        {typeof onAddNew === "function" && (
                                            <button
                                                type="button"
                                                onClick={onAddNew}
                                                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold uppercase tracking-widest transition-colors"
                                            >
                                                Add New User
                                            </button>
                                        )}
                                    </div>
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
