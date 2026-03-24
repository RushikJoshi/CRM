import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { FiClock, FiCheckSquare, FiChevronRight, FiChevronLeft, FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const LiveTest = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [testData, setTestData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTest();
  }, [token]);

  useEffect(() => {
    if (timeLeft > 0) {
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
  }, [timeLeft]);

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
      const res = await API.post('/test/public/submit-test', { token, answers });
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
  );
};

export default LiveTest;
