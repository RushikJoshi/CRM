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

  // Subscription check: only for non-superadmin users
  const user = session.user;
  if (user.role !== "super_admin" && user.subscription && pathname !== "/subscription-expired") {
    const now = new Date();
    const isExpired = (user.subscription.endDate && new Date(user.subscription.endDate) < now) ||
      (user.subscription.status === "expired");

    if (isExpired) {
      return <Navigate to="/subscription-expired" replace />;
    }
  }

  return children;
};

export default SessionGuard;
