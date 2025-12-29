/**
 * Auth Callback Page
 *
 * Handles OAuth redirects from Supabase.
 * Processes the auth tokens and redirects to the studio.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for error in URL params first
    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const errorParam = queryParams.get('error') || hashParams.get('error');
    const errorDescription = queryParams.get('error_description') || hashParams.get('error_description');

    if (errorParam) {
      setError(errorDescription || errorParam);
      return;
    }

    // Listen for auth state changes - this handles the PKCE code exchange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Successfully authenticated, redirect to studio
        navigate('/studio', { replace: true });
      } else if (event === 'TOKEN_REFRESHED' && session) {
        navigate('/studio', { replace: true });
      }
    });

    // Also check for existing session (in case auth state already resolved)
    const checkSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (session) {
        navigate('/studio', { replace: true });
      } else {
        // Wait a bit for PKCE code exchange to complete
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            navigate('/studio', { replace: true });
          }
          // If still no session after 3 seconds, the subscription will handle it
        }, 2000);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-rose-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Authentication Error</h2>
          <p className="text-slate-400 mb-6 text-sm">{error}</p>
          <button
            onClick={() => navigate('/sign-in', { replace: true })}
            className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold rounded-xl hover:brightness-110 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse">
          <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="text-slate-400 text-sm">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
