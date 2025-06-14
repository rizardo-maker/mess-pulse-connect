
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface OptimizedLoginProps {
  onSuccess?: () => void;
}

const OptimizedLogin: React.FC<OptimizedLoginProps> = ({ onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password) {
      toast.error("Please enter both email and password");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Optimized login with minimal data transfer
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      if (data?.user) {
        toast.success("Login successful");
        onSuccess?.();
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSuccess]);

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          autoComplete="email"
          className="focus:border-rgukt-blue"
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input 
          id="password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          autoComplete="current-password"
          className="focus:border-rgukt-blue"
          disabled={isSubmitting}
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
  );
};

export default OptimizedLogin;
