import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  type: 'major' | 'feature' | 'improvement' | 'fix';
  changes: {
    category: 'new' | 'improved' | 'fixed';
    items: string[];
  }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: '2.1.0',
    date: 'December 2024',
    title: 'UX Enhancements & Accessibility',
    type: 'major',
    changes: [
      {
        category: 'new',
        items: [
          'Command Palette (Ctrl+K) for quick actions',
          'Keyboard shortcuts modal (press ?)',
          'Exit-intent capture with bonus credits offer',
          'Sticky CTA for better conversions',
          'Onboarding flow for new users',
          'Progressive image loading',
          'Template gallery with pre-made designs',
        ],
      },
      {
        category: 'improved',
        items: [
          'WCAG AA compliant color contrast',
          'Full keyboard navigation in canvas',
          'Better focus indicators',
          'Mobile touch targets (44px minimum)',
          'Responsive pricing grid',
        ],
      },
      {
        category: 'fixed',
        items: [
          'Screen reader compatibility issues',
          'Mobile menu accessibility',
          'Reduced motion support',
        ],
      },
    ],
  },
  {
    version: '2.0.0',
    date: 'November 2024',
    title: 'Lumina Studio OS Launch',
    type: 'major',
    changes: [
      {
        category: 'new',
        items: [
          'Complete rebrand to Lumina Studio OS',
          'AI-powered image generation',
          'Video Studio with AI capabilities',
          'Pro Photo editing suite',
          'Brand Hub for consistency',
          'Marketing toolkit',
        ],
      },
    ],
  },
];

const STORAGE_KEY = 'lumina_last_seen_version';
const NEVER_SHOW_KEY = 'lumina_never_show_whats_new';
const CURRENT_VERSION = changelog[0].version;

interface WhatsNewModalProps {
  forceOpen?: boolean;
}

const WhatsNewModal: React.FC<WhatsNewModalProps> = ({ forceOpen = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(0);
  const [neverShowAgain, setNeverShowAgain] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    // Check if user opted to never show again
    const neverShow = localStorage.getItem(NEVER_SHOW_KEY);
    if (neverShow === 'true') {
      return;
    }

    // Check if user has seen the latest version
    const lastSeenVersion = localStorage.getItem(STORAGE_KEY);
    if (lastSeenVersion !== CURRENT_VERSION) {
      // Show modal for new users or after updates
      const timer = setTimeout(() => setIsOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    if (neverShowAgain) {
      localStorage.setItem(NEVER_SHOW_KEY, 'true');
    }
  };

  const categoryStyles = {
    new: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'fa-sparkles' },
    improved: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', icon: 'fa-arrow-up' },
    fixed: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'fa-wrench' },
  };

  const categoryLabels = {
    new: 'New Features',
    improved: 'Improvements',
    fixed: 'Bug Fixes',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="whats-new-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[85vh] bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/10 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-purple-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <i className="fas fa-gift text-xl text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 id="whats-new-title" className="text-xl font-bold text-white">
                      What's New in Lumina Studio
                    </h2>
                    <p className="text-slate-400 text-sm">See the latest features and improvements</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Close what's new modal"
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <i className="fas fa-times" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Version tabs */}
            <div className="px-8 py-4 border-b border-white/10 flex gap-2 overflow-x-auto">
              {changelog.map((entry, idx) => (
                <button
                  key={entry.version}
                  onClick={() => setSelectedVersion(idx)}
                  className={`px-4 py-2 rounded-xl type-body-sm font-semibold whitespace-nowrap transition-all ${
                    selectedVersion === idx
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  v{entry.version}
                  {idx === 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500 text-[10px] font-bold">
                      NEW
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedVersion}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="type-subsection text-white">
                        {changelog[selectedVersion].title}
                      </h3>
                      <span className="px-2 py-1 rounded-lg bg-white/5 text-slate-500 text-xs">
                        {changelog[selectedVersion].date}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {changelog[selectedVersion].changes.map((change, idx) => (
                      <div key={idx}>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${categoryStyles[change.category].bg} mb-3`}>
                          <i className={`fas ${categoryStyles[change.category].icon} text-xs ${categoryStyles[change.category].text}`} aria-hidden="true" />
                          <span className={`text-sm font-semibold ${categoryStyles[change.category].text}`}>
                            {categoryLabels[change.category]}
                          </span>
                        </div>
                        <ul className="space-y-2 ml-1">
                          {change.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-start gap-3 text-slate-300">
                              <i className="fas fa-check text-emerald-500 text-xs mt-1.5" aria-hidden="true" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-3">
                <a
                  href="/changelog"
                  className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                >
                  View full changelog →
                </a>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={neverShowAgain}
                    onChange={(e) => setNeverShowAgain(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">
                    Don't show this message again
                  </span>
                </label>
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WhatsNewModal;
