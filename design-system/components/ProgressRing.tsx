import React from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  thickness?: number;
  showValue?: boolean;
  showPercentage?: boolean;
  label?: string;
  color?: 'default' | 'success' | 'warning' | 'error' | 'gradient';
  trackColor?: string;
  animated?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const sizeConfig = {
  sm: { size: 48, fontSize: 'text-xs', iconSize: 16 },
  md: { size: 64, fontSize: 'text-sm', iconSize: 20 },
  lg: { size: 96, fontSize: 'text-lg', iconSize: 28 },
  xl: { size: 128, fontSize: 'text-2xl', iconSize: 36 },
};

const colorConfig = {
  default: 'stroke-indigo-500',
  success: 'stroke-emerald-500',
  warning: 'stroke-amber-500',
  error: 'stroke-red-500',
  gradient: '', // handled separately
};

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max = 100,
  size = 'md',
  thickness = 4,
  showValue = true,
  showPercentage = true,
  label,
  color = 'default',
  trackColor,
  animated = true,
  children,
  className = '',
}) => {
  const config = sizeConfig[size];
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (config.size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Animated value
  const springValue = useSpring(percentage, { stiffness: 100, damping: 30 });
  const animatedOffset = useTransform(
    springValue,
    (v) => circumference - (v / 100) * circumference
  );

  // Gradient ID for unique gradients
  const gradientId = React.useId();

  // Determine status icon
  const renderStatusIcon = () => {
    if (percentage >= 100) {
      return <Check size={config.iconSize} className="text-emerald-500" />;
    }
    return null;
  };

  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <div className="relative" style={{ width: config.size, height: config.size }}>
        <svg
          width={config.size}
          height={config.size}
          viewBox={`0 0 ${config.size} ${config.size}`}
          className="transform -rotate-90"
        >
          {/* Gradient definition */}
          {color === 'gradient' && (
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          )}

          {/* Track */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            fill="none"
            stroke={trackColor || 'currentColor'}
            strokeWidth={thickness}
            className={trackColor ? '' : 'text-zinc-200 dark:text-zinc-700'}
          />

          {/* Progress */}
          <motion.circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            fill="none"
            stroke={color === 'gradient' ? `url(#${gradientId})` : undefined}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? animatedOffset : strokeDashoffset}
            className={color !== 'gradient' ? colorConfig[color] : ''}
            style={!animated ? { strokeDashoffset } : undefined}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          {children ? (
            children
          ) : showValue ? (
            <>
              {percentage >= 100 ? (
                renderStatusIcon()
              ) : (
                <span className={`font-bold text-zinc-900 dark:text-white ${config.fontSize}`}>
                  {Math.round(percentage)}
                  {showPercentage && <span className="text-zinc-400">%</span>}
                </span>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Label */}
      {label && (
        <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
      )}
    </div>
  );
};

// Multi-ring progress (for multiple metrics)
interface MultiRingProgressProps {
  rings: Array<{
    value: number;
    max?: number;
    color: string;
    label?: string;
  }>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  thickness?: number;
  gap?: number;
  className?: string;
}

export const MultiRingProgress: React.FC<MultiRingProgressProps> = ({
  rings,
  size = 'md',
  thickness = 4,
  gap = 8,
  className = '',
}) => {
  const config = sizeConfig[size];
  const totalSize = config.size + (rings.length - 1) * (thickness + gap) * 2;

  return (
    <div className={`relative ${className}`} style={{ width: totalSize, height: totalSize }}>
      <svg
        width={totalSize}
        height={totalSize}
        viewBox={`0 0 ${totalSize} ${totalSize}`}
        className="transform -rotate-90"
      >
        {rings.map((ring, index) => {
          const ringRadius = (totalSize - thickness) / 2 - index * (thickness + gap);
          const circumference = 2 * Math.PI * ringRadius;
          const percentage = Math.min(100, Math.max(0, (ring.value / (ring.max || 100)) * 100));
          const strokeDashoffset = circumference - (percentage / 100) * circumference;

          return (
            <g key={index}>
              {/* Track */}
              <circle
                cx={totalSize / 2}
                cy={totalSize / 2}
                r={ringRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth={thickness}
                className="text-zinc-200 dark:text-zinc-700"
                opacity={0.3}
              />

              {/* Progress */}
              <motion.circle
                cx={totalSize / 2}
                cy={totalSize / 2}
                r={ringRadius}
                fill="none"
                stroke={ring.color}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 }}
              />
            </g>
          );
        })}
      </svg>

      {/* Center content - show all values */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          {rings.map((ring, index) => (
            <div key={index} className="flex items-center gap-1 text-xs">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ring.color }}
              />
              <span className="text-zinc-600 dark:text-zinc-400">
                {ring.label || `Ring ${index + 1}`}:
              </span>
              <span className="font-medium text-zinc-900 dark:text-white">
                {Math.round((ring.value / (ring.max || 100)) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Activity Ring (Apple Watch style)
interface ActivityRingProps {
  move: number;
  exercise: number;
  stand: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ActivityRing: React.FC<ActivityRingProps> = ({
  move,
  exercise,
  stand,
  size = 'md',
  className = '',
}) => {
  return (
    <MultiRingProgress
      rings={[
        { value: move, color: '#FF2D55', label: 'Move' },
        { value: exercise, color: '#B8FF00', label: 'Exercise' },
        { value: stand, color: '#00D4FF', label: 'Stand' },
      ]}
      size={size}
      thickness={size === 'sm' ? 4 : size === 'md' ? 6 : 8}
      gap={size === 'sm' ? 4 : size === 'md' ? 6 : 8}
      className={className}
    />
  );
};

// Countdown Ring
interface CountdownRingProps {
  duration: number; // in seconds
  onComplete?: () => void;
  autoStart?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export const CountdownRing: React.FC<CountdownRingProps> = ({
  duration,
  onComplete,
  autoStart = true,
  size = 'md',
  color = 'default',
  className = '',
}) => {
  const [remaining, setRemaining] = React.useState(duration);
  const [isRunning, setIsRunning] = React.useState(autoStart);

  React.useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, remaining, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const percentage = (remaining / duration) * 100;

  return (
    <ProgressRing
      value={remaining}
      max={duration}
      size={size}
      color={color}
      showValue={false}
      className={className}
    >
      <span className={`font-mono font-bold ${sizeConfig[size].fontSize} text-zinc-900 dark:text-white`}>
        {formatTime(remaining)}
      </span>
    </ProgressRing>
  );
};

// Score Ring (for ratings, scores, etc.)
interface ScoreRingProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  className?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  maxScore = 100,
  size = 'md',
  label,
  className = '',
}) => {
  const percentage = (score / maxScore) * 100;

  const getColor = (): 'success' | 'warning' | 'error' => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  return (
    <ProgressRing
      value={score}
      max={maxScore}
      size={size}
      color={getColor()}
      showPercentage={false}
      label={label}
      className={className}
    >
      <span className={`font-bold ${sizeConfig[size].fontSize} text-zinc-900 dark:text-white`}>
        {score}
      </span>
    </ProgressRing>
  );
};

export default ProgressRing;
