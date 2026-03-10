import React, { useState } from "react";
import { FiX, FiInfo, FiClock, FiFileText, FiMessageCircle, FiCheckCircle } from "react-icons/fi";
import ActivityTimeline from "./ActivityTimeline";
import NotesSection from "./NotesSection";
import TasksSection from "./TasksSection";
import SendMessageModal from "./SendMessageModal";

const LeadDetailsModal = ({ isOpen, onClose, lead }) => {
    const [activeTab, setActiveTab] = useState("timeline");
    const [showMsg, setShowMsg] = useState(false);

    if (!isOpen || !lead) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>

            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-gray-100">
                {/* Header */}
                <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-green-50/30">
                    <div>
                        <div className="flex items-center gap-4">
                            <h2 className="text-4xl font-black text-gray-900 tracking-tighter">{lead.name}</h2>
                            <span className="px-4 py-1.5 bg-green-100 text-green-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                                {lead.status?.name || lead.status || "New"}
                            </span>
                        </div>
                        <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px] mt-2 opacity-80">{lead.companyName || "Individual"}</p>
                    </div>

                    {/* Conversion Journey Indicator */}
                    <div className="hidden lg:flex items-center gap-3 px-6 py-2.5 bg-white/60 rounded-3xl border border-white shadow-inner mx-4">
                        <div className="flex items-center gap-2 group/step">
                            <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Inquiry</span>
                        </div>
                        <div className="w-10 h-[2px] bg-emerald-100 rounded-full" />
                        <div className="flex items-center gap-2 group/step">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)] flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-[0.15em]">Lead</span>
                        </div>
                        <div className="w-10 h-[2px] bg-gray-100 rounded-full" />
                        <div className="flex items-center gap-2 opacity-30 grayscale group/step">
                            <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-white opacity-0" />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Deal</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowMsg(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-100 hover:bg-green-100 text-green-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                        >
                            <FiMessageCircle size={16} /> WhatsApp
                        </button>
                        <button onClick={onClose} className="p-4 hover:bg-white rounded-2xl transition-all shadow-sm border border-transparent hover:border-gray-100 group">
                            <FiX size={26} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left: Info */}
                    <div className="w-full lg:w-1/3 p-10 bg-gray-50/30 border-r border-gray-100 overflow-y-auto hidden lg:block">
                        <h3 className="font-black text-gray-900 uppercase tracking-widest text-[11px] mb-10 flex items-center gap-3">
                            <FiInfo className="text-green-500" />
                            Lead Info
                        </h3>
                        <div className="space-y-8">
                            <div className="group">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none group-hover:text-green-500 transition-colors">Phone</p>
                                <p className="text-sm font-black text-gray-700 mt-3">{lead.phone || "No phone"}</p>
                            </div>
                            <div className="group">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none group-hover:text-green-500 transition-colors">Email</p>
                                <p className="text-sm font-black text-gray-700 mt-3">{lead.email}</p>
                            </div>
                            <div className="group">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none group-hover:text-green-500 transition-colors">Assigned To</p>
                                <p className="text-sm font-black text-gray-700 mt-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    {lead.assignedTo?.name || "Unassigned"}
                                </p>
                            </div>
                            <div className="group">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none group-hover:text-green-500 transition-colors">Value</p>
                                <p className="text-lg font-black text-green-600 mt-3">₹{Number(lead.value || 0).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="group">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none group-hover:text-green-500 transition-colors">Created At</p>
                                <p className="text-sm font-black text-gray-500 mt-3">
                                    {lead.createdAt
                                        ? new Date(lead.createdAt).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })
                                        : "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Timeline & Notes */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Tabs */}
                        <div className="flex px-10 border-b border-gray-100 gap-10 bg-white sticky top-0 z-20">
                            <button
                                onClick={() => setActiveTab("timeline")}
                                className={`py-6 font-black uppercase tracking-[0.2em] text-[10px] border-b-2 transition-all flex items-center gap-3 ${activeTab === 'timeline' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                <FiClock size={16} />
                                Activity
                            </button>
                            <button
                                onClick={() => setActiveTab("notes")}
                                className={`py-6 font-black uppercase tracking-[0.2em] text-[10px] border-b-2 transition-all flex items-center gap-3 ${activeTab === 'notes' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                <FiFileText size={16} />
                                Notes
                            </button>
                            <button
                                onClick={() => setActiveTab("tasks")}
                                className={`py-6 font-black uppercase tracking-[0.2em] text-[10px] border-b-2 transition-all flex items-center gap-3 ${activeTab === 'tasks' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                <FiCheckCircle size={16} className={activeTab === 'tasks' ? 'text-green-500' : 'text-gray-400'} />
                                Tasks & Reminders
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-10 bg-white scrollbar-hide">
                            <div className="max-w-4xl mx-auto">
                                {activeTab === "timeline" ? (
                                    <ActivityTimeline leadId={lead._id} />
                                ) : activeTab === "notes" ? (
                                    <NotesSection leadId={lead._id} />
                                ) : (
                                    <TasksSection leadId={lead._id} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showMsg && (
                <SendMessageModal
                    isOpen={showMsg}
                    onClose={() => setShowMsg(false)}
                    recipientNumber={lead.phone}
                    leadId={lead._id}
                />
            )}
        </div>
    );
};

export default LeadDetailsModal;
