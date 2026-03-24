import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { 
  FiClock, FiCheckCircle, FiChevronRight, FiShield, FiTrendingUp, 
  FiZap, FiAward, FiBookOpen, FiPlay, FiSearch, FiMonitor 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const PublicAssessmentLanding = () => {
  const { companyId, slug } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchPortalData();
  }, [companyId, slug]);

  const fetchPortalData = async () => {
    try {
      const res = await API.get(`/test/public/assessment/${companyId}/${slug}`);
      setData(res.data.data);
    } catch (err) {
      setError("This portal is no longer available. Please verify the URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (courseId) => {
    setStarting(true);
    try {
      const res = await API.post('/test/public/start-test', { courseId, companyId });
      navigate(`/assessment/test/${res.data.token}`);
    } catch (err) {
      alert("System busy. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
       <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Assembling Experience...</p>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
       <div className="bg-white rounded-[3rem] p-20 text-center shadow-2xl shadow-slate-200 w-full max-w-2xl border border-slate-100">
          <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse shadow-inner">
             <FiShield size={48} className="text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tight">Portal Restricted</h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black hover:bg-indigo-600 transition-all shadow-xl shadow-slate-100 uppercase tracking-[0.2em] text-xs">Reload Ecosystem</button>
       </div>
    </div>
  );

  const { page, courses } = data;

  return (
    <div className="min-h-screen bg-white font-inter overflow-hidden">
      {/* ── HEADER NAVIGATION ────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 w-full z-[100] backdrop-blur-xl bg-white/70 border-b border-slate-100/50">
          <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">E</div>
                <div>
                   <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">{page.companyId?.name || 'Assessment Platform'}</h2>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powered by EduPath CRM</p>
                </div>
             </div>
             <div className="hidden md:flex items-center gap-8">
                {["Overview", "Courses", "Benefits", "Security"].map((item, i) => (
                  <a key={i} href={`#${item.toLowerCase()}`} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-all">{item}</a>
                ))}
                <a href="#courses" className="bg-indigo-600 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">Start Free Test</a>
             </div>
          </div>
      </header>

      {/* ── HERO SECTION ────────────────────────────────────────────────────── */}
      <section id="overview" className="relative pt-40 pb-20 lg:pt-56 lg:pb-40 px-6 overflow-hidden">
         {/* Background Ornaments */}
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-50/50 rounded-full blur-3xl -mr-[400px] -mt-[400px] -z-10 animate-pulse"></div>
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-50/50 rounded-full blur-3xl -ml-[300px] -mb-[300px] -z-10 delay-1000"></div>

         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
               <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-sm border border-indigo-100/50">
                  <FiTrendingUp /> FUTURE-READY ASSESSMENTS
               </div>
               
               <h1 className="text-5xl lg:text-8xl font-black text-slate-900 leading-[1.05] tracking-tighter">
                 {page.title || 'Level Up Your Learning Path'}
               </h1>
               
               <p className="text-xl lg:text-2xl text-slate-500 font-medium leading-relaxed max-w-xl">
                 {page.subtitle || 'Discover your strengths and unlock exclusive scholarship opportunities.'}
               </p>

               <div className="flex flex-col sm:flex-row gap-4 pt-10">
                  <a href="#courses" className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-slate-200 hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                     Start Free Test <FiPlay />
                  </a>
                  <button className="bg-white text-slate-600 border-2 border-slate-100 px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                     <FiSearch /> Explore Catalog
                  </button>
               </div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 50 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               transition={{ duration: 1, ease: "easeOut" }}
               className="relative"
            >
                {/* Simulated Portal UI */}
                <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-50 p-6 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/20 to-transparent"></div>
                   <div className="bg-slate-900 rounded-[2rem] aspect-video w-full flex items-center justify-center overflow-hidden relative">
                      <div className="absolute top-4 left-4 flex gap-1.5">
                         <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                         <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                      </div>
                      <FiPlay size={64} className="text-white opacity-20 group-hover:opacity-40 transition-all group-hover:scale-110" />
                   </div>
                   <div className="mt-8 space-y-4 px-4">
                      <div className="h-6 w-3/4 bg-slate-100 rounded-full animate-pulse"></div>
                      <div className="h-4 w-1/2 bg-slate-50 rounded-full animate-pulse delay-75"></div>
                   </div>
                   {/* Floating Badge */}
                   <div className="absolute -top-6 -right-6 bg-white p-6 rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-indigo-50 flex items-center gap-4 animate-bounce hover:animation-none">
                      <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                         <FiAward size={24} />
                      </div>
                      <div>
                         <span className="block text-sm font-black text-slate-900">100% Secure</span>
                         <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Digital Proctoring</span>
                      </div>
                   </div>
                </div>
            </motion.div>
         </div>
      </section>

      {/* ── BENEFITS SECTION ─────────────────────────────────────────────────── */}
      <section id="benefits" className="py-32 px-6 bg-slate-50">
         <div className="max-w-7xl mx-auto space-y-20">
            <div className="text-center space-y-6 max-w-3xl mx-auto">
                <h2 className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em]">The EduPath Advantage</h2>
                <h3 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-tight">Designed for Modern High-Performers</h3>
                <p className="text-slate-500 text-lg font-medium leading-relaxed">Experience a testing environment that values your speed, accuracy, and growth potential over traditional metrics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {[
                 { icon: <FiClock />, color: "bg-indigo-600", title: "Time-Optimized", desc: "Short, high-intensity modules designed to respect your schedule." },
                 { icon: <FiZap />, color: "bg-cyan-500", title: "Instant Feedback", desc: "Get your scorecard immediately after submission with detailed insights." },
                 { icon: <FiShield />, color: "bg-slate-900", title: "Verified Results", desc: "Authorized credentials that you can showcase to potential educators." },
                 { icon: <FiMonitor />, color: "bg-purple-600", title: "Adaptive UI", desc: "Seamless experience across Mobile, Tablet, and Desktop devices." }
               ].map((benefit, i) => (
                 <motion.div 
                    whileHover={{ y: -10 }}
                    key={i} 
                    className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 group transition-all duration-300"
                 >
                    <div className={`${benefit.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                       {React.cloneElement(benefit.icon, { size: 28 })}
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight">{benefit.title}</h4>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">{benefit.desc}</p>
                 </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* ── COURSE SELECTION SECTION ─────────────────────────────────────────── */}
      <section id="courses" className="py-32 px-6 relative">
          <div className="max-w-7xl mx-auto space-y-16">
             <div className="flex flex-col lg:flex-row justify-between items-end gap-10">
                <div className="space-y-6 flex-1">
                    <h2 className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em]">Available Assessments</h2>
                    <h3 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-tight max-w-xl">Choose Your Learning Vertical</h3>
                </div>
                <div className="flex-shrink-0">
                   <div className="bg-slate-100 p-2 rounded-2xl flex gap-2">
                       <button className="bg-white text-slate-900 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm">All Levels</button>
                       <button className="text-slate-400 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:text-slate-600">Advanced</button>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {courses.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-100">
                      <p className="text-slate-400 font-bold">No active assessments in this vertical.</p>
                  </div>
                ) : (
                  courses.map((course, idx) => (
                    <motion.div 
                       layout
                       initial={{ opacity: 0, y: 20 }}
                       whileInView={{ opacity: 1, y: 0 }}
                       viewport={{ once: true }}
                       key={course._id} 
                       className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500"
                    >
                       <div className="bg-slate-100 aspect-[16/10] flex items-center justify-center group-hover:bg-indigo-50 transition-colors duration-500 p-10 relative">
                           <FiBookOpen size={48} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                           <div className="absolute top-6 right-6 bg-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 shadow-sm flex items-center gap-2">
                              <FiClock /> {course.duration} MINS
                           </div>
                       </div>
                       <div className="p-10 space-y-6">
                           <div>
                               <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3 group-hover:text-indigo-600 transition-colors">{course.title}</h4>
                               <p className="text-slate-500 font-medium line-clamp-2 text-sm leading-relaxed">{course.description || "Comprehensive skills assessment for professional growth."}</p>
                           </div>
                           <button 
                             onClick={() => handleStart(course._id)}
                             disabled={starting}
                             className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-3"
                           >
                             {starting ? 'Initializing...' : 'Challenge Now'} <FiChevronRight />
                           </button>
                       </div>
                    </motion.div>
                  ))
                )}
             </div>
          </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */ }
      <footer className="py-20 px-6 border-t border-slate-100 text-center space-y-8">
          <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs">E</div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">{page.companyId?.name}</h4>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
              Authorized Assessment Center &copy; 2026. Data encrypted via SSL.
          </p>
      </footer>

      {/* STICKY CTA BUTTON (Mobile) */}
      <div className="fixed bottom-8 right-8 z-[200] lg:hidden">
         <a href="#courses" className="bg-indigo-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
            <FiPlay size={24} />
         </a>
      </div>
    </div>
  );
};

export default PublicAssessmentLanding;
