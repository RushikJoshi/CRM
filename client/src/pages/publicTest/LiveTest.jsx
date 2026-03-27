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

  useEffect(() => {
    fetchTest();
  }, [token]);

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

  if (loading) return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-[6px] border-[#6b46c1] border-t-transparent rounded-full animate-spin"></div>
       <p className="text-[#6b46c1] font-bold uppercase tracking-[0.3em] text-xs">Authenticating Portal...</p>
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
    <div className="min-h-screen bg-white font-sans selection:bg-[#6b46c1] selection:text-white pb-32">
      <ProctoringOverlay 
        token={token} 
        stream={proctoringStream} 
        isStarted={isProctoringStarted} 
        proctoringStatus={proctoringStatus}
      />

      {/* ── READY TO BEGIN / SECURITY PROTOCOL UI ───────────────────────────── */}
      {!isExamStarted && (
        <div className="fixed inset-0 z-[200] bg-gray-100 flex flex-col items-center justify-center p-6 min-h-screen overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl w-full bg-white rounded-[2.5rem] p-10 lg:p-14 shadow-2xl flex flex-col items-center text-center border border-gray-200">
               <h1 className="text-3xl font-black text-[#1a202c] mb-2 tracking-tight">Ready to begin?</h1>
               <p className="text-slate-500 font-bold uppercase tracking-[0.25em] text-[10px] mb-10">SECURE ASSESSMENT PROTOCOL V2.0</p>
               
               <div className="w-full text-left space-y-4 mb-10">
                  {!isProctoringStarted ? (
                    <>
                    <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-3xl flex items-center gap-5">
                       <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                          <FiCamera size={24} />
                       </div>
                       <div>
                          <h4 className="text-sm font-bold text-[#1a202c]">Face Detection Active</h4>
                          <p className="text-xs text-slate-500 mt-1 font-medium">Real-time acoustic and visual tracking enabled.</p>
                       </div>
                    </div>
                    
                    <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-3xl flex items-center gap-5">
                       <div className="w-12 h-12 bg-white text-amber-600 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                          <FiActivity size={24} />
                       </div>
                       <div>
                          <h4 className="text-sm font-bold text-[#1a202c]">Integrity Score Monitoring</h4>
                          <p className="text-xs text-slate-500 mt-1 font-medium">Tab switching and full-screen exits are penalized.</p>
                       </div>
                    </div>
                    </>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full">
                        <div className="w-full bg-[#1a202c] rounded-3xl overflow-hidden shadow-xl mb-6 relative group aspect-[4/3]">
                            <video id="pre-exam-preview" autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100" />
                            <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div> Live
                            </div>
                        </div>
                        <div className="w-full bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm">
                           <FiCheckSquare /> Hardware Synchronized Properly
                        </div>
                    </motion.div>
                  )}
               </div>

               {!isProctoringStarted ? (
                 <button onClick={handleStartExam} disabled={hardwareVerifying} className="w-full py-5 bg-[#1a202c] text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-300 hover:bg-black hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 tracking-wide">
                  {hardwareVerifying ? 'Verifying Hardware...' : 'Verify Hardware'} <FiArrowRight />
                 </button>
               ) : (
                 <button onClick={() => setIsExamStarted(true)} className="w-full py-5 bg-[#6b46c1] text-white rounded-2xl font-black text-lg shadow-xl shadow-purple-200 hover:bg-[#553c9a] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 tracking-wide">
                  Start Examination <FiChevronRight />
                 </button>
               )}
            </motion.div>
        </div>
      )}

      {/* ── DIGITAL EXAMINATION ENGINE ───────────────────────────────────────── */}
      {isExamStarted && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          
         {/* TOP BAR */}
         <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center h-20">
               <div className="flex items-center gap-4">
                  <div className="bg-[#6b46c1]/10 w-12 h-12 rounded-2xl flex items-center justify-center text-[#6b46c1]">
                     <FiMonitor size={24} />
                  </div>
                  <div>
                     <h2 className="text-sm font-black text-[#1a202c] tracking-widest uppercase">DIGITAL EXAMINATION</h2>
                     <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">LIVE PORTAL</p>
                  </div>
               </div>

               {/* Timer */}
               <div className={`flex items-center gap-3 px-6 py-2.5 rounded-full border-2 transition-all duration-300 ${timeLeft < 300 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse shadow-sm shadow-red-100' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <FiClock size={20} className={timeLeft < 300 ? "text-red-500" : "text-slate-400"} />
                  <span className="font-mono text-xl font-bold tracking-wide">{formatTime(timeLeft)}</span>
               </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-1 bg-slate-100">
               <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-[#6b46c1]"></motion.div>
            </div>
         </header>

         <main className="max-w-6xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               
               {/* SIDEBAR (Paper Path) */}
               <aside className="lg:col-span-3">
                  <div className="bg-white rounded-3xl p-6 lg:p-8 border border-gray-200 shadow-sm sticky top-32">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Paper Path</h3>
                     <div className="flex flex-row overflow-x-auto lg:grid lg:grid-cols-4 gap-3 pb-6 border-b border-gray-100 hide-scrollbar px-1 lg:px-0">
                        {testData.questions.map((q, i) => (
                           <button
                              key={i}
                              onClick={() => setCurrentIndex(i)}
                              className={`shrink-0 w-12 h-12 lg:w-full lg:h-12 lg:aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                                 i === currentIndex 
                                 ? 'bg-[#6b46c1] text-white shadow-lg shadow-[#6b46c1]/30 ring-4 ring-purple-50' 
                                 : answers[q._id] 
                                    ? 'bg-[#319795] text-white shadow-sm'
                                    : 'bg-[#E2E8F0] text-slate-500 hover:bg-slate-300'
                              }`}
                           >
                              {i + 1}
                           </button>
                        ))}
                     </div>
                     <div className="pt-6 space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
                           <span className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-[#6b46c1]"></div> Active</span>
                           <span className="text-[#1a202c]">{currentIndex + 1}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
                           <span className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-[#319795]"></div> Attempted</span>
                           <span className="text-[#1a202c]">{Object.keys(answers).length}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
                           <span className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-[#E2E8F0]"></div> Pending</span>
                           <span className="text-[#1a202c]">{testData.questions.length - Object.keys(answers).length}</span>
                        </div>
                     </div>
                  </div>
               </aside>

               {/* QUESTION AREA */}
               <section className="lg:col-span-9">
                  <AnimatePresence mode="wait">
                     <motion.div 
                           key={currentIndex}
                           initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}
                           className="bg-white rounded-3xl p-8 lg:p-14 border border-gray-200 shadow-sm min-h-[500px] flex flex-col"
                     >
                           <h2 className="text-2xl lg:text-3xl font-bold text-[#1a202c] mb-12 leading-relaxed">
                              {currentIndex + 1}. {currentQuestion.question}
                           </h2>

                           <div className="space-y-4 mb-16">
                              {currentQuestion.options.map((opt, i) => (
                                 <button
                                       key={i} onClick={() => handleSelect(opt)}
                                       className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-200 flex items-center gap-6 group ${
                                          answers[currentQuestion._id] === opt 
                                          ? 'bg-purple-50 border-[#6b46c1] shadow-sm' 
                                          : 'bg-white border-gray-100 hover:border-purple-200 hover:bg-slate-50'
                                       }`}
                                 >
                                       <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${
                                          answers[currentQuestion._id] === opt 
                                          ? 'bg-[#6b46c1] text-white shadow-md scale-105' 
                                          : 'bg-gray-100 text-slate-500 group-hover:bg-gray-200'
                                       }`}>
                                          {String.fromCharCode(65 + i)}
                                       </div>
                                       <span className={`text-lg font-medium tracking-wide ${answers[currentQuestion._id] === opt ? 'text-[#6b46c1]' : 'text-slate-600'}`}>{opt}</span>
                                 </button>
                              ))}
                           </div>

                           <div className="mt-auto flex justify-between items-center gap-4 pt-10 border-t border-gray-100">
                               <button onClick={() => setCurrentIndex(prev => prev - 1)} disabled={currentIndex === 0} className="flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all uppercase tracking-wide text-sm">
                                  <FiChevronLeft size={20} /> Prev
                               </button>

                               {currentIndex === testData.questions.length - 1 ? (
                                  <button onClick={handleSubmit} disabled={submitting} className="px-10 py-4 rounded-xl bg-[#1a202c] text-white font-bold text-lg shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-95">
                                      {submitting ? 'Submitting...' : 'Finish Exam'} <FiCheckSquare size={20} />
                                  </button>
                               ) : (
                                  <button onClick={() => setCurrentIndex(prev => prev + 1)} className="px-10 py-4 rounded-xl bg-[#6b46c1] text-white font-bold text-lg shadow-xl shadow-purple-200 hover:bg-[#553c9a] hover:-translate-y-1 transition-all flex items-center gap-3 active:scale-95">
                                      Next <FiChevronRight size={20} />
                                  </button>
                               )}
                           </div>
                     </motion.div>
                  </AnimatePresence>
               </section>
            </div>
         </main>

         {/* SECURITY ALERTS / FOOTER */}
         <footer className="fixed bottom-0 left-0 w-full bg-[#1a202c] border-t-4 border-red-600 z-[200]">
             <div className="max-w-7xl mx-auto py-3 px-6 flex items-center justify-between gap-6">
                 <div className="flex items-center gap-3 text-white text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                    <FiAlertTriangle className="text-red-500 animate-pulse" size={18} />
                    <span className="hidden sm:inline">SESSION LOCKED. DO NOT REFRESH OR EXIT. IP & DEVICE FINGERPRINTING ACTIVE.</span>
                    <span className="sm:hidden">SESSION LOCKED. DO NOT EXIT.</span>
                 </div>
                 <p className="text-[#4A5568] text-[10px] font-black uppercase tracking-widest hidden md:block">Protocol V2.0 Secured</p>
             </div>
         </footer>
        </motion.div>
      )}
    </div>
  );
};

export default LiveTest;
