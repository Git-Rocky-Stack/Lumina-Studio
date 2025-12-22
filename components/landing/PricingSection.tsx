import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Perfect for trying out Lumina Studio',
    features: [
      '20 AI images/month',
      '3 AI videos/month',
      '1GB storage',
      'Basic export formats',
      'Community support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 19,
    yearlyPrice: 15,
    description: 'For professionals and growing teams',
    features: [
      '500 AI images/month',
      '50 AI videos/month',
      '50GB storage',
      'All export formats',
      'Priority support',
      'Brand kit',
      'API access',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Team',
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: 'For teams that need more power',
    features: [
      '2000 AI images/month',
      '200 AI videos/month',
      '200GB storage',
      'All Pro features',
      'Up to 10 team members',
      'Advanced analytics',
      'SSO & Admin controls',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const PricingSection: React.FC = () => {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-semibold mb-6">
            Pricing
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Start free, upgrade when you need more power.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-4 p-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                !isYearly
                  ? 'bg-white text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                isYearly
                  ? 'bg-white text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                -20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-8 rounded-3xl border transition-all duration-300 ${
                plan.popular
                  ? 'bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border-indigo-500/50 scale-105 shadow-2xl shadow-indigo-500/20'
                  : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-sm font-bold shadow-lg">
                  Most Popular
                </div>
              )}

              {/* Plan header */}
              <div className="mb-8">
                <div className={`text-sm font-semibold mb-2 ${plan.popular ? 'text-indigo-400' : 'text-slate-400'}`}>
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black text-white">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-slate-500">/month</span>
                  )}
                </div>
                <p className="text-sm text-slate-400">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-check text-emerald-400 text-xs" />
                    </span>
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                to="/sign-up"
                className={`block w-full py-3.5 rounded-xl font-semibold text-center transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/25'
                    : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Enterprise callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-slate-800/50 to-slate-800/30 border border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div>
            <h3 className="text-2xl font-bold mb-2">Need more?</h3>
            <p className="text-slate-400">
              Enterprise plans with unlimited usage, custom integrations, and dedicated support.
            </p>
          </div>
          <button className="px-8 py-3 rounded-xl border border-slate-600 hover:bg-slate-700 font-semibold transition-all whitespace-nowrap">
            Contact Sales
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
