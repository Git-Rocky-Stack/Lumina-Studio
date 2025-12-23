import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

const tools = [
  {
    id: 'canvas',
    name: 'Canvas Editor',
    icon: 'fa-layer-group',
    gradient: 'from-indigo-500 to-violet-600',
    description: 'Design stunning graphics with timeline animations, smart layers, and real-time collaboration.',
    features: ['Layer-based editing', 'Timeline animations', 'Smart templates', 'Real-time collab'],
    preview: {
      type: 'editor',
      elements: ['Layers Panel', 'Canvas', 'Properties', 'Timeline'],
    },
  },
  {
    id: 'video',
    name: 'Video Studio',
    icon: 'fa-film',
    gradient: 'from-violet-500 to-purple-600',
    description: 'AI-powered storyboarding and video generation from text prompts. Create cinematic content in minutes.',
    features: ['Text-to-video', 'AI storyboards', 'Auto-editing', 'Multi-track timeline'],
    preview: {
      type: 'video',
      elements: ['Storyboard', 'Preview', 'Audio Mixer', 'Export'],
    },
  },
  {
    id: 'stock',
    name: 'AI Stock Gen',
    icon: 'fa-images',
    gradient: 'from-purple-500 to-pink-600',
    description: 'Generate unlimited, royalty-free stock images and animated loops tailored to your brand.',
    features: ['Unlimited generations', 'Commercial license', 'Brand consistency', 'Style transfer'],
    preview: {
      type: 'generator',
      elements: ['Prompt', 'Gallery', 'Variations', 'Download'],
    },
  },
  {
    id: 'marketing',
    name: 'Marketing Hub',
    icon: 'fa-bullhorn',
    gradient: 'from-pink-500 to-rose-600',
    description: 'Plan, create, and schedule multi-platform campaigns with AI-powered content suggestions.',
    features: ['Campaign planner', 'Social scheduler', 'Analytics dashboard', 'A/B testing'],
    preview: {
      type: 'dashboard',
      elements: ['Calendar', 'Analytics', 'Campaigns', 'Insights'],
    },
  },
];

const ProductShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState('canvas');
  const activeTool = tools.find(t => t.id === activeTab) || tools[0];
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px]" />
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
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-card text-indigo-400 text-sm font-semibold mb-8"
          >
            <i className="fas fa-rocket text-xs" />
            Product Tour
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display tracking-tight">
            One Platform,{' '}
            <span className="text-gradient-primary">Endless Possibilities</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Everything you need to create professional content, all in one place.
          </p>
        </motion.div>

        {/* Browser mockup */}
        <motion.div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative perspective-container"
        >
          {/* Glow effect behind browser */}
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-purple-500/20 rounded-[2rem] blur-2xl opacity-50" />

          {/* Browser chrome */}
          <div className="relative glass-card rounded-t-2xl border-b-0 p-4 flex items-center gap-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 transition-colors cursor-pointer" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors cursor-pointer" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors cursor-pointer" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-6 py-2 rounded-xl bg-slate-900/50 border border-slate-700/50 text-sm text-slate-400 flex items-center gap-3 max-w-md w-full justify-center">
                <i className="fas fa-lock text-emerald-400 text-xs" />
                <span className="text-slate-500">https://</span>
                studio.lumina.ai
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-500">
              <i className="fas fa-arrow-left hover:text-slate-300 cursor-pointer transition-colors" />
              <i className="fas fa-arrow-right hover:text-slate-300 cursor-pointer transition-colors" />
              <i className="fas fa-rotate hover:text-slate-300 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Content area */}
          <div className="relative glass-card rounded-b-2xl border-t-0 overflow-hidden">
            {/* Tab bar with animated indicator */}
            <div className="relative flex border-b border-slate-800/80 bg-slate-900/30">
              {tools.map((tool, i) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTab(tool.id)}
                  className={`relative flex-1 px-6 py-5 text-sm font-medium transition-all duration-300 ${
                    activeTab === tool.id
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className="flex items-center justify-center gap-3">
                    <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tool.gradient} flex items-center justify-center transition-transform ${
                      activeTab === tool.id ? 'scale-110' : 'scale-100 opacity-60'
                    }`}>
                      <i className={`fas ${tool.icon} text-white text-xs`} />
                    </span>
                    <span className="hidden sm:inline">{tool.name}</span>
                  </span>
                  {activeTab === tool.id && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Preview content */}
            <div className="relative min-h-[500px] md:min-h-[550px] p-8 md:p-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="grid lg:grid-cols-2 gap-12 items-center"
                >
                  {/* Interactive Preview Mockup */}
                  <div className="relative">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                      {/* Gradient background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${activeTool.gradient} opacity-10`} />

                      {/* Mock UI */}
                      <div className="absolute inset-0 p-6">
                        <div className="h-full rounded-xl bg-slate-900/60 border border-slate-700/50 backdrop-blur-sm overflow-hidden">
                          {/* Mock toolbar */}
                          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50">
                            {activeTool.preview.elements.slice(0, 4).map((el, i) => (
                              <motion.div
                                key={el}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="px-3 py-1.5 rounded-lg bg-slate-800/60 text-xs text-slate-400 hover:bg-slate-700/60 hover:text-slate-200 cursor-pointer transition-all"
                              >
                                {el}
                              </motion.div>
                            ))}
                          </div>

                          {/* Mock content area */}
                          <div className="p-6 grid grid-cols-4 gap-4 h-[calc(100%-52px)]">
                            {/* Left sidebar */}
                            <div className="col-span-1 space-y-3">
                              {[1, 2, 3].map(i => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.2 + i * 0.1 }}
                                  className="h-16 rounded-lg bg-slate-800/40 border border-slate-700/30"
                                />
                              ))}
                            </div>

                            {/* Main area */}
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 }}
                              className="col-span-2 rounded-xl bg-slate-800/30 border border-slate-700/30 flex items-center justify-center"
                            >
                              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${activeTool.gradient} flex items-center justify-center shadow-2xl animate-pulse-glow`}>
                                <i className={`fas ${activeTool.icon} text-3xl text-white`} />
                              </div>
                            </motion.div>

                            {/* Right sidebar */}
                            <div className="col-span-1 space-y-3">
                              {[1, 2, 3, 4].map(i => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.2 + i * 0.1 }}
                                  className="h-12 rounded-lg bg-slate-800/40 border border-slate-700/30"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Floating accent elements */}
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute top-4 right-4 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center"
                      >
                        <i className="fas fa-sparkles text-indigo-400" />
                      </motion.div>
                    </div>

                    {/* Reflection effect */}
                    <div className="absolute -bottom-20 left-0 right-0 h-20 bg-gradient-to-b from-white/[0.02] to-transparent rounded-b-2xl blur-sm" />
                  </div>

                  {/* Info panel */}
                  <div className="lg:pl-8">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${activeTool.gradient} bg-opacity-20 mb-6`}
                    >
                      <i className={`fas ${activeTool.icon} text-white text-sm`} />
                      <span className="text-sm font-semibold text-white">{activeTool.name}</span>
                    </motion.div>

                    <h3 className="text-3xl md:text-4xl font-bold mb-5 font-display">{activeTool.name}</h3>
                    <p className="text-lg text-slate-400 mb-10 leading-relaxed">
                      {activeTool.description}
                    </p>

                    <ul className="space-y-4 mb-10">
                      {activeTool.features.map((feature, i) => (
                        <motion.li
                          key={feature}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                          className="flex items-center gap-4 text-slate-300 group"
                        >
                          <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${activeTool.gradient} bg-opacity-20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <i className="fas fa-check text-emerald-400 text-xs" />
                          </span>
                          <span className="font-medium">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group px-8 py-4 rounded-xl glass-card glass-card-hover font-semibold transition-all flex items-center gap-3"
                    >
                      <span>Explore {activeTool.name}</span>
                      <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductShowcase;
