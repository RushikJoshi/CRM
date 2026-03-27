import React from "react";
import { FiLayout } from "react-icons/fi";
import logo from "../../assets/logos/edupathpro_logo.png";

const LeftSection = () => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center px-10 text-white relative overflow-hidden bg-gradient-to-br from-[#1e40af] to-[#1e3a8a]">
            {/* Subtle Texture Overlay */}
            <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-blue-400 rounded-full blur-[150px] opacity-20 animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600 rounded-full blur-[120px] opacity-30" />

            <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center">
                {/* Logo Section */}
                <div className="mb-14 flex flex-col items-center">
                    <div className="flex flex-col items-center">
                        <div className="w-28 h-28 bg-white/20 rounded-[2rem] p-5 border border-white/20 backdrop-blur-md mb-10 flex items-center justify-center shadow-2xl">
                            <img src={logo} alt="EduPathpro" className="w-full h-full object-contain" />
                        </div>

                        <div className="relative mb-8">
                            <h1 className="text-[58px] lg:text-[68px] font-black tracking-tighter leading-none text-white poppins flex items-start">
                                EduPath
                                <span className="text-[11px] font-black tracking-[0.2em] bg-white/20 text-white px-2 py-1 rounded-[10px] ml-2 mt-2 uppercase backdrop-blur-sm border border-white/20 shadow-xl">
                                    Pro
                                </span>
                            </h1>
                        </div>
                        </div>
                    </div>


                <p className="text-blue-100 text-lg max-w-md mx-auto leading-relaxed font-medium mb-12">
                    Manage your business easily with simple CRM. Track your leads, deals, and customers all in one place.
                </p>
                
                <div className="flex items-center gap-4 w-full max-w-xs transition-all duration-1000">
                    <div className="h-[1px] flex-1 bg-white/20" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40 whitespace-nowrap px-2">Powered by Gitakshmi Group</span>
                    <div className="h-[1px] flex-1 bg-white/20" />
                </div>
            </div>
        </div>
    );
};

export default LeftSection;
