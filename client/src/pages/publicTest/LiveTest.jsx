import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { 
  FiClock, FiCheckSquare, FiChevronRight, FiChevronLeft, FiAlertTriangle, 
  FiMonitor, FiArrowRight, FiCamera, FiActivity 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import ProctoringOverlay from '../../components/ProctoringOverlay';

const LiveTest = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [testData, setTestData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hardwareVerifying, setHardwareVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isProctoringStarted, setIsProctoringStarted] = useState(false);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [proctoringStream, setProctoringStream] = useState(null);
  const [proctoringStatus, setProctoringStatus] = useState("not_requested"); 
  const [resetting, setResetting] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    fetchTest();
  }, [token]);

  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    if (isExamStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isExamStarted, timeLeft]);

  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  };

  const handleStartExam = async () => {
    setHardwareVerifying(true);
    try {
      const stream = await startProctoring();
      setProctoringStream(stream);
      setIsProctoringStarted(true);
      setProctoringStatus("active");
      
      setTimeout(() => {
        const video = document.getElementById("pre-exam-preview");
        if (video) {
            video.srcObject = stream;
            video.play();
        }
      }, 100);

      enterFullscreen();
    } catch (error) {
      if (error.message === "Permission denied") {
        setProctoringStatus("denied");
        alert("WARNING: Camera access denied. Monitoring limited.");
      } else if (error.message === "Camera not supported") {
        setProctoringStatus("not_supported");
        alert("Your browser does not support proctoring hardware. Proceeding...");
      }
      setIsExamStarted(true);
    } finally {
      setHardwareVerifying(false);
    }
  };

  const startProctoring = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Hardware access not supported");
    }
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true
      });
    } catch (error) {
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        throw new Error("Permission denied");
      }
      throw new Error("Unknown media error");
    }
  };

  const fetchTest = async () => {
    try {
      const res = await API.get(`/test/public/test/${token}`);
      setTestData(res.data.data);
      const expiry = new Date(res.data.data.expiresAt).getTime();
      const now = new Date().getTime();
      setTimeLeft(Math.max(0, Math.floor((expiry - now) / 1000)));
    } catch (err) {
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (option) => {
    setAnswers({ ...answers, [testData.questions[currentIndex]._id]: option });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await API.post('/test/public/submit-test', { 
        token, answers, proctoringStatus
      });
      navigate(`/test/result/done`, { state: res.data.data });
    } catch (err) {
      alert("Submission failed. Please check your connection.");
      setSubmitting(false);
    }
  };

  const handleSecurityReset = () => {
    setResetting(true);
    setTimeout(() => {
      setCurrentIndex(0);
      setAnswers({});
      setSessionKey(prev => prev + 1);
      setResetting(false);
    }, 4000); 
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-[6px] border-[#9b1c1c] border-t-transparent rounded-full animate-spin"></div>
       <p className="text-[#9b1c1c] font-bold uppercase tracking-[0.3em] text-xs">Authenticating Portal...</p>
    </div>
  );

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQuestion = testData.questions[currentIndex];
  const progress = ((currentIndex + 1) / testData.questions.length) * 100;

  return (
    <div className="h-screen overflow-hidden bg-white font-sans selection:bg-[#9b1c1c] selection:text-white">
      <ProctoringOverlay 
        key={sessionKey}
        token={token} 
        stream={proctoringStream} 
        isStarted={isProctoringStarted} 
        proctoringStatus={proctoringStatus}
        onLimitReached={() => handleSecurityReset()}
      />

      {/* ── SECURITY VIOLATION RESET OVERLAY ───────────────────────────────── */}
      <AnimatePresence>
        {resetting && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-[#9b1c1c] text-white flex flex-col items-center justify-center p-10 text-center backdrop-blur-2xl"
          >
             <motion.div 
               initial={{ scale: 0.9, rotate: -5 }} animate={{ scale: 1, rotate: 0 }}
               className="max-w-2xl"
             >
                <div className="w-32 h-32 bg-white/10 rounded-[3rem] flex items-center justify-center mx-auto mb-10 border-4 border-white/20 animate-pulse">
                   <FiAlertTriangle size={64} strokeWidth={3} />
                </div>
                <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter italic mb-6 leading-none">Security Violation</h1>
                <p className="text-xl font-bold italic opacity-80 mb-10 tracking-tight">Too many protocol breaches detected. Your session is being forcibly synchronized and restarted from the beginning.</p>
                <div className="flex items-center justify-center gap-4">
                   <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                   <span className="font-black uppercase tracking-[0.3em] text-xs">Re-authenticating...</span>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── READY TO BEGIN / SECURITY PROTOCOL UI ───────────────────────────── */}
      {!isExamStarted && (
        <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col items-center justify-center p-6 min-h-screen overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl w-full bg-white rounded-[3rem] p-10 lg:p-14 shadow-3xl flex flex-col items-center text-center border border-slate-100">
               <h1 className="text-4xl font-black text-[#1a202c] mb-3 tracking-tighter uppercase italic">Ready to begin?</h1>
               <p className="text-[#9b1c1c]/50 font-black uppercase tracking-[0.4em] text-[10px] mb-12">SECURE ASSESSMENT PROTOCOL V2.0</p>
               
               <div className="w-full text-left space-y-5 mb-12">
                  {!isProctoringStarted ? (
                    <>
                    <div className="bg-[#2c336b]/5 border border-[#2c336b]/10 p-6 rounded-[2rem] flex items-center gap-6 group hover:bg-[#2c336b]/10 transition-colors">
                       <div className="w-14 h-14 bg-white text-[#2c336b] rounded-2xl flex items-center justify-center shadow-lg shadow-[#2c336b]/5 shrink-0 group-hover:scale-110 transition-transform">
                          <FiCamera size={28} strokeWidth={2.5} />
                       </div>
                       <div>
                          <h4 className="text-sm font-black text-[#1a202c] uppercase tracking-wide">Face Detection Active</h4>
                          <p className="text-xs text-slate-500 mt-1 font-medium italic opacity-80">Real-time acoustic and visual tracking enabled.</p>
                       </div>
                    </div>
                    
                    <div className="bg-[#9b1c1c]/5 border border-[#9b1c1c]/10 p-6 rounded-[2rem] flex items-center gap-6 group hover:bg-[#9b1c1c]/10 transition-colors">
                       <div className="w-14 h-14 bg-white text-[#9b1c1c] rounded-2xl flex items-center justify-center shadow-lg shadow-[#9b1c1c]/5 shrink-0 group-hover:scale-110 transition-transform">
                          <FiActivity size={28} strokeWidth={2.5} />
                       </div>
                       <div>
                          <h4 className="text-sm font-black text-[#1a202c] uppercase tracking-wide">Integrity Score Monitoring</h4>
                          <p className="text-xs text-slate-500 mt-1 font-medium italic opacity-80">Tab switching and full-screen exits are penalized.</p>
                       </div>
                    </div>
                    </>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full">
                        <div className="w-full bg-[#1a202c] rounded-[3rem] overflow-hidden shadow-2xl mb-8 relative group aspect-[4/3] border-[6px] border-white">
                            <video id="pre-exam-preview" autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100" />
                            <div className="absolute top-6 left-6 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl">
                                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div> Live
                            </div>
                        </div>
                        <div className="w-full bg-emerald-50 border border-emerald-100 text-emerald-800 p-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest">
                           <FiCheckSquare size={18} /> Hardware Synchronized Properly
                        </div>
                    </motion.div>
                  )}
               </div>

               {!isProctoringStarted ? (
                 <button onClick={handleStartExam} disabled={hardwareVerifying} className="w-full py-6 bg-[#1a202c] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-slate-300 hover:bg-black hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                  {hardwareVerifying ? 'Verifying Hardware...' : 'Verify Hardware'} <FiArrowRight strokeWidth={3} />
                 </button>
               ) : (
                 <button onClick={() => setIsExamStarted(true)} className="w-full py-6 bg-[#9b1c1c] text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-[#9b1c1c]/20 hover:bg-[#7f1717] hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
                  Start Examination <FiChevronRight strokeWidth={3} />
                 </button>
               )}
            </motion.div>
        </div>
      )}

      {/* ── DIGITAL EXAMINATION ENGINE ───────────────────────────────────────── */}
      {isExamStarted && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="h-full flex flex-col overflow-hidden">
          
         {/* TOP BAR */}
         <header className="bg-white border-b border-gray-100 z-50 shadow-sm shrink-0">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center h-24">
               <div className="flex items-center gap-5">
                  <div className="bg-[#9b1c1c]/5 w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-[#9b1c1c] shadow-inner">
                     <FiMonitor size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                     <h2 className="text-[11px] font-black text-[#1a202c] tracking-[0.3em] uppercase">DIGITAL EXAMINATION</h2>
                     <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase mt-1">LIVE PORTAL</p>
                  </div>
               </div>

               {/* Timer */}
               <div className={`flex items-center gap-4 px-8 py-3 rounded-full border-2 transition-all duration-300 ${timeLeft < 300 ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse shadow-xl shadow-rose-100' : 'bg-[#fafafa] border-slate-100 text-[#1a202c]'}`}>
                  <FiClock size={24} className={timeLeft < 300 ? "text-rose-500" : "text-slate-300"} />
                  <span className="font-black text-2xl tracking-tighter tabular-nums">{formatTime(timeLeft)}</span>
               </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-[3px] bg-slate-50">
               <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-[#9b1c1c] shadow-[0_0_10px_#9b1c1c]"></motion.div>
            </div>
         </header>

         <main className="flex-1 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 py-8 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
               
               {/* SIDEBAR (Paper Path) */}
               <aside className="lg:col-span-3">
                  <div className="bg-[#fafafa] rounded-[3rem] p-10 border border-slate-100 shadow-sm h-full">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Paper Path</h3>
                     <div className="flex flex-row overflow-x-auto lg:grid lg:grid-cols-4 gap-3 pb-8 border-b border-slate-100 hide-scrollbar">
                        {testData.questions.map((q, i) => (
                           <button
                              key={i}
                              onClick={() => setCurrentIndex(i)}
                              className={`shrink-0 w-12 h-12 lg:w-full lg:h-12 rounded-2xl flex items-center justify-center text-[11px] font-black transition-all ${
                                 i === currentIndex 
                                 ? 'bg-[#9b1c1c] text-white shadow-2xl shadow-[#9b1c1c]/40 scale-110 z-10' 
                                 : answers[q._id] 
                                    ? 'bg-[#2c336b] text-white shadow-lg shadow-[#2c336b]/10'
                                    : 'bg-white text-slate-300 hover:bg-slate-200 border border-slate-100'
                              }`}
                           >
                              {i + 1}
                           </button>
                        ))}
                     </div>
                     <div className="pt-8 space-y-5">
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <span className="flex items-center gap-4"><div className="w-2.5 h-2.5 rounded-full bg-[#9b1c1c]"></div> Active</span>
                           <span className="text-[#1a202c] italic">{currentIndex + 1}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <span className="flex items-center gap-4"><div className="w-2.5 h-2.5 rounded-full bg-[#2c336b]"></div> Attempted</span>
                           <span className="text-[#1a202c] italic">{Object.keys(answers).length}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <span className="flex items-center gap-4"><div className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300"></div> Pending</span>
                           <span className="text-[#1a202c] italic">{testData.questions.length - Object.keys(answers).length}</span>
                        </div>
                     </div>
                  </div>
               </aside>

               {/* QUESTION AREA */}
               <section className="lg:col-span-9">
                  <AnimatePresence mode="wait">
                     <motion.div 
                            key={currentIndex}
                            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.4 }}
                            className="bg-white rounded-[4rem] p-10 lg:p-14 border border-slate-100 shadow-sm h-full flex flex-col relative overflow-hidden"
                     >
                           <div className="absolute top-0 right-0 w-64 h-64 bg-[#9b1c1c]/5 rounded-bl-[10rem] pointer-events-none"></div>
                           
                           <h2 className="text-3xl lg:text-5xl font-black text-[#1a202c] mb-10 leading-[1.1] tracking-tight uppercase italic relative z-10">
                              {currentIndex + 1}. <span className="not-italic opacity-90">{currentQuestion.question}</span>
                           </h2>

                           <div className="space-y-5 mb-10 relative z-10 flex-1 overflow-hidden">
                              {currentQuestion.options.map((opt, i) => (
                                 <button
                                        key={i} onClick={() => handleSelect(opt)}
                                        className={`w-full text-left p-8 rounded-[2.5rem] border-2 transition-all duration-300 flex items-center gap-8 group ${
                                           answers[currentQuestion._id] === opt 
                                           ? 'bg-[#9b1c1c]/5 border-[#9b1c1c] shadow-2xl shadow-[#9b1c1c]/10' 
                                           : 'bg-[#fafafa] border-transparent hover:border-slate-200 hover:bg-white'
                                        }`}
                                 >
                                        <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center font-black text-xl transition-all ${
                                           answers[currentQuestion._id] === opt 
                                           ? 'bg-[#9b1c1c] text-white shadow-2xl shadow-[#9b1c1c]/20 scale-110' 
                                           : 'bg-white text-slate-400 group-hover:bg-slate-100 shadow-sm'
                                        }`}>
                                           {String.fromCharCode(65 + i)}
                                        </div>
                                        <span className={`text-xl font-bold tracking-tight ${answers[currentQuestion._id] === opt ? 'text-[#9b1c1c]' : 'text-[#2d3748] opacity-80'}`}>{opt}</span>
                                 </button>
                              ))}
                           </div>

                           <div className="mt-auto flex justify-between items-center gap-6 pt-8 border-t border-slate-50 relative z-10 shrink-0">
                               <button onClick={() => setCurrentIndex(prev => prev - 1)} disabled={currentIndex === 0} className="flex items-center gap-3 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-slate-300 hover:text-[#9b1c1c] hover:bg-[#9b1c1c]/5 disabled:opacity-20 transition-all">
                                  <FiChevronLeft size={24} strokeWidth={3} /> Prev
                               </button>

                               {currentIndex === testData.questions.length - 1 ? (
                                  <button onClick={handleSubmit} disabled={submitting} className="px-12 py-5 rounded-[2rem] bg-[#2c336b] text-white font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-[#2c336b]/20 hover:bg-[#1a202c] hover:scale-105 transition-all flex items-center gap-4">
                                      {submitting ? 'Submitting...' : 'Finish Exam'} <FiCheckSquare size={20} strokeWidth={3} />
                                  </button>
                               ) : (
                                  <button onClick={() => setCurrentIndex(prev => prev + 1)} className="px-12 py-5 rounded-[2rem] bg-[#9b1c1c] text-white font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-[#9b1c1c]/20 hover:bg-[#7f1717] hover:scale-105 transition-all flex items-center gap-4">
                                      Next <FiChevronRight size={24} strokeWidth={3} />
                                  </button>
                               )}
                           </div>
                     </motion.div>
                  </AnimatePresence>
               </section>
            </div>
            </div>
         </main>

         {/* SECURITY ALERTS / FOOTER */}
         <footer className="fixed bottom-0 left-0 w-full bg-[#1a202c] border-t-4 border-[#9b1c1c] z-[200]">
             <div className="max-w-7xl mx-auto py-3 px-8 flex items-center justify-between gap-10">
                 <div className="flex items-center gap-4 text-white text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">
                    <FiAlertTriangle className="text-[#9b1c1c] animate-pulse" size={20} strokeWidth={3} />
                    <span className="hidden sm:inline italic">SESSION LOCKED. DO NOT REFRESH OR EXIT. IP & DEVICE FINGERPRINTING ACTIVE.</span>
                    <span className="sm:hidden">SESSION LOCKED. DO NOT EXIT.</span>
                 </div>
                 <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em] hidden md:block">Protocol V2.0 Secured</p>
             </div>
         </footer>
        </motion.div>
      )}
    </div>
  );
};

export default LiveTest;
