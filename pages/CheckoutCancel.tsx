/**
 * Checkout Cancel Page
 *
 * Displayed when user cancels the Stripe checkout flow.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CheckoutCancel: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full text-center space-y-8"
      >
        {/* Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
          <i className="fas fa-times text-3xl text-slate-400" />
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Checkout Cancelled</h1>
          <p className="text-xl text-slate-400">
            No worries — your card was not charged.
          </p>
        </div>

        {/* Message */}
        <div className="glass-card rounded-2xl p-6 text-left">
          <h2 className="font-semibold mb-3">Changed your mind?</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            That's completely fine! You can still use Lumina's free tier with 15 AI images
            and 2 videos per month. Or if you have your own Gemini API key, our Starter plan
            gives you unlimited generation for just $12/month.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              to="/#pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl glass-card glass-card-hover font-medium transition-all"
            >
              <i className="fas fa-tag text-sm text-indigo-400" />
              <span>View Plans</span>
            </Link>
            <Link
              to="/studio"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-medium hover:opacity-90 transition-all"
            >
              <span>Continue Free</span>
              <i className="fas fa-arrow-right text-sm" />
            </Link>
          </div>

          <p className="text-sm text-slate-500">
            Questions? <a href="mailto:support@strategia-x.com" className="text-indigo-400 hover:underline">Contact support</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutCancel;
