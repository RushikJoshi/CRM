import React, { useState, useEffect } from "react";
import {
    FiPlus, FiCpu, FiPlay, FiPause, FiEdit2, FiCheck,
    FiZap, FiAlertCircle, FiCheckCircle, FiToggleLeft, FiToggleRight,
    FiArrowRight, FiX, FiFilter, FiSearch, FiRefreshCw, FiClock,
    FiBell, FiUser, FiTag, FiMail, FiSliders, FiChevronDown, FiMoreVertical
} from "react-icons/fi";
import API from "../services/api";
import { getCurrentUser } from "../context/AuthContext";

// ─── Constants ──────────────────────────────────────────────────────────────
const TRIGGERS = [
    { value: "lead_created", label: "New Lead Created", icon: <FiZap />, color: "bg-green-100 text-green-700", description: "When a new lead is added to the CRM" },
    { value: "deal_stage_changed", label: "Deal Stage Changed", icon: <FiArrowRight />, color: "bg-blue-100 text-blue-700", description: "When a deal moves to a different stage" },
    { value: "meeting_scheduled", label: "Meeting Scheduled", icon: <FiClock />, color: "bg-purple-100 text-purple-700", description: "When a new meeting is booked" },
    { value: "task_overdue", label: "Task Overdue", icon: <FiAlertCircle />, color: "bg-red-100 text-red-700", description: "When a task crosses its due date" },
];

const ACTION_TYPES = [
    { value: "create_notification", label: "Send Notification", icon: <FiBell />, color: "bg-orange-100 text-orange-700" },
    { value: "create_task", label: "Create Task", icon: <FiCheck />, color: "bg-green-100 text-green-700" },
    { value: "assign_to_user", label: "Assign to User", icon: <FiUser />, color: "bg-blue-100 text-blue-700" },
    { value: "assign_to_branch", label: "Assign to Branch", icon: <FiTag />, color: "bg-purple-100 text-purple-700" },
];

const STATUS_COLORS = {
    active: "bg-green-100 text-green-700 border-green-200",
    inactive: "bg-gray-100 text-gray-500 border-gray-200"
};

const TRIGGER_ICON_MAP = {
    lead_created: <FiZap className="text-green-600" />,
    deal_stage_changed: <FiArrowRight className="text-blue-600" />,
    meeting_scheduled: <FiClock className="text-purple-600" />,
    task_overdue: <FiAlertCircle className="text-red-600" />,
};

const TRIGGER_COLORS = {
    lead_created: "bg-green-50 border-green-200",
    deal_stage_changed: "bg-blue-50 border-blue-200",
    meeting_scheduled: "bg-purple-50 border-purple-200",
    task_overdue: "bg-red-50 border-red-200",
};

// ─── Empty Action Template ──────────────────────────────────────────────────
const emptyAction = () => ({ type: "create_notification", params: { title: "", message: "" } });

// ─── Action Config Fields ───────────────────────────────────────────────────
const ActionFields = ({ action, index, onChange }) => {
    if (action.type === "create_notification") {
        return (
            <div className="grid grid-cols-1 gap-3 mt-3">
                <input
                    className="input-field"
                    placeholder="Notification title..."
                    value={action.params.title || ""}
                    onChange={e => onChange(index, { ...action, params: { ...action.params, title: e.target.value } })}
                />
                <textarea
                    className="input-field resize-none"
                    rows={2}
                    placeholder="Notification message..."
                    value={action.params.message || ""}
                    onChange={e => onChange(index, { ...action, params: { ...action.params, message: e.target.value } })}
                />
            </div>
        );
    }
    if (action.type === "create_task") {
        return (
            <div className="grid grid-cols-1 gap-3 mt-3">
                <input
                    className="input-field"
                    placeholder="Task title..."
                    value={action.params.title || ""}
                    onChange={e => onChange(index, { ...action, params: { ...action.params, title: e.target.value } })}
                />
                <input
                    className="input-field"
                    placeholder="Due in (days)..."
                    type="number"
                    min={1}
                    value={action.params.dueDays || ""}
                    onChange={e => onChange(index, { ...action, params: { ...action.params, dueDays: e.target.value } })}
                />
            </div>
        );
    }
    if (action.type === "assign_to_user") {
        return (
            <div className="mt-3">
                <input
                    className="input-field"
                    placeholder="User ID or email..."
                    value={action.params.userId || ""}
                    onChange={e => onChange(index, { ...action, params: { ...action.params, userId: e.target.value } })}
                />
            </div>
        );
    }
    if (action.type === "assign_to_branch") {
        return (
            <div className="mt-3">
                <input
                    className="input-field"
                    placeholder="Branch ID..."
                    value={action.params.branchId || ""}
                    onChange={e => onChange(index, { ...action, params: { ...action.params, branchId: e.target.value } })}
                />
            </div>
        );
    }
    return null;
};

