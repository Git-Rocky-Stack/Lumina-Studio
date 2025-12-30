// ============================================================================
// ACCESSIBILITY CHECKER SYSTEM - TYPE DEFINITIONS
// ============================================================================

import type { DesignElement } from '../types';

/**
 * Accessibility issue severity
 */
export type IssueSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

/**
 * WCAG conformance level
 */
export type WCAGLevel = 'A' | 'AA' | 'AAA';

/**
 * Issue category
 */
export type IssueCategory =
  | 'contrast'
  | 'text'
  | 'images'
  | 'navigation'
  | 'structure'
  | 'interactive'
  | 'motion'
  | 'color'
  | 'forms';

/**
 * Accessibility issue
 */
export interface AccessibilityIssue {
  id: string;
  elementId: string;
  category: IssueCategory;
  severity: IssueSeverity;
  wcagCriteria: string;
  wcagLevel: WCAGLevel;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  helpUrl?: string;
  autoFixable: boolean;
}

/**
 * Contrast ratio result
 */
export interface ContrastResult {
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  meetsAALarge: boolean;
  meetsAAALarge: boolean;
}

/**
 * Element accessibility info
 */
export interface ElementAccessibility {
  elementId: string;
  elementType: string;
  issues: AccessibilityIssue[];
  passed: string[];
  warnings: string[];
}

/**
 * Scan result
 */
export interface AccessibilityScanResult {
  timestamp: number;
  totalElements: number;
  scannedElements: number;
  issueCount: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  issues: AccessibilityIssue[];
  elementResults: Map<string, ElementAccessibility>;
  score: number; // 0-100
  wcagCompliance: {
    a: boolean;
    aa: boolean;
    aaa: boolean;
  };
}

/**
 * Scan options
 */
export interface AccessibilityScanOptions {
  targetLevel: WCAGLevel;
  includeCategories?: IssueCategory[];
  excludeCategories?: IssueCategory[];
  elementIds?: string[];
}

/**
 * Auto-fix result
 */
export interface AutoFixResult {
  success: boolean;
  issueId: string;
  changes: {
    property: string;
    oldValue: any;
    newValue: any;
  }[];
}

/**
 * Color blindness simulation type
 */
export type ColorBlindnessType =
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'achromatopsia'
  | 'protanomaly'
  | 'deuteranomaly'
  | 'tritanomaly';

/**
 * Simulation options
 */
