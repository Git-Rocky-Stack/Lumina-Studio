/**
 * Sign Up Page for Lumina Studio
 *
 * Uses Supabase Auth UI with custom styling
 * to match Lumina Studio's design system.
 * Includes email verification messaging.
 */

import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';

const SignUpPage: React.FC = () => {
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
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
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

      {/* Sign Up Component */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/20 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white text-center mb-2">Create your account</h2>
          <p className="text-slate-400 text-center mb-6 text-sm">Start creating with AI-powered tools</p>

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
            view="sign_up"
            showLinks={true}
            localization={{
              variables: {
                sign_up: {
                  email_label: 'Email address',
                  password_label: 'Create a password',
                  button_label: 'Sign up',
                  loading_button_label: 'Creating account...',
                  social_provider_text: 'Continue with {{provider}}',
                  link_text: 'Already have an account? Sign in',
                  confirmation_text: 'Check your email for the confirmation link',
                },
              },
            }}
          />
        </div>
      </div>

      {/* Email Verification Info */}
      <div className="relative z-10 mt-6 max-w-md text-center">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-slate-300 font-medium text-sm">Email Verification</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            After signing up with email, check your inbox for a <span className="text-indigo-400 font-medium">confirmation link</span>.
            Click it to verify your account and access Lumina Studio.
          </p>
          <p className="text-slate-500 text-[10px] mt-2">
            Using Google? You'll be signed in automatically - no verification needed!
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="relative z-10 mt-8 grid grid-cols-3 gap-8 max-w-lg text-center">
        <div className="space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-400 text-xs">AI Image Generation</p>
        </div>
        <div className="space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-violet-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-400 text-xs">Video Creation</p>
        </div>
        <div className="space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
            </svg>
          </div>
          <p className="text-slate-400 text-xs">Brand Tools</p>
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-slate-500 text-sm">
        Already have an account?{' '}
        <Link to="/sign-in" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default SignUpPage;
