import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../services/api";
import { FiUser, FiLock, FiBell, FiShield, FiSave, FiX, FiCheckCircle, FiActivity } from "react-icons/fi";

const Settings = () => {
    const { user, login } = useContext(AuthContext); // Can use this to update user if needed
    const [profile, setProfile] = useState({
        name: user?.name || "",
        email: user?.email || ""
    });
    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: ""
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" });

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await API.put(`/super-admin/users/${user.id}`, { name: profile.name, email: profile.email });
            setMsg({ text: "Profile synchronization complete.", type: "success" });
            // Optionally update context here if login function supports it or re-fetch
        } catch (err) {
            setMsg({ text: "Profile update failure: " + err.response?.data?.message, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setMsg({ text: "Security code mismatch detected.", type: "error" });
            return;
        }
        setLoading(true);
        try {
            await API.put(`/super-admin/users/${user.id}`, { password: passwords.new });
            setMsg({ text: "Auth protocols updated.", type: "success" });
            setPasswords({ current: "", new: "", confirm: "" });
        } catch (err) {
            setMsg({ text: err.response?.data?.message || "Auth update failed.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-12 pb-20 animate-in fade-in duration-700">
            {/* Dynamic Header Block */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-50/30 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">System Configuration</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 opacity-60">Personalize and Secure your Overseer Hub</p>
                </div>
            </div>

            {/* Notification Banner */}
            {msg.text && (
                <div className={`p-6 rounded-[2rem] flex items-center justify-between animate-in slide-in-from-top-4 duration-300 border shadow-sm ${msg.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
                    }`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${msg.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            {msg.type === 'success' ? <FiCheckCircle size={20} /> : <FiX size={20} />}
                        </div>
                        <span className="font-black text-sm tracking-tight">{msg.text}</span>
                    </div>
                    <button onClick={() => setMsg({ text: "", type: "" })} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><FiX size={20} /></button>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Profile Matrix Node */}
                <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-bl-[5rem] translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center gap-4 mb-12 relative">
                        <div className="p-4 bg-green-50 text-green-600 rounded-[1.25rem] shadow-sm"><FiUser size={28} /></div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-800 tracking-tight">Profile Identity</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Core Personnel Metadata</p>
                        </div>
                    </div>
                    <form onSubmit={handleProfileUpdate} className="space-y-8 relative">
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Authority Name</label>
                            <input
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className="w-full px-7 py-5 bg-gray-50 border border-transparent rounded-[1.5rem] outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-800 text-sm shadow-sm"
                                placeholder="Designated legal name..."
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Primary Route (Email)</label>
                            <input
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                className="w-full px-7 py-5 bg-gray-50 border border-transparent rounded-[1.5rem] outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-400 focus:bg-white transition-all font-black text-gray-800 text-sm shadow-sm"
                                placeholder="Corporate routing label..."
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="w-full py-5 bg-green-500 text-white font-black rounded-2xl shadow-2xl shadow-green-500/20 hover:bg-green-600 hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em] mt-2"
                        >
                            Synchronize Instance
                        </button>
                    </form>
                </div>

                {/* Security Protocol Node */}
                <div className="bg-gray-900 p-10 rounded-[3.5rem] shadow-2xl text-white group overflow-hidden relative border border-white/5">
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-tr-[5rem] -translate-x-12 translate-y-12 group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center gap-4 mb-12 relative z-10">
                        <div className="p-4 bg-white/10 text-white rounded-[1.25rem] backdrop-blur-xl border border-white/10 shadow-xl"><FiLock size={28} /></div>
                        <div>
                            <h3 className="text-2xl font-black tracking-tight">Security Hardening</h3>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-0.5 whitespace-nowrap">Auth Protocol Synchronization</p>
                        </div>
                    </div>
                    <form onSubmit={handlePasswordUpdate} className="space-y-8 relative z-10">
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">New Secure Cipher</label>
                            <input
                                type="password"
                                value={passwords.new}
                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                placeholder="Alpha-numeric encryption sequence..."
                                className="w-full px-7 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-white/10 focus:border-white/20 transition-all font-black text-white text-sm shadow-lg"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Validate Cipher</label>
                            <input
                                type="password"
                                value={passwords.confirm}
                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                placeholder="Duplicate sequence verification..."
                                className="w-full px-7 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-white/10 focus:border-white/20 transition-all font-black text-white text-sm shadow-lg"
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="w-full py-5 bg-white text-gray-900 font-black rounded-2xl shadow-2xl hover:bg-gray-100 hover:scale-[1.02] active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em] mt-2"
                        >
                            Execute Auth Rebuild
                        </button>
                    </form>
                </div>

                {/* Grid of Toggles */}
                <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm xl:col-span-2 overflow-hidden relative">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-gray-900 text-white rounded-[1.25rem] shadow-lg"><FiActivity size={28} /></div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-800 tracking-tight">Interface Cluster</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">UX Behavior Calibration</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: FiBell, label: "Event Notifications", active: true },
                            { icon: FiShield, label: "2FA Multi-Factor", active: false },
                            { icon: FiActivity, label: "Dark Interface", active: false }
                        ].map((node, i) => (
                            <div key={i} className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex items-center justify-between hover:bg-gray-100 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                                <div className="flex items-center gap-5">
                                    <div className={`p-2.5 rounded-xl transition-all ${node.active ? 'bg-green-100 text-green-600' : 'bg-white text-gray-300'}`}>
                                        <node.icon size={18} />
                                    </div>
                                    <span className="text-sm font-black text-gray-700 tracking-tight">{node.label}</span>
                                </div>
                                <div className={`w-12 h-6 rounded-full flex items-center px-1.5 transition-colors ${node.active ? 'bg-green-500' : 'bg-gray-200'}`}>
                                    <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform duration-300 ${node.active ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
