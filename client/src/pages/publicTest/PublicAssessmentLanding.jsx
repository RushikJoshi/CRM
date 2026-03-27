import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { 
  FiClock, FiChevronRight, FiShield, FiTrendingUp, 
  FiMapPin, FiPhoneCall, FiBookOpen, FiPlay, FiMonitor,
  FiPhone, FiMail, FiGlobe, FiBriefcase, FiArrowRight
} from 'react-icons/fi';
import { FaLinkedin, FaInstagram, FaYoutube } from 'react-icons/fa';
import { motion } from 'framer-motion';

const PublicAssessmentLanding = () => {
  const { companyId, slug } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingCourseId, setStartingCourseId] = useState(null);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    fetchPortalData();
    
    const handleScroll = () => {
       setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    setStartingCourseId(courseId);
    try {
      const res = await API.post('/test/public/start-test', { courseId, companyId });
      navigate(`/assessment/test/${res.data.token}`);
    } catch (err) {
      alert(err.response?.data?.message || "Assessment could not be started. Please try again later.");
    } finally {
      setStartingCourseId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1a202c] flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-[6px] border-[#6b46c1] border-t-transparent rounded-full animate-spin"></div>
       <p className="text-[#6b46c1] font-bold uppercase tracking-[0.3em] text-xs">Loading Gitakshmi Labs...</p>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#1a202c] flex items-center justify-center p-10 font-sans">
       <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-16 text-center shadow-2xl w-full max-w-2xl border border-white/20">
          <div className="bg-[#6b46c1]/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
             <FiShield size={48} className="text-[#6b46c1]" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Portal Restricted</h2>
          <p className="text-slate-300 font-medium mb-10 leading-relaxed text-lg">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-[#6b46c1] text-white px-10 py-4 rounded-xl font-bold hover:bg-[#553c9a] transition-all shadow-lg shadow-[#6b46c1]/40">Reload Platform</button>
       </div>
    </div>
  );

  const { page, courses } = data;

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const staticCourses = [
    "SAP FICO", "SAP ABAP", "SAP MM", "SAP SD", "SAP HANA", "SAP SAC", 
    "Digital Marketing", "Graphic Designing", "AI & Automation", "Data Analyst/Data Science"
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-[#1a202c] selection:bg-[#6b46c1] selection:text-white overflow-x-hidden border-t-4 border-[#6b46c1]">
      
      {/* ── HEADER NAVIGATION ────────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 ${isScrolled ? 'backdrop-blur-xl bg-white/95 border-b border-slate-100 shadow-sm py-4' : 'bg-transparent py-6'}`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
             <div className="flex items-center gap-4 cursor-pointer">
                <img src="https://gitakshmilabs.com/wp-content/uploads/2025/11/cropped-GItakshmi-Labs-Favicon.png" alt="Gitakshmi Logo" className={`w-12 h-12 rounded-xl object-contain drop-shadow-lg p-1 transition-all ${isScrolled ? 'bg-slate-100' : 'bg-white/10'}`} />
                <h2 className={`text-xl font-black tracking-tight ${isScrolled ? 'text-[#1a202c]' : 'text-white md:text-[#1a202c]'}`}>Gitakshmi Labs</h2>
             </div>
             <div className="hidden lg:flex items-center gap-8">
                {["About", "Courses", "Blogs", "Contact"].map((item, i) => (
                  <a key={i} href={`#${item.toLowerCase()}`} className={`text-sm font-bold uppercase tracking-wider transition-all border-b-2 border-transparent hover:border-[#6b46c1] hover:text-[#6b46c1] pb-1 ${isScrolled ? 'text-[#4A5568]' : 'text-slate-200 md:text-[#4A5568]'}`}>
                    {item}
                  </a>
                ))}
                <a href="#assessments" className="bg-[#6b46c1] text-white px-7 py-3 rounded-xl text-sm font-bold shadow-lg shadow-[#6b46c1]/30 hover:shadow-[#6b46c1]/60 hover:-translate-y-1 transition-all border border-[#6b46c1]/50">
                   Start Free Test
                </a>
             </div>
          </div>
      </header>

      {/* ── 1. HERO SECTION ────────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-32 lg:pt-56 lg:pb-48 px-6 overflow-hidden bg-[#1a202c] flex items-center min-h-[85vh]">
         {/* Background Ornaments */}
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#6b46c1] rounded-full blur-[150px] opacity-25 pointer-events-none -mt-[300px] -mr-[300px]"></div>
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[150px] opacity-15 pointer-events-none -mb-[300px] -ml-[300px]"></div>
         
         <div className="max-w-5xl mx-auto w-full relative z-10 text-center">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-10 flex flex-col items-center">
               
               <motion.div variants={fadeUp} className="bg-white/10 backdrop-blur-2xl border border-white/20 p-10 md:p-16 rounded-[3rem] shadow-2xl w-full">
                 <div className="inline-flex items-center gap-2 bg-[#6b46c1]/20 text-purple-300 border border-[#6b46c1]/30 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
                    <FiTrendingUp size={16} /> Professional Training
                 </div>
                 
                 <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight drop-shadow-md max-w-4xl mx-auto">
                   Master the Mern Stack with <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-[#6b46c1]">Gitakshmi Labs.</span>
                 </h1>
                 
                 <p className="text-xl md:text-2xl text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto mt-8">
                   Future-ready assessments and professional training.
                 </p>

                 <div className="flex flex-col sm:flex-row gap-5 justify-center pt-10">
                    <a href="#assessments" className="bg-[#6b46c1] text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-xl shadow-[#6b46c1]/40 hover:bg-[#553c9a] hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                       Take Assessment <FiArrowRight />
                    </a>
                 </div>
               </motion.div>

            </motion.div>
         </div>
      </section>

      {/* ── 2. ACTIVE ASSESSMENTS (Directly below Hero) ────────────────────── */}
      <section id="assessments" className="py-24 px-6 bg-slate-50 border-t border-slate-100 relative -mt-10 rounded-t-[3rem] z-20">
          <div className="max-w-7xl mx-auto space-y-16">
             <div className="text-center space-y-4 max-w-2xl mx-auto">
                 <h2 className="text-[#6b46c1] font-black uppercase tracking-widest text-sm">Skill Verification</h2>
                 <h3 className="text-4xl font-black text-[#1a202c]">Active Assessments</h3>
                 <p className="text-slate-500 text-lg">Challenge your knowledge with our dynamic online examination platform.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.length === 0 ? (
                  <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
                      <FiMonitor size={40} className="text-slate-300 mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-slate-900 mb-2">No Active Tests</h4>
                      <p className="text-slate-500 max-w-sm mx-auto">The administrator has not configured any tests for this portal yet.</p>
                  </div>
                ) : (
                  courses.map((course, idx) => (
                    <motion.div 
                       initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
                       variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: idx * 0.1 } } }}
                       key={course._id} 
                       className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden flex flex-col group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
                    >
                       {/* Purple Gradient Header for Assessment Cards */}
                       <div className="bg-gradient-to-r from-[#6b46c1] to-[#553c9a] p-8 relative overflow-hidden">
                           <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] opacity-10 mix-blend-overlay group-hover:scale-110 transition-transform duration-700"></div>
                           <div className="relative z-10 flex justify-between items-center">
                              <div className="bg-white/20 backdrop-blur p-3 rounded-xl border border-white/30 text-white shadow-inner">
                                 <FiShield size={24} />
                              </div>
                              <span className="bg-white text-[#6b46c1] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                                 <FiClock size={12} /> {course.duration} MINS
                              </span>
                           </div>
                       </div>
                       
                       <div className="p-8 flex flex-col flex-1">
                           <h4 className="text-2xl font-black text-[#1a202c] mb-3 group-hover:text-[#6b46c1] transition-colors tracking-tight">
                              {course.title}
                           </h4>
                           <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1">
                              {course.description || "Comprehensive skills assessment for professional growth and validation."}
                           </p>
                           <button 
                             onClick={() => handleStart(course._id)}
                             disabled={startingCourseId !== null}
                             className="w-full bg-[#1a202c] text-white font-bold py-4 rounded-xl hover:bg-[#6b46c1] hover:shadow-lg hover:shadow-[#6b46c1]/40 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
                           >
                             {startingCourseId === course._id ? 'Authenticating...' : 'Challenge Now'} <FiPlay fill="currentColor" size={14} />
                           </button>
                       </div>
                    </motion.div>
                  ))
                )}
             </div>
          </div>
      </section>

      {/* ── 3. OFFICES / GLOBAL PRESENCE ──────────────────────────────────────── */}
      <section id="contact" className="py-24 px-6 bg-white relative">
         <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
                <h2 className="text-[#6b46c1] font-black uppercase tracking-[0.2em] text-sm">Our Network</h2>
                <h3 className="text-4xl font-black text-[#1a202c]">Global Presence</h3>
                <p className="text-slate-500 text-lg">Visit us at any of our state-of-the-art facilities or call us directly.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[
                 { title: "Ahmedabad", desc: "701, 7th floor, 'Kalvanna', Off C. G. Road, Panchvati, Ahmedabad, Gujarat - 380006.", icon: <FiMapPin /> },
                 { title: "Mundra (Main)", desc: "20-22, Punam Arcade, Baroi Road, Near Taluka Panchayat, Mundra - Kachchh, Gujarat - 370421.", icon: <FiBriefcase /> },
                 { title: "Chennai", desc: "Strategic operational hub serving the South India region from Chennai, Tamil Nadu.", icon: <FiMapPin /> },
                 { title: "New Jersey", desc: "International presence catering to global clients from New Jersey, United States.", icon: <FiGlobe /> },
                 { title: "Kozhikode", desc: "Regional center in Kozhikode, Kerala, supporting academic and training operations.", icon: <FiMapPin /> }
               ].map((office, i) => (
                 <motion.div 
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
                    variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5, delay: i * 0.1 } } }}
                    key={i} 
                    className="bg-slate-50 p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 group flex flex-col items-center text-center"
                 >
                    <div className="w-16 h-16 bg-[#6b46c1]/10 rounded-2xl flex items-center justify-center text-[#6b46c1] mb-8 group-hover:scale-110 group-hover:bg-[#6b46c1] group-hover:text-white transition-all duration-300 shadow-inner">
                       {React.cloneElement(office.icon, { size: 28 })}
                    </div>
                    <h4 className="text-2xl font-black text-[#1a202c] mb-4">{office.title}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed flex-1 max-w-xs">{office.desc}</p>
                 </motion.div>
               ))}
            </div>

            {/* Direct Line Call Now Card */}
            <motion.div 
               initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
               className="bg-gradient-to-r from-[#1a202c] to-[#2d3748] rounded-[2rem] p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl overflow-hidden relative"
            >
               <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#6b46c1] rounded-full blur-[100px] opacity-30 pointer-events-none -mt-32 -mr-32"></div>
               <div className="relative z-10 flex items-center gap-6 mb-6 md:mb-0">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-inner animate-pulse">
                     <FiPhoneCall size={32} />
                  </div>
                  <div>
                     <h4 className="text-2xl font-black text-white">Direct Support Line</h4>
                     <p className="text-slate-400 font-medium">Available during business hours</p>
                  </div>
               </div>
               <a href="tel:07949414862" className="relative z-10 bg-[#6b46c1] text-white px-10 py-5 rounded-2xl font-black text-xl hover:bg-[#553c9a] hover:scale-105 transition-all shadow-xl shadow-[#6b46c1]/40 flex items-center gap-3 w-full md:w-auto justify-center">
                  Call 079-49414862
               </a>
            </motion.div>
         </div>
      </section>

      {/* ── 4. COURSES GRID (Static Catalog) ──────────────────────────────────── */}
      <section id="courses" className="py-24 px-6 bg-slate-50 border-t border-slate-100">
         <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h2 className="text-[#6b46c1] font-black uppercase tracking-widest text-sm">Professional Disciplines</h2>
                <h3 className="text-4xl font-black text-[#1a202c]">Explore Our Courses</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
               {staticCourses.map((course, i) => (
                  <motion.div 
                     initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
                     variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.3, delay: i * 0.05 } } }}
                     key={i} 
                     className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-[#6b46c1]/50 transition-all flex flex-col items-center justify-center text-center gap-3 group cursor-pointer"
                  >
                     <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-[#6b46c1] group-hover:bg-[#6b46c1] group-hover:text-white transition-colors">
                        <FiBookOpen />
                     </div>
                     <span className="font-bold text-sm text-[#1a202c]">{course}</span>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* ── 5. FOOTER (4-Column Layout) ──────────────────────────────────────── */}
      <footer className="bg-[#1a202c] text-white pt-24 pb-12 px-6 border-t border-[#6b46c1]/50">
          <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                  {/* Column 1: About */}
                  <div className="space-y-6">
                      <div className="flex items-center gap-3">
                         <img src="https://gitakshmilabs.com/wp-content/uploads/2025/11/cropped-GItakshmi-Labs-Favicon.png" alt="Gitakshmi Logo" className="w-10 h-10 rounded-lg bg-white/10 p-1 object-contain" />
                         <h4 className="text-lg font-black tracking-wide">Gitakshmi Labs</h4>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                         Building future-ready tech leaders through industry-standard professional training and assessments.
                      </p>
                      <div className="flex items-center gap-4 pt-2">
                         <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#6b46c1] transition-colors"><FaLinkedin size={18} /></a>
                         <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#6b46c1] transition-colors"><FaInstagram size={18} /></a>
                         <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-600 transition-colors"><FaYoutube size={18} /></a>
                      </div>
                  </div>

                  {/* Column 2: Quick Links */}
                  <div className="space-y-6">
                      <h4 className="text-md font-bold uppercase tracking-widest text-[#6b46c1]">Quick Links</h4>
                      <ul className="space-y-3 text-sm font-medium text-slate-300">
                          <li><a href="#" className="hover:text-white transition-colors hover:pl-1">Home</a></li>
                          <li><a href="#about" className="hover:text-white transition-colors hover:pl-1">About Us</a></li>
                          <li><a href="#courses" className="hover:text-white transition-colors hover:pl-1">Courses</a></li>
                          <li><a href="#contact" className="hover:text-white transition-colors hover:pl-1">Contact</a></li>
                      </ul>
                  </div>

                  {/* Column 3: Contact */}
                  <div className="space-y-6">
                      <h4 className="text-md font-bold uppercase tracking-widest text-[#6b46c1]">Reach Us</h4>
                      <ul className="space-y-4 text-sm font-medium text-slate-300">
                          <li className="flex items-start gap-3">
                             <FiMapPin className="mt-1 text-[#6b46c1] shrink-0" />
                             <span className="leading-relaxed">701, 7th floor, "Kalvanna", Off C. G. Road, Panchvati, Ahmedabad, Gujarat</span>
                          </li>
                          <li className="flex items-center gap-3">
                             <FiPhone className="text-[#6b46c1] shrink-0" />
                             <span>079-49414862</span>
                          </li>
                          <li className="flex items-center gap-3">
                             <FiMail className="text-[#6b46c1] shrink-0" />
                             <span>info@gitakshmilabs.com</span>
                          </li>
                      </ul>
                  </div>

                  {/* Column 4: Newsletter / Global */}
                  <div className="space-y-6">
                      <h4 className="text-md font-bold uppercase tracking-widest text-[#6b46c1]">Global Presence</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                         Operating natively out of Gujarat, Kerala, and extending expert services across New Jersey, USA.
                      </p>
                      <div className="pt-4 border-t border-white/10 mt-6 inline-block text-xs font-bold text-slate-500 uppercase tracking-widest">
                         ISO Certified Institute
                      </div>
                  </div>
              </div>

              {/* Legal & Copyright */}
              <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                  <p className="text-slate-500 text-sm font-medium">
                     Copyright 2018-{new Date().getFullYear()} Gitakshmi Group. All Rights Reserved.
                  </p>
                  <div className="flex gap-6 text-sm font-medium text-slate-500">
                     <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                     <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                  </div>
              </div>
          </div>
      </footer>
      
    </div>
  );
};

export default PublicAssessmentLanding;
