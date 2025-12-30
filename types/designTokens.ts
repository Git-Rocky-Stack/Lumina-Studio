// ============================================================================
// DESIGN TOKENS SYSTEM - TYPE DEFINITIONS
// ============================================================================

/**
 * Token category
 */
export type TokenCategory =
  | 'colors'
  | 'typography'
  | 'spacing'
  | 'sizing'
  | 'borders'
  | 'shadows'
  | 'effects'
  | 'animations'
  | 'custom';

/**
 * Token value type
 */
export type TokenValueType =
  | 'color'
  | 'dimension'
  | 'number'
  | 'string'
  | 'fontFamily'
  | 'fontWeight'
  | 'duration'
  | 'cubicBezier'
  | 'shadow'
  | 'gradient';

/**
 * Color token value
 */
export interface ColorValue {
  type: 'color';
  value: string; // Hex, RGB, RGBA, HSL
}

/**
 * Dimension token value
 */
export interface DimensionValue {
  type: 'dimension';
  value: number;
  unit: 'px' | 'rem' | 'em' | '%' | 'vw' | 'vh';
}

/**
 * Shadow token value
 */
export interface ShadowValue {
  type: 'shadow';
  value: {
    offsetX: number;
    offsetY: number;
    blur: number;
    spread: number;
    color: string;
    inset?: boolean;
  }[];
}

/**
 * Gradient token value
 */
export interface GradientValue {
  type: 'gradient';
  value: {
    type: 'linear' | 'radial' | 'conic';
    angle?: number;
    stops: { color: string; position: number }[];
  };
}

/**
 * Typography token value
 */
export interface TypographyValue {
  type: 'typography';
  value: {
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
    letterSpacing?: number;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  };
}

/**
 * Duration token value
 */
export interface DurationValue {
  type: 'duration';
  value: number;
  unit: 'ms' | 's';
}

/**
 * Cubic bezier token value
 */
export interface CubicBezierValue {
  type: 'cubicBezier';
  value: [number, number, number, number];
}

/**
 * Generic token value
 */
export type TokenValue =
  | ColorValue
  | DimensionValue
  | ShadowValue
  | GradientValue
  | TypographyValue
  | DurationValue
  | CubicBezierValue
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'fontFamily'; value: string }
  | { type: 'fontWeight'; value: number };

/**
 * Design token definition
 */
export interface DesignToken {
  id: string;
  name: string;
  description?: string;
  category: TokenCategory;
  value: TokenValue;

  // Aliasing
  aliasOf?: string;

  // Metadata
  tags?: string[];
  deprecated?: boolean;
  deprecationMessage?: string;

  // Theming
  modes?: Record<string, TokenValue>; // e.g., { dark: {...}, light: {...} }

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Token group for organization
 */
export interface TokenGroup {
  id: string;
  name: string;
  description?: string;
  category: TokenCategory;
  tokenIds: string[];
  order: number;
}

/**
 * Token collection (design system)
 */
export interface TokenCollection {
  id: string;
  name: string;
  version: string;
  description?: string;
  tokens: Map<string, DesignToken>;
  groups: TokenGroup[];

