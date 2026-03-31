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
      await API.post('/test/public/inquiry/create', {
        ...formData,
        proctoringStatus: scoreData?.proctoringStatus
      });
      setStep('final');
    } catch (err) {
      setError(err.response?.data?.message || "Linking failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!scoreData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 font-sans">
         <div className="bg-white rounded-[3rem] p-16 text-center shadow-2xl border border-slate-100 max-w-lg">
            <h2 className="text-3xl font-black text-[#1a202c] mb-6 uppercase tracking-tighter italic">Access Restricted</h2>
            <p className="text-slate-500 font-medium mb-10">Score data not found. Please complete the assessment first.</p>
            <button onClick={() => navigate('/')} className="w-full bg-[#1a202c] text-white py-5 rounded-2xl font-black shadow-lg uppercase tracking-widest text-xs">Return to Home</button>
         </div>
      </div>
    );
  }

  const { score, totalMarks, showResult, proctoringStatus } = scoreData;
  const percentage = Math.round((score / totalMarks) * 100);

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans py-20 px-6 selection:bg-[#9b1c1c]/10 selection:text-[#9b1c1c]">
      <div className="max-w-4xl mx-auto">
        
        <AnimatePresence mode="wait">
          {/* STEP 1: SCORE DISPLAY */}
          {step === 'score' && (
            <motion.div 
               key="score"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9, y: -20 }}
               className="bg-white rounded-[4rem] shadow-3xl shadow-slate-200 border border-slate-50 overflow-hidden"
            >
               <div className="bg-[#1a202c] p-16 lg:p-24 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-[#9b1c1c]"></div>
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#9b1c1c]/10 rounded-full blur-3xl"></div>
                  
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="w-48 h-48 bg-white/5 rounded-[3rem] flex items-center justify-center mx-auto mb-12 border-2 border-white/10 backdrop-blur-xl shadow-2xl relative"
                  >
                     <div className="text-center">
                        <span className="block text-6xl font-black text-white leading-none tracking-tighter italic">{score}</span>
                        <span className="block text-[10px] font-black text-[#9b1c1c] uppercase tracking-[0.3em] mt-4">OUT OF {totalMarks}</span>
                     </div>
                     <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                        className="absolute inset-0 border-2 border-[#9b1c1c]/20 rounded-[3rem] border-t-[#9b1c1c]"
                     ></motion.div>
                  </motion.div>
                  
                  <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 uppercase tracking-tighter italic leading-none">
                     {percentage >= 70 ? 'Superior Performance!' : percentage >= 40 ? 'Great Progress!' : 'Core Foundation Set!'}
                  </h2>
                  <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">Verification Fingerprint: {token.slice(0,12).toUpperCase()}</p>
               </div>

               <div className="p-12 lg:p-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                  <div className="space-y-10">
                     <h3 className="text-xs font-black text-[#1a202c] uppercase tracking-[0.4em] text-center md:text-left">Performance Insights</h3>
                     <div className="space-y-4">
                        {[
                          { icon: <FiTarget className="text-[#9b1c1c]" />, label: "Accuracy", value: `${percentage}%` },
                          { icon: <FiZap className="text-[#2c336b]" />, label: "Module Status", value: "Verified" },
                          { icon: <FiStar className="text-amber-500" />, label: "Rating", value: percentage >= 70 ? '⭐️⭐️⭐️⭐️⭐️' : '⭐️⭐️⭐️⭐️' }
                        ].map((stat, i) => (
                           <div key={i} className="flex items-center gap-6 bg-[#fafafa] p-6 rounded-[2rem] border border-slate-50 group hover:bg-white hover:shadow-xl transition-all duration-300">
                              <div className="bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">{stat.icon}</div>
                              <div>
                                 <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</span>
                                 <span className="block text-xl font-black text-[#1a202c] tracking-tighter leading-none italic">{stat.value}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-[#9b1c1c]/5 p-12 rounded-[3.5rem] border border-[#9b1c1c]/10 text-center space-y-10 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-[#9b1c1c]/5 rounded-bl-[5rem]"></div>
                     <div className="bg-white w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl relative z-10 scale-110">
                        <FiAward size={48} strokeWidth={2.5} className="text-[#9b1c1c]" />
                     </div>
                     <div className="space-y-4 relative z-10">
                        <h4 className="text-2xl font-black text-[#1a202c] leading-none uppercase tracking-tighter italic">Official Mentorship</h4>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed italic opacity-80">Provide your professional details to receive your verified certificate and performance breakdown.</p>
                     </div>
                     <button 
                        onClick={() => setStep('lead')}
                        className="w-full bg-[#1a202c] text-white py-6 rounded-2xl font-black shadow-2xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 relative z-10"
                     >
                        Get Scaled Report <FiArrowRight size={20} />
                     </button>
                  </div>
               </div>
            </motion.div>
          )}

          {/* STEP 2: LEAD CAPTURE FORM */}
          {step === 'lead' && (
            <motion.div 
               key="lead"
               initial={{ opacity: 0, scale: 0.98, y: 40 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: -20 }}
               className="bg-white rounded-[4rem] shadow-4xl border border-slate-50 overflow-hidden p-14 lg:p-24 relative"
            >
               <div className="absolute top-0 right-0 w-80 h-80 bg-[#9b1c1c]/5 rounded-bl-[10rem] -mr-10 -mt-10 pointer-events-none"></div>
               
               <div className="max-w-xl mx-auto space-y-16">
                  <div className="text-center space-y-6">
                     <div className="bg-[#9b1c1c]/10 w-20 h-20 rounded-[2rem] flex items-center justify-center text-[#9b1c1c] mx-auto shadow-inner relative">
                        <FiUser size={36} strokeWidth={2.5} />
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                           <FiCheckCircle className="text-emerald-500" size={16} />
                        </div>
                     </div>
                     <div>
                        <h2 className="text-4xl lg:text-5xl font-black text-[#1a202c] tracking-tighter uppercase leading-none italic mb-4">Register Result</h2>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Unlock certification and mentorship</p>
                     </div>
                  </div>

                  <form onSubmit={handleInquirySubmit} className="space-y-8">
                     <div className="group">
                        <label className="block text-[9px] font-black text-[#9b1c1c] uppercase tracking-[0.4em] mb-3 ml-2">Full Identity</label>
                        <div className="relative">
                            <FiUser className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#9b1c1c] transition-colors" size={24} strokeWidth={2.5} />
                            <input 
                                type="text" required
                                placeholder="Enter full name"
                                className="w-full bg-[#fafafa] border-2 border-transparent rounded-[2rem] p-6 pl-16 focus:bg-white focus:border-[#9b1c1c] focus:ring-4 focus:ring-[#9b1c1c]/5 font-black transition-all text-gray-800 tracking-tight"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="group">
                            <label className="block text-[9px] font-black text-[#9b1c1c] uppercase tracking-[0.4em] mb-3 ml-2">Work Email</label>
                            <div className="relative">
                                <FiMail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#9b1c1c] transition-colors" size={24} strokeWidth={2.5} />
                                <input 
                                    type="email" required
                                    placeholder="john@example.com"
                                    className="w-full bg-[#fafafa] border-2 border-transparent rounded-[2rem] p-6 pl-16 focus:bg-white focus:border-[#9b1c1c] focus:ring-4 focus:ring-[#9b1c1c]/5 font-black transition-all text-gray-800 tracking-tight"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="group">
                            <label className="block text-[9px] font-black text-[#9b1c1c] uppercase tracking-[0.4em] mb-3 ml-2">Phone Number</label>
                            <div className="relative">
                                <FiPhone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#9b1c1c] transition-colors" size={24} strokeWidth={2.5} />
                                <input 
                                    type="tel" required
                                    placeholder="+91 XXXXX XXXXX"
                                    className="w-full bg-[#fafafa] border-2 border-transparent rounded-[2rem] p-6 pl-16 focus:bg-white focus:border-[#9b1c1c] focus:ring-4 focus:ring-[#9b1c1c]/5 font-black transition-all text-gray-800 tracking-tight"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                        </div>
                     </div>
                     
                     <div className="group">
                        <label className="block text-[9px] font-black text-[#9b1c1c] uppercase tracking-[0.4em] mb-3 ml-2">Current Location</label>
                        <div className="relative">
                            <FiMapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#9b1c1c] transition-colors" size={24} strokeWidth={2.5} />
                            <input 
                                type="text" required
                                placeholder="City, State"
                                className="w-full bg-[#fafafa] border-2 border-transparent rounded-[2rem] p-6 pl-16 focus:bg-white focus:border-[#9b1c1c] focus:ring-4 focus:ring-[#9b1c1c]/5 font-black transition-all text-gray-800 tracking-tight"
                                value={formData.location}
                                onChange={e => setFormData({...formData, location: e.target.value})}
                            />
                        </div>
                     </div>

                     {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 bg-rose-50 text-rose-600 rounded-3xl border border-rose-100 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-4">
                           <FiShield size={20} strokeWidth={3} /> {error}
                        </motion.div>
                     )}

                     <button 
                         type="submit"
                         disabled={submitting}
                         className="w-full bg-[#9b1c1c] text-white p-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-3xl shadow-[#9b1c1c]/20 hover:bg-[#7f1717] hover:scale-[1.02] active:scale-95 transition-all disabled:bg-slate-200 flex items-center justify-center gap-4"
                     >
                        {submitting ? 'Authenticating Identity...' : 'Generate Full Report ⚡️'}
                     </button>
                     <button type="button" onClick={() => setStep('score')} className="w-full text-slate-300 font-black text-[10px] uppercase tracking-[0.3em] mt-6 hover:text-[#9b1c1c] transition-colors duration-300 italic">Back to Score Registry</button>
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
               className="bg-white rounded-[4rem] shadow-4xl border border-slate-50 p-16 lg:p-32 text-center overflow-hidden relative"
            >
               <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-emerald-500 via-[#9b1c1c] to-emerald-500 animate-pulse"></div>
               
               <div className="space-y-12 max-w-2xl mx-auto">
                    <div className="bg-emerald-50 w-32 h-32 rounded-[3.5rem] flex items-center justify-center mx-auto shadow-2xl relative">
                        <FiCheckCircle size={56} strokeWidth={3} className="text-emerald-500 animate-bounce" />
                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl text-[#9b1c1c] font-black animate-pulse">!</div>
                    </div>
                    
                    <div className="space-y-6">
                        <h2 className="text-5xl lg:text-7xl font-black text-[#1a202c] tracking-tighter uppercase leading-none italic">Registration Finalized!</h2>
                        <p className="text-slate-400 text-lg lg:text-2xl font-medium leading-tight italic opacity-80">Your performance report has been securely transmitted. A counselor will reach out via WhatsApp/Email within 2 hours.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <button className="bg-slate-50 text-[#1a202c] p-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 hover:bg-[#1a202c] hover:text-white transition-all border border-slate-100 shadow-sm">
                           <FiDownload size={18} strokeWidth={3} /> Download Report
                        </button>
                        <button className="bg-[#9b1c1c] text-white p-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 hover:bg-[#7f1717] transition-all shadow-3xl shadow-[#9b1c1c]/20">
                           <FiBarChart2 size={18} strokeWidth={3} /> View Analytics
                        </button>
                    </div>

                    <div className="pt-10">
                        <p className="text-[9px] text-[#9b1c1c]/30 font-black uppercase tracking-[1em] mb-4">PROTOCOL V2.0 ENCRYPTED</p>
                        <div className="inline-flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-full border border-slate-100">
                           <FiShield className="text-[#9b1c1c]" size={14} />
                           <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{token.toUpperCase()}</span>
                        </div>
                    </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default AssessmentResult;
