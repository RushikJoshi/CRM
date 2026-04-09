import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api';
import {
  FiArrowLeft,
  FiArrowRight,
  FiAward,
  FiBarChart2,
  FiCheckCircle,
  FiDownload,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShield,
  FiStar,
  FiTarget,
  FiUser,
  FiZap
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const AssessmentResult = () => {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const scoreData = location.state?.scoreData;

  const [step, setStep] = useState('score'); // score -> lead -> final
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    token
  });

  const { score = 0, totalMarks = 0, showResult, proctoringScore = 100, proctoringStatus } = scoreData || {};
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  const performanceLabel = useMemo(() => {
    if (percentage >= 85) return 'Superior Performance';
    if (percentage >= 60) return 'Great Progress';
    return 'Keep Building Momentum';
  }, [percentage]);

  const stars = useMemo(() => {
    if (percentage >= 85) return 5;
    if (percentage >= 70) return 4;
    if (percentage >= 50) return 3;
    return 2;
  }, [percentage]);

  if (!scoreData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white border border-slate-200 rounded-3xl p-8 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Result not found</h2>
          <p className="text-slate-600 mb-6">Please complete the assessment first.</p>
          <button
            onClick={() => navigate('/')}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-white font-semibold hover:bg-slate-800"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await API.post('/test/public/inquiry/create', {
        ...formData,
        proctoringStatus: proctoringStatus || 'active'
      });
      setStep('final');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not register details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const generateCertificateHtml = () => {
    const name = formData.name?.trim() || 'Candidate';
    const date = new Date().toLocaleDateString();
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Gitakshmi Labs Certificate</title>
  <style>
    body{font-family:Arial,sans-serif;background:#f1f5f9;margin:0;padding:30px}
    .wrap{max-width:1000px;margin:0 auto;background:#fff;border:8px solid #0f172a;border-radius:16px;overflow:hidden}
    .top{background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;padding:28px 36px}
    .title{font-size:42px;font-weight:900;letter-spacing:1px;margin:8px 0}
    .content{padding:40px 36px;color:#0f172a}
    .line{font-size:20px;line-height:1.7}
    .name{font-size:44px;font-weight:900;color:#c2363f;margin:14px 0}
    .badge{margin-top:24px;display:inline-block;padding:10px 16px;background:#f1f5f9;border-radius:999px;font-size:13px;font-weight:700}
    .footer{padding:20px 36px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;display:flex;justify-content:space-between}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div style="font-size:14px;opacity:.8;letter-spacing:2px;text-transform:uppercase">Gitakshmi Labs</div>
      <div class="title">Certificate of Assessment</div>
      <div style="opacity:.8">This certifies completion of a verified online assessment.</div>
    </div>
    <div class="content">
      <div class="line">This is proudly presented to</div>
      <div class="name">${name}</div>
      <div class="line">for successfully completing the exam with a score of <b>${score}/${totalMarks}</b> (${percentage}%).</div>
      <div class="badge">Verification Token: ${token.toUpperCase()}</div>
      <div class="badge" style="margin-left:8px">Proctoring Score: ${proctoringScore}</div>
    </div>
    <div class="footer">
      <span>Date: ${date}</span>
      <span>Gitakshmi Labs | Secure Assessment Engine</span>
    </div>
  </div>
</body>
</html>`;
  };

  const downloadCertificate = () => {
    const html = generateCertificateHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gitakshmi-certificate-${token}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadReport = () => {
    const report = {
      token,
      candidate: {
        name: formData.name || 'Candidate',
        email: formData.email || '',
        phone: formData.phone || '',
        location: formData.location || ''
      },
      result: {
        score,
        totalMarks,
        percentage,
        showResult: !!showResult,
        proctoringScore,
        proctoringStatus: proctoringStatus || 'active'
      },
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gitakshmi-report-${token}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#eef1f5] py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 'score' && (
            <motion.div
              data-testid="result-score-screen"
              key="score"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm"
            >
              <div className="bg-gradient-to-r from-[#0f172a] to-[#1f2a44] text-white p-10 lg:p-14 text-center">
                <div className="mx-auto w-28 h-28 rounded-[1.5rem] bg-white/10 border border-white/20 flex items-center justify-center mb-6">
                  <div>
                    <p className="text-5xl font-black leading-none">{score}</p>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-rose-300 mt-2">Out of {totalMarks}</p>
                  </div>
                </div>
                <h2 className="text-5xl lg:text-6xl font-black italic uppercase leading-none mb-4">{performanceLabel}</h2>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Verification Fingerprint: {token.slice(0, 16).toUpperCase()}</p>
              </div>

              <div className="p-8 lg:p-12 grid md:grid-cols-2 gap-6 items-start">
                <div className="space-y-3">
                  <h3 className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">Performance Insights</h3>

                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-rose-500"><FiTarget /></div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">Accuracy</p>
                      <p className="text-2xl font-black text-slate-900">{percentage}%</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600"><FiZap /></div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">Module Status</p>
                      <p className="text-2xl font-black text-slate-900">Verified</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-amber-500"><FiStar /></div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-slate-500">Rating</p>
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }, (_, i) => (
                          <FiStar key={i} className={i < stars ? 'fill-current' : 'text-slate-300'} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.8rem] bg-rose-50 border border-rose-100 p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-rose-100 mx-auto flex items-center justify-center text-rose-600 shadow-sm mb-4">
                    <FiAward size={28} />
                  </div>
                  <h4 className="text-3xl font-black italic text-slate-900 uppercase mb-3">Official Certificate</h4>
                  <p className="text-slate-600 mb-6">
                    Register your details to unlock certificate download and full performance report.
                  </p>
                  <button
                    data-testid="register-result"
                    onClick={() => setStep('lead')}
                    className="w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 inline-flex items-center justify-center gap-2"
                  >
                    Register Result <FiArrowRight />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'lead' && (
            <motion.div
              data-testid="result-lead-screen"
              key="lead"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm p-8 lg:p-12"
            >
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 mx-auto flex items-center justify-center text-rose-600 mb-4">
                    <FiUser size={28} />
                  </div>
                  <h2 className="text-5xl font-black italic uppercase text-slate-900 mb-2">Register Result</h2>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Unlock Certification And Mentorship</p>
                </div>

                <form data-testid="result-form" onSubmit={handleInquirySubmit} className="space-y-5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] font-semibold text-rose-700 mb-2">Full Name</label>
                    <div className="relative">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        data-testid="result-name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter full name"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.2em] font-semibold text-rose-700 mb-2">Work Email</label>
                      <div className="relative">
                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          data-testid="result-email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="john@example.com"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.2em] font-semibold text-rose-700 mb-2">Phone Number</label>
                      <div className="relative">
                        <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          data-testid="result-phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 XXXXX XXXXX"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] font-semibold text-rose-700 mb-2">Current Location</label>
                    <div className="relative">
                      <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        data-testid="result-location"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="City, State"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
                      />
                    </div>
                  </div>

                  {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

                  <button
                    data-testid="generate-report"
                    disabled={submitting}
                    className="w-full rounded-full bg-[#af1f26] text-white py-4 font-bold uppercase tracking-[0.25em] text-sm hover:bg-[#941b21] disabled:opacity-60"
                  >
                    {submitting ? 'Submitting...' : 'Generate Full Report'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('score')}
                    className="w-full text-slate-400 text-xs uppercase tracking-[0.2em] font-semibold hover:text-slate-700 inline-flex items-center justify-center gap-2"
                  >
                    <FiArrowLeft /> Back To Score Screen
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {step === 'final' && (
            <motion.div
              data-testid="result-final-screen"
              key="final"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 lg:p-12"
            >
              <div className="max-w-3xl mx-auto text-center">
                <div className="w-20 h-20 rounded-[1.6rem] bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5">
                  <FiCheckCircle size={42} />
                </div>

                <h2 className="text-5xl lg:text-6xl font-black italic uppercase text-slate-900 leading-none mb-4">Registration Finalized</h2>
                <p className="text-slate-500 text-xl leading-relaxed mb-9">
                  Your performance report has been securely submitted. You can now download your certificate and report.
                </p>

                <div className="grid sm:grid-cols-3 gap-3">
                  <button
                    data-testid="download-certificate"
                    onClick={downloadCertificate}
                    className="rounded-xl bg-slate-100 border border-slate-200 text-slate-800 py-3 font-semibold hover:bg-slate-200 inline-flex items-center justify-center gap-2"
                  >
                    <FiAward /> Download Certificate
                  </button>

                  <button
                    data-testid="download-report"
                    onClick={downloadReport}
                    className="rounded-xl bg-[#af1f26] text-white py-3 font-semibold hover:bg-[#941b21] inline-flex items-center justify-center gap-2"
                  >
                    <FiDownload /> Download Report
                  </button>

                  <button
                    onClick={() => navigate('/')}
                    className="rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 inline-flex items-center justify-center gap-2"
                  >
                    <FiBarChart2 /> View Analytics
                  </button>
                </div>

                <div className="mt-10">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-rose-300 mb-3">Protocol v2.0 encrypted</p>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 font-semibold">
                    <FiShield className="text-rose-500" /> {token.toUpperCase()}
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
