import React from "react";
import { FiX, FiInfo, FiMail, FiPhone, FiGlobe, FiMessageSquare, FiCalendar, FiFlag } from "react-icons/fi";

const InquiryDetailsModal = ({ isOpen, onClose, inquiry }) => {
    if (!isOpen || !inquiry) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>

            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-gray-100">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-green-50/30">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-green-500 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-green-500/20">
                            {inquiry.name?.charAt(0) || "I"}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tighter">{inquiry.name}</h2>
                            <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] mt-1 opacity-80">{inquiry.companyName || "Individual Inquiry"}</p>
                        </div>
                    </div>

                    {/* Conversion Journey Indicator */}
                    <div className="hidden lg:flex items-center gap-3 px-6 py-2.5 bg-white/60 rounded-3xl border border-white shadow-inner mx-4">
                        <div className="flex items-center gap-2 group/step">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)] flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-[0.15em]">Inquiry</span>
                        </div>
                        <div className="w-10 h-[2px] bg-gray-100 rounded-full" />
                        <div className="flex items-center gap-2 opacity-30 grayscale group/step">
                            <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-white opacity-0" />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Lead</span>
                        </div>
                        <div className="w-10 h-[2px] bg-gray-100 rounded-full" />
                        <div className="flex items-center gap-2 opacity-30 grayscale group/step">
                            <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-white opacity-0" />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Deal</span>
                        </div>
                    </div>

                    <button onClick={onClose} className="p-3 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100 group">
                        <FiX size={24} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                    {/* Status & Date */}
                    <div className="flex flex-wrap gap-4">
                        <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
                            <FiFlag className="text-green-500" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{inquiry.status}</span>
                        </div>
                        <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
                            <FiCalendar className="text-blue-500" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                {new Date(inquiry.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                            </span>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-50">
                        <div className="space-y-1.5 font-sans">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <FiMail size={12} className="text-green-500" /> Email
                            </p>
                            <p className="text-sm font-bold text-gray-700">{inquiry.email}</p>
                        </div>
                        <div className="space-y-1.5 font-sans">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <FiPhone size={12} className="text-green-500" /> Phone
                            </p>
                            <p className="text-sm font-bold text-gray-700">{inquiry.phone || "Not provided"}</p>
                        </div>
                    </div>

                    {/* Lead Attributes */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <FiMessageSquare size={12} className="text-blue-500" /> Course / Need
                            </p>
                            <p className="text-sm font-bold text-gray-700">{inquiry.course || "General"}</p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <FiFlag size={12} className="text-orange-500" /> Internal Status
                            </p>
                            <p className="text-sm font-bold text-gray-700">{inquiry.inquiryStatus || "Fresh"}</p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <FiGlobe size={12} className="text-blue-500" /> Source
                            </p>
                            <p className="text-sm font-bold text-gray-700">{inquiry.source || "Other"}</p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <FiGlobe size={12} className="text-blue-500" /> Website
                            </p>
                            <p className="text-sm font-bold text-blue-600 truncate">{inquiry.website || "N/A"}</p>
                        </div>
                    </div>

                    {/* Location Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">City</p>
                            <p className="text-sm font-bold text-gray-700">{inquiry.city || "Not specified"}</p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Office / Location</p>
                            <p className="text-sm font-bold text-gray-700">{inquiry.location || "Not specified"}</p>
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-1.5 pb-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Address</p>
                            <p className="text-sm font-medium text-gray-600 leading-relaxed">{inquiry.address || "No address provided."}</p>
                        </div>
                    </div>

                    {/* Message section */}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <FiMessageSquare size={12} className="text-green-500" /> Inquirer's Message
                        </p>
                        <div className="p-6 bg-green-50/20 rounded-2xl border border-green-100/30 relative">
                            <span className="absolute top-2 left-4 text-4xl text-green-200 font-serif opacity-30">“</span>
                            <p className="text-gray-600 font-bold italic leading-relaxed relative z-10 pl-6">
                                {inquiry.message || "The user didn't leave a message."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white border border-gray-200 text-gray-500 font-black rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InquiryDetailsModal;
