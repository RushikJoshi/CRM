import axios from "axios";

// Auto-detect backend URL
const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    return window.location.origin.includes('localhost')
        ? "http://localhost:5003"
        : window.location.origin;
};

const BASE = getBaseURL();

export const API_URL = BASE;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || BASE;
export const APP_NAME = import.meta.env.VITE_APP_NAME || "Gitakshmi CRM";

export const API_BASE_URL = `${API_URL}/api`;

// ✅ 🔥 ADD THIS (MAIN FIX)
export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // ⭐ THIS FIXES YOUR SSO
});