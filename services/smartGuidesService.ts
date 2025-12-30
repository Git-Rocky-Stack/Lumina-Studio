// ============================================================================
// SMART GUIDES SERVICE
// ============================================================================

import {
  generateGuideId,
  getElementBounds,
  getSnapPoints,
  shouldSnap,
  snapToGrid,
  calculateSpacing,
  findSizeMatches,
  DEFAULT_SETTINGS
} from '../types/smartGuides';
import type {
  SmartGuide,
  SpacingIndicator,
  SizeIndicator,
  RulerGuide,
  SnapResult,
  SmartGuidesSettings,
  AlignmentType,
  DistributionType,
  GuideOrientation
} from '../types/smartGuides';
import type { DesignElement } from '../types';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  SETTINGS: 'lumina_smart_guides_settings',
  RULER_GUIDES: 'lumina_ruler_guides'
};

// ============================================================================
// SMART GUIDES MANAGER
// ============================================================================

class SmartGuidesManager {
  private settings: SmartGuidesSettings;
  private rulerGuides: RulerGuide[] = [];
  private activeGuides: SmartGuide[] = [];
  private activeSpacingIndicators: SpacingIndicator[] = [];
  private activeSizeIndicators: SizeIndicator[] = [];

  // Canvas dimensions
  private canvasWidth: number = 1920;
  private canvasHeight: number = 1080;

  // Callbacks
  private onGuidesUpdate: ((guides: SmartGuide[], spacing: SpacingIndicator[]) => void) | null = null;

  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.loadFromStorage();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private loadFromStorage(): void {
    try {
      const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const guidesJson = localStorage.getItem(STORAGE_KEYS.RULER_GUIDES);

      if (settingsJson) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
      }

      if (guidesJson) {
        this.rulerGuides = JSON.parse(guidesJson);
      }
    } catch (error) {
      console.error('Failed to load smart guides settings:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      localStorage.setItem(STORAGE_KEYS.RULER_GUIDES, JSON.stringify(this.rulerGuides));
    } catch (error) {
      console.error('Failed to save smart guides settings:', error);
    }
  }

  // ============================================================================
  // CANVAS SETUP
  // ============================================================================

  /**
   * Set canvas dimensions
   */
  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  // ============================================================================
  // SNAPPING
  // ============================================================================

