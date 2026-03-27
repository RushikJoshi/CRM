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
    const [page, setPage] = useState(page || 1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 100;

    const currentUser = getCurrentUser();
    const role = currentUser?.role;

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/crm/contacts?search=${encodeURIComponent(search)}&page=${page}&limit=${pageSize}`);
            const contactsData = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setData(contactsData);
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

    const getFormPath = (id) => {
        const base = (role === 'sales' ? '/sales' : (role === 'branch_manager' ? '/branch' : '/company'));
        return id ? `${base}/contacts/${id}/edit` : `${base}/contacts/create`;
    };

    return (
        <div className="animate-fade-in space-y-3 pb-4">
            {/* Excel Filter Header */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm overflow-x-auto text-left">
                <div className="relative group min-w-[240px]">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={12} />
                    <input
                        type="text"
                        placeholder="Search contacts by name or email..."
                        className="w-full h-8 pl-9 pr-3 bg-slate-50 border border-transparent rounded-lg text-[12px] font-medium outline-none focus:bg-white focus:border-indigo-600/20 focus:ring-4 focus:ring-indigo-600/5 transition-all text-slate-700"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Hydrating Records...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="saas-table-excel-container text-left">
                        <table className="saas-table-excel">
                            <thead>
                                <tr>
                                    <th className="saas-th-excel">Identity</th>
                                    <th className="saas-th-excel">Affiliation</th>
                                    <th className="saas-th-excel">Connection</th>
                                    <th className="saas-th-excel text-right px-6">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {data.map((item) => (
                                    <tr 
                                        key={item._id} 
                                        className="saas-tr-excel group cursor-pointer"
                                        onClick={() => navigate(getFormPath(item._id))}
                                    >
                                        <td className="saas-td-excel">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-black text-[9px] uppercase shrink-0 border border-slate-100">
                                                    {(item.name || "?").charAt(0).toUpperCase()}
                                                </div>
                                                <div className="font-bold text-slate-800 text-[12px] group-hover:text-indigo-600 transition-colors leading-tight">{item.name}</div>
                                            </div>
                                        </td>
                                        <td className="saas-td-excel">
                                            <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded text-[9px] font-black uppercase tracking-wider border border-slate-100">
                                                {item.customerId?.name || "Independent"}
                                            </span>
                                        </td>
                                        <td className="saas-td-excel text-sm text-gray-600">
                                            <div className="flex flex-col leading-tight">
                                                <span className="text-[12px] font-bold text-slate-700">{item.email || "—"}</span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-tighter opacity-70">{item.phone || "—"}</span>
                                            </div>
                                        </td>
                                        <td className="saas-td-excel text-right px-6" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1.5 translate-x-3">
                                                <button
                                                    onClick={() => navigate(getFormPath(item._id))}
                                                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <FiEdit2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center bg-white">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No contact found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between">
                         <div className="text-[12px] text-slate-500 font-medium">
                            Showing <span className="text-slate-900 font-bold">{data.length}</span> of <span className="text-slate-900 font-bold">{total}</span> total contacts
                         </div>
                         <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactsPage;
