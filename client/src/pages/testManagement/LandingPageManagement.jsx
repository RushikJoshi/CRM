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
      <div className="animate-fade-in max-w-4xl mx-auto py-4">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setIsFormOpen(false)}
            className="btn-saas-secondary w-10 h-10 p-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
              <h2 className="text-[20px] font-semibold text-slate-900 poppins">{editId ? 'Customize Portal' : 'New Assessment Portal'}</h2>
              <p className="text-slate-500 text-sm">Configure entry points for public assessment funnels.</p>
          </div>
        </div>

        <div className="saas-card p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Portal Title</label>
                  <input 
                    type="text" required
                    placeholder="e.g. Free Scholarship Test"
                    className="w-full h-11 bg-white border border-slate-200 rounded-md px-4 text-sm focus:border-indigo-500 transition-all outline-none"
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Hero Subtitle</label>
                    <input 
                      type="text"
                      placeholder="e.g. Join the elite 1%."
                      className="w-full h-11 bg-white border border-slate-200 rounded-md px-4 text-sm focus:border-indigo-500 transition-all outline-none"
                      value={formData.subtitle} 
                      onChange={e => setFormData({...formData, subtitle: e.target.value})}
                    />
                </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
              <textarea 
                className="w-full bg-white border border-slate-200 rounded-md p-4 text-sm focus:border-indigo-500 transition-all outline-none" rows="3"
                placeholder="Brief description for applicants..."
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Assigned Company</label>
                <select 
                  required className="w-full h-11 bg-white border border-slate-200 rounded-md px-3 text-sm focus:border-indigo-500 transition-all outline-none"
                  value={formData.companyId} 
                  onChange={e => setFormData({...formData, companyId: e.target.value})}
                >
                  <option value="">Select Company</option>
                  {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">URL Extension (Slug)</label>
                <div className="relative">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-mono pointer-events-none">.../assessment/</div>
                   <input 
                      type="text" required
                      className="w-full h-11 bg-white border border-slate-200 rounded-md px-4 pl-28 text-sm focus:border-indigo-500 transition-all outline-none font-mono"
                      value={formData.slug} 
                      onChange={e => setFormData({...formData, slug: e.target.value.replace(/\s+/g, '-').toLowerCase()})}
                   />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 py-2">
               <input 
                 type="checkbox" 
                 id="isActive"
                 className="w-4 h-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
                 checked={formData.isActive}
                 onChange={e => setFormData({...formData, isActive: e.target.checked})}
               />
               <label htmlFor="isActive" className="text-sm text-slate-700 font-medium cursor-pointer select-none">Make portal active and visible</label>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
               <button type="submit" className="btn-saas-primary px-8 h-11">
                  {editId ? 'Update Portal' : 'Launch Portal'}
               </button>
               <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)} 
                  className="btn-saas-secondary px-8 h-11"
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
    <div className="animate-fade-in space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 poppins">Assessment Portals</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Manage high-conversion landing pages for public test funnels.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="btn-saas-primary h-9 px-5"
        >
          <FiPlus size={16} /> Design Portal
        </button>
      </div>

      <div className="flex items-center gap-3">
          <div className="relative group w-full max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
               placeholder="Search portals..."
               className="w-full h-10 bg-white border border-slate-200 rounded-md pl-9 pr-4 text-sm focus:border-indigo-500 transition-all outline-none"
            />
          </div>
      </div>

      {loading ? (
        <div className="h-[400px] saas-table-container flex flex-col items-center justify-center space-y-4">
           <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-slate-400 text-[12px] font-medium">Syncing portals...</p>
        </div>
      ) : pages.length === 0 ? (
        <div className="saas-card py-20 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <FiGlobe size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No Active Portals</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8 font-medium">Create your first public-facing assessment funnel to start generating leads.</p>
            <button 
                onClick={() => setIsFormOpen(true)}
                className="btn-saas-primary px-10 h-11"
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
                    <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{page.title}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[250px]">{page.subtitle || "Assessment funnel"}</div>
                  </td>
                  <td className="saas-td">
                    <span className="text-[13px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      {page.companyId?.name || "Global"}
                    </span>
                  </td>
                  <td className="saas-td">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">/{page.slug}</span>
                       <button 
                          onClick={() => copyPortalLink(page.companyId?._id || page.companyId, page.slug)}
                          className="p-1 text-slate-300 hover:text-indigo-600 transition-colors"
                          title="Copy Link"
                       >
                          <FiCopy size={12} />
                       </button>
                    </div>
                  </td>
                  <td className="saas-td">
                    <span className={`badge-saas ${page.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                      {page.isActive ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td className="saas-td text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                          href={`${window.location.origin}/assessment/${page.companyId?._id || page.companyId}/${page.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-all"
                          title="Open Live"
                      >
                          <FiExternalLink size={15} />
                      </a>
                      <button 
                        onClick={() => handleEdit(page)} 
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-all"
                        title="Edit"
                      >
                        <FiEdit2 size={15} />
                      </button>
                      <button 
                        onClick={() => handleDelete(page._id)} 
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                        title="Delete"
                      >
                        <FiTrash2 size={15} />
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