// ─── Main Component ─────────────────────────────────────────────────────────
const Automation = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editRule, setEditRule] = useState(null);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterTrigger, setFilterTrigger] = useState("all");
    const [saving, setSaving] = useState(false);
    const [togglingId, setTogglingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);

    const user = getCurrentUser() || {};

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        trigger: "lead_created",
        conditions: {},
        actions: [emptyAction()],
        status: "active"
    });

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            trigger: "lead_created",
            conditions: {},
            actions: [emptyAction()],
            status: "active"
        });
        setEditRule(null);
    };

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await API.get("/automation");
            setRules(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRules(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editRule) {
                await API.put(`/automation/${editRule._id}`, formData);
            } else {
                await API.post("/automation", formData);
            }
            setShowModal(false);
            resetForm();
            fetchRules();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (rule) => {
        setTogglingId(rule._id);
        try {
            const newStatus = rule.status === "active" ? "inactive" : "active";
            await API.put(`/automation/${rule._id}`, { ...rule, status: newStatus });
            fetchRules();
        } catch (err) {
            console.error(err);
        } finally {
            setTogglingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this automation rule? This cannot be undone.")) return;
        setDeletingId(id);
        try {
            await API.delete(`/automation/${id}`);
            fetchRules();
        } catch (err) {
            console.error(err);
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (rule) => {
        setEditRule(rule);
        setFormData({
            name: rule.name,
            description: rule.description || "",
            trigger: rule.trigger,
            conditions: rule.conditions || {},
            actions: rule.actions?.length ? rule.actions : [emptyAction()],
            status: rule.status
        });
        setShowModal(true);
        setActiveMenuId(null);
    };

    const handleActionChange = (index, updated) => {
        const newActions = [...formData.actions];
        newActions[index] = updated;
        setFormData(f => ({ ...f, actions: newActions }));
    };

    const addAction = () => {
        setFormData(f => ({ ...f, actions: [...f.actions, emptyAction()] }));
    };

    const removeAction = (index) => {
        setFormData(f => ({ ...f, actions: f.actions.filter((_, i) => i !== index) }));
    };

    const filteredRules = rules.filter(rule => {
        const matchSearch = rule.name?.toLowerCase().includes(search.toLowerCase()) || rule.trigger?.includes(search.toLowerCase());
        const matchStatus = filterStatus === "all" || rule.status === filterStatus;
        const matchTrigger = filterTrigger === "all" || rule.trigger === filterTrigger;
        return matchSearch && matchStatus && matchTrigger;
    });

    const activeCount = rules.filter(r => r.status === "active").length;

    return (
        <div className="space-y-5 animate-in fade-in duration-500 pb-10">
            {/* ─── Inline Styles ─────────────────────────────────── */}
            <style>{`
                .input-field {
                    width: 100%;
                    padding: 10px 16px;
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    outline: none;
                    font-size: 13px;
                    font-weight: 600;
                    color: #1f2937;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    background: white;
                    border-color: #22c55e;
                    box-shadow: 0 0 0 3px rgba(34,197,94,0.1);
                }
                .input-field::placeholder {
                    color: #9ca3af;
                    font-weight: 500;
                }
            `}</style>

            {/* ─── Header ─────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/20">
                            <FiCpu className="text-white" size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Automation</h1>
                            <p className="text-gray-500 text-sm font-medium mt-0.5">
                                Set up automatic workflows triggered by CRM events
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{rules.length} Total Rules</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span className="text-[11px] font-black text-green-600 uppercase tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                                    {activeCount} Active
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 px-5 py-3 bg-green-500 text-white font-black rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest self-start lg:self-auto"
                    >
                        <FiPlus size={18} />
                        New Rule
                    </button>
                </div>

                {/* ─── Filters Bar ─────────────────────────────────── */}
                <div className="border-t border-gray-50 px-5 sm:px-6 py-4 bg-gray-50/30 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Search rules..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-xl outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/10 transition-all text-gray-700"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <FiFilter size={14} className="text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select
                            value={filterTrigger}
                            onChange={e => setFilterTrigger(e.target.value)}
                            className="text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-green-400 cursor-pointer"
                        >
                            <option value="all">All Triggers</option>
                            {TRIGGERS.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        <button onClick={fetchRules} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-all">
                            <FiRefreshCw size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Stats Mini Cards ─────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TRIGGERS.map((trigger) => {
                    const count = rules.filter(r => r.trigger === trigger.value).length;
                    return (
                        <div
                            key={trigger.value}
                            onClick={() => setFilterTrigger(filterTrigger === trigger.value ? "all" : trigger.value)}
                            className={`bg-white rounded-xl border shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${filterTrigger === trigger.value ? 'border-green-400 ring-2 ring-green-500/20' : 'border-gray-100 hover:-translate-y-0.5'}`}
                        >
                            <div className={`w-8 h-8 rounded-lg ${trigger.color} flex items-center justify-center text-sm mb-2`}>
                                {trigger.icon}
                            </div>
                            <p className="text-xl font-black text-gray-900">{count}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight mt-0.5">{trigger.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* ─── Rules Grid ──────────────────────────────────────── */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
                            <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
                            <div className="h-3 bg-gray-100 rounded w-1/2 mb-6" />
                            <div className="h-8 bg-gray-100 rounded mb-2" />
                            <div className="h-8 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
            ) : filteredRules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-200 mb-5 border border-gray-100 shadow-sm">
                        <FiCpu size={36} />
                    </div>
                    <h3 className="text-lg font-black text-gray-400 uppercase tracking-widest mb-2">
                        {search || filterStatus !== "all" || filterTrigger !== "all" ? "No Rules Found" : "No Automation Rules"}
                    </h3>
                    <p className="text-gray-400 text-sm max-w-sm text-center font-medium leading-relaxed opacity-60 mb-6">
                        {search || filterStatus !== "all" || filterTrigger !== "all"
                            ? "Try adjusting your filters to find what you're looking for."
                            : "Create automation rules to trigger actions based on CRM events — like Zoho CRM workflows."}
                    </p>
                    {!search && filterStatus === "all" && filterTrigger === "all" && (
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-black rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all text-sm uppercase tracking-widest"
                        >
                            <FiPlus size={16} />
                            Create First Rule
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRules.map((rule) => {
                        const triggerInfo = TRIGGERS.find(t => t.value === rule.trigger);
                        const isToggling = togglingId === rule._id;
                        const isDeleting = deletingId === rule._id;
                        return (
                            <div
                                key={rule._id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
                            >
                                {/* Status bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${rule.status === "active" ? "bg-green-500" : "bg-gray-300"} transition-colors`} />

                                <div className="p-5 pl-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${TRIGGER_COLORS[rule.trigger] || 'bg-gray-50 border-gray-200'} border`}>
                                                {TRIGGER_ICON_MAP[rule.trigger] || <FiZap className="text-gray-500" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black text-gray-900 text-base leading-tight truncate">{rule.name}</h3>
                                                {rule.description && (
                                                    <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">{rule.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Menu */}
                                        <div className="relative ml-2">
                                            <button
                                                onClick={() => setActiveMenuId(activeMenuId === rule._id ? null : rule._id)}
                                                className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                                            >
                                                <FiMoreVertical size={16} />
                                            </button>
                                            {activeMenuId === rule._id && (
                                                <div className="absolute right-0 top-8 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 min-w-[140px]">
                                                    <button
                                                        onClick={() => handleEdit(rule)}
                                                        className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                                    >
                                                        <FiEdit2 size={14} className="text-gray-400" />
                                                        Edit Rule
                                                    </button>
                                                    <button
                                                        onClick={() => { handleToggleStatus(rule); setActiveMenuId(null); }}
                                                        className="w-full px-4 py-2.5 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                                    >
                                                        {rule.status === "active" ? <FiPause size={14} className="text-orange-400" /> : <FiPlay size={14} className="text-green-500" />}
                                                        {rule.status === "active" ? "Pause" : "Activate"}
                                                    </button>

                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Trigger Badge */}
                                    <div className="mb-4">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Trigger When</p>
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${triggerInfo?.color || 'bg-gray-100 text-gray-600'}`}>
                                            {triggerInfo?.icon}
                                            {triggerInfo?.label || rule.trigger?.replace(/_/g, ' ')}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mb-4">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Then Do</p>
                                        <div className="space-y-1.5">
                                            {rule.actions?.slice(0, 3).map((action, i) => {
                                                const actionInfo = ACTION_TYPES.find(a => a.value === action.type);
                                                return (
                                                    <div key={i} className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                                                        <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] flex-shrink-0 ${actionInfo?.color || 'bg-gray-100 text-gray-500'}`}>
                                                            {actionInfo?.icon}
                                                        </span>
                                                        <span className="truncate">{actionInfo?.label || action.type?.replace(/_/g, ' ')}</span>
                                                    </div>
                                                );
                                            })}
                                            {rule.actions?.length > 3 && (
                                                <p className="text-[10px] font-black text-gray-400 pl-2">+{rule.actions.length - 3} more actions</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border ${STATUS_COLORS[rule.status]}`}>
                                            {rule.status === "active" ? "● Active" : "○ Paused"}
                                        </span>
                                        <button
                                            onClick={() => handleToggleStatus(rule)}
                                            disabled={isToggling}
                                            className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${rule.status === "active" ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"} ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {isToggling ? (
                                                <FiRefreshCw size={12} className="animate-spin" />
                                            ) : rule.status === "active" ? (
                                                <FiPause size={12} />
                                            ) : (
                                                <FiPlay size={12} />
                                            )}
                                            {isToggling ? '...' : rule.status === "active" ? "Pause" : "Activate"}
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-gray-300 font-bold mt-2">
                                        Created {new Date(rule.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── Close menu on outside click ─────────────────────── */}
            {activeMenuId && (
                <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
            )}

            {/* ─── Create / Edit Modal ──────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">
                                    {editRule ? "Edit Automation Rule" : "New Automation Rule"}
                                </h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Configure your workflow</p>
                            </div>
                            <button
                                onClick={() => { setShowModal(false); resetForm(); }}
                                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-5">
                                {/* Rule Name */}
                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Rule Name *</label>
                                    <input
                                        required
                                        className="input-field"
                                        value={formData.name}
                                        onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                                        placeholder="e.g. Auto-assign new leads to team"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Description</label>
                                    <input
                                        className="input-field"
                                        value={formData.description}
                                        onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                                        placeholder="Optional description of what this rule does..."
                                    />
                                </div>

                                {/* Trigger */}
                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">
                                        <FiZap className="inline mr-1.5" /> Trigger — When this happens
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {TRIGGERS.map(trigger => (
                                            <button
                                                key={trigger.value}
                                                type="button"
                                                onClick={() => setFormData(f => ({ ...f, trigger: trigger.value }))}
                                                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${formData.trigger === trigger.value ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
                                            >
                                                <span className={`p-1.5 rounded-lg ${trigger.color} text-sm flex-shrink-0`}>{trigger.icon}</span>
                                                <div>
                                                    <p className={`font-black text-xs ${formData.trigger === trigger.value ? 'text-green-700' : 'text-gray-700'}`}>{trigger.label}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{trigger.description}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest">
                                            <FiArrowRight className="inline mr-1.5" /> Actions — Then do this
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addAction}
                                            className="text-[11px] font-black text-green-600 uppercase tracking-widest hover:text-green-700 flex items-center gap-1"
                                        >
                                            <FiPlus size={13} />
                                            Add Action
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.actions.map((action, i) => (
                                            <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Action {i + 1}</span>
                                                    {formData.actions.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeAction(i)}
                                                            className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                                                        >
                                                            <FiX size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <select
                                                    value={action.type}
                                                    onChange={e => handleActionChange(i, { type: e.target.value, params: {} })}
                                                    className="input-field"
                                                >
                                                    {ACTION_TYPES.map(at => (
                                                        <option key={at.value} value={at.value}>{at.label}</option>
                                                    ))}
                                                </select>
                                                <ActionFields action={action} index={i} onChange={handleActionChange} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">Initial Status</label>
                                    <div className="flex gap-3">
                                        {["active", "inactive"].map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setFormData(f => ({ ...f, status: s }))}
                                                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${formData.status === s ? (s === 'active' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-400 bg-gray-100 text-gray-600') : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                            >
                                                {s === 'active' ? '● Active' : '○ Inactive'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 pb-6 flex gap-3 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="flex-1 py-3 font-black text-gray-500 uppercase tracking-widest text-xs hover:bg-gray-50 rounded-xl transition-all border border-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`flex-[2] py-3 bg-green-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-600 active:scale-95 transition-all flex items-center justify-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {saving ? (
                                        <><FiRefreshCw size={14} className="animate-spin" /> Saving...</>
                                    ) : (
                                        <><FiCheck size={14} /> {editRule ? "Update Rule" : "Create Rule"}</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Automation;
