// ============================================================================
// AUTO-LAYOUT SYSTEM - TYPE DEFINITIONS
// ============================================================================

/**
 * Layout direction
 */
export type LayoutDirection = 'horizontal' | 'vertical';

/**
 * Alignment options
 */
export type Alignment = 'start' | 'center' | 'end' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly';

/**
 * Sizing mode
 */
export type SizingMode = 'fixed' | 'hug' | 'fill';

/**
 * Constraint type for responsive positioning
 */
export type ConstraintType = 'left' | 'right' | 'top' | 'bottom' | 'center' | 'scale';

/**
 * Layout constraints for an element
 */
export interface LayoutConstraints {
  horizontal: {
    type: ConstraintType;
    offset?: number;
    scale?: number; // For percentage-based positioning
  };
  vertical: {
    type: ConstraintType;
    offset?: number;
    scale?: number;
  };
}

/**
 * Padding values
 */
export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Auto-layout frame properties
 */
export interface AutoLayoutFrame {
  id: string;
  name: string;

  // Layout settings
  direction: LayoutDirection;
  primaryAxisAlignment: Alignment;
  crossAxisAlignment: Alignment;
  gap: number;
  padding: Padding;

  // Sizing
  widthMode: SizingMode;
  heightMode: SizingMode;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;

  // Frame dimensions
  x: number;
  y: number;
  width: number;
  height: number;

  // Children
  childIds: string[];

  // Visual
  backgroundColor?: string;
  borderRadius?: number;
  border?: {
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
  };

  // Nesting
  parentFrameId?: string;
}

/**
 * Layout item (child within a frame)
 */
export interface LayoutItem {
  elementId: string;
  order: number;

  // Item-specific overrides
  alignSelf?: Alignment;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | 'auto';

  // Constraints when not in auto-layout
  constraints?: LayoutConstraints;

  // Fixed size overrides
  fixedWidth?: number;
  fixedHeight?: number;
}

/**
 * Responsive breakpoint
 */
export interface Breakpoint {
  id: string;
  name: string;
  minWidth: number;
  maxWidth?: number;
  icon: string;
}

/**
 * Responsive variant of a layout
 */
export interface ResponsiveVariant {
  breakpointId: string;
  frameOverrides: Partial<AutoLayoutFrame>;
  itemOverrides: Map<string, Partial<LayoutItem>>;
}

/**
 * Grid layout settings
 */
export interface GridLayout {
  columns: number;
  rows?: number;
  columnGap: number;
  rowGap: number;
  columnSizes: (number | 'auto' | 'fr')[];
  rowSizes?: (number | 'auto' | 'fr')[];
}

/**
 * Smart distribute options
 */
export interface DistributeOptions {
  direction: 'horizontal' | 'vertical';
  spacing: 'equal' | 'fixed';
  fixedValue?: number;
  alignment: 'start' | 'center' | 'end';
}

/**
 * Smart align options
 */
export interface AlignOptions {
  axis: 'horizontal' | 'vertical';
  position: 'start' | 'center' | 'end';
  relativeTo: 'selection' | 'canvas' | 'parent';
}

/**
 * Layout preset
 */
export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'stack' | 'grid' | 'card' | 'list' | 'navigation';
  frame: Partial<AutoLayoutFrame>;
  responsive?: ResponsiveVariant[];
}

/**
 * Layout calculation result
 */
