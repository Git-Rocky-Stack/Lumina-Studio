/**
 * Button Component
 *
 * World-class button with:
 * - Spring physics animations
 * - Proper loading states
 * - Haptic-like feedback
 * - Full accessibility
 * - Multiple variants and sizes
 */

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { animation } from '../tokens';

// ============================================================================
// TYPES
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

// ============================================================================
// STYLES
// ============================================================================

const baseStyles = `
  relative inline-flex items-center justify-center gap-2
  font-semibold transition-colors
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
  disabled:pointer-events-none disabled:opacity-50
  select-none
`;

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-b from-indigo-500 to-indigo-600
    hover:from-indigo-400 hover:to-indigo-500
    text-white shadow-md shadow-indigo-500/25
    focus-visible:ring-indigo-500
    active:from-indigo-600 active:to-indigo-700
  `,
  secondary: `
    bg-white dark:bg-slate-800
    border border-slate-200 dark:border-slate-700
    text-slate-700 dark:text-slate-200
    hover:bg-slate-50 dark:hover:bg-slate-700
    hover:border-slate-300 dark:hover:border-slate-600
    shadow-sm
    focus-visible:ring-slate-400
    active:bg-slate-100 dark:active:bg-slate-600
  `,
  ghost: `
    text-slate-600 dark:text-slate-300
    hover:bg-slate-100 dark:hover:bg-slate-800
    hover:text-slate-900 dark:hover:text-white
    focus-visible:ring-slate-400
    active:bg-slate-200 dark:active:bg-slate-700
  `,
  danger: `
    bg-gradient-to-b from-red-500 to-red-600
    hover:from-red-400 hover:to-red-500
    text-white shadow-md shadow-red-500/25
    focus-visible:ring-red-500
    active:from-red-600 active:to-red-700
  `,
  success: `
    bg-gradient-to-b from-emerald-500 to-emerald-600
    hover:from-emerald-400 hover:to-emerald-500
    text-white shadow-md shadow-emerald-500/25
    focus-visible:ring-emerald-500
    active:from-emerald-600 active:to-emerald-700
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs rounded-md',
  sm: 'h-8 px-3 text-sm rounded-lg',
  md: 'h-10 px-4 text-sm rounded-lg',
  lg: 'h-12 px-6 text-base rounded-xl',
  xl: 'h-14 px-8 text-lg rounded-xl',
};

const iconSizes: Record<ButtonSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

// ============================================================================
// LOADING SPINNER
// ============================================================================

const LoadingSpinner: React.FC<{ size: ButtonSize }> = ({ size }) => (
  <svg
    className={`animate-spin ${iconSizes[size]}`}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const disabled = isDisabled || isLoading;

    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        whileHover={!disabled ? { scale: 1.02 } : undefined}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
        transition={animation.spring.snappy}
        {...props}
      >
        {/* Left icon or loading spinner */}
        {isLoading ? (
          <LoadingSpinner size={size} />
        ) : leftIcon ? (
          <span className={iconSizes[size]}>{leftIcon}</span>
        ) : null}

        {/* Content */}
        <span className={isLoading ? 'opacity-70' : ''}>{children}</span>

        {/* Right icon */}
        {!isLoading && rightIcon && (
          <span className={iconSizes[size]}>{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// ============================================================================
// ICON BUTTON
// ============================================================================

interface IconButtonProps extends Omit<ButtonProps, 'children' | 'leftIcon' | 'rightIcon'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', className = '', ...props }, ref) => {
    const squareSizes: Record<ButtonSize, string> = {
      xs: 'w-7 h-7',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-14 h-14',
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={`${squareSizes[size]} !p-0 ${className}`}
        {...props}
      >
        <span className={iconSizes[size]}>{icon}</span>
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// ============================================================================
// BUTTON GROUP
// ============================================================================

interface ButtonGroupProps {
  children: React.ReactNode;
  attached?: boolean;
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  attached = false,
  className = '',
}) => {
  if (attached) {
    return (
      <div className={`inline-flex ${className}`}>
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return child;

          const isFirst = index === 0;
          const isLast = index === React.Children.count(children) - 1;

          return React.cloneElement(child as React.ReactElement<any>, {
            className: `
              ${(child.props as any).className || ''}
              ${!isFirst ? 'rounded-l-none border-l-0' : ''}
              ${!isLast ? 'rounded-r-none' : ''}
            `,
          });
        })}
      </div>
    );
  }

  return <div className={`inline-flex gap-2 ${className}`}>{children}</div>;
};

export default Button;
