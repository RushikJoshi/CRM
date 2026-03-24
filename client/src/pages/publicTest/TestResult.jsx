import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiAward, FiShare2, FiHome, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';

const TestResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state;

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
         <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 max-w-sm">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiHome size={32} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-4">No results found.</h1>
            <p className="text-slate-400 font-medium mb-8 text-sm">You may have refreshed the page or navigating directly. Please return to the landing page.</p>
            <button onClick={() => navigate('/')} className="w-full bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Return to Portal</button>
         </div>
      </div>
    );
  }

  const percentage = Math.round((result.score / result.totalMarks) * 100);
  const isPassed = percentage >= 50;

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 font-inter overflow-hidden relative">
      
      {/* Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000 ${isPassed ? 'bg-indigo-500' : 'bg-red-500'}`}></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-[3.5rem] p-10 lg:p-14 text-center shadow-2xl relative z-10 border border-white/20"
      >
        <motion.div 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
            className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl ${isPassed ? 'bg-green-500 text-white shadow-green-200' : 'bg-orange-500 text-white shadow-orange-200'}`}
        >
            {isPassed ? <FiAward size={56} /> : <FiCheckCircle size={56} />}
        </motion.div>

        <h1 className="text-4xl font-black text-slate-900 mb-3 leading-tight tracking-tight uppercase">
            {isPassed ? 'Phenomenal Work!' : 'Submission Received'}
        </h1>
        <p className="text-slate-500 font-medium mb-12 max-w-sm mx-auto leading-relaxed">
            {isPassed 
                ? "You've demonstrated exceptional proficiency. Your expertise is recognized." 
                : "Your assessment has been successfully logged. Our counselors will review your profile."}
        </p>

        {result.showResult && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-slate-50 rounded-[2.5rem] p-10 mb-12 border border-slate-100 flex flex-col items-center relative overflow-hidden group hover:bg-indigo-50/30 transition-colors"
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/30 rounded-bl-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-5 relative">Performance Score</span>
                <div className="flex items-baseline gap-2 relative">
                    <span className={`text-8xl font-black tracking-tighter ${isPassed ? 'text-indigo-600' : 'text-slate-800'}`}>{result.score}</span>
                    <span className="text-3xl font-bold text-slate-300">/ {result.totalMarks}</span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full mt-10 overflow-hidden relative shadow-inner">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
                        className={`h-full shadow-lg ${isPassed ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`}
                    ></motion.div>
                </div>
                <span className="mt-5 text-[10px] font-black text-slate-400 uppercase tracking-widest relative">{percentage}% Intelligence Quotient</span>
            </motion.div>
        )}

        <div className="flex flex-col gap-4 relative">
             <button 
                onClick={() => window.location.href = 'https://edupathpro.com'}
                className="w-full bg-indigo-600 p-6 rounded-[1.5rem] text-white font-black text-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
             >
                EXPLORE ECOSYSTEM <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
             </button>
             <button 
                onClick={() => window.print()}
                className="w-full bg-white border-2 border-slate-100 p-5 rounded-[1.5rem] text-slate-400 font-bold hover:bg-slate-50 hover:text-slate-600 transition-all flex items-center justify-center gap-3 text-sm shadow-sm"
             >
                <FiShare2 /> Archive Result Record
             </button>
        </div>

        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 pt-8 border-t border-slate-50 flex justify-center items-center gap-6"
        >
            <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest mb-1">CRM DATA</span>
                <span className="text-[10px] text-green-500 font-bold">STABLE</span>
            </div>
            <div className="w-px h-6 bg-slate-100"></div>
            <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest mb-1">LEAD STATUS</span>
                <span className="text-[10px] text-indigo-500 font-bold uppercase">SECURED</span>
            </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TestResult;
