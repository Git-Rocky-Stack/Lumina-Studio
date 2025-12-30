// ============================================================================
// COMPONENT LIBRARY SERVICE
// ============================================================================

import type { DesignElement } from '../types';
import {
  generateComponentId,
  generateInstanceId,
  generateVariantId,
  generateCollectionId,
  applyOverrides,
  normalizeToOrigin,
  positionElements,
  calculateComponentBounds,
  CATEGORY_INFO
} from '../types/componentLibrary';
import type {
  MasterComponent,
  ComponentInstance,
  ComponentVariant,
  ComponentProperty,
  ComponentOverride,
  ComponentCollection,
  ComponentCategory,
  CreateComponentOptions,
  CreateInstanceOptions,
  ComponentSearchResult
} from '../types/componentLibrary';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  COMPONENTS: 'lumina_components',
  INSTANCES: 'lumina_component_instances',
  COLLECTIONS: 'lumina_component_collections'
};

// ============================================================================
// COMPONENT LIBRARY MANAGER
// ============================================================================

class ComponentLibraryManager {
  private components: Map<string, MasterComponent> = new Map();
  private instances: Map<string, ComponentInstance> = new Map();
  private collections: ComponentCollection[] = [];

  // Callbacks
  private onComponentsChange: ((components: MasterComponent[]) => void) | null = null;
  private onInstancesChange: ((instances: ComponentInstance[]) => void) | null = null;

  constructor() {
    this.loadFromStorage();
    this.ensureDefaultCollections();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private loadFromStorage(): void {
    try {
      const componentsJson = localStorage.getItem(STORAGE_KEYS.COMPONENTS);
      const instancesJson = localStorage.getItem(STORAGE_KEYS.INSTANCES);
      const collectionsJson = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);

      if (componentsJson) {
        const components = JSON.parse(componentsJson) as MasterComponent[];
        components.forEach(c => this.components.set(c.id, c));
      }

      if (instancesJson) {
        const instances = JSON.parse(instancesJson) as ComponentInstance[];
        instances.forEach(i => this.instances.set(i.id, i));
      }

      if (collectionsJson) {
        this.collections = JSON.parse(collectionsJson);
      }
    } catch (error) {
      console.error('Failed to load component library:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.COMPONENTS,
        JSON.stringify(Array.from(this.components.values()))
      );
      localStorage.setItem(
        STORAGE_KEYS.INSTANCES,
        JSON.stringify(Array.from(this.instances.values()))
      );
      localStorage.setItem(
        STORAGE_KEYS.COLLECTIONS,
        JSON.stringify(this.collections)
      );
    } catch (error) {
      console.error('Failed to save component library:', error);
    }
  }

  private ensureDefaultCollections(): void {
    if (this.collections.length === 0) {
      this.collections = [
        {
          id: 'all',
          name: 'All Components',
          componentIds: [],
          isDefault: true,
          icon: 'fa-layer-group'
        },
        {
          id: 'favorites',
          name: 'Favorites',
          componentIds: [],
          icon: 'fa-star',
          color: '#f59e0b'
        }
      ];
      this.saveToStorage();
    }
  }

  // ============================================================================
  // COMPONENT MANAGEMENT
  // ============================================================================

  /**
   * Create a new master component from elements
   */
  createComponent(
    elements: DesignElement[],
    options: CreateComponentOptions
  ): MasterComponent {
    const componentId = generateComponentId();
    const variantId = generateVariantId();

    // Normalize elements to origin
    const normalizedElements = normalizeToOrigin(elements);

    // Create default variant
    const defaultVariant: ComponentVariant = {
      id: variantId,
      name: 'Default',
      properties: {},
      elements: normalizedElements
    };

    // Generate thumbnail
    const thumbnail = this.generateThumbnail(normalizedElements);

    const component: MasterComponent = {
      id: componentId,
      name: options.name,
      description: options.description,
      category: options.category,
      properties: options.properties || [],
      defaultVariantId: variantId,
      variants: [defaultVariant],
      baseElements: normalizedElements,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: options.tags,
      usageCount: 0,
      thumbnail
    };

    this.components.set(componentId, component);
    this.saveToStorage();
    this.notifyComponentsChange();

    return component;
  }

