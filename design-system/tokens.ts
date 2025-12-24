/**
 * Lumina Studio Design Token System
 *
 * Apple-inspired systematic design tokens for world-class consistency.
 * Based on 8px grid system with carefully crafted scales.
 */

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================
export const typography = {
  // Font families
  fonts: {
    display: "'Space Grotesk', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', monospace",
  },

  // Systematic type scale (major second - 1.125 ratio)
  scale: {
    '2xs': { size: 10, lineHeight: 14, letterSpacing: '0.02em' },
    'xs': { size: 11, lineHeight: 16, letterSpacing: '0.01em' },
    'sm': { size: 13, lineHeight: 18, letterSpacing: '0.005em' },
    'base': { size: 15, lineHeight: 22, letterSpacing: '0' },
    'lg': { size: 17, lineHeight: 24, letterSpacing: '-0.01em' },
    'xl': { size: 20, lineHeight: 28, letterSpacing: '-0.015em' },
    '2xl': { size: 24, lineHeight: 32, letterSpacing: '-0.02em' },
    '3xl': { size: 30, lineHeight: 38, letterSpacing: '-0.022em' },
    '4xl': { size: 36, lineHeight: 44, letterSpacing: '-0.025em' },
    '5xl': { size: 48, lineHeight: 56, letterSpacing: '-0.028em' },
    '6xl': { size: 60, lineHeight: 68, letterSpacing: '-0.03em' },
    '7xl': { size: 72, lineHeight: 80, letterSpacing: '-0.032em' },
  },

  // Font weights
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
} as const;

// ============================================================================
// SPACING SCALE (8px base unit)
// ============================================================================
export const spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
} as const;

// ============================================================================
// COLOR SYSTEM - Semantic Tokens
// ============================================================================
export const colors = {
  // Background surfaces
  surface: {
    primary: '#ffffff',
    secondary: '#fafbfc',
    tertiary: '#f5f7fa',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
    inverse: '#0f1419',
  },

  // Dark mode surfaces
  surfaceDark: {
    primary: '#0a0a0f',
    secondary: '#12131a',
    tertiary: '#1a1b23',
    elevated: '#1e1f28',
    overlay: 'rgba(0, 0, 0, 0.75)',
    inverse: '#ffffff',
  },

  // Text colors
  text: {
    primary: '#0f1419',
    secondary: '#536471',
    tertiary: '#8b98a5',
    disabled: '#c4cfd6',
    inverse: '#ffffff',
    link: '#6366f1',
  },

  textDark: {
    primary: '#f7f9f9',
    secondary: '#8b98a5',
    tertiary: '#6e7781',
    disabled: '#484f58',
    inverse: '#0f1419',
    link: '#818cf8',
  },

  // Border colors
  border: {
    subtle: '#ebeef0',
    moderate: '#d0d7de',
    strong: '#afb8c1',
    focus: '#6366f1',
  },

  borderDark: {
    subtle: '#21262d',
    moderate: '#30363d',
    strong: '#484f58',
    focus: '#818cf8',
  },

  // Brand colors with full shade range
  brand: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },

  // Semantic colors
  success: {
    light: '#dcfce7',
    base: '#22c55e',
    dark: '#15803d',
  },
  warning: {
    light: '#fef3c7',
    base: '#f59e0b',
    dark: '#b45309',
  },
  error: {
    light: '#fee2e2',
    base: '#ef4444',
    dark: '#b91c1c',
  },
  info: {
    light: '#dbeafe',
    base: '#3b82f6',
    dark: '#1d4ed8',
  },
} as const;

// ============================================================================
// SHADOW SYSTEM - Layered Elevation
// ============================================================================
export const shadows = {
  none: 'none',

  // Subtle shadows for cards and containers
  xs: '0 1px 2px rgba(0, 0, 0, 0.04)',

  sm: `
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.04)
  `,

  md: `
    0 2px 4px rgba(0, 0, 0, 0.04),
    0 4px 8px rgba(0, 0, 0, 0.06)
  `,

  lg: `
    0 4px 8px rgba(0, 0, 0, 0.04),
    0 8px 16px rgba(0, 0, 0, 0.06),
    0 16px 32px rgba(0, 0, 0, 0.04)
  `,

  xl: `
    0 8px 16px rgba(0, 0, 0, 0.04),
    0 16px 32px rgba(0, 0, 0, 0.08),
    0 32px 64px rgba(0, 0, 0, 0.04)
  `,

  '2xl': `
    0 16px 32px rgba(0, 0, 0, 0.06),
    0 32px 64px rgba(0, 0, 0, 0.1),
    0 64px 128px rgba(0, 0, 0, 0.06)
  `,

  // Focus ring shadow
  focus: '0 0 0 3px rgba(99, 102, 241, 0.4)',
  focusDark: '0 0 0 3px rgba(129, 140, 248, 0.4)',

  // Brand glow effects
  glow: {
    sm: '0 0 20px rgba(99, 102, 241, 0.15)',
    md: '0 0 40px rgba(99, 102, 241, 0.2)',
    lg: '0 0 60px rgba(99, 102, 241, 0.25)',
  },

  // Inner shadows
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
  innerStrong: 'inset 0 4px 8px rgba(0, 0, 0, 0.1)',
} as const;

