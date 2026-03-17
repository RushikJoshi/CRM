import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { getCurrentUser } from "../context/AuthContext";
import API from "../services/api";
import {
    FiUser, FiLock, FiBell, FiShield, FiSave, FiX,
    FiCheckCircle, FiActivity, FiEye, FiEyeOff, FiRefreshCw,
    FiAlertTriangle, FiMoon
} from "react-icons/fi";

// ─── Message Banner ─────────────────────────────────────────────────────────
const MsgBanner = ({ msg, onClose }) => {
    if (!msg.text) return null;
    const isSuccess = msg.type === "success";
    return (
        <div className={`flex items-center justify-between p-4 rounded-xl border animate-in slide-in-from-top-2 duration-300 ${isSuccess ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${isSuccess ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                    {isSuccess ? <FiCheckCircle size={16} /> : <FiAlertTriangle size={16} />}
                </div>
                <span className="font-bold text-sm">{msg.text}</span>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-black/5 rounded-lg transition-colors">
                <FiX size={16} />
            </button>
        </div>
    );
};

// ─── Password Input ──────────────────────────────────────────────────────────
const PasswordInput = ({ value, onChange, placeholder, className = "" }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                type={show ? "text" : "password"}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full pr-12 ${className}`}
            />
            <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
            >
                {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
        </div>
    );
};

// ─── Password Strength ───────────────────────────────────────────────────────
const PasswordStrength = ({ password }) => {
    if (!password) return null;
    const checks = [
        { label: "6+ characters", pass: password.length >= 6 },
        { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
        { label: "Number", pass: /\d/.test(password) },
        { label: "Special character", pass: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
    ];
    const score = checks.filter(c => c.pass).length;
    const labels = ["", "Weak", "Fair", "Good", "Strong"];
    const colors = ["", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
    const textColors = ["", "text-red-600", "text-yellow-600", "text-blue-600", "text-green-600"];

    return (
        <div className="mt-3 space-y-2">
            <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= score ? colors[score] : "bg-gray-200"}`} />
                ))}
            </div>
            <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {checks.map((c, i) => (
                        <span key={i} className={`text-[10px] font-bold flex items-center gap-1 ${c.pass ? "text-green-600" : "text-gray-400"}`}>
                            <span>{c.pass ? "✓" : "○"}</span> {c.label}
                        </span>
                    ))}
                </div>
                {score > 0 && <span className={`text-[11px] font-black uppercase tracking-widest ${textColors[score]}`}>{labels[score]}</span>}
            </div>
        </div>
    );
};

// ─── Main Settings Component ─────────────────────────────────────────────────
const Settings = () => {
    const { login } = useContext(AuthContext);
    const user = getCurrentUser();

    const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "" });
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    const [profileLoading, setProfileLoading] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);
    const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });
    const [pwMsg, setPwMsg] = useState({ text: "", type: "" });
    const [fetchingProfile, setFetchingProfile] = useState(true);

    // On mount, fetch fresh profile from backend
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await API.get("/auth/me");
                const freshUser = res.data?.data;
                if (freshUser) {
                    setProfile({ name: freshUser.name || "", email: freshUser.email || "" });
                }
            } catch (err) {
                console.error("Could not load profile:", err);
            } finally {
                setFetchingProfile(false);
            }
        };
        fetchProfile();
    }, []);

    // ── Profile Update ─────────────────────────────────────────────────────
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        if (!profile.name.trim()) {
            setProfileMsg({ text: "Name cannot be empty.", type: "error" });
            return;
        }
        if (!profile.email.trim() || !profile.email.includes("@")) {
            setProfileMsg({ text: "Please enter a valid email address.", type: "error" });
            return;
        }

        setProfileLoading(true);
        setProfileMsg({ text: "", type: "" });
        try {
            const res = await API.put("/auth/me/profile", {
                name: profile.name.trim(),
                email: profile.email.trim().toLowerCase()
            });
            setProfileMsg({ text: res.data?.message || "Profile updated successfully.", type: "success" });

            // Update local storage with new user data so context stays in sync
            const updatedUser = res.data?.data;
            if (updatedUser && user?.role) {
                const { USER_DATA_KEYS } = await import("../context/AuthContext");
                const key = USER_DATA_KEYS[user.role];
                if (key) {
                    const current = JSON.parse(localStorage.getItem(key) || "{}");
                    localStorage.setItem(key, JSON.stringify({ ...current, name: updatedUser.name, email: updatedUser.email }));
                }
            }
        } catch (err) {
            setProfileMsg({ text: err.response?.data?.message || "Failed to update profile.", type: "error" });
        } finally {
            setProfileLoading(false);
        }
    };

    // ── Password Change ────────────────────────────────────────────────────
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setPwMsg({ text: "", type: "" });

        if (!passwords.current) {
            setPwMsg({ text: "Please enter your current password.", type: "error" });
            return;
        }
        if (!passwords.new) {
            setPwMsg({ text: "New password cannot be empty.", type: "error" });
            return;
        }
        if (passwords.new.length < 6) {
            setPwMsg({ text: "Password must be at least 6 characters long.", type: "error" });
            return;
        }
        if (passwords.new !== passwords.confirm) {
            setPwMsg({ text: "Passwords do not match. Please try again.", type: "error" });
            return;
        }

        setPwLoading(true);
        try {
            const payload = {
                currentPassword: passwords.current,
                newPassword: passwords.new
            };

            const res = await API.put("/auth/me/password", payload);
            setPwMsg({ text: res.data?.message || "Password changed successfully.", type: "success" });
            setPasswords({ current: "", new: "", confirm: "" });
        } catch (err) {
            setPwMsg({
                text: err.response?.data?.message || "Failed to change password. Please try again.",
                type: "error"
            });
        } finally {
            setPwLoading(false);
        }
    };

    const inputClass = "w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 focus:bg-white transition-all font-semibold text-gray-800 text-sm placeholder:text-gray-400 placeholder:font-normal";
    const darkInputClass = "w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all font-semibold text-white text-sm placeholder:text-gray-500 placeholder:font-normal";

    return (
        <div className="space-y-6 pb-16 animate-in fade-in duration-500">
            {/* ─── Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
                <div>
                    <h1 className="text-[26px] font-bold text-[#0F172A] tracking-tight">Settings</h1>
                    <p className="text-gray-500 font-medium text-sm mt-1">Manage your account and security settings.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
                    {user?.role?.replace(/_/g, ' ')?.toUpperCase() || 'USER'}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {/* ─── My Profile ───────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#F0F9FF] text-[#0EA5E9] rounded-xl"><FiUser size={20} /></div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">My Profile</h3>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Your personal information</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <MsgBanner msg={profileMsg} onClose={() => setProfileMsg({ text: "", type: "" })} />
                        {fetchingProfile ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="w-8 h-8 border-3 border-sky-100 border-t-sky-500 rounded-full animate-spin" />
                            </div>
                        ) : (
                            <form onSubmit={handleProfileUpdate} className="mt-4 space-y-5">
                                {/* Avatar initials */}
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                    <div className="w-14 h-14 rounded-2xl bg-[#38BDF8] flex items-center justify-center text-white font-black text-xl shadow-md shadow-sky-500/20 flex-shrink-0">
                                        {profile.name?.charAt(0)?.toUpperCase() || "U"}
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900">{profile.name || "Your Name"}</p>
                                        <p className="text-xs text-gray-400 font-medium">{profile.email}</p>
                                        <p className="text-[10px] font-black text-[#0EA5E9] uppercase tracking-widest mt-0.5">{user?.role?.replace(/_/g, ' ')}</p>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest">Your Name</label>
                                    <input
                                        value={profile.name}
                                        onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                                        className={inputClass}
                                        placeholder="Enter your full name..."
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest">Email Address</label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                                        className={inputClass}
                                        placeholder="Enter your email..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={profileLoading}
                                    className={`w-full py-3.5 bg-[#38BDF8] text-white font-semibold rounded-xl shadow-lg shadow-sky-500/20 hover:bg-[#0EA5E9] active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 ${profileLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                                >
                                    {profileLoading
                                        ? <><FiRefreshCw size={15} className="animate-spin" /> Saving...</>
                                        : <><FiSave size={15} /> Save Changes</>
                                    }
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* ─── Change Password ────────────────────────────────────── */}
                <div className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-white/5">
                    <div className="px-6 py-5 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/10 text-white rounded-xl border border-white/10"><FiLock size={20} /></div>
                            <div>
                                <h3 className="text-lg font-black text-white">Change Password</h3>
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Update your security credentials</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <MsgBanner msg={pwMsg} onClose={() => setPwMsg({ text: "", type: "" })} />
                        <form onSubmit={handlePasswordUpdate} className="mt-4 space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest">Current Password <span className="text-gray-600 normal-case tracking-normal font-medium">(optional but recommended)</span></label>
                                <PasswordInput
                                    value={passwords.current}
                                    onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
                                    placeholder="Enter current password..."
                                    className={darkInputClass}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest">New Password *</label>
                                <PasswordInput
                                    value={passwords.new}
                                    onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))}
                                    placeholder="Enter new password..."
                                    className={darkInputClass}
                                />
                                <PasswordStrength password={passwords.new} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest">Confirm New Password *</label>
                                <PasswordInput
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                                    placeholder="Re-enter new password..."
                                    className={darkInputClass}
                                />
                                {passwords.confirm && passwords.new !== passwords.confirm && (
                                    <p className="text-red-400 text-xs font-bold mt-1 flex items-center gap-1">
                                        <FiX size={12} /> Passwords do not match
                                    </p>
                                )}
                                {passwords.confirm && passwords.new === passwords.confirm && passwords.new && (
                                    <p className="text-green-400 text-xs font-bold mt-1 flex items-center gap-1">
                                        <FiCheckCircle size={12} /> Passwords match
                                    </p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={pwLoading}
                                className={`w-full py-3.5 bg-white text-gray-900 font-semibold rounded-xl shadow-lg hover:bg-gray-100 active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 ${pwLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                            >
                                {pwLoading
                                    ? <><FiRefreshCw size={15} className="animate-spin" /> Updating...</>
                                    : <><FiLock size={15} /> Update Password</>
                                }
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
