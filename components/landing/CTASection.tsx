import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CTASection: React.FC = () => {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-purple-500/20 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <i className="fas fa-gift text-indigo-400" />
            <span className="text-sm text-slate-300">Start with 20 free AI generations</span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Ready to Transform Your
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Creative Workflow?
            </span>
          </h2>

          {/* Subheadline */}
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Join 50,000+ creators already using Lumina Studio to create stunning content 10x faster.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              to="/sign-up"
              className="group px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 font-bold text-lg shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105 flex items-center gap-3"
            >
              Get Started for Free
              <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="px-10 py-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 font-semibold text-lg transition-all flex items-center gap-3">
              <i className="fas fa-calendar text-indigo-400" />
              Schedule Demo
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <i className="fas fa-credit-card" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-clock" />
              <span>Setup in under 2 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-times-circle" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
