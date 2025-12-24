/**
 * Animation System
 *
 * World-class animations with:
 * - Spring physics presets
 * - Staggered animations
 * - Page transitions
 * - Micro-interactions
 * - Scroll-triggered animations
 */

import { Variants, Transition } from 'framer-motion';

// ============================================================================
// SPRING CONFIGURATIONS
// ============================================================================

export const springs = {
  // Quick, snappy - for buttons, toggles, small elements
  snappy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 30,
    mass: 1,
  },

  // Smooth, natural - for modals, cards, medium elements
  smooth: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 1,
  },

  // Bouncy - for emphasis, success states, celebrations
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 15,
    mass: 1,
  },

  // Gentle - for large elements, page transitions
  gentle: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25,
    mass: 1,
  },

  // Stiff - for immediate feedback, precise control
  stiff: {
    type: 'spring' as const,
    stiffness: 600,
    damping: 35,
    mass: 1,
  },

  // Wobbly - for playful, attention-grabbing animations
  wobbly: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 10,
    mass: 1,
  },

  // Molasses - for slow, dramatic reveals
  molasses: {
    type: 'spring' as const,
    stiffness: 100,
    damping: 20,
    mass: 2,
  },
} as const;

// ============================================================================
// EASING CURVES (For non-spring animations)
// ============================================================================

export const easings = {
  // Apple-style deceleration
  smooth: [0.16, 1, 0.3, 1] as const,

  // Energetic spring feel
  spring: [0.34, 1.56, 0.64, 1] as const,

  // Material Design standard
  emphasize: [0.4, 0, 0.2, 1] as const,

  // Quick snap
  snap: [0.5, 0, 0.1, 1] as const,

  // Gentle ease
  gentle: [0.25, 0.1, 0.25, 1] as const,

  // Expo out
  expoOut: [0.19, 1, 0.22, 1] as const,

  // Circ out
  circOut: [0, 0.55, 0.45, 1] as const,

  // Back out (slight overshoot)
  backOut: [0.34, 1.3, 0.64, 1] as const,
};

// ============================================================================
// DURATIONS
// ============================================================================

export const durations = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  slower: 0.5,
  slowest: 0.7,
  // For stagger delays
  stagger: {
    fast: 0.03,
    normal: 0.05,
    slow: 0.08,
  },
};

// ============================================================================
// FADE ANIMATIONS
// ============================================================================

export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// ============================================================================
// SCALE ANIMATIONS
// ============================================================================

export const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const scaleInCenter: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springs.bouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.15 },
  },
};

// ============================================================================
// SLIDE ANIMATIONS
// ============================================================================

export const slideInFromTop: Variants = {
  initial: { opacity: 0, y: '-100%' },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '-100%' },
};

export const slideInFromBottom: Variants = {
  initial: { opacity: 0, y: '100%' },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: '100%' },
};

export const slideInFromLeft: Variants = {
  initial: { opacity: 0, x: '-100%' },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: '-100%' },
};

export const slideInFromRight: Variants = {
  initial: { opacity: 0, x: '100%' },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: '100%' },
};

// ============================================================================
// STAGGER CONTAINER
// ============================================================================

export const staggerContainer = (staggerDelay = 0.05): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: staggerDelay / 2,
      staggerDirection: -1,
    },
  },
});

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.15 },
  },
};

export const staggerItemScale: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.15 },
  },
};

// ============================================================================
// MODAL / DIALOG ANIMATIONS
// ============================================================================

export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15 },
  },
};

export const sheetFromBottom: Variants = {
  initial: { y: '100%' },
  animate: {
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    y: '100%',
    transition: springs.gentle,
  },
};

// ============================================================================
// BUTTON MICRO-INTERACTIONS
// ============================================================================

export const buttonTap = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

export const buttonHover = {
  scale: 1.02,
  transition: springs.snappy,
};

export const buttonPress = {
  scale: 0.95,
  transition: { duration: 0.05 },
};

// ============================================================================
// CARD MICRO-INTERACTIONS
// ============================================================================

