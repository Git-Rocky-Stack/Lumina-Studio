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
    <section id="features" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 text-violet-400 text-sm font-semibold mb-6">
            Features
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Everything You Need to Create
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-slate-400 mb-4">
            And many more features being added every week.
          </p>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
          >
            View all features
            <i className="fas fa-arrow-right" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureGrid;
