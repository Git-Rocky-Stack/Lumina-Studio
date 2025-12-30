// ============================================================================
// PLUGIN SYSTEM - TYPE DEFINITIONS
// ============================================================================

/**
 * Plugin status
 */
export type PluginStatus = 'installed' | 'active' | 'disabled' | 'error' | 'updating';

/**
 * Plugin category
 */
export type PluginCategory =
  | 'design'
  | 'productivity'
  | 'export'
  | 'integration'
  | 'ai'
  | 'collaboration'
  | 'animation'
  | 'accessibility'
  | 'developer'
  | 'other';

/**
 * Plugin permission
 */
export type PluginPermission =
  | 'read-canvas'
  | 'write-canvas'
  | 'read-assets'
  | 'write-assets'
  | 'network'
  | 'storage'
  | 'clipboard'
  | 'notifications'
  | 'settings'
  | 'export'
  | 'ui-panel'
  | 'context-menu'
  | 'keyboard-shortcuts';

/**
 * Plugin hook type
 */
export type PluginHook =
  | 'onInit'
  | 'onDestroy'
  | 'onCanvasLoad'
  | 'onElementSelect'
  | 'onElementCreate'
  | 'onElementUpdate'
  | 'onElementDelete'
  | 'onExport'
  | 'onSave'
  | 'onUndo'
  | 'onRedo'
  | 'onThemeChange';

/**
 * Plugin author
 */
export interface PluginAuthor {
  name: string;
  email?: string;
  url?: string;
  avatar?: string;
}

/**
 * Plugin manifest
 */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: PluginAuthor;
  category: PluginCategory;
  tags: string[];
  icon?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  permissions: PluginPermission[];
  hooks: PluginHook[];
  minAppVersion?: string;
  maxAppVersion?: string;
  dependencies?: Record<string, string>;
}

/**
 * Plugin settings schema
 */
export interface PluginSettingSchema {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'range';
  label: string;
  description?: string;
  default: any;
  options?: { value: any; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Plugin UI component
 */
export interface PluginUIComponent {
  type: 'panel' | 'toolbar' | 'contextMenu' | 'modal' | 'widget';
  id: string;
  title?: string;
  icon?: string;
  position?: 'left' | 'right' | 'bottom' | 'floating';
  render: () => any;
}

/**
 * Plugin keyboard shortcut
 */
export interface PluginShortcut {
  id: string;
  key: string;
  modifiers: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  action: () => void;
  description?: string;
}

/**
 * Plugin context menu item
 */
export interface PluginContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
  condition?: () => boolean;
  submenu?: PluginContextMenuItem[];
}

/**
 * Plugin API context
 */
export interface PluginAPIContext {
  // Canvas operations
  canvas: {
    getElements: () => any[];
    getSelectedElements: () => any[];
    selectElements: (ids: string[]) => void;
    createElement: (type: string, props: any) => any;
    updateElement: (id: string, props: any) => void;
    deleteElement: (id: string) => void;
    getViewport: () => { x: number; y: number; zoom: number };
    setViewport: (viewport: { x?: number; y?: number; zoom?: number }) => void;
  };
  // Asset operations
  assets: {
    getAssets: () => any[];
    uploadAsset: (file: File) => Promise<any>;
    deleteAsset: (id: string) => void;
  };
  // UI operations
  ui: {
    showNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
    showModal: (content: any) => void;
    hideModal: () => void;
    registerPanel: (component: PluginUIComponent) => void;
    unregisterPanel: (id: string) => void;
    registerContextMenu: (items: PluginContextMenuItem[]) => void;
  };
  // Storage operations
  storage: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    remove: (key: string) => void;
    clear: () => void;
  };
  // Network operations
  network: {
    fetch: (url: string, options?: RequestInit) => Promise<Response>;
  };
  // Clipboard operations
  clipboard: {
    copy: (data: any) => void;
    paste: () => any;
  };
  // Settings
  settings: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    getSchema: () => PluginSettingSchema[];
  };
  // Events
  events: {
    on: (event: string, handler: (...args: any[]) => void) => void;
    off: (event: string, handler: (...args: any[]) => void) => void;
    emit: (event: string, ...args: any[]) => void;
  };
}

