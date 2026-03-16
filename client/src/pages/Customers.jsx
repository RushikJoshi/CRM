import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiPlus, FiSearch, FiEdit2, FiGlobe, FiBriefcase, FiMail, FiPhone, FiX, FiCalendar } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import API from "../services/api";
import AddTaskModal from "../components/AddTaskModal";
import Pagination from "../components/Pagination";

const CustomersPage = () => {
    const location = useLocation();
    const basePath = location.pathname.split("/").slice(0, 2).join("/") || "/company";
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", phone: "", website: "", industry: "", customerType: "" });
    const [editingId, setEditingId] = useState(null);
    const [taskCustomer, setTaskCustomer] = useState(null);
    const [industries, setIndustries] = useState([]);
    const [customerTypes, setCustomerTypes] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/crm/customers?search=${encodeURIComponent(search)}&page=${page}&limit=${pageSize}`);
            setData(res.data?.data || res.data || []);
            setTotalPages(res.data?.pages ?? 1);
            setTotal(res.data?.total ?? 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasterData = async () => {
        try {
            const [iRes, cRes] = await Promise.all([
                API.get("/master?type=industry"),
                API.get("/master?type=customer_type")
            ]);
            setIndustries(iRes.data.data || []);
            setCustomerTypes(cRes.data.data || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { setPage(1); }, [search]);
    useEffect(() => { fetchData(); }, [search, page]);
    useEffect(() => { fetchMasterData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await API.put(`/crm/customers/${editingId}`, formData);
            } else {
                await API.post("/crm/customers", formData);
            }
            setShowModal(false);
            setFormData({ name: "", email: "", phone: "", website: "", industry: "", customerType: "" });
            setEditingId(null);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Simple & Clean Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none" />
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 bg-sky-500 text-white rounded-[22px] flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:rotate-6 transition-transform">
                        <FiBriefcase size={30} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Customers List</h1>
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest opacity-70 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                            View and manage your current customers
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 relative z-10">
                    {/* Search Field */}
                    <div className="relative group w-full lg:w-72">
                        <FiSearch size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-sky-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search customers..."
                            className="w-full pl-14 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-sky-500/5 focus:border-sky-200 transition-all font-bold text-gray-700 text-sm shadow-sm placeholder-gray-300"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => { setEditingId(null); setFormData({ name: "", email: "", phone: "", website: "", industry: "", customerType: "" }); setShowModal(true); }}
                        className="flex items-center gap-3 px-8 py-3.5 bg-sky-500 text-white font-black rounded-2xl shadow-lg shadow-sky-500/20 hover:bg-sky-600 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest"
                    >
                        <FiPlus size={20} strokeWidth={3} />
                        Add New Customer
                    </button>
                </div>
            </div>


            {/* Table Container */}
            <div className="canvas-card overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50">
                            <tr className="border-b border-gray-100">
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Customer Name</th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Industry</th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Quick Links</th>
                                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0F2F5]">
                            {data.map((item) => (
                                <tr key={item._id} className="hover:bg-slate-50/80 transition-all group duration-300 animate-in fade-in slide-in-from-bottom-2">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="relative group-hover:rotate-3 transition-transform">
                                                <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5EAF2] text-[#1A202C] flex items-center justify-center text-xl font-black shadow-sm group-hover:border-blue-200 group-hover:text-blue-600 transition-all">
                                                    {item.name.charAt(0)}
                                                </div>
                                                {item.pendingTasksCount > 0 && (
                                                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-[11px] font-black border-4 border-white shadow-lg animate-bounce">
                                                        {item.pendingTasksCount}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <Link
                                                    to={`${basePath}/customers/${item._id}`}
                                                    className="font-black text-[#1A202C] text-[15px] tracking-tight group-hover:text-blue-600 transition-colors truncate hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded"
                                                >
                                                    {item.name}
                                                </Link>
                                                <span className="text-[10px] text-blue-500 font-black flex items-center gap-2 mt-1.5 uppercase tracking-widest opacity-80">
                                                    <FiGlobe size={11} strokeWidth={3} /> {item.website || "No website"}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className="px-4 py-2 bg-[#F4F7FB] text-[#718096] border border-[#E5EAF2] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                                            {item.industry || "General Node"}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 space-y-3">
                                        <p className="text-[13px] font-bold text-[#1A202C] flex items-center gap-3">
                                            <FiMail className="text-[#CBD5E0] group-hover:text-blue-500 transition-colors" size={16} />
                                            {item.email || "No digital link"}
                                        </p>
                                        <p className="text-[11px] font-black text-[#A0AEC0] flex items-center gap-3 uppercase tracking-widest">
                                            <FiPhone className="text-[#CBD5E0] group-hover:text-blue-500 transition-colors" size={16} />
                                            {item.phone || "No phone number"}
                                        </p>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            {item.phone && (
                                                <a
                                                    href={`https://wa.me/${item.phone.replace(/\D/g, '') || item.phone}?text=${encodeURIComponent(`Greetings ${item.name}, from our accounts intelligence team.`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="WhatsApp"
                                                >
                                                    <FaWhatsapp size={18} />
                                                </a>
                                            )}
                                            {item.email && (
                                                <a
                                                    href={`mailto:${item.email}?subject=${encodeURIComponent("Strategic Protocol Update")}`}
                                                    title="Email"
                                                >
                                                    <FiMail size={16} />
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                            <button
                                                onClick={() => setTaskCustomer(item)}
                                                className="w-11 h-11 bg-white border border-[#E5EAF2] text-[#718096] rounded-[14px] flex items-center justify-center hover:text-indigo-600 hover:border-indigo-200 hover:bg-slate-50 transition-all shadow-sm"
                                                title="Add Task"
                                            >
                                                <FiCalendar size={18} />
                                            </button>
                                            <button
                                                onClick={() => { setEditingId(item._id); setFormData({ name: item.name, email: item.email, phone: item.phone, website: item.website, industry: item.industry }); setShowModal(true); }}
                                                className="w-11 h-11 bg-blue-600 text-white rounded-[14px] flex items-center justify-center hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                                                title="Edit Details"
                                            >
                                                <FiEdit2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {
                    !loading && data.length === 0 && (
                        <div className="py-48 flex flex-col items-center gap-8 text-center bg-slate-50/20">
                            <div className="w-28 h-28 bg-white rounded-[40px] border border-[#E5EAF2] shadow-xl flex items-center justify-center text-[#CBD5E0] relative group hover:rotate-6 transition-all duration-700">
                                <FiBriefcase size={56} />
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg animate-bounce">
                                    <FiPlus size={16} strokeWidth={4} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <p className="text-[13px] font-black text-[#1A202C] uppercase tracking-[0.3em]">Customer List</p>
                                <p className="text-[#A0AEC0] text-sm font-bold max-w-xs mx-auto leading-relaxed">No customers found in your records.</p>
                            </div>
                        </div>
                    )
                }
            </div>
            {totalPages > 1 && (
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} total={total} pageSize={pageSize} />
            )}

            {/* Create/Edit Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl border border-[#E5EAF2] overflow-hidden animate-in zoom-in-95 duration-500 relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

                            <div className="px-10 py-12 text-center border-b border-gray-100 relative bg-white z-10 flex flex-col items-center">
                                <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                    <FiX size={22} strokeWidth={3} />
                                </button>
                                <div className="w-16 h-16 bg-sky-500 text-white rounded-[22px] flex items-center justify-center shadow-lg shadow-sky-500/20 mb-6">
                                    <FiBriefcase size={32} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 tracking-tight">{editingId ? "Edit Customer" : "Add New Customer"}</h3>
                                <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest mt-3 opacity-80">Please fill in the details below</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3 md:col-span-2">
                                        <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Customer Name</label>
                                        <div className="relative group">
                                            <FiBriefcase size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                            <input required placeholder="Enter company name..." className="w-full pl-16 pr-8 py-5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Email Address</label>
                                        <div className="relative group">
                                            <FiMail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                            <input type="email" placeholder="example@email.com" className="w-full pl-16 pr-8 py-5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Phone Number</label>
                                        <div className="relative group">
                                            <FiPhone size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                            <input placeholder="+91" className="w-full pl-16 pr-8 py-5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Website URL</label>
                                        <div className="relative group">
                                            <FiGlobe size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors" />
                                            <input placeholder="https://www.example.com" className="w-full pl-16 pr-8 py-5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm shadow-sm placeholder-[#CBD5E0]" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-[#1A202C] uppercase tracking-[0.15em] ml-2">Industry</label>
                                        <div className="relative group">
                                            <FiSearch size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#CBD5E0] group-focus-within:text-blue-600 transition-colors z-10" />
                                            <select className="w-full pl-16 pr-12 py-5 bg-[#F4F7FB] border border-transparent rounded-[24px] outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-300 transition-all font-black text-[#1A202C] text-sm appearance-none shadow-sm cursor-pointer" value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })}>
                                                <option value="">Select Industry...</option>
                                                {industries.map(i => <option key={i._id} value={i.name}>{i.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 flex flex-col sm:flex-row gap-6 border-t border-gray-100">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 font-black rounded-2xl hover:bg-gray-100 hover:text-gray-600 transition-all text-xs uppercase tracking-widest">Cancel</button>
                                    <button type="submit" className="flex-[2] py-4 bg-sky-500 text-white font-black rounded-2xl hover:bg-sky-600 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest shadow-lg shadow-sky-500/20">
                                        {editingId ? "Update Customer" : "Save Customer"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }


            <AddTaskModal
                isOpen={Boolean(taskCustomer)}
                onClose={() => setTaskCustomer(null)}
                onSuccess={fetchData}
                customer={taskCustomer}
            />
        </div >
    );
};

export default CustomersPage;
