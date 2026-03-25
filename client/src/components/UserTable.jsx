import React from "react";
import { FiEdit2, FiUser, FiTrash2, FiBriefcase, FiLayers, FiShield } from "react-icons/fi";

const UserTable = ({ users, onEdit, onDelete, onToggleStatus, onAddNew, onView }) => {
    return (
        <div className="saas-table-container">
            <table className="saas-table">
                <thead>
                    <tr>
                        <th className="saas-th">User Profile</th>
                        <th className="saas-th">Role / Level</th>
                        <th className="saas-th">Organizational Unit</th>
                        <th className="saas-th">Access Status</th>
                        <th className="saas-th text-right">Settings</th>
                    </tr>
                </thead>
                <tbody>
                    {users.length > 0 ? (
                        users.map((user, i) => (
                            <tr
                                key={user._id}
                                className="saas-tr group"
                            >
                                <td className="saas-td" onClick={() => onEdit?.(user)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase border border-indigo-100/50">
                                            {user.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900 text-[13px] hover:text-indigo-600 transition-colors cursor-pointer">{user.name}</div>
                                            <div className="text-[11px] text-slate-400 font-medium">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="saas-td">
                                    <div className="flex items-center gap-1.5">
                                        <FiShield className="text-slate-300" size={12} />
                                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{user.role?.replace('_', ' ')}</span>
                                    </div>
                                </td>
                                <td className="saas-td">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
                                            <FiBriefcase className="text-slate-300" size={11} />
                                            {user.companyId?.name || "Global Network"}
                                        </div>
                                        {user.branchId && (
                                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 mt-0.5">
                                                <FiLayers className="text-slate-300" size={10} />
                                                {user.branchId?.name}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="saas-td">
                                    <button
                                        onClick={() => onToggleStatus?.(user)}
                                        className={`badge-saas uppercase text-[9px] ${user.status === 'inactive' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}
                                    >
                                        {user.status || 'active'}
                                    </button>
                                </td>
                                <td className="saas-td text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => onEdit(user)} 
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-all"
                                            title="Edit Profile"
                                        >
                                            <FiEdit2 size={13} />
                                        </button>
                                        <button 
                                            onClick={() => onDelete?.(user._id)} 
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                                            title="Remove User"
                                        >
                                            <FiTrash2 size={13} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
                                        <FiUser size={20} />
                                    </div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">No active personnel found</p>
                                    {typeof onAddNew === "function" && (
                                        <button
                                            type="button"
                                            onClick={onAddNew}
                                            className="btn-saas-primary h-8 px-4 text-[10px]"
                                        >
                                            Instate New User
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default UserTable;
