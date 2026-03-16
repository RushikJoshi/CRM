import { Navigate } from "react-router-dom";
import tokenManager from "../utils/tokenManager";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const path = window.location.pathname;
  const token = tokenManager.getTokenByPath(path);

  // We can also store/get user data here if needed, but for now we check token
  // A better way is using a RoleGuard component.

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;