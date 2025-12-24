import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { useCountUp } from '../../hooks/useCountUp';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

const stats = [
  { value: 50000, label: 'Creators', suffix: '+', icon: 'fa-users' },
  { value: 10, label: 'Assets Generated', suffix: 'M+', isDecimal: false, icon: 'fa-image' },
  { value: 4.9, label: 'Rating', suffix: '/5', isDecimal: true, icon: 'fa-star' },
];

// Floating UI elements for the hero
const floatingElements = [
  { icon: 'fa-layer-group', label: 'Canvas', color: 'from-indigo-500 to-violet-600', delay: 0 },
  { icon: 'fa-film', label: 'Video', color: 'from-violet-500 to-purple-600', delay: 0.2 },
  { icon: 'fa-wand-magic-sparkles', label: 'AI Gen', color: 'from-purple-500 to-pink-600', delay: 0.4 },
  { icon: 'fa-palette', label: 'Brand', color: 'from-pink-500 to-rose-600', delay: 0.6 },
];

const HeroSection: React.FC = () => {
  const [statsRef, statsVisible] = useScrollAnimation(0.3);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();

  const y = useTransform(scrollYProgress, [0, 0.5], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  const springConfig = { stiffness: 100, damping: 30 };
  const mouseX = useSpring(useMotionValue(0), springConfig);
  const mouseY = useSpring(useMotionValue(0), springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      setMousePosition({ x, y });
      mouseX.set(x * 20);
      mouseY.set(y * 20);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      {/* Animated Background Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Primary gradient orbs */}
        <motion.div
          style={{ x: mouseX, y: mouseY }}
          className="absolute top-1/4 left-1/4 w-[900px] h-[900px] rounded-full animate-morph"
        >
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-[180px] animate-pulse-glow" />
        </motion.div>

        <motion.div
          style={{ x: useTransform(mouseX, v => -v * 0.5), y: useTransform(mouseY, v => -v * 0.5) }}
          className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] rounded-full"
        >
          <div className="absolute inset-0 bg-violet-500/15 rounded-full blur-[150px] animate-float-delayed" />
        </motion.div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px]">
          <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-[200px] animate-morph" />
        </div>

        {/* Accent orbs */}
        <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-40 left-1/3 w-[250px] h-[250px] bg-pink-500/10 rounded-full blur-[80px] animate-float-reverse" />

        {/* Premium grid overlay */}
        <div className="absolute inset-0 bg-grid opacity-50" />

        {/* Radial gradient fade */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.8)_70%)]" />

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-indigo-400/40 rounded-full animate-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${8 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Orbiting elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
          <div className="absolute w-3 h-3 bg-indigo-400/60 rounded-full animate-orbit shadow-lg shadow-indigo-500/50" />
          <div className="absolute w-2 h-2 bg-violet-400/60 rounded-full animate-orbit-reverse shadow-lg shadow-violet-500/50" />
        </div>
      </div>

      {/* Content */}
      <motion.div
        style={{ y, opacity, scale }}
        className="relative z-10 max-w-7xl mx-auto text-center px-6 py-20"
      >
        {/* Announcement Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass-card mb-12 group cursor-pointer hover:border-indigo-500/40 transition-all duration-500"
        >
          <span className="absolute inset-0 rounded-full animate-shimmer" />
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
          <span className="relative text-sm text-slate-300 font-medium tracking-wide">
            Powered by Google Gemini 2.0
          </span>
          <i className="fas fa-arrow-right text-xs text-indigo-400 group-hover:translate-x-1.5 transition-transform duration-300" />
        </motion.div>

        {/* Main Headline - Cinematic reveal */}
        <div className="overflow-hidden mb-4">
          <motion.h1
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] font-black tracking-[-0.04em] leading-[0.9] font-display"
          >
            <span className="block text-white">Create Without</span>
          </motion.h1>
        </div>

        <div className="overflow-hidden mb-10">
          <motion.h1
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] font-black tracking-[-0.04em] leading-[0.9] font-display"
          >
            <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Limits
            </span>
          </motion.h1>
        </div>

        {/* Subheadline - Improved contrast */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-14 leading-relaxed font-light"
        >
          The all-in-one AI creative suite for designers, marketers, and content creators.
          <br className="hidden sm:block" />
          <span className="text-white font-normal">Generate stunning visuals in seconds.</span>
        </motion.p>

        {/* CTA Buttons - Improved copy and ARIA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-6 mb-20"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Link
              to="/sign-up"
              aria-label="Create your first AI design for free"
              className="group relative px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 font-bold text-lg shadow-2xl shadow-indigo-500/25 btn-premium flex items-center gap-3 animate-gradient bg-[length:200%_auto]"
            >
              <span className="relative z-10 flex items-center gap-3">
                Create Your First AI Design
                <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors" aria-hidden="true">
                  <i className="fas fa-arrow-right text-sm group-hover:translate-x-0.5 transition-transform" />
                </span>
              </span>
            </Link>

            <button
              aria-label="Watch product demo video"
              className="group px-8 py-5 rounded-2xl glass-card glass-card-hover font-semibold text-lg transition-all duration-500 flex items-center gap-4"
            >
              <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center group-hover:border-indigo-400/50 group-hover:scale-110 transition-all duration-300" aria-hidden="true">
                <i className="fas fa-play text-indigo-400 ml-0.5" />
              </span>
              <span className="text-slate-200 group-hover:text-white transition-colors">See It In Action</span>
            </button>
          </div>

          {/* Trust indicators / Micro-copy */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex items-center gap-6 text-slate-400 text-sm"
          >
            <span className="flex items-center gap-2">
              <i className="fas fa-check-circle text-emerald-400" aria-hidden="true" />
              No credit card required
            </span>
            <span className="hidden sm:flex items-center gap-2">
              <i className="fas fa-bolt text-amber-400" aria-hidden="true" />
              20 free AI generations
            </span>
            <span className="hidden md:flex items-center gap-2">
              <i className="fas fa-clock text-indigo-400" aria-hidden="true" />
              Setup in 30 seconds
            </span>
          </motion.div>
        </motion.div>

        {/* Floating Tool Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="hidden lg:flex justify-center gap-6 mb-20"
        >
          {floatingElements.map((el, i) => (
            <motion.div
              key={el.label}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 + el.delay, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, scale: 1.05 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative glass-card px-6 py-4 rounded-2xl flex items-center gap-4 cursor-pointer group-hover:border-indigo-500/40 transition-all duration-500">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${el.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                  <i className={`fas ${el.icon} text-lg text-white`} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">{el.label}</div>
                  <div className="text-xs text-slate-400">AI-powered</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats with premium styling */}
        <motion.div
          ref={statsRef as React.RefObject<HTMLDivElement>}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto"
        >
          {stats.map((stat, i) => (
            <StatItem
              key={i}
              value={stat.value}
              label={stat.label}
              suffix={stat.suffix}
              icon={stat.icon}
              isDecimal={stat.isDecimal}
              isVisible={statsVisible}
              delay={i * 0.1}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Scroll</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-slate-700 flex justify-center pt-2"
        >
          <motion.div
            animate={{ opacity: [1, 0.3, 1], y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full bg-indigo-400"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

const StatItem: React.FC<{
  value: number;
  label: string;
  suffix: string;
  icon: string;
  isDecimal?: boolean;
  isVisible: boolean;
  delay: number;
}> = ({ value, label, suffix, icon, isDecimal, isVisible, delay }) => {
  const count = useCountUp(isDecimal ? value * 10 : value, 2500, 0, isVisible);
  const displayValue = isDecimal ? (count / 10).toFixed(1) : count.toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9 }}
      transition={{ duration: 0.6, delay }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative glass-card rounded-2xl p-6 text-center group-hover:border-indigo-500/30 transition-all duration-500">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
          <i className={`fas ${icon} text-indigo-400 text-sm`} />
        </div>
        <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1 tracking-tight">
          {displayValue}{suffix}
        </div>
        <div className="text-xs sm:text-sm text-slate-500 font-medium uppercase tracking-wider">{label}</div>
      </div>
    </motion.div>
  );
};

export default HeroSection;