  // Theme modes
  modes: string[];
  defaultMode: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  author?: string;
}

/**
 * Token reference in elements
 */
export interface TokenReference {
  tokenId: string;
  property: string;
  mode?: string;
}

/**
 * Token export format
 */
export type TokenExportFormat =
  | 'css'
  | 'scss'
  | 'less'
  | 'json'
  | 'js'
  | 'ts'
  | 'figma'
  | 'style-dictionary';

/**
 * Token export options
 */
export interface TokenExportOptions {
  format: TokenExportFormat;
  includeDescriptions?: boolean;
  includeDeprecated?: boolean;
  prefix?: string;
  mode?: string;
  categories?: TokenCategory[];
}

/**
 * Token import result
 */
export interface TokenImportResult {
  success: boolean;
  tokensImported: number;
  errors: string[];
  warnings: string[];
}

/**
 * Token change event
 */
export interface TokenChangeEvent {
  type: 'create' | 'update' | 'delete';
  token: DesignToken;
  previousValue?: TokenValue;
  timestamp: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CATEGORY_INFO: Record<TokenCategory, { label: string; icon: string; color: string }> = {
  colors: { label: 'Colors', icon: 'fa-palette', color: '#f472b6' },
  typography: { label: 'Typography', icon: 'fa-font', color: '#818cf8' },
  spacing: { label: 'Spacing', icon: 'fa-arrows-left-right', color: '#34d399' },
  sizing: { label: 'Sizing', icon: 'fa-ruler', color: '#fbbf24' },
  borders: { label: 'Borders', icon: 'fa-border-all', color: '#60a5fa' },
  shadows: { label: 'Shadows', icon: 'fa-clone', color: '#a78bfa' },
  effects: { label: 'Effects', icon: 'fa-wand-magic-sparkles', color: '#fb7185' },
  animations: { label: 'Animations', icon: 'fa-play', color: '#2dd4bf' },
  custom: { label: 'Custom', icon: 'fa-puzzle-piece', color: '#94a3b8' }
};

export const DEFAULT_COLORS: Omit<DesignToken, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Primary', category: 'colors', value: { type: 'color', value: '#6366f1' }, tags: ['brand'] },
  { name: 'Primary Light', category: 'colors', value: { type: 'color', value: '#818cf8' }, tags: ['brand'] },
  { name: 'Primary Dark', category: 'colors', value: { type: 'color', value: '#4f46e5' }, tags: ['brand'] },
  { name: 'Secondary', category: 'colors', value: { type: 'color', value: '#8b5cf6' }, tags: ['brand'] },
  { name: 'Accent', category: 'colors', value: { type: 'color', value: '#f472b6' }, tags: ['brand'] },
  { name: 'Success', category: 'colors', value: { type: 'color', value: '#22c55e' }, tags: ['semantic'] },
  { name: 'Warning', category: 'colors', value: { type: 'color', value: '#f59e0b' }, tags: ['semantic'] },
  { name: 'Error', category: 'colors', value: { type: 'color', value: '#ef4444' }, tags: ['semantic'] },
  { name: 'Info', category: 'colors', value: { type: 'color', value: '#3b82f6' }, tags: ['semantic'] },
  { name: 'Background', category: 'colors', value: { type: 'color', value: '#0a0a0f' }, tags: ['surface'] },
  { name: 'Surface', category: 'colors', value: { type: 'color', value: '#12121a' }, tags: ['surface'] },
  { name: 'Text Primary', category: 'colors', value: { type: 'color', value: '#ffffff' }, tags: ['text'] },
  { name: 'Text Secondary', category: 'colors', value: { type: 'color', value: '#a0a0b0' }, tags: ['text'] },
  { name: 'Text Muted', category: 'colors', value: { type: 'color', value: '#505060' }, tags: ['text'] }
];

export const DEFAULT_TYPOGRAPHY: Omit<DesignToken, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Heading 1',
    category: 'typography',
    value: {
      type: 'typography',
      value: { fontFamily: 'Inter', fontSize: 48, fontWeight: 700, lineHeight: 1.2 }
    } as TypographyValue,
    tags: ['heading']
  },
  {
    name: 'Heading 2',
    category: 'typography',
    value: {
      type: 'typography',
      value: { fontFamily: 'Inter', fontSize: 36, fontWeight: 700, lineHeight: 1.25 }
    } as TypographyValue,
    tags: ['heading']
  },
  {
    name: 'Heading 3',
    category: 'typography',
    value: {
      type: 'typography',
      value: { fontFamily: 'Inter', fontSize: 28, fontWeight: 600, lineHeight: 1.3 }
    } as TypographyValue,
    tags: ['heading']
  },
  {
    name: 'Body Large',
    category: 'typography',
    value: {
      type: 'typography',
      value: { fontFamily: 'Inter', fontSize: 18, fontWeight: 400, lineHeight: 1.6 }
    } as TypographyValue,
    tags: ['body']
  },
  {
    name: 'Body',
    category: 'typography',
    value: {
      type: 'typography',
      value: { fontFamily: 'Inter', fontSize: 16, fontWeight: 400, lineHeight: 1.5 }
    } as TypographyValue,
    tags: ['body']
  },
  {
    name: 'Body Small',
    category: 'typography',
    value: {
      type: 'typography',
      value: { fontFamily: 'Inter', fontSize: 14, fontWeight: 400, lineHeight: 1.5 }
    } as TypographyValue,
    tags: ['body']
  },
  {
    name: 'Caption',
    category: 'typography',
    value: {
      type: 'typography',
      value: { fontFamily: 'Inter', fontSize: 12, fontWeight: 400, lineHeight: 1.4 }
    } as TypographyValue,
    tags: ['utility']
  },
  {
    name: 'Label',
    category: 'typography',
    value: {
      type: 'typography',
      value: { fontFamily: 'Inter', fontSize: 14, fontWeight: 500, lineHeight: 1.4, textTransform: 'uppercase', letterSpacing: 0.5 }
    } as TypographyValue,
    tags: ['utility']
  }
];