/**
 * Plugin interface
 */
export interface Plugin {
  manifest: PluginManifest;
  status: PluginStatus;
  installedAt: number;
  updatedAt: number;
  settings: Record<string, any>;
  settingsSchema?: PluginSettingSchema[];
  uiComponents?: PluginUIComponent[];
  shortcuts?: PluginShortcut[];
  contextMenuItems?: PluginContextMenuItem[];

  // Lifecycle methods
  onInit?: (api: PluginAPIContext) => void | Promise<void>;
  onDestroy?: () => void | Promise<void>;

  // Hook handlers
  onCanvasLoad?: () => void;
  onElementSelect?: (elements: any[]) => void;
  onElementCreate?: (element: any) => void;
  onElementUpdate?: (element: any, changes: any) => void;
  onElementDelete?: (elementId: string) => void;
  onExport?: (format: string, data: any) => any;
  onSave?: (data: any) => any;
  onUndo?: () => void;
  onRedo?: () => void;
  onThemeChange?: (theme: string) => void;
}

/**
 * Plugin store entry
 */
export interface PluginStoreEntry {
  manifest: PluginManifest;
  rating: number;
  ratingCount: number;
  downloads: number;
  featured: boolean;
  verified: boolean;
  screenshots: string[];
  changelog: { version: string; date: string; changes: string[] }[];
  pricing?: {
    type: 'free' | 'paid' | 'freemium';
    price?: number;
    currency?: string;
  };
}

/**
 * Plugin installation options
 */
export interface PluginInstallOptions {
  source: 'store' | 'url' | 'local';
  url?: string;
  file?: File;
  activate?: boolean;
}

/**
 * Plugin error
 */
export interface PluginError {
  pluginId: string;
  error: string;
  stack?: string;
  timestamp: number;
  hook?: PluginHook;
}

/**
 * Plugin system settings
 */
