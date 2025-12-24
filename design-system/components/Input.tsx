/**
 * Input Component System
 *
 * World-class form inputs with:
 * - Floating labels
 * - Validation states
 * - Animated focus rings
 * - Accessible by default
 * - Multiple variants
 */

import React, { forwardRef, useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { animation } from '../tokens';

// ============================================================================
// TYPES
// ============================================================================

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'flushed';
export type InputState = 'default' | 'error' | 'success' | 'warning';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  successMessage?: string;
  size?: InputSize;
  variant?: InputVariant;
  state?: InputState;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

// ============================================================================
// STYLES
// ============================================================================

const sizeStyles: Record<InputSize, { input: string; icon: string; label: string }> = {
  sm: {
    input: 'h-9 px-3 text-sm',
    icon: 'w-4 h-4',
    label: 'text-xs',
  },
  md: {
    input: 'h-11 px-4 text-sm',
    icon: 'w-5 h-5',
    label: 'text-sm',
  },
  lg: {
    input: 'h-13 px-5 text-base',
    icon: 'w-5 h-5',
    label: 'text-sm',
  },
};

const stateStyles: Record<InputState, { border: string; focus: string; icon: string }> = {
  default: {
    border: 'border-slate-300 dark:border-slate-600',
    focus: 'focus:border-indigo-500 focus:ring-indigo-500/20',
    icon: 'text-slate-400',
  },
  error: {
    border: 'border-red-500 dark:border-red-400',
    focus: 'focus:border-red-500 focus:ring-red-500/20',
    icon: 'text-red-500',
  },
  success: {
    border: 'border-emerald-500 dark:border-emerald-400',
    focus: 'focus:border-emerald-500 focus:ring-emerald-500/20',
    icon: 'text-emerald-500',
  },
  warning: {
    border: 'border-amber-500 dark:border-amber-400',
    focus: 'focus:border-amber-500 focus:ring-amber-500/20',
    icon: 'text-amber-500',
  },
};

// ============================================================================
// STATE ICONS
// ============================================================================

const stateIcons: Record<Exclude<InputState, 'default'>, React.ReactNode> = {
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

// ============================================================================
// INPUT COMPONENT
// ============================================================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      successMessage,
      size = 'md',
      variant = 'default',
      state = 'default',
      leftIcon,
      rightIcon,
      leftAddon,
      rightAddon,
      isLoading = false,
      fullWidth = false,
      className = '',
      id: providedId,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const [isFocused, setIsFocused] = useState(false);

    const sizes = sizeStyles[size];
    const states = stateStyles[state];

    const message = errorMessage || successMessage || helperText;
    const messageType = errorMessage ? 'error' : successMessage ? 'success' : 'helper';

    const showStateIcon = state !== 'default' && !rightIcon && !isLoading;

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className={`
              block mb-2 font-medium
              text-slate-700 dark:text-slate-200
              ${sizes.label}
            `}
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative flex">
          {/* Left addon */}
          {leftAddon && (
            <div className="flex items-center px-4 rounded-l-xl border border-r-0 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm">
              {leftAddon}
            </div>
          )}

          {/* Input container */}
          <div className="relative flex-1">
            {/* Left icon */}
            {leftIcon && (
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${sizes.icon} text-slate-400`}>
                {leftIcon}
              </div>
            )}

            {/* Input */}
            <input
              ref={ref}
              id={id}
              disabled={disabled || isLoading}
              onFocus={(e) => {
                setIsFocused(true);
                props.onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                props.onBlur?.(e);
              }}
              className={`
                w-full
                ${sizes.input}
                ${leftIcon ? 'pl-11' : ''}
                ${showStateIcon || rightIcon || isLoading ? 'pr-11' : ''}
                ${leftAddon ? 'rounded-l-none' : 'rounded-xl'}
                ${rightAddon ? 'rounded-r-none' : 'rounded-xl'}
                bg-white dark:bg-slate-800
                border ${states.border}
                text-slate-900 dark:text-white
                placeholder:text-slate-400 dark:placeholder:text-slate-500
                focus:outline-none focus:ring-4 ${states.focus}
                disabled:opacity-50 disabled:cursor-not-allowed
                disabled:bg-slate-100 dark:disabled:bg-slate-900
                transition-all duration-200
              `}
              aria-invalid={state === 'error'}
              aria-describedby={message ? `${id}-message` : undefined}
              {...props}
            />

            {/* Right icon / state icon / loading */}
            {(rightIcon || showStateIcon || isLoading) && (
              <div
                className={`
                  absolute right-4 top-1/2 -translate-y-1/2
                  ${sizes.icon}
                  ${showStateIcon ? states.icon : 'text-slate-400'}
                `}
              >
                {isLoading ? (
                  <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : showStateIcon ? (
                  stateIcons[state as Exclude<InputState, 'default'>]
                ) : (
                  rightIcon
                )}
              </div>
            )}

            {/* Focus ring animation */}
            <AnimatePresence>
              {isFocused && (
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={animation.spring.snappy}
                  style={{
                    boxShadow: `0 0 0 4px ${
                      state === 'error' ? 'rgba(239, 68, 68, 0.2)' :
                      state === 'success' ? 'rgba(34, 197, 94, 0.2)' :
                      state === 'warning' ? 'rgba(245, 158, 11, 0.2)' :
                      'rgba(99, 102, 241, 0.2)'
                    }`,
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Right addon */}
          {rightAddon && (
            <div className="flex items-center px-4 rounded-r-xl border border-l-0 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm">
              {rightAddon}
            </div>
          )}
        </div>

        {/* Helper / Error / Success message */}
        <AnimatePresence mode="wait">
          {message && (
            <motion.p
              id={`${id}-message`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className={`
                mt-2 text-sm
                ${messageType === 'error' ? 'text-red-600 dark:text-red-400' : ''}
                ${messageType === 'success' ? 'text-emerald-600 dark:text-emerald-400' : ''}
                ${messageType === 'helper' ? 'text-slate-500 dark:text-slate-400' : ''}
              `}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================================================
// TEXTAREA COMPONENT
// ============================================================================

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  state?: InputState;
  size?: InputSize;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      state = 'default',
      size = 'md',
      fullWidth = false,
      className = '',
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;

    const sizes = sizeStyles[size];
    const states = stateStyles[state];

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label
            htmlFor={id}
            className={`block mb-2 font-medium text-slate-700 dark:text-slate-200 ${sizes.label}`}
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={id}
          className={`
            w-full min-h-[120px] px-4 py-3 rounded-xl
            bg-white dark:bg-slate-800
            border ${states.border}
            text-slate-900 dark:text-white text-sm
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            focus:outline-none focus:ring-4 ${states.focus}
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-y transition-all duration-200
          `}
          {...props}
        />

        {(helperText || errorMessage) && (
          <p
            className={`mt-2 text-sm ${
              errorMessage ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ============================================================================
// SEARCH INPUT
// ============================================================================

interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, value, ...props }, ref) => {
    const hasValue = Boolean(value);

    return (
      <Input
        ref={ref}
        type="search"
        value={value}
        leftIcon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
        rightIcon={
          hasValue && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : undefined
        }
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default Input;
