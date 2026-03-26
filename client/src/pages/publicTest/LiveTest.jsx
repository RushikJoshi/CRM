import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { FiClock, FiCheckSquare, FiChevronRight, FiChevronLeft, FiAlertTriangle, FiMaximize } from 'react-icons/fi';
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
  const [submitting, setSubmitting] = useState(false);
  const [isProctoringStarted, setIsProctoringStarted] = useState(false);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [proctoringStream, setProctoringStream] = useState(null);
  const [proctoringStatus, setProctoringStatus] = useState("not_requested"); // not_requested | active | denied | not_supported
  const [cameraStatus, setCameraStatus] = useState("idle"); // idle | active | denied | error
  const [micStatus, setMicStatus] = useState("idle"); // idle | active | denied | error

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
      setIsExamStarted(true); // Direct proceed if fail/denied
    } finally {
      setLoading(false);
    }
  };

  const startProctoring = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera not supported");
    }

    try {
      // Step 6: Browser Permission Check (Query)
      try {
        const camPerm = await navigator.permissions.query({ name: "camera" });
        const micPerm = await navigator.permissions.query({ name: "microphone" });
        console.log(`Initial Permissions - Cam: ${camPerm.state}, Mic: ${micPerm.state}`);
      } catch (pErr) { /* non-critical query failure */ }

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

  const showErrorUI = (error) => {
    if (error.message === "Permission denied") {
      alert("CRITICAL: Camera & microphone access is required to start the test. Please enable permissions in your browser settings and try again.");
      return;
    }
    if (error.message === "Camera not supported") {
      alert("ERROR: Your browser does not support secure camera access. Please use a modern browser like Chrome or Edge.");
      return;
    }
    if (error.message === "Camera or mic not found") {
      alert("ERROR: No webcam or microphone found on this device. Please connect your hardware and refresh.");
      return;
    }
    alert("Unable to start proctoring session: " + error.message);
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
      navigate(`/test/result/done`, { state: res.data.data });
    } catch (err) {
      alert("Submission failed. Please check your connection.");
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
       <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
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
    <div className="min-h-screen bg-slate-50 font-inter">
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
          {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100">E</div>
                <div>
                   <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Live Assessment</h2>
                   <p className="text-[10px] text-slate-400 font-bold">{testData.name}</p>
                </div>
            </div>

            <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 transition-all duration-300 ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                <FiClock className={timeLeft < 60 ? 'text-red-500' : 'text-slate-400'} size={20} />
                <span className="font-mono text-xl font-black">{formatTime(timeLeft)}</span>
            </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 overflow-hidden">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500"
            ></motion.div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            
            {/* Question Navigation (Sidebar) */}
            <aside className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm sticky top-28">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Course Path</h3>
                <div className="grid grid-cols-5 lg:grid-cols-2 gap-3">
                   {testData.questions.map((q, i) => (
                     <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`w-10 h-10 lg:w-full lg:h-12 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                            i === currentIndex 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 ring-4 ring-indigo-50' 
                            : answers[q._id] 
                                ? 'bg-green-500 text-white shadow-lg shadow-green-100'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                     >
                        {i + 1}
                     </button>
                   ))}
                </div>
            </aside>

            {/* Question Content */}
            <section className="lg:col-span-3">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white rounded-[2.5rem] p-8 lg:p-12 border border-slate-100 shadow-2xl shadow-indigo-500/5 min-h-[500px] flex flex-col"
                    >
                         <div className="flex items-center gap-4 mb-8">
                            <span className="bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">Question {currentIndex + 1}</span>
                            <div className="h-px flex-1 bg-slate-50"></div>
                         </div>

                         <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mb-10 leading-snug">
                            {currentQuestion.question}
                         </h2>

                         <div className="space-y-4 mb-12">
                            {currentQuestion.options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSelect(opt)}
                                    className={`w-full group text-left p-6 rounded-[1.5rem] border-2 transition-all duration-300 flex items-center gap-5 ${
                                        answers[currentQuestion._id] === opt 
                                        ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-4 ring-indigo-50 shadow-md' 
                                        : 'bg-white border-slate-50 hover:border-indigo-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all group-hover:scale-110 ${
                                        answers[currentQuestion._id] === opt 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'bg-slate-100 text-slate-400'
                                    }`}>
                                        {String.fromCharCode(65 + i)}
                                    </div>
                                    <span className={`text-lg font-bold ${answers[currentQuestion._id] === opt ? 'text-indigo-900' : 'text-slate-600'}`}>{opt}</span>
                                    {answers[currentQuestion._id] === opt && <FiCheckSquare className="ml-auto text-indigo-600" size={24} />}
                                </button>
                            ))}
                         </div>

                         <div className="mt-auto flex justify-between items-center gap-4 pt-8 border-t border-slate-50">
                             <button
                                type='button'
                                disabled={currentIndex === 0}
                                onClick={() => setCurrentIndex(prev => prev - 1)}
                                className="flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-all cursor-pointer"
                             >
                                <FiChevronLeft /> Previous
                             </button>

                             {currentIndex === testData.questions.length - 1 ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="px-10 py-4 rounded-2xl bg-gray-900 text-white font-black text-lg shadow-xl hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:bg-slate-300 cursor-pointer"
                                >
                                    {submitting ? 'Submitting...' : 'Finish Assessment'} <FiCheckSquare />
                                </button>
                             ) : (
                                <button
                                    onClick={() => setCurrentIndex(prev => prev + 1)}
                                    className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 cursor-pointer"
                                >
                                    Next Question <FiChevronRight />
                                </button>
                             )}
                         </div>
                    </motion.div>
                </AnimatePresence>
            </section>
        </div>
      </main>

      {/* Warnings & Meta */}
      <div className="max-w-4xl mx-auto px-6 pb-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
             <FiAlertTriangle className="text-orange-400" />
             Do not refresh the page. Your progress will be lost.
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">EduPath Exam Engine v2.0</p>
      </div>

      </div>
      )}

    </div>
  );
};

export default LiveTest;
