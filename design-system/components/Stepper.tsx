import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import { springPresets } from '../animations';

interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  optional?: boolean;
  error?: boolean;
  content?: React.ReactNode;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'dots' | 'progress';
  showLabels?: boolean;
  clickable?: boolean;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  orientation = 'horizontal',
  variant = 'default',
  showLabels = true,
  clickable = false,
  className = '',
}) => {
  const isCompleted = (index: number) => index < currentStep;
  const isCurrent = (index: number) => index === currentStep;
  const isClickable = (index: number) => clickable && (isCompleted(index) || isCurrent(index));

  const handleStepClick = (index: number) => {
    if (isClickable(index) && onStepClick) {
      onStepClick(index);
    }
  };

  if (variant === 'dots') {
    return <DotsStepper steps={steps} currentStep={currentStep} className={className} />;
  }

  if (variant === 'progress') {
    return <ProgressStepper steps={steps} currentStep={currentStep} className={className} />;
  }

  const isVertical = orientation === 'vertical';

  return (
    <div
      className={`
        flex ${isVertical ? 'flex-col' : 'flex-row items-start justify-between'}
        ${className}
      `}
    >
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {/* Step */}
          <div
            className={`
              flex ${isVertical ? 'flex-row' : 'flex-col'} items-center
              ${isClickable(index) ? 'cursor-pointer' : ''}
              ${isVertical ? 'gap-4' : 'gap-2'}
            `}
            onClick={() => handleStepClick(index)}
          >
            {/* Step indicator */}
            <motion.div
              className={`
                relative flex items-center justify-center
                w-10 h-10 rounded-full border-2 transition-colors
                ${isCompleted(index)
                  ? 'bg-indigo-500 border-indigo-500'
                  : isCurrent(index)
                    ? 'bg-white dark:bg-zinc-900 border-indigo-500'
                    : step.error
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600'}
              `}
              initial={false}
              animate={{
                scale: isCurrent(index) ? 1.1 : 1,
              }}
              transition={springPresets.snappy}
            >
              <AnimatePresence mode="wait">
                {isCompleted(index) ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={springPresets.bouncy}
                  >
                    <Check size={20} className="text-white" />
                  </motion.div>
                ) : step.icon ? (
                  <motion.div
                    key="icon"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`
                      ${isCurrent(index)
                        ? 'text-indigo-500'
                        : step.error
                          ? 'text-red-500'
                          : 'text-zinc-400 dark:text-zinc-500'}
                    `}
                  >
                    {step.icon}
                  </motion.div>
                ) : (
                  <motion.span
                    key="number"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`
                      font-semibold type-body-sm
                      ${isCurrent(index)
                        ? 'text-indigo-500'
                        : step.error
                          ? 'text-red-500'
                          : 'text-zinc-400 dark:text-zinc-500'}
                    `}
                  >
                    {index + 1}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Current step pulse */}
              {isCurrent(index) && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-indigo-500"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
            </motion.div>

            {/* Labels */}
            {showLabels && (
              <div className={`${isVertical ? 'flex-1' : 'text-center'}`}>
                <p
                  className={`
                    font-semibold type-body-sm
                    ${isCurrent(index)
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : isCompleted(index)
                        ? 'text-zinc-900 dark:text-white'
                        : 'text-zinc-400 dark:text-zinc-500'}
                  `}
                >
                  {step.title}
                  {step.optional && (
                    <span className="ml-1 type-caption text-zinc-400">(Optional)</span>
                  )}
                </p>
                {step.description && (
                  <p className="type-caption text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Connector */}
          {index < steps.length - 1 && (
            <div
              className={`
                ${isVertical
                  ? 'ml-5 w-0.5 h-8 my-2'
                  : 'flex-1 h-0.5 mt-5 mx-4'}
              `}
            >
              <motion.div
                className={`
                  ${isVertical ? 'w-full' : 'h-full'}
                  rounded-full
                  ${isCompleted(index + 1)
                    ? 'bg-indigo-500'
                    : 'bg-zinc-200 dark:bg-zinc-700'}
                `}
                initial={false}
                animate={{
                  width: isVertical ? '100%' : isCompleted(index + 1) ? '100%' : '0%',
                  height: isVertical ? (isCompleted(index + 1) ? '100%' : '0%') : '100%',
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Dots variant (minimal)
const DotsStepper: React.FC<Pick<StepperProps, 'steps' | 'currentStep' | 'className'>> = ({
  steps,
  currentStep,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {steps.map((_, index) => (
        <motion.div
          key={index}
          className={`
            rounded-full transition-colors
            ${index === currentStep
              ? 'w-6 h-2 bg-indigo-500'
              : index < currentStep
                ? 'w-2 h-2 bg-indigo-500'
                : 'w-2 h-2 bg-zinc-300 dark:bg-zinc-600'}
          `}
          initial={false}
          animate={{
            width: index === currentStep ? 24 : 8,
          }}
          transition={springPresets.snappy}
        />
      ))}
    </div>
  );
};

// Progress bar variant
const ProgressStepper: React.FC<Pick<StepperProps, 'steps' | 'currentStep' | 'className'>> = ({
  steps,
  currentStep,
  className = '',
}) => {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={`w-full ${className}`}>
      {/* Progress bar */}
      <div className="relative h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={springPresets.smooth}
        />
      </div>

      {/* Step labels */}
      <div className="flex justify-between mt-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`
              type-label transition-colors
              ${index <= currentStep
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-zinc-400 dark:text-zinc-500'}
            `}
          >
            {step.title}
          </div>
        ))}
      </div>
    </div>
  );
};

// Step content with navigation
interface StepContentProps {
  steps: Step[];
  currentStep: number;
  onNext?: () => void;
  onPrev?: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const StepContent: React.FC<StepContentProps> = ({
  steps,
  currentStep,
  onNext,
  onPrev,
  onComplete,
  isLoading = false,
  className = '',
}) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];

  return (
    <div className={className}>
      {/* Step indicator */}
      <div className="mb-6">
        <Stepper
          steps={steps}
          currentStep={currentStep}
          variant="progress"
        />
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="mb-8"
        >
          <h2 className="type-subsection text-zinc-900 dark:text-white mb-2">
            {currentStepData.title}
          </h2>
          {currentStepData.description && (
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              {currentStepData.description}
            </p>
          )}
          {currentStepData.content}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <motion.button
          onClick={onPrev}
          disabled={isFirstStep || isLoading}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${isFirstStep
              ? 'invisible'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Back
        </motion.button>

        <motion.button
          onClick={isLastStep ? onComplete : onNext}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <motion.div
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <>
              {isLastStep ? 'Complete' : 'Continue'}
              {!isLastStep && <ChevronRight size={16} />}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

// Breadcrumb stepper (for forms/wizards)
interface BreadcrumbStepperProps {
  steps: Array<{ id: string; label: string }>;
  currentStep: number;
  className?: string;
}

export const BreadcrumbStepper: React.FC<BreadcrumbStepperProps> = ({
  steps,
  currentStep,
  className = '',
}) => {
  return (
    <nav className={`flex items-center ${className}`} aria-label="Progress">
      <ol className="flex items-center space-x-2">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-center">
            {index > 0 && (
              <ChevronRight size={16} className="text-zinc-400 mx-2" />
            )}
            <span
              className={`
                type-body-sm font-semibold
                ${index < currentStep
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : index === currentStep
                    ? 'text-zinc-900 dark:text-white'
                    : 'text-zinc-400 dark:text-zinc-500'}
              `}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Stepper;
