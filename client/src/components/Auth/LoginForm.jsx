import React, { useState, useContext } from "react";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiAlertCircle } from "react-icons/fi";
import API from "../../services/api";
import { AuthContext, ROLE_HOME } from "../../context/AuthContext";

const LoginForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Client-side validation before hitting API
        if (!email.trim()) { setError("Please enter your email."); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a real email."); return; }
        if (!password) { setError("Enter your password."); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

        setLoading(true);
        try {
            const res = await API.post("/auth/login", { email: email.trim().toLowerCase(), password });
            const { token, user } = res.data;

            if (!token || !user?.role) {
                setError("Error on our end. Try again or contact support.");
                return;
            }

            // ✅ Store under role-specific key — does NOT clear other roles' sessions
            login(token, user);

            // Redirect to role home
            window.location.replace(ROLE_HOME[user.role] || "/login");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Incorrect email or password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col justify-center h-full py-12">
            {/* Mobile logo */}
            <div className="flex items-center gap-3 mb-10 lg:hidden">
                <div className="w-9 h-9 bg-[#1D4ED8] rounded-lg flex items-center justify-center font-black text-white text-xs">
                    GT
                </div>
                <span className="font-black text-gray-900 text-base tracking-tight">Gitakshmi Technologies</span>
            </div>

            {/* Heading */}
            <div className="mb-14">
                <h2 className="text-3xl xl:text-4xl font-black text-gray-900 tracking-tight">Welcome</h2>
                <p className="text-gray-500 font-medium mt-2 text-sm">Sign in to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Error Banner */}
                {error && (
                    <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-bold animate-in slide-in-from-top-2 duration-300">
                        <FiAlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-[0.25em]">
                        Email Address
                    </label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200">
                            <FiMail size={20} />
                        </div>
                        <input
                            type="email"
                            autoComplete="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setError(""); }}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-800 placeholder-gray-300 outline-none
                                focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                                hover:border-gray-200 transition-all duration-300 shadow-sm"
                        />
                    </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-[0.25em]">
                        Password
                    </label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200">
                            <FiLock size={20} />
                        </div>
                        <input
                            type={showPass ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setError(""); }}
                            className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-800 placeholder-gray-300 outline-none
                                focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                                hover:border-gray-200 transition-all duration-300 shadow-sm"
                        />
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPass ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-sm text-white
                        bg-gradient-to-r from-[#2563EB] to-[#1D4ED8]
                        shadow-md shadow-blue-500/30
                        hover:from-[#1D4ED8] hover:to-[#1E3A8A]
                        hover:scale-[1.01] active:scale-[0.98]
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200 mt-4"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            Sign in
                            <FiArrowRight size={17} />
                        </>
                    )}
                </button>
            </form>


            {/* Footer text */}
            <div className="mt-10 pt-8 border-t border-[#E5E7EB]">
                <p className="text-center text-[9px] text-[#9CA3AF] font-semibold uppercase tracking-[0.35em]">
                    Secured by Gitakshmi Encryption Protocols
                </p>
            </div>
        </div>

    );
};

export default LoginForm;
