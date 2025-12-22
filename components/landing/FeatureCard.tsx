import React from 'react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  gradient?: string;
  size?: 'normal' | 'large';
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  gradient = 'from-indigo-500 to-violet-600',
  size = 'normal',
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8 }}
      className={`group relative p-8 rounded-3xl bg-slate-800/30 border border-slate-700/50
        hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all duration-500
        hover:shadow-2xl hover:shadow-indigo-500/10 overflow-hidden
        ${size === 'large' ? 'md:col-span-2 md:row-span-2' : ''}`}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Glow effect */}
      <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-indigo-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />

      <div className="relative z-10">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/25 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
          <i className={`fas ${icon} text-xl text-white`} />
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold mb-3 group-hover:text-indigo-400 transition-colors">
          {title}
        </h3>
        <p className="text-slate-400 leading-relaxed">
          {description}
        </p>

        {/* Arrow indicator */}
        <div className="mt-6 flex items-center gap-2 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-sm font-medium">Learn more</span>
          <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
};

export default FeatureCard;
