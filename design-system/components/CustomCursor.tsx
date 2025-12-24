/**
 * Custom Cursor System
 *
 * Premium cursor interactions with:
 * - Context-aware cursor states
 * - Smooth spring-physics following
 * - Interactive element detection
 * - Magnetic effect on buttons
 * - Blend mode effects
 */

import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

type CursorVariant =
  | 'default'
  | 'pointer'
  | 'text'
  | 'grab'
  | 'grabbing'
  | 'zoom-in'
  | 'zoom-out'
  | 'hidden'
  | 'loading'
  | 'success'
  | 'error';

interface CursorContextValue {
  variant: CursorVariant;
  setVariant: (variant: CursorVariant) => void;
  text: string;
  setText: (text: string) => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const CursorContext = createContext<CursorContextValue | null>(null);

export function useCursor() {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
}

// ============================================================================
// CURSOR STYLES
// ============================================================================

const cursorVariants: Record<CursorVariant, {
  size: number;
  scale: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  mixBlendMode: string;
}> = {
  default: {
    size: 16,
    scale: 1,
    backgroundColor: 'transparent',
    borderColor: 'rgba(99, 102, 241, 0.8)',
    borderWidth: 2,
    mixBlendMode: 'difference',
  },
  pointer: {
    size: 48,
    scale: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.6)',
    borderWidth: 2,
    mixBlendMode: 'normal',
  },
  text: {
    size: 4,
    scale: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    borderColor: 'transparent',
    borderWidth: 0,
    mixBlendMode: 'difference',
  },
  grab: {
    size: 32,
    scale: 1,
    backgroundColor: 'transparent',
    borderColor: 'rgba(99, 102, 241, 0.6)',
    borderWidth: 2,
    mixBlendMode: 'normal',
  },
  grabbing: {
    size: 28,
    scale: 0.9,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: 'rgba(99, 102, 241, 0.8)',
    borderWidth: 2,
    mixBlendMode: 'normal',
  },
  'zoom-in': {
    size: 40,
    scale: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.6)',
    borderWidth: 2,
    mixBlendMode: 'normal',
  },
  'zoom-out': {
    size: 40,
    scale: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.6)',
    borderWidth: 2,
    mixBlendMode: 'normal',
  },
  hidden: {
    size: 0,
    scale: 0,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    mixBlendMode: 'normal',
  },
  loading: {
    size: 24,
    scale: 1,
    backgroundColor: 'transparent',
    borderColor: 'rgba(99, 102, 241, 0.6)',
    borderWidth: 2,
    mixBlendMode: 'normal',
  },
  success: {
    size: 40,
    scale: 1.2,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.8)',
    borderWidth: 2,
    mixBlendMode: 'normal',
  },
  error: {
    size: 40,
    scale: 1.2,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.8)',
    borderWidth: 2,
    mixBlendMode: 'normal',
  },
};

// ============================================================================
// CURSOR COMPONENT
// ============================================================================

const CustomCursorInner: React.FC = () => {
  const { variant, text, isVisible } = useCursor();
  const cursorRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for smooth following
  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  const styles = cursorVariants[variant];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Check if device supports hover (not touch-only)
  const [hasHover, setHasHover] = useState(true);
  useEffect(() => {
    setHasHover(window.matchMedia('(hover: hover)').matches);
  }, []);

  if (!hasHover || !isVisible) return null;

  return (
    <>
      {/* Main cursor */}
      <motion.div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[99999]"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        <motion.div
          animate={{
            width: styles.size,
            height: styles.size,
            scale: styles.scale,
            backgroundColor: styles.backgroundColor,
            borderColor: styles.borderColor,
            borderWidth: styles.borderWidth,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="rounded-full flex items-center justify-center"
          style={{ mixBlendMode: styles.mixBlendMode as any }}
        >
          {/* Loading spinner */}
          {variant === 'loading' && (
            <motion.div
              className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            />
          )}

          {/* Zoom icons */}
          {variant === 'zoom-in' && (
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          )}
          {variant === 'zoom-out' && (
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          )}

          {/* Success check */}
          {variant === 'success' && (
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}

          {/* Error X */}
          {variant === 'error' && (
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </motion.div>

        {/* Text label */}
        {text && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-md bg-slate-900 text-white text-xs font-medium"
          >
            {text}
          </motion.div>
        )}
      </motion.div>

      {/* Dot cursor (center point) */}
      <motion.div
        className="fixed top-0 left-0 w-1 h-1 rounded-full bg-indigo-500 pointer-events-none z-[99999]"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />

      {/* Global style to hide default cursor */}
      <style>{`
        * {
          cursor: none !important;
        }
      `}</style>
    </>
  );
};

// ============================================================================
// PROVIDER
// ============================================================================

interface CursorProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export const CursorProvider: React.FC<CursorProviderProps> = ({
  children,
  enabled = true,
}) => {
  const [variant, setVariant] = useState<CursorVariant>('default');
  const [text, setText] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  // Auto-detect cursor variant based on hovered element
  useEffect(() => {
    if (!enabled) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check for data-cursor attribute
      const cursorAttr = target.closest('[data-cursor]')?.getAttribute('data-cursor');
      if (cursorAttr) {
        setVariant(cursorAttr as CursorVariant);
        return;
      }

      // Check for text label
      const cursorText = target.closest('[data-cursor-text]')?.getAttribute('data-cursor-text');
      setText(cursorText || '');

      // Auto-detect based on element type
      if (target.closest('button, a, [role="button"], input[type="submit"]')) {
        setVariant('pointer');
      } else if (target.closest('input, textarea, [contenteditable="true"]')) {
        setVariant('text');
      } else if (target.closest('[draggable="true"]')) {
        setVariant('grab');
      } else {
        setVariant('default');
      }
    };

    const handleMouseDown = () => {
      if (variant === 'grab') {
        setVariant('grabbing');
      }
    };

    const handleMouseUp = () => {
      if (variant === 'grabbing') {
        setVariant('grab');
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [enabled, variant]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <CursorContext.Provider value={{ variant, setVariant, text, setText, isVisible, setIsVisible }}>
      {children}
      <CustomCursorInner />
    </CursorContext.Provider>
  );
};

// ============================================================================
// CURSOR TRIGGER COMPONENT
// ============================================================================

interface CursorTriggerProps {
  variant?: CursorVariant;
  text?: string;
  children: React.ReactNode;
  className?: string;
}

export const CursorTrigger: React.FC<CursorTriggerProps> = ({
  variant = 'pointer',
  text,
  children,
  className = '',
}) => {
  return (
    <div
      data-cursor={variant}
      data-cursor-text={text}
      className={className}
    >
      {children}
    </div>
  );
};

export default CursorProvider;
