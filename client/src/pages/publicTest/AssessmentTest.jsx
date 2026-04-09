import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import {
  FiClock,
  FiCheckSquare,
  FiChevronRight,
  FiChevronLeft,
  FiAlertTriangle,
  FiMonitor,
  FiArrowRight,
  FiCamera,
  FiActivity,
  FiShield,
  FiCheckCircle,
  FiList
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
  const [hardwareVerifying, setHardwareVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isProctoringStarted, setIsProctoringStarted] = useState(false);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [proctoringStream, setProctoringStream] = useState(null);
  const [proctoringStatus, setProctoringStatus] = useState('not_requested');
  const [resetting, setResetting] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState('');

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
    if (isExamStarted && !isPaused && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
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
  }, [isExamStarted, isPaused, timeLeft]);

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
      setProctoringStatus('active');

      setTimeout(() => {
        const video = document.getElementById('pre-exam-preview');
        if (video) {
          video.srcObject = stream;
          video.play();
        }
      }, 100);

      enterFullscreen();
    } catch (error) {
      console.error('Hardware Permission Error:', error);
      if (error.message === 'Permission denied') {
        setProctoringStatus('denied');
        alert('CRITICAL: Camera/Microphone access is REQUIRED for this assessment. Please enable permissions in your browser settings and reload.');
      } else if (error.message === 'Camera not supported') {
        setProctoringStatus('not_supported');
        alert('This browser/device does not support the required proctoring hardware. Please use a modern browser (Chrome/Edge) with a camera.');
      } else {
        alert('Could not initialize security hardware. Please ensure your camera is connected and you are using a secure (HTTPS) connection.');
      }
    } finally {
      setHardwareVerifying(false);
    }
  };

  const startProctoring = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Hardware access not supported');
    }
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true
      });
    } catch (error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Permission denied');
      }
      throw new Error('Unknown media error');
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
      navigate(`/assessment/result/${token}`, { state: { scoreData: res.data.data } });
    } catch (err) {
      alert('Submission failed. Please check your connection.');
      setSubmitting(false);
    }
  };

  const handleSecurityReset = () => {
    setResetting(true);
    setTimeout(() => {
      setCurrentIndex(0);
      setAnswers({});
      setSessionKey((prev) => prev + 1);
      setResetting(false);
    }, 4000);
  };

  const handleWarningAction = (message) => {
    setPauseReason(message || 'Violation detected. Please review and continue when ready.');
    setIsPaused(true);
  };

  const handleResumeExam = () => {
    setIsPaused(false);
    enterFullscreen();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-[6px] border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sky-700 font-semibold uppercase tracking-[0.2em] text-xs">Preparing assessment workspace...</p>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQuestion = testData.questions[currentIndex];
  const progress = ((currentIndex + 1) / testData.questions.length) * 100;
  const attemptedCount = Object.keys(answers).length;
  const pendingCount = testData.questions.length - attemptedCount;

  return (
    <div className="h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-sky-200 selection:text-slate-900">
      <ProctoringOverlay
        key={sessionKey}
        token={token}
        stream={proctoringStream}
        isStarted={isProctoringStarted}
        proctoringStatus={proctoringStatus}
        onLimitReached={() => handleSecurityReset()}
        onWarningAction={handleWarningAction}
      />

      <AnimatePresence>
        {resetting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-slate-950/95 text-white flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="max-w-2xl">
              <div className="w-28 h-28 bg-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-amber-300/40 animate-pulse">
                <FiAlertTriangle size={54} strokeWidth={2.8} className="text-amber-300" />
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold mb-4 leading-tight">Security protocol triggered</h1>
              <p className="text-base lg:text-lg text-slate-200 mb-8">
                Multiple violations were detected. Session is being synchronized and restarted from question 1.
              </p>
              <div className="flex items-center justify-center gap-3 text-sm font-semibold tracking-wide uppercase text-slate-100">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-transparent rounded-full animate-spin"></div>
                Re-authenticating session
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isExamStarted && (
        <div className="fixed inset-0 z-[200] bg-gradient-to-b from-sky-50 via-white to-slate-50 flex items-center justify-center p-4 lg:p-8 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-6xl bg-white rounded-3xl border border-slate-200 shadow-xl p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900">
                    <FiList /> Exam Details
                  </h2>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-white border border-slate-200 p-3">
                      <p className="text-slate-500 text-xs">Questions</p>
                      <p className="text-xl font-bold">{testData.questions.length}</p>
                    </div>
                    <div className="rounded-xl bg-white border border-slate-200 p-3">
                      <p className="text-slate-500 text-xs">Duration</p>
                      <p className="text-xl font-bold">{Math.max(1, Math.ceil(timeLeft / 60))} min</p>
                    </div>
                    <div className="rounded-xl bg-white border border-slate-200 p-3 col-span-2">
                      <p className="text-slate-500 text-xs">Session ID</p>
                      <p className="text-base font-semibold tracking-wide">{token.slice(0, 12).toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                {isProctoringStarted ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <p className="font-semibold flex items-center gap-2 mb-2"><FiCheckCircle /> Hardware verified successfully</p>
                    <p>Camera and microphone are active. Keep your face visible throughout the exam.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-semibold flex items-center gap-2 mb-2"><FiShield /> Verification required</p>
                    <p>You must allow camera and microphone access before starting this assessment.</p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-3 space-y-5">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900">Ready to begin your assessment?</h1>
                  <p className="text-sm text-slate-600 mt-1">Please review instructions carefully before starting.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <FiCamera className="text-sky-600 mt-0.5" />
                    <p>Face detection remains active for full exam duration.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiActivity className="text-sky-600 mt-0.5" />
                    <p>Tab switching and full-screen exit attempts are recorded as violations.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <FiClock className="text-sky-600 mt-0.5" />
                    <p>Timer starts once the exam opens and auto-submits on timeout.</p>
                  </div>
                </div>

                {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                    Secure HTTPS is required for camera/microphone access on this domain.
                  </div>
                )}

                {isProctoringStarted && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video max-w-md">
                    <video id="pre-exam-preview" autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  {!isProctoringStarted ? (
                    <button
                      data-testid="verify-hardware"
                      onClick={handleStartExam}
                      disabled={hardwareVerifying}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-700 text-white font-semibold hover:bg-sky-800 transition disabled:opacity-60"
                    >
                      {hardwareVerifying ? 'Verifying hardware...' : 'Verify Camera & Mic'}
                    </button>
                  ) : (
                    <button
                      data-testid="start-exam"
                      onClick={() => setIsExamStarted(true)}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-2"
                    >
                      Start Examination <FiArrowRight />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {isExamStarted && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="h-full flex flex-col overflow-hidden">
          {isPaused && (
            <div className="fixed inset-0 z-[350] bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Exam paused due to violation</h3>
                <p className="text-sm text-slate-600 mb-5">{pauseReason}</p>
                <button
                  data-testid="resume-exam"
                  onClick={handleResumeExam}
                  className="w-full px-4 py-3 rounded-xl bg-sky-700 text-white font-semibold hover:bg-sky-800 transition"
                >
                  Resume Exam
                </button>
              </div>
            </div>
          )}
          <header className="bg-white border-b border-slate-200 z-50 shrink-0">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 h-20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <FiMonitor size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold tracking-wide uppercase text-slate-900">Digital Examination</h2>
                  <p className="text-xs text-slate-500 truncate">Session: {token.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>

              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${timeLeft < 300 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                <FiClock className={timeLeft < 300 ? 'text-rose-500' : 'text-slate-400'} />
                <span className="font-bold text-lg tabular-nums">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <div className="h-1 bg-slate-100">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-sky-600" />
            </div>
          </header>

          <main className="flex-1 overflow-hidden pb-16">
            <div className="max-w-7xl mx-auto h-full px-4 lg:px-6 py-4 lg:py-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-full">
                <aside className="lg:col-span-3 h-full">
                  <div className="h-full bg-white border border-slate-200 rounded-2xl p-4 flex flex-col">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Exam Instructions</h3>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 text-xs text-slate-700 mb-4">
                      <p>1. Keep your face visible in camera frame.</p>
                      <p>2. Do not switch tabs or exit fullscreen.</p>
                      <p>3. Choose one option and move to next question.</p>
                      <p>4. Use Finish button only after final review.</p>
                    </div>

                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Question Navigator</h4>
                    <div className="grid grid-cols-6 lg:grid-cols-4 gap-2 pb-4 border-b border-slate-100 overflow-y-auto">
                      {testData.questions.map((q, i) => (
                        <button
                          data-testid={`question-nav-${i}`}
                          key={i}
                          onClick={() => setCurrentIndex(i)}
                          disabled={isPaused}
                          className={`h-10 rounded-lg text-sm font-semibold transition ${
                            i === currentIndex
                              ? 'bg-sky-600 text-white'
                              : answers[q._id]
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          } ${isPaused ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <div className="pt-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Current</span>
                        <span className="font-semibold text-slate-900">{currentIndex + 1}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Attempted</span>
                        <span className="font-semibold text-emerald-700">{attemptedCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Pending</span>
                        <span className="font-semibold text-amber-700">{pendingCount}</span>
                      </div>
                    </div>
                  </div>
                </aside>

                <section className="lg:col-span-9 h-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="h-full bg-white border border-slate-200 rounded-2xl p-4 lg:p-6 flex flex-col"
                    >
                      <h2 className="text-xl lg:text-3xl font-bold leading-snug mb-5 text-slate-900">
                        {currentIndex + 1}. {currentQuestion.question}
                      </h2>

                      <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                        {currentQuestion.options.map((opt, i) => {
                          const selected = answers[currentQuestion._id] === opt;
                          return (
                            <button
                              data-testid={`answer-option-${i}`}
                              key={i}
                              onClick={() => handleSelect(opt)}
                              disabled={isPaused}
                              className={`w-full text-left p-4 lg:p-5 rounded-xl border transition flex items-center gap-4 ${
                                selected
                                  ? 'bg-sky-50 border-sky-300'
                                  : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                              } ${isPaused ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold shrink-0 ${selected ? 'bg-sky-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                                {String.fromCharCode(65 + i)}
                              </div>
                              <span className={`text-base lg:text-lg ${selected ? 'text-sky-900 font-semibold' : 'text-slate-700'}`}>{opt}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                        <button
                          data-testid="previous-question"
                          onClick={() => setCurrentIndex((prev) => prev - 1)}
                          disabled={currentIndex === 0 || isPaused}
                          className="px-4 py-2.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <FiChevronLeft /> Previous
                        </button>

                        {currentIndex === testData.questions.length - 1 ? (
                          <button
                            data-testid="submit-exam"
                            onClick={handleSubmit}
                            disabled={submitting || isPaused}
                            className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-60 flex items-center gap-2"
                          >
                            {submitting ? 'Submitting...' : 'Finish & Submit'} <FiCheckSquare />
                          </button>
                        ) : (
                          <button
                            data-testid="next-question"
                            onClick={() => setCurrentIndex((prev) => prev + 1)}
                            disabled={isPaused}
                            className="px-5 py-2.5 rounded-lg bg-sky-700 text-white hover:bg-sky-800 transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            Next <FiChevronRight />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </section>
              </div>
            </div>
          </main>

          <footer className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 z-[200]">
            <div className="max-w-7xl mx-auto py-2.5 px-4 lg:px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-100 text-[11px] md:text-xs">
                <FiAlertTriangle className="text-amber-400" />
                <span className="hidden sm:inline">Session locked. Do not refresh or exit during the exam.</span>
                <span className="sm:hidden">Session locked.</span>
              </div>
              <p className="text-slate-400 text-[10px] uppercase tracking-wider hidden md:block">Secure mode active</p>
            </div>
          </footer>
        </motion.div>
      )}
    </div>
  );
};

export default AssessmentTest;
