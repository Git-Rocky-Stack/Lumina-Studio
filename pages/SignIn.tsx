/**
 * Sign In Page for Lumina Studio
 *
 * Uses Supabase Auth UI with custom styling
 * to match Lumina Studio's design system.
 */

import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthContext();

  // Redirect to studio if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/studio', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Get the current URL for redirect
  const redirectUrl = `${window.location.origin}/auth/callback`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <Link to="/" className="relative z-10 mb-8 flex items-center gap-3 group">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">
            Lumina<span className="text-indigo-400">Studio</span>
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider bg-gradient-to-r from-indigo-500 to-violet-600 rounded text-white">OS</span>
        </div>
      </Link>

      {/* Sign In Component */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/20 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white text-center mb-2">Welcome back</h2>
          <p className="text-slate-400 text-center mb-6 text-sm">Sign in to continue to Lumina Studio</p>

          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#6366f1',
                    brandAccent: '#4f46e5',
                    brandButtonText: 'white',
                    defaultButtonBackground: 'rgba(51, 65, 85, 0.5)',
                    defaultButtonBackgroundHover: 'rgba(71, 85, 105, 0.7)',
                    defaultButtonBorder: 'rgba(71, 85, 105, 0.5)',
                    defaultButtonText: 'white',
                    dividerBackground: 'rgba(71, 85, 105, 0.5)',
                    inputBackground: 'rgba(51, 65, 85, 0.5)',
                    inputBorder: 'rgba(71, 85, 105, 0.5)',
                    inputBorderHover: '#6366f1',
                    inputBorderFocus: '#6366f1',
                    inputText: 'white',
                    inputLabelText: '#cbd5e1',
                    inputPlaceholder: '#64748b',
                    messageText: '#f8fafc',
                    messageTextDanger: '#f87171',
                    anchorTextColor: '#818cf8',
                    anchorTextHoverColor: '#a5b4fc',
                  },
                  space: {
                    inputPadding: '14px',
                    buttonPadding: '14px',
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '12px',
                    buttonBorderRadius: '12px',
                    inputBorderRadius: '12px',
                  },
                  fonts: {
                    bodyFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
                    buttonFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
                    inputFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
                  },
                },
              },
              className: {
                container: 'space-y-4',
                button: 'font-semibold shadow-lg transition-all',
                input: 'placeholder-slate-500',
                label: 'font-medium',
                anchor: 'font-medium transition-colors',
              },
            }}
            providers={['google']}
            redirectTo={redirectUrl}
            view="sign_in"
            showLinks={true}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email address',
                  password_label: 'Password',
                  button_label: 'Sign in',
                  loading_button_label: 'Signing in...',
                  social_provider_text: 'Continue with {{provider}}',
                  link_text: "Don't have an account? Sign up",
                },
              },
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-slate-500 text-sm">
        Don't have an account?{' '}
        <Link to="/sign-up" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
};

export default SignInPage;
