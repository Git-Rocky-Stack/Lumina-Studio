import React from 'react';
import { motion } from 'framer-motion';
import FeatureCard from './FeatureCard';

const features = [
  {
    icon: 'fa-layer-group',
    title: 'Canvas Editor',
    description: 'Design stunning graphics with timeline animations, smart layers, and an intuitive drag-and-drop interface.',
    gradient: 'from-indigo-500 to-violet-600',
  },
  {
    icon: 'fa-film',
    title: 'Video Studio',
    description: 'AI-powered storyboarding and video generation. Create professional videos from text prompts.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: 'fa-images',
    title: 'AI Stock Generation',
    description: 'Generate unlimited, royalty-free stock images and animated loops tailored to your brand.',
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    icon: 'fa-file-pdf',
    title: 'PDF Suite',
    description: 'Edit documents, redact sensitive information, manage typography, and merge files seamlessly.',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    icon: 'fa-camera-retro',
    title: 'Pro Photo Editor',
    description: 'Professional photo editing with AI-powered enhancements, filters, and batch processing.',
    gradient: 'from-rose-500 to-orange-600',
  },
  {
    icon: 'fa-bullhorn',
    title: 'Marketing Hub',
    description: 'Plan and schedule social media campaigns with AI-generated content suggestions.',
    gradient: 'from-orange-500 to-amber-600',
  },
];

const FeatureGrid: React.FC = () => {
  return (
    <section id="features" className="py-32 px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto relative">
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
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-card text-violet-400 text-sm font-semibold mb-8"
          >
            <i className="fas fa-sparkles text-xs" />
            Features
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display tracking-tight">
            Everything You Need to{' '}
            <span className="text-gradient-primary">Create</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A complete creative toolkit powered by the latest AI technology.
          </p>
        </motion.div>

        {/* Feature grid - Bento style */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              gradient={feature.gradient}
              delay={i * 0.1}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-20"
        >
          <div className="glass-card rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400 text-sm font-medium">New features added weekly</span>
            </div>
            <p className="text-slate-300 mb-6">
              Join our community and help shape the future of creative tools.
            </p>
            <a
              href="#pricing"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold hover:from-indigo-600 hover:to-violet-700 transition-all hover:scale-105 shadow-lg shadow-indigo-500/25"
            >
              <span>View All Features</span>
              <i className="fas fa-arrow-right text-sm" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureGrid;
