import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { 
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiCheckCircle, FiXCircle, 
  FiClock, FiAward, FiBookOpen, FiExternalLink, FiMoreVertical, FiChevronLeft 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    companyId: '',
    duration: 25,
    showResult: true,
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, companiesRes] = await Promise.all([
        API.get('/test/management/courses'),
        API.get('/super-admin/companies')
      ]);
      setCourses(coursesRes.data.data);
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
        await API.put(`/test/management/courses/${editId}`, formData);
      } else {
        await API.post('/test/management/courses', formData);
      }
      setIsFormOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving course:", error);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', companyId: '', duration: 25, showResult: true, isActive: true });
    setEditId(null);
  };

  const handleEdit = (course) => {
    setFormData({
      title: course.title,
      description: course.description,
      companyId: course.companyId?._id || course.companyId,
      duration: course.duration,
      showResult: course.showResult,
      isActive: course.isActive
    });
    setEditId(course._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure? This will delete all questions under this course!")) {
      try {
        await API.delete(`/test/management/courses/${id}`);
        fetchData();
      } catch (error) {
        console.error("Error deleting course:", error);
      }
    }
  };

  const copyPublicLink = (companyId) => {
    const link = `${window.location.origin}/test/${companyId}`;
    navigator.clipboard.writeText(link);
    alert("Public Link Copied to Clipboard!");
  };

  return (
    <div className="animate-fade-in space-y-10 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold text-slate-800 poppins tracking-tight">Test & Lead Management</h1>
          <p className="text-[14px] text-slate-400 font-medium">Design automated tests and capture student leads directly into CRM.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="btn-saas-primary gap-2 h-[48px] px-8"
          >
            <FiPlus size={20} /> Create New Course
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isFormOpen ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="p-8 pb-4 flex justify-between items-center relative overflow-hidden bg-slate-50/30">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#38BDF8] to-[#818CF8]"></div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#38BDF8] transition-all"
                >
                  <FiChevronLeft size={20} />
                </button>
                <div>
                    <h2 className="text-[20px] font-bold text-slate-800 poppins">{editId ? 'Modify Course' : 'Create New Course'}</h2>
                    <p className="text-[12px] text-slate-400 font-medium">Define assessment parameters and company assignment.</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 ml-1">Course Title</label>
                  <input 
                    type="text" required
                    placeholder="e.g. Advanced Digital Marketing"
                    className="w-full bg-slate-50/50 border border-transparent rounded-2xl p-4 focus:bg-white focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/5 font-bold text-slate-700 placeholder:text-slate-300 transition-all outline-none"
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 ml-1">Description</label>
                  <textarea 
                    className="w-full bg-slate-50/50 border border-transparent rounded-2xl p-4 focus:bg-white focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/5 font-medium text-slate-600 placeholder:text-slate-300 transition-all outline-none" rows="4"
                    placeholder="Briefly describe what this test covers..."
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 ml-1">Assign to Company</label>
                  <select 
                    required className="w-full bg-slate-50/50 border border-transparent rounded-2xl p-4 focus:bg-white focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/5 font-bold text-slate-700 appearance-none cursor-pointer outline-none"
                    value={formData.companyId} 
                    onChange={e => setFormData({...formData, companyId: e.target.value})}
                  >
                    <option value="">Select Company</option>
                    {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                   <div>
                     <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 ml-1">Duration (Min)</label>
                     <div className="relative">
                        <input 
                            type="number" required
                            className="w-full bg-slate-50/50 border border-transparent rounded-2xl p-4 pr-12 focus:bg-white focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/5 font-bold text-slate-700 transition-all outline-none"
                            value={formData.duration} 
                            onChange={e => setFormData({...formData, duration: e.target.value})}
                        />
                        <FiClock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                     </div>
                   </div>
                   <div className="flex flex-col justify-end pb-1">
                      <div 
                        onClick={() => setFormData({...formData, showResult: !formData.showResult})}
                        className="flex items-center gap-3 cursor-pointer group bg-slate-50/50 p-4 rounded-2xl hover:bg-slate-50 transition-all"
                      >
                         <div className={`w-10 h-5 rounded-full p-1 transition-all duration-300 ${formData.showResult ? 'bg-[#38BDF8]' : 'bg-slate-200'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-300 ${formData.showResult ? 'translate-x-5' : 'translate-x-0'}`}></div>
                         </div>
                         <span className="text-[12px] font-bold text-slate-600 group-hover:text-[#38BDF8] transition-colors">Show Results?</span>
                      </div>
                   </div>
                </div>
                
                <div className="bg-slate-50/50 p-5 rounded-2xl flex items-center justify-between border border-transparent hover:border-slate-100 transition-all">
                   <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setFormData({...formData, isActive: !formData.isActive})}>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${formData.isActive ? 'bg-[#38BDF8] border-[#38BDF8]' : 'bg-white border-slate-200'}`}>
                        {formData.isActive && <FiCheckCircle className="text-white" size={14} />}
                      </div>
                      <label className="text-[13px] font-bold text-slate-600 cursor-pointer group-hover:text-[#38BDF8] transition-colors">Is Course Active?</label>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)} 
                    className="flex-1 h-[52px] rounded-2xl border border-slate-200 text-slate-400 font-bold hover:bg-slate-50 hover:text-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 h-[52px] rounded-2xl bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-white font-bold shadow-lg shadow-cyan-400/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {editId ? 'Update Course' : 'Launch Course'}
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
                 <div className="w-12 h-12 border-4 border-slate-100 border-t-[#38BDF8] rounded-full animate-spin"></div>
                 <p className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">Fetching courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="bg-white rounded-[32px] border border-slate-100 p-20 text-center shadow-sm">
                  <div className="bg-slate-50/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                      <FiBookOpen size={48} className="text-slate-200" />
                  </div>
                  <h3 className="text-[20px] font-bold text-slate-800 poppins mb-2">No courses found</h3>
                  <p className="text-slate-400 mb-8 max-w-sm mx-auto font-medium">Start by creating your first course and adding multiple-choice questions.</p>
                  <button 
                      onClick={() => setIsFormOpen(true)}
                      className="text-[#38BDF8] font-bold hover:underline"
                  >
                      Create Course Now
                  </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {courses.map(course => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={course._id} 
                    className="bg-white rounded-[24px] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-cyan-400/5 transition-all duration-300 p-8 flex flex-col group relative overflow-hidden h-full"
                  >
                    {/* Corner Accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-bl-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-500"></div>
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-500 ${course.isActive ? 'bg-gradient-to-br from-[#38BDF8] to-[#818CF8] text-white' : 'bg-slate-50 text-slate-300'}`}>
                        <FiBookOpen size={28} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(course)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-[#38BDF8] hover:bg-cyan-50 rounded-xl transition-all"><FiEdit2 size={18} /></button>
                        <button onClick={() => handleDelete(course._id)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><FiTrash2 size={18} /></button>
                      </div>
                    </div>

                    <h3 className="text-[20px] font-bold text-slate-800 mb-2 relative z-10 group-hover:text-[#38BDF8] transition-colors poppins">{course.title}</h3>
                    <p className="text-slate-400 text-sm mb-8 line-clamp-2 h-10 font-medium">{course.description || "No description provided."}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-10">
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                          <FiClock size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Duration</span>
                        </div>
                        <span className="text-slate-700 font-black text-[15px]">{course.duration} min</span>
                      </div>
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                          <FiAward size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Results</span>
                        </div>
                        <span className={`font-black text-[15px] ${course.showResult ? 'text-emerald-500' : 'text-orange-400'}`}>
                          {course.showResult ? 'Public' : 'Hidden'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-slate-50 flex flex-col gap-5">
                      <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">Assigned Company</span>
                          <span className="text-sm font-black text-slate-800 tracking-tight">{course.companyId?.name || 'N/A'}</span>
                      </div>
                      <div className="flex gap-3">
                          <button 
                              onClick={() => window.location.href = `/superadmin/test-management/questions?courseId=${course._id}`}
                              className="flex-1 bg-white border border-[#38BDF8] text-[#38BDF8] h-[48px] rounded-xl text-[13px] font-bold hover:bg-[#38BDF8] hover:text-white transition-all shadow-sm shadow-cyan-400/5"
                          >
                              Management Questions
                          </button>
                          <button 
                              onClick={() => copyPublicLink(course.companyId?._id || course.companyId)}
                              className="w-12 h-[48px] bg-slate-50 text-slate-400 flex items-center justify-center rounded-xl hover:bg-[#38BDF8]/10 hover:text-[#38BDF8] transition-all"
                              title="Copy Public Link"
                          >
                              <FiExternalLink size={20} />
                          </button>
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

export default CourseManagement;
