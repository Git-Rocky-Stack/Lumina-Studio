import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Accessibility Settings Context
interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'larger';
  dyslexicFont: boolean;
  focusIndicators: boolean;
  screenReaderMode: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  reducedMotion: false,
  highContrast: false,
  fontSize: 'normal',
  dyslexicFont: false,
  focusIndicators: true,
  screenReaderMode: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lumina_accessibility');
      if (saved) {
        try {
          return { ...defaultSettings, ...JSON.parse(saved) };
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  // Check system preferences
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersHighContrast = window.matchMedia('(prefers-contrast: more)');

    if (prefersReducedMotion.matches) {
      setSettings(prev => ({ ...prev, reducedMotion: true }));
    }

    if (prefersHighContrast.matches) {
      setSettings(prev => ({ ...prev, highContrast: true }));
    }

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, reducedMotion: e.matches }));
    };

    prefersReducedMotion.addEventListener('change', handleMotionChange);
    return () => prefersReducedMotion.removeEventListener('change', handleMotionChange);
  }, []);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;

    // Font size
    const fontSizes = { normal: '16px', large: '18px', larger: '20px' };
    root.style.setProperty('--base-font-size', fontSizes[settings.fontSize]);

    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Dyslexic font
    if (settings.dyslexicFont) {
      root.classList.add('dyslexic-font');
    } else {
      root.classList.remove('dyslexic-font');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Focus indicators
    if (settings.focusIndicators) {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }

    // Save to localStorage
    localStorage.setItem('lumina_accessibility', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => setSettings(defaultSettings);

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Accessibility Panel Component
interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({ isOpen, onClose }) => {
  const { settings, updateSetting, resetSettings } = useAccessibility();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="type-subsection text-slate-900 dark:text-white flex items-center gap-2">
                  <i className="fas fa-universal-access text-accent" />
                  Accessibility Settings
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <i className="fas fa-times text-slate-400" />
                </button>
              </div>
              <p className="type-body-sm text-slate-500 mt-1">
                Customize your experience for better accessibility
              </p>
            </div>

            {/* Settings */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Motion */}
              <div>
                <h3 className="type-body-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Motion & Animation
                </h3>
                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">Reduced Motion</div>
                    <div className="type-body-sm text-slate-500">Minimize animations and transitions</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.reducedMotion}
                    onChange={e => updateSetting('reducedMotion', e.target.checked)}
                    className="w-5 h-5 rounded accent-accent"
                  />
                </label>
              </div>

              {/* Visual */}
              <div>
                <h3 className="type-body-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Visual
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">High Contrast</div>
                      <div className="type-body-sm text-slate-500">Increase color contrast</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.highContrast}
                      onChange={e => updateSetting('highContrast', e.target.checked)}
                      className="w-5 h-5 rounded accent-accent"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        Enhanced Focus Indicators
                      </div>
                      <div className="type-body-sm text-slate-500">Show clear focus outlines</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.focusIndicators}
                      onChange={e => updateSetting('focusIndicators', e.target.checked)}
                      className="w-5 h-5 rounded accent-accent"
                    />
                  </label>
                </div>
              </div>

              {/* Typography */}
              <div>
                <h3 className="type-body-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Typography
                </h3>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div className="font-medium text-slate-900 dark:text-white mb-3">Font Size</div>
                    <div className="flex gap-2">
                      {(['normal', 'large', 'larger'] as const).map(size => (
                        <button
                          key={size}
                          onClick={() => updateSetting('fontSize', size)}
                          className={`flex-1 py-2 rounded-lg type-body-sm font-semibold transition-colors ${
                            settings.fontSize === size
                              ? 'bg-accent text-white'
                              : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {size === 'normal' ? 'A' : size === 'large' ? 'A+' : 'A++'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        Dyslexia-Friendly Font
                      </div>
                      <div className="type-body-sm text-slate-500">Use OpenDyslexic font</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.dyslexicFont}
                      onChange={e => updateSetting('dyslexicFont', e.target.checked)}
                      className="w-5 h-5 rounded accent-accent"
                    />
                  </label>
                </div>
              </div>

              {/* Screen Reader */}
              <div>
                <h3 className="type-body-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Screen Reader
                </h3>
                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      Screen Reader Mode
                    </div>
                    <div className="type-body-sm text-slate-500">
                      Optimize for screen readers with enhanced ARIA labels
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.screenReaderMode}
                    onChange={e => updateSetting('screenReaderMode', e.target.checked)}
                    className="w-5 h-5 rounded accent-accent"
                  />
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-between">
              <button
                onClick={resetSettings}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Reset to Defaults
              </button>
              <motion.button
                onClick={onClose}
                className="px-6 py-2 bg-accent text-white rounded-xl font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Done
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Skip to Content Link
export const SkipToContent: React.FC<{ targetId?: string }> = ({ targetId = 'main-content' }) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:outline-none"
    >
      Skip to main content
    </a>
  );
};

// Live Region for announcements
interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive';
}

export const LiveRegion: React.FC<LiveRegionProps> = ({ message, politeness = 'polite' }) => {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};

// Focus Trap for modals
interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({ children, active = true }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  return <div ref={containerRef}>{children}</div>;
};

// Accessible Icon Button
interface AccessibleIconButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export const AccessibleIconButton: React.FC<AccessibleIconButtonProps> = ({
  icon,
  label,
  onClick,
  className = '',
  disabled = false,
}) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <i className={`fas ${icon}`} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </motion.button>
  );
};

// CSS to be added globally
export const accessibilityStyles = `
  /* High Contrast Mode */
  .high-contrast {
    --accent: #0000FF;
    --text-primary: #000000;
    --text-secondary: #333333;
    --bg-primary: #FFFFFF;
    --border-color: #000000;
  }

  .high-contrast * {
    border-color: currentColor !important;
  }

  /* Reduced Motion */
  .reduce-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Dyslexic Font */
  @font-face {
    font-family: 'OpenDyslexic';
    src: url('/fonts/OpenDyslexic-Regular.woff2') format('woff2');
    font-weight: normal;
  }

  .dyslexic-font * {
    font-family: 'OpenDyslexic', sans-serif !important;
    letter-spacing: 0.05em;
    word-spacing: 0.1em;
    line-height: 1.8;
  }

  /* Enhanced Focus */
  .enhanced-focus *:focus {
    outline: 3px solid var(--accent) !important;
    outline-offset: 2px !important;
  }

  .enhanced-focus *:focus:not(:focus-visible) {
    outline: none !important;
  }

  .enhanced-focus *:focus-visible {
    outline: 3px solid var(--accent) !important;
    outline-offset: 2px !important;
  }
`;

export default AccessibilityProvider;
