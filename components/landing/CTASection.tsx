import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CTASection: React.FC = () => {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px]">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-purple-500/20 rounded-full blur-[200px] animate-morph" />
        </div>
        <div className="absolute inset-0 bg-grid opacity-30" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass-card mb-10"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <i className="fas fa-gift text-white text-sm" />
            </div>
            <span className="text-slate-300 font-medium">Start with 20 free AI generations</span>
          </motion.div>

          {/* Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-black mb-8 font-display tracking-tight leading-[1.1]">
            Ready to Transform Your
            <br />
            <span className="text-gradient-primary animate-gradient bg-[length:200%_auto]">
              Creative Workflow?
            </span>
          </h2>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Join <span className="text-white font-semibold">50,000+</span> creators already using Lumina Studio to create stunning content <span className="text-white font-semibold">10x faster</span>.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-16">
            <Link
              to="/sign-up"
              className="group relative px-12 py-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 font-bold text-lg shadow-2xl shadow-indigo-500/30 btn-premium flex items-center gap-4 animate-gradient bg-[length:200%_auto]"
            >
              <span className="relative z-10">Get Started for Free</span>
              <span className="relative z-10 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <i className="fas fa-arrow-right group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            <button className="group px-10 py-6 rounded-2xl glass-card glass-card-hover font-semibold text-lg transition-all flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center group-hover:border-indigo-400/50 transition-colors">
                <i className="fas fa-calendar text-indigo-400" />
              </div>
              <span className="text-slate-200 group-hover:text-white transition-colors">Schedule Demo</span>
            </button>
          </div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
          >
            {[
              { icon: 'fa-credit-card', label: 'No credit card required' },
              { icon: 'fa-clock', label: 'Setup in under 2 minutes' },
              { icon: 'fa-times-circle', label: 'Cancel anytime' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3 text-slate-500"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center">
                  <i className={`fas ${item.icon} text-sm`} />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-24 h-24 border border-indigo-500/20 rounded-2xl rotate-12 animate-float hidden lg:block" />
        <div className="absolute bottom-20 right-10 w-20 h-20 border border-violet-500/20 rounded-full animate-float-delayed hidden lg:block" />
        <div className="absolute top-1/2 left-0 w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-xl animate-pulse hidden lg:block" />
        <div className="absolute top-1/3 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-xl animate-pulse hidden lg:block" />
      </div>
    </section>
  );
};

export default CTASection;
