import React from 'react';
import { motion } from 'framer-motion';
import { springPresets } from '../animations';
import { useSoundEffect } from '../sounds';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  variant?: 'default' | 'success' | 'danger';
  className?: string;
  showLabels?: boolean;
  onLabel?: string;
  offLabel?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  variant = 'default',
  className = '',
  showLabels = false,
  onLabel = 'ON',
  offLabel = 'OFF',
}) => {
  const playSound = useSoundEffect();

  const sizeConfig = {
    sm: {
      track: 'w-8 h-5',
      thumb: 'w-3.5 h-3.5',
      translate: 14,
      labelText: 'text-xs',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-4.5 h-4.5',
      translate: 20,
      labelText: 'text-sm',
    },
    lg: {
      track: 'w-14 h-8',
      thumb: 'w-6 h-6',
      translate: 24,
      labelText: 'text-base',
    },
  };

  const variantColors = {
    default: 'bg-indigo-500',
    success: 'bg-emerald-500',
    danger: 'bg-red-500',
  };

  const config = sizeConfig[size];

  const handleToggle = () => {
    if (disabled) return;
    playSound('toggle');
    onChange(!checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`
          relative inline-flex shrink-0 cursor-pointer rounded-full p-0.5
          ${config.track}
          ${checked ? variantColors[variant] : 'bg-zinc-300 dark:bg-zinc-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2
        `}
      >
        {/* Track labels */}
        {showLabels && (
          <>
            <span className={`
              absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold
              ${checked ? 'text-white/80' : 'text-transparent'}
              transition-colors duration-200
            `}>
              {onLabel}
            </span>
            <span className={`
              absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold
              ${!checked ? 'text-zinc-500 dark:text-zinc-400' : 'text-transparent'}
              transition-colors duration-200
            `}>
              {offLabel}
            </span>
          </>
        )}

        {/* Thumb */}
        <motion.span
          className={`
            ${config.thumb} rounded-full bg-white shadow-md
            flex items-center justify-center
          `}
          initial={false}
          animate={{
            x: checked ? config.translate : 0,
          }}
          transition={springPresets.snappy}
        >
          {/* Thumb icon/indicator */}
          <motion.span
            className={`w-1.5 h-1.5 rounded-full ${checked ? variantColors[variant] : 'bg-zinc-400'}`}
            initial={false}
            animate={{
              scale: checked ? 1 : 0.8,
              opacity: checked ? 1 : 0.5,
            }}
          />
        </motion.span>
      </button>

      {/* Label and description */}
      {(label || description) && (
        <div className="flex flex-col" onClick={handleToggle}>
          {label && (
            <span className={`font-medium text-zinc-900 dark:text-white ${config.labelText} ${disabled ? '' : 'cursor-pointer'}`}>
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Toggle Group for multiple options
interface ToggleGroupOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface ToggleGroupProps {
  options: ToggleGroupOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ToggleGroup: React.FC<ToggleGroupProps> = ({
  options,
  value,
  onChange,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const playSound = useSoundEffect();

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-3.5 py-2',
    lg: 'text-base px-4 py-2.5',
  };

  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    playSound('click');
    onChange(optionValue);
  };

  return (
    <div
      role="radiogroup"
      className={`
        inline-flex p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800
        ${disabled ? 'opacity-50' : ''}
        ${className}
      `}
    >
      {options.map((option) => (
        <motion.button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          disabled={disabled}
          onClick={() => handleSelect(option.value)}
          className={`
            relative flex items-center gap-1.5 rounded-lg font-medium
            ${sizeClasses[size]}
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            ${value === option.value
              ? 'text-zinc-900 dark:text-white'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}
            transition-colors
          `}
          whileHover={!disabled ? { scale: 1.02 } : undefined}
          whileTap={!disabled ? { scale: 0.98 } : undefined}
        >
          {/* Background indicator */}
          {value === option.value && (
            <motion.div
              layoutId="toggle-group-indicator"
              className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-lg shadow-sm"
              transition={springPresets.snappy}
            />
          )}

          <span className="relative z-10 flex items-center gap-1.5">
            {option.icon}
            {option.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
};

// Checkbox-style toggle
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  indeterminate?: boolean;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  indeterminate = false,
  className = '',
}) => {
  const playSound = useSoundEffect();

  const handleClick = () => {
    if (disabled) return;
    playSound('click');
    onChange(!checked);
  };

  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <div className="relative mt-0.5">
        <motion.button
          type="button"
          role="checkbox"
          aria-checked={indeterminate ? 'mixed' : checked}
          disabled={disabled}
          onClick={handleClick}
          className={`
            w-5 h-5 rounded-md border-2 flex items-center justify-center
            ${checked || indeterminate
              ? 'bg-indigo-500 border-indigo-500'
              : 'bg-transparent border-zinc-300 dark:border-zinc-600'}
            ${!disabled && 'hover:border-indigo-400'}
            transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50
          `}
          whileTap={!disabled ? { scale: 0.9 } : undefined}
        >
          <motion.svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            initial={false}
            animate={{
              opacity: checked || indeterminate ? 1 : 0,
              scale: checked || indeterminate ? 1 : 0.5,
            }}
            transition={springPresets.snappy}
          >
            {indeterminate ? (
              <motion.line
                x1="2"
                y1="6"
                x2="10"
                y2="6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <motion.path
                d="M2 6L5 9L10 3"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: checked ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </motion.svg>
        </motion.button>
      </div>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-zinc-900 dark:text-white">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
};

// Radio button
interface RadioProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  name?: string;
  className?: string;
}

export const Radio: React.FC<RadioProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  name,
  className = '',
}) => {
  const playSound = useSoundEffect();

  const handleClick = () => {
    if (disabled || checked) return;
    playSound('click');
    onChange();
  };

  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <div className="relative mt-0.5">
        <motion.button
          type="button"
          role="radio"
          aria-checked={checked}
          name={name}
          disabled={disabled}
          onClick={handleClick}
          className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${checked
              ? 'border-indigo-500'
              : 'border-zinc-300 dark:border-zinc-600'}
            ${!disabled && 'hover:border-indigo-400'}
            transition-colors
            focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50
          `}
          whileTap={!disabled ? { scale: 0.9 } : undefined}
        >
          <motion.div
            className="w-2.5 h-2.5 rounded-full bg-indigo-500"
            initial={false}
            animate={{
              scale: checked ? 1 : 0,
              opacity: checked ? 1 : 0,
            }}
            transition={springPresets.snappy}
          />
        </motion.button>
      </div>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-zinc-900 dark:text-white">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
};

export default Toggle;
