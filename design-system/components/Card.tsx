/**
 * Card Component System
 *
 * Unified card components with:
 * - Consistent elevation and shadows
 * - Hover states with spring physics
 * - Multiple variants
 * - Interactive and static modes
 */

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { animation } from '../tokens';

// ============================================================================
// TYPES
// ============================================================================

export type CardVariant = 'elevated' | 'outlined' | 'filled' | 'ghost';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  selected?: boolean;
  children: React.ReactNode;
}

// ============================================================================
// STYLES
// ============================================================================

const baseStyles = `
  relative rounded-xl transition-all duration-200
`;

const variantStyles: Record<CardVariant, { base: string; hover: string }> = {
  elevated: {
    base: `
      bg-white dark:bg-slate-800
      shadow-md
      border border-slate-100 dark:border-slate-700
    `,
    hover: `
      hover:shadow-lg hover:-translate-y-1
      hover:border-slate-200 dark:hover:border-slate-600
    `,
  },
  outlined: {
    base: `
      bg-white dark:bg-slate-800/50
      border border-slate-200 dark:border-slate-700
    `,
    hover: `
      hover:border-slate-300 dark:hover:border-slate-600
      hover:bg-slate-50 dark:hover:bg-slate-800
    `,
  },
  filled: {
    base: `
      bg-slate-100 dark:bg-slate-800
      border border-transparent
    `,
    hover: `
      hover:bg-slate-200 dark:hover:bg-slate-700
    `,
  },
  ghost: {
    base: `
      bg-transparent
      border border-transparent
    `,
    hover: `
      hover:bg-slate-100 dark:hover:bg-slate-800
    `,
  },
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

const selectedStyles = `
  ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900
`;

// ============================================================================
// CARD COMPONENT
// ============================================================================

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'elevated',
      padding = 'md',
      interactive = false,
      selected = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const styles = variantStyles[variant];

    return (
      <motion.div
        ref={ref}
        className={`
          ${baseStyles}
          ${styles.base}
          ${interactive ? styles.hover : ''}
          ${interactive ? 'cursor-pointer' : ''}
          ${paddingStyles[padding]}
          ${selected ? selectedStyles : ''}
          ${className}
        `}
        whileHover={interactive ? { y: -4 } : undefined}
        whileTap={interactive ? { scale: 0.99 } : undefined}
        transition={animation.spring.smooth}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// ============================================================================
// CARD HEADER
// ============================================================================

interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

// ============================================================================
// CARD BODY
// ============================================================================

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  return <div className={`${className}`}>{children}</div>;
};

// ============================================================================
// CARD FOOTER
// ============================================================================

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  bordered?: boolean;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  bordered = false,
}) => {
  return (
    <div
      className={`
        flex items-center gap-3
        ${bordered ? 'pt-4 mt-4 border-t border-slate-200 dark:border-slate-700' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ============================================================================
// CARD IMAGE
// ============================================================================

interface CardImageProps {
  src: string;
  alt: string;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2' | '21:9';
  className?: string;
  overlay?: React.ReactNode;
}

const aspectRatioMap = {
  '1:1': 'aspect-square',
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '3:2': 'aspect-[3/2]',
  '21:9': 'aspect-[21/9]',
};

export const CardImage: React.FC<CardImageProps> = ({
  src,
  alt,
  aspectRatio = '16:9',
  className = '',
  overlay,
}) => {
  return (
    <div className={`relative overflow-hidden rounded-t-xl -m-4 mb-4 ${className}`}>
      <div className={aspectRatioMap[aspectRatio]}>
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      {overlay && (
        <div className="absolute inset-0 flex items-center justify-center">
          {overlay}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// GLASS CARD (Special variant for landing pages)
// ============================================================================

interface GlassCardProps extends Omit<CardProps, 'variant'> {
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  gradient?: boolean;
}

const blurStyles = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      blur = 'md',
      gradient = false,
      padding = 'md',
      interactive = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        className={`
          ${baseStyles}
          ${blurStyles[blur]}
          bg-white/10 dark:bg-slate-800/30
          border border-white/20 dark:border-white/10
          shadow-xl
          ${gradient ? 'bg-gradient-to-br from-white/15 to-white/5' : ''}
          ${paddingStyles[padding]}
          ${interactive ? 'cursor-pointer hover:bg-white/20 dark:hover:bg-slate-800/50' : ''}
          ${className}
        `}
        whileHover={interactive ? { y: -4, scale: 1.02 } : undefined}
        whileTap={interactive ? { scale: 0.98 } : undefined}
        transition={animation.spring.smooth}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

// ============================================================================
// STAT CARD
// ============================================================================

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  icon,
  className = '',
}) => {
  const changeColors = {
    increase: 'text-emerald-600 dark:text-emerald-400',
    decrease: 'text-red-600 dark:text-red-400',
    neutral: 'text-slate-500 dark:text-slate-400',
  };

  return (
    <Card padding="lg" className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          {change && (
            <p className={`mt-1 text-sm font-medium ${changeColors[change.type]}`}>
              {change.type === 'increase' && '↑ '}
              {change.type === 'decrease' && '↓ '}
              {change.value}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default Card;
