import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../services/api';
import {
  FiArrowRight,
  FiAward,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiGlobe,
  FiMapPin,
  FiPhone,
  FiPlay,
  FiShield,
  FiTrendingUp,
  FiUsers
} from 'react-icons/fi';
import { FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';

const PublicAssessmentLanding = () => {
  const { companyId, slug } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingCourseId, setStartingCourseId] = useState(null);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        const res = await API.get(`/test/public/assessment/${companyId}/${slug}`);
        setData(res.data.data);
      } catch {
        setError('This assessment portal is unavailable. Please verify your URL and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPortalData();
  }, [companyId, slug]);

  const courses = data?.courses || [];

  const handleStart = async (courseId) => {
    setStartingCourseId(courseId);
    try {
      const res = await API.post('/test/public/start-test', { courseId, companyId });
      navigate(`/assessment/test/${res.data.token}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Assessment could not be started. Please try again.');
    } finally {
      setStartingCourseId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-[#0f4c81] border-t-transparent animate-spin"></div>
          <p className="text-sm font-semibold text-slate-700">Loading assessment portal...</p>
        </div>
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <div className="max-w-lg w-full rounded-2xl bg-white border border-slate-200 p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <FiShield size={26} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Portal Not Available</h2>
          <p className="text-slate-600 mb-6">{error || 'Unable to load this portal.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-slate-900 text-white px-5 py-2.5 font-medium hover:bg-slate-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const methodCards = [
    { title: 'Structured Preparation', desc: 'Follow a guided journey from fundamentals to exam-ready confidence.', icon: <FiBookOpen /> },
    { title: 'Adaptive Difficulty', desc: 'Question complexity scales with performance for realistic practice.', icon: <FiTrendingUp /> },
    { title: 'Trusted Evaluation', desc: 'Secure assessments with consistent scoring and transparent outcomes.', icon: <FiAward /> },
    { title: 'Candidate Safety', desc: 'Built-in proctoring standards keep exams fair and authentic.', icon: <FiShield /> },
    { title: 'Live Progress Tracking', desc: 'Track attempts, completion speed, and consistency over time.', icon: <FiCheckCircle /> },
    { title: 'Career Focused', desc: 'Assessments mapped to practical skills used in modern job roles.', icon: <FiUsers /> }
  ];

  const offices = [
    { country: 'India', city: 'Ahmedabad', address: '701, 7th Floor, Kalvanna, Off C.G. Road, Ahmedabad, Gujarat 380006' },
    { country: 'India', city: 'Mundra', address: '20-22, Punam Arcade, Baroi Road, Mundra, Kachchh, Gujarat 370421' },
    { country: 'USA', city: 'New Jersey', address: '4 Beacon Way, Unit 1711, Jersey City, NJ 07304' },
    { country: 'India', city: 'Kozhikode', address: 'VH Galaxy, 3rd Floor, Kottooli, Kozhikode, Kerala 673016' },
    { country: 'India', city: 'Chennai', address: '1 Pavanar Street, Ashok Nagar, Avadi, Chennai 600062' }
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="w-full px-5 lg:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://gitakshmilabs.com/wp-content/uploads/2025/11/cropped-GItakshmi-Labs-Favicon.png"
              alt="Gitakshmi Labs"
              className="h-10 w-10 rounded"
            />
            <div>
              <h1 className="text-xl font-black tracking-tight text-[#c2363f] leading-none">Gitakshmi Labs</h1>
              <p className="text-[11px] text-slate-500">Assessment Portal</p>
            </div>
          </div>

          <a
            data-testid="browse-assessments"
            href="#assessments"
            className="rounded-full bg-[#c2363f] text-white px-5 py-2 text-xs uppercase tracking-wide font-semibold hover:bg-[#ab2d36]"
          >
            Browse Assessments
          </a>
        </div>
      </header>

      <main className="w-full px-5 lg:px-10 py-6 space-y-6">
        <section className="rounded-2xl overflow-hidden bg-gradient-to-r from-[#c2363f] to-[#b23f52] p-7 lg:p-10 text-white shadow-sm">
          <div className="max-w-4xl">
            <p className="uppercase tracking-[0.2em] text-xs text-white/85 mb-3">Secure Exam Experience</p>
            <h2 className="text-4xl lg:text-6xl font-black leading-[1.05] mb-3">Prepare. Practice. Perform.</h2>
            <p className="text-white/90 max-w-2xl mb-6">
              High-quality skill assessments with modern proctoring standards and a smooth, candidate-first exam flow.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#assessments" className="rounded-full bg-white text-[#c2363f] px-5 py-2.5 font-semibold hover:bg-slate-100">
                Take Free Assessment
              </a>
              <a href="#online-method" className="rounded-full bg-black/20 border border-white/30 text-white px-5 py-2.5 font-semibold hover:bg-black/30">
                Explore Process
              </a>
            </div>
          </div>
        </section>

        <section id="online-method" className="space-y-4">
          <div>
            <h3 className="text-4xl font-black text-[#c2363f] tracking-tight">Why Choose Gitakshmi Labs?</h3>
            <p className="text-slate-600">A complete assessment ecosystem designed for consistent candidate outcomes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {methodCards.map((card) => (
              <div key={card.title} className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-[#c2363f]">
                  {card.icon}
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-2">{card.title}</h4>
                <p className="text-slate-600 text-sm leading-6">{card.desc}</p>
                <div className="mt-4 h-1 w-14 rounded-full bg-emerald-500"></div>
              </div>
            ))}
          </div>
        </section>

        <section id="assessments" className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Assessment Catalog</p>
              <h3 className="text-4xl font-black text-[#c2363f] tracking-tight">Popular Exams & Categories</h3>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="rounded-2xl bg-white border border-dashed border-slate-300 p-10 text-center">
              <p className="text-slate-600">No active assessments are available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div key={course._id} className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm flex flex-col">
                  <div className="h-24 rounded-xl bg-gradient-to-r from-cyan-100 via-sky-100 to-pink-100 border border-slate-100 mb-3 flex items-center justify-center">
                    <span className="text-xl font-black text-slate-700 uppercase">{course.title}</span>
                  </div>

                  <h4 className="text-2xl font-bold text-slate-900 mb-1">{course.title}</h4>
                  <p className="text-sm text-slate-600 flex-1 mb-4">
                    {course.description || 'Practice with secure, objective, and time-bound assessment flow.'}
                  </p>

                  <div className="mb-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                      <FiClock size={12} /> {course.duration} min
                    </span>
                    <span className="text-xs font-semibold text-[#c2363f]">Category</span>
                  </div>

                  <button
                    data-testid={`start-assessment-${course._id}`}
                    onClick={() => handleStart(course._id)}
                    disabled={startingCourseId !== null}
                    className="w-full rounded-lg bg-[#c2363f] text-white py-2.5 font-semibold hover:bg-[#ab2d36] disabled:opacity-60 inline-flex items-center justify-center gap-2"
                  >
                    {startingCourseId === course._id ? 'Starting...' : 'Get Started For Free'} <FiPlay size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid xl:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-200 to-slate-300 min-h-[260px]"></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-4xl font-black text-[#c2363f] tracking-tight mb-4">Why Gitakshmi Labs?</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ['Total Exam Submitted', 'Practice-focused curriculum aligned with job roles.'],
                ['Recent Exam Attendance', 'Mentor-led progression designed for stronger outcomes.'],
                ['How Exam Flow Works', 'Simple steps from category to certificate.'],
                ['Certificate After Exam', 'Validated outcome and score-backed completion.']
              ].map(([title, desc]) => (
                <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-bold text-slate-900 text-sm mb-1">{title}</p>
                  <p className="text-xs text-slate-600 leading-5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-amber-50 to-rose-50 p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c2363f] mb-2">Our Trusted</p>
            <h3 className="text-3xl font-black text-slate-900 mb-2">Partners & Associates</h3>
            <p className="text-slate-600 text-sm">We partner with leading institutions to deliver reliable assessments and support.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300 mb-2">Exam Taker Feedback</p>
            <h3 className="text-3xl font-black mb-2">Real learner reviews</h3>
            <p className="text-slate-200 text-sm">Trusted by candidates across domains and experience levels.</p>
          </div>
        </section>

        <section className="grid lg:grid-cols-2 rounded-2xl overflow-hidden border border-slate-200">
          <div className="bg-[#c2363f] text-white p-7">
            <p className="text-xs uppercase tracking-[0.2em] text-white/80 mb-2">For Queries, Feedback Or Assistance</p>
            <h3 className="text-4xl font-black leading-tight mb-4">Contact Gitakshmi Labs Learner Support</h3>
            <a href="#contact" className="inline-flex items-center gap-2 rounded-full bg-white text-[#c2363f] px-5 py-2.5 font-semibold hover:bg-slate-100">
              Best Of Support With Us <FiArrowRight />
            </a>
          </div>
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 min-h-[220px]"></div>
        </section>

        <section id="contact" className="space-y-4">
          <h3 className="text-4xl font-black text-slate-900 tracking-tight">Our Offices</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {offices.map((office) => (
              <div key={`${office.country}-${office.city}`} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[11px] uppercase tracking-widest text-slate-500">{office.country}</p>
                <p className="text-xl font-bold text-slate-900 mb-1">{office.city}</p>
                <p className="text-sm text-slate-600 flex items-start gap-2"><FiMapPin className="mt-0.5 shrink-0" /> {office.address}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-[#081433] text-white p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                <FiPhone />
              </div>
              <div>
                <p className="font-semibold">Direct support line</p>
                <p className="text-sm text-slate-300">Available during business hours</p>
              </div>
            </div>
            <a href="tel:07949414862" className="rounded-lg bg-[#12a7f4] px-5 py-2.5 font-semibold text-white hover:bg-[#0595de] text-center">
              Call 079-49414862
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-[#070f2a] text-slate-200 mt-8">
        <div className="w-full px-5 lg:px-10 py-10 grid md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-3xl font-black text-white mb-2">Gitakshmi Labs</h4>
            <p className="text-sm text-slate-400">Your trusted exam buddy for complete preparation and performance.</p>
            <div className="flex gap-2 mt-4">
              <a href="#" className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"><FaLinkedin size={14} /></a>
              <a href="#" className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"><FaInstagram size={14} /></a>
              <a href="#" className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20"><FaYoutube size={14} /></a>
            </div>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-2">Popular Categories</h5>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>SAP FICO</li>
              <li>SAP ABAP</li>
              <li>SAP MM</li>
              <li>SAP SD</li>
              <li>Digital Marketing</li>
              <li>Data Analytics</li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-2">Contact Gitakshmi Labs Learner Support</h5>
            <p className="text-sm text-slate-400 flex items-start gap-2 mb-2"><FiMapPin className="mt-0.5" /> 701, 7th Floor, Kalvanna, Off C.G. Road, Ahmedabad</p>
            <p className="text-sm text-slate-400 flex items-center gap-2 mb-2"><FiPhone /> 079-49414862</p>
            <p className="text-sm text-slate-400 flex items-center gap-2"><FiGlobe /> info@gitakshmilabs.com</p>
          </div>
        </div>

        <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">
          Copyright 2018-{new Date().getFullYear()} Gitakshmi Labs. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PublicAssessmentLanding;
