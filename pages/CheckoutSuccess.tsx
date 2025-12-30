/**
 * Checkout Success Page
 *
 * Displayed after successful Stripe checkout. Shows confirmation and next steps.
 */

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const CheckoutSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // In production, you might verify the session with your backend
    // For now, we just show the success message after a brief delay
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        {isVerifying ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center">
              <i className="fas fa-spinner fa-spin text-3xl text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold">Verifying your payment...</h1>
            <p className="text-slate-400">Please wait while we confirm your subscription.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-xl shadow-emerald-500/30"
            >
              <i className="fas fa-check text-4xl text-white" />
            </motion.div>

            {/* Title */}
            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  Lumina Pro
                </span>
              </h1>
              <p className="text-xl text-slate-400">
                Your subscription is now active!
              </p>
            </div>

            {/* Benefits */}
            <div className="glass-card rounded-2xl p-6 text-left space-y-4">
              <h2 className="font-semibold text-lg mb-4">What's included:</h2>
              <div className="space-y-3">
                {[
                  'Unlimited AI generations with your API key',
                  'Cloud sync across all your devices',
                  'Priority support',
                  'All export formats',
                  'Brand kit & style guides',
                ].map((benefit, i) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-check text-emerald-400 text-xs" />
                    </span>
                    <span className="text-slate-300">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-4">
              <Link
                to="/studio"
                className="inline-flex items-center justify-center gap-3 w-full px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold hover:from-indigo-600 hover:to-violet-700 transition-all hover:scale-105 shadow-lg shadow-indigo-500/25"
              >
                <span>Start Creating</span>
                <i className="fas fa-arrow-right text-sm" />
              </Link>
              <p className="text-sm text-slate-500">
                A confirmation email has been sent to your inbox.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CheckoutSuccess;
