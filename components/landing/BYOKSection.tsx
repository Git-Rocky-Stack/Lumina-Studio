import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const benefits = [
  {
    icon: 'fa-infinity',
    title: 'Unlimited Generation',
    description: 'No monthly limits. Generate as much as you want.',
  },
  {
    icon: 'fa-piggy-bank',
    title: 'Pay Only for What You Use',
    description: 'Your API costs, your control. Often cheaper than credits.',
  },
  {
    icon: 'fa-shield-halved',
    title: 'Your Key, Your Data',
    description: 'Direct connection to Google. We never store your key.',
  },
  {
    icon: 'fa-rocket',
    title: 'Same Pro Features',
    description: 'Full access to all tools and export options.',
  },
];

const BYOKSection: React.FC = () => {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-card text-amber-400 text-sm font-semibold mb-8"
            >
              <i className="fas fa-key text-xs" />
              Bring Your Own Key
            </motion.span>

            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-display tracking-tight">
              Already Have a{' '}
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Gemini API Key?
              </span>
            </h2>

            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
              Use your own Google Gemini API key for <span className="text-white font-semibold">unlimited generations</span> at
              no extra cost. You only pay for platform access — generation is on your tab.
            </p>

            {/* Benefits grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {benefits.map((benefit, i) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <i className={`fas ${benefit.icon} text-amber-400`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{benefit.title}</h3>
                    <p className="text-slate-500 text-sm">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/sign-up"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-semibold hover:from-amber-600 hover:to-orange-700 transition-all hover:scale-105 shadow-lg shadow-amber-500/25"
              >
                <span>Start with BYOK</span>
                <i className="fas fa-arrow-right text-sm" />
              </Link>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl glass-card font-semibold hover:border-amber-500/30 transition-all"
              >
                <span>Get a Free API Key</span>
                <i className="fas fa-external-link text-sm text-slate-500" />
              </a>
            </div>
          </motion.div>

          {/* Right - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
              {/* Decorative background */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5" />

              {/* Code-like illustration */}
              <div className="relative space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  <span className="ml-4 text-slate-500 text-sm font-mono">settings.tsx</span>
                </div>

                {/* "Code" content */}
                <div className="font-mono text-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">1</span>
                    <span className="text-violet-400">const</span>
                    <span className="text-white">apiKey</span>
                    <span className="text-slate-500">=</span>
                    <span className="text-amber-400">"YOUR_GEMINI_KEY"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">2</span>
                    <span className="text-slate-600">// That's it. Unlimited generations.</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">$0</div>
                    <div className="text-xs text-slate-500">Extra Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">0</div>
                    <div className="text-xs text-slate-500">Generation Limits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">100%</div>
                    <div className="text-xs text-slate-500">Features</div>
                  </div>
                </div>

                {/* Connection visual */}
                <div className="flex items-center justify-center gap-4 pt-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                    <i className="fas fa-user text-slate-400" />
                  </div>
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-slate-700 via-amber-500 to-slate-700 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                </div>
                <p className="text-center text-slate-500 text-xs">
                  Direct connection to Google Gemini API
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BYOKSection;
