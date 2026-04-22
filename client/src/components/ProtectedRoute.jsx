import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  const subscriptionActive =
    !!user.subscriptionEndAt &&
    new Date(user.subscriptionEndAt) > new Date() &&
    ["active", "trial"].includes(user.subscriptionStatus);
  const allowWithoutSubscription = location.pathname === "/payment";
  if (!allowWithoutSubscription && !subscriptionActive) {
    return <Navigate to="/payment" replace />;
  }
  return children;
};

export default ProtectedRoute;

