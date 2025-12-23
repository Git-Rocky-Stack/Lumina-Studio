import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Creative Director',
    company: 'DesignCo',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    initials: 'SC',
    content: 'Lumina Studio has completely transformed our creative workflow. What used to take our team days now takes hours. The AI-generated assets are incredibly high quality.',
    rating: 5,
    gradient: 'from-indigo-500 to-violet-600',
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    role: 'Marketing Lead',
    company: 'TechStart',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    initials: 'MJ',
    content: 'The marketing hub alone is worth the subscription. We\'ve increased our content output by 300% while maintaining consistent brand quality across all channels.',
    rating: 5,
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Freelance Designer',
    company: 'Self-employed',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    initials: 'ER',
    content: 'As a freelancer, having an all-in-one tool that handles everything from image generation to video editing has been a game-changer for my business.',
    rating: 5,
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    id: 4,
    name: 'David Park',
    role: 'Head of Product',
    company: 'InnovateTech',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    initials: 'DP',
    content: 'We evaluated 10+ tools before choosing Lumina. The seamless integration between different creative modules is unmatched. Our team loves it.',
    rating: 5,
    gradient: 'from-pink-500 to-rose-600',
  },
];

const Testimonials: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-card text-amber-400 text-sm font-semibold mb-8"
          >
            <i className="fas fa-heart text-xs" />
            Testimonials
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display tracking-tight">
            Loved by Creators{' '}
            <span className="text-gradient-primary">Worldwide</span>
          </h2>
        </motion.div>

        {/* Testimonial carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Main card */}
              <div className="glass-card rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
                {/* Gradient accent */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r ${testimonials[activeIndex].gradient}`} />

                {/* Quote icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${testimonials[activeIndex].gradient} flex items-center justify-center mx-auto mb-10 shadow-2xl`}
                >
                  <i className="fas fa-quote-left text-3xl text-white" />
                </motion.div>

                {/* Content */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-2xl md:text-3xl text-slate-200 leading-relaxed mb-10 max-w-4xl mx-auto font-light"
                >
                  "{testimonials[activeIndex].content}"
                </motion.p>

                {/* Rating */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="flex items-center justify-center gap-1.5 mb-8"
                >
                  {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                    <motion.i
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
                      className="fas fa-star text-xl text-amber-400"
                    />
                  ))}
                </motion.div>

                {/* Author */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="flex items-center justify-center gap-5"
                >
                  <div className="relative">
                    <div className={`absolute -inset-1 bg-gradient-to-br ${testimonials[activeIndex].gradient} rounded-full blur-sm opacity-50`} />
                    <img
                      src={testimonials[activeIndex].avatar}
                      alt={testimonials[activeIndex].name}
                      className="relative w-16 h-16 rounded-full object-cover border-2 border-white/20"
                      onError={(e) => {
                        // Fallback to initials if image fails
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className={`hidden relative w-16 h-16 rounded-full bg-gradient-to-br ${testimonials[activeIndex].gradient} flex items-center justify-center font-bold text-lg text-white`}>
                      {testimonials[activeIndex].initials}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg text-white">{testimonials[activeIndex].name}</div>
                    <div className="text-slate-400">
                      {testimonials[activeIndex].role} at {testimonials[activeIndex].company}
                    </div>
                  </div>
                </motion.div>

                {/* Decorative elements */}
                <div className="absolute top-10 left-10 w-20 h-20 border border-slate-700/50 rounded-full opacity-50" />
                <div className="absolute bottom-10 right-10 w-16 h-16 border border-slate-700/50 rounded-full opacity-50" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-10">
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActiveIndex(i)}
                className="relative group"
              >
                <div className={`w-12 h-12 rounded-xl transition-all duration-300 ${
                  i === activeIndex
                    ? `bg-gradient-to-br ${t.gradient} scale-110`
                    : 'bg-slate-800/50 hover:bg-slate-700/50'
                } flex items-center justify-center`}>
                  <span className="text-sm font-bold text-white">{t.initials}</span>
                </div>
                {i === activeIndex && (
                  <motion.div
                    layoutId="testimonialIndicator"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-8 max-w-xs mx-auto">
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                key={activeIndex}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 6, ease: 'linear' }}
                className={`h-full bg-gradient-to-r ${testimonials[activeIndex].gradient}`}
                style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
