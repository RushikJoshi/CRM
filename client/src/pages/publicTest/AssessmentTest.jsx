import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { 
  FiClock, FiCheckSquare, FiChevronRight, FiChevronLeft, FiAlertTriangle, 
  FiHash, FiMonitor, FiShieldOff, FiTrash2, FiArrowRight 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import ProctoringOverlay from '../../components/ProctoringOverlay';

const AssessmentTest = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [testData, setTestData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isProctoringStarted, setIsProctoringStarted] = useState(false);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [proctoringStream, setProctoringStream] = useState(null);
  const [proctoringStatus, setProctoringStatus] = useState("not_requested"); 
  const [cameraStatus, setCameraStatus] = useState("idle"); 
  const [micStatus, setMicStatus] = useState("idle"); 

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
    setLoading(true);
    try {
      console.log("Initializing secure proctoring modality...");
      const stream = await startProctoring();
      setProctoringStream(stream);
      setIsProctoringStarted(true);
      setProctoringStatus("active");
      
      // Delay to ensure video ref is matched
      setTimeout(() => {
        const video = document.getElementById("pre-exam-preview");
        if (video) {
            video.srcObject = stream;
            video.play();
        }
      }, 100);

      enterFullscreen();
      console.log("Hardware verified. Awaiting candidate confirmation.");
    } catch (error) {
      console.warn("Proctoring bypassed with warning:", error.message);
      if (error.message === "Permission denied") {
        setProctoringStatus("denied");
        alert("WARNING: Camera access denied. Monitoring will be limited. This event has been logged for review.");
      } else if (error.message === "Camera not supported") {
        setProctoringStatus("not_supported");
        alert("Your browser does not support proctoring hardware. Proceeding with standard mode.");
      }
      setIsExamStarted(true);
    } finally {
      setLoading(false);
    }
  };

  const startProctoring = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera not supported");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: true
      });

      console.log("Media Stream tracks started:", stream.getTracks().map(t => t.kind));
      setCameraStatus("active");
      setMicStatus("active");
      return stream;
    } catch (error) {
      if (error.name === "NotAllowedError") {
        setCameraStatus("denied");
        setMicStatus("denied");
        throw new Error("Permission denied");
      }
      if (error.name === "NotFoundError") {
        throw new Error("Camera or mic not found");
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
        token, 
        answers,
        proctoringStatus
      });
      // Redirect to results but pass token
      navigate(`/assessment/result/${token}`, { state: { scoreData: res.data.data } });
    } catch (err) {
      alert("Submission failed. Please check your connection.");
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
       <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Assembling Paper Vertical...</p>
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
    <div className="min-h-screen bg-slate-50/50 font-inter">
      <ProctoringOverlay 
        token={token} 
        stream={proctoringStream} 
        isStarted={isProctoringStarted} 
        proctoringStatus={proctoringStatus}
      />

      {!isExamStarted && (
        <div className="fixed inset-0 z-[200] bg-[#f8fafc] flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto">
            <div className="max-w-2xl w-full bg-white rounded-[3rem] p-10 lg:p-16 shadow-2xl shadow-slate-200 border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
               <div className="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 mb-8">
                  <FiCheckSquare size={32} />
               </div>
               <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Ready to begin?</h1>
               <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">Secure Assessment Protocol v2.0</p>
               
               <div className="w-full bg-slate-50 rounded-[2rem] p-8 text-left mb-10 space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-2">Hardware & Security Protocols</h3>
                  {!isProctoringStarted ? (
                    <div className="space-y-4">
                        <div className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                           <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              <FiCheckSquare size={18} />
                           </div>
                           <p className="text-sm font-medium text-slate-600 leading-relaxed">Evaluation will involve real-time face detection and acoustic monitoring to ensure integrity.</p>
                        </div>
                        <div className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                           <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                              <FiAlertTriangle size={18} />
                           </div>
                           <p className="text-sm font-medium text-slate-600 leading-relaxed">Tab switching or exiting fullscreen will result in integrity score penalties.</p>
                        </div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in duration-500 flex flex-col items-center">
                        <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden border-4 border-indigo-600 shadow-2xl mb-6 relative group">
                            <video 
                                id="pre-exam-preview"
                                autoPlay 
                                muted 
                                playsInline 
                                className="w-full h-full object-cover transform -scale-x-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                <span className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                                    Live Stream Active
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full">
                            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Camera Verified</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Mic Detected</span>
                            </div>
                        </div>
                    </div>
                  )}
               </div>

               {!isProctoringStarted ? (
                 <button 
                  onClick={handleStartExam}
                  className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-xl shadow-2xl hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all outline-none flex items-center justify-center gap-4"
                >
                  Verify Hardware <FiArrowRight />
                </button>
               ) : (
                 <button 
                  onClick={() => setIsExamStarted(true)}
                  className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all outline-none flex items-center justify-center gap-4 animate-in slide-in-from-bottom-2 duration-500"
                >
                  Confirm & Begin Exam <FiChevronRight />
                </button>
               )}
              
              <p className="mt-8 text-[11px] text-slate-400 font-medium">Monitoring is mandatory for evaluation completion.</p>
            </div>
        </div>
      )}

      {isExamStarted && (
        <div className="animate-in fade-in duration-700">
          {/* ── TOP NAVIGATION ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b sticky top-0 z-50 backdrop-blur-xl bg-white/70">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
                <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-indigo-100">
                   <FiMonitor size={24} />
                </div>
                <div>
                   <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Digital Examination</h2>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Token: {token.slice(0, 8)}...</p>
                </div>
            </div>

            <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border-2 transition-all duration-300 ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse scale-105' : 'bg-white border-slate-100 text-slate-700 shadow-sm'}`}>
                <FiClock className={timeLeft < 60 ? 'text-red-500' : 'text-slate-400'} size={24} />
                <span className="font-mono text-2xl font-black">{formatTime(timeLeft)}</span>
            </div>
        </div>
        {/* Animated Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 overflow-hidden">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-indigo-600"
            ></motion.div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
            
            {/* ── QUESTION NAV SIDEBAR ────────────────────────────────────────── */}
            <aside className="lg:col-span-1 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-32">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Paper Path</h3>
                   <span className="bg-slate-50 text-[10px] text-slate-600 px-3 py-1 rounded-full font-black uppercase tracking-widest">{currentIndex + 1} / {testData.questions.length}</span>
                </div>
                <div className="grid grid-cols-5 lg:grid-cols-2 gap-3 pb-8 border-b border-slate-50">
                   {testData.questions.map((q, i) => (
                     <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`w-full aspect-square lg:h-14 rounded-2xl flex items-center justify-center text-sm font-black transition-all ${
                            i === currentIndex 
                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 ring-4 ring-indigo-50 hover:scale-105' 
                            : answers[q._id] 
                                ? 'bg-cyan-500 text-white shadow-xl shadow-cyan-100 hover:scale-105'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                        }`}
                     >
                        {i + 1}
                     </button>
                   ))}
                </div>
                <div className="pt-8 space-y-4">
                   <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest uppercase tracking-widest">
                      <div className="w-3 h-3 rounded-full bg-indigo-600"></div> Active
                   </div>
                   <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                      <div className="w-3 h-3 rounded-full bg-cyan-500"></div> Attempted
                   </div>
                   <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                      <div className="w-3 h-3 rounded-full bg-slate-100"></div> Pending
                   </div>
                </div>
            </aside>

            {/* ── CENTRAL QUESTION AREA ──────────────────────────────────────── */}
            <section className="lg:col-span-3 pb-32">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={currentIndex}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        className="bg-white rounded-[3.5rem] p-10 lg:p-16 border border-slate-100 shadow-2xl shadow-indigo-500/5 min-h-[600px] flex flex-col relative overflow-hidden group"
                    >
                         {/* Watermark Decoration */}
                         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/20 rounded-bl-full -mr-32 -mt-32 pointer-events-none group-hover:bg-indigo-50/40 transition-colors duration-500"></div>
                         
                         <div className="flex items-center gap-6 mb-12 relative z-10">
                            <div className="bg-indigo-50 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-inner">
                               <FiHash size={32} strokeWidth={3} />
                            </div>
                            <div>
                               <h2 className="text-xs font-black text-indigo-600 uppercase tracking-[0.4em] mb-1">Item No. {currentIndex + 1}</h2>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{currentQuestion.marks || 1} Marks Weightage</p>
                            </div>
                         </div>

                         <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-14 leading-snug tracking-tight relative z-10">
                            {currentQuestion.question}
                         </h2>

                         <div className="space-y-5 mb-16 relative z-10">
                            {currentQuestion.options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSelect(opt)}
                                    className={`w-full group text-left p-8 rounded-[2rem] border-2 transition-all duration-300 flex items-center gap-8 ${
                                        answers[currentQuestion._id] === opt 
                                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-[6px] ring-indigo-50 shadow-lg shadow-indigo-100' 
                                        : 'bg-white border-slate-50 hover:border-indigo-200 hover:bg-slate-50 shadow-sm'
                                    }`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all group-hover:scale-110 shadow-sm ${
                                        answers[currentQuestion._id] === opt 
                                        ? 'bg-indigo-600 text-white animate-pulse' 
                                        : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-indigo-600'
                                    }`}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <span className={`text-xl font-bold ${answers[currentQuestion._id] === opt ? 'text-indigo-900' : 'text-slate-600'}`}>{opt}</span>
                                    {answers[currentQuestion._id] === opt && <FiCheckSquare className="ml-auto text-indigo-600" size={32} />}
                                </button>
                            ))}
                         </div>

                         <div className="mt-auto flex flex-col sm:flex-row justify-between items-center gap-6 pt-10 border-t border-slate-100 relative z-10">
                             <button
                                type='button'
                                disabled={currentIndex === 0}
                                onClick={() => setCurrentIndex(prev => prev - 1)}
                                className="flex-1 w-full sm:w-auto items-center justify-center gap-3 px-10 py-5 rounded-2xl font-black text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all cursor-pointer uppercase tracking-widest text-xs flex border border-slate-100"
                             >
                                <FiChevronLeft size={20} /> Back Piece
                             </button>

                             {currentIndex === testData.questions.length - 1 ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-1 w-full sm:w-auto px-12 py-5 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-2xl shadow-slate-200 hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:bg-slate-300 cursor-pointer uppercase tracking-tight"
                                >
                                    {submitting ? 'Authenticating Paper...' : 'Final Submission'} <FiCheckSquare size={24} />
                                </button>
                             ) : (
                                <button
                                    onClick={() => setCurrentIndex(prev => prev + 1)}
                                    className="flex-1 w-full sm:w-auto px-12 py-5 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 cursor-pointer uppercase tracking-tight"
                                >
                                    Proceed <FiChevronRight size={24} />
                                </button>
                             )}
                         </div>
                    </motion.div>
                </AnimatePresence>
            </section>
        </div>
      </main>

      {/* ── WARNING BAR ───────────────────────────────────────────────────── */}
      <footer className="fixed bottom-0 left-0 w-full bg-slate-900 text-white py-4 px-8 z-[100] border-t border-white/5 backdrop-blur-xl bg-slate-900/90">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                 <FiAlertTriangle className="text-orange-500 animate-pulse" size={16} />
                 Session Locked. Do not refresh or exit. IP & Device Fingerprinting Active.
              </div>
              <p className="hidden md:block text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Exam Engine v2.0-STABLE</p>
          </div>
      </footer>
      </div>
      )}
    </div>
  );
};

export default AssessmentTest;
