import React, { useMemo, useState } from "react";
import { FiX, FiMessageCircle, FiPhone, FiSend, FiMail } from "react-icons/fi";
import API from "../services/api";

const SendMessageModal = ({ isOpen, onClose, recipientNumber, leadId, customerId, dealId }) => {
    const [type, setType] = useState("whatsapp"); // whatsapp | sms | email
    const [content, setContent] = useState("");
    const [subject, setSubject] = useState("");
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState(null);

    const templates = useMemo(() => ([
        {
            id: "qualified_prompt",
            label: "CRM: Qualified Lead Prompt",
            subject: "Following up on your inquiry — [Lead Title]",
            body: `Hi [Customer Name],\n\nThank you for your interest. We've reviewed your requirements\nand believe we can deliver excellent value.\n\nCould we schedule a quick call to discuss your needs further?\n\nBest regards,\n[Owner Name]\n[Company Name]`,
        },
        {
            id: "sales_proposition",
            label: "CRM: New Sales Proposition",
            subject: "Our Proposal for [Lead Title]",
            body: `Hi [Customer Name],\n\nPlease find attached our detailed proposal for [Lead Title].\n\nExpected Investment: ₹[Expected Revenue]\n\nWe're confident this solution fits your goals. Let us know\nif you have any questions or need adjustments.\n\nLooking forward to your feedback.\n\nBest regards,\n[Owner Name]`,
        },
        {
            id: "negotiation",
            label: "CRM: Negotiation Template",
            subject: "Finalizing the Details — [Lead Title]",
            body: `Hi [Customer Name],\n\nWe appreciate your consideration and are eager to finalize\nthe agreement.\n\nTo move forward, could you confirm the following:\n- Final budget approval\n- Preferred start date\n- Any remaining concerns\n\nWe're flexible and committed to making this work for you.\n\nBest regards,\n[Owner Name]`,
        },
    ]), []);

    const handleSend = async () => {
        if (!content.trim()) return;
        setSending(true);
        setStatus(null);
        try {
            await API.post("/messages", {
                type,
                recipientNumber: recipientNumber || "",
                subject: type === "email" ? subject : undefined,
                content,
                leadId: leadId || null,
                customerId: customerId || null,
                dealId: dealId || null
            });
            setStatus("success");
            setContent("");
            setSubject("");
            setTimeout(() => { setStatus(null); onClose(); }, 1500);
        } catch (err) {
            setStatus("error");
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative z-10 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl"><FiMessageCircle size={20} /></div>
                        <div>
                            <h3 className="font-black text-gray-900">Send Message</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{recipientNumber || "No number"}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><FiX size={20} /></button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Type Toggle */}
                    <div className="flex gap-3">
                        {["whatsapp", "sms", "email"].map(t => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${type === t ? 'bg-[#38BDF8] text-white shadow-lg shadow-sky-500/20' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                            >
                                {t === "whatsapp" ? <FiMessageCircle size={16} /> : t === "sms" ? <FiPhone size={16} /> : <FiMail size={16} />}
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* Message Templates */}
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Quick Templates</p>
                        <div className="flex flex-wrap gap-2">
                            {templates.map((tpl) => (
                                <button
                                    key={tpl.id}
                                    onClick={() => { setType("email"); setSubject(tpl.subject); setContent(tpl.body); }}
                                    className="px-3 py-1.5 bg-gray-50 hover:bg-sky-50 hover:text-sky-700 border border-gray-100 hover:border-sky-100 text-gray-600 text-xs font-bold rounded-lg transition-all truncate max-w-[220px]"
                                    title={tpl.label}
                                >
                                    {tpl.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {type === "email" && (
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject</label>
                            <input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Email subject..."
                                className="mt-2 w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-800 placeholder-gray-300 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-300 transition-all"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={4}
                        placeholder="Type your message..."
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-800 placeholder-gray-300 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-300 resize-none transition-all"
                    />

                    {/* Status feedback */}
                    {status === "success" && (
                        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-black text-center animate-in fade-in">✓ Message sent & logged successfully!</div>
                    )}
                    {status === "error" && (
                        <div className="p-3 bg-red-50 text-red-500 rounded-xl text-sm font-black text-center animate-in fade-in">Delivery failed. Message logged.</div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 border border-gray-100 rounded-xl text-gray-500 font-black text-sm hover:bg-gray-50 transition-all">Cancel</button>
                    <button
                        onClick={handleSend}
                        disabled={sending || !content.trim()}
                        className="flex-1 py-3 bg-[#38BDF8] text-white font-black rounded-xl text-sm shadow-lg shadow-sky-500/20 hover:bg-[#0EA5E9] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSend size={16} />}
                        {sending ? "Sending..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendMessageModal;