  /**
   * Generate a simple thumbnail
   */
  private generateThumbnail(elements: DesignElement[]): string {
    const bounds = calculateComponentBounds(elements);
    const info = CATEGORY_INFO.custom;
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="${encodeURIComponent(info.color)}20" rx="8"/><text x="40" y="45" text-anchor="middle" fill="${encodeURIComponent(info.color)}" font-size="12" font-weight="bold">${elements.length}el</text></svg>`;
  }

  /**
   * Get a component by ID
   */
  getComponent(componentId: string): MasterComponent | undefined {
    return this.components.get(componentId);
  }

  /**
   * Get all components
   */
  getAllComponents(): MasterComponent[] {
    return Array.from(this.components.values());
  }

  /**
   * Get components by category
   */
  getComponentsByCategory(category: ComponentCategory): MasterComponent[] {
    return this.getAllComponents().filter(c => c.category === category);
  }

  /**
   * Update a component
   */
  updateComponent(
    componentId: string,
    updates: Partial<MasterComponent>
  ): MasterComponent | null {
    const component = this.components.get(componentId);
    if (!component) return null;

    const updated = {
      ...component,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.components.set(componentId, updated);
    this.saveToStorage();
    this.notifyComponentsChange();

    return updated;
  }

  /**
   * Delete a component
   */
  deleteComponent(componentId: string): boolean {
    if (!this.components.has(componentId)) return false;

    this.components.delete(componentId);

    // Remove from collections
    this.collections.forEach(coll => {
      coll.componentIds = coll.componentIds.filter(id => id !== componentId);
    });

    // Delete all instances
    Array.from(this.instances.values())
      .filter(i => i.masterComponentId === componentId)
      .forEach(i => this.instances.delete(i.id));

    this.saveToStorage();
    this.notifyComponentsChange();
    this.notifyInstancesChange();

    return true;
  }

  /**
   * Duplicate a component
   */
  duplicateComponent(componentId: string, newName?: string): MasterComponent | null {
    const original = this.components.get(componentId);
    if (!original) return null;

    const newId = generateComponentId();
    const duplicate: MasterComponent = {
      ...JSON.parse(JSON.stringify(original)),
      id: newId,
      name: newName || `${original.name} Copy`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };

    // Generate new IDs for variants
    duplicate.variants = duplicate.variants.map(v => ({
      ...v,
      id: generateVariantId()
    }));
    duplicate.defaultVariantId = duplicate.variants[0].id;

    this.components.set(newId, duplicate);
    this.saveToStorage();
    this.notifyComponentsChange();

    return duplicate;
  }

  // ============================================================================
  // VARIANT MANAGEMENT
  // ============================================================================

  /**
   * Add a variant to a component
   */
  addVariant(
    componentId: string,
    name: string,
    properties: Record<string, any>,
    elements?: DesignElement[]
  ): ComponentVariant | null {
    const component = this.components.get(componentId);
    if (!component) return null;

    const variant: ComponentVariant = {
      id: generateVariantId(),
      name,
      properties,
      elements: elements || JSON.parse(JSON.stringify(component.baseElements))
    };

    component.variants.push(variant);
    component.updatedAt = new Date().toISOString();

    this.saveToStorage();
    this.notifyComponentsChange();

    return variant;
  }

  /**
   * Update a variant
   */
  updateVariant(
    componentId: string,
    variantId: string,
    updates: Partial<ComponentVariant>
  ): ComponentVariant | null {
    const component = this.components.get(componentId);
    if (!component) return null;

    const variantIndex = component.variants.findIndex(v => v.id === variantId);
    if (variantIndex === -1) return null;

    component.variants[variantIndex] = {
      ...component.variants[variantIndex],
      ...updates
    };
    component.updatedAt = new Date().toISOString();

    this.saveToStorage();
    this.notifyComponentsChange();

    return component.variants[variantIndex];
  }

  /**
   * Delete a variant
   */
  deleteVariant(componentId: string, variantId: string): boolean {
    const component = this.components.get(componentId);
    if (!component) return false;

    // Can't delete the last variant
    if (component.variants.length <= 1) return false;

    // Can't delete the default variant without changing it first
    if (component.defaultVariantId === variantId) {
      const otherVariant = component.variants.find(v => v.id !== variantId);
      if (otherVariant) {
        component.defaultVariantId = otherVariant.id;
      }
    }

    component.variants = component.variants.filter(v => v.id !== variantId);
    component.updatedAt = new Date().toISOString();

    this.saveToStorage();
    this.notifyComponentsChange();

    return true;
  }

  // ============================================================================
  // INSTANCE MANAGEMENT
  // ============================================================================

  /**
   * Create an instance of a component
   */
  createInstance(
    componentId: string,
    options: CreateInstanceOptions
  ): ComponentInstance | null {
    const component = this.components.get(componentId);
    if (!component) return null;

    const variantId = options.variantId || component.defaultVariantId;
    const variant = component.variants.find(v => v.id === variantId);
    if (!variant) return null;

    // Position elements at the target location
    const positionedElements = positionElements(
      JSON.parse(JSON.stringify(variant.elements)),
      options.x,
      options.y
    );

    // Apply any initial overrides
    const resolvedElements = options.overrides
      ? applyOverrides(positionedElements, options.overrides)
      : positionedElements;

    const instance: ComponentInstance = {
      id: generateInstanceId(),
      masterComponentId: componentId,
      variantId,
      x: options.x,
      y: options.y,
      overrides: options.overrides || [],
      resolvedElements,
      createdAt: new Date().toISOString(),
      isDetached: false
    };

    this.instances.set(instance.id, instance);

    // Update usage count
    component.usageCount++;

    this.saveToStorage();
    this.notifyInstancesChange();

    return instance;
  }

  /**
   * Get an instance by ID
   */
  getInstance(instanceId: string): ComponentInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Get all instances
   */
  getAllInstances(): ComponentInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get instances of a component
   */
  getInstancesOfComponent(componentId: string): ComponentInstance[] {
    return this.getAllInstances().filter(i => i.masterComponentId === componentId);
  }

  /**
   * Update instance overrides
   */
  updateInstanceOverrides(
    instanceId: string,
    overrides: ComponentOverride[]
  ): ComponentInstance | null {
    const instance = this.instances.get(instanceId);
    if (!instance) return null;

    const component = this.components.get(instance.masterComponentId);
    if (!component) return null;

    const variant = component.variants.find(v => v.id === instance.variantId);
    if (!variant) return null;

    // Recalculate resolved elements
    const positionedElements = positionElements(
      JSON.parse(JSON.stringify(variant.elements)),
      instance.x,
      instance.y
    );
    const resolvedElements = applyOverrides(positionedElements, overrides);

    instance.overrides = overrides;
    instance.resolvedElements = resolvedElements;

    this.saveToStorage();
    this.notifyInstancesChange();

    return instance;
  }

  /**
   * Change instance variant
   */
  changeInstanceVariant(instanceId: string, variantId: string): ComponentInstance | null {
    const instance = this.instances.get(instanceId);
    if (!instance) return null;

    const component = this.components.get(instance.masterComponentId);
    if (!component) return null;

    const variant = component.variants.find(v => v.id === variantId);
    if (!variant) return null;

    // Position new variant elements
    const positionedElements = positionElements(
      JSON.parse(JSON.stringify(variant.elements)),
      instance.x,
      instance.y
    );

    instance.variantId = variantId;
    instance.resolvedElements = applyOverrides(positionedElements, instance.overrides);

    this.saveToStorage();
    this.notifyInstancesChange();

    return instance;
  }

  /**
   * Detach an instance (make it independent)
   */
  detachInstance(instanceId: string): DesignElement[] | null {
    const instance = this.instances.get(instanceId);
    if (!instance) return null;

    const elements = JSON.parse(JSON.stringify(instance.resolvedElements));

    // Mark as detached
    instance.isDetached = true;

    this.instances.delete(instanceId);
    this.saveToStorage();
    this.notifyInstancesChange();

    return elements;
  }

  /**
   * Delete an instance
   */
  deleteInstance(instanceId: string): boolean {
    if (!this.instances.has(instanceId)) return false;

    const instance = this.instances.get(instanceId)!;
    const component = this.components.get(instance.masterComponentId);
    if (component && component.usageCount > 0) {
      component.usageCount--;
    }

    this.instances.delete(instanceId);
    this.saveToStorage();
    this.notifyInstancesChange();

    return true;
  }

  /**
   * Update all instances when master component changes
   */
  syncInstances(componentId: string): void {
    const component = this.components.get(componentId);
    if (!component) return;

    const instances = this.getInstancesOfComponent(componentId);

    instances.forEach(instance => {
      if (instance.isDetached) return;

      const variant = component.variants.find(v => v.id === instance.variantId);
      if (!variant) return;

      const positionedElements = positionElements(
        JSON.parse(JSON.stringify(variant.elements)),
        instance.x,
        instance.y
      );

      instance.resolvedElements = applyOverrides(positionedElements, instance.overrides);
    });

    this.saveToStorage();
    this.notifyInstancesChange();
  }

  // ============================================================================
  // COLLECTION MANAGEMENT
  // ============================================================================

  /**
   * Create a collection
   */
  createCollection(name: string, icon?: string, color?: string): ComponentCollection {
    const collection: ComponentCollection = {
      id: generateCollectionId(),
      name,
      componentIds: [],
      icon,
      color
    };

    this.collections.push(collection);
    this.saveToStorage();

    return collection;
  }

  /**
   * Add component to collection
   */
  addToCollection(collectionId: string, componentId: string): boolean {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection) return false;

    if (!collection.componentIds.includes(componentId)) {
      collection.componentIds.push(componentId);
      this.saveToStorage();
    }

    return true;
  }

  /**
   * Remove component from collection
   */
  removeFromCollection(collectionId: string, componentId: string): boolean {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection) return false;

    collection.componentIds = collection.componentIds.filter(id => id !== componentId);
    this.saveToStorage();

    return true;
  }

  /**
   * Get all collections
   */
  getCollections(): ComponentCollection[] {
    return this.collections;
  }

  /**
   * Delete a collection
   */
  deleteCollection(collectionId: string): boolean {
    const index = this.collections.findIndex(c => c.id === collectionId);
    if (index === -1 || this.collections[index].isDefault) return false;

    this.collections.splice(index, 1);
    this.saveToStorage();

    return true;
  }

  // ============================================================================
  // SEARCH
  // ============================================================================

  /**
   * Search components
   */
  searchComponents(query: string): ComponentSearchResult[] {
    const lowerQuery = query.toLowerCase();
    const results: ComponentSearchResult[] = [];

    this.components.forEach(component => {
      const matchedFields: string[] = [];
      let score = 0;

      // Name match (highest priority)
      if (component.name.toLowerCase().includes(lowerQuery)) {
        matchedFields.push('name');
        score += 10;
        if (component.name.toLowerCase().startsWith(lowerQuery)) {
          score += 5;
        }
      }

      // Description match
      if (component.description?.toLowerCase().includes(lowerQuery)) {
        matchedFields.push('description');
        score += 5;
      }

      // Tag match
      if (component.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        matchedFields.push('tags');
        score += 7;
      }

      // Category match
      if (component.category.toLowerCase().includes(lowerQuery)) {
        matchedFields.push('category');
        score += 3;
      }

      if (matchedFields.length > 0) {
        results.push({ component, matchedFields, score });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  }

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  setOnComponentsChange(callback: (components: MasterComponent[]) => void): void {
    this.onComponentsChange = callback;
  }

  setOnInstancesChange(callback: (instances: ComponentInstance[]) => void): void {
    this.onInstancesChange = callback;
  }

  private notifyComponentsChange(): void {
    this.onComponentsChange?.(this.getAllComponents());
  }

  private notifyInstancesChange(): void {
    this.onInstancesChange?.(this.getAllInstances());
  }

  // ============================================================================
  // EXPORT/IMPORT
  // ============================================================================

  /**
   * Export component library
   */
  exportLibrary(): string {
    return JSON.stringify({
      components: Array.from(this.components.values()),
      collections: this.collections
    }, null, 2);
  }

  /**
   * Import component library
   */
  importLibrary(jsonData: string, merge: boolean = true): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (!merge) {
        this.components.clear();
        this.collections = [];
        this.ensureDefaultCollections();
      }

      if (data.components) {
        data.components.forEach((c: MasterComponent) => {
          if (merge && this.components.has(c.id)) {
            c.id = generateComponentId();
          }
          this.components.set(c.id, c);
        });
      }

      if (data.collections) {
        data.collections.forEach((coll: ComponentCollection) => {
          if (!coll.isDefault) {
            this.collections.push(coll);
          }
        });
      }

      this.saveToStorage();
      this.notifyComponentsChange();

      return true;
    } catch (error) {
      console.error('Failed to import component library:', error);
      return false;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const componentLibrary = new ComponentLibraryManager();
