import React from "react";
import { FiCheckCircle } from "react-icons/fi";

import logo from "../../assets/logo.png";

const LeftSection = () => {
    return (
        <div className="w-full h-full flex flex-col justify-center px-16 xl:px-24 text-white relative overflow-hidden bg-gradient-to-br from-green-700 via-emerald-700 to-teal-800">
            {/* Background Layers */}
            <div className="absolute inset-0 opacity-20">
                {/* Decorative grid */}
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" opacity="0.4" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>
            {/* Glow blobs */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-400 rounded-full opacity-10 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-400 rounded-full opacity-10 blur-3xl" />

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-xl">
                {/* Logo mark */}
                <div className="mb-12 bg-white/95 px-8 py-4 rounded-[1.5rem] inline-block shadow-2xl backdrop-blur-sm border border-white/20">
                    <img src={logo} alt="Gitakshmi Technologies" className="w-64 lg:w-72 h-auto object-contain" />
                </div>

                {/* Hero Text */}
                <div className="space-y-8">
                    <div>
                        <h1 className="text-5xl xl:text-6xl font-black text-white tracking-tighter leading-[1.05]">
                            Smart CRM &<br />
                            <span className="text-green-300">Project Platform</span>
                        </h1>
                        <p className="mt-8 text-green-50/70 text-lg font-medium leading-relaxed">
                            Streamline your business operations with an all-in-one CRM system designed to manage inquiries, leads, deals, customers, and team collaboration.
                        </p>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default LeftSection;
