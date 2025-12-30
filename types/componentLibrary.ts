// ============================================================================
// COMPONENT LIBRARY SYSTEM - TYPE DEFINITIONS
// ============================================================================

import type { DesignElement } from '../types';

/**
 * Component category
 */
export type ComponentCategory =
  | 'buttons'
  | 'inputs'
  | 'cards'
  | 'navigation'
  | 'layout'
  | 'media'
  | 'feedback'
  | 'data-display'
  | 'custom';

/**
 * Property type for component variants
 */
export type PropertyType = 'text' | 'boolean' | 'select' | 'color' | 'number';

/**
 * Component property definition
 */
export interface ComponentProperty {
  id: string;
  name: string;
  type: PropertyType;
  defaultValue: any;
  options?: string[]; // For select type
  min?: number; // For number type
  max?: number;
  description?: string;
}

/**
 * Component variant
 */
export interface ComponentVariant {
  id: string;
  name: string;
  properties: Record<string, any>;
  elements: DesignElement[];
  thumbnail?: string;
}

/**
 * Master component definition
 */
export interface MasterComponent {
  id: string;
  name: string;
  description?: string;
  category: ComponentCategory;

  // Properties that can be overridden
  properties: ComponentProperty[];

  // Default variant
  defaultVariantId: string;

  // All variants
  variants: ComponentVariant[];

  // Base elements (template)
  baseElements: DesignElement[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  tags?: string[];

  // Usage tracking
  usageCount: number;

  // Thumbnail
  thumbnail?: string;
}

/**
 * Component instance (placed on canvas)
 */
export interface ComponentInstance {
  id: string;
  masterComponentId: string;
  variantId: string;

  // Position on canvas
  x: number;
  y: number;

  // Local overrides
  overrides: ComponentOverride[];

  // Resolved elements (after applying overrides)
  resolvedElements: DesignElement[];

  // Instance metadata
  createdAt: string;
  isDetached: boolean;
}

/**
 * Override for a specific property
 */
export interface ComponentOverride {
  elementId: string;
  property: string;
  value: any;
}

/**
 * Component library collection
 */
export interface ComponentCollection {
  id: string;
  name: string;
  description?: string;
  componentIds: string[];
  isDefault?: boolean;
  color?: string;
  icon?: string;
}

/**
 * Component search result
 */
export interface ComponentSearchResult {
  component: MasterComponent;
  matchedFields: string[];
  score: number;
}

/**
 * Component library state
 */
export interface ComponentLibraryState {
  components: Map<string, MasterComponent>;
  instances: Map<string, ComponentInstance>;
  collections: ComponentCollection[];
  selectedComponentId: string | null;
  searchQuery: string;
  activeCategory: ComponentCategory | 'all';
}

/**
 * Component creation options
 */
export interface CreateComponentOptions {
  name: string;
  category: ComponentCategory;
  description?: string;
  properties?: ComponentProperty[];
  tags?: string[];
}

/**
 * Instance creation options
 */
export interface CreateInstanceOptions {
  x: number;
  y: number;
  variantId?: string;
  overrides?: ComponentOverride[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CATEGORY_INFO: Record<ComponentCategory, { label: string; icon: string; color: string }> = {
  buttons: { label: 'Buttons', icon: 'fa-square', color: '#6366f1' },
  inputs: { label: 'Inputs', icon: 'fa-i-cursor', color: '#22c55e' },
  cards: { label: 'Cards', icon: 'fa-id-card', color: '#f59e0b' },
  navigation: { label: 'Navigation', icon: 'fa-compass', color: '#ec4899' },
  layout: { label: 'Layout', icon: 'fa-table-cells', color: '#8b5cf6' },
  media: { label: 'Media', icon: 'fa-image', color: '#14b8a6' },
  feedback: { label: 'Feedback', icon: 'fa-bell', color: '#ef4444' },
  'data-display': { label: 'Data Display', icon: 'fa-chart-bar', color: '#0ea5e9' },
  custom: { label: 'Custom', icon: 'fa-puzzle-piece', color: '#64748b' }
};

export const DEFAULT_PROPERTIES: ComponentProperty[] = [
  {
    id: 'label',
    name: 'Label',
    type: 'text',
    defaultValue: 'Button',
    description: 'The text content'
  },
  {
    id: 'variant',
    name: 'Variant',
    type: 'select',
    defaultValue: 'primary',
    options: ['primary', 'secondary', 'outline', 'ghost'],
    description: 'Visual style variant'
  },
  {
    id: 'size',
    name: 'Size',
    type: 'select',
    defaultValue: 'medium',
    options: ['small', 'medium', 'large'],
    description: 'Component size'
  },
  {
    id: 'disabled',
    name: 'Disabled',
    type: 'boolean',
    defaultValue: false,
    description: 'Whether the component is disabled'
  }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate component ID
 */
export function generateComponentId(): string {
  return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate instance ID
 */
export function generateInstanceId(): string {
  return `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate variant ID
 */
export function generateVariantId(): string {
  return `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate collection ID
 */
export function generateCollectionId(): string {
  return `coll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Apply overrides to elements
 */
export function applyOverrides(
  elements: DesignElement[],
  overrides: ComponentOverride[]
): DesignElement[] {
  const overrideMap = new Map<string, Map<string, any>>();

  overrides.forEach(override => {
    if (!overrideMap.has(override.elementId)) {
      overrideMap.set(override.elementId, new Map());
    }
    overrideMap.get(override.elementId)!.set(override.property, override.value);
  });

  return elements.map(el => {
    const elementOverrides = overrideMap.get(el.id);
    if (!elementOverrides) return el;

    const updated = { ...el };
    elementOverrides.forEach((value, property) => {
      (updated as any)[property] = value;
    });

    return updated;
  });
}

/**
 * Calculate component bounds
 */
export function calculateComponentBounds(elements: DesignElement[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 100, height: 100 };
  }

  const minX = Math.min(...elements.map(el => el.x));
  const minY = Math.min(...elements.map(el => el.y));
  const maxX = Math.max(...elements.map(el => el.x + el.width));
  const maxY = Math.max(...elements.map(el => el.y + el.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Normalize elements to origin
 */
export function normalizeToOrigin(elements: DesignElement[]): DesignElement[] {
  const bounds = calculateComponentBounds(elements);

  return elements.map(el => ({
    ...el,
    x: el.x - bounds.x,
    y: el.y - bounds.y
  }));
}

/**
 * Position elements at location
 */
export function positionElements(
  elements: DesignElement[],
  x: number,
  y: number
): DesignElement[] {
  return elements.map(el => ({
    ...el,
    x: el.x + x,
    y: el.y + y
  }));
}