export interface SimulationOptions {
  type: ColorBlindnessType;
  enabled: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const SEVERITY_INFO: Record<IssueSeverity, { label: string; color: string; icon: string }> = {
  critical: { label: 'Critical', color: '#ef4444', icon: 'fa-circle-xmark' },
  serious: { label: 'Serious', color: '#f97316', icon: 'fa-exclamation-triangle' },
  moderate: { label: 'Moderate', color: '#f59e0b', icon: 'fa-exclamation-circle' },
  minor: { label: 'Minor', color: '#3b82f6', icon: 'fa-info-circle' }
};

export const CATEGORY_INFO: Record<IssueCategory, { label: string; icon: string }> = {
  contrast: { label: 'Contrast', icon: 'fa-circle-half-stroke' },
  text: { label: 'Text', icon: 'fa-font' },
  images: { label: 'Images', icon: 'fa-image' },
  navigation: { label: 'Navigation', icon: 'fa-compass' },
  structure: { label: 'Structure', icon: 'fa-sitemap' },
  interactive: { label: 'Interactive', icon: 'fa-hand-pointer' },
  motion: { label: 'Motion', icon: 'fa-play' },
  color: { label: 'Color', icon: 'fa-palette' },
  forms: { label: 'Forms', icon: 'fa-square-check' }
};

export const COLOR_BLINDNESS_INFO: Record<ColorBlindnessType, { label: string; description: string }> = {
  protanopia: { label: 'Protanopia', description: 'Red-blind (no red cones)' },
  deuteranopia: { label: 'Deuteranopia', description: 'Green-blind (no green cones)' },
  tritanopia: { label: 'Tritanopia', description: 'Blue-blind (no blue cones)' },
  achromatopsia: { label: 'Achromatopsia', description: 'Complete color blindness' },
  protanomaly: { label: 'Protanomaly', description: 'Red-weak (deficient red cones)' },
  deuteranomaly: { label: 'Deuteranomaly', description: 'Green-weak (deficient green cones)' },
  tritanomaly: { label: 'Tritanomaly', description: 'Blue-weak (deficient blue cones)' }
};

export const WCAG_CRITERIA: Record<string, { title: string; level: WCAGLevel; category: IssueCategory }> = {
  '1.1.1': { title: 'Non-text Content', level: 'A', category: 'images' },
  '1.3.1': { title: 'Info and Relationships', level: 'A', category: 'structure' },
  '1.3.2': { title: 'Meaningful Sequence', level: 'A', category: 'structure' },
  '1.3.3': { title: 'Sensory Characteristics', level: 'A', category: 'structure' },
  '1.4.1': { title: 'Use of Color', level: 'A', category: 'color' },
  '1.4.2': { title: 'Audio Control', level: 'A', category: 'motion' },
  '1.4.3': { title: 'Contrast (Minimum)', level: 'AA', category: 'contrast' },
  '1.4.4': { title: 'Resize Text', level: 'AA', category: 'text' },
  '1.4.5': { title: 'Images of Text', level: 'AA', category: 'images' },
  '1.4.6': { title: 'Contrast (Enhanced)', level: 'AAA', category: 'contrast' },
  '1.4.10': { title: 'Reflow', level: 'AA', category: 'structure' },
  '1.4.11': { title: 'Non-text Contrast', level: 'AA', category: 'contrast' },
  '1.4.12': { title: 'Text Spacing', level: 'AA', category: 'text' },
  '2.1.1': { title: 'Keyboard', level: 'A', category: 'navigation' },
  '2.1.2': { title: 'No Keyboard Trap', level: 'A', category: 'navigation' },
  '2.2.1': { title: 'Timing Adjustable', level: 'A', category: 'motion' },
  '2.2.2': { title: 'Pause, Stop, Hide', level: 'A', category: 'motion' },
  '2.3.1': { title: 'Three Flashes', level: 'A', category: 'motion' },
  '2.4.1': { title: 'Bypass Blocks', level: 'A', category: 'navigation' },
  '2.4.2': { title: 'Page Titled', level: 'A', category: 'structure' },
  '2.4.3': { title: 'Focus Order', level: 'A', category: 'navigation' },
  '2.4.4': { title: 'Link Purpose (In Context)', level: 'A', category: 'navigation' },
  '2.4.6': { title: 'Headings and Labels', level: 'AA', category: 'structure' },
  '2.4.7': { title: 'Focus Visible', level: 'AA', category: 'navigation' },
  '3.1.1': { title: 'Language of Page', level: 'A', category: 'structure' },
  '3.2.1': { title: 'On Focus', level: 'A', category: 'interactive' },
  '3.2.2': { title: 'On Input', level: 'A', category: 'interactive' },
  '3.3.1': { title: 'Error Identification', level: 'A', category: 'forms' },
  '3.3.2': { title: 'Labels or Instructions', level: 'A', category: 'forms' },
  '4.1.1': { title: 'Parsing', level: 'A', category: 'structure' },
  '4.1.2': { title: 'Name, Role, Value', level: 'A', category: 'interactive' }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate issue ID
 */
export function generateIssueId(): string {
  return `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate contrast ratio between two colors
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const toLinear = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check contrast against WCAG criteria
 */
export function checkContrast(ratio: number): ContrastResult {
  return {
    ratio: Math.round(ratio * 100) / 100,
    meetsAA: ratio >= 4.5,
    meetsAAA: ratio >= 7,
    meetsAALarge: ratio >= 3,
    meetsAAALarge: ratio >= 4.5
  };
}

/**
 * Get severity based on contrast ratio
 */
export function getContrastSeverity(ratio: number, isLargeText: boolean): IssueSeverity {
  const threshold = isLargeText ? 3 : 4.5;

  if (ratio < threshold * 0.5) return 'critical';
  if (ratio < threshold * 0.75) return 'serious';
  if (ratio < threshold) return 'moderate';
  return 'minor';
}

/**
 * Simulate color blindness
 */
export function simulateColorBlindness(color: string, type: ColorBlindnessType): string {
  const hex = color.replace('#', '');
  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);

  // Color blindness simulation matrices
  const matrices: Record<ColorBlindnessType, number[][]> = {
    protanopia: [
      [0.567, 0.433, 0],
      [0.558, 0.442, 0],
      [0, 0.242, 0.758]
    ],
    deuteranopia: [
      [0.625, 0.375, 0],
      [0.7, 0.3, 0],
      [0, 0.3, 0.7]
    ],
    tritanopia: [
      [0.95, 0.05, 0],
      [0, 0.433, 0.567],
      [0, 0.475, 0.525]
    ],
    achromatopsia: [
      [0.299, 0.587, 0.114],
      [0.299, 0.587, 0.114],
      [0.299, 0.587, 0.114]
    ],
    protanomaly: [
      [0.817, 0.183, 0],
      [0.333, 0.667, 0],
      [0, 0.125, 0.875]
    ],
    deuteranomaly: [
      [0.8, 0.2, 0],
      [0.258, 0.742, 0],
      [0, 0.142, 0.858]
    ],
    tritanomaly: [
      [0.967, 0.033, 0],
      [0, 0.733, 0.267],
      [0, 0.183, 0.817]
    ]
  };

  const matrix = matrices[type];

  const newR = Math.round(matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b);
  const newG = Math.round(matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b);
  const newB = Math.round(matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b);

  const clamp = (v: number) => Math.max(0, Math.min(255, v));

  return `#${clamp(newR).toString(16).padStart(2, '0')}${clamp(newG).toString(16).padStart(2, '0')}${clamp(newB).toString(16).padStart(2, '0')}`;
}

/**
 * Check if text size is considered "large" for WCAG
 */
export function isLargeText(fontSize: number, isBold: boolean = false): boolean {
  // Large text: 18pt (24px) or 14pt bold (18.67px)
  if (isBold) {
    return fontSize >= 18.67;
  }
  return fontSize >= 24;
}

/**
 * Calculate accessibility score
 */
export function calculateAccessibilityScore(issues: AccessibilityIssue[]): number {
  if (issues.length === 0) return 100;

  const weights: Record<IssueSeverity, number> = {
    critical: 25,
    serious: 15,
    moderate: 8,
    minor: 3
  };

  const totalDeduction = issues.reduce((sum, issue) => sum + weights[issue.severity], 0);
  return Math.max(0, 100 - totalDeduction);
}

/**
 * Format WCAG criteria for display
 */
export function formatWcagCriteria(criteria: string): string {
  const info = WCAG_CRITERIA[criteria];
  if (!info) return criteria;
  return `${criteria} ${info.title} (Level ${info.level})`;
}

/**
 * Get recommendation based on issue type
 */
export function getRecommendation(category: IssueCategory, issue: string): string {
  const recommendations: Record<IssueCategory, Record<string, string>> = {
    contrast: {
      low: 'Increase the contrast ratio to at least 4.5:1 for normal text or 3:1 for large text.',
      'very-low': 'The contrast is critically low. Choose colors with higher contrast for readability.'
    },
    text: {
      'small-text': 'Consider using a larger font size for better readability.',
      'tight-spacing': 'Increase letter or line spacing to improve readability.'
    },
    images: {
      'missing-alt': 'Add descriptive alt text to convey the image\'s purpose.',
      'decorative': 'Mark decorative images with empty alt="" attribute.'
    },
    navigation: {
      'focus-visible': 'Ensure focus indicators are visible for keyboard navigation.',
      'focus-order': 'Review the tab order to ensure logical navigation flow.'
    },
    structure: {
      'heading-order': 'Use headings in sequential order without skipping levels.',
      'landmark': 'Add appropriate landmark regions for screen reader navigation.'
    },
    interactive: {
      'target-size': 'Increase touch target size to at least 44x44 pixels.',
      'state': 'Ensure interactive elements communicate their state.'
    },
    motion: {
      'animation': 'Provide controls to pause or reduce motion.',
      'autoplay': 'Avoid auto-playing content or provide controls.'
    },
    color: {
      'color-only': 'Don\'t rely on color alone to convey information.',
      'indication': 'Use additional visual cues like icons or patterns.'
    },
    forms: {
      'label': 'Associate labels with form inputs.',
      'error': 'Provide clear error messages and suggestions.'
    }
  };

  return recommendations[category]?.[issue] || 'Review and address this accessibility concern.';
}
