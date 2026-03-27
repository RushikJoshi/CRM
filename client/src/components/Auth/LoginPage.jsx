import React from "react";
import LeftSection from "./LeftSection";
import LoginForm from "./LoginForm";
import logo from "../../assets/logos/edupathpro_logo.png";

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
            <div className="lg:hidden flex items-center gap-4 px-6 py-6 bg-slate-900 text-white">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                    <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-black text-white text-xl tracking-tighter">EduPath</p>
                    <span className="text-[9px] font-black bg-white/20 text-white px-1.5 py-0.5 rounded-md uppercase tracking-[0.2em] border border-white/20 backdrop-blur-sm">PRO</span>
                </div>
                    <p className="text-slate-400 text-[10px] font-black tracking-[0.25em] uppercase mt-1">
                        Smart Platform
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
