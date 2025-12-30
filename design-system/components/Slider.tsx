import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { springPresets } from '../animations';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
  showValue?: boolean;
  showTooltip?: boolean;
  formatValue?: (value: number) => string;
  variant?: 'default' | 'gradient' | 'segments';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  marks?: { value: number; label?: string }[];
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  label,
  showValue = true,
  showTooltip = false,
  formatValue = (v) => v.toString(),
  variant = 'default',
  size = 'md',
  className = '',
  marks,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbX = useMotionValue(0);
  const [trackWidth, setTrackWidth] = useState(0);

  const sizeConfig = {
    sm: { track: 'h-1', thumb: 'w-3 h-3', mark: 'w-1 h-1' },
    md: { track: 'h-1.5', thumb: 'w-4 h-4', mark: 'w-1.5 h-1.5' },
    lg: { track: 'h-2', thumb: 'w-5 h-5', mark: 'w-2 h-2' },
  };

  const config = sizeConfig[size];
  const percentage = ((value - min) / (max - min)) * 100;

  // Update track width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (trackRef.current) {
        setTrackWidth(trackRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Update thumb position when value changes
  useEffect(() => {
    const newX = (percentage / 100) * trackWidth;
    animate(thumbX, newX, { type: 'spring', ...springPresets.snappy });
  }, [percentage, trackWidth, thumbX]);

  const calculateValue = useCallback((clientX: number) => {
    if (!trackRef.current) return value;

    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const rawValue = min + percent * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(min, Math.min(max, steppedValue));
  }, [min, max, step, value]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    onChange(calculateValue(e.clientX));
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    onChange(calculateValue(e.clientX));
  }, [isDragging, calculateValue, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    onChange(calculateValue(e.touches[0].clientX));
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    onChange(calculateValue(e.touches[0].clientX));
  }, [isDragging, calculateValue, onChange]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleTouchMove, handleMouseUp]);

  // Keyboard handlers
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    let newValue = value;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = Math.min(max, value + step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = Math.max(min, value - step);
        break;
      case 'Home':
        newValue = min;
        break;
      case 'End':
        newValue = max;
        break;
      default:
        return;
    }
    e.preventDefault();
    onChange(newValue);
  };

  const trackGradient = variant === 'gradient'
    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
    : 'bg-indigo-500';

  return (
    <div className={`w-full ${className}`}>
      {/* Label and value */}
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <label className="type-body-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {label}
            </label>
          )}
          {showValue && (
            <span className="type-body-sm font-semibold text-zinc-900 dark:text-white">
              {formatValue(value)}
            </span>
          )}
        </div>
      )}

      {/* Track container */}
      <div
        ref={trackRef}
        className={`
          relative w-full rounded-full cursor-pointer
          ${config.track}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background track */}
        <div className="absolute inset-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />

        {/* Filled track */}
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${trackGradient}`}
          style={{ width: `${percentage}%` }}
          initial={false}
          transition={springPresets.snappy}
        />

        {/* Marks */}
        {marks && marks.map((mark) => {
          const markPercent = ((mark.value - min) / (max - min)) * 100;
          return (
            <div
              key={mark.value}
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${markPercent}%` }}
            >
              <div className={`
                ${config.mark} rounded-full -translate-x-1/2
                ${mark.value <= value ? 'bg-white' : 'bg-zinc-400 dark:bg-zinc-500'}
              `} />
              {mark.label && (
                <span className="absolute top-4 left-1/2 -translate-x-1/2 type-caption text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  {mark.label}
                </span>
              )}
            </div>
          );
        })}

        {/* Thumb */}
        <motion.div
          className={`
            absolute top-1/2 -translate-y-1/2 -translate-x-1/2
            ${config.thumb} rounded-full bg-white
            shadow-lg border-2 border-indigo-500
            focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50
            ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
          `}
          style={{ x: thumbX }}
          animate={{
            scale: isDragging ? 1.2 : isHovered ? 1.1 : 1,
          }}
          transition={springPresets.snappy}
          tabIndex={disabled ? -1 : 0}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={label}
          onKeyDown={handleKeyDown}
        >
          {/* Tooltip */}
          {showTooltip && (isDragging || isHovered) && (
            <motion.div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 type-caption font-semibold text-white bg-zinc-900 rounded-md whitespace-nowrap"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
            >
              {formatValue(value)}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Range Slider (dual thumb)
interface RangeSliderProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  label,
  showValue = true,
  formatValue = (v) => v.toString(),
  size = 'md',
  className = '',
}) => {
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const sizeConfig = {
    sm: { track: 'h-1', thumb: 'w-3 h-3' },
    md: { track: 'h-1.5', thumb: 'w-4 h-4' },
    lg: { track: 'h-2', thumb: 'w-5 h-5' },
  };

  const config = sizeConfig[size];
  const minPercent = ((value[0] - min) / (max - min)) * 100;
  const maxPercent = ((value[1] - min) / (max - min)) * 100;

  const calculateValue = useCallback((clientX: number) => {
    if (!trackRef.current) return value[0];

    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const rawValue = min + percent * (max - min);
    return Math.round(rawValue / step) * step;
  }, [min, max, step, value]);

  const handleMouseDown = (thumb: 'min' | 'max') => (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setActiveThumb(thumb);
  };

  useEffect(() => {
    if (!activeThumb) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newValue = calculateValue(e.clientX);
      if (activeThumb === 'min') {
        onChange([Math.min(newValue, value[1] - step), value[1]]);
      } else {
        onChange([value[0], Math.max(newValue, value[0] + step)]);
      }
    };

    const handleMouseUp = () => setActiveThumb(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeThumb, calculateValue, onChange, step, value]);

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <label className="type-body-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {label}
            </label>
          )}
          {showValue && (
            <span className="type-body-sm font-semibold text-zinc-900 dark:text-white">
              {formatValue(value[0])} - {formatValue(value[1])}
            </span>
          )}
        </div>
      )}

      <div
        ref={trackRef}
        className={`
          relative w-full rounded-full
          ${config.track}
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        {/* Background track */}
        <div className="absolute inset-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />

        {/* Filled range */}
        <div
          className="absolute inset-y-0 bg-indigo-500 rounded-full"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />

        {/* Min thumb */}
        <motion.div
          className={`
            absolute top-1/2 -translate-y-1/2 -translate-x-1/2
            ${config.thumb} rounded-full bg-white
            shadow-lg border-2 border-indigo-500
            cursor-grab active:cursor-grabbing
          `}
          style={{ left: `${minPercent}%` }}
          animate={{ scale: activeThumb === 'min' ? 1.2 : 1 }}
          onMouseDown={handleMouseDown('min')}
        />

        {/* Max thumb */}
        <motion.div
          className={`
            absolute top-1/2 -translate-y-1/2 -translate-x-1/2
            ${config.thumb} rounded-full bg-white
            shadow-lg border-2 border-indigo-500
            cursor-grab active:cursor-grabbing
          `}
          style={{ left: `${maxPercent}%` }}
          animate={{ scale: activeThumb === 'max' ? 1.2 : 1 }}
          onMouseDown={handleMouseDown('max')}
        />
      </div>
    </div>
  );
};

export default Slider;
