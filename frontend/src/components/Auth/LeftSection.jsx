import React from "react";
import { FiCheckCircle } from "react-icons/fi";

import logo from "../../assets/tech logo white.png";

const LeftSection = () => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center px-16 xl:px-24 text-white text-center relative overflow-hidden bg-gradient-to-br from-green-700 via-emerald-700 to-teal-800">
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
            <div className="relative z-10 w-full max-w-xl flex flex-col items-center">
                {/* Logo mark */}
                <div className="mb-12 flex justify-center">
                    <img src={logo} alt="Gitakshmi Technologies" className="w-64 lg:w-72 h-auto object-contain" />
                </div>

                {/* Hero Text */}
                <div className="space-y-8 w-full">
                    <div>
                        <h1 className="text-5xl xl:text-6xl font-black text-white tracking-tighter leading-[1.05]">
                            Smart CRM <br />
                        </h1>
                        <p className="mt-8 text-green-50/70 text-lg font-medium leading-relaxed mx-auto max-w-md">
                            Manage your business easily with our simple CRM. Track your leads, deals, and customers all in one place.
                        </p>
                    </div>
                </div>
            </div>
        </div>



    );
};

export default LeftSection;
