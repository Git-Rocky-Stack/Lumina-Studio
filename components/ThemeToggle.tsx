import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'switch' | 'dropdown';
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon', className = '' }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const isDark = resolvedTheme === 'dark';

  if (variant === 'switch') {
    return (
      <button
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={`relative w-14 h-7 rounded-full transition-colors ${
          isDark ? 'bg-slate-700' : 'bg-indigo-100'
        } ${className}`}
      >
        <motion.div
          layout
          className={`absolute top-1 w-5 h-5 rounded-full flex items-center justify-center ${
            isDark ? 'bg-slate-900' : 'bg-white'
          }`}
          animate={{ left: isDark ? '2px' : 'calc(100% - 22px)' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <i
            className={`fas ${isDark ? 'fa-moon text-indigo-400' : 'fa-sun text-amber-500'} text-xs`}
            aria-hidden="true"
          />
        </motion.div>
      </button>
    );
  }

  if (variant === 'dropdown') {
    const options = [
      { value: 'light', label: 'Light', icon: 'fa-sun' },
      { value: 'dark', label: 'Dark', icon: 'fa-moon' },
      { value: 'system', label: 'System', icon: 'fa-laptop' },
    ];

    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Theme settings"
          aria-expanded={isOpen}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <i
            className={`fas ${isDark ? 'fa-moon' : 'fa-sun'}`}
            aria-hidden="true"
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-40 py-2 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50"
              >
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTheme(option.value as 'light' | 'dark' | 'system');
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2 flex items-center gap-3 text-sm transition-colors ${
                      theme === option.value
                        ? 'text-indigo-400 bg-indigo-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <i className={`fas ${option.icon} w-4`} aria-hidden="true" />
                    <span>{option.label}</span>
                    {theme === option.value && (
                      <i className="fas fa-check ml-auto text-xs" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Default: icon variant
  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ scale: 0.9 }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.i
          key={resolvedTheme}
          initial={{ opacity: 0, rotate: -90, scale: 0 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0 }}
          transition={{ duration: 0.2 }}
          className={`fas ${isDark ? 'fa-moon' : 'fa-sun'}`}
          aria-hidden="true"
        />
      </AnimatePresence>
    </motion.button>
  );
};

export default ThemeToggle;
