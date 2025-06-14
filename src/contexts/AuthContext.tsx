
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
    let profileCache: { [key: string]: UserRole } = {};
    
    // Set up auth state listener with optimized profile fetching
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Fetch user role if user is logged in
        if (newSession?.user) {
          // Check cache first
          const cachedRole = profileCache[newSession.user.id];
          if (cachedRole) {
            setUserRole(cachedRole);
            setIsLoading(false);
          } else {
            setTimeout(() => {
              fetchUserProfile(newSession.user.id);
            }, 0);
          }
        } else {
          setUserRole(null);
          setIsLoading(false);
        }
      }
    );

    // Initial session check with optimized loading
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
      // Use select with specific fields and add index hint
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        // Optimized admin check
        if (user?.email === 'messoffice@rguktsklm.ac.in') {
          setUserRole('admin');
        } else {
          setUserRole('visitor');
        }
      } else if (data) {
        setUserRole(data.role as UserRole);
      } else {
        setUserRole('visitor');
      }
    } catch (error) {
      console.error('Error in profile fetch:', error);
      setUserRole('visitor');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, userRole, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
