/**
 * Sign Up Page for Lumina Studio
 *
 * Uses Clerk's SignUp component with custom styling
 * to match Lumina Studio's design system.
 */

import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

const SignUpPage: React.FC = () => {
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
        <span className="text-2xl font-bold text-white tracking-tight">
          Lumina<span className="text-indigo-400">Studio</span>
        </span>
      </Link>

      {/* Sign Up Component */}
      <div className="relative z-10 w-full max-w-md">
        <SignUp
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/20 rounded-2xl',
              headerTitle: 'text-white text-xl font-semibold',
              headerSubtitle: 'text-slate-400',
              socialButtonsBlockButton: 'bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-700 transition-colors',
              socialButtonsBlockButtonText: 'text-white font-medium',
              dividerLine: 'bg-slate-700',
              dividerText: 'text-slate-500',
              formFieldLabel: 'text-slate-300 font-medium',
              formFieldInput: 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-500 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl',
              formButtonPrimary: 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold shadow-lg shadow-indigo-500/25 rounded-xl transition-all',
              footerActionLink: 'text-indigo-400 hover:text-indigo-300 font-medium',
              identityPreviewEditButton: 'text-indigo-400 hover:text-indigo-300',
              formFieldAction: 'text-indigo-400 hover:text-indigo-300',
              alertText: 'text-slate-300',
              formFieldInputShowPasswordButton: 'text-slate-400 hover:text-white',
            },
            layout: {
              socialButtonsPlacement: 'top',
              showOptionalFields: false,
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/studio"
        />
      </div>

      {/* Features */}
      <div className="relative z-10 mt-12 grid grid-cols-3 gap-8 max-w-lg text-center">
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
