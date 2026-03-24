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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Test & Lead Management</h1>
          <p className="text-gray-500 mt-1">Design automated tests and capture student leads directly into CRM.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-200"
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
            className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden mb-12"
          >
            <div className="p-8 pb-4 flex justify-between items-center relative overflow-hidden bg-gray-50/50">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <FiChevronLeft size={20} />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-gray-900">{editId ? 'Modify Course' : 'Create New Course'}</h2>
                    <p className="text-gray-500 text-sm">Define assessment parameters and company assignment.</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Course Title</label>
                  <input 
                    type="text" required
                    placeholder="e.g. Advanced Digital Marketing"
                    className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800 placeholder:text-gray-300 transition-all"
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                  <textarea 
                    className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700 placeholder:text-gray-300 transition-all" rows="4"
                    placeholder="Briefly describe what this test covers..."
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Assign to Company</label>
                  <select 
                    required className="w-full bg-gray-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800 appearance-none cursor-pointer"
                    value={formData.companyId} 
                    onChange={e => setFormData({...formData, companyId: e.target.value})}
                  >
                    <option value="">Select Company</option>
                    {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                   <div>
                     <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Duration (Min)</label>
                     <div className="relative">
                        <input 
                            type="number" required
                            className="w-full bg-gray-50 border-0 rounded-2xl p-4 pr-12 focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800 transition-all"
                            value={formData.duration} 
                            onChange={e => setFormData({...formData, duration: e.target.value})}
                        />
                        <FiClock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                     </div>
                   </div>
                   <div className="flex flex-col justify-end pb-1">
                      <div 
                        onClick={() => setFormData({...formData, showResult: !formData.showResult})}
                        className="flex items-center gap-3 cursor-pointer group bg-gray-50 p-3 rounded-2xl"
                      >
                         <div className={`w-10 h-5 rounded-full p-1 transition-all duration-300 ${formData.showResult ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-300 ${formData.showResult ? 'translate-x-5' : 'translate-x-0'}`}></div>
                         </div>
                         <span className="text-xs font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">Show Results?</span>
                      </div>
                   </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setFormData({...formData, isActive: !formData.isActive})}>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${formData.isActive ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}>
                        {formData.isActive && <FiCheckCircle className="text-white" size={14} />}
                      </div>
                      <label className="text-sm font-bold text-gray-700 cursor-pointer group-hover:text-indigo-600 transition-colors">Is Course Active?</label>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)} 
                    className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-gray-500 font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all"
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
                 <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-gray-500 font-medium">Fetching courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
                  <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FiBookOpen size={40} className="text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No courses found</h3>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">Start by creating your first course and adding multiple-choice questions.</p>
                  <button 
                      onClick={() => setIsFormOpen(true)}
                      className="text-indigo-600 font-bold hover:underline"
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
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-300 p-6 flex flex-col group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className={`p-4 rounded-2xl shadow-sm ${course.isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <FiBookOpen size={24} />
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(course)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><FiEdit2 size={18} /></button>
                        <button onClick={() => handleDelete(course._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><FiTrash2 size={18} /></button>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2 relative z-10 group-hover:text-indigo-600 transition-colors">{course.title}</h3>
                    <p className="text-gray-500 text-sm mb-6 line-clamp-2 h-10">{course.description || "No description provided."}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                          <FiClock size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Duration</span>
                        </div>
                        <span className="text-gray-900 font-bold">{course.duration} min</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-400 mb-1">
                          <FiAward size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Results</span>
                        </div>
                        <span className={`font-bold ${course.showResult ? 'text-green-600' : 'text-orange-600'}`}>
                          {course.showResult ? 'Public' : 'Hidden'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-gray-50 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Assigned Company</span>
                          <span className="text-sm font-bold text-gray-800">{course.companyId?.name || 'N/A'}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                          <button 
                              onClick={() => window.location.href = `/superadmin/test-management/questions?courseId=${course._id}`}
                              className="flex-1 bg-white border-2 border-indigo-600 text-indigo-600 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          >
                              Management Questions
                          </button>
                          <button 
                              onClick={() => copyPublicLink(course.companyId?._id || course.companyId)}
                              className="w-12 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-xl hover:bg-indigo-100 transition-colors"
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
