import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  outcome?: string;
  gradient?: string;
  size?: 'normal' | 'large';
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  outcome,
  gradient = 'from-indigo-500 to-violet-600',
  size = 'normal',
  delay = 0,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tracking for 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 300, damping: 30 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

  // Spotlight position
  const spotlightX = useSpring(useMotionValue(50), springConfig);
  const spotlightY = useSpring(useMotionValue(50), springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
    spotlightX.set(((e.clientX - rect.left) / rect.width) * 100);
    spotlightY.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    spotlightX.set(50);
    spotlightY.set(50);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      className={`group relative perspective-container cursor-pointer
        ${size === 'large' ? 'md:col-span-2 md:row-span-2' : ''}`}
    >
      {/* Animated border glow */}
      <motion.div
        className={`absolute -inset-0.5 rounded-[1.75rem] bg-gradient-to-r ${gradient} opacity-0 blur-xl transition-opacity duration-500`}
        animate={{ opacity: isHovered ? 0.3 : 0 }}
      />

      {/* Card */}
      <div className="relative h-full p-8 rounded-3xl glass-card overflow-hidden transition-all duration-500 hover:border-white/20">
        {/* Spotlight effect */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: useTransform(
              [spotlightX, spotlightY],
              ([x, y]) => `radial-gradient(600px circle at ${x}% ${y}%, rgba(99, 102, 241, 0.15), transparent 40%)`
            ),
          }}
        />

        {/* Grid pattern on hover */}
        <div className="absolute inset-0 bg-grid-dense opacity-0 group-hover:opacity-30 transition-opacity duration-500" />

        {/* Content */}
        <div className="relative z-10" style={{ transform: 'translateZ(30px)' }}>
          {/* Icon */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-lg group-hover:shadow-2xl transition-shadow duration-500`}
          >
            <motion.i
              className={`fas ${icon} text-2xl text-white`}
              animate={{ scale: isHovered ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            />
          </motion.div>

          {/* Title */}
          <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors duration-300">
            {title}
          </h3>

          {/* Outcome tagline */}
          {outcome && (
            <p className={`text-sm font-semibold mb-3 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
              {outcome}
            </p>
          )}

          {/* Description */}
          <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
            {description}
          </p>

          {/* Learn more link */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.3 }}
            className="mt-6 flex items-center gap-2 text-indigo-400"
          >
            <span className="text-sm font-semibold">Learn more</span>
            <motion.i
              className="fas fa-arrow-right text-xs"
              animate={{ x: isHovered ? 4 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            />
          </motion.div>
        </div>

        {/* Decorative corner accent */}
        <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
      </div>
    </motion.div>
  );
};

export default FeatureCard;