export const DEFAULT_SPACING: Omit<DesignToken, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Space 0', category: 'spacing', value: { type: 'dimension', value: 0, unit: 'px' } },
  { name: 'Space 1', category: 'spacing', value: { type: 'dimension', value: 4, unit: 'px' } },
  { name: 'Space 2', category: 'spacing', value: { type: 'dimension', value: 8, unit: 'px' } },
  { name: 'Space 3', category: 'spacing', value: { type: 'dimension', value: 12, unit: 'px' } },
  { name: 'Space 4', category: 'spacing', value: { type: 'dimension', value: 16, unit: 'px' } },
  { name: 'Space 5', category: 'spacing', value: { type: 'dimension', value: 20, unit: 'px' } },
  { name: 'Space 6', category: 'spacing', value: { type: 'dimension', value: 24, unit: 'px' } },
  { name: 'Space 8', category: 'spacing', value: { type: 'dimension', value: 32, unit: 'px' } },
  { name: 'Space 10', category: 'spacing', value: { type: 'dimension', value: 40, unit: 'px' } },
  { name: 'Space 12', category: 'spacing', value: { type: 'dimension', value: 48, unit: 'px' } },
  { name: 'Space 16', category: 'spacing', value: { type: 'dimension', value: 64, unit: 'px' } }
];

export const DEFAULT_BORDERS: Omit<DesignToken, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Border Radius None', category: 'borders', value: { type: 'dimension', value: 0, unit: 'px' } },
  { name: 'Border Radius SM', category: 'borders', value: { type: 'dimension', value: 4, unit: 'px' } },
  { name: 'Border Radius MD', category: 'borders', value: { type: 'dimension', value: 8, unit: 'px' } },
  { name: 'Border Radius LG', category: 'borders', value: { type: 'dimension', value: 12, unit: 'px' } },
  { name: 'Border Radius XL', category: 'borders', value: { type: 'dimension', value: 16, unit: 'px' } },
  { name: 'Border Radius Full', category: 'borders', value: { type: 'dimension', value: 9999, unit: 'px' } },
  { name: 'Border Width Thin', category: 'borders', value: { type: 'dimension', value: 1, unit: 'px' } },
  { name: 'Border Width Medium', category: 'borders', value: { type: 'dimension', value: 2, unit: 'px' } },
  { name: 'Border Width Thick', category: 'borders', value: { type: 'dimension', value: 4, unit: 'px' } }
];

export const DEFAULT_SHADOWS: Omit<DesignToken, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Shadow SM',
    category: 'shadows',
    value: {
      type: 'shadow',
      value: [{ offsetX: 0, offsetY: 1, blur: 2, spread: 0, color: 'rgba(0,0,0,0.1)' }]
    } as ShadowValue
  },
  {
    name: 'Shadow MD',
    category: 'shadows',
    value: {
      type: 'shadow',
      value: [{ offsetX: 0, offsetY: 4, blur: 6, spread: -1, color: 'rgba(0,0,0,0.15)' }]
    } as ShadowValue
  },
  {
    name: 'Shadow LG',
    category: 'shadows',
    value: {
      type: 'shadow',
      value: [{ offsetX: 0, offsetY: 10, blur: 15, spread: -3, color: 'rgba(0,0,0,0.2)' }]
    } as ShadowValue
  },
  {
    name: 'Shadow XL',
    category: 'shadows',
    value: {
      type: 'shadow',
      value: [{ offsetX: 0, offsetY: 20, blur: 25, spread: -5, color: 'rgba(0,0,0,0.25)' }]
    } as ShadowValue
  },
  {
    name: 'Shadow Glow',
    category: 'shadows',
    value: {
      type: 'shadow',
      value: [{ offsetX: 0, offsetY: 0, blur: 20, spread: 0, color: 'rgba(99,102,241,0.4)' }]
    } as ShadowValue
  }
];

