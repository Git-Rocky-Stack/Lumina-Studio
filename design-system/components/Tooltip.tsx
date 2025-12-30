import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springPresets } from '../animations';

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
  disabled?: boolean;
  interactive?: boolean;
  maxWidth?: number;
  className?: string;
  arrow?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 200,
  disabled = false,
  interactive = false,
  maxWidth = 250,
  className = '',
  arrow = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 8;

    let x = 0;
    let y = 0;

    switch (placement) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.top - tooltipRect.height - gap;
        break;
      case 'top-start':
        x = triggerRect.left;
        y = triggerRect.top - tooltipRect.height - gap;
        break;
      case 'top-end':
        x = triggerRect.right - tooltipRect.width;
        y = triggerRect.top - tooltipRect.height - gap;
        break;
      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.bottom + gap;
        break;
      case 'bottom-start':
        x = triggerRect.left;
        y = triggerRect.bottom + gap;
        break;
      case 'bottom-end':
        x = triggerRect.right - tooltipRect.width;
        y = triggerRect.bottom + gap;
        break;
      case 'left':
        x = triggerRect.left - tooltipRect.width - gap;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
      case 'right':
        x = triggerRect.right + gap;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
    }

    // Keep within viewport
    const padding = 8;
    x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding));
    y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding));

    setPosition({ x, y });
  }, [placement]);

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      window.addEventListener('scroll', calculatePosition);
      window.addEventListener('resize', calculatePosition);
    }

    return () => {
      window.removeEventListener('scroll', calculatePosition);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isVisible, calculatePosition]);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!interactive) setIsVisible(false);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const getArrowPosition = () => {
    switch (placement) {
      case 'top':
      case 'top-start':
      case 'top-end':
        return 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-zinc-900 dark:border-t-zinc-700 border-l-transparent border-r-transparent border-b-transparent';
      case 'bottom':
      case 'bottom-start':
      case 'bottom-end':
        return 'top-[-4px] left-1/2 -translate-x-1/2 border-b-zinc-900 dark:border-b-zinc-700 border-l-transparent border-r-transparent border-t-transparent';
      case 'left':
        return 'right-[-4px] top-1/2 -translate-y-1/2 border-l-zinc-900 dark:border-l-zinc-700 border-t-transparent border-b-transparent border-r-transparent';
      case 'right':
        return 'left-[-4px] top-1/2 -translate-y-1/2 border-r-zinc-900 dark:border-r-zinc-700 border-t-transparent border-b-transparent border-l-transparent';
      default:
        return '';
    }
  };

  const getAnimationOrigin = () => {
    if (placement.startsWith('top')) return { y: 5 };
    if (placement.startsWith('bottom')) return { y: -5 };
    if (placement === 'left') return { x: 5 };
    if (placement === 'right') return { x: -5 };
    return { y: 5 };
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            role="tooltip"
            className={`
              fixed z-50 px-3 py-2 type-body-sm text-white
              bg-zinc-900 dark:bg-zinc-700 rounded-lg shadow-lg
              ${className}
            `}
            style={{
              left: position.x,
              top: position.y,
              maxWidth,
            }}
            initial={{ opacity: 0, ...getAnimationOrigin() }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, ...getAnimationOrigin() }}
            transition={{ duration: 0.15 }}
            onMouseEnter={interactive ? () => setIsVisible(true) : undefined}
            onMouseLeave={interactive ? handleMouseLeave : undefined}
          >
            {content}

            {/* Arrow */}
            {arrow && (
              <div className={`absolute w-0 h-0 border-4 ${getArrowPosition()}`} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Contextual tooltip that appears based on user behavior
interface ContextualTooltipProps {
  id: string;
  content: React.ReactNode;
  children: React.ReactNode;
  showOnce?: boolean;
  showAfterDelay?: number;
  className?: string;
}

export const ContextualTooltip: React.FC<ContextualTooltipProps> = ({
  id,
  content,
  children,
  showOnce = true,
  showAfterDelay = 3000,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (showOnce) {
      const shown = localStorage.getItem(`tooltip-${id}`);
      if (shown) {
        setDismissed(true);
        return;
      }
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, showAfterDelay);

    return () => clearTimeout(timer);
  }, [id, showOnce, showAfterDelay]);

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    if (showOnce) {
      localStorage.setItem(`tooltip-${id}`, 'true');
    }
  };

  if (dismissed) return <>{children}</>;

  return (
    <div className="relative inline-block">
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={`
              absolute z-50 p-4 rounded-xl shadow-xl
              bg-indigo-500 text-white
              ${className}
            `}
            style={{
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: 12,
              minWidth: 200,
            }}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={springPresets.snappy}
          >
            {/* Pulse ring */}
            <motion.div
              className="absolute -inset-1 rounded-xl bg-indigo-500"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <div className="relative">
              <div className="type-body-sm font-semibold mb-2">{content}</div>
              <button
                onClick={handleDismiss}
                className="type-caption text-white/70 hover:text-white underline"
              >
                Got it
              </button>
            </div>

            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-8 border-transparent border-t-indigo-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Hotspot tooltip (pulsing indicator)
interface HotspotProps {
  content: React.ReactNode;
  placement?: TooltipPlacement;
  pulseColor?: string;
  className?: string;
}

export const Hotspot: React.FC<HotspotProps> = ({
  content,
  placement = 'top',
  pulseColor = '#6366f1',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Tooltip content={content} placement={placement}>
      <button
        className={`relative w-6 h-6 rounded-full ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Pulse rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: pulseColor }}
            animate={{
              scale: [1, 2, 2],
              opacity: [0.4, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4,
            }}
          />
        ))}

        {/* Center dot */}
        <div
          className="absolute inset-1 rounded-full"
          style={{ backgroundColor: pulseColor }}
        />
      </button>
    </Tooltip>
  );
};

// Info tooltip with icon
interface InfoTooltipProps {
  content: React.ReactNode;
  placement?: TooltipPlacement;
  size?: number;
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
  content,
  placement = 'top',
  size = 16,
  className = '',
}) => {
  return (
    <Tooltip content={content} placement={placement}>
      <button
        className={`inline-flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>
    </Tooltip>
  );
};

export default Tooltip;
