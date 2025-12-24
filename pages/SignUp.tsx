/**
 * Sign Up Page for Lumina Studio
 *
 * Uses Clerk's SignUp component with custom styling
 * to match Lumina Studio's design system.
 * Includes enhanced email verification flow with clear messaging.
 */

import React from 'react';
import { SignUp, useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

// Check if Clerk is properly configured
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured = CLERK_KEY && CLERK_KEY !== 'pk_test_placeholder' && CLERK_KEY.startsWith('pk_');

const SignUpPage: React.FC = () => {
  // If Clerk isn't configured, show a helpful message
  if (!isClerkConfigured) {
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

        {/* Configuration Message */}
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/20 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Authentication Setup Required</h2>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              The authentication system is being configured. Please check back shortly or contact support if this persists.
            </p>
            <div className="space-y-3">
              <Link
                to="/"
                className="block w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold rounded-xl hover:brightness-110 transition-all"
              >
                Return to Home
              </Link>
              <a
                href="mailto:support@lumina-os.com"
                className="block w-full py-3 px-6 bg-slate-700/50 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-all"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>

        <p className="relative z-10 mt-8 text-slate-500 text-sm">
          Already have an account?{' '}
          <Link to="/sign-in" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

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
        <SignUp
          appearance={{
            elements: {
              // Root & Card styling
              rootBox: 'w-full',
              card: 'bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/20 rounded-2xl',

              // Header styling
              headerTitle: 'text-white text-xl font-semibold',
              headerSubtitle: 'text-slate-400',

              // Social buttons
              socialButtonsBlockButton: 'bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-700 transition-colors',
              socialButtonsBlockButtonText: 'text-white font-medium',

              // Divider
              dividerLine: 'bg-slate-700',
              dividerText: 'text-slate-500',

              // Form fields
              formFieldLabel: 'text-slate-300 font-medium',
              formFieldInput: 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-500 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl',
              formFieldHintText: 'text-slate-400',
              formFieldErrorText: 'text-rose-400',
              formFieldSuccessText: 'text-emerald-400',
              formFieldWarningText: 'text-amber-400',

              // Primary button
              formButtonPrimary: 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold shadow-lg shadow-indigo-500/25 rounded-xl transition-all',

              // Links
              footerActionLink: 'text-indigo-400 hover:text-indigo-300 font-medium',
              identityPreviewEditButton: 'text-indigo-400 hover:text-indigo-300',
              formFieldAction: 'text-indigo-400 hover:text-indigo-300',
              formResendCodeLink: 'text-indigo-400 hover:text-indigo-300 font-medium',

              // Alert & messages
              alertText: 'text-slate-300',
              alert: 'bg-slate-700/50 border border-slate-600/50 rounded-xl',
              alertIcon: 'text-indigo-400',

              // Password visibility toggle
              formFieldInputShowPasswordButton: 'text-slate-400 hover:text-white',

              // ============================================
              // EMAIL VERIFICATION / OTP STYLING
              // ============================================

              // Verification page header
              verificationLinkStatusBox: 'bg-slate-700/30 border border-slate-600/50 rounded-xl p-4',
              verificationLinkStatusIcon: 'text-indigo-400',
              verificationLinkStatusIconBox: 'bg-indigo-500/20 rounded-full p-3',
              verificationLinkStatusText: 'text-slate-300 text-sm',

              // OTP Code Input Fields (the 6-digit code boxes)
              otpCodeFieldInputs: 'gap-3',
              otpCodeFieldInput: 'bg-slate-700/50 border-2 border-slate-600/50 text-white text-center text-xl font-bold rounded-xl w-12 h-14 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all',
              otpCodeFieldErrorText: 'text-rose-400 text-sm mt-2',

              // Code form
              codeForm: 'space-y-4',

              // Alternative verification methods
              alternativeMethodsBlockButton: 'bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl transition-colors',

              // Back button
              backLink: 'text-slate-400 hover:text-white',
              backRow: 'mb-4',

              // Identity preview (shows email being verified)
              identityPreview: 'bg-slate-700/30 border border-slate-600/50 rounded-xl p-4',
              identityPreviewText: 'text-white font-medium',
              identityPreviewEditButtonIcon: 'text-indigo-400',

              // Footer
              footer: 'mt-4',
              footerAction: 'text-slate-400',
              footerActionText: 'text-slate-400',
              footerPages: 'text-slate-500',
              footerPagesLink: 'text-slate-400 hover:text-indigo-400',

              // Loading states
              spinner: 'text-indigo-400',

              // Main container for verification step
              main: 'space-y-4',
              form: 'space-y-4',
            },
            layout: {
              socialButtonsPlacement: 'top',
              showOptionalFields: false,
            },
            variables: {
              colorPrimary: '#6366f1',
              colorText: '#f8fafc',
              colorTextSecondary: '#94a3b8',
              colorBackground: 'transparent',
              colorInputBackground: 'rgba(51, 65, 85, 0.5)',
              colorInputText: '#f8fafc',
              borderRadius: '0.75rem',
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/studio"
        />
      </div>

      {/* Verification Help Text - Shows below the Clerk component */}
      <div className="relative z-10 mt-6 max-w-md text-center">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-slate-300 font-medium text-sm">Email Verification</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            After signing up, check your email inbox for a <span className="text-indigo-400 font-medium">6-digit verification code</span>.
            Enter the code above to verify your account and access Lumina Studio.
          </p>
          <p className="text-slate-500 text-[10px] mt-2">
            Didn't receive it? Check your spam folder or click "Resend code"
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
