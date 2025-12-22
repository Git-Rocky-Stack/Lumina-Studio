import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Describe Your Vision',
    description: 'Simply type what you want to create. Our AI understands context, style, and intent.',
    icon: 'fa-keyboard',
  },
  {
    number: '02',
    title: 'AI Generates Options',
    description: 'Watch as Gemini 3 Pro creates multiple high-quality variations in seconds.',
    icon: 'fa-wand-magic-sparkles',
  },
  {
    number: '03',
    title: 'Refine & Customize',
    description: 'Use our intuitive editors to perfect every detail. Iterate with AI assistance.',
    icon: 'fa-sliders',
  },
  {
    number: '04',
    title: 'Export & Publish',
    description: 'Download in any format or publish directly to your platforms.',
    icon: 'fa-rocket',
  },
];

const WorkflowSteps: React.FC = () => {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-slate-900 to-slate-900/50">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-semibold mb-6">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            From Idea to Reality in Minutes
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            A streamlined workflow that lets you focus on creativity, not complexity.
          </p>
        </motion.div>

        {/* Steps timeline */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-700 to-transparent -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                {/* Step card */}
                <div className="relative bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 hover:border-indigo-500/30 hover:bg-slate-800/50 transition-all duration-300 group">
                  {/* Number badge */}
                  <div className="absolute -top-4 left-6 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-sm font-bold shadow-lg shadow-indigo-500/25">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700/50 flex items-center justify-center mb-6 mt-4 group-hover:border-indigo-500/30 transition-colors">
                    <i className={`fas ${step.icon} text-2xl text-indigo-400`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">{step.description}</p>
                </div>

                {/* Arrow connector (hidden on last item and mobile) */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-6 -translate-y-1/2">
                    <i className="fas fa-chevron-right text-slate-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom stat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16 p-8 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10 border border-indigo-500/20"
        >
          <p className="text-4xl font-black text-white mb-2">10x Faster</p>
          <p className="text-slate-400">than traditional creative workflows</p>
        </motion.div>
      </div>
    </section>
  );
};

export default WorkflowSteps;