  /**
   * Calculate snap position for a moving element
   */
  calculateSnap(
    movingElement: DesignElement,
    otherElements: DesignElement[],
    deltaX: number,
    deltaY: number
  ): SnapResult {
    if (!this.settings.enabled) {
      return {
        x: movingElement.x + deltaX,
        y: movingElement.y + deltaY,
        snappedX: false,
        snappedY: false,
        guides: [],
        spacingIndicators: []
      };
    }

    const newX = movingElement.x + deltaX;
    const newY = movingElement.y + deltaY;
    const threshold = this.settings.snapThreshold;

    let snappedX = newX;
    let snappedY = newY;
    let didSnapX = false;
    let didSnapY = false;

    const guides: SmartGuide[] = [];
    const spacingIndicators: SpacingIndicator[] = [];

    // Calculate moving element bounds at new position
    const movingBounds = {
      left: newX,
      right: newX + movingElement.width,
      top: newY,
      bottom: newY + movingElement.height,
      centerX: newX + movingElement.width / 2,
      centerY: newY + movingElement.height / 2
    };

    // Snap to grid
    if (this.settings.snapToGrid) {
      const gridX = snapToGrid(newX, this.settings.gridSize);
      const gridY = snapToGrid(newY, this.settings.gridSize);

      if (shouldSnap(newX, gridX, threshold)) {
        snappedX = gridX;
        didSnapX = true;
      }

      if (shouldSnap(newY, gridY, threshold)) {
        snappedY = gridY;
        didSnapY = true;
      }
    }

    // Snap to canvas edges
    if (this.settings.snapToCanvas) {
      // Left edge
      if (shouldSnap(movingBounds.left, 0, threshold)) {
        snappedX = 0;
        didSnapX = true;
        guides.push(this.createGuide('edge', 'vertical', 0, 0, this.canvasHeight, movingElement.id));
      }

      // Right edge
      if (shouldSnap(movingBounds.right, this.canvasWidth, threshold)) {
        snappedX = this.canvasWidth - movingElement.width;
        didSnapX = true;
        guides.push(this.createGuide('edge', 'vertical', this.canvasWidth, 0, this.canvasHeight, movingElement.id));
      }

      // Top edge
      if (shouldSnap(movingBounds.top, 0, threshold)) {
        snappedY = 0;
        didSnapY = true;
        guides.push(this.createGuide('edge', 'horizontal', 0, 0, this.canvasWidth, movingElement.id));
      }

      // Bottom edge
      if (shouldSnap(movingBounds.bottom, this.canvasHeight, threshold)) {
        snappedY = this.canvasHeight - movingElement.height;
        didSnapY = true;
        guides.push(this.createGuide('edge', 'horizontal', this.canvasHeight, 0, this.canvasWidth, movingElement.id));
      }

      // Canvas center
      if (this.settings.showCenterGuides) {
        const canvasCenterX = this.canvasWidth / 2;
        const canvasCenterY = this.canvasHeight / 2;

        if (shouldSnap(movingBounds.centerX, canvasCenterX, threshold)) {
          snappedX = canvasCenterX - movingElement.width / 2;
          didSnapX = true;
          guides.push(this.createGuide('center', 'vertical', canvasCenterX, 0, this.canvasHeight, movingElement.id));
        }

        if (shouldSnap(movingBounds.centerY, canvasCenterY, threshold)) {
          snappedY = canvasCenterY - movingElement.height / 2;
          didSnapY = true;
          guides.push(this.createGuide('center', 'horizontal', canvasCenterY, 0, this.canvasWidth, movingElement.id));
        }
      }
    }

    // Snap to other elements
    if (this.settings.snapToObjects) {
      for (const element of otherElements) {
        if (element.id === movingElement.id) continue;

        const targetBounds = getElementBounds(element);

        // Horizontal alignment (X position)
        if (this.settings.showEdgeGuides) {
          // Left to left
          if (!didSnapX && shouldSnap(movingBounds.left, targetBounds.left, threshold)) {
            snappedX = targetBounds.left;
            didSnapX = true;
            guides.push(this.createGuide('edge', 'vertical', targetBounds.left,
              Math.min(movingBounds.top, targetBounds.top),
              Math.max(movingBounds.bottom, targetBounds.bottom),
              movingElement.id, [element.id]));
          }

          // Right to right
          if (!didSnapX && shouldSnap(movingBounds.right, targetBounds.right, threshold)) {
            snappedX = targetBounds.right - movingElement.width;
            didSnapX = true;
            guides.push(this.createGuide('edge', 'vertical', targetBounds.right,
              Math.min(movingBounds.top, targetBounds.top),
              Math.max(movingBounds.bottom, targetBounds.bottom),
              movingElement.id, [element.id]));
          }

          // Left to right
          if (!didSnapX && shouldSnap(movingBounds.left, targetBounds.right, threshold)) {
            snappedX = targetBounds.right;
            didSnapX = true;
            guides.push(this.createGuide('edge', 'vertical', targetBounds.right,
              Math.min(movingBounds.top, targetBounds.top),
              Math.max(movingBounds.bottom, targetBounds.bottom),
              movingElement.id, [element.id]));
          }

          // Right to left
          if (!didSnapX && shouldSnap(movingBounds.right, targetBounds.left, threshold)) {
            snappedX = targetBounds.left - movingElement.width;
            didSnapX = true;
            guides.push(this.createGuide('edge', 'vertical', targetBounds.left,
              Math.min(movingBounds.top, targetBounds.top),
              Math.max(movingBounds.bottom, targetBounds.bottom),
              movingElement.id, [element.id]));
          }
        }

        // Center to center (X)
        if (this.settings.showCenterGuides && !didSnapX) {
          if (shouldSnap(movingBounds.centerX, targetBounds.centerX, threshold)) {
            snappedX = targetBounds.centerX - movingElement.width / 2;
            didSnapX = true;
            guides.push(this.createGuide('center', 'vertical', targetBounds.centerX,
              Math.min(movingBounds.top, targetBounds.top),
              Math.max(movingBounds.bottom, targetBounds.bottom),
              movingElement.id, [element.id]));
          }
        }

        // Vertical alignment (Y position)
        if (this.settings.showEdgeGuides) {
          // Top to top
          if (!didSnapY && shouldSnap(movingBounds.top, targetBounds.top, threshold)) {
            snappedY = targetBounds.top;
            didSnapY = true;
            guides.push(this.createGuide('edge', 'horizontal', targetBounds.top,
              Math.min(movingBounds.left, targetBounds.left),
              Math.max(movingBounds.right, targetBounds.right),
              movingElement.id, [element.id]));
          }

          // Bottom to bottom
          if (!didSnapY && shouldSnap(movingBounds.bottom, targetBounds.bottom, threshold)) {
            snappedY = targetBounds.bottom - movingElement.height;
            didSnapY = true;
            guides.push(this.createGuide('edge', 'horizontal', targetBounds.bottom,
              Math.min(movingBounds.left, targetBounds.left),
              Math.max(movingBounds.right, targetBounds.right),
              movingElement.id, [element.id]));
          }

          // Top to bottom
          if (!didSnapY && shouldSnap(movingBounds.top, targetBounds.bottom, threshold)) {
            snappedY = targetBounds.bottom;
            didSnapY = true;
            guides.push(this.createGuide('edge', 'horizontal', targetBounds.bottom,
              Math.min(movingBounds.left, targetBounds.left),
              Math.max(movingBounds.right, targetBounds.right),
              movingElement.id, [element.id]));
          }

          // Bottom to top
          if (!didSnapY && shouldSnap(movingBounds.bottom, targetBounds.top, threshold)) {
            snappedY = targetBounds.top - movingElement.height;
            didSnapY = true;
            guides.push(this.createGuide('edge', 'horizontal', targetBounds.top,
              Math.min(movingBounds.left, targetBounds.left),
              Math.max(movingBounds.right, targetBounds.right),
              movingElement.id, [element.id]));
          }
        }

        // Center to center (Y)
        if (this.settings.showCenterGuides && !didSnapY) {
          if (shouldSnap(movingBounds.centerY, targetBounds.centerY, threshold)) {
            snappedY = targetBounds.centerY - movingElement.height / 2;
            didSnapY = true;
            guides.push(this.createGuide('center', 'horizontal', targetBounds.centerY,
              Math.min(movingBounds.left, targetBounds.left),
              Math.max(movingBounds.right, targetBounds.right),
              movingElement.id, [element.id]));
          }
        }
      }
    }

    // Snap to ruler guides
    for (const guide of this.rulerGuides) {
      if (guide.orientation === 'vertical') {
        if (!didSnapX && shouldSnap(movingBounds.left, guide.position, threshold)) {
          snappedX = guide.position;
          didSnapX = true;
        } else if (!didSnapX && shouldSnap(movingBounds.right, guide.position, threshold)) {
          snappedX = guide.position - movingElement.width;
          didSnapX = true;
        } else if (!didSnapX && shouldSnap(movingBounds.centerX, guide.position, threshold)) {
          snappedX = guide.position - movingElement.width / 2;
          didSnapX = true;
        }
      } else {
        if (!didSnapY && shouldSnap(movingBounds.top, guide.position, threshold)) {
          snappedY = guide.position;
          didSnapY = true;
        } else if (!didSnapY && shouldSnap(movingBounds.bottom, guide.position, threshold)) {
          snappedY = guide.position - movingElement.height;
          didSnapY = true;
        } else if (!didSnapY && shouldSnap(movingBounds.centerY, guide.position, threshold)) {
          snappedY = guide.position - movingElement.height / 2;
          didSnapY = true;
        }
      }
    }

    // Calculate spacing indicators
    if (this.settings.showSpacingGuides) {
      const allElements = [...otherElements, { ...movingElement, x: snappedX, y: snappedY }];
      const hSpacing = calculateSpacing(allElements, 'horizontal');
      const vSpacing = calculateSpacing(allElements, 'vertical');

      if (hSpacing.spacing > 0) {
        hSpacing.pairs.forEach(([el1, el2]) => {
          spacingIndicators.push({
            id: generateGuideId(),
            orientation: 'horizontal',
            value: hSpacing.spacing,
            position: {
              x: el1.x + el1.width,
              y: Math.min(el1.y, el2.y) + Math.abs(el1.y - el2.y) / 2
            },
            length: hSpacing.spacing,
            elements: [el1.id, el2.id]
          });
        });
      }
    }

    this.activeGuides = guides;
    this.activeSpacingIndicators = spacingIndicators;
    this.onGuidesUpdate?.(guides, spacingIndicators);

    return {
      x: snappedX,
      y: snappedY,
      snappedX: didSnapX,
      snappedY: didSnapY,
      guides,
      spacingIndicators
    };
  }

