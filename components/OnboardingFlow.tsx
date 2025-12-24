import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  action?: string;
  highlight?: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Lumina Studio',
    description: 'Create stunning AI-powered designs in minutes. Let us show you around!',
    icon: 'fa-sparkles',
    action: 'Get Started',
  },
  {
    id: 'canvas',
    title: 'Your Creative Canvas',
    description: 'This is where the magic happens. Add text, images, and let AI generate stunning backgrounds.',
    icon: 'fa-layer-group',
    highlight: 'canvas',
    action: 'Next',
  },
  {
    id: 'ai-generate',
    title: 'AI-Powered Generation',
    description: 'Describe what you want, and watch AI create it. Try generating your first background!',
    icon: 'fa-wand-magic-sparkles',
    highlight: 'ai-panel',
    action: 'Try It Now',
  },
  {
    id: 'export',
    title: 'Export Your Creations',
    description: 'Download in multiple formats including PNG, SVG, PDF, and WebP. Ready for any platform.',
    icon: 'fa-download',
    highlight: 'export',
    action: 'Start Creating',
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
  isOpen: boolean;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, isOpen }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding before
    const hasCompletedOnboarding = localStorage.getItem('lumina_onboarding_complete');
    if (hasCompletedOnboarding) {
      setDismissed(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('lumina_onboarding_complete', 'true');
    setDismissed(true);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('lumina_onboarding_complete', 'true');
    setDismissed(true);
    onComplete();
  };

  if (dismissed || !isOpen) return null;

  const step = onboardingSteps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] animate-morph" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] animate-float" />
        </div>

        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-lg w-full mx-4 bg-slate-900/80 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl"
        >
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-8">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  index <= currentStep ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30"
            >
              <i className={`fas ${step.icon} text-3xl text-white`} aria-hidden="true" />
            </motion.div>

            {/* Title */}
            <h2 id="onboarding-title" className="text-2xl font-bold text-white mb-4">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              {step.description}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleNext}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                {step.action || 'Next'}
              </button>

              {currentStep < onboardingSteps.length - 1 && (
                <button
                  onClick={handleSkip}
                  className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Skip tour
                </button>
              )}
            </div>
          </div>

          {/* Step counter */}
          <div className="mt-8 text-center">
            <span className="text-slate-500 text-sm">
              Step {currentStep + 1} of {onboardingSteps.length}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingFlow;
