import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../../services/api";
import { useToast } from "../../context/ToastContext";
import {
  FiArrowLeft,
  FiInbox,
  FiInfo,
  FiMail,
  FiMessageSquare,
  FiSend,
  FiSettings,
  FiTrendingUp,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
import RichTextEmailEditor from "../../components/RichTextEmailEditor";
import { API_BASE_URL } from "../../config/api";
import { applySampleMergeData, SAMPLE_MERGE_DATA } from "../../utils/mergePreview";

const defaultEmailHtml = `
  <h2 style="margin:0 0 16px;color:#0f172a;">Hello {{name}},</h2>
  <p style="margin:0 0 12px;">We are excited to share a fresh update with you.</p>
  <p style="margin:0 0 12px;">Our team is ready to help you move to the next step.</p>
  <p style="margin:24px 0 0;">Regards,<br/>EduPath Pro Team</p>
`;

const defaultWhatsappText = "Hi {{name}}, we're launching a priority session today. Secure your spot now!";
const MERGE_VARIABLES = Object.entries(SAMPLE_MERGE_DATA).map(([token, sample]) => ({
  token,
  label: token.replace(/[{}]/g, "").toUpperCase(),
  sample,
}));

const CampaignFormPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [senderProfiles, setSenderProfiles] = useState([]);
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("compose");
  const [manualEmailInput, setManualEmailInput] = useState("");

  const [form, setForm] = useState({
    name: "",
    channel: "EMAIL",
    audienceType: "LEADS",
    recipientMode: "ALL",
    recipients: [],
    manualRecipients: [],
    templateId: "",
    senderProfileId: "",
    senderName: "",
    senderEmail: "",
    subject: "Hi {{name}}, your next update from EduPath Pro",
    previewText: "Quick update from the EduPath Pro team",
    message: defaultEmailHtml,
    scheduledAt: new Date(Date.now() + 10 * 60000).toISOString().slice(0, 16),
    batchSize: 30,
    delayBetweenBatches: 10,
  });
  const prefillCampaign = location.state?.prefillCampaign;

  useEffect(() => {
    fetchTemplates();
    fetchSenderProfiles();
  }, []);

  useEffect(() => {
    if (!prefillCampaign) return;
    setForm((prev) => ({
      ...prev,
      ...prefillCampaign,
      recipients: Array.isArray(prefillCampaign.recipients) ? prefillCampaign.recipients : prev.recipients,
      manualRecipients: Array.isArray(prefillCampaign.manualRecipients) ? prefillCampaign.manualRecipients : prev.manualRecipients,
    }));
  }, [prefillCampaign]);

  useEffect(() => {
    fetchAudienceRecords();
  }, [form.audienceType, form.channel]);

  const fetchTemplates = async () => {
    try {
      const res = await API.get("/email/templates");
      setTemplates(res.data?.data || []);
    } catch {
      console.error("Template fetch failed");
    }
  };

  const fetchSenderProfiles = async () => {
    try {
      const res = await API.get("/email/senders");
      const profiles = res.data?.data || [];
      setSenderProfiles(profiles);
      const defaultProfile = profiles.find((profile) => profile.isDefault) || profiles[0];
      if (defaultProfile) {
        setForm((prev) => ({
          ...prev,
          senderProfileId: prev.senderProfileId || defaultProfile._id,
          senderName: prev.senderName || defaultProfile.fromName,
          senderEmail: prev.senderEmail || defaultProfile.fromEmail,
        }));
      }
    } catch {
      console.error("Sender profile fetch failed");
    }
  };

  const fetchAudienceRecords = async () => {
    try {
      if (form.audienceType === "LEADS") {
        const res = await API.get("/leads?limit=100");
        const data = res.data?.data || [];
        setRecords(data.filter((item) => form.channel === "WHATSAPP" ? Boolean(item.phone) : Boolean(item.email)));
      } else {
        const res = await API.get("/inquiries?limit=100");
        const data = res.data?.data || [];
        setRecords(data.filter((item) => form.channel === "WHATSAPP" ? Boolean(item.phone) : Boolean(item.email)));
      }
    } catch {
      setRecords([]);
    }
  };

  const selectedTemplate = useMemo(
    () => templates.find((template) => template._id === form.templateId),
    [templates, form.templateId]
  );

  const selectedSender = useMemo(
    () => senderProfiles.find((profile) => profile._id === form.senderProfileId),
    [senderProfiles, form.senderProfileId]
  );

  const selectedRecords = useMemo(
    () => records.filter((record) => form.recipients.includes(record._id)),
    [records, form.recipients]
  );

  const audienceCount = useMemo(() => {
    if (form.recipientMode === "ALL") return records.length;
    if (form.recipientMode === "SELECTED") return selectedRecords.length;
    return form.manualRecipients.length;
  }, [records.length, selectedRecords.length, form.manualRecipients.length, form.recipientMode]);

  const trackingNeedsPublicUrl = useMemo(
    () => /localhost|127\.0\.0\.1|::1/.test(API_BASE_URL),
    []
  );

  const applyTemplate = (templateId) => {
    const template = templates.find((item) => item._id === templateId);
    setForm((prev) => ({
      ...prev,
      templateId,
      subject: template?.subject || prev.subject,
      previewText: template?.previewText || prev.previewText,
      message: template?.body || prev.message,
    }));
  };

  const handleChannelChange = (channel) => {
    setForm((prev) => ({
      ...prev,
      channel,
      recipientMode: channel === "WHATSAPP" && prev.recipientMode === "MANUAL" ? "ALL" : prev.recipientMode,
      message: channel === "EMAIL"
        ? (prev.channel === "EMAIL" ? prev.message : defaultEmailHtml)
        : (prev.channel === "WHATSAPP" ? prev.message : defaultWhatsappText),
    }));
  };

  const handleSenderChange = (profileId) => {
    const profile = senderProfiles.find((item) => item._id === profileId);
    setForm((prev) => ({
      ...prev,
      senderProfileId: profileId,
      senderName: profile?.fromName || prev.senderName,
      senderEmail: profile?.fromEmail || prev.senderEmail,
    }));
  };

  const toggleRecipient = (recordId) => {
    setForm((prev) => ({
      ...prev,
      recipients: prev.recipients.includes(recordId)
        ? prev.recipients.filter((id) => id !== recordId)
        : [...prev.recipients, recordId],
    }));
  };

  const addManualEmails = () => {
    const emails = manualEmailInput
      .split(/[,\s;\n]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    if (emails.length === 0) return;
    setForm((prev) => ({
      ...prev,
      manualRecipients: [...new Set([...prev.manualRecipients, ...emails])],
    }));
    setManualEmailInput("");
  };

  const removeManualEmail = (email) => {
    setForm((prev) => ({
      ...prev,
      manualRecipients: prev.manualRecipients.filter((item) => item !== email),
    }));
  };

  const insertTokenIntoField = (field, token) => {
    setForm((prev) => ({
      ...prev,
      [field]: `${prev[field] || ""}${token}`,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.message) return toast.error("Complete the required fields.");
    if (form.channel === "EMAIL" && !form.subject) return toast.error("Email campaigns need a subject.");
    if (form.channel === "EMAIL" && !form.senderEmail && !form.senderProfileId) {
      return toast.error("Select or enter a sender email.");
    }
    if (form.recipientMode === "SELECTED" && form.recipients.length === 0) {
      return toast.error("Select at least one recipient.");
    }
    if (form.recipientMode === "MANUAL" && form.manualRecipients.length === 0) {
      return toast.error("Add at least one manual email recipient.");
    }

    setLoading(true);
    try {
      await API.post("/mass-messaging/create", {
        ...form,
        templateId: form.channel === "EMAIL" ? form.templateId || null : null,
        senderProfileId: form.channel === "EMAIL" ? form.senderProfileId || null : null,
        recipients: form.recipientMode === "SELECTED" ? form.recipients : [],
        manualRecipients: form.recipientMode === "MANUAL" ? form.manualRecipients : [],
      });
      toast.success("Campaign scheduled successfully.");
      navigate("..");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to launch campaign.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-12 pb-24 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="flex items-center gap-6">
        <button onClick={() => navigate(-1)} className="p-4 rounded-2xl bg-white text-slate-400 hover:text-slate-600 transition-colors shadow-sm border border-slate-100">
          <FiArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">New Campaign Run</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
            Choose sender email, bulk recipients, and preview delivery before send
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[40px] p-8 lg:p-10 shadow-xl border border-slate-100 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="space-y-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Campaign Name</span>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="April Admissions Push" className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 text-base font-bold text-slate-800 outline-none focus:border-indigo-300 transition-all" />
              </label>
              <label className="space-y-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Schedule</span>
                <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 text-sm font-bold text-slate-700 outline-none" />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Channel</label>
                <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  {["EMAIL", "WHATSAPP"].map((channel) => (
                    <button key={channel} type="button" onClick={() => handleChannelChange(channel)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${form.channel === channel ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-100" : "text-slate-400 hover:text-slate-600"}`}>
                      {channel === "EMAIL" ? <FiMail /> : <FiMessageSquare />}
                      {channel}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Audience</label>
                <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  {["LEADS", "INQUIRIES"].map((audienceType) => (
                    <button key={audienceType} type="button" onClick={() => setForm({ ...form, audienceType, recipients: [] })} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${form.audienceType === audienceType ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-100" : "text-slate-400 hover:text-slate-600"}`}>
                      {audienceType === "LEADS" ? <FiTrendingUp /> : <FiInbox />}
                      {audienceType}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {form.channel === "EMAIL" && (
              <div className="grid grid-cols-1 gap-6">
                {trackingNeedsPublicUrl && (
                  <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                    <p className="font-black uppercase tracking-widest text-[10px]">Tracking Setup Needed</p>
                    <p className="mt-2 font-medium leading-6">
                      Email opens will stay at zero while tracking is using <span className="font-black">localhost</span>. For Gmail and most inboxes, set a public backend URL in server <span className="font-black">TRACKING_BASE_URL</span>, for example your live domain or tunnel ending in <span className="font-black">/api</span>.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="space-y-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Sender Profile</span>
                    <select value={form.senderProfileId} onChange={(e) => handleSenderChange(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 text-sm font-bold text-slate-700 outline-none">
                      <option value="">Use manual sender below</option>
                      {senderProfiles.map((profile) => (
                        <option key={profile._id} value={profile._id}>
                          {profile.label} • {profile.fromEmail}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} placeholder="Sender name" className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 text-sm font-bold text-slate-800 outline-none" />
                    <input value={form.senderEmail} onChange={(e) => setForm({ ...form, senderEmail: e.target.value })} placeholder="sender@company.com" className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 text-sm font-medium text-slate-700 outline-none" />
                  </div>
                </div>

                <label className="space-y-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Saved Template</span>
                  <select value={form.templateId} onChange={(e) => applyTemplate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 text-sm font-bold text-slate-700 outline-none">
                    <option value="">Start from scratch</option>
                    {templates.map((template) => (
                      <option key={template._id} value={template._id}>
                        {template.name} {template.category ? `• ${template.category}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="space-y-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Subject</span>
                    <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Hi {{name}}, here is your update" className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 text-sm font-bold text-slate-800 outline-none" />
                    <div className="flex flex-wrap gap-2">
                      {MERGE_VARIABLES.map((variable) => (
                        <button key={`campaign-subject-${variable.token}`} type="button" onClick={() => insertTokenIntoField("subject", variable.token)} className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                          {variable.label}
                        </button>
                      ))}
                    </div>
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Preview Text</span>
                    <input type="text" value={form.previewText} onChange={(e) => setForm({ ...form, previewText: e.target.value })} placeholder="Short inbox preview..." className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-4 text-sm font-medium text-slate-700 outline-none" />
                    <div className="flex flex-wrap gap-2">
                      {MERGE_VARIABLES.map((variable) => (
                        <button key={`campaign-preview-${variable.token}`} type="button" onClick={() => insertTokenIntoField("previewText", variable.token)} className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                          {variable.label}
                        </button>
                      ))}
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Recipients</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: "ALL", label: "All Audience" },
                  { id: "SELECTED", label: "Select Specific" },
                  ...(form.channel === "EMAIL" ? [{ id: "MANUAL", label: "Manual Emails" }] : []),
                ].map((mode) => (
                  <button key={mode.id} type="button" onClick={() => setForm({ ...form, recipientMode: mode.id, recipients: mode.id === "SELECTED" ? form.recipients : [], manualRecipients: mode.id === "MANUAL" ? form.manualRecipients : form.manualRecipients })} className={`rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${form.recipientMode === mode.id ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                    {mode.label}
                  </button>
                ))}
              </div>

              {form.recipientMode === "MANUAL" && (
                <div className="rounded-[28px] border border-slate-100 bg-slate-50/50 p-5 space-y-4">
                  <div className="flex gap-3">
                    <textarea value={manualEmailInput} onChange={(e) => setManualEmailInput(e.target.value)} rows="3" placeholder="Enter multiple emails separated by comma, space, or new line" className="flex-1 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none resize-none" />
                    <button type="button" onClick={addManualEmails} className="rounded-2xl bg-indigo-600 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white self-start">
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.manualRecipients.map((email) => (
                      <span key={email} className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">
                        {email}
                        <button type="button" onClick={() => removeManualEmail(email)} className="text-rose-500">
                          <FiX size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {form.recipientMode === "SELECTED" && (
                <div className="rounded-[28px] border border-slate-100 bg-white overflow-hidden">
                  <div className="border-b border-slate-100 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Select specific recipients
                  </div>
                  <div className="max-h-72 overflow-auto divide-y divide-slate-50">
                    {records.map((record) => (
                      <label key={record._id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={form.recipients.includes(record._id)} onChange={() => toggleRecipient(record._id)} />
                          <div>
                            <p className="text-sm font-bold text-slate-800">{record.name}</p>
                            <p className="text-xs text-slate-500">{form.channel === "EMAIL" ? record.email : record.phone}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{record.status || record.stage || "Active"}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[32px] border border-slate-100 overflow-hidden">
              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
                {[{ id: "compose", label: form.channel === "EMAIL" ? "Compose Email" : "Compose Message" }, { id: "preview", label: "Preview" }].map((tab) => (
                  <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`rounded-2xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-white hover:text-slate-700"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="p-5 bg-white">
                {activeTab === "compose" ? (
                  form.channel === "EMAIL" ? (
                    <RichTextEmailEditor value={form.message} onChange={(message) => setForm({ ...form, message })} minHeight={360} placeholder="Design your campaign email..." />
                  ) : (
                    <textarea rows="10" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-6 py-5 text-sm font-medium text-slate-700 outline-none resize-none" />
                  )
                ) : (
                  <div className="space-y-4">
                    {form.channel === "EMAIL" && (
                      <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</p>
                        <p className="mt-2 text-lg font-bold text-slate-900">{applySampleMergeData(form.subject) || "No subject yet"}</p>
                        <p className="mt-2 text-sm text-slate-500">{applySampleMergeData(form.previewText) || "No preview text yet"}</p>
                      </div>
                    )}
                    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Recipients Preview</p>
                      <div className="space-y-2 max-h-40 overflow-auto">
                        {form.recipientMode === "ALL" && records.map((record) => (
                          <div key={record._id} className="text-sm text-slate-700">{record.name} • {form.channel === "EMAIL" ? record.email : record.phone}</div>
                        ))}
                        {form.recipientMode === "SELECTED" && selectedRecords.map((record) => (
                          <div key={record._id} className="text-sm text-slate-700">{record.name} • {form.channel === "EMAIL" ? record.email : record.phone}</div>
                        ))}
                        {form.recipientMode === "MANUAL" && form.manualRecipients.map((email) => (
                          <div key={email} className="text-sm text-slate-700">{email}</div>
                        ))}
                      </div>
                    </div>
                    <div className="min-h-[220px] rounded-[28px] border border-slate-100 bg-slate-50 p-8 text-sm leading-7 text-slate-700" dangerouslySetInnerHTML={{ __html: form.channel === "EMAIL" ? applySampleMergeData(form.message) || "<p class='text-slate-300'>No content yet.</p>" : `<p>${applySampleMergeData(form.message || "No content yet.")}</p>` }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-indigo-600 rounded-[40px] p-8 text-white shadow-2xl shadow-indigo-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-white/20"><FiUsers size={24} /></div>
              <div>
                <h3 className="font-bold tracking-tight">Audience Reach</h3>
                <p className="text-[10px] uppercase font-black tracking-widest text-indigo-200">{form.recipientMode}</p>
              </div>
            </div>
            <p className="text-5xl font-black">{audienceCount}</p>
            <p className="text-xs text-indigo-100 font-medium mt-2">Recipients currently selected for this run.</p>
          </div>

          <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 space-y-8">
            <div className="space-y-2">
              <h4 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-2">
                <FiUser className="text-indigo-500" /> Sender
              </h4>
              <p className="text-sm font-bold text-slate-800">{selectedSender?.label || form.senderName || "Manual sender"}</p>
              <p className="text-xs text-slate-400">{selectedSender?.fromEmail || form.senderEmail || "No sender email selected"}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-2">
                <FiSettings className="text-amber-500" /> Delivery Logic
              </h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed italic">Control batching and spacing to keep campaign delivery stable.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch Size</span>
                <input type="number" min="1" value={form.batchSize} onChange={(e) => setForm({ ...form, batchSize: Number(e.target.value) })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-black text-indigo-600" />
              </label>
              <label className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delay (Min)</span>
                <input type="number" min="0" value={form.delayBetweenBatches} onChange={(e) => setForm({ ...form, delayBetweenBatches: Number(e.target.value) })} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-black text-amber-600" />
              </label>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex gap-3 text-amber-800">
              <FiInfo size={28} className="shrink-0 mt-1 opacity-50" />
              <div>
                <p className="font-bold text-[10px] uppercase tracking-widest">Campaign Note</p>
                <p className="text-[11px] font-medium leading-normal mt-1 opacity-80 italic">
                  Manual recipients are available for email campaigns. For sender account setup, use the Email Templates page.
                </p>
              </div>
            </div>

            <button type="submit" disabled={loading || audienceCount === 0} className="w-full bg-indigo-600 text-white font-black py-5 rounded-[24px] uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-3">
              {loading ? "Scheduling..." : "Launch Campaign"}
              {!loading && <FiSend size={16} />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CampaignFormPage;
