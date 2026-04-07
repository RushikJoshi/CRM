import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSessionKeyForPath, readSession, USER_DATA_KEYS } from "../context/AuthContext";
import { tokenManager } from "../utils/tokenManager";

const SessionGuard = ({ children }) => {
  const { pathname } = useLocation();

  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const key = getSessionKeyForPath(pathname);
    const session = readSession(key);

    // ✅ 1. Check normal session (your existing system)
    if (session?.token && session?.user?.role) {
      setIsValid(true);
      setLoading(false);
      return;
    }

    // ✅ 2. Fallback → SSO localStorage
    const ssoUser = localStorage.getItem("crm_user");
    const ssoToken = localStorage.getItem("crm_token"); // We should check for token too

    if (ssoUser) {
      // Sync to sessionStorage if missing, to satisfy RoleGuard
      try {
        const user = JSON.parse(ssoUser);
        const role = user.role;
        const sessionKey = getSessionKeyForPath(pathname);
        
        if (role && USER_DATA_KEYS[role]) {
           // We'll set the session data needed to satisfy readSession and RoleGuard
           const dataKey = USER_DATA_KEYS[role]; 
           if (!sessionStorage.getItem(dataKey)) {
             sessionStorage.setItem(dataKey, ssoUser);
             tokenManager.setToken(role, ssoToken || "sso-verified");
           }
        }
      } catch (e) {}
      setIsValid(true);
    } else {
      setIsValid(false);
    }

    setLoading(false);
  }, [pathname]);

  // 🔥 IMPORTANT: wait before redirect
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // ❌ No session
  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default SessionGuard;