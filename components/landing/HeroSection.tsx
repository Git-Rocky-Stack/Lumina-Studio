import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCountUp } from '../../hooks/useCountUp';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

const stats = [
  { value: 50000, label: 'Creators', suffix: '+' },
  { value: 10, label: 'Assets Generated', suffix: 'M+' },
  { value: 4.9, label: 'Rating', suffix: '/5', isDecimal: true },
];

const HeroSection: React.FC = () => {
  const [statsRef, statsVisible] = useScrollAnimation(0.3);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[150px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-violet-500/20 rounded-full blur-[120px] animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-purple-500/10 rounded-full blur-[200px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        {/* Radial fade */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.8)_70%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto text-center px-6 py-20">
        {/* Announcement Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-10 relative overflow-hidden group cursor-pointer hover:bg-indigo-500/20 transition-colors"
        >
          <div className="absolute inset-0 animate-shimmer" />
          <span className="relative w-2 h-2 rounded-full bg-emerald-400">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping" />
          </span>
          <span className="relative text-sm text-indigo-300 font-medium">
            Powered by Google Gemini 3 Pro
          </span>
          <i className="fas fa-arrow-right text-xs text-indigo-400 group-hover:translate-x-1 transition-transform" />
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[0.95]"
        >
          <span className="block text-white">Create Without</span>
          <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
            Limits
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg sm:text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          The all-in-one AI creative suite for designers, marketers, and content creators.
          Generate stunning images, videos, and campaigns in seconds.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
        >
          <Link
            to="/sign-up"
            className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 font-bold text-lg shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-indigo-500/40 flex items-center gap-3"
          >
            Start Creating Free
            <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="group px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 font-semibold text-lg transition-all flex items-center gap-3 backdrop-blur-sm">
            <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
              <i className="fas fa-play text-indigo-400" />
            </span>
            Watch Demo
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          ref={statsRef as React.RefObject<HTMLDivElement>}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-3 gap-6 sm:gap-12 max-w-2xl mx-auto"
        >
          {stats.map((stat, i) => (
            <StatItem
              key={i}
              value={stat.value}
              label={stat.label}
              suffix={stat.suffix}
              isDecimal={stat.isDecimal}
              isVisible={statsVisible}
            />
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500"
      >
        <span className="text-xs font-medium uppercase tracking-wider">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <i className="fas fa-chevron-down" />
        </motion.div>
      </motion.div>
    </section>
  );
};

const StatItem: React.FC<{
  value: number;
  label: string;
  suffix: string;
  isDecimal?: boolean;
  isVisible: boolean;
}> = ({ value, label, suffix, isDecimal, isVisible }) => {
  const count = useCountUp(isDecimal ? value * 10 : value, 2000, 0, isVisible);
  const displayValue = isDecimal ? (count / 10).toFixed(1) : count.toLocaleString();

  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1">
        {displayValue}{suffix}
      </div>
      <div className="text-xs sm:text-sm text-slate-500 font-medium">{label}</div>
    </div>
  );
};

export default HeroSection;
