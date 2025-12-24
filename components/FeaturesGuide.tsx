import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScrollReveal,
  StaggeredReveal,
  GlassPanel,
  Badge,
  Tabs,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  ProgressRing,
  Tooltip,
  Sparkles,
} from '../design-system';

interface FeatureCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  features: Feature[];
  color: string;
}

interface Feature {
  name: string;
  description: string;
  details?: string[];
  isNew?: boolean;
  isPro?: boolean;
  shortcut?: string;
}

const featureCategories: FeatureCategory[] = [
  {
    id: 'design',
    title: 'Design Tools',
    icon: 'fa-palette',
    description: 'Professional design capabilities for stunning visuals',
    color: '#6366f1',
    features: [
      {
        name: 'Canvas Editor',
        description: 'Full-featured design canvas with layers, grouping, and smart guides',
        details: [
          'Multi-layer support with blend modes',
          'Smart snapping and alignment guides',
          'Group/ungroup elements',
          'Undo/Redo with keyboard shortcuts (Ctrl+Z/Y)',
          'Export to PNG, JPG, PDF',
        ],
        shortcut: 'Ctrl+1',
      },
      {
        name: 'Pro Photo Editor',
        description: 'Advanced photo editing with AI-powered enhancements',
        details: [
          'Non-destructive layer editing',
          'AI background removal',
          'Color correction and filters',
          'Crop, rotate, and transform tools',
          'Before/after comparison slider',
        ],
        isNew: true,
      },
      {
        name: 'Template Gallery',
        description: 'Curated templates for social media, marketing, and more',
        details: [
          'Category-based filtering',
          'Search functionality',
          'AI-powered design suggestions',
          'One-click template application',
        ],
        isNew: true,
      },
      {
        name: 'Brand Hub',
        description: 'Centralized brand asset management',
        details: [
          'Color palette management',
          'Font library',
          'Logo storage',
          'Brand guidelines export',
        ],
        shortcut: 'Ctrl+B',
      },
    ],
  },
  {
    id: 'video',
    title: 'Video Studio',
    icon: 'fa-video',
    description: 'AI-powered video creation and editing',
    color: '#ec4899',
    features: [
      {
        name: 'Storyboard Creator',
        description: 'Plan your video with AI-assisted shot suggestions',
        details: [
          'Scene-by-scene planning',
          'AI shot recommendations',
          'Timeline visualization',
          'Aspect ratio presets (16:9, 9:16, 1:1)',
        ],
        shortcut: 'Ctrl+2',
      },
      {
        name: 'AI Video Generation',
        description: 'Generate video clips from text descriptions',
        details: [
          'Text-to-video generation',
          'Multiple AI models support',
          'Custom duration settings',
          'Video extension capabilities',
        ],
        isNew: true,
        isPro: true,
      },
      {
        name: 'Transitions Library',
        description: 'Professional transitions between clips',
        details: [
          'Crossfade, dissolve, zoom',
          'Glitch and slide effects',
          'Customizable duration',
          'Intensity controls',
        ],
      },
      {
        name: 'Audio Integration',
        description: 'Add music and sound effects to your videos',
        details: [
          'Background music library',
          'AI-generated soundtracks',
          'Volume normalization',
          'Audio fade in/out',
        ],
        isPro: true,
      },
    ],
  },
  {
    id: 'ai',
    title: 'AI Features',
    icon: 'fa-robot',
    description: 'Intelligent assistance powered by cutting-edge AI',
    color: '#8b5cf6',
    features: [
      {
        name: 'AI Stock Generator',
        description: 'Generate unique stock images with AI',
        details: [
          'Text-to-image generation',
          'Multiple style presets',
          'High-resolution output',
          'Commercial use ready',
        ],
        shortcut: 'Ctrl+S',
        isNew: true,
      },
      {
        name: 'AI Assistant',
        description: 'Natural language chat for creative guidance',
        details: [
          'Design advice and tips',
          'Content generation',
          'Marketing copy writing',
          'Voice input support',
        ],
        shortcut: 'Ctrl+K',
      },
      {
        name: 'AI Design Suggestions',
        description: 'Get intelligent design recommendations',
        details: [
          'Layout suggestions',
          'Color harmony analysis',
          'Typography pairing',
          'Accessibility checks',
        ],
        isNew: true,
      },
      {
        name: 'Smart Cropping',
        description: 'AI-powered content-aware cropping',
        details: [
          'Subject detection',
          'Rule of thirds alignment',
          'Batch processing',
          'Multiple aspect ratios',
        ],
      },
    ],
  },
  {
    id: 'productivity',
    title: 'Productivity',
    icon: 'fa-bolt',
    description: 'Work faster with powerful productivity tools',
    color: '#f59e0b',
    features: [
      {
        name: 'Command Palette',
        description: 'Quick access to any action with keyboard',
        details: [
          'Fuzzy search for commands',
          'Recent actions history',
          'Keyboard-first navigation',
          'Customizable shortcuts',
        ],
        shortcut: 'Ctrl+K',
        isNew: true,
      },
      {
        name: 'Keyboard Shortcuts',
        description: 'Comprehensive keyboard shortcuts for all actions',
        details: [
          'Navigation shortcuts',
          'Editing shortcuts',
          'Tool selection shortcuts',
          'Custom shortcut mapping',
        ],
        shortcut: 'Ctrl+/',
      },
      {
        name: 'Asset Management',
        description: 'Organize and manage all your creative assets',
        details: [
          'Folder organization',
          'Tag-based filtering',
          'Search functionality',
          'Bulk operations',
        ],
        shortcut: 'Ctrl+A',
      },
      {
        name: 'Version History',
        description: 'Track changes and restore previous versions',
        details: [
          'Auto-save functionality',
          'Visual diff comparison',
          'Restore any version',
          'Timeline view',
        ],
        isNew: true,
      },
    ],
  },
  {
    id: 'collaboration',
    title: 'Collaboration',
    icon: 'fa-users',
    description: 'Work together with real-time collaboration',
    color: '#10b981',
    features: [
      {
        name: 'Live Cursors',
        description: 'See collaborators\' cursors in real-time',
        details: [
          'Color-coded cursors',
          'Name labels',
          'Smooth animations',
          'Cursor trail effects',
        ],
        isNew: true,
      },
      {
        name: 'Presence Indicators',
        description: 'Know who\'s online and what they\'re doing',
        details: [
          'Online/offline status',
          'Current activity display',
          'Avatar groups',
          'Typing indicators',
        ],
        isNew: true,
      },
      {
        name: 'Element Locking',
        description: 'Prevent conflicts when editing shared elements',
        details: [
          'Lock elements while editing',
          'Visual lock indicators',
          'Automatic release on idle',
          'Force unlock for admins',
        ],
        isNew: true,
      },
      {
        name: 'Activity Feed',
        description: 'Track all changes made to your projects',
        details: [
          'Real-time updates',
          'User attribution',
          'Change descriptions',
          'Filter by action type',
        ],
        isNew: true,
      },
    ],
  },
  {
    id: 'export',
    title: 'Export & Share',
    icon: 'fa-share-nodes',
    description: 'Share your work across platforms',
    color: '#06b6d4',
    features: [
      {
        name: 'PDF Suite',
        description: 'Create and edit PDF documents',
        details: [
          'PDF generation from designs',
          'PDF editing and annotation',
          'Merge multiple PDFs',
          'Password protection',
        ],
        shortcut: 'Ctrl+P',
      },
      {
        name: 'Google Drive Sync',
        description: 'Automatic sync with Google Drive',
        details: [
          'Auto-backup projects',
          'Access from anywhere',
          'Version control',
          'Selective sync',
        ],
      },
      {
        name: 'Export Options',
        description: 'Export in multiple formats and sizes',
        details: [
          'PNG, JPG, SVG, PDF',
          'Custom dimensions',
          'Quality settings',
          'Batch export',
        ],
      },
      {
        name: 'Social Media Presets',
        description: 'Optimized exports for social platforms',
        details: [
          'Instagram post/story sizes',
          'Facebook cover/post sizes',
          'Twitter header sizes',
          'LinkedIn banner sizes',
        ],
      },
    ],
  },
  {
    id: 'ui',
    title: 'UI Components',
    icon: 'fa-puzzle-piece',
    description: 'Beautiful, accessible UI components',
    color: '#f43f5e',
    features: [
      {
        name: 'Glassmorphism Effects',
        description: 'Modern frosted glass UI elements',
        details: [
          'Blur backgrounds',
          'Translucent panels',
          'Gradient overlays',
          'Dynamic opacity',
        ],
        isNew: true,
      },
      {
        name: 'Particle Effects',
        description: 'Celebratory animations and feedback',
        details: [
          'Confetti celebrations',
          'Sparkle effects',
          'Floating particles',
          'Fireworks animations',
        ],
        isNew: true,
      },
      {
        name: 'Gesture Support',
        description: 'Touch-friendly gesture controls',
        details: [
          'Pinch to zoom',
          'Pan and scroll',
          'Swipe navigation',
          'Long press actions',
        ],
        isNew: true,
      },
      {
        name: 'Parallax Scrolling',
        description: 'Smooth scroll-based animations',
        details: [
          'Depth effects',
          'Scroll-triggered reveals',
          'Horizontal scrolling',
          'Text reveal animations',
        ],
        isNew: true,
      },
    ],
  },
  {
    id: 'pwa',
    title: 'App Features',
    icon: 'fa-mobile-screen',
    description: 'Progressive Web App capabilities',
    color: '#64748b',
    features: [
      {
        name: 'Offline Support',
        description: 'Work without internet connection',
        details: [
          'Service worker caching',
          'Offline indicator',
          'Auto-sync when online',
          'Local storage backup',
        ],
        isNew: true,
      },
      {
        name: 'Install as App',
        description: 'Install Lumina Studio on your device',
        details: [
          'Desktop installation',
          'Mobile home screen',
          'Native-like experience',
          'Automatic updates',
        ],
        isNew: true,
      },
      {
        name: 'Sound Design',
        description: 'Subtle audio feedback for actions',
        details: [
          'UI interaction sounds',
          'Success/error feedback',
          'Toggle sounds on/off',
          'Volume control',
        ],
        isNew: true,
      },
      {
        name: 'Theme Personalization',
        description: 'Customize your workspace appearance',
        details: [
          '6 accent color themes',
          'Dark/light mode',
          'Custom CSS variables',
          'Responsive layouts',
        ],
      },
    ],
  },
];

