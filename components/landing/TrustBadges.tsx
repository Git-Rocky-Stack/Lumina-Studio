import React from 'react';
import { motion } from 'framer-motion';

interface TrustBadgesProps {
  variant?: 'full' | 'compact' | 'inline';
  className?: string;
}

const badges = [
  {
    icon: 'fa-shield-alt',
    label: 'SOC 2 Type II',
    description: 'Enterprise security',
    color: 'emerald',
  },
  {
    icon: 'fa-lock',
    label: 'SSL Encrypted',
    description: '256-bit encryption',
    color: 'indigo',
  },
  {
    icon: 'fa-user-shield',
    label: 'GDPR Compliant',
    description: 'Data protection',
    color: 'violet',
  },
  {
    icon: 'fa-credit-card',
    label: 'Secure Payments',
    description: 'Stripe powered',
    color: 'amber',
  },
];

const paymentMethods = [
  { icon: 'fa-cc-visa', label: 'Visa' },
  { icon: 'fa-cc-mastercard', label: 'Mastercard' },
  { icon: 'fa-cc-amex', label: 'American Express' },
  { icon: 'fa-cc-paypal', label: 'PayPal' },
  { icon: 'fa-cc-apple-pay', label: 'Apple Pay' },
];

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
};

const TrustBadges: React.FC<TrustBadgesProps> = ({ variant = 'full', className = '' }) => {
  if (variant === 'inline') {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-4 ${className}`}>
        {badges.slice(0, 3).map((badge) => (
          <div
            key={badge.label}
            className="flex items-center gap-2 text-slate-400 text-sm"
          >
            <i className={`fas ${badge.icon} ${colorClasses[badge.color].text}`} aria-hidden="true" />
            <span>{badge.label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
        {badges.map((badge) => (
          <div
            key={badge.label}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colorClasses[badge.color].bg} border ${colorClasses[badge.color].border}`}
          >
            <i className={`fas ${badge.icon} ${colorClasses[badge.color].text}`} aria-hidden="true" />
            <span className="text-slate-300 text-sm font-medium">{badge.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Security Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl ${colorClasses[badge.color].bg} border ${colorClasses[badge.color].border} text-center`}
          >
            <div className={`w-10 h-10 mx-auto mb-3 rounded-lg ${colorClasses[badge.color].bg} flex items-center justify-center`}>
              <i className={`fas ${badge.icon} ${colorClasses[badge.color].text}`} aria-hidden="true" />
            </div>
            <p className="text-white font-semibold text-sm mb-1">{badge.label}</p>
            <p className="text-slate-500 text-xs">{badge.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="flex flex-col items-center">
        <p className="text-slate-500 text-sm mb-4">Accepted payment methods</p>
        <div className="flex items-center gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.label}
              className="w-12 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title={method.label}
            >
              <i className={`fab ${method.icon} text-lg`} aria-label={method.label} />
            </div>
          ))}
        </div>
      </div>

      {/* Guarantee */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="mt-8 p-6 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <i className="fas fa-medal text-2xl text-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-white font-semibold mb-1">30-Day Money Back Guarantee</h4>
            <p className="text-slate-400 text-sm">
              Not satisfied? Get a full refund within 30 days, no questions asked.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TrustBadges;
