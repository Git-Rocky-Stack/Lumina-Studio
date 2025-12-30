import React from 'react';
import { motion } from 'framer-motion';

// Tools that Lumina replaces
const toolsReplaced = [
  { category: 'AI Image Generation', tools: 'Midjourney, Leonardo, DALL-E', cost: 20, icon: 'fa-wand-magic-sparkles', luminaFeature: 'AI Stock Gen' },
  { category: 'Photo Editing', tools: 'Photoshop, Lightroom', cost: 23, icon: 'fa-camera-retro', luminaFeature: 'Pro Photo Editor' },
  { category: 'Video Production', tools: 'Runway, Premiere', cost: 18, icon: 'fa-film', luminaFeature: 'Video Studio' },
  { category: 'PDF Management', tools: 'Adobe Acrobat', cost: 20, icon: 'fa-file-pdf', luminaFeature: 'PDF Suite' },
  { category: 'Design Platform', tools: 'Canva Pro', cost: 15, icon: 'fa-layer-group', luminaFeature: 'Canvas Editor' },
  { category: 'Marketing Tools', tools: 'Buffer, Later', cost: 15, icon: 'fa-bullhorn', luminaFeature: 'Marketing Hub' },
];

const comparisons = [
  { feature: 'Asset Creation Time', traditional: '2-4 hours', lumina: '30 seconds', icon: 'fa-clock' },
  { feature: 'Stock Image Costs', traditional: '$50-200/image', lumina: 'Unlimited included', icon: 'fa-dollar-sign' },
  { feature: 'Video Production', traditional: 'Days to weeks', lumina: 'Minutes', icon: 'fa-film' },
  { feature: 'Brand Consistency', traditional: 'Manual effort', lumina: 'AI-enforced', icon: 'fa-palette' },
  { feature: 'Multi-platform Export', traditional: 'Multiple tools', lumina: 'One click', icon: 'fa-share-nodes' },
  { feature: 'Learning Curve', traditional: 'Weeks of training', lumina: 'Start instantly', icon: 'fa-graduation-cap' },
];

const totalToolsCost = toolsReplaced.reduce((sum, t) => sum + t.cost, 0);

const ComparisonSection: React.FC = () => {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-card text-emerald-400 text-sm font-semibold mb-8"
          >
            <i className="fas fa-calculator text-xs" />
            One Subscription, 6 Tools
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display tracking-tight">
            Replace{' '}
            <span className="text-gradient-primary">${totalToolsCost}+/month</span>
            {' '}in Subscriptions
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Stop juggling multiple apps. Get pro-grade tools for every creative need in one platform.
          </p>
        </motion.div>

        {/* Tools replaced grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-16">
          {toolsReplaced.map((tool, i) => (
            <motion.div
              key={tool.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass-card rounded-xl p-4 text-center group hover:border-emerald-500/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-500/20 transition-colors">
                <i className={`fas ${tool.icon} text-slate-400 group-hover:text-emerald-400 transition-colors`} />
              </div>
              <div className="text-xs text-slate-500 mb-1">{tool.tools}</div>
              <div className="text-red-400/70 text-sm line-through">${tool.cost}/mo</div>
              <div className="text-emerald-400 text-xs font-medium mt-1">{tool.luminaFeature}</div>
            </motion.div>
          ))}
        </div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-3xl overflow-hidden"
        >
          {/* Header */}
          <div className="grid grid-cols-3 gap-4 p-6 md:p-8 border-b border-slate-800/50 bg-slate-900/50">
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Feature
            </div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider text-center">
              Traditional
            </div>
            <div className="text-sm font-semibold text-indigo-400 uppercase tracking-wider text-center flex items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              Lumina Studio
            </div>
          </div>

          {/* Rows */}
          {comparisons.map((row, i) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={`grid grid-cols-3 gap-4 p-6 md:p-8 ${
                i < comparisons.length - 1 ? 'border-b border-slate-800/30' : ''
              } hover:bg-slate-800/20 transition-colors group`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                  <i className={`fas ${row.icon} text-slate-500 text-sm`} />
                </div>
                <span className="font-semibold text-white">{row.feature}</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-slate-500">
                <span className="w-6 h-6 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <i className="fas fa-times text-rose-400 text-xs" />
                </span>
                <span className="text-sm md:text-base">{row.traditional}</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-emerald-400">
                <span className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <i className="fas fa-check text-emerald-400 text-xs" />
                </span>
                <span className="font-semibold text-sm md:text-base">{row.lumina}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16"
        >
          <div className="relative glass-card rounded-3xl p-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-indigo-500/5 to-violet-500/5" />
            <div className="relative grid md:grid-cols-3 gap-8 items-center">
              {/* Old cost */}
              <div className="text-center">
                <div className="text-slate-500 text-sm font-medium mb-2">Separate subscriptions</div>
                <div className="text-3xl md:text-4xl font-black text-slate-500 line-through decoration-red-400/50">
                  ${totalToolsCost}/mo
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <i className="fas fa-arrow-right text-white text-xl" />
                </div>
              </div>

              {/* Lumina cost */}
              <div className="text-center">
                <div className="text-emerald-400 text-sm font-medium mb-2">Lumina Pro</div>
                <div className="text-3xl md:text-4xl font-black text-white">
                  $29/mo
                </div>
              </div>
            </div>

            {/* Savings */}
            <div className="relative mt-8 pt-8 border-t border-white/10 text-center">
              <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <i className="fas fa-piggy-bank text-emerald-400 text-2xl" />
                <div className="text-left">
                  <div className="text-2xl font-bold text-emerald-400">
                    Save ${totalToolsCost - 29}/month
                  </div>
                  <div className="text-slate-400 text-sm">
                    That's ${(totalToolsCost - 29) * 12}+ back in your pocket every year
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComparisonSection;
