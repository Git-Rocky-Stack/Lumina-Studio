// ============================================================================
// KEYBOARD SHORTCUTS SYSTEM - TYPE DEFINITIONS
// ============================================================================

/**
 * Shortcut category
 */
export type ShortcutCategory =
  | 'general'
  | 'edit'
  | 'view'
  | 'tools'
  | 'layers'
  | 'export'
  | 'navigation'
  | 'custom';

/**
 * Modifier keys
 */
export interface ModifierKeys {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean; // Cmd on Mac
}

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  id: string;
  name: string;
  description?: string;
  category: ShortcutCategory;

  // Key combination
  key: string; // The main key (e.g., 'a', 'Enter', 'ArrowUp')
  modifiers: ModifierKeys;

  // Action
  action: string; // Action identifier
  params?: Record<string, any>;

  // State
  enabled: boolean;
  isCustom: boolean;
  isGlobal?: boolean; // Works even when input is focused

  // Original (for reset)
  originalKey?: string;
  originalModifiers?: ModifierKeys;
}

/**
 * Shortcut conflict
 */
export interface ShortcutConflict {
  shortcut1: KeyboardShortcut;
  shortcut2: KeyboardShortcut;
  keyCombo: string;
}

/**
 * Shortcut context (when shortcuts are active)
 */
export type ShortcutContext = 'canvas' | 'text-editing' | 'modal' | 'global';

/**
 * Shortcut group for display
 */
export interface ShortcutGroup {
  category: ShortcutCategory;
  label: string;
  icon: string;
  shortcuts: KeyboardShortcut[];
}

/**
 * Custom shortcut preset
 */
export interface ShortcutPreset {
  id: string;
  name: string;
  description?: string;
  shortcuts: Record<string, { key: string; modifiers: ModifierKeys }>;
  isBuiltIn: boolean;
}

/**
 * Shortcut event
 */