export interface LayoutResult {
  elementId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Layout state
 */
export interface LayoutState {
  frames: Map<string, AutoLayoutFrame>;
  items: Map<string, LayoutItem>;
  activeFrameId: string | null;
  currentBreakpoint: string;
  showGuides: boolean;
  snapToLayout: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { id: 'mobile', name: 'Mobile', minWidth: 0, maxWidth: 767, icon: 'fa-mobile' },
  { id: 'tablet', name: 'Tablet', minWidth: 768, maxWidth: 1023, icon: 'fa-tablet' },
  { id: 'desktop', name: 'Desktop', minWidth: 1024, maxWidth: 1439, icon: 'fa-laptop' },
  { id: 'large', name: 'Large', minWidth: 1440, icon: 'fa-desktop' }
];

export const DEFAULT_PADDING: Padding = {
  top: 16,
  right: 16,
  bottom: 16,
  left: 16
};

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'horizontal-stack',
    name: 'Horizontal Stack',
    description: 'Items arranged horizontally',
    icon: 'fa-arrows-left-right',
    category: 'stack',
    frame: {
      direction: 'horizontal',
      gap: 16,
      primaryAxisAlignment: 'start',
      crossAxisAlignment: 'center'
    }
  },
  {
    id: 'vertical-stack',
    name: 'Vertical Stack',
    description: 'Items arranged vertically',
    icon: 'fa-arrows-up-down',
    category: 'stack',
    frame: {
      direction: 'vertical',
      gap: 16,
      primaryAxisAlignment: 'start',
      crossAxisAlignment: 'stretch'
    }
  },
  {
    id: 'centered-stack',
    name: 'Centered Stack',
    description: 'Centered vertical stack',
    icon: 'fa-align-center',
    category: 'stack',
    frame: {
      direction: 'vertical',
      gap: 24,
      primaryAxisAlignment: 'center',
      crossAxisAlignment: 'center'
    }
  },
  {
    id: 'card-layout',
    name: 'Card',
    description: 'Card with padding',
    icon: 'fa-square',
    category: 'card',
    frame: {
      direction: 'vertical',
      gap: 12,
      padding: { top: 24, right: 24, bottom: 24, left: 24 },
      primaryAxisAlignment: 'start',
      crossAxisAlignment: 'stretch',
      borderRadius: 16
    }
  },
  {
    id: 'list-item',
    name: 'List Item',
    description: 'Horizontal list item',
    icon: 'fa-list',
    category: 'list',
    frame: {
      direction: 'horizontal',
      gap: 12,
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      primaryAxisAlignment: 'space-between',
      crossAxisAlignment: 'center'
    }
  },
  {
    id: 'nav-bar',
    name: 'Navigation Bar',
    description: 'Horizontal navigation',
    icon: 'fa-bars',
    category: 'navigation',
    frame: {
      direction: 'horizontal',
      gap: 32,
      padding: { top: 16, right: 24, bottom: 16, left: 24 },
      primaryAxisAlignment: 'space-between',
      crossAxisAlignment: 'center'
    }
  },
  {
    id: 'grid-2x2',
    name: '2x2 Grid',
    description: 'Two column grid',
    icon: 'fa-th-large',
    category: 'grid',
    frame: {
      direction: 'horizontal',
      gap: 16,
      primaryAxisAlignment: 'start',
      crossAxisAlignment: 'start'
    }
  }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create default padding
 */
export function createPadding(value: number): Padding;
export function createPadding(vertical: number, horizontal: number): Padding;
export function createPadding(top: number, right: number, bottom: number, left: number): Padding;
export function createPadding(...args: number[]): Padding {
  if (args.length === 1) {
    return { top: args[0], right: args[0], bottom: args[0], left: args[0] };
  }
  if (args.length === 2) {
    return { top: args[0], right: args[1], bottom: args[0], left: args[1] };
  }
  return { top: args[0], right: args[1], bottom: args[2], left: args[3] };
}

/**
 * Get total padding width
 */
export function getPaddingWidth(padding: Padding): number {
  return padding.left + padding.right;
}

/**
 * Get total padding height
 */
export function getPaddingHeight(padding: Padding): number {
  return padding.top + padding.bottom;
}

/**
 * Generate frame ID
 */
export function generateFrameId(): string {
  return `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if an alignment is a space distribution
 */
export function isSpaceAlignment(alignment: Alignment): boolean {
  return ['space-between', 'space-around', 'space-evenly'].includes(alignment);
}

/**
 * Get CSS flex properties from layout settings
 */
export function getFlexProperties(frame: AutoLayoutFrame): React.CSSProperties {
  const css: React.CSSProperties = {
    display: 'flex',
    flexDirection: frame.direction === 'horizontal' ? 'row' : 'column',
    gap: frame.gap,
    paddingTop: frame.padding.top,
    paddingRight: frame.padding.right,
    paddingBottom: frame.padding.bottom,
    paddingLeft: frame.padding.left
  };

  // Primary axis alignment
  switch (frame.primaryAxisAlignment) {
    case 'start': css.justifyContent = 'flex-start'; break;
    case 'center': css.justifyContent = 'center'; break;
    case 'end': css.justifyContent = 'flex-end'; break;
    case 'space-between': css.justifyContent = 'space-between'; break;
    case 'space-around': css.justifyContent = 'space-around'; break;
    case 'space-evenly': css.justifyContent = 'space-evenly'; break;
  }

  // Cross axis alignment
  switch (frame.crossAxisAlignment) {
    case 'start': css.alignItems = 'flex-start'; break;
    case 'center': css.alignItems = 'center'; break;
    case 'end': css.alignItems = 'flex-end'; break;
    case 'stretch': css.alignItems = 'stretch'; break;
  }

  return css;
}

/**
 * Get breakpoint for a given width
 */
export function getBreakpointForWidth(width: number, breakpoints: Breakpoint[] = DEFAULT_BREAKPOINTS): Breakpoint {
  for (const bp of [...breakpoints].reverse()) {
    if (width >= bp.minWidth) {
      return bp;
    }
  }
  return breakpoints[0];
}
