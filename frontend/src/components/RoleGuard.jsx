import { Navigate, useLocation } from "react-router-dom";
import { getSessionKeyForPath, readSession, ROLE_HOME } from "../context/AuthContext";

/**
 * RoleGuard — verifies the current panel's session user has the expected role.
 * Each layout passes its allowedRole. If the stored user's role doesn't match →
 * redirect to that user's correct home (never allow cross-panel access).
 */
const RoleGuard = ({ allowedRole, children }) => {
    const { pathname } = useLocation();
    const key = getSessionKeyForPath(pathname);
    const session = readSession(key);
    const user = session?.user;

    if (!user?.role) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== allowedRole) {
        const correctHome = ROLE_HOME[user.role] || "/login";
        return <Navigate to={correctHome} replace />;
    }

    return children;
};

export default RoleGuard;
