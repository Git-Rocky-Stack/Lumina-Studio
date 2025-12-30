// ============================================================================
// AUTO-LAYOUT SYSTEM - SERVICE
// ============================================================================

import type { DesignElement } from '../types';
import {
  generateFrameId,
  getPaddingWidth,
  getPaddingHeight,
  isSpaceAlignment,
  DEFAULT_PADDING,
  LAYOUT_PRESETS
} from '../types/autolayout';
import type {
  AutoLayoutFrame,
  LayoutItem,
  LayoutResult,
  Padding,
  LayoutDirection,
  Alignment,
  SizingMode,
  DistributeOptions,
  AlignOptions,
  LayoutConstraints,
  LayoutPreset,
  Breakpoint
} from '../types/autolayout';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  FRAMES: 'lumina_layout_frames',
  ITEMS: 'lumina_layout_items'
};

// ============================================================================
// AUTO-LAYOUT MANAGER
// ============================================================================

class AutoLayoutManager {
  private frames: Map<string, AutoLayoutFrame> = new Map();
  private items: Map<string, LayoutItem> = new Map();
  private onLayoutChange: ((results: LayoutResult[]) => void) | null = null;

  constructor() {
    this.loadFromStorage();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private loadFromStorage(): void {
    try {
      const framesJson = localStorage.getItem(STORAGE_KEYS.FRAMES);
      const itemsJson = localStorage.getItem(STORAGE_KEYS.ITEMS);

      if (framesJson) {
        const frames = JSON.parse(framesJson) as AutoLayoutFrame[];
        frames.forEach(f => this.frames.set(f.id, f));
      }

      if (itemsJson) {
        const items = JSON.parse(itemsJson) as LayoutItem[];
        items.forEach(i => this.items.set(i.elementId, i));
      }
    } catch (error) {
      console.error('Failed to load layout data:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.FRAMES,
        JSON.stringify(Array.from(this.frames.values()))
      );
      localStorage.setItem(
        STORAGE_KEYS.ITEMS,
        JSON.stringify(Array.from(this.items.values()))
      );
    } catch (error) {
      console.error('Failed to save layout data:', error);
    }
  }

  // ============================================================================
  // FRAME MANAGEMENT
  // ============================================================================

  /**
   * Create a new auto-layout frame
   */
  createFrame(
    options: Partial<AutoLayoutFrame> & { childIds: string[] },
    elements: DesignElement[]
  ): AutoLayoutFrame {
    const bounds = this.calculateBounds(options.childIds, elements);
    const frameId = generateFrameId();

    const frame: AutoLayoutFrame = {
      id: frameId,
      name: options.name || 'Auto Layout',
      direction: options.direction || 'vertical',
      primaryAxisAlignment: options.primaryAxisAlignment || 'start',
      crossAxisAlignment: options.crossAxisAlignment || 'start',
      gap: options.gap ?? 16,
      padding: options.padding || { ...DEFAULT_PADDING },
      widthMode: options.widthMode || 'hug',
      heightMode: options.heightMode || 'hug',
      x: bounds.x - (options.padding?.left ?? 16),
      y: bounds.y - (options.padding?.top ?? 16),
      width: bounds.width + getPaddingWidth(options.padding || DEFAULT_PADDING),
      height: bounds.height + getPaddingHeight(options.padding || DEFAULT_PADDING),
      childIds: options.childIds,
      backgroundColor: options.backgroundColor,
      borderRadius: options.borderRadius,
      border: options.border,
      ...options
    };

    // Create layout items for children
    options.childIds.forEach((id, index) => {
      this.items.set(id, {
        elementId: id,
        order: index
      });
    });

    this.frames.set(frameId, frame);
    this.saveToStorage();

    return frame;
  }

  /**
   * Create frame from a preset
   */
  createFrameFromPreset(
    presetId: string,
    childIds: string[],
    elements: DesignElement[]
  ): AutoLayoutFrame | null {
    const preset = LAYOUT_PRESETS.find(p => p.id === presetId);
    if (!preset) return null;

    return this.createFrame({
      ...preset.frame,
      name: preset.name,
      childIds
    }, elements);
  }

  /**
   * Get a frame by ID
   */
  getFrame(frameId: string): AutoLayoutFrame | undefined {
    return this.frames.get(frameId);
  }

  /**
   * Get all frames
   */
  getAllFrames(): AutoLayoutFrame[] {
    return Array.from(this.frames.values());
  }

  /**
   * Update frame properties
   */
  updateFrame(frameId: string, updates: Partial<AutoLayoutFrame>): AutoLayoutFrame | null {
    const frame = this.frames.get(frameId);
    if (!frame) return null;

    const updated = { ...frame, ...updates };
    this.frames.set(frameId, updated);
    this.saveToStorage();

    return updated;
  }

  /**
   * Delete a frame
   */
  deleteFrame(frameId: string): boolean {
    const frame = this.frames.get(frameId);
    if (!frame) return false;

    // Remove layout items
    frame.childIds.forEach(id => this.items.delete(id));

    this.frames.delete(frameId);
    this.saveToStorage();

    return true;
  }

  /**
   * Add element to frame
   */
  addToFrame(frameId: string, elementId: string): boolean {
    const frame = this.frames.get(frameId);
    if (!frame) return false;

    if (!frame.childIds.includes(elementId)) {
      frame.childIds.push(elementId);
      this.items.set(elementId, {
        elementId,
        order: frame.childIds.length - 1
      });
      this.saveToStorage();
    }

    return true;
  }

  /**
   * Remove element from frame
   */
  removeFromFrame(frameId: string, elementId: string): boolean {
    const frame = this.frames.get(frameId);
    if (!frame) return false;

    frame.childIds = frame.childIds.filter(id => id !== elementId);
    this.items.delete(elementId);

    // Reorder remaining items
    frame.childIds.forEach((id, index) => {
      const item = this.items.get(id);
      if (item) item.order = index;
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Reorder children in frame
   */
  reorderChildren(frameId: string, newOrder: string[]): boolean {
    const frame = this.frames.get(frameId);
    if (!frame) return false;

    frame.childIds = newOrder;
    newOrder.forEach((id, index) => {
      const item = this.items.get(id);
      if (item) item.order = index;
    });

    this.saveToStorage();
    return true;
  }

  // ============================================================================
  // LAYOUT CALCULATIONS
  // ============================================================================

  /**
   * Calculate layout for a frame
   */
  calculateLayout(frameId: string, elements: DesignElement[]): LayoutResult[] {
    const frame = this.frames.get(frameId);
    if (!frame) return [];

    const children = frame.childIds
      .map(id => elements.find(el => el.id === id))
      .filter((el): el is DesignElement => el !== undefined);

    if (children.length === 0) return [];

    const results: LayoutResult[] = [];
    const isHorizontal = frame.direction === 'horizontal';

    // Available space
    const availableWidth = frame.width - getPaddingWidth(frame.padding);
    const availableHeight = frame.height - getPaddingHeight(frame.padding);

    // Calculate total content size
    const totalGap = frame.gap * (children.length - 1);
    let totalChildSize = 0;

    children.forEach(child => {
      totalChildSize += isHorizontal ? child.width : child.height;
    });

    // Calculate starting position based on alignment
    let currentX = frame.x + frame.padding.left;
    let currentY = frame.y + frame.padding.top;

    if (isHorizontal) {
      switch (frame.primaryAxisAlignment) {
        case 'center':
          currentX += (availableWidth - totalChildSize - totalGap) / 2;
          break;
        case 'end':
          currentX += availableWidth - totalChildSize - totalGap;
          break;
      }
    } else {
      switch (frame.primaryAxisAlignment) {
        case 'center':
          currentY += (availableHeight - totalChildSize - totalGap) / 2;
          break;
        case 'end':
          currentY += availableHeight - totalChildSize - totalGap;
          break;
      }
    }

    // Calculate spacing for space-* alignments
    let spacing = frame.gap;
    if (isSpaceAlignment(frame.primaryAxisAlignment)) {
      const totalSpace = isHorizontal
        ? availableWidth - totalChildSize
        : availableHeight - totalChildSize;

      switch (frame.primaryAxisAlignment) {
        case 'space-between':
          spacing = children.length > 1 ? totalSpace / (children.length - 1) : 0;
          break;
        case 'space-around':
          spacing = totalSpace / children.length;
          currentX += isHorizontal ? spacing / 2 : 0;
          currentY += !isHorizontal ? spacing / 2 : 0;
          break;
        case 'space-evenly':
          spacing = totalSpace / (children.length + 1);
          currentX += isHorizontal ? spacing : 0;
          currentY += !isHorizontal ? spacing : 0;
          break;
      }
    }

    // Position each child
    children.forEach((child, index) => {
      const item = this.items.get(child.id);
      let x = currentX;
      let y = currentY;
      let width = item?.fixedWidth ?? child.width;
      let height = item?.fixedHeight ?? child.height;

      // Cross axis alignment
      const crossAlign = item?.alignSelf || frame.crossAxisAlignment;
      if (isHorizontal) {
        switch (crossAlign) {
          case 'center':
            y += (availableHeight - height) / 2;
            break;
          case 'end':
            y += availableHeight - height;
            break;
          case 'stretch':
            height = availableHeight;
            break;
        }
      } else {
        switch (crossAlign) {
          case 'center':
            x += (availableWidth - width) / 2;
            break;
          case 'end':
            x += availableWidth - width;
            break;
          case 'stretch':
            width = availableWidth;
            break;
        }
      }

      results.push({ elementId: child.id, x, y, width, height });

      // Move to next position
      if (isHorizontal) {
        currentX += width + spacing;
      } else {
        currentY += height + spacing;
      }
    });

    return results;
  }

  /**
   * Apply layout to elements
   */
  applyLayout(frameId: string, elements: DesignElement[]): DesignElement[] {
    const results = this.calculateLayout(frameId, elements);
    const resultMap = new Map(results.map(r => [r.elementId, r]));

    return elements.map(el => {
      const result = resultMap.get(el.id);
      if (result) {
        return {
          ...el,
          x: result.x,
          y: result.y,
          width: result.width,
          height: result.height
        };
      }
      return el;
    });
  }

  /**
   * Calculate bounding box of elements
   */
  private calculateBounds(elementIds: string[], elements: DesignElement[]): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const selected = elements.filter(el => elementIds.includes(el.id));
    if (selected.length === 0) {
      return { x: 0, y: 0, width: 100, height: 100 };
    }

    const minX = Math.min(...selected.map(el => el.x));
    const minY = Math.min(...selected.map(el => el.y));
    const maxX = Math.max(...selected.map(el => el.x + el.width));
    const maxY = Math.max(...selected.map(el => el.y + el.height));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  // ============================================================================
  // SMART ALIGNMENT & DISTRIBUTION
  // ============================================================================

  /**
   * Distribute elements evenly
   */
  distributeElements(
    elementIds: string[],
    elements: DesignElement[],
    options: DistributeOptions
  ): DesignElement[] {
    const selected = elements.filter(el => elementIds.includes(el.id));
    if (selected.length < 2) return elements;

    // Sort by position
    const sorted = [...selected].sort((a, b) =>
      options.direction === 'horizontal' ? a.x - b.x : a.y - b.y
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    let spacing: number;
    if (options.spacing === 'fixed') {
      spacing = options.fixedValue ?? 16;
    } else {
      // Calculate equal spacing
      const totalSize = sorted.reduce((sum, el) =>
        sum + (options.direction === 'horizontal' ? el.width : el.height), 0
      );
      const totalSpace = options.direction === 'horizontal'
        ? (last.x + last.width) - first.x - totalSize
        : (last.y + last.height) - first.y - totalSize;
      spacing = totalSpace / (sorted.length - 1);
    }

    // Apply new positions
    const updates = new Map<string, { x?: number; y?: number }>();
    let currentPos = options.direction === 'horizontal' ? first.x : first.y;

    sorted.forEach((el, index) => {
      if (index === 0) {
        currentPos += options.direction === 'horizontal' ? el.width : el.height;
        return;
      }

      if (options.direction === 'horizontal') {
        updates.set(el.id, { x: currentPos + spacing });
        currentPos += spacing + el.width;
      } else {
        updates.set(el.id, { y: currentPos + spacing });
        currentPos += spacing + el.height;
      }
    });

    return elements.map(el => {
      const update = updates.get(el.id);
      if (update) {
        return { ...el, ...update };
      }
      return el;
    });
  }

  /**
   * Align elements
   */
  alignElements(
    elementIds: string[],
    elements: DesignElement[],
    options: AlignOptions,
    canvasSize?: { width: number; height: number }
  ): DesignElement[] {
    const selected = elements.filter(el => elementIds.includes(el.id));
    if (selected.length === 0) return elements;

    let targetValue: number;

    // Determine target position
    if (options.relativeTo === 'canvas' && canvasSize) {
      if (options.axis === 'horizontal') {
        switch (options.position) {
          case 'start': targetValue = 0; break;
          case 'center': targetValue = canvasSize.width / 2; break;
          case 'end': targetValue = canvasSize.width; break;
        }
      } else {
        switch (options.position) {
          case 'start': targetValue = 0; break;
          case 'center': targetValue = canvasSize.height / 2; break;
          case 'end': targetValue = canvasSize.height; break;
        }
      }
    } else {
      // Relative to selection
      const bounds = this.calculateBounds(elementIds, elements);
      if (options.axis === 'horizontal') {
        switch (options.position) {
          case 'start': targetValue = bounds.x; break;
          case 'center': targetValue = bounds.x + bounds.width / 2; break;
          case 'end': targetValue = bounds.x + bounds.width; break;
        }
      } else {
        switch (options.position) {
          case 'start': targetValue = bounds.y; break;
          case 'center': targetValue = bounds.y + bounds.height / 2; break;
          case 'end': targetValue = bounds.y + bounds.height; break;
        }
      }
    }

    // Apply alignment
    return elements.map(el => {
      if (!elementIds.includes(el.id)) return el;

      if (options.axis === 'horizontal') {
        let newX: number;
        switch (options.position) {
          case 'start': newX = targetValue; break;
          case 'center': newX = targetValue - el.width / 2; break;
          case 'end': newX = targetValue - el.width; break;
          default: newX = el.x;
        }
        return { ...el, x: newX };
      } else {
        let newY: number;
        switch (options.position) {
          case 'start': newY = targetValue; break;
          case 'center': newY = targetValue - el.height / 2; break;
          case 'end': newY = targetValue - el.height; break;
          default: newY = el.y;
        }
        return { ...el, y: newY };
      }
    });
  }

  /**
   * Match element sizes
   */
  matchSizes(
    elementIds: string[],
    elements: DesignElement[],
    dimension: 'width' | 'height' | 'both',
    reference: 'min' | 'max' | 'average' | 'first'
  ): DesignElement[] {
    const selected = elements.filter(el => elementIds.includes(el.id));
    if (selected.length < 2) return elements;

    let targetWidth: number;
    let targetHeight: number;

    switch (reference) {
      case 'min':
        targetWidth = Math.min(...selected.map(el => el.width));
        targetHeight = Math.min(...selected.map(el => el.height));
        break;
      case 'max':
        targetWidth = Math.max(...selected.map(el => el.width));
        targetHeight = Math.max(...selected.map(el => el.height));
        break;
      case 'average':
        targetWidth = selected.reduce((sum, el) => sum + el.width, 0) / selected.length;
        targetHeight = selected.reduce((sum, el) => sum + el.height, 0) / selected.length;
        break;
      case 'first':
        targetWidth = selected[0].width;
        targetHeight = selected[0].height;
        break;
    }

    return elements.map(el => {
      if (!elementIds.includes(el.id)) return el;

      const updates: Partial<DesignElement> = {};
      if (dimension === 'width' || dimension === 'both') {
        updates.width = targetWidth;
      }
      if (dimension === 'height' || dimension === 'both') {
        updates.height = targetHeight;
      }

      return { ...el, ...updates };
    });
  }

  // ============================================================================
  // CONSTRAINTS
  // ============================================================================

  /**
   * Apply constraints when parent resizes
   */
  applyConstraints(
    elementId: string,
    constraints: LayoutConstraints,
    oldParent: { width: number; height: number },
    newParent: { width: number; height: number },
    element: DesignElement
  ): Partial<DesignElement> {
    const updates: Partial<DesignElement> = {};

    // Horizontal constraints
    const hConstraint = constraints.horizontal;
    switch (hConstraint.type) {
      case 'left':
        // X stays fixed from left
        break;
      case 'right':
        updates.x = newParent.width - (oldParent.width - element.x);
        break;
      case 'center':
        updates.x = element.x + (newParent.width - oldParent.width) / 2;
        break;
      case 'scale':
        const xRatio = element.x / oldParent.width;
        const widthRatio = element.width / oldParent.width;
        updates.x = xRatio * newParent.width;
        updates.width = widthRatio * newParent.width;
        break;
    }

    // Vertical constraints
    const vConstraint = constraints.vertical;
    switch (vConstraint.type) {
      case 'top':
        // Y stays fixed from top
        break;
      case 'bottom':
        updates.y = newParent.height - (oldParent.height - element.y);
        break;
      case 'center':
        updates.y = element.y + (newParent.height - oldParent.height) / 2;
        break;
      case 'scale':
        const yRatio = element.y / oldParent.height;
        const heightRatio = element.height / oldParent.height;
        updates.y = yRatio * newParent.height;
        updates.height = heightRatio * newParent.height;
        break;
    }

    return updates;
  }

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  setOnLayoutChange(callback: (results: LayoutResult[]) => void): void {
    this.onLayoutChange = callback;
  }

  // ============================================================================
  // PRESETS
  // ============================================================================

  getPresets(): LayoutPreset[] {
    return LAYOUT_PRESETS;
  }

  getPresetsByCategory(category: string): LayoutPreset[] {
    return LAYOUT_PRESETS.filter(p => p.category === category);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const autoLayoutManager = new AutoLayoutManager();
