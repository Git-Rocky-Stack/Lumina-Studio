import React from 'react';
import { motion } from 'framer-motion';

const logos = [
  { icon: 'fa-spotify', name: 'Spotify', color: '#1DB954' },
  { icon: 'fa-slack', name: 'Slack', color: '#4A154B' },
  { icon: 'fa-figma', name: 'Figma', color: '#F24E1E' },
  { icon: 'fa-dribbble', name: 'Dribbble', color: '#EA4C89' },
  { icon: 'fa-airbnb', name: 'Airbnb', color: '#FF5A5F' },
  { icon: 'fa-stripe', name: 'Stripe', color: '#635BFF' },
  { icon: 'fa-shopify', name: 'Shopify', color: '#7AB55C' },
  { icon: 'fa-discord', name: 'Discord', color: '#5865F2' },
];

const trustBadges = [
  { icon: 'fa-shield-halved', label: 'SOC 2 Compliant', color: 'text-emerald-400' },
  { icon: 'fa-lock', label: 'Enterprise Security', color: 'text-emerald-400' },
  { icon: 'fa-clock', label: '99.9% Uptime SLA', color: 'text-emerald-400' },
  { icon: 'fa-headset', label: '24/7 Support', color: 'text-emerald-400' },
];

const SocialProofBar: React.FC = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

      {/* Background */}
      <div className="absolute inset-0 bg-slate-900/30" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-slate-500 text-sm font-medium mb-12 uppercase tracking-[0.2em]"
        >
          Trusted by creative teams at
        </motion.p>

        {/* Logo marquee */}
        <div className="relative mb-16">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-40 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-40 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent z-10 pointer-events-none" />

          {/* Scrolling logos - Row 1 */}
          <div className="flex overflow-hidden mb-6">
            <div className="flex animate-marquee">
              {[...logos, ...logos, ...logos].map((logo, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center px-10 group cursor-pointer"
                >
                  <div className="flex items-center gap-4 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:bg-slate-700/50 transition-colors">
                      <i
                        className={`fab ${logo.icon} text-2xl text-slate-400`}
                        style={{ ['--hover-color' as string]: logo.color }}
                      />
                    </div>
                    <span className="text-lg font-semibold text-slate-400 group-hover:text-white hidden sm:block transition-colors">
                      {logo.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scrolling logos - Row 2 (reverse) */}
          <div className="flex overflow-hidden">
            <div className="flex animate-marquee-reverse">
              {[...logos.slice().reverse(), ...logos.slice().reverse(), ...logos.slice().reverse()].map((logo, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center px-10 group cursor-pointer"
                >
                  <div className="flex items-center gap-4 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:bg-slate-700/50 transition-colors">
                      <i className={`fab ${logo.icon} text-2xl text-slate-400`} />
                    </div>
                    <span className="text-lg font-semibold text-slate-400 group-hover:text-white hidden sm:block transition-colors">
                      {logo.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-6 md:gap-12"
        >
          {trustBadges.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-3 px-5 py-3 rounded-xl glass-card group hover:border-white/10 transition-all cursor-default"
            >
              <div className={`w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <i className={`fas ${badge.icon} ${badge.color} text-sm`} />
              </div>
              <span className="text-sm text-slate-400 font-medium group-hover:text-slate-200 transition-colors">
                {badge.label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProofBar;