// ============================================================================
// BORDER RADIUS SCALE
// ============================================================================
export const radii = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// ============================================================================
// ANIMATION TOKENS
// ============================================================================
export const animation = {
  // Easing curves (Apple-inspired)
  easing: {
    // Standard deceleration - most common
    smooth: [0.16, 1, 0.3, 1] as const,

    // Energetic spring bounce
    spring: [0.34, 1.56, 0.64, 1] as const,

    // Emphasized motion
    emphasize: [0.4, 0, 0.2, 1] as const,

    // Quick snap
    snap: [0.5, 0, 0.1, 1] as const,

    // Gentle ease
    gentle: [0.25, 0.1, 0.25, 1] as const,

    // Linear (for progress/loading)
    linear: [0, 0, 1, 1] as const,
  },

  // Duration scale (in ms)
  duration: {
    instant: 100,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
    slowest: 700,
  },

  // Spring configurations for Framer Motion
  spring: {
    // Quick, snappy - for buttons, toggles
    snappy: { type: 'spring', stiffness: 500, damping: 30 },

    // Smooth, natural - for modals, cards
    smooth: { type: 'spring', stiffness: 300, damping: 30 },

    // Bouncy - for emphasis, success states
    bouncy: { type: 'spring', stiffness: 400, damping: 15 },

    // Gentle - for large elements, page transitions
    gentle: { type: 'spring', stiffness: 200, damping: 25 },

    // Stiff - for immediate feedback
    stiff: { type: 'spring', stiffness: 600, damping: 35 },
  },
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================
export const breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
  max: 9999,
} as const;

// ============================================================================
// CSS VARIABLE GENERATOR
// ============================================================================
export function generateCSSVariables(isDark = false): string {
  const surfaceColors = isDark ? colors.surfaceDark : colors.surface;
  const textColors = isDark ? colors.textDark : colors.text;
  const borderColors = isDark ? colors.borderDark : colors.border;
  const focusShadow = isDark ? shadows.focusDark : shadows.focus;

  return `
    :root {
      /* Typography */
      --font-display: ${typography.fonts.display};
      --font-body: ${typography.fonts.body};
      --font-mono: ${typography.fonts.mono};

      /* Surfaces */
      --surface-primary: ${surfaceColors.primary};
      --surface-secondary: ${surfaceColors.secondary};
      --surface-tertiary: ${surfaceColors.tertiary};
      --surface-elevated: ${surfaceColors.elevated};
      --surface-overlay: ${surfaceColors.overlay};
      --surface-inverse: ${surfaceColors.inverse};

      /* Text */
      --text-primary: ${textColors.primary};
      --text-secondary: ${textColors.secondary};
      --text-tertiary: ${textColors.tertiary};
      --text-disabled: ${textColors.disabled};
      --text-inverse: ${textColors.inverse};
      --text-link: ${textColors.link};

      /* Borders */
      --border-subtle: ${borderColors.subtle};
      --border-moderate: ${borderColors.moderate};
      --border-strong: ${borderColors.strong};
      --border-focus: ${borderColors.focus};

      /* Brand */
      --brand-50: ${colors.brand[50]};
      --brand-100: ${colors.brand[100]};
      --brand-200: ${colors.brand[200]};
      --brand-300: ${colors.brand[300]};
      --brand-400: ${colors.brand[400]};
      --brand-500: ${colors.brand[500]};
      --brand-600: ${colors.brand[600]};
      --brand-700: ${colors.brand[700]};
      --brand-800: ${colors.brand[800]};
      --brand-900: ${colors.brand[900]};
      --brand-950: ${colors.brand[950]};

      /* Semantic colors */
      --success-light: ${colors.success.light};
      --success-base: ${colors.success.base};
      --success-dark: ${colors.success.dark};
      --warning-light: ${colors.warning.light};
      --warning-base: ${colors.warning.base};
      --warning-dark: ${colors.warning.dark};
      --error-light: ${colors.error.light};
      --error-base: ${colors.error.base};
      --error-dark: ${colors.error.dark};
      --info-light: ${colors.info.light};
      --info-base: ${colors.info.base};
      --info-dark: ${colors.info.dark};

      /* Shadows */
      --shadow-xs: ${shadows.xs};
      --shadow-sm: ${shadows.sm};
      --shadow-md: ${shadows.md};
      --shadow-lg: ${shadows.lg};
      --shadow-xl: ${shadows.xl};
      --shadow-2xl: ${shadows['2xl']};
      --shadow-focus: ${focusShadow};
      --shadow-glow-sm: ${shadows.glow.sm};
      --shadow-glow-md: ${shadows.glow.md};
      --shadow-glow-lg: ${shadows.glow.lg};

      /* Border radius */
      --radius-xs: ${radii.xs}px;
      --radius-sm: ${radii.sm}px;
      --radius-md: ${radii.md}px;
      --radius-lg: ${radii.lg}px;
      --radius-xl: ${radii.xl}px;
      --radius-2xl: ${radii['2xl']}px;
      --radius-3xl: ${radii['3xl']}px;
      --radius-full: ${radii.full}px;

      /* Animation */
      --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
      --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
      --ease-emphasize: cubic-bezier(0.4, 0, 0.2, 1);
      --ease-snap: cubic-bezier(0.5, 0, 0.1, 1);
      --ease-gentle: cubic-bezier(0.25, 0.1, 0.25, 1);

      --duration-instant: ${animation.duration.instant}ms;
      --duration-fast: ${animation.duration.fast}ms;
      --duration-normal: ${animation.duration.normal}ms;
      --duration-slow: ${animation.duration.slow}ms;
      --duration-slower: ${animation.duration.slower}ms;
      --duration-slowest: ${animation.duration.slowest}ms;
    }
  `;
}

// Unified tokens export for convenience
export const tokens = {
  typography,
  spacing,
  colors,
  shadows,
  radii,
  animation,
  breakpoints,
  zIndex,
  generateCSSVariables,
};

export default tokens;
