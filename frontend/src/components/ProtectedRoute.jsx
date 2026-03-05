// ProtectedRoute — kept for backward compatibility.
// New code should use SessionGuard + RoleGuard instead.
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  let user = null;
  try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch { }

  if (!token || !user) {
    localStorage.clear();
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;