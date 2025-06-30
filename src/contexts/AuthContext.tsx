import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Researcher } from '../types/survey';
import { getCurrentUser } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  researcher: Researcher | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  researcher: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [researcher, setResearcher] = useState<Researcher | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const clearAuthState = () => {
    setUser(null);
    setResearcher(null);
  };

  const signOut = async () => {
    try {
      // Clear state immediately
      clearAuthState();
      setLoading(true);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase sign out error:', error);
      }
      
      // Force clear all storage
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        // Also specifically clear Supabase auth keys
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (storageError) {
        console.error('Storage clear error:', storageError);
      }
      
      // Force reload to ensure clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Error during sign out:', error);
      // Force clear and redirect even on error
      clearAuthState();
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Emergency storage clear failed:', e);
      }
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  const fetchResearcher = async (userId: string) => {
    try {
      const researcherData = await getCurrentUser();
      setResearcher(researcherData);
    } catch (error) {
      console.error('Error getting researcher:', error);
      setResearcher(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session only once
    const initializeAuth = async () => {
      if (initialized) return;
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            clearAuthState();
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (session?.user && mounted) {
          setUser(session.user);
          await fetchResearcher(session.user.id);
        } else if (mounted) {
          // No session found
          clearAuthState();
        }
        
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          clearAuthState();
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted || !initialized) return;
      
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_OUT' || !session?.user) {
        clearAuthState();
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session.user);
        await fetchResearcher(session.user.id);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialized]);

  return (
    <AuthContext.Provider value={{ user, researcher, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};