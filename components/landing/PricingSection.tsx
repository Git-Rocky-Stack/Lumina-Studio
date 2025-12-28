import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import PricingCalculator from './PricingCalculator';
import TrustBadges from './TrustBadges';

const plans = [
  {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Try Lumina with included credits',
    features: [
      '20 AI images/month',
      '3 AI videos/month',
      '1GB storage',
      'Basic export formats',
      'Community support',
    ],
    byokFeature: 'Or unlimited with your own API key',
    cta: 'Get Started',
    popular: false,
    gradient: 'from-slate-500 to-slate-600',
  },
  {
    name: 'Starter',
    monthlyPrice: 9,
    yearlyPrice: 7,
    description: 'BYOK-only — bring your own Gemini key',
    features: [
      'Unlimited AI images (BYOK)',
      'Unlimited AI videos (BYOK)',
      '10GB storage',
      'All export formats',
      'Email support',
      'Full platform access',
    ],
    byokFeature: 'Your API key = unlimited generation',
    cta: 'Start Creating',
    popular: false,
    gradient: 'from-emerald-500 to-teal-600',
    byokOnly: true,
  },
  {
    name: 'Pro',
    monthlyPrice: 19,
    yearlyPrice: 15,
    description: 'Included credits + BYOK unlimited',
    features: [
      '500 AI images/month included',
      '50 AI videos/month included',
      '50GB storage',
      'All export formats',
      'Priority support',
      'Brand kit',
      'API access',
    ],
    byokFeature: '+ Unlimited with your own API key',
    cta: 'Start Pro Trial',
    popular: true,
    gradient: 'from-indigo-500 to-violet-600',
  },
  {
    name: 'Team',
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: 'Maximum power for teams',
    features: [
      '2000 AI images/month included',
      '200 AI videos/month included',
      '200GB storage',
      'All Pro features',
      'Up to 10 team members',
      'Advanced analytics',
      'SSO & Admin controls',
    ],
    byokFeature: '+ Unlimited with your own API key',
    cta: 'Contact Sales',
    popular: false,
    gradient: 'from-violet-500 to-purple-600',
  },
];

