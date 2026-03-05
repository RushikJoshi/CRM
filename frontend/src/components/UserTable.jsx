import React from "react";
import { FiEdit2, FiTrash2, FiUser, FiCheckCircle, FiXCircle, FiShield, FiBriefcase, FiLayers } from "react-icons/fi";

const UserTable = ({ users, onEdit, onDelete, onToggleStatus }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">User Profile</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Role & Privilege</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Assignment Cluster</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Auth Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Operations</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.length > 0 ? (
                            users.map((user) => (
                                <tr
                                    key={user._id}
                                    className="hover:bg-green-50/30 transition-all group animate-in fade-in duration-500"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center text-xl font-black mr-4 group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="font-black text-gray-800 tracking-tight">{user.name}</span>
                                                <p className="text-[10px] font-bold text-gray-400 tracking-widest mt-0.5">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${user.role === 'super_admin' ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-500'}`}>
                                                <FiShield size={14} />
                                            </div>
                                            <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{user.role.replace('_', ' ')}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                <FiBriefcase className="mr-1.5 opacity-40 text-green-500" />
                                                {user.companyId?.name || "Global Cloud"}
                                            </div>
                                            {user.branchId && (
                                                <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    <FiLayers className="mr-1.5 opacity-40 text-green-500" />
                                                    {user.branchId?.name}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <button
                                            onClick={() => onToggleStatus(user)}
                                            className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${user.status === 'inactive' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 border border-green-100/50 hover:bg-green-100'
                                                }`}
                                        >
                                            {user.status === 'inactive' ? <FiXCircle className="mr-1.5" /> : <FiCheckCircle className="mr-1.5" />}
                                            {user.status || 'active'}
                                        </button>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform">
                                            <button
                                                onClick={() => onEdit(user)}
                                                className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all shadow-sm bg-white border border-transparent hover:border-green-100"
                                                title="Edit User Meta"
                                            >
                                                <FiEdit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(user._id)}
                                                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm bg-white border border-transparent hover:border-red-100"
                                                title="Revoke Permission"
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
                                    No identity profiles located in current cluster.
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
