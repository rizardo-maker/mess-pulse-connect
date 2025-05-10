
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

const queryClient = new QueryClient();

const AppContent = () => {
  useEffect(() => {
    // Create admin user on app initialization
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
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/polls" element={<Polls />} />
        <Route path="/login" element={<Login />} />
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
