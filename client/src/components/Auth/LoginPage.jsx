import React from "react";
import LeftSection from "./LeftSection";
import LoginForm from "./LoginForm";

/**
 * LoginPage — Full-width split screen layout
 * Desktop: 50/50 split (Grid)
 * Mobile:  Stacked (Block)
 */
const LoginPage = () => {
    return (
        <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 font-sans overflow-hidden bg-white">
            {/* ── Left Column — Marketing ── */}
            <div className="hidden lg:block w-full h-full relative">
                <LeftSection />
            </div>

            {/* ── Mobile-only brand bar ── */}
            <div className="lg:hidden flex items-center gap-4 px-6 py-6 bg-gradient-to-r from-[#1D4ED8] to-[#1E40AF] text-white">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-base border border-white/15">
                    GT
                </div>
                <div className="min-w-0">
                    <p className="font-black text-white leading-none truncate">Gitakshmi Technologies</p>
                    <p className="text-blue-100 text-[10px] font-bold tracking-[0.25em] uppercase mt-1">
                        Smart CRM
                    </p>
                </div>
            </div>

            {/* ── Right Column — Login Form ── */}
            <div className="w-full h-full flex items-center justify-center bg-white py-10 lg:py-0">
                <div className="w-full max-w-md px-8 md:px-12">
                    <LoginForm />
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
