// ============================================================================
// KEYBOARD SHORTCUTS SERVICE
// ============================================================================

import {
  DEFAULT_SHORTCUTS,
  BUILT_IN_PRESETS,
  createKeyCombo,
  eventMatchesShortcut,
  isInTextInput
} from '../types/shortcuts';
import type {
  KeyboardShortcut,
  ShortcutPreset,
  ShortcutConflict,
  ShortcutEvent,
  ShortcutContext,
  ShortcutCategory,
  ModifierKeys
} from '../types/shortcuts';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  SHORTCUTS: 'lumina_shortcuts',
  ACTIVE_PRESET: 'lumina_shortcuts_preset',
  CUSTOM_PRESETS: 'lumina_shortcuts_custom_presets'
};

// ============================================================================
// SHORTCUTS MANAGER
// ============================================================================

class ShortcutsManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private presets: ShortcutPreset[] = [...BUILT_IN_PRESETS];
  private activePresetId: string = 'default';
  private handlers: Map<string, (event: ShortcutEvent) => void> = new Map();
  private isEnabled: boolean = true;
  private currentContext: ShortcutContext = 'canvas';

  // Callbacks
  private onShortcutTriggered: ((event: ShortcutEvent) => void) | null = null;
  private onShortcutsChange: ((shortcuts: KeyboardShortcut[]) => void) | null = null;

  constructor() {
    this.loadFromStorage();
    this.initializeShortcuts();
    this.setupEventListeners();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private loadFromStorage(): void {
    try {
      const shortcutsJson = localStorage.getItem(STORAGE_KEYS.SHORTCUTS);
      const activePreset = localStorage.getItem(STORAGE_KEYS.ACTIVE_PRESET);
      const customPresetsJson = localStorage.getItem(STORAGE_KEYS.CUSTOM_PRESETS);

      if (shortcutsJson) {
        const shortcuts = JSON.parse(shortcutsJson) as KeyboardShortcut[];
        shortcuts.forEach(s => this.shortcuts.set(s.id, s));
      }

      if (activePreset) {
        this.activePresetId = activePreset;
      }

      if (customPresetsJson) {
        const customPresets = JSON.parse(customPresetsJson) as ShortcutPreset[];
        this.presets = [...BUILT_IN_PRESETS, ...customPresets];
      }
    } catch (error) {
      console.error('Failed to load shortcuts:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.SHORTCUTS,
        JSON.stringify(Array.from(this.shortcuts.values()))
      );
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PRESET, this.activePresetId);
      localStorage.setItem(
        STORAGE_KEYS.CUSTOM_PRESETS,
        JSON.stringify(this.presets.filter(p => !p.isBuiltIn))
      );
    } catch (error) {
      console.error('Failed to save shortcuts:', error);
    }
  }

  private initializeShortcuts(): void {
    if (this.shortcuts.size === 0) {
      DEFAULT_SHORTCUTS.forEach(shortcut => {
        const fullShortcut: KeyboardShortcut = {
          ...shortcut,
          originalKey: shortcut.key,
          originalModifiers: { ...shortcut.modifiers }
        };
        this.shortcuts.set(shortcut.id, fullShortcut);
      });
      this.saveToStorage();
    }
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  // ============================================================================
  // EVENT HANDLING
  // ============================================================================

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Skip if in text input and not a global shortcut
    if (isInTextInput()) {
      // Only allow global shortcuts in text input
      const matchingShortcut = this.findMatchingShortcut(event);
      if (!matchingShortcut?.isGlobal) return;
    }

    const shortcut = this.findMatchingShortcut(event);
    if (!shortcut || !shortcut.enabled) return;

    // Prevent default browser behavior
    event.preventDefault();
    event.stopPropagation();

    const shortcutEvent: ShortcutEvent = {
      shortcut,
      originalEvent: event,
      context: this.currentContext,
      timestamp: Date.now()
    };

    // Call registered handler
    const handler = this.handlers.get(shortcut.action);
    if (handler) {
      handler(shortcutEvent);
    }

    // Call global callback
    this.onShortcutTriggered?.(shortcutEvent);
  }

  private findMatchingShortcut(event: KeyboardEvent): KeyboardShortcut | null {
    for (const shortcut of this.shortcuts.values()) {
      if (eventMatchesShortcut(event, shortcut)) {
        return shortcut;
      }
    }
    return null;
  }

  // ============================================================================
  // SHORTCUT MANAGEMENT
  // ============================================================================

  /**
   * Get all shortcuts
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcuts by category
   */
  getShortcutsByCategory(category: ShortcutCategory): KeyboardShortcut[] {
    return this.getAllShortcuts().filter(s => s.category === category);
  }

  /**
   * Get a specific shortcut
   */
  getShortcut(id: string): KeyboardShortcut | undefined {
    return this.shortcuts.get(id);
  }

  /**
   * Update a shortcut
   */
  updateShortcut(
    id: string,
    key: string,
    modifiers: ModifierKeys
  ): { success: boolean; conflict?: ShortcutConflict } {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) return { success: false };

    // Check for conflicts
    const conflict = this.checkConflict(id, key, modifiers);
    if (conflict) {
      return { success: false, conflict };
    }

    shortcut.key = key;
    shortcut.modifiers = modifiers;
    shortcut.isCustom = true;

    this.saveToStorage();
    this.notifyShortcutsChange();

    return { success: true };
  }

  /**
   * Reset a shortcut to default
   */
  resetShortcut(id: string): boolean {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut || !shortcut.originalKey) return false;

    shortcut.key = shortcut.originalKey;
    shortcut.modifiers = { ...shortcut.originalModifiers! };
    shortcut.isCustom = false;

    this.saveToStorage();
    this.notifyShortcutsChange();

    return true;
  }

  /**
   * Reset all shortcuts to default
   */
  resetAllShortcuts(): void {
    this.shortcuts.forEach(shortcut => {
      if (shortcut.originalKey) {
        shortcut.key = shortcut.originalKey;
        shortcut.modifiers = { ...shortcut.originalModifiers! };
        shortcut.isCustom = false;
      }
    });

    this.saveToStorage();
    this.notifyShortcutsChange();
  }

  /**
   * Enable/disable a shortcut
   */
  setShortcutEnabled(id: string, enabled: boolean): boolean {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) return false;

    shortcut.enabled = enabled;
    this.saveToStorage();
    this.notifyShortcutsChange();

    return true;
  }

  /**
   * Check for conflicts
   */
  checkConflict(
    excludeId: string,
    key: string,
    modifiers: ModifierKeys
  ): ShortcutConflict | null {
    const combo = createKeyCombo(key, modifiers);

    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.id === excludeId) continue;
      if (!shortcut.enabled) continue;

      const existingCombo = createKeyCombo(shortcut.key, shortcut.modifiers);
      if (combo === existingCombo) {
        return {
          shortcut1: this.shortcuts.get(excludeId)!,
          shortcut2: shortcut,
          keyCombo: combo
        };
      }
    }

    return null;
  }

  /**
   * Get all conflicts
   */
  getAllConflicts(): ShortcutConflict[] {
    const conflicts: ShortcutConflict[] = [];
    const combos = new Map<string, KeyboardShortcut[]>();

    this.shortcuts.forEach(shortcut => {
      if (!shortcut.enabled) return;

      const combo = createKeyCombo(shortcut.key, shortcut.modifiers);
      if (!combos.has(combo)) {
        combos.set(combo, []);
      }
      combos.get(combo)!.push(shortcut);
    });

    combos.forEach((shortcuts, combo) => {
      if (shortcuts.length > 1) {
        for (let i = 0; i < shortcuts.length - 1; i++) {
          conflicts.push({
            shortcut1: shortcuts[i],
            shortcut2: shortcuts[i + 1],
            keyCombo: combo
          });
        }
      }
    });

    return conflicts;
  }

  // ============================================================================
  // HANDLER REGISTRATION
  // ============================================================================

  /**
   * Register an action handler
   */
  registerHandler(action: string, handler: (event: ShortcutEvent) => void): void {
    this.handlers.set(action, handler);
  }

  /**
   * Unregister an action handler
   */
  unregisterHandler(action: string): void {
    this.handlers.delete(action);
  }

  /**
   * Register multiple handlers
   */
  registerHandlers(handlers: Record<string, (event: ShortcutEvent) => void>): void {
    Object.entries(handlers).forEach(([action, handler]) => {
      this.registerHandler(action, handler);
    });
  }

  // ============================================================================
  // PRESET MANAGEMENT
  // ============================================================================

  /**
   * Get all presets
   */
  getPresets(): ShortcutPreset[] {
    return this.presets;
  }

  /**
   * Get active preset
   */
  getActivePreset(): ShortcutPreset | undefined {
    return this.presets.find(p => p.id === this.activePresetId);
  }

  /**
   * Apply a preset
   */
  applyPreset(presetId: string): boolean {
    const preset = this.presets.find(p => p.id === presetId);
    if (!preset) return false;

    // Reset all to default first
    this.resetAllShortcuts();

    // Apply preset overrides
    Object.entries(preset.shortcuts).forEach(([id, override]) => {
      const shortcut = this.shortcuts.get(id);
      if (shortcut) {
        shortcut.key = override.key;
        shortcut.modifiers = override.modifiers;
        shortcut.isCustom = true;
      }
    });

    this.activePresetId = presetId;
    this.saveToStorage();
    this.notifyShortcutsChange();

    return true;
  }

  /**
   * Create a custom preset from current shortcuts
   */
  createPreset(name: string, description?: string): ShortcutPreset {
    const customShortcuts: Record<string, { key: string; modifiers: ModifierKeys }> = {};

    this.shortcuts.forEach(shortcut => {
      if (shortcut.isCustom) {
        customShortcuts[shortcut.id] = {
          key: shortcut.key,
          modifiers: { ...shortcut.modifiers }
        };
      }
    });

    const preset: ShortcutPreset = {
      id: `custom_${Date.now()}`,
      name,
      description,
      shortcuts: customShortcuts,
      isBuiltIn: false
    };

    this.presets.push(preset);
    this.saveToStorage();

    return preset;
  }

  /**
   * Delete a custom preset
   */
  deletePreset(presetId: string): boolean {
    const index = this.presets.findIndex(p => p.id === presetId && !p.isBuiltIn);
    if (index === -1) return false;

    this.presets.splice(index, 1);

    if (this.activePresetId === presetId) {
      this.activePresetId = 'default';
    }

    this.saveToStorage();
    return true;
  }

  // ============================================================================
  // CONTEXT & STATE
  // ============================================================================

  /**
   * Set current context
   */
  setContext(context: ShortcutContext): void {
    this.currentContext = context;
  }

  /**
   * Get current context
   */
  getContext(): ShortcutContext {
    return this.currentContext;
  }

  /**
   * Enable/disable all shortcuts
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if shortcuts are enabled
   */
  getEnabled(): boolean {
    return this.isEnabled;
  }

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  setOnShortcutTriggered(callback: (event: ShortcutEvent) => void): void {
    this.onShortcutTriggered = callback;
  }

  setOnShortcutsChange(callback: (shortcuts: KeyboardShortcut[]) => void): void {
    this.onShortcutsChange = callback;
  }

  private notifyShortcutsChange(): void {
    this.onShortcutsChange?.(this.getAllShortcuts());
  }

  // ============================================================================
  // EXPORT/IMPORT
  // ============================================================================

  /**
   * Export shortcuts configuration
   */
  exportConfig(): string {
    return JSON.stringify({
      shortcuts: Array.from(this.shortcuts.values()),
      activePresetId: this.activePresetId,
      customPresets: this.presets.filter(p => !p.isBuiltIn)
    }, null, 2);
  }

  /**
   * Import shortcuts configuration
   */
  importConfig(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (data.shortcuts) {
        data.shortcuts.forEach((s: KeyboardShortcut) => {
          this.shortcuts.set(s.id, s);
        });
      }

      if (data.activePresetId) {
        this.activePresetId = data.activePresetId;
      }

      if (data.customPresets) {
        this.presets = [...BUILT_IN_PRESETS, ...data.customPresets];
      }

      this.saveToStorage();
      this.notifyShortcutsChange();

      return true;
    } catch (error) {
      console.error('Failed to import shortcuts:', error);
      return false;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const shortcutsManager = new ShortcutsManager();