export const cardHover: Variants = {
  rest: {
    y: 0,
    scale: 1,
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    y: -4,
    scale: 1.01,
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.15)',
    transition: springs.smooth,
  },
  tap: {
    scale: 0.99,
    transition: { duration: 0.1 },
  },
};

// ============================================================================
// LIST ITEM ANIMATIONS
// ============================================================================

export const listItem: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.15 },
  },
  hover: {
    x: 4,
    transition: springs.snappy,
  },
};

// ============================================================================
// NOTIFICATION / TOAST ANIMATIONS
// ============================================================================

export const toastSlideIn: Variants = {
  initial: {
    opacity: 0,
    y: -20,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springs.bouncy,
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

// ============================================================================
// SKELETON SHIMMER
// ============================================================================

export const shimmer: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear',
    },
  },
};

// ============================================================================
// SPINNER ANIMATION
// ============================================================================

export const spin = {
  rotate: 360,
  transition: {
    repeat: Infinity,
    duration: 1,
    ease: 'linear',
  },
};

// ============================================================================
// PULSE ANIMATION
// ============================================================================

export const pulse: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: 'easeInOut',
    },
  },
};

// ============================================================================
// CHECKMARK DRAW ANIMATION
// ============================================================================

export const checkmarkDraw = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.4, ease: 'easeOut' },
      opacity: { duration: 0.1 },
    },
  },
};

// ============================================================================
// PAGE TRANSITIONS
// ============================================================================

export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: easings.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: 'blur(4px)',
    transition: {
      duration: 0.2,
    },
  },
};

// ============================================================================
// SCROLL-TRIGGERED ANIMATIONS
// ============================================================================

export const scrollReveal: Variants = {
  offscreen: {
    opacity: 0,
    y: 50,
  },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      ...springs.smooth,
      duration: 0.6,
    },
  },
};

export const scrollRevealLeft: Variants = {
  offscreen: { opacity: 0, x: -50 },
  onscreen: {
    opacity: 1,
    x: 0,
    transition: springs.smooth,
  },
};

export const scrollRevealRight: Variants = {
  offscreen: { opacity: 0, x: 50 },
  onscreen: {
    opacity: 1,
    x: 0,
    transition: springs.smooth,
  },
};

export const scrollRevealScale: Variants = {
  offscreen: { opacity: 0, scale: 0.9 },
  onscreen: {
    opacity: 1,
    scale: 1,
    transition: springs.smooth,
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a staggered animation with custom delay
 */
export function createStagger(
  staggerDelay = 0.05,
  childVariants: Variants = staggerItem
): { container: Variants; item: Variants } {
  return {
    container: staggerContainer(staggerDelay),
    item: childVariants,
  };
}

/**
 * Create a delayed animation
 */
export function withDelay(variants: Variants, delay: number): Variants {
  return {
    ...variants,
    animate: {
      ...(variants.animate as object),
      transition: {
        ...((variants.animate as any)?.transition || {}),
        delay,
      },
    },
  };
}

/**
 * Combine multiple variant animations
 */
export function combineVariants(...variantsList: Variants[]): Variants {
  return variantsList.reduce((acc, variants) => {
    return {
      initial: { ...acc.initial, ...variants.initial },
      animate: { ...acc.animate, ...variants.animate },
      exit: { ...acc.exit, ...variants.exit },
      hover: { ...acc.hover, ...variants.hover },
    };
  }, {} as Variants);
}

export default {
  springs,
  easings,
  durations,
  fadeVariants,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleVariants,
  scaleInCenter,
  popIn,
  slideInFromTop,
  slideInFromBottom,
  slideInFromLeft,
  slideInFromRight,
  staggerContainer,
  staggerItem,
  staggerItemScale,
  modalBackdrop,
  modalContent,
  sheetFromBottom,
  buttonTap,
  buttonHover,
  buttonPress,
  cardHover,
  listItem,
  toastSlideIn,
  shimmer,
  spin,
  pulse,
  checkmarkDraw,
  pageTransition,
  scrollReveal,
  scrollRevealLeft,
  scrollRevealRight,
  scrollRevealScale,
  createStagger,
  withDelay,
  combineVariants,
};
