import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import BranchTable from "../components/BranchTable";
import { FiPlus, FiSearch, FiFilter } from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import { getCurrentUser } from "../context/AuthContext";

function Branches() {
    const [branches, setBranches] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("");
    const navigate = useNavigate();
    const toast = useToast();

    const currentUser = getCurrentUser();
    const isSuperAdmin = currentUser?.role === "super_admin";
    const apiBase = isSuperAdmin ? "/super-admin/branches" : "/branches";

    const formBase = (() => {
        const path = window.location.pathname;
        if (path.startsWith("/superadmin")) return "/superadmin/branches";
        if (path.startsWith("/company")) return "/company/branches";
        return "/branches";
    })();

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const url = `${apiBase}?search=${search}${isSuperAdmin && selectedCompany ? `&companyId=${selectedCompany}` : ""}`;
            const res = await API.get(url);
            setBranches(Array.isArray(res.data) ? res.data : []);
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
            setCompanies(res.data?.companies || []);
        } catch { /* silent */ }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this branch?")) return;
        try {
            await API.delete(`${apiBase}/${id}`);
            toast.success("Branch deleted successfully.");
            fetchBranches();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete branch.");
        }
    };

    useEffect(() => { fetchBranches(); }, [search, selectedCompany]);
    useEffect(() => { fetchCompanies(); }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Branch Management</h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-75">
                        Configure and manage regional branches.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group flex-1 lg:w-48">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search branches..."
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {isSuperAdmin && companies.length > 0 && (
                        <div className="relative group w-full lg:w-48">
                            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-bold text-gray-700 text-sm appearance-none shadow-sm cursor-pointer"
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                            >
                                <option value="">All Companies</option>
                                {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                    <button
                        onClick={() => navigate(`${formBase}/create`)}
                        className="flex items-center gap-3 px-6 py-4 bg-green-500 text-white font-black rounded-xl shadow-xl shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                        <FiPlus size={20} />
                        Add Branch
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-[400px] bg-white rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center space-y-4 shadow-sm">
                    <div className="w-12 h-12 border-[6px] border-green-50 border-t-green-500 rounded-full animate-spin" />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Loading Branches...</p>
                </div>
            ) : (
                <BranchTable
                    branches={branches}
                    onEdit={(b) => navigate(`${formBase}/${b._id}/edit`)}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
}

export default Branches;
