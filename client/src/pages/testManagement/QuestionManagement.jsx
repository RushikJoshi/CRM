import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  FiPlus, FiEdit2, FiTrash2, FiChevronLeft, FiCheck, FiX, 
  FiMessageSquare, FiList, FiCheckCircle, FiMinus, FiAward 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const QuestionManagement = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get('courseId');
  
  const [questions, setQuestions] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    courseId: courseId,
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 1
  });

  useEffect(() => {
    if (!courseId) {
      navigate('/superadmin/test-management/courses');
      return;
    }
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qRes, cRes] = await Promise.all([
        API.get(`/test/management/questions/${courseId}`),
        API.get(`/test/management/courses/${courseId}`)
      ]);
      setQuestions(qRes.data.data);
      setCourse(cRes.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.correctAnswer) {
      alert("Please select a correct answer by clicking its A/B/C/D letter icon!");
      return;
    }
    try {
      if (editId) {
        await API.put(`/test/management/questions/${editId}`, formData);
      } else {
        await API.post('/test/management/questions', formData);
      }
      setIsFormOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving question:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      courseId: courseId,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 1
    });
    setEditId(null);
  };

  const handleEdit = (q) => {
    setFormData({
      courseId: courseId,
      question: q.question,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      marks: q.marks
    });
    setEditId(q._id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this question?")) {
      try {
        await API.delete(`/test/management/questions/${id}`);
        fetchData();
      } catch (error) {
        console.error("Error deleting question:", error);
      }
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    
    if (formData.correctAnswer === formData.options[index]) {
        setFormData({ ...formData, options: newOptions, correctAnswer: value });
    } else {
        setFormData({ ...formData, options: newOptions });
    }
  };

  return (
    <div className="animate-fade-in space-y-10 pb-10 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex items-center gap-5 w-full md:w-auto">
          <button 
            onClick={() => navigate('/superadmin/test-management/courses')}
            className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#38BDF8] transition-all shadow-sm"
          >
            <FiChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-[28px] font-bold text-slate-800 poppins tracking-tight leading-tight">Question Pool</h1>
            <div className="flex items-center gap-3 mt-1.5">
                <span className="bg-cyan-50 text-[#38BDF8] px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-[0.15em]">Assessment</span>
                <p className="text-slate-400 font-bold text-[13px]">{course?.title || 'Loading...'}</p>
            </div>
          </div>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="ml-auto btn-saas-primary gap-2 h-[52px] px-8 shadow-xl shadow-cyan-400/20"
          >
            <FiPlus size={20} /> Add MCQ
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isFormOpen ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -20 }}
            className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden mb-12"
          >
             <div className="p-10 pb-5 flex justify-between items-center relative border-b border-slate-50 bg-slate-50/20">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#38BDF8] to-[#818CF8]"></div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsFormOpen(false)}
                    className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-300 hover:text-[#38BDF8] transition-all"
                  >
                    <FiChevronLeft size={20} />
                  </button>
                  <div>
                      <h2 className="text-[20px] font-bold text-slate-800 poppins tracking-tight">{editId ? 'Customize MCQ' : 'New Multiple Choice Question'}</h2>
                      <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mt-1">Define logic & scoring for this item</p>
                  </div>
                </div>
             </div>
             
             <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-10">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Question Context / Prompt</label>
                    <textarea 
                      required rows="4"
                      placeholder="Insert your brilliant question here..."
                      className="w-full bg-slate-50/50 border border-transparent rounded-[32px] p-8 focus:bg-white focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/5 font-black text-slate-800 placeholder:text-slate-300 transition-all text-[18px] resize-none outline-none leading-relaxed"
                      value={formData.question} 
                      onChange={e => setFormData({...formData, question: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Performance Weight (Marks)</label>
                    <div className="flex items-center gap-6 bg-slate-50/50 p-4 rounded-3xl border border-transparent hover:border-slate-100 transition-all max-w-xs">
                       <button type="button" onClick={() => setFormData({...formData, marks: Math.max(1, (parseInt(formData.marks) || 1) - 1)})} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#38BDF8] shadow-sm transition-all"><FiMinus /></button>
                       <input 
                            type="number" required
                            className="bg-transparent border-0 focus:ring-0 w-full font-black text-slate-800 text-center text-[24px] outline-none"
                            value={formData.marks} 
                            onChange={e => setFormData({...formData, marks: e.target.value})}
                       />
                       <button type="button" onClick={() => setFormData({...formData, marks: (parseInt(formData.marks) || 0) + 1})} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#38BDF8] shadow-sm transition-all"><FiPlus /></button>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 ml-2">Define Options & Set Truth</label>
                  <div className="grid grid-cols-1 gap-5">
                      {formData.options.map((opt, i) => (
                      <div 
                          key={i} 
                          className={`flex items-center gap-5 p-5 pr-8 rounded-[28px] transition-all duration-300 border-2 ${formData.correctAnswer === opt && opt !== '' ? 'bg-emerald-50 border-emerald-400 shadow-lg shadow-emerald-400/5' : 'bg-white border-slate-50 hover:border-slate-100'}`}
                      >
                          <div 
                              onClick={() => setFormData({...formData, correctAnswer: opt})}
                              className={`w-12 h-12 rounded-[18px] flex items-center justify-center cursor-pointer transition-all shrink-0 font-black text-sm ${formData.correctAnswer === opt && opt !== '' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`}
                              title="Mark as correct"
                          >
                              {formData.correctAnswer === opt && opt !== '' ? <FiCheck size={24} strokeWidth={3} /> : String.fromCharCode(65 + i)}
                          </div>
                          <input 
                              type="text" required
                              placeholder={`Input Option ${String.fromCharCode(65 + i)}...`}
                              className="bg-transparent border-0 focus:ring-0 w-full font-bold text-slate-700 placeholder:text-slate-300 text-[16px] outline-none"
                              value={opt}
                              onChange={e => handleOptionChange(i, e.target.value)}
                          />
                      </div>
                      ))}
                  </div>

                  <div className="flex gap-4 pt-8">
                    <button 
                        type="button" 
                        onClick={() => setIsFormOpen(false)} 
                        className="flex-1 h-[60px] rounded-[24px] bg-slate-50 text-slate-400 font-bold hover:bg-slate-100 hover:text-slate-600 transition-all"
                    >
                        Dismiss
                    </button>
                    <button 
                        type="submit" 
                        className="flex-[2] h-[60px] rounded-[24px] bg-gradient-to-r from-[#38BDF8] to-[#818CF8] text-white font-black shadow-xl shadow-cyan-400/20 hover:scale-[1.02] active:scale-95 transition-all text-[16px] tracking-tight"
                    >
                       {editId ? 'Commit Changes' : 'Append to Course'}
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
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                 <div className="w-12 h-12 border-4 border-slate-100 border-t-[#38BDF8] rounded-full animate-spin"></div>
                 <p className="text-[12px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Assembling pool...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="bg-white rounded-[40px] border border-slate-100 p-24 text-center shadow-sm">
                 <div className="bg-cyan-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-10 shadow-sm">
                    <FiList size={40} className="text-[#38BDF8]" />
                 </div>
                 <h3 className="text-[24px] font-bold text-slate-800 poppins mb-4">Your pool is quite thirsty!</h3>
                 <p className="text-slate-400 mb-10 max-w-sm mx-auto font-medium">Capture student intelligence by adding multiple choice questions with randomized options.</p>
                 <button 
                      onClick={() => setIsFormOpen(true)} 
                      className="btn-saas-primary h-[56px] px-10"
                  >
                      Add Your First Question
                  </button>
              </div>
            ) : (
              <div className="space-y-8 pb-20">
                {questions.map((q, idx) => (
                  <motion.div 
                     layout
                     initial={{ opacity: 0, y: 30 }}
                     animate={{ opacity: 1, y: 0 }}
                     key={q._id} 
                     className="bg-white rounded-[32px] border border-slate-50 p-10 hover:shadow-2xl hover:shadow-cyan-400/5 transition-all duration-500 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-2 bg-gradient-to-b from-[#38BDF8] to-[#818CF8] h-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start gap-10">
                       <div className="bg-gradient-to-br from-[#38BDF8] to-[#818CF8] w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-cyan-400/20 text-[20px]">{idx + 1}</div>
                       <div className="flex-1 w-full">
                          <h4 className="text-[20px] font-bold text-slate-800 mb-8 leading-relaxed group-hover:text-[#38BDF8] transition-colors poppins">{q.question}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                             {q.options.map((opt, i) => (
                               <div key={i} className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 font-bold ${opt === q.correctAnswer ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-slate-50/50 border-slate-50 text-slate-400'}`}>
                                  {opt === q.correctAnswer ? <FiCheckCircle size={20} className="text-emerald-500" strokeWidth={3} /> : <div className="w-5 h-5 rounded-full border-2 border-slate-200"></div>}
                                  <span className="text-[14px] truncate">{opt}</span>
                                </div>
                             ))}
                          </div>
                          <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                              <div className="flex items-center gap-4">
                                 <span className="bg-slate-50 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm border border-slate-100"><FiAward size={14} /> {q.marks} Mark{q.marks > 1 ? 's' : ''}</span>
                                 <span className="bg-cyan-50 text-[#38BDF8] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm border border-cyan-100/30"><FiList size={14} /> MCQ</span>
                              </div>
                              <div className="flex gap-3">
                                  <button onClick={() => handleEdit(q)} className="w-12 h-12 flex items-center justify-center bg-white text-slate-300 hover:text-[#38BDF8] border border-slate-100 rounded-xl transition-all shadow-sm hover:shadow-md"><FiEdit2 size={18} /></button>
                                  <button onClick={() => handleDelete(q._id)} className="w-12 h-12 flex items-center justify-center bg-white text-slate-300 hover:text-red-500 border border-slate-100 rounded-xl transition-all shadow-sm hover:shadow-md"><FiTrash2 size={18} /></button>
                              </div>
                          </div>
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

export default QuestionManagement;
