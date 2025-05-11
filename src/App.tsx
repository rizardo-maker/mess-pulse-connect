
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useEffect } from "react";
import { createAdminUser } from "./utils/createAdminUser";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Complaints from "./pages/Complaints";
import Polls from "./pages/Polls";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ComplaintsAdmin from "./pages/admin/ComplaintsAdmin";
import PollsAdmin from "./pages/admin/PollsAdmin";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";

const queryClient = new QueryClient();

const AppContent = () => {
  useEffect(() => {
    // Only create admin user on app initialization, without logging in
    createAdminUser().then((result) => {
      console.log("Admin user setup result:", result);
    }).catch(error => {
      console.error("Error in admin setup:", error);
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes accessible for all authenticated users */}
        <Route path="/complaints" element={
          <ProtectedRoute>
            <Complaints />
          </ProtectedRoute>
        } />
        <Route path="/polls" element={
          <ProtectedRoute>
            <Polls />
          </ProtectedRoute>
        } />
        
        {/* Admin-only routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/complaints" element={
          <AdminRoute>
            <ComplaintsAdmin />
          </AdminRoute>
        } />
        <Route path="/admin/polls" element={
          <AdminRoute>
            <PollsAdmin />
          </AdminRoute>
        } />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
