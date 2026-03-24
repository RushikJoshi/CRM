import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiSearch, FiEdit2, FiUser, FiBriefcase, FiMail, FiPhone } from "react-icons/fi";
import API from "../services/api";
import Pagination from "../components/Pagination";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

const ContactsPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    const currentUser = getCurrentUser();
    const role = currentUser?.role;

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/crm/contacts?search=${encodeURIComponent(search)}&page=${page}&limit=${pageSize}`);
            setData(res.data?.data || (Array.isArray(res.data) ? res.data : []));
            setTotalPages(res.data?.totalPages ?? 1);
            setTotal(res.data?.total ?? 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { setPage(1); }, [search]);
    useEffect(() => { fetchData(); }, [search, page]);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this contact?")) {
            try {
                await API.delete(`/crm/contacts/${id}`);
                toast.success("Contact deleted.");
                fetchData();
            } catch (err) {
                toast.error("Failed to delete contact.");
            }
        }
    };

    const getFormPath = (id) => {
        const base = (role === 'sales' ? '/sales' : (role === 'branch_manager' ? '/branch' : '/company'));
        return id ? `${base}/contacts/${id}/edit` : `${base}/contacts/create`;
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-700 pb-20">
            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border shadow-sm transition-all duration-300">
                <div className="w-64 relative">
                    <input
                        type="text"
                        placeholder="Search contacts..."
                        className="w-full px-4 py-2 bg-gray-50 border border-transparent rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium text-gray-700 text-sm font-bold"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl border shadow-sm p-12 flex flex-col items-center justify-center space-y-4">
                    <div className="w-10 h-10 border-4 border-teal-50 border-t-teal-600 rounded-full animate-spin" />
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Loading Contacts...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border shadow-sm p-4 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Name</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Company</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest">Contact Info</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                    {data.map((item) => (
                                        <tr 
                                            key={item._id} 
                                            onClick={() => navigate(getFormPath(item._id))}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-gray-900 text-sm group-hover:text-teal-600 transition-colors">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                                    {item.customerId?.name || "Independent"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-700">{item.email || "No email"}</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.phone || "No phone"}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(getFormPath(item._id))}
                                                        className="p-2 text-gray-400 hover:text-teal-600 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-24 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">No contacts found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
        </div>
    );
};

export default ContactsPage;