export const DEFAULT_ANIMATIONS: Omit<DesignToken, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Duration Fast', category: 'animations', value: { type: 'duration', value: 150, unit: 'ms' } },
  { name: 'Duration Normal', category: 'animations', value: { type: 'duration', value: 300, unit: 'ms' } },
  { name: 'Duration Slow', category: 'animations', value: { type: 'duration', value: 500, unit: 'ms' } },
  { name: 'Ease Default', category: 'animations', value: { type: 'cubicBezier', value: [0.4, 0, 0.2, 1] } as CubicBezierValue },
  { name: 'Ease In', category: 'animations', value: { type: 'cubicBezier', value: [0.4, 0, 1, 1] } as CubicBezierValue },
  { name: 'Ease Out', category: 'animations', value: { type: 'cubicBezier', value: [0, 0, 0.2, 1] } as CubicBezierValue },
  { name: 'Ease In Out', category: 'animations', value: { type: 'cubicBezier', value: [0.4, 0, 0.2, 1] } as CubicBezierValue },
  { name: 'Spring', category: 'animations', value: { type: 'cubicBezier', value: [0.68, -0.55, 0.265, 1.55] } as CubicBezierValue }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate token ID
 */
export function generateTokenId(): string {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate group ID
 */
export function generateGroupId(): string {
  return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate collection ID
 */
export function generateCollectionId(): string {
  return `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format token value for display
 */
export function formatTokenValue(value: TokenValue): string {
  switch (value.type) {
    case 'color':
      return value.value;
    case 'dimension':
      return `${value.value}${value.unit}`;
    case 'number':
      return String(value.value);
    case 'string':
      return value.value;
    case 'fontFamily':
      return value.value;
    case 'fontWeight':
      return String(value.value);
    case 'duration':
      return `${value.value}${value.unit}`;
    case 'cubicBezier':
      return `cubic-bezier(${value.value.join(', ')})`;
    case 'shadow':
      return value.value.map(s =>
        `${s.inset ? 'inset ' : ''}${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.spread}px ${s.color}`
      ).join(', ');
    case 'gradient':
      const stops = value.value.stops.map(s => `${s.color} ${s.position * 100}%`).join(', ');
      if (value.value.type === 'linear') {
        return `linear-gradient(${value.value.angle || 0}deg, ${stops})`;
      } else if (value.value.type === 'radial') {
        return `radial-gradient(${stops})`;
      } else {
        return `conic-gradient(${stops})`;
      }
    case 'typography':
      return `${value.value.fontFamily} ${value.value.fontWeight} ${value.value.fontSize}px`;
    default:
      return String((value as any).value);
  }
}

/**
 * Convert token to CSS variable name
 */
export function tokenToCssVar(name: string, prefix: string = 'lumina'): string {
  const normalized = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  return `--${prefix}-${normalized}`;
}

/**
 * Convert token value to CSS
 */
export function tokenValueToCss(value: TokenValue): string {
  switch (value.type) {
    case 'color':
      return value.value;
    case 'dimension':
      return `${value.value}${value.unit}`;
    case 'number':
      return String(value.value);
    case 'string':
      return `"${value.value}"`;
    case 'fontFamily':
      return `"${value.value}"`;
    case 'fontWeight':
      return String(value.value);
    case 'duration':
      return `${value.value}${value.unit}`;
    case 'cubicBezier':
      return `cubic-bezier(${value.value.join(', ')})`;
    case 'shadow':
      return value.value.map(s =>
        `${s.inset ? 'inset ' : ''}${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.spread}px ${s.color}`
      ).join(', ');
    case 'gradient':
      return formatTokenValue(value);
    case 'typography':
      return `${value.value.fontWeight} ${value.value.fontSize}px/${value.value.lineHeight} "${value.value.fontFamily}"`;
    default:
      return String((value as any).value);
  }
}

/**
 * Parse color to components
 */
export function parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
  // Hex
  const hexMatch = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
      a: hexMatch[4] ? parseInt(hexMatch[4], 16) / 255 : 1
    };
  }

  // RGB/RGBA
  const rgbMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)$/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
      a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
    };
  }

  return null;
}

/**
 * Check if color is light
 */
export function isLightColor(color: string): boolean {
  const parsed = parseColor(color);
  if (!parsed) return false;

  const luminance = (0.299 * parsed.r + 0.587 * parsed.g + 0.114 * parsed.b) / 255;
  return luminance > 0.5;
}
