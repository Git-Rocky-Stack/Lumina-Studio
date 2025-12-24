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
    const handleCallback = async () => {
      try {
        // Get the auth code from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorParam = queryParams.get('error') || hashParams.get('error');
        const errorDescription = queryParams.get('error_description') || hashParams.get('error_description');

        if (errorParam) {
          setError(errorDescription || errorParam);
          return;
        }

        if (accessToken && refreshToken) {
          // Set the session manually if tokens are in the URL
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setError(sessionError.message);
            return;
          }
        }

        // Check if we have a valid session
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession();

        if (getSessionError) {
          setError(getSessionError.message);
          return;
        }

        if (session) {
          // Successfully authenticated, redirect to studio
          navigate('/studio', { replace: true });
        } else {
          // No session, might be email confirmation - wait a bit and check again
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              navigate('/studio', { replace: true });
            } else {
              // Still no session, redirect to sign-in
              navigate('/sign-in', { replace: true });
            }
          }, 1000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    };

    handleCallback();
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
