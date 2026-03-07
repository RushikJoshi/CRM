import { createContext, useCallback } from "react";

export const AuthContext = createContext();

// ── Role → home path ──────────────────────────────────────────────────────────
export const ROLE_HOME = {
  super_admin: "/superadmin/dashboard",
  company_admin: "/company/dashboard",
  branch_manager: "/branch/dashboard",
  sales: "/sales/dashboard",
};

// ── Role → isolated localStorage key ─────────────────────────────────────────
// Each panel reads ONLY its own key — cross-tab contamination eliminated.
export const ROLE_SESSION_KEY = {
  super_admin: "sa_session",
  company_admin: "ca_session",
  branch_manager: "bm_session",
  sales: "su_session",
};

// ── Derive session key from current URL path ──────────────────────────────────
export const getSessionKeyForPath = (path = window.location.pathname) => {
  if (path.startsWith("/superadmin")) return "sa_session";
  if (path.startsWith("/company")) return "ca_session";
  if (path.startsWith("/branch")) return "bm_session";
  if (path.startsWith("/sales")) return "su_session";
  return null; // login or root
};

// ── Safe single-session reader ────────────────────────────────────────────────
export const readSession = (key) => {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === "null" || raw === "undefined") return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// ── Get current user safely (reads from path-derived key) ────────────────────
export const getCurrentUser = () => {
  const key = getSessionKeyForPath();
  return readSession(key)?.user || null;
};

// ── AuthProvider ──────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {

  // Store token + user under the role's private key
  const login = useCallback((token, user) => {
    const key = ROLE_SESSION_KEY[user?.role];
    if (!key) {
      console.error("[Auth] Unknown role — cannot store session:", user?.role);
      return;
    }
    localStorage.setItem(key, JSON.stringify({ token, user }));
  }, []);

  // Logout only removes the current panel's session
  const logout = useCallback(() => {
    const key = getSessionKeyForPath();
    if (key) localStorage.removeItem(key);
    window.location.replace("/login");
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};