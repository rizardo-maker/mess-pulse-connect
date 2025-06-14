import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import OptimizedLogin from "@/components/auth/OptimizedLogin";

interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

const Login = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  
  const registerForm = useForm<RegisterFormValues>({
    defaultValues: { email: '', password: '', confirmPassword: '' }
  });
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, userRole, navigate]);
  
  const handleLoginSuccess = () => {
    // Navigation will be handled by the useEffect above
  };
  
  const handleRegister = async (formData: RegisterFormValues) => {
    // Form validation
    if (!formData.email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    
    if (!formData.password) {
      toast.error("Please create a password");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if it's the admin email
      const isAdminEmail = formData.email === 'messoffice@rguktsklm.ac.in';
      
      if (isAdminEmail) {
        toast.error("This email is reserved. Please use a different email.");
        setIsSubmitting(false);
        return;
      }
      
      // Optimized registration with rate limiting consideration
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      if (data?.user) {
        toast.success("Account created successfully. You can now log in.");
        registerForm.reset();
        
        // Switch to login tab
        document.getElementById('login-tab')?.click();
      }
    } catch (error) {
      console.error(error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center text-rgukt-blue">
                Authentication Portal
              </CardTitle>
              <CardDescription className="text-center">
                Access the RGUKT Mess Office System
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login" id="login-tab">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <OptimizedLogin onSuccess={handleLoginSuccess} />
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input 
                        id="register-email"
                        type="email"
                        placeholder="Enter your email"
                        {...registerForm.register("email", { required: true })}
                        className="focus:border-rgukt-blue"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input 
                        id="register-password"
                        type="password"
                        placeholder="Create a password"
                        {...registerForm.register("password", { required: true })}
                        className="focus:border-rgukt-blue"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input 
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        {...registerForm.register("confirmPassword", { required: true })}
                        className="focus:border-rgukt-blue"
                      />
                    </div>
                    <Button 
                      type="submit"
                      className="w-full bg-rgukt-blue hover:bg-rgukt-lightblue"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
