import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { springPresets } from '../animations';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  dotColor?: string;
  removable?: boolean;
  onRemove?: () => void;
  icon?: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  dotColor,
  removable = false,
  onRemove,
  icon,
  pulse = false,
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
    success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    outline: 'bg-transparent border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300',
  };

  const dotColors = {
    default: 'bg-zinc-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    outline: 'bg-zinc-400',
  };

  const sizeStyles = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1',
  };

  return (
    <motion.span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={springPresets.snappy}
    >
      {/* Status dot */}
      {dot && (
        <span className="relative">
          <span
            className={`w-1.5 h-1.5 rounded-full ${dotColor || dotColors[variant]}`}
          />
          {pulse && (
            <motion.span
              className={`absolute inset-0 rounded-full ${dotColor || dotColors[variant]}`}
              animate={{ scale: [1, 2], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </span>
      )}

      {/* Icon */}
      {icon && <span className="w-3 h-3">{icon}</span>}

      {/* Content */}
      <span>{children}</span>

      {/* Remove button */}
      {removable && (
        <motion.button
          type="button"
          onClick={onRemove}
          className="ml-0.5 -mr-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X size={10} />
        </motion.button>
      )}
    </motion.span>
  );
};

// Notification Badge (for icons/avatars)
interface NotificationBadgeProps {
  count?: number;
  showZero?: boolean;
  max?: number;
  dot?: boolean;
  color?: 'red' | 'blue' | 'green' | 'yellow';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  children: React.ReactNode;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count = 0,
  showZero = false,
  max = 99,
  dot = false,
  color = 'red',
  position = 'top-right',
  children,
  className = '',
}) => {
  const colorStyles = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
  };

  const positionStyles = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1',
  };

  const showBadge = dot || (showZero ? count >= 0 : count > 0);
  const displayCount = count > max ? `${max}+` : count;

  return (
    <div className={`relative inline-flex ${className}`}>
      {children}

      {showBadge && (
        <motion.span
          className={`
            absolute ${positionStyles[position]}
            ${dot ? 'w-2.5 h-2.5' : 'min-w-[18px] h-[18px] px-1'}
            ${colorStyles[color]}
            rounded-full flex items-center justify-center
            text-[10px] font-bold text-white
            ring-2 ring-white dark:ring-zinc-900
          `}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springPresets.bouncy}
        >
          {!dot && displayCount}
        </motion.span>
      )}
    </div>
  );
};

// Status Indicator
interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away' | 'dnd';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  showLabel = false,
  size = 'md',
  className = '',
}) => {
  const statusConfig = {
    online: { color: 'bg-emerald-500', label: 'Online', pulse: true },
    offline: { color: 'bg-zinc-400', label: 'Offline', pulse: false },
    busy: { color: 'bg-red-500', label: 'Busy', pulse: false },
    away: { color: 'bg-amber-500', label: 'Away', pulse: true },
    dnd: { color: 'bg-red-500', label: 'Do Not Disturb', pulse: false },
  };

  const sizeStyles = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="relative">
        <span className={`block rounded-full ${sizeStyles[size]} ${config.color}`} />
        {config.pulse && (
          <motion.span
            className={`absolute inset-0 rounded-full ${config.color}`}
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </span>
      {showLabel && (
        <span className="text-xs text-zinc-600 dark:text-zinc-400">{config.label}</span>
      )}
    </span>
  );
};

// Tag Component (for filtering/categorization)
interface TagProps {
  children: React.ReactNode;
  color?: string;
  selected?: boolean;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export const Tag: React.FC<TagProps> = ({
  children,
  color,
  selected = false,
  onClick,
  removable = false,
  onRemove,
  className = '',
}) => {
  const defaultColor = 'indigo';
  const tagColor = color || defaultColor;

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-500' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-500' },
    pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-500' },
    red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-500' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-500' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-500' },
    green: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500' },
    teal: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-500' },
    cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-500' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500' },
  };

  const colors = colorMap[tagColor] || colorMap.indigo;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium
        border-2 transition-colors
        ${selected
          ? `${colors.bg} ${colors.text} ${colors.border}`
          : 'bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span>{children}</span>
      {removable && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-0.5 -mr-0.5 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
        >
          <X size={10} />
        </span>
      )}
    </motion.button>
  );
};

export default Badge;
