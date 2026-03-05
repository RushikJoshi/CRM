import { Navigate } from "react-router-dom";
import { ROLE_HOME } from "../context/AuthContext";

/**
 * RoleGuard — wraps a layout section to ensure the current user
 * actually belongs to the expected role. If not, redirects to their
 * correct home page. This is what prevents panel cross-contamination.
 */
const RoleGuard = ({ allowedRole, children }) => {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        localStorage.clear();
        return <Navigate to="/" replace />;
    }

    if (!user || !user.role) {
        localStorage.clear();
        return <Navigate to="/" replace />;
    }

    // If this user's role doesn't match the layout's expected role,
    // redirect them to their own correct home — never allow cross-panel access.
    if (user.role !== allowedRole) {
        const correctHome = ROLE_HOME[user.role] || "/";
        return <Navigate to={correctHome} replace />;
    }

    return children;
};

export default RoleGuard;
