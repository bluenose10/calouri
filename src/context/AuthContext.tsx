import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuthContextType } from '../types';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        console.log("Session check:", data.session?.user ? "User found" : "No user");
        setUser(data.session?.user || null);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        setUser(session?.user || null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      toast.error('Supabase not configured', {
        description: 'Authentication is unavailable because Supabase is not properly configured.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      console.log("Sign in successful, user:", data.user);
      setUser(data.user);
      toast.success('Successfully signed in!');
    } catch (error: any) {
      toast.error(error.message || 'Error signing in');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    if (!isSupabaseConfigured()) {
      toast.error('Supabase not configured', {
        description: 'Authentication is unavailable because Supabase is not properly configured.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            first_name: firstName || '',
            last_name: lastName || '',
          }
        }
      });
      if (error) throw error;
      toast.success('Signup successful! Please check your email for verification.');
    } catch (error: any) {
      toast.error(error.message || 'Error signing up');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    console.log("AuthContext: signOut called");
    
    try {
      // First set the user to null immediately to update UI
      setUser(null);
      
      // Then attempt to sign out from Supabase
      // We're not using await here to avoid blocking UI updates
      supabase.auth.signOut().catch(error => {
        console.error("Supabase signOut error:", error);
        // We've already set user to null, so UI should update regardless
      });
      
      return true;
    } catch (error) {
      console.error("Critical error in signOut function:", error);
      // Still set user to null even if there's an error
      setUser(null);
      return true;
    }
  };

  const value = {
    user,
    signIn,
    signUp,
    signOut,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
