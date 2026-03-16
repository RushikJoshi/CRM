import React from "react";
import logo from "../../assets/tech logo white.png";

/**
 * Left marketing panel – aligned with the blue reference login design.
 * Blue gradient, subtle grid, Gitakshmi branding, Smart CRM text.
 */
const LeftSection = () => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center px-10 lg:px-16 xl:px-20 text-white text-center relative overflow-hidden bg-gradient-to-br from-[#1D4ED8] via-[#1E40AF] to-[#020617]">
            {/* Background grid */}
            <div className="absolute inset-0 opacity-25">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="login-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.4" opacity="0.35" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#login-grid)" />
                </svg>
            </div>

            {/* Soft glows */}
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-400 rounded-full opacity-20 blur-3xl" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500 rounded-full opacity-20 blur-3xl" />

            {/* Content */}
            <div className="relative z-10 w-full max-w-xl flex flex-col gap-10 items-center">
                {/* Brand / logo */}
                <div className="flex flex-col gap-3">
                    {logo ? (
                        <img
                            src={logo}
                            alt="Gitakshmi Technologies"
                            className="w-64 lg:w-72 h-auto object-contain"
                        />
                    ) : (
                        <p className="text-3xl font-black tracking-tight mb-1">
                            Gitakshmi <span className="font-semibold">Technologies</span>
                        </p>
                    )}
                </div>

                {/* Section label + headline + description (matches reference) */}
                <div className="space-y-4 max-w-md">
                    <p className="text-[10px] font-semibold tracking-[0.6em] uppercase text-blue-100/80">
                        {/* Technologies */}
                    </p>
                    <h1 className="text-4xl sm:text-5xl lg:text-[2.9rem] font-black tracking-tight leading-tight">
                        Smart CRM
                    </h1>
                    <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
                        Manage your business easily with our simple CRM. Track your leads, deals, and customers
                        all in one place.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LeftSection;
