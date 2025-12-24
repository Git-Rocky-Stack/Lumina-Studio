import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface StickyCTAProps {
  threshold?: number; // Scroll threshold to show the sticky CTA
}

const StickyCTA: React.FC<StickyCTAProps> = ({ threshold = 600 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;

      // Show after scrolling past threshold, hide near bottom
      const shouldShow = scrollY > threshold && scrollY < documentHeight - windowHeight - 500;
      setIsVisible(shouldShow && !isDismissed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('lumina_sticky_cta_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 inset-x-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 p-4 md:p-6">
              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                aria-label="Dismiss sticky call to action"
                className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <i className="fas fa-times text-xs" aria-hidden="true" />
              </button>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Left side - Message */}
                <div className="flex items-center gap-4 text-center md:text-left">
                  <div className="hidden md:flex w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 items-center justify-center shadow-lg shadow-indigo-500/25">
                    <i className="fas fa-sparkles text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">
                      Ready to create stunning AI designs?
                    </p>
                    <p className="text-slate-400 text-sm">
                      Start free with 20 AI generations. No credit card required.
                    </p>
                  </div>
                </div>

                {/* Right side - CTA */}
                <div className="flex items-center gap-3">
                  <Link
                    to="/sign-up"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.02] transition-all whitespace-nowrap flex items-center gap-2"
                  >
                    Get Started Free
                    <i className="fas fa-arrow-right text-sm" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Progress bar at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 rounded-b-2xl overflow-hidden">
                <div className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-violet-600 animate-gradient bg-[length:200%_auto]" />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyCTA;