  /**
   * Create a guide object
   */
  private createGuide(
    type: 'edge' | 'center' | 'spacing',
    orientation: GuideOrientation,
    position: number,
    start: number,
    end: number,
    sourceId: string,
    targetIds: string[] = []
  ): SmartGuide {
    return {
      id: generateGuideId(),
      type,
      orientation,
      position,
      start,
      end,
      sourceElementId: sourceId,
      targetElementIds: targetIds
    };
  }

  /**
   * Clear active guides
   */
  clearGuides(): void {
    this.activeGuides = [];
    this.activeSpacingIndicators = [];
    this.onGuidesUpdate?.([], []);
  }

  // ============================================================================
  // ALIGNMENT OPERATIONS
  // ============================================================================

  /**
   * Align elements
   */
  alignElements(
    elements: DesignElement[],
    alignment: AlignmentType
  ): Map<string, { x: number; y: number }> {
    const updates = new Map<string, { x: number; y: number }>();

    if (elements.length < 2) return updates;

    let targetValue: number;

    switch (alignment) {
      case 'left':
        targetValue = Math.min(...elements.map(el => el.x));
        elements.forEach(el => updates.set(el.id, { x: targetValue, y: el.y }));
        break;

      case 'right':
        targetValue = Math.max(...elements.map(el => el.x + el.width));
        elements.forEach(el => updates.set(el.id, { x: targetValue - el.width, y: el.y }));
        break;

      case 'centerX':
        const minX = Math.min(...elements.map(el => el.x));
        const maxX = Math.max(...elements.map(el => el.x + el.width));
        targetValue = (minX + maxX) / 2;
        elements.forEach(el => updates.set(el.id, { x: targetValue - el.width / 2, y: el.y }));
        break;

      case 'top':
        targetValue = Math.min(...elements.map(el => el.y));
        elements.forEach(el => updates.set(el.id, { x: el.x, y: targetValue }));
        break;

      case 'bottom':
        targetValue = Math.max(...elements.map(el => el.y + el.height));
        elements.forEach(el => updates.set(el.id, { x: el.x, y: targetValue - el.height }));
        break;

      case 'centerY':
        const minY = Math.min(...elements.map(el => el.y));
        const maxY = Math.max(...elements.map(el => el.y + el.height));
        targetValue = (minY + maxY) / 2;
        elements.forEach(el => updates.set(el.id, { x: el.x, y: targetValue - el.height / 2 }));
        break;
    }

    return updates;
  }

