import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiCheckCircle, FiXCircle, 
  FiExternalLink, FiGlobe, FiLayout, FiChevronLeft 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

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
    if (window.confirm("Delete this landing portal?")) {
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

  return (
    <div className="p-6 max-w-7xl mx-auto font-inter">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Public Portals</h1>
          <p className="text-slate-500 mt-1 font-medium">Design custom landing pages for company-specific test funnels.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-300"
          >
            <FiPlus size={20} /> Design Portal
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isFormOpen ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[3rem] shadow-2xl border border-slate-50 overflow-hidden mb-12"
          >
            <div className="p-10 pb-4 flex justify-between items-center relative overflow-hidden bg-slate-50/30">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-indigo-500"></div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all font-bold"
                >
                  <FiChevronLeft size={20} />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-slate-900">{editId ? 'Customize Portal' : 'New Assessment Portal'}</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Configure entry points for lead generation.</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Portal Title</label>
                  <input 
                    type="text" required
                    placeholder="e.g. Free Scholarship Test 2026"
                    className="w-full bg-slate-50 border-0 rounded-2xl p-5 focus:ring-4 focus:ring-indigo-100 font-bold text-slate-800 placeholder:text-slate-300 transition-all"
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Hero Subtitle</label>
                    <input 
                      type="text"
                      placeholder="e.g. Join the elite 1% of digital creators."
                      className="w-full bg-slate-50 border-0 rounded-2xl p-5 focus:ring-4 focus:ring-indigo-100 font-bold text-slate-800 placeholder:text-slate-300 transition-all"
                      value={formData.subtitle} 
                      onChange={e => setFormData({...formData, subtitle: e.target.value})}
                    />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Description</label>
                  <textarea 
                    className="w-full bg-slate-50 border-0 rounded-3xl p-6 focus:ring-4 focus:ring-indigo-100 font-medium text-slate-600 placeholder:text-slate-300 transition-all" rows="5"
                    placeholder="Provide context for the student..."
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Assign to Brand (Company)</label>
                  <select 
                    required className="w-full bg-slate-50 border-0 rounded-2xl p-5 focus:ring-4 focus:ring-indigo-100 font-bold text-slate-800 appearance-none cursor-pointer"
                    value={formData.companyId} 
                    onChange={e => setFormData({...formData, companyId: e.target.value})}
                  >
                    <option value="">Select Company</option>
                    {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">URL Extension (Slug)</label>
                  <div className="relative">
                     <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-mono text-xs">/assessment/:id/</span>
                     <input 
                        type="text" required
                        placeholder="my-cool-link"
                        className="w-full bg-slate-50 border-0 rounded-2xl p-5 pl-32 focus:ring-4 focus:ring-indigo-100 font-bold text-slate-800 transition-all font-mono lowercase"
                        value={formData.slug} 
                        onChange={e => setFormData({...formData, slug: e.target.value.replace(/\s+/g, '-').toLowerCase()})}
                     />
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] flex items-center justify-between border border-slate-100">
                   <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setFormData({...formData, isActive: !formData.isActive})}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${formData.isActive ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white border-slate-200'}`}>
                        {formData.isActive && <FiCheckCircle className="text-white" size={18} />}
                      </div>
                      <div>
                        <span className="block text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors">Portal Visibility</span>
                        <span className="block text-[10px] font-bold text-slate-400">If active, this link will be publically accessible.</span>
                      </div>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)} 
                    className="flex-1 py-5 rounded-2xl bg-white border-2 border-slate-100 text-slate-400 font-black hover:bg-slate-50 transition-all hover:text-slate-600"
                  >
                    Discard Changes
                  </button>
                  <button 
                    type="submit" 
                    className="flex-2 py-5 rounded-2xl bg-slate-900 text-white font-black shadow-xl shadow-slate-200 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all text-lg"
                  >
                    {editId ? 'Update Portal' : 'Launch Portal'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                 <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-slate-400 font-black tracking-widest text-[10px] uppercase animate-pulse">Syncing Cloud Portals...</p>
              </div>
            ) : pages.length === 0 ? (
              <div className="bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100 p-24 text-center">
                  <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner shadow-indigo-100">
                      <FiGlobe size={48} className="text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Digital Portals Status: Offline</h3>
                  <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium">Create your first public-facing assessment funnel to start generating leads.</p>
                  <button 
                      onClick={() => setIsFormOpen(true)}
                      className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-105 transition-all active:scale-95"
                  >
                      Design New Portal
                  </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pages.map(page => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={page._id} 
                    className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 p-8 flex flex-col group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-10 relative z-10">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 ${page.isActive ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-slate-100 text-slate-400 shadow-slate-100'}`}>
                        <FiLayout size={28} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(page)} className="p-3 bg-white border border-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all shadow-sm"><FiEdit2 size={20} /></button>
                        <button onClick={() => handleDelete(page._id)} className="p-3 bg-white border border-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm"><FiTrash2 size={20} /></button>
                      </div>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-tight">{page.title}</h3>
                    <p className="text-slate-500 text-sm font-medium mb-10 line-clamp-3 leading-relaxed">{page.subtitle || page.description || "Digital acquisition portal."}</p>
                    
                    <div className="mt-auto pt-8 border-t border-slate-50 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Linked Ecosystem</span>
                            <span className="text-xs font-black text-slate-800">{page.companyId?.name || "Global"}</span>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => copyPortalLink(page.companyId?._id || page.companyId, page.slug)}
                                className="flex-1 bg-slate-900 text-white py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg"
                            >
                                <FiExternalLink /> Copy URL
                            </button>
                            <a 
                                href={`${window.location.origin}/assessment/${page.companyId?._id || page.companyId}/${page.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-14 bg-slate-50 text-slate-400 flex items-center justify-center rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100"
                                title="Open Portal"
                            >
                                <FiGlobe size={24} />
                            </a>
                        </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPageManagement;
