import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiInbox, FiArrowRight,
    FiSearch, FiMail, FiPhone, FiGlobe, FiFilter,
    FiPlus, FiEyeOff, FiRotateCcw, FiEye
} from "react-icons/fi";
import API from "../services/api";
import Pagination from "../components/Pagination";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";
import InquiryDetailsModal from "../components/InquiryDetailsModal";

const STATUS_COLORS = {
    Open: "bg-orange-50 text-orange-600 border-orange-100",
    Converted: "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20",
    Ignored: "bg-[#F4F7FB] text-[#718096] border-[#E5EAF2]"
};

const InquiriesPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all"); // all | external | internal
    const [channelFilter, setChannelFilter] = useState("all"); // website field
    const [locationFilter, setLocationFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [users, setUsers] = useState([]);
    const [assigningId, setAssigningId] = useState(null);

    const currentUser = getCurrentUser();
    const role = currentUser?.role;
    const canAssign = role === "company_admin" || role === "branch_manager" || role === "super_admin";

    const [filterOptions, setFilterOptions] = useState({ channels: [], locations: [] });

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
            if (search) params.set("search", search);
            if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
            if (typeFilter === "external") params.set("isExternal", "true");
            if (typeFilter === "internal") params.set("isExternal", "false");
            if (channelFilter && channelFilter !== "all") params.set("website", channelFilter);
            if (locationFilter && locationFilter !== "all") params.set("location", locationFilter);
            const res = await API.get(`/inquiries?${params.toString()}`);
            const data = res.data?.data || res.data || [];
            setInquiries(data);
            setTotalPages(res.data?.totalPages ?? 1);
            setTotal(res.data?.total ?? 0);

            const channels = [...new Set(data.map(i => i.website).filter(Boolean))];
            const locations = [...new Set(data.map(i => i.location).filter(Boolean))];
            setFilterOptions({ channels, locations });
        } catch (err) {
            console.error("Failed to fetch inquiries:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter, channelFilter, locationFilter]);
    useEffect(() => { fetchInquiries(); }, [page, search, statusFilter, typeFilter, channelFilter, locationFilter]);

    useEffect(() => {
        if (!canAssign) return;
        API.get("/users")
            .then((res) => {
                const list = res.data?.data || res.data || [];
                setUsers(Array.isArray(list) ? list : []);
            })
            .catch(() => setUsers([]));
    }, [canAssign]);

    const assignInquiry = async (inquiryId, userId) => {
        setAssigningId(inquiryId);
        try {
            await API.patch(`/inquiries/${inquiryId}/assign`, { assignedTo: userId || null });
            toast.success(userId ? "Inquiry assigned." : "Assignment cleared.");
            fetchInquiries();
        } catch (err) {
            toast.error(err.response?.data?.message || "Assign failed.");
        } finally {
            setAssigningId(null);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await API.put(`/inquiries/${id}/status`, { status });
            toast.success(`Status updated to ${status}`);
            fetchInquiries();
        } catch (err) {
            toast.error("Status update failed.");
        }
    };

    const getFormPath = (id, action = 'create') => {
        const base = role === 'super_admin' ? '/superadmin' : (role === 'sales' ? '/sales' : (role === 'branch_manager' ? '/branch' : '/company'));
        return action === 'convert' ? `${base}/inquiries/${id}/convert` : `${base}/inquiries/create`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-[26px] font-bold text-[#0F172A]">Inquiries</h1>
                {role !== "super_admin" && (
                    <button
                        onClick={() => navigate(getFormPath())}
                        className="flex items-center justify-center gap-3 px-6 py-3 bg-sky-500 text-white font-semibold rounded-2xl shadow-lg shadow-sky-500/20 hover:bg-sky-600 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                        <FiPlus size={18} strokeWidth={3} />
                        Add New Inquiry
                    </button>
                )}
            </div>


            {/* Search & Filter Bar */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[300px] relative group">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-sky-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search inquiries..."
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-200 transition-all font-bold text-gray-700 placeholder-gray-300 shadow-sm text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    <div className="relative group flex-1 min-w-[160px] lg:w-44">
                        <FiFilter size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-sky-500 transition-colors z-10" />
                        <select
                            className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-200 transition-all font-bold text-gray-700 text-xs uppercase tracking-widest appearance-none cursor-pointer shadow-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="Open">Open</option>
                            <option value="Converted">Converted</option>
                            <option value="Ignored">Ignored</option>
                        </select>
                    </div>

                    <div className="relative group flex-1 min-w-[160px] lg:w-44">
                        <select
                            className="w-full pl-4 pr-10 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-200 transition-all font-bold text-gray-700 text-xs uppercase tracking-widest appearance-none cursor-pointer shadow-sm"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">Inquiry Type</option>
                            <option value="external">External</option>
                            <option value="internal">Internal</option>
                        </select>
                    </div>
                    <div className="relative group flex-1 min-w-[160px] lg:w-44">
                        <FiGlobe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-sky-500 transition-colors z-10" />
                        <select
                            className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-200 transition-all font-bold text-gray-700 text-xs uppercase tracking-widest appearance-none cursor-pointer shadow-sm"
                            value={channelFilter}
                            onChange={(e) => setChannelFilter(e.target.value)}
                        >
                            <option value="all">Channel</option>
                            {filterOptions.channels.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                    </div>

                    <div className="relative group flex-1 min-w-[160px] lg:w-44">
                        <FiGlobe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-sky-500 transition-colors z-10" />
                        <select
                            className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-200 transition-all font-bold text-gray-700 text-xs uppercase tracking-widest appearance-none cursor-pointer shadow-sm"
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                        >
                            <option value="all">Location</option>
                            {filterOptions.locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            {/* Inquiries List */}
            <div className="canvas-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-[#F3F4F6] border-b border-[#E5E7EB]">
                        <th className="px-4 py-3 text-[13px] font-semibold text-[#64748B] uppercase tracking-[0.03em]">Customer</th>
                        <th className="px-4 py-3 text-[13px] font-semibold text-[#64748B] uppercase tracking-[0.03em]">Channel</th>
                        <th className="px-4 py-3 text-[13px] font-semibold text-[#64748B] uppercase tracking-[0.03em]">Location</th>
                        <th className="px-4 py-3 text-[13px] font-semibold text-[#64748B] uppercase tracking-[0.03em]">Message</th>
                        <th className="px-4 py-3 text-[13px] font-semibold text-[#64748B] uppercase tracking-[0.03em]">Status</th>
                        <th className="px-4 py-3 text-[13px] font-semibold text-[#64748B] uppercase tracking-[0.03em]">Date</th>
                        <th className="px-4 py-3 text-[13px] font-semibold text-[#64748B] uppercase tracking-[0.03em] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F2F5] bg-white">
                {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-24 text-center text-slate-500 text-sm font-semibold">
                        Loading inquiries...
                      </td>
                    </tr>
                ) : inquiries.length > 0 ? (
                        inquiries.map((item) => (
                          <tr key={item._id} className="h-14 hover:bg-slate-50/80 transition-colors group">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-white border border-[#E5EAF2] flex items-center justify-center font-bold text-[#1A202C]">
                                  {item.name?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-[#1A202C] truncate">{item.name}</div>
                                  <div className="text-xs text-[#64748B] flex items-center gap-2 truncate">
                                    <span className="inline-flex items-center gap-1 truncate"><FiMail className="shrink-0" /> {item.email}</span>
                                    {item.phone && <span className="inline-flex items-center gap-1"><FiPhone className="shrink-0" /> {item.phone}</span>}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#111827]">
                              <div className="flex items-center gap-2">
                                {item.isExternal && <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 rounded-lg px-2 py-1">External</span>}
                                <span className="inline-flex items-center gap-1 text-xs text-[#64748B]">
                                  <FiGlobe /> {item.website || "DIRECT"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#111827]">
                              <span className="text-xs text-[#64748B]">{item.location || "-"}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-[#64748B] line-clamp-2">{item.message || "-"}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-3 py-1.5 rounded-xl text-[11px] font-semibold uppercase tracking-[0.03em] border ${STATUS_COLORS[item.status] || "bg-gray-50 text-gray-500 border-gray-100"}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#64748B]">
                              {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="hidden group-hover:flex items-center justify-end gap-2">
                                {canAssign && item.status === "Open" && (
                                  <select
                                    value={item.assignedTo?._id || item.assignedTo || ""}
                                    onChange={(e) => assignInquiry(item._id, e.target.value || null)}
                                    disabled={assigningId === item._id}
                                    className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold bg-white min-w-[120px] focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
                                  >
                                    <option value="">Unassigned</option>
                                    {users.filter(u => u.role === "sales" || u.role === "branch_manager").map(u => (
                                      <option key={u._id} value={u._id}>{u.name}</option>
                                    ))}
                                  </select>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setSelectedInquiry(item)}
                                  className="w-10 h-10 bg-white border border-gray-100 text-gray-300 rounded-[14px] flex items-center justify-center hover:text-sky-500 hover:bg-sky-50 transition-all shadow-sm"
                                  title="View Details"
                                >
                                  <FiEye size={18} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => item.status === "Open" && navigate(getFormPath(item._id, "convert"))}
                                  disabled={item.status !== "Open"}
                                  title={item.status === "Open" ? "Convert inquiry to lead & assign member" : "Already converted"}
                                  className={`w-10 h-10 rounded-[14px] flex items-center justify-center transition-all shadow-sm border ${
                                    item.status === "Open"
                                      ? "bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100"
                                      : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100"
                                  }`}
                                >
                                  <FiArrowRight size={18} />
                                </button>
                                {item.status === "Open" && (
                                  <button
                                    type="button"
                                    onClick={() => updateStatus(item._id, "Ignored")}
                                    title="Archive/Ignore"
                                    className="w-10 h-10 bg-white border border-[#E5EAF2] text-[#718096] rounded-[14px] flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
                                  >
                                    <FiEyeOff size={18} />
                                  </button>
                                )}
                                {item.status === "Ignored" && (
                                  <button
                                    type="button"
                                    onClick={() => updateStatus(item._id, "Open")}
                                    title="Restore"
                                    className="w-10 h-10 bg-orange-50 text-orange-600 rounded-[14px] border border-orange-100 flex items-center justify-center hover:bg-orange-100 transition-all shadow-sm"
                                  >
                                    <FiRotateCcw size={18} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-24 text-center text-slate-600 text-sm font-semibold">
                        No inquiries found
                      </td>
                    </tr>
                )}
                    </tbody>
                  </table>
                </div>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />

            <InquiryDetailsModal
                isOpen={Boolean(selectedInquiry)}
                onClose={() => setSelectedInquiry(null)}
                inquiry={selectedInquiry}
            />
        </div >
    );
};

export default InquiriesPage;
