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
                        <div className="w-20 h-20 bg-white/20 rounded-3xl p-4 border border-white/20 backdrop-blur-md mb-8 flex items-center justify-center shadow-2xl">
                            <img src={logo} alt="EduPathpro" className="w-full h-full object-contain" />
                        </div>

                        <div className="flex flex-col items-center gap-1 mb-6">
                            <h1 className="text-[58px] font-black tracking-tighter leading-none text-white poppins">EduPath</h1>
                            <span className="text-[20px] font-black tracking-[0.25em] text-white/90 uppercase poppins -mt-1">Pro</span>
                        </div>

                        <div className="flex items-center gap-3 w-full mb-2">
                            <div className="h-[2px] flex-1 bg-white/30" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/70 whitespace-nowrap px-2">Powered by Gitakshmi Group</span>
                            <div className="h-[2px] flex-1 bg-white/30" />
                        </div>
                    </div>
                </div>

                {/* <h1 className="text-[72px] font-black tracking-tighter leading-tight mb-8 text-white poppins drop-shadow-sm"> */}

                {/* </h1> */}

                <p className="text-blue-100 text-lg max-w-md mx-auto leading-relaxed font-medium">
                    Manage your business easily with simple CRM. Track your leads, deals, and customers all in one place.
                </p>

                <div className="mt-16 w-16 h-1 bg-white/20 rounded-full" />
            </div>
        </div>
    );
};

export default LeftSection;
