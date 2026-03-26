import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../../services/api';
import { 
  FiUser, FiMail, FiPhone, FiCheckCircle, FiShield, 
  FiFileText, FiAward, FiArrowRight, FiZap, FiTarget, 
  FiBarChart2, FiDownload, FiStar, FiMapPin
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const AssessmentResult = () => {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const scoreData = location.state?.scoreData;

  const [step, setStep] = useState('score'); // 'score' -> 'lead' -> 'final'
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', location: '', token });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await API.post('/test/public/inquiry/create', formData);
      setStep('final');
    } catch (err) {
      setError(err.response?.data?.message || "Linking failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!scoreData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 font-inter">
         <div className="bg-white rounded-[3rem] p-16 text-center shadow-xl border border-slate-100 max-w-lg">
            <h2 className="text-3xl font-black text-slate-900 mb-6 uppercase tracking-tight">Access Restricted</h2>
            <p className="text-slate-500 font-medium mb-10">Score data not found. Please complete the assessment first.</p>
            <button onClick={() => navigate('/')} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-lg">Return to Base</button>
         </div>
      </div>
    );
  }

  const { score, totalMarks, showResult } = scoreData;
  const percentage = Math.round((score / totalMarks) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-inter py-20 px-6">
      <div className="max-w-4xl mx-auto">
        
        <AnimatePresence mode="wait">
          {/* STEP 1: SCORE DISPLAY */}
          {step === 'score' && (
            <motion.div 
               key="score"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9, y: -20 }}
               className="bg-white rounded-[3.5rem] shadow-2xl shadow-indigo-500/5 border border-slate-100 overflow-hidden"
            >
               <div className="bg-slate-900 p-16 text-center relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500"></div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="w-40 h-40 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-10 border-4 border-white/20 backdrop-blur-3xl shadow-2xl relative"
                  >
                     <div className="text-center">
                        <span className="block text-5xl font-black text-white leading-none">{score}</span>
                        <span className="block text-xs font-black text-indigo-400 uppercase tracking-widest mt-2">OUT OF {totalMarks}</span>
                     </div>
                     <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                        className="absolute inset-0 border-2 border-indigo-500/30 rounded-full border-t-indigo-500"
                     ></motion.div>
                  </motion.div>
                  
                  <h2 className="text-3xl lg:text-5xl font-black text-white mb-4 uppercase tracking-tighter leading-none">
                     {percentage >= 70 ? 'Superior Performance!' : percentage >= 40 ? 'Great Progress!' : 'Core Foundation Set!'}
                  </h2>
                  <p className="text-indigo-200/60 font-black uppercase tracking-[0.3em] text-[10px]">Assessment Module ID: {token.slice(0,8)}</p>
               </div>

               <div className="p-12 lg:p-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                     <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Your Performance Insights</h3>
                     <div className="space-y-4">
                        {[
                          { icon: <FiTarget className="text-indigo-600" />, label: "Accuracy", value: `${percentage}%` },
                          { icon: <FiZap className="text-cyan-500" />, label: "Module Status", value: "Verified" },
                          { icon: <FiStar className="text-orange-500" />, label: "Rating", value: percentage >= 70 ? '⭐️⭐️⭐️⭐️⭐️' : '⭐️⭐️⭐️⭐️' }
                        ].map((stat, i) => (
                           <div key={i} className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50">
                              <div className="bg-white w-10 h-10 rounded-xl flex items-center justify-center shadow-sm">{stat.icon}</div>
                              <div>
                                 <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</span>
                                 <span className="block text-lg font-black text-slate-800 leading-none">{stat.value}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-indigo-50/50 p-10 rounded-[2.5rem] border border-indigo-100 text-center space-y-8">
                     <div className="bg-white w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-xl">
                        <FiFileText size={40} className="text-indigo-600" />
                     </div>
                     <div className="space-y-3">
                        <h4 className="text-xl font-black text-slate-900 leading-tight">Unlock Report & Mentorship</h4>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">Provide your professional details to receive your verified certificate and performance breakdown.</p>
                     </div>
                     <button 
                        onClick={() => setStep('lead')}
                        className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-2xl shadow-indigo-100 hover:scale-[1.03] active:scale-95 transition-all text-lg flex items-center justify-center gap-3"
                     >
                        Get Scaled Report <FiArrowRight size={24} />
                     </button>
                  </div>
               </div>
            </motion.div>
          )}

          {/* STEP 2: LEAD CAPTURE FORM */}
          {step === 'lead' && (
            <motion.div 
               key="lead"
               initial={{ opacity: 0, scale: 0.95, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: -20 }}
               className="bg-white rounded-[3.5rem] shadow-2xl shadow-indigo-500/5 border border-slate-100 overflow-hidden p-12 lg:p-20 relative"
            >
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-bl-full -mr-32 -mt-32"></div>
               
               <div className="max-w-lg mx-auto space-y-12">
                  <div className="text-center space-y-4">
                     <div className="bg-indigo-100 w-14 h-14 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto shadow-inner">
                        <FiUser size={28} />
                     </div>
                     <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Register Result</h2>
                     <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Unlock certification and mentorship</p>
                  </div>

                  <form onSubmit={handleInquirySubmit} className="space-y-6">
                     <div className="group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Identity</label>
                        <div className="relative">
                            <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                            <input 
                                type="text" required
                                placeholder="Enter full name"
                                className="w-full bg-slate-50 border-0 rounded-2xl p-5 pl-14 focus:ring-4 focus:ring-indigo-100 font-bold transition-all text-gray-800"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Work Email</label>
                            <div className="relative">
                                <FiMail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                <input 
                                    type="email" required
                                    placeholder="john@example.com"
                                    className="w-full bg-slate-50 border-0 rounded-2xl p-5 pl-14 focus:ring-4 focus:ring-indigo-100 font-bold transition-all text-gray-800"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Current City</label>
                            <div className="relative">
                                <FiMapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                <input 
                                    type="text" required
                                    placeholder="Enter City"
                                    className="w-full bg-slate-50 border-0 rounded-2xl p-5 pl-14 focus:ring-4 focus:ring-indigo-100 font-bold transition-all text-gray-800"
                                    value={formData.location}
                                    onChange={e => setFormData({...formData, location: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                            <div className="relative">
                                <FiPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                <input 
                                    type="tel" required
                                    placeholder="Mobile no."
                                    className="w-full bg-slate-50 border-0 rounded-2xl p-5 pl-14 focus:ring-4 focus:ring-indigo-100 font-bold transition-all text-gray-800"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                        </div>
                     </div>

                     {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-xs font-bold flex items-center gap-3">
                           <FiShield /> {error}
                        </motion.div>
                     )}

                     <button 
                         type="submit"
                         disabled={submitting}
                         className="w-full bg-slate-900 text-white p-6 rounded-2xl font-black text-xl shadow-2xl shadow-indigo-500/10 hover:bg-indigo-600 hover:scale-[1.02] active:scale-95 transition-all disabled:bg-slate-200 flex items-center justify-center gap-3"
                     >
                        {submitting ? 'Authenticating Identity...' : 'Generate Full Report ⚡️'}
                     </button>
                     <button type="button" onClick={() => setStep('score')} className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest mt-4 hover:text-slate-600 transition-colors">Back to Score</button>
                  </form>
               </div>
            </motion.div>
          )}

          {/* STEP 3: FINAL SUCCESS */}
          {step === 'final' && (
            <motion.div 
               key="final"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white rounded-[3.5rem] shadow-2xl shadow-indigo-500/5 border border-slate-100 p-12 lg:p-24 text-center overflow-hidden relative"
            >
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 animate-pulse"></div>
               
               <div className="space-y-10 max-w-xl mx-auto">
                    <div className="bg-green-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                        <FiCheckCircle size={48} className="text-green-500 animate-bounce" />
                    </div>
                    
                    <div className="space-y-4">
                        <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none">Registration Finalized!</h2>
                        <p className="text-slate-500 text-xl font-medium leading-relaxed">Your performance report has been securely transmitted. A counselor will reach out via WhatsApp/Email within 2 hours.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="bg-slate-100 text-slate-900 p-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-200 transition-all border border-slate-200">
                           <FiDownload size={14} /> Download PDF
                        </button>
                        <button className="bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100">
                           <FiBarChart2 size={14} /> Deep Analysis
                        </button>
                    </div>

                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em]">EduPath Security Engine Verification Code: {token.slice(0, 12).toUpperCase()}</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default AssessmentResult;
