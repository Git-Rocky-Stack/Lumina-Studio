/**
 * Auth Context for Lumina Studio
 *
 * Provides authentication state and API client configuration
 * throughout the application using Supabase.
 */

import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { loadUsageFromBackend } from '../services/usageService';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userAvatar: string | null;
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
  apiClient: <T>(endpoint: string, options?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.lumina-os.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Handle specific auth events
        if (event === 'SIGNED_IN' && session?.user) {
          // Sync usage from backend when user logs in
          loadUsageFromBackend(session.user.id).catch(console.debug);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const getToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  const value = useMemo<AuthContextType>(() => ({
    isAuthenticated: !!session,
    isLoading,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    userName: user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null,
    userAvatar: user?.user_metadata?.avatar_url ?? user?.user_metadata?.picture ?? null,
    user,
    session,
    signOut,
    getToken,

    apiClient: async <T,>(endpoint: string, options: RequestInit = {}): Promise<T> => {
      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || error.message || 'API request failed');
      }

      return response.json();
    },
  }), [isLoading, session, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
