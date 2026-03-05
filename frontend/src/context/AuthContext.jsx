import { createContext, useState, useCallback } from "react";

export const AuthContext = createContext();

// Single source of truth for role → home path mapping
export const ROLE_HOME = {
  super_admin: "/superadmin/dashboard",
  company_admin: "/company/dashboard",
  branch_manager: "/branch/dashboard",
  sales: "/sales/dashboard",
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const login = useCallback((newToken, userData) => {
    // Always clear old session first to prevent role bleed
    localStorage.clear();
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setToken(null);
    setUser(null);
    window.location.replace("/");
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};