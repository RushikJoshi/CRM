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

        if (!email.trim()) { setError("Please enter your email."); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address."); return; }
        if (!password) { setError("Please enter your password."); return; }

        setLoading(true);
        try {
            const res = await API.post("/auth/login", { email: email.trim().toLowerCase(), password });
            const { token, user } = res.data;

            if (!token || !user?.role) {
                setError("Authentication failed. Please try again.");
                return;
            }

            login(token, user);
            window.location.replace(ROLE_HOME[user.role] || "/login");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials. Please check your email and password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col justify-center h-full max-w-[360px] mx-auto">
            {/* Logo for mobile */}
            <div className="flex flex-col mb-10 lg:hidden">
                <h1 className="text-[32px] font-black text-[#1e40af] leading-none mb-1">Gitakshmi</h1>
                <div className="flex items-center gap-2">
                    <div className="h-[1px] flex-1 bg-blue-900/20" />
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-blue-900/60">Technologies</span>
                    <div className="h-[1px] flex-1 bg-blue-900/20" />
                </div>
            </div>

            <div className="mb-10">
                <h2 className="text-[32px] font-black text-gray-900 tracking-tight leading-none">Welcome</h2>
                <p className="text-gray-500 mt-2 text-[14px] font-bold">Sign in to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {error && (
                    <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-[13px] font-medium animate-in fade-in duration-300">
                        <FiAlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email address</label>
                    <div className="relative group">
                        <FiMail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2563eb] transition-colors" />
                        <input
                            type="email"
                            placeholder="name@gitakshmilabs.com"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setError(""); }}
                            className="w-full pl-11 pr-4 py-3.5 bg-blue-50/50 border border-blue-100/50 rounded-xl text-[14px] font-medium outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                    </div>
                    <div className="relative group">
                        <FiLock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2563eb] transition-colors" />
                        <input
                            type={showPass ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setError(""); }}
                            className="w-full pl-11 pr-11 py-3.5 bg-blue-50/50 border border-blue-100/50 rounded-xl text-[14px] font-medium outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                            {showPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 flex items-center justify-center gap-2.5 rounded-xl font-black text-[14px] text-white bg-[#2563eb] hover:bg-[#1d4ed8] shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign in <FiArrowRight size={16} /></>}
                </button>
            </form>

            <div className="mt-20 flex flex-col items-center">
                <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] text-center">
                    SECURED BY GITAKSHMI <br className="lg:hidden" /> ENCRYPTION PROTOCOLS
                </span>
            </div>
        </div>
    );
};

export default LoginForm;
