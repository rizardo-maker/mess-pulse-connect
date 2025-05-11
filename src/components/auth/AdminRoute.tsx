
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect } from "react";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, userRole, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !user) {
      toast.error("Please log in to access this page");
    } else if (!isLoading && user && userRole !== "admin") {
      toast.error("You don't have permission to access the admin area");
    }
  }, [isLoading, user, userRole]);
  
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[70vh]">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (userRole !== "admin") {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

export default AdminRoute;
