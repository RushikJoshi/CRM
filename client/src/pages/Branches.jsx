import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import BranchTable from "../components/BranchTable";
import Pagination from "../components/Pagination";
import { FiSearch, FiFilter, FiX } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

function Branches() {
    const [branches, setBranches] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const pageSize = 10;
    
    const currentUser = getCurrentUser();
    const isSuperAdmin = currentUser?.role === "super_admin";
    const isSales = currentUser?.role === "sales";
    const rolePath = isSuperAdmin ? "/superadmin" : isSales ? "/sales" : currentUser?.role === "branch_manager" ? "/branch" : "/company";

    const navigate = useNavigate();
    const toast = useToast();
    const apiBase = isSuperAdmin ? "/super-admin/branches" : "/branches";

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ 
                page: String(page), 
                limit: String(pageSize),
                search: search,
                status: statusFilter
            });
            if (isSuperAdmin && selectedCompany) params.set("companyId", selectedCompany);
            
            const res = await API.get(`${apiBase}?${params.toString()}`);
            const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setBranches(data);
            setTotalPages(res.data?.totalPages ?? 1);
            setTotal(res.data?.total ?? 0);
        } catch {
            setBranches([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        if (!isSuperAdmin) return;
        try {
            const res = await API.get("/super-admin/companies");
            setCompanies(res.data?.data || res.data?.companies || []);
        } catch { /* silent */ }
    };

    const handleDelete = async (branch) => {
        if (!window.confirm("Delete this branch? This will soft-delete the branch.")) return;
        try {
            await API.delete(`${apiBase}/${branch._id}`);
            toast.success("Branch deleted successfully.");
            fetchBranches();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete branch.");
        }
    };

    const handleToggleStatus = async (branch) => {
        try {
            await API.patch(`${apiBase}/${branch._id}/toggle-status`);
            toast.success(`Branch status updated.`);
            fetchBranches();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update status.");
        }
    };

    const handleViewDetails = async (branch) => {
        if (!branch?._id) return;
        setDetailsOpen(true);
        setDetailsLoading(true);
        try {
            const res = await API.get(`${apiBase}/${branch._id}`);
            const data = res.data?.data || res.data;
            setSelectedBranch(data || branch);
        } catch (err) {
            setSelectedBranch(branch);
            toast.error(err.response?.data?.message || "Failed to load full branch details.");
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetails = () => {
        setDetailsOpen(false);
        setSelectedBranch(null);
    };

    const formatDateTime = (value) => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatValue = (value) => {
        if (value === null || value === undefined) return "-";
        if (typeof value === "string" && !value.trim()) return "-";
        return String(value);
    };


    useEffect(() => { setPage(1); }, [search, selectedCompany, statusFilter]);
    useEffect(() => { fetchBranches(); }, [search, selectedCompany, statusFilter, page]);
    useEffect(() => { fetchCompanies(); }, []);

    return (
        <div className="animate-fade-in space-y-3 pb-4">
            {/* Excel Filter Header */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
                <div className="relative group min-w-[240px]">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={12} />
                    <input
                        type="text"
                        placeholder="Search branches..."
                        className="w-full h-8 pl-9 pr-3 bg-slate-50 border border-transparent rounded-lg text-[12px] font-medium outline-none focus:bg-white focus:border-emerald-600/20 focus:ring-4 focus:ring-emerald-600/5 transition-all text-slate-700"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="h-4 w-px bg-slate-100 mx-1" />

                <div className="flex items-center gap-3 flex-1">
                    {isSuperAdmin && (
                        <div className="relative">
                            <FiBriefcase size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <select
                                className="h-8 pl-8 pr-8 bg-slate-50 border border-transparent rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-600/20 transition-all appearance-none cursor-pointer min-w-[150px]"
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                            >
                                <option value="">All Companies</option>
                                {companies.map((c) => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    <div className="relative">
                        <FiFilter size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                            className="h-8 pl-8 pr-8 bg-slate-50 border border-transparent rounded-lg text-[11px] font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-600/20 transition-all appearance-none cursor-pointer min-w-[130px]"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="closed">Closed</option>
                            <option value="draft">Draft</option>
                        </select>
                    </div>
                </div>

            </div>

            {loading ? (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Hydrating Records...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <BranchTable
                        branches={branches}
                        onView={handleViewDetails}
                        onEdit={(b) => navigate(`${rolePath}/branches/${b._id}/edit`)}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                    />
                    <div className="flex items-center justify-between">
                         <div className="text-[12px] text-slate-500 font-medium">
                            Showing <span className="text-slate-900 font-bold">{branches.length}</span> of <span className="text-slate-900 font-bold">{total}</span> total branches
                         </div>
                         <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
                    </div>
                </div>
            )}

            {detailsOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
                            <div>
                                <h3 className="text-base font-bold text-slate-800">Branch Details</h3>
                                <p className="text-xs text-slate-500">Read-only profile view</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeDetails}
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                                aria-label="Close details"
                            >
                                <FiX size={16} />
                            </button>
                        </div>

                        <div className="p-5 max-h-[70vh] overflow-auto bg-slate-50">
                            {detailsLoading ? (
                                <div className="py-10 text-center text-sm text-slate-500">Loading branch details...</div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="rounded-lg bg-white border border-slate-200 p-3">
                                            <p className="text-[11px] text-slate-500">Branch Name</p>
                                            <p className="text-sm font-bold text-slate-800">{formatValue(selectedBranch?.name)}</p>
                                        </div>
                                        <div className="rounded-lg bg-white border border-slate-200 p-3">
                                            <p className="text-[11px] text-slate-500">Branch Code</p>
                                            <p className="text-sm font-bold text-slate-800">{formatValue(selectedBranch?.branchCode)}</p>
                                        </div>
                                        <div className="rounded-lg bg-white border border-slate-200 p-3">
                                            <p className="text-[11px] text-slate-500">Status</p>
                                            <p className="text-sm font-bold text-slate-800 uppercase">{formatValue(selectedBranch?.status)}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                                            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700">Basic Information</div>
                                            <table className="w-full text-sm">
                                                <tbody>
                                                    <tr className="border-b border-slate-100"><th className="w-40 text-left px-4 py-2 text-slate-500 font-medium">Name</th><td className="px-4 py-2 text-slate-800 font-semibold">{formatValue(selectedBranch?.name)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Code</th><td className="px-4 py-2 text-slate-800 font-semibold">{formatValue(selectedBranch?.branchCode)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Type</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.branchType)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Status</th><td className="px-4 py-2 text-slate-800 uppercase">{formatValue(selectedBranch?.status)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Company</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.companyId?.name || selectedBranch?.companyId)}</td></tr>
                                                    <tr><th className="text-left px-4 py-2 text-slate-500 font-medium">Description</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.description)}</td></tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                                            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700">Management</div>
                                            <table className="w-full text-sm">
                                                <tbody>
                                                    <tr className="border-b border-slate-100"><th className="w-40 text-left px-4 py-2 text-slate-500 font-medium">Manager</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.branchManagerId?.name || "Unassigned")}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Manager Email</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.managerEmail || selectedBranch?.branchManagerId?.email)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Manager Phone</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.managerPhone)}</td></tr>
                                                    <tr><th className="text-left px-4 py-2 text-slate-500 font-medium">Assigned Users</th><td className="px-4 py-2 text-slate-800">{Array.isArray(selectedBranch?.assignedUserIds) && selectedBranch.assignedUserIds.length ? selectedBranch.assignedUserIds.map((u) => u?.name || u?.email || u?._id || String(u)).join(", ") : "-"}</td></tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                                            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700">Contact</div>
                                            <table className="w-full text-sm">
                                                <tbody>
                                                    <tr className="border-b border-slate-100"><th className="w-40 text-left px-4 py-2 text-slate-500 font-medium">Branch Email</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.email)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Branch Phone</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.phone)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Alternate Phone</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.alternatePhone)}</td></tr>
                                                    <tr><th className="text-left px-4 py-2 text-slate-500 font-medium">Website</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.website)}</td></tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                                            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700">Address</div>
                                            <table className="w-full text-sm">
                                                <tbody>
                                                    <tr className="border-b border-slate-100"><th className="w-40 text-left px-4 py-2 text-slate-500 font-medium">Address Line 1</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.addressLine1)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Address Line 2</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.addressLine2)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">City</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.city || selectedBranch?.cityId?.name)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">State</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.state || selectedBranch?.cityId?.state)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Country</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.country)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Postal Code</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.postalCode)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Latitude</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.latitude)}</td></tr>
                                                    <tr><th className="text-left px-4 py-2 text-slate-500 font-medium">Longitude</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.longitude)}</td></tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                                            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700">Operational</div>
                                            <table className="w-full text-sm">
                                                <tbody>
                                                    <tr className="border-b border-slate-100"><th className="w-40 text-left px-4 py-2 text-slate-500 font-medium">Opening Date</th><td className="px-4 py-2 text-slate-800">{formatDateTime(selectedBranch?.openingDate)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Working Hours</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.workingHours)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Timezone</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.timezone)}</td></tr>
                                                    <tr><th className="text-left px-4 py-2 text-slate-500 font-medium">Branch Capacity</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.branchCapacity)}</td></tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                                            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700">Audit & Meta</div>
                                            <table className="w-full text-sm">
                                                <tbody>
                                                    <tr className="border-b border-slate-100"><th className="w-40 text-left px-4 py-2 text-slate-500 font-medium">Record ID</th><td className="px-4 py-2 text-slate-800 break-all">{formatValue(selectedBranch?._id)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Created By</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.createdBy?.name || selectedBranch?.createdBy)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Updated By</th><td className="px-4 py-2 text-slate-800">{formatValue(selectedBranch?.updatedBy?.name || selectedBranch?.updatedBy)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Created At</th><td className="px-4 py-2 text-slate-800">{formatDateTime(selectedBranch?.createdAt)}</td></tr>
                                                    <tr className="border-b border-slate-100"><th className="text-left px-4 py-2 text-slate-500 font-medium">Updated At</th><td className="px-4 py-2 text-slate-800">{formatDateTime(selectedBranch?.updatedAt)}</td></tr>
                                                    <tr><th className="text-left px-4 py-2 text-slate-500 font-medium">Documents</th><td className="px-4 py-2 text-slate-800">{Array.isArray(selectedBranch?.documentUrls) && selectedBranch.documentUrls.length ? selectedBranch.documentUrls.join(", ") : "-"}</td></tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeDetails}
                                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!selectedBranch?._id) return;
                                    navigate(`${rolePath}/branches/${selectedBranch._id}/edit`);
                                }}
                                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                            >
                                Edit Branch
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Branches;
