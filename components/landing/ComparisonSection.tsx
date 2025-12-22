import React from 'react';
import { motion } from 'framer-motion';

const comparisons = [
  { feature: 'Asset Creation Time', traditional: '2-4 hours', lumina: '30 seconds' },
  { feature: 'Stock Image Costs', traditional: '$50-200/image', lumina: 'Unlimited included' },
  { feature: 'Video Production', traditional: 'Days to weeks', lumina: 'Minutes' },
  { feature: 'Brand Consistency', traditional: 'Manual effort', lumina: 'AI-enforced' },
  { feature: 'Multi-platform Export', traditional: 'Multiple tools', lumina: 'One click' },
];

const ComparisonSection: React.FC = () => {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-slate-900/50 to-slate-900">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-sm font-semibold mb-6">
            Comparison
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            The Lumina Advantage
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            See how Lumina Studio compares to traditional creative workflows.
          </p>
        </motion.div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-slate-800/30 border border-slate-700/50 rounded-3xl overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-3 gap-4 p-6 border-b border-slate-700/50 bg-slate-800/50">
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Feature
            </div>
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider text-center">
              Traditional
            </div>
            <div className="text-sm font-semibold text-indigo-400 uppercase tracking-wider text-center">
              Lumina Studio
            </div>
          </div>

          {/* Rows */}
          {comparisons.map((row, i) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`grid grid-cols-3 gap-4 p-6 ${
                i < comparisons.length - 1 ? 'border-b border-slate-700/30' : ''
              } hover:bg-slate-800/30 transition-colors`}
            >
              <div className="font-medium text-white">{row.feature}</div>
              <div className="text-center text-slate-500 flex items-center justify-center gap-2">
                <i className="fas fa-times text-red-400/50 text-xs" />
                {row.traditional}
              </div>
              <div className="text-center text-emerald-400 font-semibold flex items-center justify-center gap-2">
                <i className="fas fa-check text-emerald-400 text-xs" />
                {row.lumina}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20">
            <div className="text-4xl font-black text-white">$12,000+</div>
            <div className="text-left">
              <div className="text-slate-400 text-sm">Average annual savings</div>
              <div className="text-slate-500 text-xs">vs traditional software stack</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection;