export interface PluginSystemSettings {
  enabled: boolean;
  autoUpdate: boolean;
  allowThirdParty: boolean;
  sandboxMode: boolean;
  maxPlugins: number;
  notifyUpdates: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_PLUGIN_SETTINGS: PluginSystemSettings = {
  enabled: true,
  autoUpdate: true,
  allowThirdParty: true,
  sandboxMode: true,
  maxPlugins: 50,
  notifyUpdates: true
};

export const CATEGORY_INFO: Record<PluginCategory, { label: string; icon: string; color: string }> = {
  design: { label: 'Design', icon: 'fa-palette', color: '#8b5cf6' },
  productivity: { label: 'Productivity', icon: 'fa-bolt', color: '#f59e0b' },
  export: { label: 'Export', icon: 'fa-file-export', color: '#10b981' },
  integration: { label: 'Integration', icon: 'fa-plug', color: '#3b82f6' },
  ai: { label: 'AI & ML', icon: 'fa-brain', color: '#ec4899' },
  collaboration: { label: 'Collaboration', icon: 'fa-users', color: '#06b6d4' },
  animation: { label: 'Animation', icon: 'fa-film', color: '#f97316' },
  accessibility: { label: 'Accessibility', icon: 'fa-universal-access', color: '#22c55e' },
  developer: { label: 'Developer', icon: 'fa-code', color: '#6366f1' },
  other: { label: 'Other', icon: 'fa-cube', color: '#6b7280' }
};

export const PERMISSION_INFO: Record<PluginPermission, { label: string; description: string; risk: 'low' | 'medium' | 'high' }> = {
  'read-canvas': { label: 'Read Canvas', description: 'View canvas elements and properties', risk: 'low' },
  'write-canvas': { label: 'Modify Canvas', description: 'Create, update, and delete canvas elements', risk: 'medium' },
  'read-assets': { label: 'Read Assets', description: 'Access uploaded assets', risk: 'low' },
  'write-assets': { label: 'Manage Assets', description: 'Upload and delete assets', risk: 'medium' },
  'network': { label: 'Network Access', description: 'Make network requests to external services', risk: 'high' },
  'storage': { label: 'Local Storage', description: 'Store data locally on your device', risk: 'low' },
  'clipboard': { label: 'Clipboard', description: 'Read from and write to clipboard', risk: 'medium' },
  'notifications': { label: 'Notifications', description: 'Show notifications', risk: 'low' },
  'settings': { label: 'Settings', description: 'Access and modify plugin settings', risk: 'low' },
  'export': { label: 'Export', description: 'Hook into export functionality', risk: 'medium' },
  'ui-panel': { label: 'UI Panels', description: 'Add custom UI panels', risk: 'low' },
  'context-menu': { label: 'Context Menu', description: 'Add context menu items', risk: 'low' },
  'keyboard-shortcuts': { label: 'Keyboard Shortcuts', description: 'Register keyboard shortcuts', risk: 'low' }
};

export const STATUS_INFO: Record<PluginStatus, { label: string; icon: string; color: string }> = {
  installed: { label: 'Installed', icon: 'fa-download', color: '#6b7280' },
  active: { label: 'Active', icon: 'fa-check-circle', color: '#22c55e' },
  disabled: { label: 'Disabled', icon: 'fa-pause-circle', color: '#f59e0b' },
  error: { label: 'Error', icon: 'fa-exclamation-circle', color: '#ef4444' },
  updating: { label: 'Updating', icon: 'fa-sync', color: '#3b82f6' }
};

// ============================================================================
// SAMPLE PLUGINS FOR STORE
// ============================================================================

export const SAMPLE_STORE_PLUGINS: PluginStoreEntry[] = [
  {
    manifest: {
      id: 'color-palette-generator',
      name: 'Color Palette Generator',
      version: '2.1.0',
      description: 'Generate beautiful color palettes from images, color theory, or AI suggestions.',
      author: { name: 'Lumina Labs', avatar: '🎨' },
      category: 'design',
      tags: ['colors', 'palette', 'generator', 'design'],
      icon: '🎨',
      permissions: ['read-canvas', 'ui-panel', 'storage'],
      hooks: ['onInit', 'onElementSelect']
    },
    rating: 4.8,
    ratingCount: 1250,
    downloads: 45000,
    featured: true,
    verified: true,
    screenshots: [],
    changelog: [{ version: '2.1.0', date: '2024-01-15', changes: ['Added AI palette suggestions', 'Improved color harmony algorithms'] }],
    pricing: { type: 'free' }
  },
  {
    manifest: {
      id: 'figma-import',
      name: 'Figma Import',
      version: '1.5.0',
      description: 'Import designs directly from Figma files. Supports components, styles, and layouts.',
      author: { name: 'Design Tools Inc.', avatar: '🔄' },
      category: 'integration',
      tags: ['figma', 'import', 'integration'],
      icon: '🔄',
      permissions: ['write-canvas', 'write-assets', 'network', 'ui-panel'],
      hooks: ['onInit']
    },
    rating: 4.5,
    ratingCount: 890,
    downloads: 32000,
    featured: true,
    verified: true,
    screenshots: [],
    changelog: [{ version: '1.5.0', date: '2024-01-10', changes: ['Support for Figma components', 'Better style mapping'] }],
    pricing: { type: 'freemium', price: 9.99, currency: 'USD' }
  },
  {
    manifest: {
      id: 'ai-layout-assistant',
      name: 'AI Layout Assistant',
      version: '3.0.0',
      description: 'AI-powered layout suggestions and automatic arrangement of design elements.',
      author: { name: 'AI Design Co.', avatar: '🤖' },
      category: 'ai',
      tags: ['ai', 'layout', 'automation', 'productivity'],
      icon: '🤖',
      permissions: ['read-canvas', 'write-canvas', 'network', 'ui-panel'],
      hooks: ['onInit', 'onElementCreate', 'onElementUpdate']
    },
    rating: 4.9,
    ratingCount: 2100,
    downloads: 78000,
    featured: true,
    verified: true,
    screenshots: [],
    changelog: [{ version: '3.0.0', date: '2024-01-20', changes: ['GPT-4 powered suggestions', 'Real-time layout optimization'] }],
    pricing: { type: 'paid', price: 19.99, currency: 'USD' }
  },
  {
    manifest: {
      id: 'icon-library',
      name: 'Icon Library Pro',
      version: '4.2.0',
      description: 'Access 50,000+ icons from popular icon sets. Search, customize, and insert directly.',
      author: { name: 'IconMaster', avatar: '⚡' },
      category: 'design',
      tags: ['icons', 'library', 'assets'],
      icon: '⚡',
      permissions: ['write-canvas', 'ui-panel', 'storage'],
      hooks: ['onInit']
    },
    rating: 4.7,
    ratingCount: 1560,
    downloads: 52000,
    featured: false,
    verified: true,
    screenshots: [],
    changelog: [{ version: '4.2.0', date: '2024-01-12', changes: ['Added Material Symbols 3', 'Custom icon upload'] }],
    pricing: { type: 'free' }
  },
  {
    manifest: {
      id: 'export-enhanced',
      name: 'Enhanced Export',
      version: '2.0.0',
      description: 'Advanced export options including batch export, custom presets, and cloud upload.',
      author: { name: 'Export Tools', avatar: '📦' },
      category: 'export',
      tags: ['export', 'batch', 'cloud'],
      icon: '📦',
      permissions: ['read-canvas', 'read-assets', 'export', 'network', 'ui-panel'],
      hooks: ['onInit', 'onExport']
    },
    rating: 4.6,
    ratingCount: 720,
    downloads: 28000,
    featured: false,
    verified: true,
    screenshots: [],
    changelog: [{ version: '2.0.0', date: '2024-01-18', changes: ['Cloud upload support', 'WebP/AVIF export'] }],
    pricing: { type: 'freemium', price: 4.99, currency: 'USD' }
  },
  {
    manifest: {
      id: 'motion-toolkit',
      name: 'Motion Toolkit',
      version: '1.8.0',
      description: 'Create stunning animations with pre-built motion presets and custom easing curves.',
      author: { name: 'Animation Studio', avatar: '🎬' },
      category: 'animation',
      tags: ['animation', 'motion', 'easing'],
      icon: '🎬',
      permissions: ['read-canvas', 'write-canvas', 'ui-panel', 'storage'],
      hooks: ['onInit', 'onElementUpdate']
    },
    rating: 4.4,
    ratingCount: 450,
    downloads: 15000,
    featured: false,
    verified: true,
    screenshots: [],
    changelog: [{ version: '1.8.0', date: '2024-01-08', changes: ['Spring physics animations', 'Timeline improvements'] }],
    pricing: { type: 'free' }
  },
  {
    manifest: {
      id: 'wcag-checker',
      name: 'WCAG Accessibility Checker',
      version: '2.3.0',
      description: 'Comprehensive accessibility checking against WCAG 2.1 guidelines with auto-fix suggestions.',
      author: { name: 'A11y Tools', avatar: '♿' },
      category: 'accessibility',
      tags: ['accessibility', 'wcag', 'a11y'],
      icon: '♿',
      permissions: ['read-canvas', 'ui-panel', 'notifications'],
      hooks: ['onInit', 'onElementUpdate', 'onExport']
    },
    rating: 4.9,
    ratingCount: 980,
    downloads: 41000,
    featured: true,
    verified: true,
    screenshots: [],
    changelog: [{ version: '2.3.0', date: '2024-01-22', changes: ['WCAG 2.2 support', 'Auto-fix for common issues'] }],
    pricing: { type: 'free' }
  },
  {
    manifest: {
      id: 'code-generator',
      name: 'Code Generator',
      version: '3.1.0',
      description: 'Generate production-ready code from your designs. Supports React, Vue, and HTML/CSS.',
      author: { name: 'DevBridge', avatar: '💻' },
      category: 'developer',
      tags: ['code', 'react', 'vue', 'html'],
      icon: '💻',
      permissions: ['read-canvas', 'export', 'clipboard', 'ui-panel'],
      hooks: ['onInit', 'onExport']
    },
    rating: 4.7,
    ratingCount: 1890,
    downloads: 67000,
    featured: true,
    verified: true,
    screenshots: [],
    changelog: [{ version: '3.1.0', date: '2024-01-19', changes: ['Tailwind CSS support', 'Component composition'] }],
    pricing: { type: 'freemium', price: 14.99, currency: 'USD' }
  }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate plugin manifest
 */
export function validateManifest(manifest: Partial<PluginManifest>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!manifest.id) errors.push('Plugin ID is required');
  if (!manifest.name) errors.push('Plugin name is required');
  if (!manifest.version) errors.push('Plugin version is required');
  if (!manifest.description) errors.push('Plugin description is required');
  if (!manifest.author?.name) errors.push('Plugin author name is required');
  if (!manifest.category) errors.push('Plugin category is required');
  if (!manifest.permissions || manifest.permissions.length === 0) {
    errors.push('At least one permission is required');
  }
  if (!manifest.hooks || manifest.hooks.length === 0) {
    errors.push('At least one hook is required');
  }

  // Validate version format (semver)
  if (manifest.version && !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(manifest.version)) {
    errors.push('Invalid version format (use semver: x.y.z)');
  }

  // Validate ID format
  if (manifest.id && !/^[a-z0-9-]+$/.test(manifest.id)) {
    errors.push('Plugin ID must be lowercase alphanumeric with hyphens');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Compare versions (semver)
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

/**
 * Check if update available
 */
export function isUpdateAvailable(installed: string, available: string): boolean {
  return compareVersions(available, installed) > 0;
}

/**
 * Format download count
 */
export function formatDownloads(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

/**
 * Calculate risk level from permissions
 */
export function calculateRiskLevel(permissions: PluginPermission[]): 'low' | 'medium' | 'high' {
  const risks = permissions.map(p => PERMISSION_INFO[p]?.risk || 'low');

  if (risks.includes('high')) return 'high';
  if (risks.filter(r => r === 'medium').length >= 2) return 'high';
  if (risks.includes('medium')) return 'medium';
  return 'low';
}

/**
 * Filter plugins by category
 */
export function filterByCategory(plugins: PluginStoreEntry[], category: PluginCategory | 'all'): PluginStoreEntry[] {
  if (category === 'all') return plugins;
  return plugins.filter(p => p.manifest.category === category);
}

/**
 * Search plugins
 */
export function searchPlugins(plugins: PluginStoreEntry[], query: string): PluginStoreEntry[] {
  const q = query.toLowerCase();
  return plugins.filter(p =>
    p.manifest.name.toLowerCase().includes(q) ||
    p.manifest.description.toLowerCase().includes(q) ||
    p.manifest.tags.some(t => t.toLowerCase().includes(q))
  );
}

/**
 * Sort plugins
 */
export function sortPlugins(
  plugins: PluginStoreEntry[],
  by: 'downloads' | 'rating' | 'name' | 'updated'
): PluginStoreEntry[] {
  return [...plugins].sort((a, b) => {
    switch (by) {
      case 'downloads': return b.downloads - a.downloads;
      case 'rating': return b.rating - a.rating;
      case 'name': return a.manifest.name.localeCompare(b.manifest.name);
      case 'updated': return 0; // Would need actual dates
      default: return 0;
    }
  });
}
