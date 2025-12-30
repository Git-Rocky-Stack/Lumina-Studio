import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const powerFeatures = [
  {
    id: 'voice-assistant',
    icon: 'fa-microphone',
    title: 'AI Voice Assistant',
    tagline: 'Talk to your designs',
    description: 'Have a conversation with Lumina. Describe what you want, ask questions, get real-time feedback — all by voice. Multimodal AI that sees your work and responds naturally.',
    gradient: 'from-violet-500 to-purple-600',
    demo: {
      type: 'chat',
      messages: [
        { role: 'user', text: 'Make the background more vibrant' },
        { role: 'ai', text: 'Done! I\'ve increased saturation by 20% and added a subtle gradient overlay.' },
        { role: 'user', text: 'Now suggest some font pairings' },
        { role: 'ai', text: 'Based on your brand style, I recommend: Montserrat + Merriweather for a modern professional look.' },
      ],
    },
  },
  {
    id: 'smart-recommendations',
    icon: 'fa-lightbulb',
    title: 'Smart Recommendations',
    tagline: 'AI that learns your style',
    description: 'Lumina analyzes your designs and learns your aesthetic. Get personalized suggestions for colors, fonts, layouts, and assets that match your unique brand identity.',
    gradient: 'from-amber-500 to-orange-600',
    demo: {
      type: 'suggestions',
      items: [
        { icon: 'fa-palette', label: 'Color harmony', value: 'Complementary blues' },
        { icon: 'fa-font', label: 'Font pairing', value: 'Inter + Source Serif' },
        { icon: 'fa-image', label: 'Similar assets', value: '12 matches found' },
        { icon: 'fa-sparkles', label: 'Style match', value: '94% on-brand' },
      ],
    },
  },
  {
    id: 'script-to-video',
    icon: 'fa-clapperboard',
    title: 'Script to Storyboard',
    tagline: 'Paste script, get video',
    description: 'Turn any script or text into a complete storyboard with AI-generated shots, transitions, and even voice narration. From concept to video in minutes, not days.',
    gradient: 'from-rose-500 to-pink-600',
    demo: {
      type: 'timeline',
      shots: ['Opening shot', 'Product close-up', 'Feature demo', 'Call to action'],
    },
  },
  {
    id: 'universal-export',
    icon: 'fa-share-nodes',
    title: 'Universal Export',
    tagline: 'One click, 20+ platforms',
    description: 'Export perfectly sized assets for Instagram, TikTok, YouTube, LinkedIn, and more — all at once. Smart batch export with platform-specific optimization built in.',
    gradient: 'from-emerald-500 to-teal-600',
    demo: {
      type: 'platforms',
      items: ['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Twitter', 'Pinterest', 'Facebook', 'Web'],
    },
  },
  {
    id: 'brand-ai',
    icon: 'fa-shield-check',
    title: 'Brand Guardian AI',
    tagline: 'Never go off-brand again',
    description: 'Upload your brand guidelines once. Lumina enforces them everywhere — correct colors, approved fonts, consistent spacing. AI-powered brand consistency at scale.',
    gradient: 'from-indigo-500 to-violet-600',
    demo: {
      type: 'checks',
      items: [
        { status: 'pass', label: 'Color palette' },
        { status: 'pass', label: 'Typography' },
        { status: 'warn', label: 'Logo spacing' },
        { status: 'pass', label: 'Tone of voice' },
      ],
    },
  },
];

