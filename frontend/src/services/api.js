import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { getSessionKeyForPath, readSession } from "../context/AuthContext";

const API = axios.create({
  baseURL: API_BASE_URL,
});

// ── Attach JWT from path-isolated session ─────────────────────────────────────
API.interceptors.request.use((req) => {
  const key = getSessionKeyForPath(window.location.pathname);
  const session = readSession(key);
  if (session?.token) {
    req.headers.Authorization = `Bearer ${session.token}`;
  }
  return req;
});

// ── Global 401 handler — clears only the current panel's session ──────────────
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isLoginRequest = err.config?.url?.includes("/auth/login");
      const path = window.location.pathname;
      const isPublicPath = path === "/" || path === "/login";

      if (!isLoginRequest && !isPublicPath) {
        const key = getSessionKeyForPath(path);
        if (key) localStorage.removeItem(key);
        window.location.replace("/login");
      }
    }
    return Promise.reject(err);
  }
);

export default API;