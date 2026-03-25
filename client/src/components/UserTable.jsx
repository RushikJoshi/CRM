import React from "react";
import { FiEdit2, FiTrash2, FiShield, FiBriefcase, FiLayers, FiMail, FiPhone } from "react-icons/fi";

const UserTable = ({ users, onEdit, onDelete, onToggleStatus }) => {
    return (
        <div className="saas-table-excel-container">
            <table className="saas-table-excel">
                <thead>
                    <tr>
                        <th className="saas-th-excel">User Profile</th>
                        <th className="saas-th-excel">Contact Info</th>
                        <th className="saas-th-excel">Role / Level</th>
                        <th className="saas-th-excel">Organizational Unit</th>
                        <th className="saas-th-excel">Status</th>
                        <th className="saas-th-excel text-right px-6">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {users.length > 0 ? (
                        users.map((user) => (
                            <tr key={user._id} className="saas-tr-excel group">
                                <td className="saas-td-excel">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[9px] uppercase shrink-0 border border-slate-200">
                                            {user.name?.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-slate-800 text-[12px] truncate transition-colors leading-tight">{user.name}</div>
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter truncate opacity-70">
                                                {user.customId || "USER-ID"}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="saas-td-excel">
                                    <div className="flex flex-col leading-tight">
                                        <span className="text-[12px] font-bold text-slate-700">{user.phone || "—"}</span>
                                        <span className="text-[10px] text-slate-400 truncate opacity-80">{user.email}</span>
                                    </div>
                                </td>
                                <td className="saas-td-excel">
                                    <div className="flex items-center gap-1.5">
                                        <FiShield className="text-slate-300" size={12} />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{user.role?.replace('_', ' ')}</span>
                                    </div>
                                </td>
                                <td className="saas-td-excel">
                                    <div className="flex flex-col leading-tight">
                                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-800">
                                            {user.companyId?.name || "No Company"}
                                        </div>
                                        {user.branchId && (
                                            <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter">
                                                {user.branchId?.name}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="saas-td-excel">
                                    <span
                                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider inline-block cursor-pointer ${user.status === 'inactive' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}
                                        onClick={() => onToggleStatus?.(user)}
                                    >
                                        {user.status || 'active'}
                                    </span>
                                </td>
                                <td className="saas-td-excel text-right px-6">
                                    <div className="flex items-center justify-end gap-1.5 translate-x-3">
                                        <button 
                                            onClick={() => onEdit(user)} 
                                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                            title="Edit User"
                                        >
                                            <FiEdit2 size={13} />
                                        </button>
                                        <button 
                                            onClick={() => onDelete?.(user._id)} 
                                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                            title="Delete User"
                                        >
                                            <FiTrash2 size={13} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="px-6 py-20 text-center bg-white">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No personnel records found</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default UserTable;
