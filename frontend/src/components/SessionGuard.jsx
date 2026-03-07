import { Navigate, useLocation } from "react-router-dom";
import { getSessionKeyForPath, readSession } from "../context/AuthContext";

/**
 * SessionGuard — checks the path-isolated session for the current panel.
 * If no valid session exists → redirect to /login.
 * This replaces the old single-key approach and eliminates cross-tab contamination.
 */
const SessionGuard = ({ children }) => {
    const { pathname } = useLocation();
    const key = getSessionKeyForPath(pathname);
    const session = readSession(key);

    if (!session?.token || !session?.user?.role) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default SessionGuard;
