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
        <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 font-sans overflow-x-hidden">
            {/* ── Left Column — Marketing ── */}
            <div className="hidden lg:block w-full h-full relative">
                <LeftSection />
            </div>

            {/* ── Mobile-only brand bar ── */}
            <div className="lg:hidden flex items-center gap-4 px-6 py-8 bg-gradient-to-r from-green-700 to-emerald-800 text-white">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-base border border-white/20">GT</div>
                <div>
                    <p className="font-black text-white leading-none">Gitakshmi Technologies</p>
                    <p className="text-green-200 text-[10px] font-bold tracking-widest uppercase mt-0.5">Smart CRM Platform</p>
                </div>
            </div>

            {/* ── Right Column — Login Form ── */}
            <div className="w-full h-full flex items-center justify-center bg-white py-12 lg:py-0">
                <div className="w-full max-w-xl px-10 md:px-16 xl:px-24">
                    <LoginForm />
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
