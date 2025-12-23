import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Describe Your Vision',
    description: 'Simply type what you want to create. Our AI understands context, style, and intent.',
    icon: 'fa-keyboard',
    gradient: 'from-indigo-500 to-violet-600',
    example: '"A minimalist logo for a tech startup with blue tones"',
  },
  {
    number: '02',
    title: 'AI Generates Options',
    description: 'Watch as Gemini 2.0 creates multiple high-quality variations in seconds.',
    icon: 'fa-wand-magic-sparkles',
    gradient: 'from-violet-500 to-purple-600',
    example: '4-8 unique variations generated instantly',
  },
  {
    number: '03',
    title: 'Refine & Customize',
    description: 'Use our intuitive editors to perfect every detail. Iterate with AI assistance.',
    icon: 'fa-sliders',
    gradient: 'from-purple-500 to-pink-600',
    example: 'Fine-tune colors, layout, and effects',
  },
  {
    number: '04',
    title: 'Export & Publish',
    description: 'Download in any format or publish directly to your platforms.',
    icon: 'fa-rocket',
    gradient: 'from-pink-500 to-rose-600',
    example: 'PNG, SVG, MP4, GIF, and more',
  },
];

const WorkflowSteps: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 0.5], ['0%', '100%']);

  return (
    <section className="py-32 px-6 relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
        <div className="absolute inset-0 bg-grid opacity-30" />
      </div>

      <div ref={containerRef} className="max-w-7xl mx-auto relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-card text-emerald-400 text-sm font-semibold mb-8"
          >
            <i className="fas fa-bolt text-xs" />
            How It Works
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display tracking-tight">
            From Idea to Reality{' '}
            <span className="text-gradient-primary">in Minutes</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A streamlined workflow that lets you focus on creativity, not complexity.
          </p>
        </motion.div>

        {/* Steps timeline */}
        <div className="relative">
          {/* Vertical timeline line - desktop */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-800 -translate-x-1/2">
            <motion.div
              className="absolute top-0 left-0 right-0 bg-gradient-to-b from-indigo-500 via-violet-500 to-pink-500"
              style={{ height: lineHeight }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-12 lg:space-y-24">
            {steps.map((step, i) => (
              <StepCard key={step.number} step={step} index={i} />
            ))}
          </div>
        </div>

        {/* Bottom stat */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-24"
        >
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10" />
            <div className="absolute inset-0 bg-grid opacity-50" />
            <div className="relative glass-card rounded-3xl p-12 text-center">
              <motion.div
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, type: 'spring' }}
              >
                <div className="text-6xl md:text-7xl font-black text-white mb-4 font-display">
                  <span className="text-gradient-primary">10x</span> Faster
                </div>
                <p className="text-xl text-slate-400">than traditional creative workflows</p>
              </motion.div>

              {/* Decorative elements */}
              <div className="absolute top-8 left-8 w-20 h-20 border border-indigo-500/20 rounded-full animate-pulse-glow" />
              <div className="absolute bottom-8 right-8 w-16 h-16 border border-violet-500/20 rounded-full animate-float" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const StepCard: React.FC<{ step: typeof steps[0]; index: number }> = ({ step, index }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: '-100px' });
  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`relative grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${isEven ? '' : 'lg:flex-row-reverse'}`}
    >
      {/* Content side */}
      <div className={`${isEven ? 'lg:text-right lg:pr-16' : 'lg:order-2 lg:pl-16'}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${step.gradient} mb-6`}
        >
          <span className="text-sm font-bold text-white">Step {step.number}</span>
        </motion.div>

        <h3 className="text-3xl md:text-4xl font-bold mb-4 font-display">{step.title}</h3>
        <p className="text-lg text-slate-400 mb-6 leading-relaxed">{step.description}</p>

        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <i className="fas fa-quote-left text-xs text-slate-500" />
          <span className="text-sm text-slate-300 italic">{step.example}</span>
        </div>
      </div>

      {/* Visual side */}
      <div className={`relative ${isEven ? 'lg:order-2' : ''}`}>
        {/* Timeline node - desktop */}
        <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 z-20" style={{ left: isEven ? '-48px' : 'auto', right: isEven ? 'auto' : '-48px' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.4, type: 'spring' }}
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-2xl`}
          >
            <i className={`fas ${step.icon} text-2xl text-white`} />
          </motion.div>
        </div>

        {/* Card */}
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ duration: 0.3 }}
          className="relative group"
        >
          <div className={`absolute -inset-1 bg-gradient-to-r ${step.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

          <div className="relative glass-card rounded-3xl p-8 overflow-hidden">
            {/* Icon for mobile */}
            <div className={`lg:hidden w-14 h-14 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6 shadow-lg`}>
              <i className={`fas ${step.icon} text-xl text-white`} />
            </div>

            {/* Mock UI preview */}
            <div className="aspect-video rounded-xl bg-slate-900/50 border border-slate-700/50 overflow-hidden">
              <div className="h-full flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={isInView ? { scale: 1, opacity: 1 } : {}}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-2xl`}
                >
                  <i className={`fas ${step.icon} text-4xl text-white`} />
                </motion.div>
              </div>
            </div>

            {/* Decorative dots */}
            <div className="absolute top-4 right-4 flex gap-1.5">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
                  className="w-2 h-2 rounded-full bg-slate-700"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WorkflowSteps;
