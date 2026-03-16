// RoleRoute — kept for backward compatibility.
// New code should use RoleGuard instead.
import { Navigate } from "react-router-dom";
import { ROLE_HOME } from "../context/AuthContext";

const RoleRoute = ({ children, allowedRoles }) => {
  let user = null;
  try { user = JSON.parse(localStorage.getItem("user") || "null"); } catch { }

  if (!user || !user.role) {
    localStorage.clear();
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const home = ROLE_HOME[user.role] || "/";
    return <Navigate to={home} replace />;
  }

  return children;
};

export default RoleRoute;