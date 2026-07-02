import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Loader from "./Loader.jsx";

// Blocks access unless the user is an admin (or pharmacist, if allowed)
const AdminRoute = ({ children, roles = ["admin"] }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loader fullScreen />;
  if (!user || !roles.includes(user.role)) return <Navigate to="/login" replace />;

  return children;
};

export default AdminRoute;
