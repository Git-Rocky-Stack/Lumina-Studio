import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Page Transition Variants
export const pageVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  },
  slideRight: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
  blur: {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(10px)' },
  },
  flip: {
    initial: { opacity: 0, rotateY: -90 },
    animate: { opacity: 1, rotateY: 0 },
    exit: { opacity: 0, rotateY: 90 },
  },
  zoom: {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.5 },
  },
} as const;

type TransitionType = keyof typeof pageVariants;

interface PageTransitionProps {
  children: React.ReactNode;
  transitionKey: string;
  type?: TransitionType;
  duration?: number;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  transitionKey,
  type = 'slideUp',
  duration = 0.3,
  className = '',
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        variants={pageVariants[type]}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Staggered Page Content
interface StaggeredPageProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggeredPage: React.FC<StaggeredPageProps> = ({
  children,
  className = '',
  staggerDelay = 0.1,
}) => {
  const containerVariants: Variants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggeredItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const itemVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 25 },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};

// Auto-Save Indicator
interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  className = '',
}) => {
  const statusConfig = {
    idle: { icon: 'fa-cloud', text: 'Ready', color: 'text-slate-400' },
    saving: { icon: 'fa-spinner fa-spin', text: 'Saving...', color: 'text-amber-500' },
    saved: { icon: 'fa-cloud-check', text: 'Saved', color: 'text-emerald-500' },
    error: { icon: 'fa-cloud-xmark', text: 'Error', color: 'text-red-500' },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      className={`flex items-center gap-2 text-sm ${config.color} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={status}
    >
      <i className={`fas ${config.icon}`} />
      <span>{config.text}</span>
      {status === 'saved' && (
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-emerald-500"
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 0.5 }}
        />
      )}
    </motion.div>
  );
};

// Loading Skeleton with enhanced shimmer
interface EnhancedSkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  animate?: boolean;
}

export const EnhancedSkeleton: React.FC<EnhancedSkeletonProps> = ({
  width = '100%',
  height = 20,
  rounded = 'md',
  className = '',
  animate = true,
}) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={`relative overflow-hidden bg-slate-200 dark:bg-slate-700 ${roundedClasses[rounded]} ${className}`}
      style={{ width, height }}
    >
      {animate && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  );
};

// Content Skeleton Layouts
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 rounded-xl bg-white dark:bg-slate-800 shadow-sm ${className}`}>
    <EnhancedSkeleton height={120} rounded="lg" className="mb-4" />
    <EnhancedSkeleton height={20} width="70%" className="mb-2" />
    <EnhancedSkeleton height={16} width="50%" className="mb-4" />
    <div className="flex gap-2">
      <EnhancedSkeleton height={32} width={80} rounded="full" />
      <EnhancedSkeleton height={32} width={80} rounded="full" />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({
  items = 5,
  className = '',
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-800">
        <EnhancedSkeleton width={40} height={40} rounded="full" />
        <div className="flex-1">
          <EnhancedSkeleton height={16} width="60%" className="mb-2" />
          <EnhancedSkeleton height={12} width="40%" />
        </div>
        <EnhancedSkeleton width={60} height={24} rounded="full" />
      </div>
    ))}
  </div>
);

export const SkeletonGrid: React.FC<{ items?: number; columns?: number; className?: string }> = ({
  items = 6,
  columns = 3,
  className = '',
}) => (
  <div
    className={`grid gap-4 ${className}`}
    style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
  >
    {Array.from({ length: items }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

// Progress Bar with animation
interface AnimatedProgressProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
  className?: string;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max = 100,
  color = 'var(--accent)',
  height = 8,
  showLabel = false,
  className = '',
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm text-slate-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className="w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
        style={{ height }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
};

export default PageTransition;
