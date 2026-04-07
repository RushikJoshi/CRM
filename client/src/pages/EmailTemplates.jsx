import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import {
  FiArrowLeft,
  FiCheck,
  FiCopy,
  FiEdit2,
  FiEye,
  FiFileText,
  FiMail,
  FiPlus,
  FiSearch,
  FiServer,
  FiTag,
  FiTrash2,
  FiType,
} from "react-icons/fi";
import { useToast } from "../context/ToastContext";
import RichTextEmailEditor from "../components/RichTextEmailEditor";
import { applySampleMergeData, SAMPLE_MERGE_DATA } from "../utils/mergePreview";

const EMPTY_FORM = {
  name: "",
  subject: "",
  category: "General",
  previewText: "",
  body: "",
  design: "RICH_TEXT",
};

const MERGE_VARIABLES = Object.entries(SAMPLE_MERGE_DATA).map(([token, sample]) => ({
  token,
  label: token.replace(/[{}]/g, "").toUpperCase(),
  sample,
}));

export default function EmailTemplates() {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState(null);
  const [activeTab, setActiveTab] = useState("editor");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [senderProfiles, setSenderProfiles] = useState([]);
  const [senderForm, setSenderForm] = useState({
    label: "",
    fromName: "",
    fromEmail: "",
    replyTo: "",
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "",
    smtpPass: "",
    isDefault: false,
  });
  const [editingSenderId, setEditingSenderId] = useState(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await API.get("/email/templates");
      setTemplates(res.data?.data || []);
    } catch {
      toast.error("Failed to load templates.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSenderProfiles = async () => {
    try {
      const res = await API.get("/email/senders");
      setSenderProfiles(res.data?.data || []);
    } catch {
      toast.error("Failed to load sender profiles.");
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchSenderProfiles();
  }, []);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return templates.filter((template) =>
      [template.name, template.subject, template.category, template.previewText]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [templates, search]);

  const openForm = (template = null) => {
    if (template) {
      setIsEditing(true);
      setCurrentTemplateId(template._id);
      setFormData({
        name: template.name || "",
        subject: template.subject || "",
        category: template.category || "General",
        previewText: template.previewText || "",
        body: template.body || "",
        design: template.design || "RICH_TEXT",
      });
    } else {
      setIsEditing(false);
      setCurrentTemplateId(null);
      setFormData(EMPTY_FORM);
    }
    setActiveTab("editor");
    setIsEditorOpen(true);
  };

  const closeForm = () => {
    setIsEditorOpen(false);
    setCurrentTemplateId(null);
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    try {
      if (isEditing) {
        await API.patch(`/email/templates/${currentTemplateId}`, formData);
        toast.success("Template updated!");
      } else {
        await API.post("/email/templates", formData);
        toast.success("Template created!");
      }
      closeForm();
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save template.");
    }
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      await API.delete(`/email/templates/${id}`);
      toast.success("Template deleted.");
      fetchTemplates();
    } catch {
      toast.error("Delete failed.");
    }
  };

  const duplicateTemplate = async (template) => {
    try {
      await API.post("/email/templates", {
        ...template,
        name: `${template.name} Copy`,
      });
      toast.success("Template duplicated.");
      fetchTemplates();
    } catch {
      toast.error("Failed to duplicate template.");
    }
  };

  const saveSenderProfile = async (e) => {
    e?.preventDefault?.();
    try {
      if (editingSenderId) {
        await API.patch(`/email/senders/${editingSenderId}`, senderForm);
        toast.success("Sender profile updated.");
      } else {
        await API.post("/email/senders", senderForm);
        toast.success("Sender profile created.");
      }
      setSenderForm({
        label: "",
        fromName: "",
        fromEmail: "",
        replyTo: "",
        smtpHost: "",
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: "",
        smtpPass: "",
        isDefault: false,
      });
      setEditingSenderId(null);
      fetchSenderProfiles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save sender profile.");
    }
  };

  const editSender = (profile) => {
    setEditingSenderId(profile._id);
    setSenderForm({
      label: profile.label || "",
      fromName: profile.fromName || "",
      fromEmail: profile.fromEmail || "",
      replyTo: profile.replyTo || "",
      smtpHost: profile.smtpHost || "",
      smtpPort: profile.smtpPort || 587,
      smtpSecure: profile.smtpSecure || false,
      smtpUser: profile.smtpUser || "",
      smtpPass: profile.smtpPass || "",
      isDefault: profile.isDefault || false,
    });
  };

  const insertTokenIntoField = (field, token) => {
    setFormData((prev) => ({
      ...prev,
      [field]: `${prev[field] || ""}${token}`,
    }));
  };

  const deleteSender = async (id) => {
    if (!window.confirm("Delete this sender profile?")) return;
    try {
      await API.delete(`/email/senders/${id}`);
      toast.success("Sender profile deleted.");
      fetchSenderProfiles();
    } catch {
      toast.error("Failed to delete sender profile.");
    }
  };

  if (isEditorOpen) {
    return (
      <div className="min-h-screen -m-6 bg-slate-50/70 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 rounded-[32px] border border-slate-100 bg-white px-8 py-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={closeForm}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-500 transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              >
                <FiArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  {isEditing ? "Edit Email Template" : "Create Email Template"}
                </h1>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Rich editor + preview + reusable merge variables
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 transition-all hover:text-rose-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700"
              >
                <FiCheck size={16} />
                Save Template
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-7 space-y-6">
              <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Template Name</span>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Admissions Nurture"
                      className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-800 outline-none transition-all focus:border-indigo-200 focus:bg-white"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</span>
                    <input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Promotions"
                      className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-800 outline-none transition-all focus:border-indigo-200 focus:bg-white"
                    />
                  </label>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6">
                  <label className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Subject</span>
                    <input
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Hi {{name}}, your next step is ready"
                      className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-800 outline-none transition-all focus:border-indigo-200 focus:bg-white"
                    />
                    <div className="flex flex-wrap gap-2">
                      {MERGE_VARIABLES.map((variable) => (
                        <button
                          key={`subject-${variable.token}`}
                          type="button"
                          onClick={() => insertTokenIntoField("subject", variable.token)}
                          className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600"
                        >
                          {variable.label}
                        </button>
                      ))}
                    </div>
                  </label>
                  <label className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preview Text</span>
                    <input
                      value={formData.previewText}
                      onChange={(e) => setFormData({ ...formData, previewText: e.target.value })}
                      placeholder="Short inbox preview shown beside the subject"
                      className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-200 focus:bg-white"
                    />
                    <div className="flex flex-wrap gap-2">
                      {MERGE_VARIABLES.map((variable) => (
                        <button
                          key={`preview-${variable.token}`}
                          type="button"
                          onClick={() => insertTokenIntoField("previewText", variable.token)}
                          className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600"
                        >
                          {variable.label}
                        </button>
                      ))}
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-100 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
                  {[
                    { id: "editor", label: "Editor", icon: FiType },
                    { id: "preview", label: "Preview", icon: FiEye },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${
                          activeTab === tab.id
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                            : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                        }`}
                      >
                        <Icon size={14} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="p-6">
                  {activeTab === "editor" ? (
                    <RichTextEmailEditor
                      value={formData.body}
                      onChange={(body) => setFormData({ ...formData, body })}
                      minHeight={360}
                      placeholder="Build your email like a wordpad-style editor..."
                    />
                  ) : (
                    <div className="rounded-[28px] border border-slate-100 bg-slate-50 p-6">
                      <div className="mb-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Subject</p>
                        <p className="mt-2 text-lg font-bold text-slate-900">{applySampleMergeData(formData.subject) || "No subject yet"}</p>
                        <p className="mt-2 text-sm text-slate-500">{applySampleMergeData(formData.previewText) || "No preview text yet"}</p>
                      </div>
                      <div
                        className="min-h-[320px] rounded-[28px] border border-slate-100 bg-white p-8 text-sm leading-7 text-slate-700 shadow-sm"
                        dangerouslySetInnerHTML={{ __html: applySampleMergeData(formData.body) || "<p class='text-slate-300'>Start writing to preview your email.</p>" }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="xl:col-span-5 space-y-6">
              <div className="rounded-[32px] border border-slate-100 bg-indigo-600 p-8 text-white shadow-2xl shadow-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/20 p-3">
                    <FiMail size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">Template Studio</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
                      Built for reusable campaigns
                    </p>
                  </div>
                </div>
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Merge Variables</p>
                    <p className="mt-2 text-2xl font-black">5</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Editor Type</p>
                    <p className="mt-2 text-2xl font-black">Rich</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
                <h3 className="text-sm font-black tracking-tight text-slate-900">Best Use</h3>
                <div className="mt-5 space-y-4">
                  {[
                    "Admissions offers and promotional campaigns",
                    "Follow-up sequences with merge variables",
                    "Polished HTML emails without manual coding",
                    "Reusable content blocks for your campaign team",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Sender Accounts</h2>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Add the sender email IDs and SMTP accounts used for campaigns
            </p>
          </div>
          <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
            <FiServer size={20} />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <form onSubmit={saveSenderProfile} className="xl:col-span-5 space-y-4 rounded-[28px] border border-slate-100 bg-slate-50/50 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input value={senderForm.label} onChange={(e) => setSenderForm({ ...senderForm, label: e.target.value })} placeholder="Profile label" className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none" />
              <input value={senderForm.fromName} onChange={(e) => setSenderForm({ ...senderForm, fromName: e.target.value })} placeholder="From name" className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input value={senderForm.fromEmail} onChange={(e) => setSenderForm({ ...senderForm, fromEmail: e.target.value })} placeholder="From email" className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none" />
              <input value={senderForm.replyTo} onChange={(e) => setSenderForm({ ...senderForm, replyTo: e.target.value })} placeholder="Reply-to email" className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input value={senderForm.smtpHost} onChange={(e) => setSenderForm({ ...senderForm, smtpHost: e.target.value })} placeholder="SMTP host" className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none" />
              <input type="number" value={senderForm.smtpPort} onChange={(e) => setSenderForm({ ...senderForm, smtpPort: Number(e.target.value) })} placeholder="SMTP port" className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input value={senderForm.smtpUser} onChange={(e) => setSenderForm({ ...senderForm, smtpUser: e.target.value })} placeholder="SMTP username" className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none" />
              <input type="password" value={senderForm.smtpPass} onChange={(e) => setSenderForm({ ...senderForm, smtpPass: e.target.value })} placeholder="SMTP password / app password" className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none" />
            </div>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-600">
              <input type="checkbox" checked={senderForm.smtpSecure} onChange={(e) => setSenderForm({ ...senderForm, smtpSecure: e.target.checked })} />
              Use secure SMTP
            </label>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-600">
              <input type="checkbox" checked={senderForm.isDefault} onChange={(e) => setSenderForm({ ...senderForm, isDefault: e.target.checked })} />
              Make this the default sender
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="rounded-2xl bg-indigo-600 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white">
                {editingSenderId ? "Update Sender" : "Save Sender"}
              </button>
              {editingSenderId && (
                <button type="button" onClick={() => { setEditingSenderId(null); setSenderForm({ label: "", fromName: "", fromEmail: "", replyTo: "", smtpHost: "", smtpPort: 587, smtpSecure: false, smtpUser: "", smtpPass: "", isDefault: false }); }} className="rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="xl:col-span-7 rounded-[28px] border border-slate-100 bg-white overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
              Available Sender Profiles
            </div>
            <div className="divide-y divide-slate-50">
              {senderProfiles.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm font-bold text-slate-400">
                  Add your sender email ID here first.
                </div>
              ) : senderProfiles.map((profile) => (
                <div key={profile._id} className="flex items-center justify-between gap-4 px-6 py-5">
                  <div>
                    <p className="text-sm font-black text-slate-900">{profile.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{profile.fromName} • {profile.fromEmail}</p>
                    <p className="mt-1 text-xs text-slate-400">{profile.smtpHost}:{profile.smtpPort} {profile.isDefault ? "• Default" : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editSender(profile)} className="rounded-2xl px-4 py-2 text-[11px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">Edit</button>
                    <button onClick={() => deleteSender(profile._id)} className="rounded-2xl px-4 py-2 text-[11px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Email Templates</h1>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Full rich editor templates for mass messaging and one-to-one mail
          </p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-3 rounded-2xl bg-indigo-600 px-8 py-3.5 text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700"
        >
          <FiPlus size={18} />
          New Template
        </button>
      </div>

      <div className="rounded-[32px] border border-slate-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/40 p-6">
          <div className="relative w-full md:w-96">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-100 bg-white py-3 pl-12 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Template</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Subject</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center text-sm font-bold text-slate-400">
                    Loading templates...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <FiFileText size={40} className="mx-auto mb-4 text-slate-200" />
                    <p className="text-sm font-bold text-slate-500">No templates found yet.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((template) => (
                  <tr key={template._id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                          <FiMail size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{template.name}</p>
                          <p className="mt-1 text-xs text-slate-400">{template.previewText || "No preview text"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
                        <FiTag size={12} />
                        {template.category || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-semibold text-slate-600">{template.subject}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => duplicateTemplate(template)}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                          title="Duplicate"
                        >
                          <FiCopy size={16} />
                        </button>
                        <button
                          onClick={() => openForm(template)}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600"
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template._id)}
                          className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
