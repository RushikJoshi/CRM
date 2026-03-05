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
        setLoading(true);

        try {
            localStorage.clear();
            const res = await API.post("/auth/login", { email, password });
            const { token, user } = res.data;

            if (!token || !user?.role) {
                setError("Server returned an invalid response. Please contact support.");
                return;
            }

            login(token, user);
            window.location.replace(ROLE_HOME[user.role] || "/");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Invalid credentials. Please check your email and password."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col justify-center h-full py-16">
            {/* Mobile logo */}
            <div className="flex items-center gap-3 mb-10 lg:hidden">
                <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center font-black text-white text-sm">GT</div>
                <span className="font-black text-gray-900 text-lg tracking-tight">Gitakshmi Technologies</span>
            </div>

            {/* Heading */}
            <div className="mb-14">
                <h2 className="text-4xl xl:text-5xl font-black text-gray-900 tracking-tight">Welcome</h2>
                <p className="text-gray-500 font-medium mt-3 text-lg">Sign in to your account to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Email */}
                <div className="space-y-3">
                    <label className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">
                        Email Address
                    </label>
                    <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200">
                            <FiMail size={20} />
                        </div>
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setError(""); }}
                            className="w-full pl-14 pr-4 py-5 bg-gray-50 border border-gray-100 rounded-2xl text-base font-bold text-gray-800 placeholder-gray-300 outline-none
                                focus:bg-white focus:border-green-400 focus:ring-8 focus:ring-green-500/5
                                hover:border-gray-200 transition-all duration-300 shadow-sm"
                        />
                    </div>
                </div>

                {/* Password */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">
                            Password
                        </label>
                        <button type="button" tabIndex={-1} className="text-sm font-black text-green-600 hover:text-green-800 transition-colors">
                            {/* Forgot password? */}
                        </button>
                    </div>
                    <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200">
                            <FiLock size={20} />
                        </div>
                        <input
                            type={showPass ? "text" : "password"}
                            required
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setError(""); }}
                            className="w-full pl-14 pr-14 py-5 bg-gray-50 border border-gray-100 rounded-2xl text-base font-bold text-gray-800 placeholder-gray-300 outline-none
                                focus:bg-white focus:border-green-400 focus:ring-8 focus:ring-green-500/5
                                hover:border-gray-200 transition-all duration-300 shadow-sm"
                        />
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPass ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading || !email || !password}
                    className="w-full flex items-center justify-center gap-4 py-6 rounded-2xl font-black text-base uppercase tracking-widest text-white
                        bg-gradient-to-r from-green-600 to-emerald-600
                        shadow-2xl shadow-green-500/30
                        hover:from-green-700 hover:to-emerald-700
                        hover:scale-[1.01] active:scale-[0.99]
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200 mt-4"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            Sign In
                            <FiArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>

            {/* Footer */}
            <div className="mt-10 pt-8 border-t border-gray-100">
                <p className="text-center text-xs text-gray-400 font-medium">
                    Protected by enterprise-grade security.{" "}
                    <span className="text-gray-500 font-bold">256-bit SSL encryption.</span>
                </p>
            </div>
        </div>
    );
};

export default LoginForm;