export interface ShortcutEvent {
  shortcut: KeyboardShortcut;
  originalEvent: KeyboardEvent;
  context: ShortcutContext;
  timestamp: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CATEGORY_INFO: Record<ShortcutCategory, { label: string; icon: string }> = {
  general: { label: 'General', icon: 'fa-gear' },
  edit: { label: 'Edit', icon: 'fa-pen' },
  view: { label: 'View', icon: 'fa-eye' },
  tools: { label: 'Tools', icon: 'fa-toolbox' },
  layers: { label: 'Layers', icon: 'fa-layer-group' },
  export: { label: 'Export', icon: 'fa-download' },
  navigation: { label: 'Navigation', icon: 'fa-arrows-alt' },
  custom: { label: 'Custom', icon: 'fa-star' }
};

/**
 * Default keyboard shortcuts
 */
export const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, 'originalKey' | 'originalModifiers'>[] = [
  // General
  { id: 'save', name: 'Save', category: 'general', key: 's', modifiers: { ctrl: true }, action: 'save', enabled: true, isCustom: false },
  { id: 'save-as', name: 'Save As', category: 'general', key: 's', modifiers: { ctrl: true, shift: true }, action: 'save-as', enabled: true, isCustom: false },
  { id: 'undo', name: 'Undo', category: 'general', key: 'z', modifiers: { ctrl: true }, action: 'undo', enabled: true, isCustom: false },
  { id: 'redo', name: 'Redo', category: 'general', key: 'z', modifiers: { ctrl: true, shift: true }, action: 'redo', enabled: true, isCustom: false },
  { id: 'redo-alt', name: 'Redo (Alt)', category: 'general', key: 'y', modifiers: { ctrl: true }, action: 'redo', enabled: true, isCustom: false },

  // Edit
  { id: 'cut', name: 'Cut', category: 'edit', key: 'x', modifiers: { ctrl: true }, action: 'cut', enabled: true, isCustom: false },
  { id: 'copy', name: 'Copy', category: 'edit', key: 'c', modifiers: { ctrl: true }, action: 'copy', enabled: true, isCustom: false },
  { id: 'paste', name: 'Paste', category: 'edit', key: 'v', modifiers: { ctrl: true }, action: 'paste', enabled: true, isCustom: false },
  { id: 'duplicate', name: 'Duplicate', category: 'edit', key: 'd', modifiers: { ctrl: true }, action: 'duplicate', enabled: true, isCustom: false },
  { id: 'delete', name: 'Delete', category: 'edit', key: 'Delete', modifiers: {}, action: 'delete', enabled: true, isCustom: false },
  { id: 'delete-backspace', name: 'Delete (Backspace)', category: 'edit', key: 'Backspace', modifiers: {}, action: 'delete', enabled: true, isCustom: false },
  { id: 'select-all', name: 'Select All', category: 'edit', key: 'a', modifiers: { ctrl: true }, action: 'select-all', enabled: true, isCustom: false },
  { id: 'deselect', name: 'Deselect', category: 'edit', key: 'Escape', modifiers: {}, action: 'deselect', enabled: true, isCustom: false },

  // View
  { id: 'zoom-in', name: 'Zoom In', category: 'view', key: '=', modifiers: { ctrl: true }, action: 'zoom-in', enabled: true, isCustom: false },
  { id: 'zoom-out', name: 'Zoom Out', category: 'view', key: '-', modifiers: { ctrl: true }, action: 'zoom-out', enabled: true, isCustom: false },
  { id: 'zoom-fit', name: 'Zoom to Fit', category: 'view', key: '0', modifiers: { ctrl: true }, action: 'zoom-fit', enabled: true, isCustom: false },
  { id: 'zoom-100', name: 'Zoom 100%', category: 'view', key: '1', modifiers: { ctrl: true }, action: 'zoom-100', enabled: true, isCustom: false },
  { id: 'toggle-grid', name: 'Toggle Grid', category: 'view', key: "'", modifiers: { ctrl: true }, action: 'toggle-grid', enabled: true, isCustom: false },
  { id: 'toggle-rulers', name: 'Toggle Rulers', category: 'view', key: 'r', modifiers: { ctrl: true, shift: true }, action: 'toggle-rulers', enabled: true, isCustom: false },
  { id: 'preview', name: 'Preview Mode', category: 'view', key: 'p', modifiers: { ctrl: true }, action: 'preview', enabled: true, isCustom: false },

  // Tools
  { id: 'tool-select', name: 'Select Tool', category: 'tools', key: 'v', modifiers: {}, action: 'tool-select', enabled: true, isCustom: false },
  { id: 'tool-move', name: 'Move Tool', category: 'tools', key: 'm', modifiers: {}, action: 'tool-move', enabled: true, isCustom: false },
  { id: 'tool-text', name: 'Text Tool', category: 'tools', key: 't', modifiers: {}, action: 'tool-text', enabled: true, isCustom: false },
  { id: 'tool-shape', name: 'Shape Tool', category: 'tools', key: 'r', modifiers: {}, action: 'tool-shape', enabled: true, isCustom: false },
  { id: 'tool-image', name: 'Image Tool', category: 'tools', key: 'i', modifiers: {}, action: 'tool-image', enabled: true, isCustom: false },
  { id: 'tool-pen', name: 'Pen Tool', category: 'tools', key: 'p', modifiers: {}, action: 'tool-pen', enabled: true, isCustom: false },
  { id: 'tool-hand', name: 'Hand Tool', category: 'tools', key: 'h', modifiers: {}, action: 'tool-hand', enabled: true, isCustom: false },
  { id: 'tool-zoom', name: 'Zoom Tool', category: 'tools', key: 'z', modifiers: {}, action: 'tool-zoom', enabled: true, isCustom: false },

  // Layers
  { id: 'bring-forward', name: 'Bring Forward', category: 'layers', key: ']', modifiers: { ctrl: true }, action: 'bring-forward', enabled: true, isCustom: false },
  { id: 'send-backward', name: 'Send Backward', category: 'layers', key: '[', modifiers: { ctrl: true }, action: 'send-backward', enabled: true, isCustom: false },
  { id: 'bring-to-front', name: 'Bring to Front', category: 'layers', key: ']', modifiers: { ctrl: true, shift: true }, action: 'bring-to-front', enabled: true, isCustom: false },
  { id: 'send-to-back', name: 'Send to Back', category: 'layers', key: '[', modifiers: { ctrl: true, shift: true }, action: 'send-to-back', enabled: true, isCustom: false },
  { id: 'group', name: 'Group', category: 'layers', key: 'g', modifiers: { ctrl: true }, action: 'group', enabled: true, isCustom: false },
  { id: 'ungroup', name: 'Ungroup', category: 'layers', key: 'g', modifiers: { ctrl: true, shift: true }, action: 'ungroup', enabled: true, isCustom: false },
  { id: 'lock', name: 'Lock/Unlock', category: 'layers', key: 'l', modifiers: { ctrl: true }, action: 'lock', enabled: true, isCustom: false },
  { id: 'hide', name: 'Hide/Show', category: 'layers', key: 'h', modifiers: { ctrl: true, shift: true }, action: 'hide', enabled: true, isCustom: false },

  // Export
  { id: 'export', name: 'Export', category: 'export', key: 'e', modifiers: { ctrl: true, shift: true }, action: 'export', enabled: true, isCustom: false },
  { id: 'quick-export-png', name: 'Quick Export PNG', category: 'export', key: 'e', modifiers: { ctrl: true, alt: true }, action: 'quick-export', params: { format: 'png' }, enabled: true, isCustom: false },

  // Navigation
  { id: 'move-up', name: 'Move Up', category: 'navigation', key: 'ArrowUp', modifiers: {}, action: 'move', params: { direction: 'up' }, enabled: true, isCustom: false },
  { id: 'move-down', name: 'Move Down', category: 'navigation', key: 'ArrowDown', modifiers: {}, action: 'move', params: { direction: 'down' }, enabled: true, isCustom: false },
  { id: 'move-left', name: 'Move Left', category: 'navigation', key: 'ArrowLeft', modifiers: {}, action: 'move', params: { direction: 'left' }, enabled: true, isCustom: false },
  { id: 'move-right', name: 'Move Right', category: 'navigation', key: 'ArrowRight', modifiers: {}, action: 'move', params: { direction: 'right' }, enabled: true, isCustom: false },
  { id: 'move-up-10', name: 'Move Up 10px', category: 'navigation', key: 'ArrowUp', modifiers: { shift: true }, action: 'move', params: { direction: 'up', distance: 10 }, enabled: true, isCustom: false },
  { id: 'move-down-10', name: 'Move Down 10px', category: 'navigation', key: 'ArrowDown', modifiers: { shift: true }, action: 'move', params: { direction: 'down', distance: 10 }, enabled: true, isCustom: false },
  { id: 'move-left-10', name: 'Move Left 10px', category: 'navigation', key: 'ArrowLeft', modifiers: { shift: true }, action: 'move', params: { direction: 'left', distance: 10 }, enabled: true, isCustom: false },
  { id: 'move-right-10', name: 'Move Right 10px', category: 'navigation', key: 'ArrowRight', modifiers: { shift: true }, action: 'move', params: { direction: 'right', distance: 10 }, enabled: true, isCustom: false }
];

/**
 * Built-in presets
 */
export const BUILT_IN_PRESETS: ShortcutPreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Standard keyboard shortcuts',
    shortcuts: {},
    isBuiltIn: true
  },
  {
    id: 'photoshop',
    name: 'Photoshop-like',
    description: 'Shortcuts similar to Adobe Photoshop',
    shortcuts: {
      'tool-move': { key: 'v', modifiers: {} },
      'tool-select': { key: 'm', modifiers: {} },
      'tool-text': { key: 't', modifiers: {} }
    },
    isBuiltIn: true
  },
  {
    id: 'figma',
    name: 'Figma-like',
    description: 'Shortcuts similar to Figma',
    shortcuts: {
      'tool-frame': { key: 'f', modifiers: {} },
      'tool-text': { key: 't', modifiers: {} }
    },
    isBuiltIn: true
  }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get modifier key name based on platform
 */
