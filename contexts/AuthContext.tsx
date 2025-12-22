/**
 * Auth Context for Lumina Studio
 *
 * Provides authentication state and API client configuration
 * throughout the application using Clerk.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userAvatar: string | null;
  getToken: () => Promise<string | null>;
  apiClient: <T>(endpoint: string, options?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.lumina-os.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const value = useMemo<AuthContextType>(() => ({
    isAuthenticated: isSignedIn ?? false,
    isLoading: !isLoaded,
    userId: user?.id ?? null,
    userEmail: user?.primaryEmailAddress?.emailAddress ?? null,
    userName: user?.fullName ?? user?.firstName ?? null,
    userAvatar: user?.imageUrl ?? null,

    getToken: async () => {
      try {
        return await getToken();
      } catch {
        return null;
      }
    },

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
  }), [isLoaded, isSignedIn, user, getToken]);

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