  /**
   * Distribute elements evenly
   */
  distributeElements(
    elements: DesignElement[],
    distribution: DistributionType
  ): Map<string, { x: number; y: number }> {
    const updates = new Map<string, { x: number; y: number }>();

    if (elements.length < 3) return updates;

    if (distribution === 'horizontal') {
      const sorted = [...elements].sort((a, b) => a.x - b.x);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      const totalWidth = sorted.reduce((sum, el) => sum + el.width, 0);
      const availableSpace = (last.x + last.width) - first.x - totalWidth;
      const spacing = availableSpace / (sorted.length - 1);

      let currentX = first.x;
      sorted.forEach((el, i) => {
        updates.set(el.id, { x: currentX, y: el.y });
        currentX += el.width + spacing;
      });
    } else {
      const sorted = [...elements].sort((a, b) => a.y - b.y);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];

      const totalHeight = sorted.reduce((sum, el) => sum + el.height, 0);
      const availableSpace = (last.y + last.height) - first.y - totalHeight;
      const spacing = availableSpace / (sorted.length - 1);

      let currentY = first.y;
      sorted.forEach((el, i) => {
        updates.set(el.id, { x: el.x, y: currentY });
        currentY += el.height + spacing;
      });
    }

    return updates;
  }

  // ============================================================================
  // RULER GUIDES
  // ============================================================================

  /**
   * Add ruler guide
   */
  addRulerGuide(orientation: GuideOrientation, position: number): RulerGuide {
    const guide: RulerGuide = {
      id: generateGuideId(),
      orientation,
      position,
      locked: false
    };

    this.rulerGuides.push(guide);
    this.saveToStorage();

    return guide;
  }

  /**
   * Remove ruler guide
   */
  removeRulerGuide(guideId: string): boolean {
    const index = this.rulerGuides.findIndex(g => g.id === guideId);
    if (index === -1) return false;

    this.rulerGuides.splice(index, 1);
    this.saveToStorage();

    return true;
  }

  /**
   * Move ruler guide
   */
  moveRulerGuide(guideId: string, position: number): boolean {
    const guide = this.rulerGuides.find(g => g.id === guideId);
    if (!guide || guide.locked) return false;

    guide.position = position;
    this.saveToStorage();

    return true;
  }

  /**
   * Toggle ruler guide lock
   */
  toggleRulerGuideLock(guideId: string): boolean {
    const guide = this.rulerGuides.find(g => g.id === guideId);
    if (!guide) return false;

    guide.locked = !guide.locked;
    this.saveToStorage();

    return true;
  }

  /**
   * Get all ruler guides
   */
  getRulerGuides(): RulerGuide[] {
    return this.rulerGuides;
  }

  /**
   * Clear all ruler guides
   */
  clearRulerGuides(): void {
    this.rulerGuides = [];
    this.saveToStorage();
  }

  // ============================================================================
  // SIZE MATCHING
  // ============================================================================

  /**
   * Get size match indicators
   */
  getSizeIndicators(elements: DesignElement[]): SizeIndicator[] {
    if (!this.settings.showSizeMatches) return [];

    const indicators: SizeIndicator[] = [];

    const widthMatches = findSizeMatches(elements, 'width');
    widthMatches.forEach((matchingElements, size) => {
      indicators.push({
        id: generateGuideId(),
        dimension: 'width',
        value: size,
        elements: matchingElements.map(el => el.id)
      });
    });

    const heightMatches = findSizeMatches(elements, 'height');
    heightMatches.forEach((matchingElements, size) => {
      indicators.push({
        id: generateGuideId(),
        dimension: 'height',
        value: size,
        elements: matchingElements.map(el => el.id)
      });
    });

    this.activeSizeIndicators = indicators;
    return indicators;
  }

  // ============================================================================
  // GETTERS & SETTERS
  // ============================================================================

  /**
   * Get settings
   */
  getSettings(): SmartGuidesSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(updates: Partial<SmartGuidesSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveToStorage();
  }

  /**
   * Get active guides
   */
  getActiveGuides(): SmartGuide[] {
    return this.activeGuides;
  }

  /**
   * Get active spacing indicators
   */
  getActiveSpacingIndicators(): SpacingIndicator[] {
    return this.activeSpacingIndicators;
  }

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  setOnGuidesUpdate(callback: (guides: SmartGuide[], spacing: SpacingIndicator[]) => void): void {
    this.onGuidesUpdate = callback;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const smartGuidesManager = new SmartGuidesManager();
