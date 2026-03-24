import { useState, useEffect } from "react";
import API from "../services/api";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiMail, FiCode, FiX, FiCheck, FiArrowLeft } from "react-icons/fi";
import { useToast } from "../context/ToastContext";

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
  });

  const toast = useToast();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await API.get("/email/templates");
      setTemplates(res.data?.data || []);
    } catch (err) {
      toast.error("Failed to load templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openForm = (template = null) => {
    if (template) {
      setIsEditing(true);
      setCurrentTemplateId(template._id);
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
      });
    } else {
      setIsEditing(false);
      setCurrentTemplateId(null);
      setFormData({ name: "", subject: "", body: "" });
    }
    setIsEditorOpen(true);
  };

  const closeForm = () => {
    setIsEditorOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await API.patch(`/email/templates/${currentTemplateId}`, formData);
        toast.success("Template updated!");
      } else {
        await API.post("/email/templates", formData);
        toast.success("Template created!");
      }
      setIsEditorOpen(false);
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
    } catch (err) {
      toast.error("Delete failed.");
    }
  };

  const filtered = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  // --- EDITOR VIEW ---
  if (isEditorOpen) {
    return (
      <div className="min-h-screen bg-gray-50/50 -m-6 p-6 animate-in slide-in-from-right duration-500">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Bar */}
          <div className="flex items-center justify-between bg-white px-8 py-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <button 
                onClick={closeForm}
                className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all border border-gray-100"
              >
                <FiArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">
                  {isEditing ? "Edit Template" : "New Email Template"}
                </h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Design your communication</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <button onClick={closeForm} className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 py-2 hover:text-rose-600 transition-all">
                Discard
              </button>
              <button 
                onClick={handleSubmit}
                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
              >
                <FiCheck size={16} /> Save Template
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Internal Title</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 focus:outline-none transition-all text-sm font-bold text-gray-800"
                    placeholder="e.g., Welcome New Customer"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Email Subject</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 focus:outline-none transition-all text-sm font-bold text-gray-800"
                    placeholder="e.g., Hi {{name}}, welcome to Gitakshmi!"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Message Body (HTML Supported)</label>
                    <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tight">Click buttons below to inject merge tags</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["{{name}}", "{{email}}", "{{company}}"].map(v => (
                      <button 
                        key={v}
                        type="button"
                        onClick={() => setFormData({...formData, body: formData.body + v})}
                        className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea 
                  required
                  className="w-full min-h-[400px] px-8 py-8 bg-gray-50 border border-transparent rounded-[2.5rem] focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 focus:outline-none transition-all text-sm font-medium text-gray-800 font-mono leading-relaxed"
                  placeholder="<h1>Hello {{name}},</h1><p>Welcome to our platform. We are thrilled to have you...</p>"
                  value={formData.body}
                  onChange={(e) => setFormData({...formData, body: e.target.value})}
                />
              </div>

              {/* Mobile Actions */}
              <div className="md:hidden pt-6 flex flex-col gap-4">
                <button 
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-widest shadow-xl shadow-indigo-100"
                >
                  Save Template
                </button>
                <button 
                  type="button"
                  onClick={closeForm}
                  className="w-full py-4 bg-gray-100 text-gray-600 text-[11px] font-black rounded-2xl uppercase tracking-widest"
                >
                  Go Back
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Email Templates</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manage your reusable email content & dynamic variables</p>
        </div>
        <button 
          onClick={() => openForm()}
          className="relative z-10 flex items-center gap-3 px-8 py-3.5 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 hover:-translate-y-0.5"
        >
          <FiPlus size={18} /> New Email Template
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-6 border-b border-gray-50 bg-gray-50/20">
          <div className="relative w-full md:w-96 group">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search templates..."
              className="w-full pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all text-sm font-bold text-gray-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 uppercase tracking-widest">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400">Template Title</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400">Preview Subject</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="3" className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Wait buddy, loading templates...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-24 text-center">
                    <div className="max-w-xs mx-auto space-y-4 opacity-50">
                      <FiMail size={40} className="mx-auto text-gray-300" />
                      <p className="text-sm text-gray-400 font-bold">No templates found buddy. Create your first one!</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(t => (
                  <tr key={t._id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">
                          <FiCode size={16} />
                        </div>
                        <span className="text-sm font-black text-gray-900">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm text-gray-500 font-semibold truncate max-w-[300px] block">{t.subject}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openForm(t)} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-white hover:shadow-lg rounded-xl transition-all border border-transparent hover:border-gray-100" title="Edit">
                          <FiEdit2 size={16} />
                        </button>
                        <button onClick={() => deleteTemplate(t._id)} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-white hover:shadow-lg rounded-xl transition-all border border-transparent hover:border-gray-100" title="Delete">
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
