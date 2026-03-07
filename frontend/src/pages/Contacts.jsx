import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiUser, FiBriefcase, FiMail, FiPhone } from "react-icons/fi";
import API from "../services/api";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

const ContactsPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    const currentUser = getCurrentUser();
    const role = currentUser?.role;

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/crm/contacts?search=${search}`);
            setData(res.data?.data || res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search]);

    const handleDelete = async (id) => {
        if (window.confirm("Purging this contact will sever its links. Proceed?")) {
            try {
                await API.delete(`/crm/contacts/${id}`);
                toast.success("Personnel node purged.");
                fetchData();
            } catch (err) {
                toast.error("Failed to purge personnel.");
            }
        }
    };

    const getFormPath = (id) => {
        const base = (role === 'sales' ? '/sales' : (role === 'branch_manager' ? '/branch' : '/company'));
        return id ? `${base}/contacts/${id}/edit` : `${base}/contacts/create`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:shadow-green-500/5">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Personnel Nodes</h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-75">Individual Contact Architecture</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group w-full lg:w-64">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Locate personnel..."
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => navigate(getFormPath())}
                        className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                        <FiPlus size={20} />
                        Register Person
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50">
                            <tr className="border-b border-gray-100">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Primary Designation</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Corporate Link</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Comms Channels</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-right">Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.map((item) => (
                                <tr key={item._id} className="hover:bg-green-50/30 transition-all group animate-in fade-in duration-500">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-green-50 group-hover:border-green-100 transition-colors shadow-sm">
                                                <FiUser size={18} className="text-gray-400 group-hover:text-green-500 transition-colors" />
                                            </div>
                                            <span className="font-black text-gray-900 tracking-tight">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                            <FiBriefcase size={10} className="text-green-500" />
                                            {item.customerId?.name || "Independent"}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 space-y-2">
                                        <p className="text-sm font-bold text-gray-700 flex items-center gap-2.5">
                                            <FiMail className="text-gray-300 group-hover:text-green-500 transition-colors" size={14} />
                                            {item.email || "No routing label"}
                                        </p>
                                        <p className="text-[11px] font-black text-gray-400 flex items-center gap-2.5">
                                            <FiPhone className="text-gray-300 group-hover:text-green-500 transition-colors" size={14} />
                                            {item.phone || "No terminal link"}
                                        </p>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform">
                                            <button
                                                onClick={() => navigate(getFormPath(item._id))}
                                                className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all hover:scale-110 active:scale-95"
                                                title="Refine Person"
                                            >
                                                <FiEdit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item._id)}
                                                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110 active:scale-95"
                                                title="Purge Person"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data.length === 0 && !loading && (
                    <div className="p-24 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 text-3xl mb-6 shadow-inner ring-4 ring-gray-50/50">
                            <FiUser />
                        </div>
                        <p className="text-gray-300 font-black uppercase tracking-[0.2em] italic text-xs">No personnel nodes detected.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactsPage;
