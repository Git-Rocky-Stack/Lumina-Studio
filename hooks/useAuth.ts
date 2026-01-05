// ============================================
// Enhanced useAuth Hook
// Comprehensive authentication management
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ============================================
// Types
// ============================================

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  company: string | null;
  job_title: string | null;
  website: string | null;
  country: string | null;
  timezone: string | null;
  preferences: UserPreferences;
  subscription_tier: 'free' | 'pro' | 'team' | 'enterprise';
  subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';
  trial_ends_at: string | null;
  storage_used_bytes: number;
  storage_limit_bytes: number;
  ai_credits_used: number;
  ai_credits_limit: number;
  last_active_at: string;
  login_count: number;
  onboarding_completed: boolean;
  onboarding_step: number;
  features_toured: string[];
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
  };
  privacy: {
    profilePublic: boolean;
    showActivity: boolean;
  };
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | Error | null;
}

export interface UseAuthReturn extends AuthState {
  // Authentication
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithGithub: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;

  // Password Management
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;

  // Profile Management
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  updateAvatar: (file: File) => Promise<{ success: boolean; url?: string; error?: string }>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;

  // Email Management
  updateEmail: (newEmail: string) => Promise<{ success: boolean; error?: string }>;

  // Session Management
  getToken: () => Promise<string | null>;
  refreshSession: () => Promise<void>;

  // Onboarding
  completeOnboarding: () => Promise<void>;
  updateOnboardingStep: (step: number) => Promise<void>;
  markFeatureToured: (feature: string) => Promise<void>;

  // Account
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

// ============================================
// Hook Implementation
// ============================================

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // ============================================
  // Profile Fetching
  // ============================================

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  }, []);

  // ============================================
  // Session Initialization
  // ============================================

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null;
      let profile: UserProfile | null = null;

      if (user) {
        profile = await fetchProfile(user.id);
      }

      setState({
        user,
        session,
        profile,
        isLoading: false,
        isAuthenticated: !!session,
        error: null,
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        let profile: UserProfile | null = null;

        if (user) {
          profile = await fetchProfile(user.id);
        }

        setState(prev => ({
          ...prev,
          user,
          session,
          profile,
          isLoading: false,
          isAuthenticated: !!session,
        }));

        // Log activity on sign in
        if (event === 'SIGNED_IN' && user) {
          supabase.rpc('log_user_activity', {
            p_user_id: user.id,
            p_action: 'sign_in',
            p_metadata: { provider: session?.user?.app_metadata?.provider || 'email' },
          }).catch(console.debug);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ============================================
  // Authentication Methods
  // ============================================

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        return { success: true, needsConfirmation: true };
      }

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Google sign in failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  const signInWithGithub = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'GitHub sign in failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      session: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, []);

  // ============================================
  // Password Management
  // ============================================

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        return { success: false, error: error.message };
      }

      // Log activity
      if (state.user) {
        supabase.rpc('log_user_activity', {
          p_user_id: state.user.id,
          p_action: 'password_changed',
        }).catch(console.debug);
      }

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Password update failed';
      return { success: false, error: errorMessage };
    }
  }, [state.user]);

  // ============================================
  // Profile Management
  // ============================================

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!state.user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', state.user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Update local state
      setState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...updates } : null,
      }));

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  }, [state.user]);

  const updateAvatar = useCallback(async (file: File) => {
    if (!state.user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${state.user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', state.user.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Update local state
      setState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, avatar_url: publicUrl } : null,
      }));

      return { success: true, url: publicUrl };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Avatar update failed';
      return { success: false, error: errorMessage };
    }
  }, [state.user]);

  const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
    if (!state.user || !state.profile) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const newPreferences = { ...state.profile.preferences, ...preferences };

      const { error } = await supabase
        .from('user_profiles')
        .update({ preferences: newPreferences })
        .eq('id', state.user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      // Update local state
      setState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, preferences: newPreferences } : null,
      }));

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Preferences update failed';
      return { success: false, error: errorMessage };
    }
  }, [state.user, state.profile]);

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;

    const profile = await fetchProfile(state.user.id);
    setState(prev => ({ ...prev, profile }));
  }, [state.user, fetchProfile]);

  // ============================================
  // Email Management
  // ============================================

  const updateEmail = useCallback(async (newEmail: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Email update failed';
      return { success: false, error: errorMessage };
    }
  }, []);

  // ============================================
  // Session Management
  // ============================================

  const getToken = useCallback(async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  const refreshSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.refreshSession();
    if (session) {
      setState(prev => ({ ...prev, session }));
    }
  }, []);

  // ============================================
  // Onboarding
  // ============================================

  const completeOnboarding = useCallback(async () => {
    await updateProfile({ onboarding_completed: true });
  }, [updateProfile]);

  const updateOnboardingStep = useCallback(async (step: number) => {
    await updateProfile({ onboarding_step: step });
  }, [updateProfile]);

  const markFeatureToured = useCallback(async (feature: string) => {
    if (!state.profile) return;

    const features = [...state.profile.features_toured, feature];
    await updateProfile({ features_toured: features });
  }, [state.profile, updateProfile]);

  // ============================================
  // Account Management
  // ============================================

  const deleteAccount = useCallback(async () => {
    if (!state.user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      // Delete user data first
      await supabase.from('user_profiles').delete().eq('id', state.user.id);

      // Sign out (account deletion should be handled by Supabase admin or Edge Function)
      await signOut();

      return { success: true };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Account deletion failed';
      return { success: false, error: errorMessage };
    }
  }, [state.user, signOut]);

  // ============================================
  // Return Hook Value
  // ============================================

  return {
    ...state,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGithub,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    updateAvatar,
    updatePreferences,
    refreshProfile,
    updateEmail,
    getToken,
    refreshSession,
    completeOnboarding,
    updateOnboardingStep,
    markFeatureToured,
    deleteAccount,
  };
}

export default useAuth;
