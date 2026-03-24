import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { FiUser, FiMail, FiPhone, FiBook, FiPlay, FiCheckCircle, FiShield } from 'react-icons/fi';
import { motion } from 'framer-motion';

const PublicTestLanding = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    courseId: '',
    companyId: companyId
  });

  useEffect(() => {
    fetchCourses();
  }, [companyId]);

  const fetchCourses = async () => {
    try {
      const res = await API.get(`/test/public/courses/${companyId}`);
      setCourses(res.data.data);
    } catch (err) {
      setError("Unable to load test details. Please check the link.");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await API.post('/test/public/start-test', formData);
      if (res.data.success) {
        navigate(`/test/live/${res.data.token}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start test. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
       <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-white selection:bg-indigo-500/30 font-inter py-12 px-6 flex items-center">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
        
        {/* Left Side: Branding & Info */}
        <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
        >
           <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full text-indigo-400 text-sm font-bold uppercase tracking-widest">
              <FiShield /> SECURE ASSESSMENT PORTAL
           </div>
           
           <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-[1.1]">
              Level Up Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 font-black">Career</span> 🚀
           </h1>
           
           <p className="text-slate-400 text-xl leading-relaxed max-w-lg">
             Complete the assessment to unlock exclusive course benefits and personalized mentorship. Time to show your skills!
           </p>

           <div className="space-y-4">
              {[
                "Timed performance assessment",
                "Randomized question set (10 questions max)",
                "Instant scorecard generation",
                "Direct lead enrollment in EduPath CRM"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                    <div className="bg-indigo-500/20 p-2 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                        <FiCheckCircle className="text-indigo-400 group-hover:text-white" />
                    </div>
                    <span className="text-slate-300 font-medium">{item}</span>
                </div>
              ))}
           </div>
        </motion.div>

        {/* Right Side: Form Card */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-[2.5rem] p-10 lg:p-14 shadow-2xl shadow-indigo-500/10 text-slate-900 overflow-hidden relative"
        >
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-16 -mt-16"></div>
             
             <div className="mb-10 relative">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Registration</h2>
                <p className="text-slate-500 font-medium">Verify your identity to begin the test.</p>
             </div>

             <form onSubmit={handleStart} className="space-y-6 relative">
                <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Full Name</label>
                    <div className="relative">
                        <FiUser className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input 
                            type="text" required
                            placeholder="John Doe"
                            className="w-full bg-slate-50 border-0 rounded-2xl p-5 pl-14 focus:ring-4 focus:ring-indigo-100 font-bold transition-all text-gray-800"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Work Email</label>
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
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Phone Number</label>
                        <div className="relative">
                            <FiPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                            <input 
                                type="tel" required
                                placeholder="+91 98765 43210"
                                className="w-full bg-slate-50 border-0 rounded-2xl p-5 pl-14 focus:ring-4 focus:ring-indigo-100 font-bold transition-all text-gray-800"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Choose Course</label>
                    <div className="relative">
                        <FiBook className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <select 
                            required
                            className="w-full bg-slate-50 border-0 rounded-2xl p-5 pl-14 focus:ring-4 focus:ring-indigo-100 font-bold transition-all appearance-none cursor-pointer text-gray-800"
                            value={formData.courseId}
                            onChange={e => setFormData({...formData, courseId: e.target.value})}
                        >
                            <option value="">Select an assessment...</option>
                            {courses.map(c => <option key={c._id} value={c._id}>{c.title} ({c.duration} mins)</option>)}
                        </select>
                    </div>
                </div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3 font-bold text-sm"
                    >
                        <FiShield className="shrink-0" />
                        {error}
                    </motion.div>
                )}

                <button 
                   type="submit"
                   disabled={submitting}
                   className="w-full bg-indigo-600 p-6 rounded-2xl text-white font-black text-xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all disabled:bg-slate-300 flex items-center justify-center gap-3"
                >
                   {submitting ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   ) : (
                        <>
                            START MY ASSESSMENT <FiPlay />
                        </>
                   )}
                </button>
             </form>

             <p className="mt-8 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                Protected by EduPath Security Engine v2.0
             </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PublicTestLanding;
