
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type UserRole = 'admin' | 'visitor' | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: UserRole;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  isLoading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Fetch user role if user is logged in
        if (newSession?.user) {
          setTimeout(() => {
            fetchUserProfile(newSession.user.id);
          }, 0);
        } else {
          setUserRole(null);
        }
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        // Special case for the admin user
        if (user?.email === 'messoffice@rguktsklm.ac.in') {
          setUserRole('admin');
        } else {
          setUserRole('visitor'); // Default role
        }
      } else if (data) {
        setUserRole(data.role as UserRole);
      } else {
        // If no profile found, set default role
        setUserRole('visitor');
      }
    } catch (error) {
      console.error('Error in profile fetch:', error);
      setUserRole('visitor'); // Default role on error
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error('Error signing out');
      } else {
        toast.success('Signed out successfully');
        setUserRole(null);
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      toast.error('Error signing out');
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, userRole, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
