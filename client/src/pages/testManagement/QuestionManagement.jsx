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
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => navigate('/superadmin/test-management/courses')}
            className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
          >
            <FiChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-gray-900 leading-tight tracking-tight">Question Pool</h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Assessment</span>
                <p className="text-gray-400 font-bold text-xs">{course?.title || 'Loading...'}</p>
            </div>
          </div>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="ml-auto flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 active:scale-95 whitespace-nowrap"
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
            className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden mb-12"
          >
             <div className="p-10 pb-4 flex justify-between items-center relative border-b border-gray-50 bg-gray-50/30">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsFormOpen(false)}
                    className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <FiChevronLeft size={20} />
                  </button>
                  <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">{editId ? 'Customize MCQ' : 'New Multiple Choice Question'}</h2>
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1.5">Define logic & scoring for this item</p>
                  </div>
                </div>
             </div>
             
             <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Question Context / Prompt</label>
                    <textarea 
                      required rows="4"
                      placeholder="Insert your brilliant question here..."
                      className="w-full bg-gray-50 border-0 rounded-3xl p-6 focus:ring-4 focus:ring-indigo-100 font-extrabold text-gray-900 placeholder:text-gray-300 transition-all text-xl resize-none"
                      value={formData.question} 
                      onChange={e => setFormData({...formData, question: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Performance Weight (Marks)</label>
                    <div className="flex items-center gap-6 bg-gray-50 p-3 rounded-2xl border border-gray-100 hover:border-indigo-100 transition-colors max-w-xs">
                       <button type="button" onClick={() => setFormData({...formData, marks: Math.max(1, (parseInt(formData.marks) || 1) - 1)})} className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-600 shadow-sm transition-all"><FiMinus /></button>
                       <input 
                            type="number" required
                            className="bg-transparent border-0 focus:ring-0 w-full font-black text-gray-900 text-center text-2xl"
                            value={formData.marks} 
                            onChange={e => setFormData({...formData, marks: e.target.value})}
                       />
                       <button type="button" onClick={() => setFormData({...formData, marks: (parseInt(formData.marks) || 0) + 1})} className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-600 shadow-sm transition-all"><FiPlus /></button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Define Options & Set Truth</label>
                  <div className="grid grid-cols-1 gap-4">
                      {formData.options.map((opt, i) => (
                      <div 
                          key={i} 
                          className={`flex items-center gap-4 p-4 pr-6 rounded-3xl transition-all duration-300 border-2 ${formData.correctAnswer === opt && opt !== '' ? 'bg-green-50 border-green-400 shadow-lg shadow-green-50' : 'bg-white border-gray-100'}`}
                      >
                          <div 
                              onClick={() => setFormData({...formData, correctAnswer: opt})}
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all shrink-0 font-black text-sm shadow-sm ${formData.correctAnswer === opt && opt !== '' ? 'bg-green-600 text-white animate-pulse' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              title="Mark as correct"
                          >
                              {formData.correctAnswer === opt && opt !== '' ? <FiCheck size={24} /> : String.fromCharCode(65 + i)}
                          </div>
                          <input 
                              type="text" required
                              placeholder={`Input Option ${String.fromCharCode(65 + i)}...`}
                              className="bg-transparent border-0 focus:ring-0 w-full font-bold text-gray-900 placeholder:text-gray-300 text-base"
                              value={opt}
                              onChange={e => handleOptionChange(i, e.target.value)}
                          />
                      </div>
                      ))}
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button 
                        type="button" 
                        onClick={() => setIsFormOpen(false)} 
                        className="flex-1 py-5 rounded-[2rem] bg-gray-50 text-gray-400 font-black hover:bg-gray-100 hover:text-gray-600 transition-all"
                    >
                        Dismiss
                    </button>
                    <button 
                        type="submit" 
                        className="flex-[2] py-5 rounded-[2rem] bg-indigo-600 text-white font-black shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all text-lg tracking-tight"
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
            className="space-y-6"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                 <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-gray-400 font-bold animate-pulse">Assembling pool...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="bg-white rounded-[3rem] border-2 border-dashed border-gray-100 p-24 text-center shadow-sm">
                 <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                    <FiList size={40} className="text-indigo-600" />
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 mb-3">Your pool is quite thirsty!</h3>
                 <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium">Capture student intelligence by adding multiple choice questions with randomized options.</p>
                 <button 
                      onClick={() => setIsFormOpen(true)} 
                      className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-lg"
                  >
                      Add Your First Question
                  </button>
              </div>
            ) : (
              <div className="space-y-6 pb-20">
                {questions.map((q, idx) => (
                  <motion.div 
                     layout
                     initial={{ opacity: 0, y: 30 }}
                     animate={{ opacity: 1, y: 0 }}
                     key={q._id} 
                     className="bg-white rounded-[2rem] border border-gray-50 p-8 hover:shadow-2xl hover:shadow-indigo-50/50 transition-all duration-500 group"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                       <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shrink-0 shadow-lg shadow-indigo-200">{idx + 1}</div>
                       <div className="flex-1 w-full">
                          <h4 className="text-xl font-extrabold text-gray-900 mb-6 leading-relaxed group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{q.question}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                             {q.options.map((opt, i) => (
                               <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 font-bold ${opt === q.correctAnswer ? 'bg-green-50/50 border-green-200 text-green-700 shadow-sm ring-4 ring-green-50' : 'bg-gray-50 border-gray-50 text-gray-400'}`}>
                                  {opt === q.correctAnswer ? <FiCheckCircle size={18} className="text-green-500" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-200"></div>}
                                  <span className="text-sm truncate">{opt}</span>
                               </div>
                             ))}
                          </div>
                          <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                              <div className="flex items-center gap-4">
                                 <span className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm"><FiAward size={14} /> {q.marks} Mark{q.marks > 1 ? 's' : ''}</span>
                                 <span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm"><FiList size={14} /> MCQ</span>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => handleEdit(q)} className="p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"><FiEdit2 size={18} /></button>
                                  <button onClick={() => handleDelete(q._id)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm"><FiTrash2 size={18} /></button>
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
