// ============================================================================
// DESIGN HANDOFF SYSTEM - TYPE DEFINITIONS
// ============================================================================

import type { DesignElement } from '../types';

/**
 * Code generation target
 */
export type CodeTarget = 'react' | 'vue' | 'html' | 'swift' | 'flutter';

/**
 * Style output format
 */
export type StyleFormat = 'css' | 'scss' | 'tailwind' | 'styled-components' | 'css-modules';

/**
 * Design token type
 */
export type TokenType = 'color' | 'spacing' | 'typography' | 'shadow' | 'border' | 'radius';

/**
 * Measurement unit
 */
export type MeasurementUnit = 'px' | 'rem' | 'em' | '%' | 'vw' | 'vh';

/**
 * Design specification for an element
 */
export interface ElementSpec {
  elementId: string;
  name: string;
  type: string;

  // Position & Size
  position: {
    x: number;
    y: number;
    unit: MeasurementUnit;
  };
  size: {
    width: number;
    height: number;
    unit: MeasurementUnit;
  };

  // Spacing
  spacing: {
    margin?: { top: number; right: number; bottom: number; left: number };
    padding?: { top: number; right: number; bottom: number; left: number };
  };

  // Typography (for text elements)
  typography?: {
    fontFamily: string;
    fontSize: number;
    fontWeight: number | string;
    lineHeight: number | string;
    letterSpacing: number;
    textAlign: string;
    color: string;
  };

  // Visual
  background?: {
    color?: string;
    gradient?: string;
    image?: string;
  };
  border?: {
    width: number;
    style: string;
    color: string;
    radius: number | { tl: number; tr: number; br: number; bl: number };
  };
  shadow?: {
    x: number;
    y: number;
    blur: number;
    spread: number;
    color: string;
    inset?: boolean;
  }[];

  // Transform
  transform?: {
    rotation: number;
    scaleX: number;
    scaleY: number;
    skewX: number;
    skewY: number;
  };

  // Effects
  opacity?: number;
  blendMode?: string;
  filter?: string;

  // Constraints
  constraints?: {
    horizontal: string;
    vertical: string;
  };
}

/**
 * Design token
 */
export interface DesignToken {
  id: string;
  name: string;
  type: TokenType;
  value: string | number;
  rawValue: any;
  description?: string;
  category?: string;
}

/**
 * Color palette entry
 */
export interface ColorEntry {
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  usage: string[];
  count: number;
}

/**
 * Typography style
 */
export interface TypographyStyle {
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  lineHeight: number | string;
  letterSpacing: number;
  usage: string[];
}

/**
 * Spacing value
 */
export interface SpacingValue {
  name: string;
  value: number;
  usage: string[];
}

/**
 * Generated code output
 */
export interface GeneratedCode {
  target: CodeTarget;
  styleFormat: StyleFormat;
  component: string;
  styles: string;
  imports?: string;
  exports?: string;
  preview?: string;
}

/**
 * Asset export configuration
 */
export interface AssetExportConfig {
  elementId: string;
  name: string;
  format: 'png' | 'svg' | 'jpg' | 'webp' | 'pdf';
  scale: number;
  suffix?: string;
  backgroundColor?: string;
}

/**
 * Handoff package
 */
export interface HandoffPackage {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;

  // Specs
  elements: ElementSpec[];
  tokens: DesignToken[];

  // Extracted styles
  colors: ColorEntry[];
  typography: TypographyStyle[];
  spacing: SpacingValue[];

  // Generated code
  code?: GeneratedCode[];

  // Assets
  assets?: AssetExportConfig[];

  // Metadata
  canvasSize: { width: number; height: number };
  totalElements: number;
}

/**
 * Measurement overlay data
 */
export interface MeasurementOverlay {
  sourceId: string;
  targetId?: string;
  type: 'horizontal' | 'vertical' | 'diagonal';
  value: number;
  unit: MeasurementUnit;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
}

/**
 * Handoff view mode
 */
export type HandoffViewMode = 'specs' | 'code' | 'assets' | 'tokens' | 'compare';

/**
 * Code snippet
 */
export interface CodeSnippet {
  language: string;
  label: string;
  code: string;
  icon: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CODE_TARGETS: { id: CodeTarget; name: string; icon: string }[] = [
  { id: 'react', name: 'React', icon: 'fa-react' },
  { id: 'vue', name: 'Vue', icon: 'fa-vuejs' },
  { id: 'html', name: 'HTML', icon: 'fa-html5' },
  { id: 'swift', name: 'SwiftUI', icon: 'fa-swift' },
  { id: 'flutter', name: 'Flutter', icon: 'fa-mobile' }
];

export const STYLE_FORMATS: { id: StyleFormat; name: string }[] = [
  { id: 'css', name: 'CSS' },
  { id: 'scss', name: 'SCSS' },
  { id: 'tailwind', name: 'Tailwind CSS' },
  { id: 'styled-components', name: 'Styled Components' },
  { id: 'css-modules', name: 'CSS Modules' }
];

export const EXPORT_SCALES = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
  { value: 4, label: '4x' }
];

export const EXPORT_FORMATS: { id: string; name: string; icon: string }[] = [
  { id: 'png', name: 'PNG', icon: 'fa-image' },
  { id: 'svg', name: 'SVG', icon: 'fa-bezier-curve' },
  { id: 'jpg', name: 'JPG', icon: 'fa-file-image' },
  { id: 'webp', name: 'WebP', icon: 'fa-globe' },
  { id: 'pdf', name: 'PDF', icon: 'fa-file-pdf' }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate handoff package ID
 */
export function generateHandoffId(): string {
  return `handoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Format CSS value with unit
 */
export function formatCssValue(value: number, unit: MeasurementUnit = 'px'): string {
  if (unit === 'px' && value === 0) return '0';
  return `${value}${unit}`;
}

/**
 * Convert px to rem
 */
export function pxToRem(px: number, base: number = 16): number {
  return Math.round((px / base) * 1000) / 1000;
}

/**
 * Generate CSS variable name
 */
export function toCssVariable(name: string): string {
  return `--${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/**
 * Generate camelCase name
 */
export function toCamelCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

/**
 * Generate PascalCase name
 */
export function toPascalCase(name: string): string {
  const camel = toCamelCase(name);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Get contrast color (black or white) for a background
 */
export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
