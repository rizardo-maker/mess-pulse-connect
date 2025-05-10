
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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!email.trim() || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      if (data?.user) {
        toast.success("Login successful");
        navigate('/');
      }
    } catch (error) {
      console.error(error);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!registerEmail.trim() || !registerPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    
    if (registerPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (registerPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    setIsRegistering(true);
    
    try {
      // Register with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      if (data?.user) {
        toast.success("Registration successful. Please check your email to confirm your account.");
        // Clear registration form
        setRegisterEmail('');
        setRegisterPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error(error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  // Function to initialize admin user
  const initializeAdminUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Only proceed if user is logged in
      if (!session) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'messoffice@rguktsklm.ac.in',
          password: 'messoffice',
        });
        
        if (error) {
          // Admin doesn't exist, create it
          const { error: signUpError } = await supabase.auth.signUp({
            email: 'messoffice@rguktsklm.ac.in',
            password: 'messoffice',
          });
          
          if (signUpError) {
            console.error("Error creating admin user:", signUpError);
          } else {
            console.log("Admin user created successfully");
          }
        } else {
          console.log("Admin user already exists");
        }
      }
    } catch (error) {
      console.error("Error initializing admin user:", error);
    }
  };
  
  // Initialize admin user on component mount
  useEffect(() => {
    initializeAdminUser();
  }, []);
  
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
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="focus:border-rgukt-blue"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Button 
                          variant="link" 
                          className="text-xs text-rgukt-blue p-0 h-auto font-normal"
                          type="button"
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <Input 
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="focus:border-rgukt-blue"
                      />
                    </div>
                    <Button 
                      type="submit"
                      className="w-full bg-rgukt-blue hover:bg-rgukt-lightblue"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input 
                        id="register-email"
                        type="email"
                        placeholder="Enter your email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                        className="focus:border-rgukt-blue"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input 
                        id="register-password"
                        type="password"
                        placeholder="Create a password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        className="focus:border-rgukt-blue"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input 
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="focus:border-rgukt-blue"
                      />
                    </div>
                    <Button 
                      type="submit"
                      className="w-full bg-rgukt-blue hover:bg-rgukt-lightblue"
                      disabled={isRegistering}
                    >
                      {isRegistering ? "Creating Account..." : "Create Account"}
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
