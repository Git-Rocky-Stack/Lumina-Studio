/**
 * Sign In Page for Lumina Studio
 *
 * Uses Clerk's SignIn component with custom styling
 * to match Lumina Studio's design system.
 */

import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

const SignInPage: React.FC = () => {
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
        <span className="text-2xl font-bold text-white tracking-tight">
          Lumina<span className="text-indigo-400">Studio</span>
        </span>
      </Link>

      {/* Sign In Component */}
      <div className="relative z-10 w-full max-w-md">
        <SignIn
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
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/studio"
        />
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
