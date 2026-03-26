import { createContext, useCallback, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import tokenManager from "../utils/tokenManager";

export const AuthContext = createContext();

export const ROLE_HOME = {
  super_admin: "/superadmin/dashboard",
  company_admin: "/company/dashboard",
  branch_manager: "/branch/dashboard",
  sales: "/sales/dashboard",
  support: "/sales/dashboard",
  marketing: "/sales/dashboard",
};

export const USER_DATA_KEYS = {
  super_admin: "superAdminUser",
  company_admin: "companyUser",
  branch_manager: "branchUser",
  sales: "salesUser",
  support: "salesUser",
  marketing: "salesUser"
};

export const getSessionKeyForPath = (path = window.location.pathname) => {
  if (path.startsWith("/superadmin")) return "super_admin";
  if (path.startsWith("/company")) return "company_admin";
  if (path.startsWith("/branch")) return "branch_manager";
  if (path.startsWith("/sales")) return "sales";
  return null;
};

// ── Safe single-session reader ────────────────────────────────────────────────
export const readSession = (role) => {
  if (!role) return null;
  try {
    const userRaw = sessionStorage.getItem(USER_DATA_KEYS[role]);
    const token = tokenManager.getTokenByRole(role);
    if (!token || !userRaw) return null;
    return { token, user: JSON.parse(userRaw) };
  } catch {
    return null;
  }
};

// ── Get current user safely (reads from path-derived key) ────────────────────
export const getCurrentUser = () => {
  const role = getSessionKeyForPath();
  return readSession(role)?.user || null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const location = useLocation();

  // Sync user state with current panel on path change
  useEffect(() => {
    const role = getSessionKeyForPath(location.pathname);
    if (role) {
      const savedUser = sessionStorage.getItem(USER_DATA_KEYS[role]);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(null);
      }
    }
  }, [location.pathname]);

  const login = useCallback((token, userData) => {
    const role = userData?.role;
    if (!role) return;

    // Store token using tokenManager
    tokenManager.setToken(role, token);

    // Store user data in panel-specific key
    const userKey = USER_DATA_KEYS[role];
    if (userKey) {
      sessionStorage.setItem(userKey, JSON.stringify(userData));
    }

    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    const role = getSessionKeyForPath(window.location.pathname);

    if (role) {
      tokenManager.clearToken(role);
      sessionStorage.removeItem(USER_DATA_KEYS[role]);
    }

    setUser(null);
    window.location.replace("/login");
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
