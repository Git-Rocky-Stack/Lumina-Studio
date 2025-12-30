// ============================================================================
// SMART GUIDES SYSTEM - TYPE DEFINITIONS
// ============================================================================

import type { DesignElement } from '../types';

/**
 * Guide type
 */
export type GuideType =
  | 'edge'        // Edge alignment (left, right, top, bottom)
  | 'center'      // Center alignment (horizontal, vertical)
  | 'spacing'     // Equal spacing between elements
  | 'size'        // Same size indicators
  | 'grid'        // Grid snapping
  | 'custom';     // User-defined guides

/**
 * Guide orientation
 */
export type GuideOrientation = 'horizontal' | 'vertical';

/**
 * Snap point on an element
 */
export interface SnapPoint {
  x: number;
  y: number;
  type: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY';
  elementId: string;
}

/**
 * Smart guide line
 */
export interface SmartGuide {
  id: string;
  type: GuideType;
  orientation: GuideOrientation;
  position: number;
  start: number;
  end: number;
  sourceElementId: string;
  targetElementIds: string[];
  label?: string;
  distance?: number;
}

/**
 * Spacing indicator
 */
export interface SpacingIndicator {
  id: string;
  orientation: GuideOrientation;
  value: number;
  position: { x: number; y: number };
  length: number;
  elements: [string, string];
}

/**
 * Size match indicator
 */
export interface SizeIndicator {
  id: string;
  dimension: 'width' | 'height';
  value: number;
  elements: string[];
}

/**
 * Custom ruler guide
 */
export interface RulerGuide {
  id: string;
  orientation: GuideOrientation;
  position: number;
  color?: string;
  locked: boolean;
}

/**
 * Snap result
 */
export interface SnapResult {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
  guides: SmartGuide[];
  spacingIndicators: SpacingIndicator[];
}

/**
 * Smart guides settings
 */
export interface SmartGuidesSettings {
  enabled: boolean;
  snapThreshold: number; // pixels
  showEdgeGuides: boolean;
  showCenterGuides: boolean;
  showSpacingGuides: boolean;
  showSizeMatches: boolean;
  showDistances: boolean;
  snapToGrid: boolean;
  gridSize: number;
  snapToObjects: boolean;
  snapToCanvas: boolean;
  guideColor: string;
  spacingColor: string;
}

/**
 * Alignment operation
 */
export type AlignmentType =
  | 'left'
  | 'centerX'
  | 'right'
  | 'top'
  | 'centerY'
  | 'bottom';

/**
 * Distribution operation
 */
export type DistributionType =
  | 'horizontal'
  | 'vertical';

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_SETTINGS: SmartGuidesSettings = {
  enabled: true,
  snapThreshold: 8,
  showEdgeGuides: true,
  showCenterGuides: true,
  showSpacingGuides: true,
  showSizeMatches: true,
  showDistances: true,
  snapToGrid: false,
  gridSize: 10,
  snapToObjects: true,
  snapToCanvas: true,
  guideColor: '#6366f1',
  spacingColor: '#22c55e'
};

export const ALIGNMENT_INFO: Record<AlignmentType, { label: string; icon: string }> = {
  left: { label: 'Align Left', icon: 'fa-align-left' },
  centerX: { label: 'Align Center Horizontal', icon: 'fa-align-center' },
  right: { label: 'Align Right', icon: 'fa-align-right' },
  top: { label: 'Align Top', icon: 'fa-arrow-up' },
  centerY: { label: 'Align Center Vertical', icon: 'fa-arrows-up-down' },
  bottom: { label: 'Align Bottom', icon: 'fa-arrow-down' }
};

export const DISTRIBUTION_INFO: Record<DistributionType, { label: string; icon: string }> = {
  horizontal: { label: 'Distribute Horizontally', icon: 'fa-arrows-left-right' },
  vertical: { label: 'Distribute Vertically', icon: 'fa-arrows-up-down' }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate guide ID
 */
export function generateGuideId(): string {
  return `guide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get element bounds
 */
export function getElementBounds(element: DesignElement): {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
} {
  return {
    left: element.x,
    right: element.x + element.width,
    top: element.y,
    bottom: element.y + element.height,
    centerX: element.x + element.width / 2,
    centerY: element.y + element.height / 2,
    width: element.width,
    height: element.height
  };
}

/**
 * Get snap points for an element
 */
export function getSnapPoints(element: DesignElement): SnapPoint[] {
  const bounds = getElementBounds(element);

  return [
    { x: bounds.left, y: bounds.centerY, type: 'left', elementId: element.id },
    { x: bounds.right, y: bounds.centerY, type: 'right', elementId: element.id },
    { x: bounds.centerX, y: bounds.top, type: 'top', elementId: element.id },
    { x: bounds.centerX, y: bounds.bottom, type: 'bottom', elementId: element.id },
    { x: bounds.centerX, y: bounds.centerY, type: 'centerX', elementId: element.id },
    { x: bounds.centerX, y: bounds.centerY, type: 'centerY', elementId: element.id }
  ];
}

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Check if two values are close enough to snap
 */
export function shouldSnap(value1: number, value2: number, threshold: number): boolean {
  return Math.abs(value1 - value2) <= threshold;
}

/**
 * Snap value to grid
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Calculate spacing between elements
 */
export function calculateSpacing(
  elements: DesignElement[],
  orientation: GuideOrientation
): { spacing: number; pairs: [DesignElement, DesignElement][] } {
  if (elements.length < 2) {
    return { spacing: 0, pairs: [] };
  }

  const sorted = [...elements].sort((a, b) => {
    if (orientation === 'horizontal') {
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  const pairs: [DesignElement, DesignElement][] = [];
  const spacings: number[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const el1 = sorted[i];
    const el2 = sorted[i + 1];

    let spacing: number;
    if (orientation === 'horizontal') {
      spacing = el2.x - (el1.x + el1.width);
    } else {
      spacing = el2.y - (el1.y + el1.height);
    }

    spacings.push(spacing);
    pairs.push([el1, el2]);
  }

  // Find most common spacing (mode)
  const spacingCounts = new Map<number, number>();
  spacings.forEach(s => {
    const rounded = Math.round(s);
    spacingCounts.set(rounded, (spacingCounts.get(rounded) || 0) + 1);
  });

  let maxCount = 0;
  let commonSpacing = 0;
  spacingCounts.forEach((count, spacing) => {
    if (count > maxCount) {
      maxCount = count;
      commonSpacing = spacing;
    }
  });

  return { spacing: commonSpacing, pairs };
}

/**
 * Find elements with matching dimensions
 */
export function findSizeMatches(
  elements: DesignElement[],
  dimension: 'width' | 'height',
  tolerance: number = 1
): Map<number, DesignElement[]> {
  const sizeGroups = new Map<number, DesignElement[]>();

  elements.forEach(element => {
    const size = Math.round(element[dimension]);
    let matched = false;

    sizeGroups.forEach((group, groupSize) => {
      if (Math.abs(size - groupSize) <= tolerance) {
        group.push(element);
        matched = true;
      }
    });

    if (!matched) {
      sizeGroups.set(size, [element]);
    }
  });

  // Filter to only groups with multiple elements
  const result = new Map<number, DesignElement[]>();
  sizeGroups.forEach((group, size) => {
    if (group.length > 1) {
      result.set(size, group);
    }
  });

  return result;
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number): string {
  if (Number.isInteger(distance)) {
    return `${distance}px`;
  }
  return `${distance.toFixed(1)}px`;
}
