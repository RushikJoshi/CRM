import React, { useState } from "react";
import { FiX, FiInfo, FiClock, FiFileText, FiCheckCircle, FiEdit2 } from "react-icons/fi";
import ActivityTimeline from "./ActivityTimeline";
import NotesSection from "./NotesSection";
import TasksSection from "./TasksSection";

const DealDetailsModal = ({ isOpen, onClose, deal, onEdit }) => {
    const [activeTab, setActiveTab] = useState("timeline");

    if (!isOpen || !deal) return null;

    const stageDisplay = deal.stage != null && typeof deal.stage === "string"
        ? deal.stage.replace(/_/g, " ")
        : "—";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-gray-100">
                {/* Header */}
                <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-teal-50/30">
                    <div>
                        <div className="flex items-center gap-4">
                            <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{deal.customId || deal.title || "Untitled Deal"}</h2>
                            <span className="px-4 py-1.5 bg-teal-100 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">

                                {stageDisplay}
                            </span>
                        </div>
                        <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px] mt-2 opacity-80">
                            {deal.companyId?.name || deal.companyName || "—"}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {onEdit && (
                            <button
                                onClick={() => { onClose(); onEdit(deal); }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 border border-teal-100 hover:bg-teal-100 text-teal-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                            >
                                <FiEdit2 size={16} /> Edit
                            </button>
                        )}
                        <button onClick={onClose} className="p-4 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-gray-100 group">
                            <FiX size={26} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left: Deal Info */}
                    <div className="w-full lg:w-1/3 p-10 bg-gray-50/30 border-r border-gray-100 overflow-y-auto hidden lg:block">
                        <h3 className="font-black text-gray-900 uppercase tracking-widest text-[11px] mb-10 flex items-center gap-3">
                            <FiInfo className="text-teal-500" />
                            Deal Info
                        </h3>
                        <div className="space-y-8">
                            <div className="group">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none group-hover:text-teal-500 transition-colors">Value</p>
                                <p className="text-lg font-black text-teal-600 mt-3">₹{Number(deal.value || 0).toLocaleString("en-IN")}</p>
                            </div>
                            <div className="group">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none group-hover:text-teal-500 transition-colors">Assigned To</p>
                                <p className="text-sm font-black text-gray-700 mt-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                                    {deal.assignedTo?.name || "Unassigned"}
                                </p>
                            </div>
                            <div className="group">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none group-hover:text-teal-500 transition-colors">Stage</p>
                                <p className="text-sm font-black text-gray-700 mt-3">{stageDisplay}</p>
                            </div>
                            <div className="group">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none group-hover:text-teal-500 transition-colors">Created At</p>
                                <p className="text-sm font-black text-gray-500 mt-3">
                                    {deal.createdAt
                                        ? new Date(deal.createdAt).toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })
                                        : "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Timeline, Notes, Tasks */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex px-10 border-b border-gray-100 gap-10 bg-white sticky top-0 z-20">
                            <button
                                onClick={() => setActiveTab("timeline")}
                                className={`py-6 font-black uppercase tracking-[0.2em] text-[10px] border-b-2 transition-all flex items-center gap-3 ${activeTab === "timeline" ? "border-teal-500 text-teal-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                            >
                                <FiClock size={16} />
                                Activity
                            </button>
                            <button
                                onClick={() => setActiveTab("notes")}
                                className={`py-6 font-black uppercase tracking-[0.2em] text-[10px] border-b-2 transition-all flex items-center gap-3 ${activeTab === "notes" ? "border-teal-500 text-teal-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                            >
                                <FiFileText size={16} />
                                Notes
                            </button>
                            <button
                                onClick={() => setActiveTab("tasks")}
                                className={`py-6 font-black uppercase tracking-[0.2em] text-[10px] border-b-2 transition-all flex items-center gap-3 ${activeTab === "tasks" ? "border-teal-500 text-teal-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                            >
                                <FiCheckCircle size={16} className={activeTab === "tasks" ? "text-teal-500" : "text-gray-400"} />
                                Tasks & Reminders
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 bg-white scrollbar-hide">
                            <div className="max-w-4xl mx-auto">
                                {activeTab === "timeline" ? (
                                    <ActivityTimeline dealId={deal._id} />
                                ) : activeTab === "notes" ? (
                                    <NotesSection dealId={deal._id} />
                                ) : (
                                    <TasksSection dealId={deal._id} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DealDetailsModal;
