import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginPage from "../components/Auth/LoginPage";
import { readSession, ROLE_HOME } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Check for standard app sessions (all roles)
    const roles = ["super_admin", "company_admin", "branch_manager", "sales"];
    for (const role of roles) {
      const session = readSession(role);
      if (session?.token && session?.user?.role) {
        navigate(ROLE_HOME[session.user.role], { replace: true });
        return;
      }
    }

    // 2. Fallback check for 'crm_user' in localStorage (as requested)
    const crmUser = localStorage.getItem("crm_user");
    if (crmUser) {
      try {
        const user = JSON.parse(crmUser);
        if (user.role && ROLE_HOME[user.role]) {
          navigate(ROLE_HOME[user.role], { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } catch (e) {
        // Not JSON or invalid format, ignore
      }
    }
  }, [navigate]);

  return <LoginPage />;
};

export default Login;