export function getModifierName(modifier: keyof ModifierKeys): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  switch (modifier) {
    case 'ctrl': return isMac ? '⌘' : 'Ctrl';
    case 'alt': return isMac ? '⌥' : 'Alt';
    case 'shift': return '⇧';
    case 'meta': return isMac ? '⌘' : 'Win';
    default: return modifier;
  }
}

/**
 * Format key for display
 */
export function formatKeyForDisplay(key: string): string {
  const keyMap: Record<string, string> = {
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Enter': '↵',
    'Backspace': '⌫',
    'Delete': '⌦',
    'Escape': 'Esc',
    'Tab': '⇥',
    ' ': 'Space'
  };

  return keyMap[key] || key.toUpperCase();
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.modifiers.ctrl) parts.push(getModifierName('ctrl'));
  if (shortcut.modifiers.alt) parts.push(getModifierName('alt'));
  if (shortcut.modifiers.shift) parts.push(getModifierName('shift'));
  if (shortcut.modifiers.meta) parts.push(getModifierName('meta'));

  parts.push(formatKeyForDisplay(shortcut.key));

  return parts.join(' + ');
}

/**
 * Create key combo string for comparison
 */
export function createKeyCombo(key: string, modifiers: ModifierKeys): string {
  const parts: string[] = [];

  if (modifiers.ctrl) parts.push('ctrl');
  if (modifiers.alt) parts.push('alt');
  if (modifiers.shift) parts.push('shift');
  if (modifiers.meta) parts.push('meta');

  parts.push(key.toLowerCase());

  return parts.sort().join('+');
}

/**
 * Check if event matches shortcut
 */
export function eventMatchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
  const ctrlMatch = event.ctrlKey === (shortcut.modifiers.ctrl || false);
  const altMatch = event.altKey === (shortcut.modifiers.alt || false);
  const shiftMatch = event.shiftKey === (shortcut.modifiers.shift || false);
  const metaMatch = event.metaKey === (shortcut.modifiers.meta || false);

  return keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch;
}

/**
 * Check if currently in text input
 */
export function isInTextInput(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea';
  const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';

  return isInput || isContentEditable;
}
