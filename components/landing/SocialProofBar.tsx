import React from 'react';
import { motion } from 'framer-motion';

const logos = [
  { icon: 'fa-spotify', name: 'Spotify' },
  { icon: 'fa-slack', name: 'Slack' },
  { icon: 'fa-figma', name: 'Figma' },
  { icon: 'fa-dribbble', name: 'Dribbble' },
  { icon: 'fa-airbnb', name: 'Airbnb' },
  { icon: 'fa-stripe', name: 'Stripe' },
];

const SocialProofBar: React.FC = () => {
  return (
    <section className="py-16 border-y border-slate-800/50 bg-slate-900/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-slate-500 text-sm font-medium mb-10 uppercase tracking-wider"
        >
          Trusted by creative teams worldwide
        </motion.p>

        {/* Logo marquee */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-900 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-900 to-transparent z-10" />

          {/* Scrolling logos */}
          <div className="flex overflow-hidden">
            <div className="flex animate-marquee">
              {[...logos, ...logos].map((logo, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center px-12 py-4 group"
                >
                  <div className="flex items-center gap-3 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 cursor-pointer">
                    <i className={`fab ${logo.icon} text-3xl text-slate-300 group-hover:text-indigo-400`} />
                    <span className="text-lg font-semibold text-slate-400 group-hover:text-white hidden sm:block">
                      {logo.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm"
        >
          <div className="flex items-center gap-2 text-slate-400">
            <i className="fas fa-shield-check text-emerald-400" />
            <span>SOC 2 Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <i className="fas fa-lock text-emerald-400" />
            <span>Enterprise Security</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <i className="fas fa-clock text-emerald-400" />
            <span>99.9% Uptime SLA</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProofBar;
