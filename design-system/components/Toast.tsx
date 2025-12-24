/**
 * Toast Notification System
 *
 * World-class toast notifications with:
 * - Spring physics animations
 * - Stacking with proper spacing
 * - Action buttons (Undo, Retry, etc.)
 * - Auto-dismiss with progress indicator
 * - Accessible announcements
 * - Swipe to dismiss on touch
 */

import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { animation } from '../tokens';

// ============================================================================
// TYPES
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'neutral';
export type ToastPosition = 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  action?: ToastAction;
  duration?: number; // 0 for persistent
  dismissible?: boolean;
  icon?: React.ReactNode;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  // Convenience methods
  success: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => string;
  error: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => string;
  warning: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => string;
  info: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => string;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================================================
// ICONS
// ============================================================================

const icons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <motion.path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  neutral: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// ============================================================================
// STYLES
// ============================================================================

const typeStyles: Record<ToastType, { bg: string; border: string; icon: string; progress: string }> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50',
    progress: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/50',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50',
    progress: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50',
    progress: 'bg-blue-500',
  },
  neutral: {
    bg: 'bg-slate-50 dark:bg-slate-900/50',
    border: 'border-slate-200 dark:border-slate-700',
    icon: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800',
    progress: 'bg-slate-500',
  },
};

// ============================================================================
// TOAST ITEM COMPONENT
// ============================================================================

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
  index: number;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove, index }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(toast.duration || 5000);

  const x = useMotionValue(0);
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0]);

  const styles = typeStyles[toast.type];
  const duration = toast.duration ?? 5000;
  const dismissible = toast.dismissible ?? true;

  // Auto-dismiss timer
  useEffect(() => {
    if (duration === 0 || isPaused) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.max(0, 100 - (elapsed / remainingTimeRef.current) * 100);
      setProgress(newProgress);

      if (newProgress <= 0) {
        onRemove(toast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, isPaused, toast.id, onRemove]);

  // Pause on hover
  const handleMouseEnter = () => {
    if (duration === 0) return;
    setIsPaused(true);
    remainingTimeRef.current = remainingTimeRef.current * (progress / 100);
  };

  const handleMouseLeave = () => {
    if (duration === 0) return;
    setIsPaused(false);
    startTimeRef.current = Date.now();
  };

  // Swipe to dismiss
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 500) {
      onRemove(toast.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={animation.spring.smooth}
      style={{ x, opacity }}
      drag={dismissible ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.5}
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        relative w-[380px] max-w-[calc(100vw-32px)] overflow-hidden
        rounded-xl border shadow-lg backdrop-blur-sm
        ${styles.bg} ${styles.border}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Content */}
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${styles.icon}`}>
          {toast.icon || icons[toast.type]}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {toast.description}
            </p>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                onRemove(toast.id);
              }}
              className="mt-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        {dismissible && (
          <button
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5">
          <motion.div
            className={`h-full ${styles.progress}`}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// TOAST CONTAINER
// ============================================================================

interface ToastContainerProps {
  position?: ToastPosition;
}

const positionStyles: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4 items-end',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'top-left': 'top-4 left-4 items-start',
  'bottom-right': 'bottom-4 right-4 items-end',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-left': 'bottom-4 left-4 items-start',
};

const ToastContainer: React.FC<ToastContainerProps> = ({ position = 'top-right' }) => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className={`fixed z-[9999] flex flex-col gap-3 pointer-events-none ${positionStyles[position]}`}
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, index) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} index={index} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// TOAST PROVIDER
// ============================================================================

interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { ...toast, id };

    setToasts((prev) => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });

    return id;
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => {
    return addToast({ type: 'success', title, ...options });
  }, [addToast]);

  const error = useCallback((title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => {
    return addToast({ type: 'error', title, duration: 0, ...options }); // Errors persist by default
  }, [addToast]);

  const warning = useCallback((title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => {
    return addToast({ type: 'warning', title, ...options });
  }, [addToast]);

  const info = useCallback((title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title'>>) => {
    return addToast({ type: 'info', title, ...options });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll, success, error, warning, info }}>
      {children}
      <ToastContainer position={position} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