const FeaturesGuide: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState(featureCategories[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const filteredCategories = searchQuery
    ? featureCategories.map(cat => ({
        ...cat,
        features: cat.features.filter(
          f =>
            f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.description.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(cat => cat.features.length > 0)
    : featureCategories;

  const currentCategory = filteredCategories.find(c => c.id === activeCategory) || filteredCategories[0];

  const totalFeatures = featureCategories.reduce((sum, cat) => sum + cat.features.length, 0);
  const newFeatures = featureCategories.reduce(
    (sum, cat) => sum + cat.features.filter(f => f.isNew).length,
    0
  );

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.4),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.3),transparent_50%)]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-16">
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-4">
              <Sparkles color="#f59e0b" size={24} />
              <Badge variant="warning">Complete Feature Guide</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-violet-200">
              Lumina Studio Features
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mb-8">
              Discover everything Lumina Studio has to offer. From AI-powered tools to
              real-time collaboration, explore the complete feature set that makes
              creative work effortless.
            </p>
          </ScrollReveal>

          {/* Stats Row */}
          <StaggeredReveal className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <GlassPanel className="p-4 text-center">
              <div className="text-3xl font-bold text-white">{totalFeatures}</div>
              <div className="text-sm text-slate-400">Total Features</div>
            </GlassPanel>
            <GlassPanel className="p-4 text-center">
              <div className="text-3xl font-bold text-emerald-400">{newFeatures}</div>
              <div className="text-sm text-slate-400">New Features</div>
            </GlassPanel>
            <GlassPanel className="p-4 text-center">
              <div className="text-3xl font-bold text-amber-400">{featureCategories.length}</div>
              <div className="text-sm text-slate-400">Categories</div>
            </GlassPanel>
            <GlassPanel className="p-4 text-center">
              <div className="text-3xl font-bold text-pink-400">24/7</div>
              <div className="text-sm text-slate-400">AI Assistance</div>
            </GlassPanel>
          </StaggeredReveal>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search features..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-accent focus:border-transparent transition-all text-slate-700 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {featureCategories.map(category => (
            <motion.button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                activeCategory === category.id
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <i
                className={`fas ${category.icon}`}
                style={{ color: activeCategory === category.id ? category.color : undefined }}
              />
              <span className="font-medium">{category.title}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activeCategory === category.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {category.features.length}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Features Content */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <AnimatePresence mode="wait">
          {currentCategory && (
            <motion.div
              key={currentCategory.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Category Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${currentCategory.color}20` }}
                  >
                    <i
                      className={`fas ${currentCategory.icon} text-xl`}
                      style={{ color: currentCategory.color }}
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {currentCategory.title}
                    </h2>
                    <p className="text-slate-500">{currentCategory.description}</p>
                  </div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {currentCategory.features.map((feature, index) => (
                  <motion.div
                    key={feature.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <div
                      className={`bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-slate-300 ${
                        expandedItems.includes(feature.name) ? 'ring-2 ring-accent ring-offset-2' : ''
                      }`}
                    >
                      <button
                        onClick={() => toggleExpanded(feature.name)}
                        className="w-full p-5 text-left"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 group-hover:text-accent transition-colors">
                              {feature.name}
                            </h3>
                            {feature.isNew && (
                              <Badge variant="success" size="sm">New</Badge>
                            )}
                            {feature.isPro && (
                              <Badge variant="warning" size="sm">Pro</Badge>
                            )}
                          </div>
                          {feature.shortcut && (
                            <Tooltip content={`Keyboard shortcut: ${feature.shortcut}`}>
                              <code className="px-2 py-1 text-xs bg-slate-100 rounded-md text-slate-600 font-mono">
                                {feature.shortcut}
                              </code>
                            </Tooltip>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{feature.description}</p>

                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-slate-400">
                            {feature.details?.length || 0} capabilities
                          </span>
                          <motion.i
                            className="fas fa-chevron-down text-slate-400"
                            animate={{
                              rotate: expandedItems.includes(feature.name) ? 180 : 0,
                            }}
                          />
                        </div>
                      </button>

                      <AnimatePresence>
                        {expandedItems.includes(feature.name) && feature.details && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 pt-0">
                              <div className="border-t border-slate-100 pt-4">
                                <ul className="space-y-2">
                                  {feature.details.map((detail, i) => (
                                    <motion.li
                                      key={i}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.05 }}
                                      className="flex items-center gap-2 text-sm text-slate-600"
                                    >
                                      <i
                                        className="fas fa-check text-xs"
                                        style={{ color: currentCategory.color }}
                                      />
                                      {detail}
                                    </motion.li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Keyboard Shortcuts Section */}
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <h2 className="text-3xl font-bold mb-8 text-center">Keyboard Shortcuts</h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="fas fa-compass text-indigo-400" />
                Navigation
              </h3>
              <div className="space-y-3">
                {[
                  { keys: 'Ctrl + D', action: 'Dashboard' },
                  { keys: 'Ctrl + A', action: 'Assets' },
                  { keys: 'Ctrl + 1', action: 'Canvas' },
                  { keys: 'Ctrl + 2', action: 'Video' },
                  { keys: 'Ctrl + S', action: 'AI Stock' },
                  { keys: 'Ctrl + P', action: 'PDF Suite' },
                  { keys: 'Ctrl + B', action: 'Brand Hub' },
                  { keys: 'Ctrl + M', action: 'Marketing' },
                  { keys: 'Ctrl + K', action: 'AI Assistant' },
                ].map(shortcut => (
                  <div key={shortcut.keys} className="flex items-center justify-between">
                    <span className="text-slate-400">{shortcut.action}</span>
                    <code className="px-2 py-1 bg-white/10 rounded text-xs font-mono">
                      {shortcut.keys}
                    </code>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="fas fa-pencil text-pink-400" />
                Editing
              </h3>
              <div className="space-y-3">
                {[
                  { keys: 'Ctrl + Z', action: 'Undo' },
                  { keys: 'Ctrl + Y', action: 'Redo' },
                  { keys: 'Ctrl + Shift + Z', action: 'Redo (Alt)' },
                  { keys: 'Delete', action: 'Delete Selected' },
                  { keys: 'Ctrl + C', action: 'Copy' },
                  { keys: 'Ctrl + V', action: 'Paste' },
                  { keys: 'Ctrl + G', action: 'Group' },
                  { keys: 'Ctrl + Shift + G', action: 'Ungroup' },
                ].map(shortcut => (
                  <div key={shortcut.keys} className="flex items-center justify-between">
                    <span className="text-slate-400">{shortcut.action}</span>
                    <code className="px-2 py-1 bg-white/10 rounded text-xs font-mono">
                      {shortcut.keys}
                    </code>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <i className="fas fa-wand-magic-sparkles text-amber-400" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                {[
                  { keys: 'Ctrl + /', action: 'Shortcut Guide' },
                  { keys: 'Ctrl + K', action: 'Command Palette' },
                  { keys: 'Escape', action: 'Close Modal' },
                  { keys: 'Space', action: 'Play/Pause (Video)' },
                  { keys: '+/-', action: 'Zoom In/Out' },
                  { keys: 'Ctrl + 0', action: 'Fit to Screen' },
                  { keys: 'F11', action: 'Fullscreen' },
                ].map(shortcut => (
                  <div key={shortcut.keys} className="flex items-center justify-between">
                    <span className="text-slate-400">{shortcut.action}</span>
                    <code className="px-2 py-1 bg-white/10 rounded text-xs font-mono">
                      {shortcut.keys}
                    </code>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="text-3xl font-bold mb-4">Ready to Create?</h2>
            <p className="text-lg text-white/80 mb-8">
              Start using these powerful features to bring your creative vision to life.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <motion.button
                className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-rocket mr-2" />
                Get Started
              </motion.button>
              <motion.button
                className="px-8 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors border border-white/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <i className="fas fa-book mr-2" />
                View Docs
              </motion.button>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 bg-slate-900 text-center">
        <p className="text-slate-500 text-sm">
          Lumina Studio OS &middot; All features included &middot; Made with{' '}
          <i className="fas fa-heart text-rose-500" /> by Rocky Stack
        </p>
      </div>
    </div>
  );
};

export default FeaturesGuide;
