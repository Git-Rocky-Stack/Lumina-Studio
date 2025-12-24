import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface ExitIntentModalProps {
  enabled?: boolean;
}

const feedbackOptions = [
  { id: 'complicated', label: 'Too complicated', icon: 'fa-puzzle-piece' },
  { id: 'pricing', label: 'Pricing concerns', icon: 'fa-dollar-sign' },
  { id: 'features', label: 'Missing features', icon: 'fa-list-check' },
  { id: 'just-browsing', label: 'Just browsing', icon: 'fa-eye' },
];

const ExitIntentModal: React.FC<ExitIntentModalProps> = ({ enabled = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [hasShown, setHasShown] = useState(false);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    // Only trigger when mouse leaves from top of viewport (exit intent)
    if (e.clientY <= 0 && !hasShown && enabled) {
      // Check if modal was dismissed in this session
      const dismissed = sessionStorage.getItem('lumina_exit_modal_dismissed');
      if (!dismissed) {
        setIsOpen(true);
        setHasShown(true);
      }
    }
  }, [hasShown, enabled]);

  useEffect(() => {
    // Check if already shown in session
    const dismissed = sessionStorage.getItem('lumina_exit_modal_dismissed');
    if (dismissed) {
      setHasShown(true);
    }

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [handleMouseLeave]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('lumina_exit_modal_dismissed', 'true');
  };

  const handleFeedbackSelect = (id: string) => {
    setSelectedFeedback(id);
    // Could send to analytics here
    console.log('Exit feedback:', id);
  };

  const handleClaimOffer = () => {
    // Track conversion
    console.log('Exit intent conversion - claimed offer');
    handleClose();
  };

  if (!enabled) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-modal-title"
        >
          {/* Backdrop click to close */}
          <motion.div
            className="absolute inset-0"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-lg w-full bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-10 border border-white/10 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              aria-label="Close modal"
              className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <i className="fas fa-times" aria-hidden="true" />
            </button>

            {/* Content */}
            <div className="text-center">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl shadow-amber-500/30">
                <i className="fas fa-gift text-2xl text-white" aria-hidden="true" />
              </div>

              <h2 id="exit-modal-title" className="text-2xl font-bold text-white mb-3">
                Wait! Before you go...
              </h2>

              <p className="text-slate-300 mb-8">
                Get <span className="text-amber-400 font-semibold">10 bonus AI generations</span> free when you sign up today.
                No credit card required.
              </p>

              {/* Feedback options */}
              <div className="mb-8">
                <p className="text-sm text-slate-400 mb-4">What held you back?</p>
                <div className="grid grid-cols-2 gap-3">
                  {feedbackOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleFeedbackSelect(option.id)}
                      className={`p-4 rounded-xl border text-sm font-medium transition-all ${
                        selectedFeedback === option.id
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <i className={`fas ${option.icon} mr-2`} aria-hidden="true" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <Link
                to="/sign-up"
                onClick={handleClaimOffer}
                className="block w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-semibold text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:scale-[1.02] transition-all mb-4"
              >
                Claim My 10 Free Credits
              </Link>

              <button
                onClick={handleClose}
                className="text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
              >
                No thanks, I'll miss out
              </button>

              {/* Trust indicator */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center justify-center gap-4 text-slate-500 text-xs">
                  <span className="flex items-center gap-2">
                    <i className="fas fa-shield-alt text-emerald-500" aria-hidden="true" />
                    No spam, ever
                  </span>
                  <span className="flex items-center gap-2">
                    <i className="fas fa-clock text-indigo-400" aria-hidden="true" />
                    Cancel anytime
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentModal;