const PowerFeatures: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(powerFeatures[0]);

  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
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
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-card text-violet-400 type-body-sm font-semibold mb-8"
          >
            <i className="fas fa-bolt text-xs" />
            Power Features
          </motion.span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-display tracking-tight">
            More Than Meets{' '}
            <span className="text-gradient-primary">The Eye</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Discover the advanced capabilities that make Lumina truly intelligent.
          </p>
        </motion.div>

        {/* Feature tabs + content */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Feature list */}
          <div className="lg:col-span-2 space-y-3">
            {powerFeatures.map((feature, i) => (
              <motion.button
                key={feature.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                onClick={() => setActiveFeature(feature)}
                className={`w-full text-left p-5 rounded-2xl transition-all duration-300 group ${
                  activeFeature.id === feature.id
                    ? 'glass-card border-indigo-500/30 bg-indigo-500/5'
                    : 'hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0 ${
                    activeFeature.id === feature.id ? 'shadow-lg' : 'opacity-70 group-hover:opacity-100'
                  } transition-all`}>
                    <i className={`fas ${feature.icon} text-white`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold mb-1 transition-colors ${
                      activeFeature.id === feature.id ? 'text-white' : 'text-slate-300 group-hover:text-white'
                    }`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm transition-colors ${
                      activeFeature.id === feature.id ? 'text-indigo-400' : 'text-slate-500'
                    }`}>
                      {feature.tagline}
                    </p>
                  </div>
                  <i className={`fas fa-chevron-right text-xs transition-all ${
                    activeFeature.id === feature.id ? 'text-indigo-400 translate-x-0' : 'text-slate-600 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'
                  }`} />
                </div>
              </motion.button>
            ))}
          </div>

          {/* Feature detail */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="glass-card rounded-3xl p-8 h-full"
              >
                {/* Demo visualization */}
                <div className="mb-8 p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                  {activeFeature.demo.type === 'chat' && (
                    <div className="space-y-4">
                      {activeFeature.demo.messages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.15 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                            msg.role === 'user'
                              ? 'bg-indigo-500/20 text-indigo-100 rounded-br-md'
                              : 'bg-slate-800 text-slate-200 rounded-bl-md'
                          }`}>
                            {msg.text}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {activeFeature.demo.type === 'suggestions' && (
                    <div className="grid grid-cols-2 gap-3">
                      {activeFeature.demo.items.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <i className={`fas ${item.icon} text-amber-400 text-sm`} />
                            <span className="text-slate-400 text-xs">{item.label}</span>
                          </div>
                          <span className="text-white type-body-sm font-semibold">{item.value}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {activeFeature.demo.type === 'timeline' && (
                    <div className="flex items-center gap-2">
                      {activeFeature.demo.shots.map((shot, i) => (
                        <React.Fragment key={i}>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.15 }}
                            className="flex-1 p-3 rounded-lg bg-gradient-to-b from-rose-500/20 to-rose-500/5 border border-rose-500/20 text-center"
                          >
                            <div className="w-8 h-8 rounded bg-rose-500/30 mx-auto mb-2 flex items-center justify-center">
                              <i className="fas fa-play text-rose-400 text-xs" />
                            </div>
                            <span className="text-xs text-slate-400">{shot}</span>
                          </motion.div>
                          {i < activeFeature.demo.shots.length - 1 && (
                            <i className="fas fa-arrow-right text-slate-600 text-xs" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {activeFeature.demo.type === 'platforms' && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {activeFeature.demo.items.map((platform, i) => (
                        <motion.span
                          key={platform}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 type-body-sm font-semibold"
                        >
                          {platform}
                        </motion.span>
                      ))}
                    </div>
                  )}

                  {activeFeature.demo.type === 'checks' && (
                    <div className="space-y-3">
                      {activeFeature.demo.items.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            item.status === 'pass' ? 'bg-emerald-500/20' : 'bg-amber-500/20'
                          }`}>
                            <i className={`fas ${item.status === 'pass' ? 'fa-check text-emerald-400' : 'fa-exclamation text-amber-400'} text-xs`} />
                          </span>
                          <span className="text-slate-300">{item.label}</span>
                          {item.status === 'warn' && (
                            <span className="text-xs text-amber-400 ml-auto">Needs attention</span>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <h3 className="text-2xl font-bold mb-4 text-white">{activeFeature.title}</h3>
                <p className="text-slate-400 leading-relaxed mb-6">{activeFeature.description}</p>

                {/* CTA */}
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${activeFeature.gradient} type-body-sm font-semibold`}>
                    <i className={`fas ${activeFeature.icon} text-xs`} />
                    Included in all plans
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PowerFeatures;
