/**
 * AI-Powered Onboarding System
 *
 * Personalized first-run experience with:
 * - Dynamic step sequencing based on user goals
 * - Smart feature recommendations
 * - Interactive tutorials with highlighting
 * - Progress tracking and skip options
 * - Celebratory completion animations
 */

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springs, fadeInUp, staggerContainer, staggerItem } from '../animations';

// ============================================================================
// TYPES
// ============================================================================

interface UserProfile {
  role: 'designer' | 'marketer' | 'creator' | 'developer' | 'other';
  experience: 'beginner' | 'intermediate' | 'expert';
  goals: string[];
  companySize: 'solo' | 'small' | 'medium' | 'enterprise';
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string; // CSS selector to highlight
  action?: 'click' | 'input' | 'observe';
  nextCondition?: () => boolean; // Condition to auto-advance
  content?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface OnboardingContextValue {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  profile: UserProfile | null;
  start: (profile?: UserProfile) => void;
  next: () => void;
  previous: () => void;
  skip: () => void;
  complete: () => void;
  goToStep: (index: number) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

// ============================================================================
// ONBOARDING STEPS BY USER ROLE
// ============================================================================

const stepsByRole: Record<UserProfile['role'], OnboardingStep[]> = {
  designer: [
    {
      id: 'welcome',
      title: 'Welcome, Designer! ✨',
      description: 'Lumina Studio is built for creative professionals like you. Let\'s set up your perfect workspace.',
      position: 'center',
    },
    {
      id: 'canvas',
      title: 'Your Creative Canvas',
      description: 'This is where the magic happens. Drag elements, use AI to generate, and create stunning designs.',
      targetSelector: '[data-tour="canvas"]',
      position: 'left',
    },
    {
      id: 'ai-generate',
      title: 'AI-Powered Generation',
      description: 'Type a prompt and watch AI create images, backgrounds, and elements instantly.',
      targetSelector: '[data-tour="ai-generate"]',
      position: 'bottom',
    },
    {
      id: 'brand-kit',
      title: 'Brand Kit',
      description: 'Save your brand colors, fonts, and logos for consistent designs across all projects.',
      targetSelector: '[data-tour="brand-kit"]',
      position: 'right',
    },
    {
      id: 'export',
      title: 'Export Anywhere',
      description: 'Export in any format - PNG, SVG, PDF, or directly to your favorite platforms.',
      targetSelector: '[data-tour="export"]',
      position: 'bottom',
    },
  ],
  marketer: [
    {
      id: 'welcome',
      title: 'Welcome, Marketer! 📈',
      description: 'Create scroll-stopping content in minutes. Let\'s show you how.',
      position: 'center',
    },
    {
      id: 'templates',
      title: 'Ready-Made Templates',
      description: 'Start with professionally designed templates optimized for every platform.',
      targetSelector: '[data-tour="templates"]',
      position: 'right',
    },
    {
      id: 'marketing-hub',
      title: 'Marketing Hub',
      description: 'Plan campaigns, track performance, and manage all your marketing assets in one place.',
      targetSelector: '[data-tour="marketing-hub"]',
      position: 'right',
    },
    {
      id: 'social-sizes',
      title: 'Smart Resizing',
      description: 'Create once, resize for every platform. Instagram, LinkedIn, Twitter - all with one click.',
      targetSelector: '[data-tour="resize"]',
      position: 'bottom',
    },
  ],
  creator: [
    {
      id: 'welcome',
      title: 'Welcome, Creator! 🎬',
      description: 'Turn your ideas into stunning visual content. Let\'s explore your creative toolkit.',
      position: 'center',
    },
    {
      id: 'video-studio',
      title: 'Video Studio',
      description: 'Create engaging videos with AI-powered editing, transitions, and effects.',
      targetSelector: '[data-tour="video-studio"]',
      position: 'right',
    },
    {
      id: 'stock-library',
      title: 'AI Stock Library',
      description: 'Generate unique stock images and videos that match your vision perfectly.',
      targetSelector: '[data-tour="stock"]',
      position: 'right',
    },
  ],
  developer: [
    {
      id: 'welcome',
      title: 'Welcome, Developer! 🛠️',
      description: 'Lumina has powerful APIs and export options built for your workflow.',
      position: 'center',
    },
    {
      id: 'api-access',
      title: 'API Access',
      description: 'Integrate Lumina\'s AI capabilities directly into your applications.',
      targetSelector: '[data-tour="api"]',
      position: 'right',
    },
    {
      id: 'code-export',
      title: 'Code Export',
      description: 'Export designs as React components, SVG code, or CSS.',
      targetSelector: '[data-tour="export"]',
      position: 'bottom',
    },
  ],
  other: [
    {
      id: 'welcome',
      title: 'Welcome to Lumina Studio! ✨',
      description: 'Create beautiful designs with the power of AI. Let\'s get you started.',
      position: 'center',
    },
    {
      id: 'quick-tour',
      title: 'Quick Tour',
      description: 'Here\'s your workspace. Explore the sidebar to discover all the tools available.',
      targetSelector: '[data-tour="sidebar"]',
      position: 'right',
    },
  ],
};

// ============================================================================
// PROFILE SURVEY COMPONENT
// ============================================================================

interface ProfileSurveyProps {
  onComplete: (profile: UserProfile) => void;
}

const ProfileSurvey: React.FC<ProfileSurveyProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});

  const roles = [
    { id: 'designer', label: 'Designer', icon: '🎨', desc: 'UI/UX, Graphic Design' },
    { id: 'marketer', label: 'Marketer', icon: '📈', desc: 'Content, Social Media' },
    { id: 'creator', label: 'Creator', icon: '🎬', desc: 'Video, Social Content' },
    { id: 'developer', label: 'Developer', icon: '🛠️', desc: 'Apps, Websites' },
    { id: 'other', label: 'Other', icon: '✨', desc: 'Just exploring' },
  ];

  const experiences = [
    { id: 'beginner', label: 'New to design tools', icon: '🌱' },
    { id: 'intermediate', label: 'Comfortable with basics', icon: '🌿' },
    { id: 'expert', label: 'Design tool pro', icon: '🌳' },
  ];

  const goals = [
    { id: 'social-media', label: 'Social Media Graphics' },
    { id: 'presentations', label: 'Presentations' },
    { id: 'marketing', label: 'Marketing Materials' },
    { id: 'video', label: 'Video Content' },
    { id: 'branding', label: 'Brand Assets' },
    { id: 'web-design', label: 'Web Design' },
  ];

  const handleComplete = () => {
    if (profile.role && profile.experience) {
      onComplete({
        role: profile.role,
        experience: profile.experience,
        goals: profile.goals || [],
        companySize: profile.companySize || 'solo',
      });
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-lg mx-4 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={springs.smooth}
      >
        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-700">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Role */}
            {step === 0 && (
              <motion.div
                key="role"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  What best describes you?
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  We'll personalize your experience based on your role.
                </p>

                <motion.div
                  className="grid grid-cols-1 gap-3"
                  variants={staggerContainer(0.05)}
                  initial="initial"
                  animate="animate"
                >
                  {roles.map((role) => (
                    <motion.button
                      key={role.id}
                      variants={staggerItem}
                      onClick={() => {
                        setProfile({ ...profile, role: role.id as UserProfile['role'] });
                        setStep(1);
                      }}
                      className={`
                        flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                        ${profile.role === role.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                        }
                      `}
                    >
                      <span className="text-3xl">{role.icon}</span>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{role.label}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{role.desc}</div>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Step 2: Experience */}
            {step === 1 && (
              <motion.div
                key="experience"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  How experienced are you?
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  We'll adjust the tutorial depth accordingly.
                </p>

                <div className="space-y-3">
                  {experiences.map((exp) => (
                    <button
                      key={exp.id}
                      onClick={() => {
                        setProfile({ ...profile, experience: exp.id as UserProfile['experience'] });
                        setStep(2);
                      }}
                      className={`
                        w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                        ${profile.experience === exp.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                        }
                      `}
                    >
                      <span className="text-2xl">{exp.icon}</span>
                      <span className="font-medium text-slate-900 dark:text-white">{exp.label}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(0)}
                  className="mt-4 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  ← Back
                </button>
              </motion.div>
            )}

            {/* Step 3: Goals */}
            {step === 2 && (
              <motion.div
                key="goals"
                variants={fadeInUp}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  What will you create?
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Select all that apply - we'll show relevant features first.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {goals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => {
                        const currentGoals = profile.goals || [];
                        const newGoals = currentGoals.includes(goal.id)
                          ? currentGoals.filter(g => g !== goal.id)
                          : [...currentGoals, goal.id];
                        setProfile({ ...profile, goals: newGoals });
                      }}
                      className={`
                        p-3 rounded-xl border-2 transition-all text-sm font-medium
                        ${(profile.goals || []).includes(goal.id)
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                        }
                      `}
                    >
                      {goal.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleComplete}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-shadow"
                  >
                    Let's Go! →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// STEP TOOLTIP COMPONENT
// ============================================================================

interface StepTooltipProps {
  step: OnboardingStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

const StepTooltip: React.FC<StepTooltipProps> = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (step.targetSelector) {
      const target = document.querySelector(step.targetSelector);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
      }
    } else {
      setTargetRect(null);
    }
  }, [step.targetSelector]);

  const getPosition = () => {
    if (!targetRect || step.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 16;
    const tooltipWidth = 320;

    switch (step.position) {
      case 'top':
        return {
          bottom: `${window.innerHeight - targetRect.top + padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'bottom':
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          right: `${window.innerWidth - targetRect.left + padding}px`,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.right + padding}px`,
          transform: 'translateY(-50%)',
        };
      default:
        return {};
    }
  };

  return (
    <>
      {/* Backdrop with spotlight */}
      <motion.div
        className="fixed inset-0 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      </motion.div>

      {/* Target highlight ring */}
      {targetRect && (
        <motion.div
          className="fixed z-50 pointer-events-none"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <div className="w-full h-full rounded-xl border-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
          <div className="absolute inset-0 rounded-xl animate-ping border-2 border-indigo-400 opacity-50" />
        </motion.div>
      )}

      {/* Tooltip */}
      <motion.div
        className="fixed z-50 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        style={getPosition() as any}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={springs.smooth}
      >
        <div className="p-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {step.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            {step.description}
          </p>

          {step.content && (
            <div className="mb-4">{step.content}</div>
          )}

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`
                  w-1.5 h-1.5 rounded-full transition-all
                  ${i === currentStep
                    ? 'w-4 bg-indigo-500'
                    : i < currentStep
                    ? 'bg-indigo-300'
                    : 'bg-slate-300 dark:bg-slate-600'
                  }
                `}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={onSkip}
              className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={onPrevious}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Back
                </button>
              )}
              <button
                onClick={onNext}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600"
              >
                {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

// ============================================================================
// COMPLETION CELEBRATION
// ============================================================================

const CompletionCelebration: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="text-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={springs.bouncy}
      >
        <motion.div
          className="text-8xl mb-6"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, -10, 10, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: 2,
          }}
        >
          🎉
        </motion.div>
        <h2 className="text-3xl font-bold text-white mb-2">You're All Set!</h2>
        <p className="text-slate-400 mb-6">Time to create something amazing.</p>
        <button
          onClick={onClose}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold shadow-lg"
        >
          Start Creating
        </button>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// PROVIDER
// ============================================================================

interface OnboardingProviderProps {
  children: React.ReactNode;
  storageKey?: string;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
  storageKey = 'lumina_onboarding',
}) => {
  const [isActive, setIsActive] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const steps = profile ? stepsByRole[profile.role] : [];
  const totalSteps = steps.length;

  // Check if user has completed onboarding
  useEffect(() => {
    const completed = localStorage.getItem(`${storageKey}_completed`);
    if (!completed) {
      setShowSurvey(true);
    }
  }, [storageKey]);

  const start = useCallback((providedProfile?: UserProfile) => {
    if (providedProfile) {
      setProfile(providedProfile);
    }
    setCurrentStep(0);
    setIsActive(true);
    setShowSurvey(false);
  }, []);

  const next = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      complete();
    }
  }, [currentStep, totalSteps]);

  const previous = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skip = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(`${storageKey}_completed`, 'skipped');
  }, [storageKey]);

  const complete = useCallback(() => {
    setIsActive(false);
    setShowCelebration(true);
    localStorage.setItem(`${storageKey}_completed`, 'true');
    if (profile) {
      localStorage.setItem(`${storageKey}_profile`, JSON.stringify(profile));
    }
  }, [storageKey, profile]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < totalSteps) {
      setCurrentStep(index);
    }
  }, [totalSteps]);

  const handleSurveyComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    start(newProfile);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps,
        profile,
        start,
        next,
        previous,
        skip,
        complete,
        goToStep,
      }}
    >
      {children}

      <AnimatePresence>
        {showSurvey && (
          <ProfileSurvey onComplete={handleSurveyComplete} />
        )}

        {isActive && steps[currentStep] && (
          <StepTooltip
            step={steps[currentStep]}
            currentStep={currentStep}
            totalSteps={totalSteps}
            onNext={next}
            onPrevious={previous}
            onSkip={skip}
          />
        )}

        {showCelebration && (
          <CompletionCelebration onClose={() => setShowCelebration(false)} />
        )}
      </AnimatePresence>
    </OnboardingContext.Provider>
  );
};

export default OnboardingProvider;