const PricingSection: React.FC = () => {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section id="pricing" className="py-32 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-card text-indigo-400 text-sm font-semibold mb-8"
          >
            <i className="fas fa-tag text-xs" />
            Pricing
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display tracking-tight">
            Simple,{' '}
            <span className="text-gradient-primary">Transparent</span> Pricing
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-12">
            Start free, upgrade when you need more power.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl glass-card">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                !isYearly
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                isYearly
                  ? 'bg-white text-slate-900 shadow-lg'
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

        {/* Pricing cards - Improved responsive grid for 4 tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5">
          {plans.map((plan, i) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              isYearly={isYearly}
              delay={i * 0.1}
            />
          ))}
        </div>

        {/* BYOK Explainer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl glass-card">
            <i className="fas fa-key text-emerald-400" />
            <span className="text-slate-300 text-sm">
              <strong className="text-white">BYOK</strong> = Bring Your Own Key — use your Gemini API key for unlimited AI generation at Google's pay-as-you-go rates
            </span>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <i className="fas fa-external-link text-xs" />
            </a>
          </div>
        </motion.div>

        {/* Enterprise callout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16"
        >
          <div className="relative glass-card rounded-3xl p-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-purple-500/5" />
            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl">
                  <i className="fas fa-building text-2xl text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Need more power?</h3>
                  <p className="text-slate-400">
                    Enterprise plans with unlimited usage, custom integrations, and dedicated support.
                  </p>
                </div>
              </div>
              <button className="px-8 py-4 rounded-xl glass-card glass-card-hover font-semibold transition-all whitespace-nowrap flex items-center gap-3 group">
                <span>Contact Sales</span>
                <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Pricing Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20"
        >
          <PricingCalculator />
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16"
        >
          <TrustBadges variant="full" />
        </motion.div>
      </div>
    </section>
  );
};

const PricingCard: React.FC<{
  plan: typeof plans[0] & { byokFeature?: string; byokOnly?: boolean };
  isYearly: boolean;
  delay: number;
}> = ({ plan, isYearly, delay }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 300, damping: 30 };
  const spotlightX = useSpring(useMotionValue(50), springConfig);
  const spotlightY = useSpring(useMotionValue(50), springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    spotlightX.set(((e.clientX - rect.left) / rect.width) * 100);
    spotlightY.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  const handleMouseLeave = () => {
    spotlightX.set(50);
    spotlightY.set(50);
  };

  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative group ${plan.popular ? 'lg:-mt-4 lg:mb-4' : ''}`}
    >
      {/* Glow effect */}
      {plan.popular && (
        <div className={`absolute -inset-1 bg-gradient-to-r ${plan.gradient} rounded-[2rem] blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500`} />
      )}

      {/* Card */}
      <div className={`relative h-full p-8 rounded-3xl overflow-hidden transition-all duration-500 ${
        plan.popular
          ? 'glass-card border-indigo-500/30'
          : 'glass-card'
      }`}>
        {/* Spotlight effect */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: useTransform(
              [spotlightX, spotlightY],
              ([x, y]) => `radial-gradient(400px circle at ${x}% ${y}%, rgba(99, 102, 241, 0.1), transparent 40%)`
            ),
          }}
        />

        {/* Popular badge */}
        {plan.popular && (
          <div className="absolute -top-px left-1/2 -translate-x-1/2">
            <div className={`px-6 py-2 rounded-b-xl bg-gradient-to-r ${plan.gradient} text-sm font-bold shadow-lg`}>
              Most Popular
            </div>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 pt-4">
          {/* Plan name */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${plan.gradient} bg-opacity-20 mb-6`}>
            <span className="text-sm font-semibold text-white">{plan.name}</span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">${price}</span>
              {plan.monthlyPrice > 0 && (
                <span className="text-slate-500 font-medium">/month</span>
              )}
            </div>
            {isYearly && plan.monthlyPrice > 0 && (
              <p className="text-sm text-emerald-400 mt-2">
                Save ${(plan.monthlyPrice - plan.yearlyPrice) * 12}/year
              </p>
            )}
          </div>

          <p className="text-slate-400 mb-8">{plan.description}</p>

          {/* Features */}
          <ul className="space-y-3 mb-6">
            {plan.features.map((feature, i) => (
              <motion.li
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: delay + i * 0.05 }}
                className="flex items-center gap-3 text-sm"
              >
                <span className={`w-5 h-5 rounded-md bg-gradient-to-br ${plan.gradient} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
                  <i className="fas fa-check text-emerald-400 text-[10px]" />
                </span>
                <span className="text-slate-300 text-xs">{feature}</span>
              </motion.li>
            ))}
          </ul>

          {/* BYOK Feature Highlight */}
          {plan.byokFeature && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: delay + 0.3 }}
              className={`mb-6 p-3 rounded-xl ${
                plan.byokOnly
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-indigo-500/10 border border-indigo-500/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <i className={`fas fa-key text-xs ${plan.byokOnly ? 'text-emerald-400' : 'text-indigo-400'}`} />
                <span className={`text-xs font-semibold ${plan.byokOnly ? 'text-emerald-300' : 'text-indigo-300'}`}>
                  {plan.byokFeature}
                </span>
              </div>
            </motion.div>
          )}

          {/* CTA */}
          <Link
            to="/sign-up"
            className={`block w-full py-4 rounded-xl font-semibold text-center transition-all duration-300 ${
              plan.popular
                ? `bg-gradient-to-r ${plan.gradient} hover:opacity-90 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30`
                : 'glass-card glass-card-hover'
            }`}
          >
            {plan.cta}
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default PricingSection;
