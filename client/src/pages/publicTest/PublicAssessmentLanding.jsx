import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { 
  FiClock, FiChevronRight, FiShield, FiTrendingUp, 
  FiMapPin, FiPhoneCall, FiBookOpen, FiPlay, FiMonitor,
  FiPhone, FiMail, FiGlobe, FiBriefcase, FiArrowRight, FiSearch
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6">
       <div className="w-16 h-16 border-[6px] border-[#9b1c1c] border-t-transparent rounded-full animate-spin"></div>
       <p className="text-[#9b1c1c] font-bold uppercase tracking-[0.3em] text-xs">Hydrating Gitakshmi Labs...</p>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-10 font-sans">
       <div className="bg-white rounded-[2rem] p-16 text-center shadow-2xl w-full max-w-2xl border border-slate-200">
          <div className="bg-[#9b1c1c]/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
             <FiShield size={48} className="text-[#9b1c1c]" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">Portal Restricted</h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed text-lg">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-[#9b1c1c] text-white px-10 py-4 rounded-xl font-bold hover:bg-[#7f1717] transition-all shadow-lg shadow-[#9b1c1c]/20">Reload Platform</button>
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
    <div className="min-h-screen bg-white font-sans text-[#1a202c] selection:bg-[#9b1c1c] selection:text-white overflow-x-hidden">
      
      {/* ── HEADER NAVIGATION ────────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 w-full z-[100] transition-all duration-300 border-b ${isScrolled ? 'bg-white/95 backdrop-blur-xl border-slate-100 shadow-lg py-3' : 'bg-white border-transparent py-5'}`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
             <div className="flex items-center gap-4 cursor-pointer">
                <img src="https://gitakshmilabs.com/wp-content/uploads/2025/11/cropped-GItakshmi-Labs-Favicon.png" alt="Gitakshmi Logo" className="w-12 h-12 object-contain" />
                <div className="flex flex-col -gap-1">
                    <h2 className="text-2xl font-black tracking-[-0.04em] text-[#9b1c1c] leading-none uppercase">Gitakshmi</h2>
                    <span className="text-[10px] font-black tracking-[0.4em] text-[#2c336b] uppercase ml-1">Labs</span>
                </div>
             </div>
             <div className="hidden lg:flex items-center gap-10">
                <a href="#" className="h-10 px-6 bg-[#9b1c1c] text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#9b1c1c]/20 hover:bg-[#7f1717] transition-all flex items-center gap-2">
                    <FiSearch size={14} strokeWidth={3} /> Browse Courses
                </a>
                <div className="flex items-center gap-8">
                    {["About us", "Courses", "Training Calendar", "Blogs", "Contact us"].map((item, i) => (
                    <a key={i} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-[#9b1c1c] transition-colors relative group">
                        {item}
                        <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#9b1c1c] transition-all group-hover:w-full"></span>
                    </a>
                    ))}
                </div>
                <a href="#assessments" className="bg-[#2c336b] text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#2c336b]/20 hover:shadow-[#2c336b]/40 hover:-translate-y-1 transition-all">
                   Start Free Test
                </a>
             </div>
          </div>
      </header>

      {/* ── 1. HERO SECTION ────────────────────────────────────────────────────── */}
      <section className="relative pt-48 pb-32 lg:pt-64 lg:pb-48 px-6 overflow-hidden bg-[#fafafa]">
         {/* Background Ornaments from reference (Rounded squares) */}
         <div className="absolute top-20 left-10 opacity-5 pointer-events-none">
            <div className="grid grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-20 h-20 border-2 border-slate-900 rounded-xl"></div>
                ))}
            </div>
         </div>
         
         <div className="max-w-6xl mx-auto w-full relative z-10">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="bg-slate-800/90 backdrop-blur-3xl p-12 md:p-24 rounded-[4rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#9b1c1c] rounded-full blur-[150px] opacity-20 -mt-80 -mr-80"></div>
               
               <div className="relative z-10 text-center space-y-10">
                  <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">
                     <FiTrendingUp size={16} /> Professional Training
                  </motion.div>
                  
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.95] tracking-tight max-w-5xl mx-auto italic uppercase">
                    Master the Mern Stack with <span className="text-[#9b1c1c] not-italic drop-shadow-2xl">Gitakshmi Labs.</span>
                  </h1>
                  
                  <p className="text-xl md:text-2xl text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
                    Future-ready assessments and professional training.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-5 justify-center pt-6">
                     <a href="#assessments" className="bg-[#9b1c1c] text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-[#9b1c1c]/40 hover:bg-[#7f1717] hover:scale-105 transition-all flex items-center justify-center gap-3">
                        Take Assessment <FiArrowRight strokeWidth={3} />
                     </a>
                  </div>
               </div>
            </motion.div>
         </div>
      </section>

      {/* ── 2. ACTIVE ASSESSMENTS ─────────────────────────────────────────────── */}
      <section id="assessments" className="py-32 px-6 bg-white relative">
          <div className="max-w-7xl mx-auto space-y-20">
             <div className="text-center space-y-4 max-w-2xl mx-auto">
                 <h2 className="text-[#9b1c1c] font-black uppercase tracking-[0.4em] text-[10px]">Skill Verification</h2>
                 <h3 className="text-5xl font-black text-[#1a202c] tracking-tight">Active Assessments</h3>
                 <div className="w-20 h-[3px] bg-[#9b1c1c] mx-auto mt-4 rounded-full"></div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {courses.length === 0 ? (
                  <div className="col-span-full py-24 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                      <FiMonitor size={48} className="text-slate-300 mx-auto mb-6" />
                      <h4 className="text-xl font-black text-slate-400 tracking-widest uppercase">System ready for deployment</h4>
                  </div>
                ) : (
                  courses.map((course, idx) => (
                    <motion.div 
                       initial="hidden" whileInView="visible" viewport={{ once: true }}
                       variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: idx * 0.1 } } }}
                       key={course._id} 
                       className="bg-[#fafafa] rounded-[3rem] p-10 border border-slate-100/50 shadow-sm hover:shadow-2xl hover:border-[#9b1c1c]/20 transition-all duration-500 flex flex-col group"
                    >
                       <div className="flex justify-between items-start mb-8">
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#2c336b] shadow-xl shadow-[#2c336b]/5 group-hover:bg-[#2c336b] group-hover:text-white transition-all">
                             <FiShield size={32} />
                          </div>
                          <span className="bg-[#9b1c1c] text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-[#9b1c1c]/20 flex items-center gap-1.5">
                             <FiClock size={14} /> {course.duration} MINS
                          </span>
                       </div>
                       
                       <h4 className="text-3xl font-black text-[#1a202c] mb-4 group-hover:text-[#9b1c1c] transition-colors leading-none tracking-tight uppercase">
                          {course.title}
                       </h4>
                       <p className="text-slate-500 text-sm font-medium leading-[1.8] mb-10 flex-1 italic opacity-80">
                          {course.description || "Comprehensive skills assessment for professional growth and validation."}
                       </p>
                       
                       <button 
                         onClick={() => handleStart(course._id)}
                         disabled={startingCourseId !== null}
                         className="w-full bg-[#1a202c] text-white font-black text-[10px] uppercase tracking-[0.2em] py-5 rounded-2xl hover:bg-[#9b1c1c] hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3"
                       >
                         {startingCourseId === course._id ? 'Validating...' : 'Challenge Now'} <FiPlay fill="currentColor" size={12} />
                       </button>
                    </motion.div>
                  ))
                )}
             </div>
          </div>
      </section>

      {/* ── 3. OFFICES / GLOBAL NETWORK ───────────────────────────────────────── */}
      <section id="contact" className="py-32 px-6 bg-[#fafafa]">
         <div className="max-w-7xl mx-auto space-y-20">
            <div className="text-center space-y-4">
                <h3 className="text-4xl md:text-6xl font-black text-[#9b1c1c] uppercase tracking-tight">Gitakshmi Group Offices</h3>
                <div className="w-24 h-[4px] bg-[#9b1c1c] mx-auto opacity-50"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[
                 { title: "Ahmedabad", label: "INDIA", desc: "701, 7th floor, 'Kalvanna', Off C. G. Road, Panchvati, Ahmedabad, Gujarat - 380006.", icon: <FiMapPin /> },
                 { title: "Mundra", label: "INDIA", desc: "20-22, Punam Arcade, Baroi Road, Near Taluka Panchayat, Mundra - Kachchh, Gujarat - 370421.", icon: <FiBriefcase /> },
                 { title: "Mundra", label: "INDIA", desc: "8, Sadguru Plaza, Nana Kapaya, Near Shantivan Colony, Mundra - Kachchh, Gujarat - 370405", icon: <FiMapPin /> },
                 { title: "New Jersey", label: "USA", desc: "4 Beacon Way, Unit 1711, Jersey City, New Jersey, NJ - 07304", icon: <FiGlobe /> },
                 { title: "Kozhikode", label: "INDIA", desc: "VH Galaxy,3rd Floor, Nethaji Nagar,Kottooli, Kozhikode, Kerala 673016", icon: <FiMapPin /> },
                 { title: "Chennai", label: "INDIA", desc: "1 pavanar street, ashok nagar, kovilpathagai,avadi, chennai -600062", icon: <FiMapPin /> }
               ].map((office, i) => (
                 <motion.div 
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, delay: i * 0.05 } } }}
                    key={i} 
                    className="bg-white p-12 rounded-[2.5rem] shadow-sm hover:shadow-2xl border border-slate-100 hover:border-[#9b1c1c]/10 transition-all group relative overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[4rem] group-hover:bg-[#9b1c1c]/5 transition-colors"></div>
                    <div className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        {office.label} <span className="text-[#9b1c1c]">({office.title})</span>
                    </div>
                    <div className="flex items-start gap-4 mb-4">
                        <div className="text-[#9b1c1c] mt-1 shrink-0 group-hover:scale-125 transition-transform">
                            {React.cloneElement(office.icon, { size: 24, strokeWidth: 3 })}
                        </div>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed italic">{office.desc}</p>
                    </div>
                 </motion.div>
               ))}
            </div>

            {/* Direct Line / CTA Card */}
            <div className="text-center pt-24 space-y-6">
                <h3 className="text-4xl font-black text-[#9b1c1c] tracking-tight">Connect with us</h3>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 rounded-[3rem] p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-10 shadow-3xl relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-[#9b1c1c]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center text-white">
                            <FiPhoneCall size={32} />
                        </div>
                        <div className="text-left">
                            <h4 className="text-3xl font-black text-white italic tracking-tight">Direct Support Line</h4>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Available during business hours</p>
                        </div>
                    </div>
                    <a href="tel:07949414862" className="relative z-10 bg-[#2c336b] text-white px-12 py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-[#9b1c1c] hover:scale-105 transition-all shadow-2xl shadow-blue-500/10">
                        Call 079-49414862
                    </a>
                </motion.div>
            </div>
         </div>
      </section>

      {/* ── 4. COURSES GRID ───────────────────────────────────────────────────── */}
      <section id="courses" className="py-32 px-6 bg-white">
         <div className="max-w-7xl mx-auto space-y-20">
            <div className="text-center space-y-4">
                <h2 className="text-[#9b1c1c] font-black uppercase tracking-[0.4em] text-[10px]">Professional Disciplines</h2>
                <h3 className="text-6xl font-black text-[#1a202c] tracking-tighter italic">Explore Our Courses</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
               {staticCourses.map((course, i) => (
                  <motion.div 
                     initial="hidden" whileInView="visible" viewport={{ once: true }}
                     variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.3, delay: i * 0.05 } } }}
                     key={i} 
                     className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:border-[#9b1c1c]/30 hover:scale-105 transition-all flex flex-col items-center justify-center text-center gap-4 group cursor-pointer"
                  >
                     <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-[#9b1c1c] group-hover:bg-[#9b1c1c] group-hover:text-white transition-all shadow-inner">
                        <FiBookOpen size={24} />
                     </div>
                     <span className="font-black text-[10px] uppercase tracking-widest text-[#1a202c] group-hover:text-[#9b1c1c]">{course}</span>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* ── 5. FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-white pt-32 pb-16 px-6 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[#9b1c1c] rounded-full blur-[200px] opacity-10 -mb-[400px] -mr-[400px]"></div>
          
          <div className="max-w-7xl mx-auto relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-24">
                  {/* Column 1: Multi-Color Logo Section */}
                  <div className="space-y-8">
                      <div className="flex flex-col">
                          <h4 className="text-3xl font-black tracking-tighter text-[#9b1c1c] uppercase leading-none">Gitakshmi</h4>
                          <span className="text-xs font-black tracking-[0.5em] text-white uppercase mt-1">Labs</span>
                      </div>
                      <p className="text-slate-400 text-sm font-medium leading-relaxed italic">
                         Building future-ready tech leaders through industry-standard professional training and assessments.
                      </p>
                      <div className="flex items-center gap-4">
                         <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-[#9b1c1c] transition-all"><FaLinkedin size={20} /></a>
                         <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-[#9b1c1c] transition-all"><FaInstagram size={20} /></a>
                         <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-red-600 transition-all"><FaYoutube size={20} /></a>
                      </div>
                  </div>

                  {/* Column 2: Quick Links */}
                  <div className="space-y-8">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#9b1c1c]">Quick Links</h4>
                      <ul className="space-y-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
                          <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
                          <li><a href="#about-us" className="hover:text-white transition-colors">About Us</a></li>
                          <li><a href="#courses" className="hover:text-white transition-colors">Courses</a></li>
                          <li><a href="#contact-us" className="hover:text-white transition-colors">Contact</a></li>
                      </ul>
                  </div>

                  {/* Column 3: Contact Details */}
                  <div className="space-y-8">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#9b1c1c]">Reach Us</h4>
                      <ul className="space-y-6">
                          <li className="flex items-start gap-4">
                             <FiMapPin className="mt-1 text-[#9b1c1c] shrink-0" size={18} strokeWidth={3} />
                             <span className="text-slate-400 text-sm font-medium">701, 7th floor, "Kalvanna", Off C. G. Road, Panchvati, Ahmedabad, Gujarat</span>
                          </li>
                          <li className="flex items-center gap-4 text-slate-400 font-black text-xs italic tracking-tight">
                             <FiPhone className="text-[#9b1c1c]" strokeWidth={3} />
                             079-49414862
                          </li>
                          <li className="flex items-center gap-4 text-slate-400 font-medium text-xs truncate">
                             <FiMail className="text-[#9b1c1c]" strokeWidth={3} />
                             info@gitakshmilabs.com
                          </li>
                      </ul>
                  </div>

                  {/* Column 4: Location Info */}
                  <div className="space-y-8">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-[#9b1c1c]">Global Presence</h4>
                      <p className="text-slate-400 text-sm font-medium italic leading-relaxed">
                         Operating natively out of Gujarat, Kerala, and extending expert services across New Jersey, USA.
                      </p>
                      <div className="pt-6 border-t border-white/5 mt-6 inline-block text-[9px] font-black text-slate-600 uppercase tracking-widest">
                         ISO CERTIFIED INSTITUTE
                      </div>
                  </div>
              </div>

              {/* Bottom Copyright */}
              <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-50 italic">
                  <p className="text-slate-500 text-xs">
                     Copyright 2018-{new Date().getFullYear()} Gitakshmi Group. All Rights Reserved.
                  </p>
                  <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest">
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
