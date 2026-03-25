import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiCheckCircle, FiXCircle, 
  FiExternalLink, FiGlobe, FiLayout, FiChevronLeft, FiLink, FiArrowLeft, FiCopy
} from 'react-icons/fi';

const LandingPageManagement = () => {
  const [pages, setPages] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    slug: '',
    companyId: '',
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pagesRes, companiesRes] = await Promise.all([
        API.get('/test/management/landing'),
        API.get('/super-admin/companies')
      ]);
      setPages(pagesRes.data.data);
      setCompanies(companiesRes.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await API.put(`/test/management/landing/${editId}`, formData);
      } else {
        await API.post('/test/management/landing', formData);
      }
      setIsFormOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving page:", error);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', subtitle: '', description: '', slug: '', companyId: '', isActive: true });
    setEditId(null);
  };

  const handleEdit = (p) => {
    setFormData({
      title: p.title,
      subtitle: p.subtitle,
      description: p.description,
      slug: p.slug,
      companyId: p.companyId?._id || p.companyId,
      isActive: p.isActive
    });
    setEditId(p._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this assessment portal?")) {
      try {
        await API.delete(`/test/management/landing/${id}`);
        fetchData();
      } catch (error) {
        console.error("Error deleting landing page:", error);
      }
    }
  };

  const copyPortalLink = (companyId, slug) => {
    const link = `${window.location.origin}/assessment/${companyId}/${slug}`;
    navigator.clipboard.writeText(link);
    alert("Portal Link Copied!");
  };

  if (isFormOpen) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto py-8">
        <div className="flex items-center gap-6 mb-10">
          <button 
            onClick={() => setIsFormOpen(false)}
            className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#38BDF8] transition-all shadow-sm"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
              <h2 className="text-[24px] font-bold text-slate-800 poppins tracking-tight">{editId ? 'Customize Portal' : 'New Assessment Portal'}</h2>
              <p className="text-slate-400 font-medium text-[14px]">Configure entry points for public assessment funnels.</p>
          </div>
        </div>

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#38BDF8] to-[#818CF8]"></div>
          <form onSubmit={handleSubmit} className="p-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Portal Title</label>
                  <input 
                    type="text" required
                    placeholder="e.g. Free Scholarship Test"
                    className="w-full bg-slate-50/50 border border-transparent rounded-2xl p-4 focus:bg-white focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/5 font-bold text-slate-700 placeholder:text-slate-300 transition-all outline-none"
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Hero Subtitle</label>
                    <input 
                      type="text"
                      placeholder="e.g. Join the elite 1%."
                      className="w-full bg-slate-50/50 border border-transparent rounded-2xl p-4 focus:bg-white focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/5 font-bold text-slate-700 placeholder:text-slate-300 transition-all outline-none"
                      value={formData.subtitle} 
                      onChange={e => setFormData({...formData, subtitle: e.target.value})}
                    />
                </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Description</label>
              <textarea 
                className="w-full bg-slate-50/50 border border-transparent rounded-2xl p-4 focus:bg-white focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/5 font-medium text-slate-600 placeholder:text-slate-300 transition-all outline-none" rows="3"
                placeholder="Brief description for applicants..."
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Assigned Company</label>
                <select 
                  required className="w-full bg-slate-50/50 border border-transparent rounded-2xl p-4 focus:bg-white focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/5 font-bold text-slate-700 appearance-none cursor-pointer outline-none"
                  value={formData.companyId} 
                  onChange={e => setFormData({...formData, companyId: e.target.value})}
                >
                  <option value="">Select Company</option>
                  {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">URL Extension (Slug)</label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[12px] font-black tracking-tight pointer-events-none italic">.../assessment/</div>
                   <input 
                      type="text" required
                      className="w-full bg-slate-50/50 border border-transparent rounded-2xl p-4 pl-36 focus:bg-white focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/5 font-bold text-slate-800 transition-all outline-none"
                      value={formData.slug} 
                      onChange={e => setFormData({...formData, slug: e.target.value.replace(/\s+/g, '-').toLowerCase()})}
                   />
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 p-6 rounded-3xl flex items-center gap-4 hover:border-slate-100 transition-all border border-transparent">
               <input 
                 type="checkbox" 
                 id="isActive"
                 className="w-5 h-5 rounded-lg border-slate-300 text-[#38BDF8] focus:ring-[#38BDF8]"
                 checked={formData.isActive}
                 onChange={e => setFormData({...formData, isActive: e.target.checked})}
               />
               <label htmlFor="isActive" className="text-[14px] text-slate-600 font-bold cursor-pointer select-none">Make portal active and visible to public</label>
            </div>

            <div className="flex items-center gap-4 pt-6">
               <button type="submit" className="btn-saas-primary px-10 h-[52px]">
                  {editId ? 'Update Portal' : 'Launch Portal'}
               </button>
               <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)} 
                  className="px-10 h-[52px] rounded-2xl border border-slate-200 text-slate-400 font-bold hover:bg-slate-50 hover:text-slate-600 transition-all"
                >
                  Discard Changes
                </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-10 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold text-slate-800 poppins tracking-tight">Assessment Portals</h1>
          <p className="text-[14px] text-slate-400 font-medium font-medium">Manage high-conversion landing pages for public test funnels.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="btn-saas-primary h-[48px] px-8"
        >
          <FiPlus size={20} /> Design Portal
        </button>
      </div>

      <div className="flex items-center gap-4 max-w-md">
          <div className="relative group w-full">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#38BDF8] transition-colors" />
            <input 
               placeholder="Search portals..."
               className="w-full h-[48px] bg-white border border-slate-100 rounded-2xl pl-12 pr-6 text-[14px] font-medium focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/5 transition-all outline-none shadow-sm"
            />
          </div>
      </div>

      {loading ? (
        <div className="h-[400px] bg-white rounded-[32px] border border-slate-100 flex flex-col items-center justify-center space-y-4">
           <div className="w-10 h-10 border-4 border-slate-50 border-t-[#38BDF8] rounded-full animate-spin"></div>
           <p className="text-slate-300 text-[11px] font-black uppercase tracking-widest">Syncing portals...</p>
        </div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-[40px] border border-slate-100 py-24 text-center shadow-sm flex flex-col items-center">
            <div className="w-24 h-24 bg-cyan-50 rounded-full flex items-center justify-center mb-10 text-[#38BDF8] shadow-sm">
                <FiGlobe size={48} />
            </div>
            <h3 className="text-[22px] font-bold text-slate-800 mb-2 poppins">No Active Portals</h3>
            <p className="text-slate-400 text-[14px] max-w-xs mx-auto mb-10 font-medium">Create your first public-facing assessment funnel to start generating leads.</p>
            <button 
                onClick={() => setIsFormOpen(true)}
                className="btn-saas-primary h-[56px] px-12"
            >
                Start Designing
            </button>
        </div>
      ) : (
        <div className="saas-table-container">
          <table className="saas-table">
            <thead>
              <tr>
                <th className="saas-th">Assessment Portal</th>
                <th className="saas-th">Linked Brand</th>
                <th className="saas-th">Slug / Link</th>
                <th className="saas-th">Status</th>
                <th className="saas-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map(page => (
                <tr key={page._id} className="saas-tr group">
                  <td className="saas-td">
                    <div className="font-bold text-slate-800 text-[15px] group-hover:text-[#38BDF8] transition-colors poppins">{page.title}</div>
                    <div className="text-[12px] text-slate-400 font-medium truncate max-w-[250px] mt-0.5">{page.subtitle || "Assessment funnel"}</div>
                  </td>
                  <td className="saas-td">
                    <span className="text-[12px] font-black text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 uppercase tracking-tighter">
                      {page.companyId?.name || "Global"}
                    </span>
                  </td>
                  <td className="saas-td">
                    <div className="flex items-center gap-3">
                       <span className="text-[12px] font-mono text-slate-400 bg-slate-50/50 px-3 py-1.5 rounded-lg border border-slate-50 group-hover:bg-cyan-50 group-hover:border-cyan-100 transition-colors tracking-tight">/{page.slug}</span>
                       <button 
                          onClick={() => copyPortalLink(page.companyId?._id || page.companyId, page.slug)}
                          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-[#38BDF8] transition-all bg-white rounded-lg shadow-sm border border-slate-100"
                          title="Copy Link"
                       >
                          <FiCopy size={14} />
                       </button>
                    </div>
                  </td>
                  <td className="saas-td">
                    <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all ${page.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      {page.isActive ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td className="saas-td text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <a 
                          href={`${window.location.origin}/assessment/${page.companyId?._id || page.companyId}/${page.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-[#38BDF8] hover:bg-cyan-50 rounded-xl transition-all border border-transparent hover:border-cyan-100"
                          title="Open Live"
                      >
                          <FiExternalLink size={18} />
                      </a>
                      <button 
                        onClick={() => handleEdit(page)} 
                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-[#38BDF8] hover:bg-cyan-50 rounded-xl transition-all border border-transparent hover:border-cyan-100"
                        title="Edit"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(page._id)} 
                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                        title="Delete"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

};

export default LandingPageManagement;
