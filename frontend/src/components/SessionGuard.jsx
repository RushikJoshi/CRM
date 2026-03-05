import { Navigate, useLocation } from "react-router-dom";
import { ROLE_HOME } from "../context/AuthContext";

/**
 * SessionGuard — wraps all protected routes.
 * Verifies token AND user exist; redirects to login if either is missing.
 */
const SessionGuard = ({ children }) => {
    const token = localStorage.getItem("token");
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        localStorage.clear();
        return <Navigate to="/" replace />;
    }

    if (!token || !user || !user.role) {
        localStorage.clear();
        return <Navigate to="/" replace />;
    }

    return children;
};

export default SessionGuard;
