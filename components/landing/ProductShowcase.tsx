import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const tools = [
  {
    id: 'canvas',
    name: 'Canvas Editor',
    icon: 'fa-layer-group',
    description: 'Design stunning graphics with timeline animations, smart layers, and real-time collaboration.',
    features: ['Layer-based editing', 'Timeline animations', 'Smart templates'],
  },
  {
    id: 'video',
    name: 'Video Studio',
    icon: 'fa-film',
    description: 'AI-powered storyboarding and video generation from text prompts. Create cinematic content in minutes.',
    features: ['Text-to-video', 'AI storyboards', 'Auto-editing'],
  },
  {
    id: 'stock',
    name: 'AI Stock Gen',
    icon: 'fa-images',
    description: 'Generate unlimited, royalty-free stock images and animated loops tailored to your brand.',
    features: ['Unlimited generations', 'Commercial license', 'Brand consistency'],
  },
  {
    id: 'marketing',
    name: 'Marketing Hub',
    icon: 'fa-bullhorn',
    description: 'Plan, create, and schedule multi-platform campaigns with AI-powered content suggestions.',
    features: ['Campaign planner', 'Social scheduler', 'Analytics'],
  },
];

const ProductShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState('canvas');
  const activeTool = tools.find(t => t.id === activeTab) || tools[0];

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-semibold mb-6">
            Product Tour
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            One Platform, Endless Possibilities
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Everything you need to create professional content, all in one place.
          </p>
        </motion.div>

        {/* Browser mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          {/* Browser chrome */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-t-2xl border border-slate-700/50 border-b-0 p-4 flex items-center gap-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="px-4 py-1.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-sm text-slate-400 flex items-center gap-2">
                <i className="fas fa-lock text-emerald-400 text-xs" />
                studio.lumina-os.com
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-b-2xl border border-slate-700/50 border-t-0 overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-slate-800 px-4 overflow-x-auto">
              {tools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTab(tool.id)}
                  className={`relative px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tool.id
                      ? 'text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <i className={`fas ${tool.icon}`} />
                    {tool.name}
                  </span>
                  {activeTab === tool.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Preview content */}
            <div className="relative min-h-[400px] md:min-h-[500px] p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid md:grid-cols-2 gap-12 items-center"
                >
                  {/* Preview mockup */}
                  <div className="relative aspect-video bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/30">
                          <i className={`fas ${activeTool.icon} text-3xl text-white`} />
                        </div>
                        <p className="text-slate-400 text-sm">Interactive preview coming soon</p>
                      </div>
                    </div>
                  </div>

                  {/* Info panel */}
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">{activeTool.name}</h3>
                    <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                      {activeTool.description}
                    </p>

                    <ul className="space-y-4 mb-8">
                      {activeTool.features.map((feature, i) => (
                        <motion.li
                          key={feature}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-3 text-slate-300"
                        >
                          <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <i className="fas fa-check text-emerald-400 text-xs" />
                          </span>
                          {feature}
                        </motion.li>
                      ))}
                    </ul>

                    <button className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-semibold transition-all flex items-center gap-2">
                      Learn more
                      <i className="fas fa-arrow-right" />
                    </button>
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
