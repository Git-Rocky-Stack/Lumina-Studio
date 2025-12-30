// ============================================================================
// PLUGIN SYSTEM - SERVICE
// ============================================================================

import {
  Plugin,
  PluginManifest,
  PluginStatus,
  PluginStoreEntry,
  PluginAPIContext,
  PluginError,
  PluginSystemSettings,
  PluginUIComponent,
  PluginShortcut,
  PluginContextMenuItem,
  PluginHook,
  PluginInstallOptions,
  DEFAULT_PLUGIN_SETTINGS,
  SAMPLE_STORE_PLUGINS,
  validateManifest,
  isUpdateAvailable
} from '../types/plugin';

// ============================================================================
// PLUGIN MANAGER CLASS
// ============================================================================

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private settings: PluginSystemSettings = DEFAULT_PLUGIN_SETTINGS;
  private errors: PluginError[] = [];
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private apiContext: PluginAPIContext | null = null;
  private storagePrefix = 'lumina_plugin_';

  constructor() {
    this.loadSettings();
    this.loadInstalledPlugins();
  }

  // --------------------------------------------------------------------------
  // Settings Management
  // --------------------------------------------------------------------------

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem(`${this.storagePrefix}settings`);
      if (saved) {
        this.settings = { ...DEFAULT_PLUGIN_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load plugin settings:', e);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(`${this.storagePrefix}settings`, JSON.stringify(this.settings));
    } catch (e) {
      console.error('Failed to save plugin settings:', e);
    }
  }

  getSettings(): PluginSystemSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<PluginSystemSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    this.emit('settings-changed', this.settings);
  }

  // --------------------------------------------------------------------------
  // Plugin Storage
  // --------------------------------------------------------------------------

  private loadInstalledPlugins(): void {
    try {
      const saved = localStorage.getItem(`${this.storagePrefix}installed`);
      if (saved) {
        const pluginData = JSON.parse(saved);
        pluginData.forEach((data: any) => {
          const plugin: Plugin = {
            manifest: data.manifest,
            status: data.status === 'active' ? 'installed' : data.status,
            installedAt: data.installedAt,
            updatedAt: data.updatedAt,
            settings: data.settings || {}
          };
          this.plugins.set(plugin.manifest.id, plugin);
        });
      }
    } catch (e) {
      console.error('Failed to load installed plugins:', e);
    }
  }

  private saveInstalledPlugins(): void {
    try {
      const pluginData = Array.from(this.plugins.values()).map(p => ({
        manifest: p.manifest,
        status: p.status,
        installedAt: p.installedAt,
        updatedAt: p.updatedAt,
        settings: p.settings
      }));
      localStorage.setItem(`${this.storagePrefix}installed`, JSON.stringify(pluginData));
    } catch (e) {
      console.error('Failed to save installed plugins:', e);
    }
  }

  // --------------------------------------------------------------------------
  // API Context
  // --------------------------------------------------------------------------

  setAPIContext(context: PluginAPIContext): void {
    this.apiContext = context;
  }

  private getPluginAPI(pluginId: string): PluginAPIContext {
    if (!this.apiContext) {
      throw new Error('Plugin API context not initialized');
    }

    // Create sandboxed API for plugin
    return {
      ...this.apiContext,
      storage: {
        get: (key: string) => {
          const data = localStorage.getItem(`${this.storagePrefix}${pluginId}_${key}`);
          return data ? JSON.parse(data) : null;
        },
        set: (key: string, value: any) => {
          localStorage.setItem(`${this.storagePrefix}${pluginId}_${key}`, JSON.stringify(value));
        },
        remove: (key: string) => {
          localStorage.removeItem(`${this.storagePrefix}${pluginId}_${key}`);
        },
        clear: () => {
          const keys = Object.keys(localStorage).filter(k =>
            k.startsWith(`${this.storagePrefix}${pluginId}_`)
          );
          keys.forEach(k => localStorage.removeItem(k));
        }
      },
      settings: {
        get: (key: string) => {
          const plugin = this.plugins.get(pluginId);
          return plugin?.settings[key];
        },
        set: (key: string, value: any) => {
          const plugin = this.plugins.get(pluginId);
          if (plugin) {
            plugin.settings[key] = value;
            this.saveInstalledPlugins();
          }
        },
        getSchema: () => {
          const plugin = this.plugins.get(pluginId);
          return plugin?.settingsSchema || [];
        }
      }
    };
  }

  // --------------------------------------------------------------------------
  // Plugin Installation
  // --------------------------------------------------------------------------

  async installPlugin(storeEntry: PluginStoreEntry, options?: Partial<PluginInstallOptions>): Promise<Plugin> {
    if (!this.settings.enabled) {
      throw new Error('Plugin system is disabled');
    }

    if (this.plugins.size >= this.settings.maxPlugins) {
      throw new Error(`Maximum plugin limit reached (${this.settings.maxPlugins})`);
    }

    const { manifest } = storeEntry;
    const validation = validateManifest(manifest);
    if (!validation.valid) {
      throw new Error(`Invalid plugin manifest: ${validation.errors.join(', ')}`);
    }

    // Check if already installed
    if (this.plugins.has(manifest.id)) {
      throw new Error('Plugin is already installed');
    }

    const plugin: Plugin = {
      manifest,
      status: 'installed',
      installedAt: Date.now(),
      updatedAt: Date.now(),
      settings: {}
    };

    // Initialize default settings
    if (storeEntry.manifest.permissions.includes('settings')) {
      plugin.settingsSchema = [];
    }

    this.plugins.set(manifest.id, plugin);
    this.saveInstalledPlugins();

    this.emit('plugin-installed', plugin);

    // Auto-activate if requested
    if (options?.activate !== false) {
      await this.activatePlugin(manifest.id);
    }

    return plugin;
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error('Plugin not found');
    }

    // Deactivate first
    if (plugin.status === 'active') {
      await this.deactivatePlugin(pluginId);
    }

    // Clear plugin storage
    const keys = Object.keys(localStorage).filter(k =>
      k.startsWith(`${this.storagePrefix}${pluginId}_`)
    );
    keys.forEach(k => localStorage.removeItem(k));

    this.plugins.delete(pluginId);
    this.saveInstalledPlugins();

    this.emit('plugin-uninstalled', pluginId);
  }

  // --------------------------------------------------------------------------
  // Plugin Activation
  // --------------------------------------------------------------------------

  async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error('Plugin not found');
    }

    if (plugin.status === 'active') {
      return;
    }

    try {
      // Call onInit hook if exists
      if (plugin.onInit && this.apiContext) {
        await plugin.onInit(this.getPluginAPI(pluginId));
      }

      plugin.status = 'active';
      this.saveInstalledPlugins();

      this.emit('plugin-activated', plugin);
    } catch (e: any) {
      this.recordError(pluginId, e.message, 'onInit');
      plugin.status = 'error';
      this.saveInstalledPlugins();
      throw e;
    }
  }

  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error('Plugin not found');
    }

    if (plugin.status !== 'active') {
      return;
    }

    try {
      // Call onDestroy hook if exists
      if (plugin.onDestroy) {
        await plugin.onDestroy();
      }

      plugin.status = 'disabled';
      this.saveInstalledPlugins();

      this.emit('plugin-deactivated', plugin);
    } catch (e: any) {
      this.recordError(pluginId, e.message, 'onDestroy');
    }
  }

  // --------------------------------------------------------------------------
  // Plugin Updates
  // --------------------------------------------------------------------------

  async checkForUpdates(): Promise<{ pluginId: string; currentVersion: string; newVersion: string }[]> {
    const updates: { pluginId: string; currentVersion: string; newVersion: string }[] = [];

    for (const plugin of this.plugins.values()) {
      const storeEntry = SAMPLE_STORE_PLUGINS.find(s => s.manifest.id === plugin.manifest.id);
      if (storeEntry && isUpdateAvailable(plugin.manifest.version, storeEntry.manifest.version)) {
        updates.push({
          pluginId: plugin.manifest.id,
          currentVersion: plugin.manifest.version,
          newVersion: storeEntry.manifest.version
        });
      }
    }

    return updates;
  }

  async updatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error('Plugin not found');
    }

    const storeEntry = SAMPLE_STORE_PLUGINS.find(s => s.manifest.id === pluginId);
    if (!storeEntry) {
      throw new Error('Plugin not found in store');
    }

    const wasActive = plugin.status === 'active';

    // Deactivate if active
    if (wasActive) {
      await this.deactivatePlugin(pluginId);
    }

    // Update manifest
    plugin.manifest = storeEntry.manifest;
    plugin.status = 'installed';
    plugin.updatedAt = Date.now();

    this.saveInstalledPlugins();

    // Reactivate if was active
    if (wasActive) {
      await this.activatePlugin(pluginId);
    }

    this.emit('plugin-updated', plugin);
  }

  // --------------------------------------------------------------------------
  // Plugin Queries
  // --------------------------------------------------------------------------

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getActivePlugins(): Plugin[] {
    return this.getAllPlugins().filter(p => p.status === 'active');
  }

  getPluginsByStatus(status: PluginStatus): Plugin[] {
    return this.getAllPlugins().filter(p => p.status === status);
  }

  isInstalled(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  // --------------------------------------------------------------------------
  // Hook Execution
  // --------------------------------------------------------------------------

  async executeHook(hook: PluginHook, ...args: any[]): Promise<void> {
    const activePlugins = this.getActivePlugins();

    for (const plugin of activePlugins) {
      if (!plugin.manifest.hooks.includes(hook)) continue;

      const handler = plugin[hook as keyof Plugin] as Function | undefined;
      if (!handler) continue;

      try {
        await handler.apply(plugin, args);
      } catch (e: any) {
        this.recordError(plugin.manifest.id, e.message, hook);
        console.error(`Plugin ${plugin.manifest.id} error in ${hook}:`, e);
      }
    }
  }

  // --------------------------------------------------------------------------
  // UI Components
  // --------------------------------------------------------------------------

  getRegisteredPanels(): { pluginId: string; component: PluginUIComponent }[] {
    const panels: { pluginId: string; component: PluginUIComponent }[] = [];

    for (const plugin of this.getActivePlugins()) {
      if (plugin.uiComponents) {
        for (const component of plugin.uiComponents) {
          if (component.type === 'panel') {
            panels.push({ pluginId: plugin.manifest.id, component });
          }
        }
      }
    }

    return panels;
  }

  getRegisteredShortcuts(): { pluginId: string; shortcut: PluginShortcut }[] {
    const shortcuts: { pluginId: string; shortcut: PluginShortcut }[] = [];

    for (const plugin of this.getActivePlugins()) {
      if (plugin.shortcuts) {
        for (const shortcut of plugin.shortcuts) {
          shortcuts.push({ pluginId: plugin.manifest.id, shortcut });
        }
      }
    }

    return shortcuts;
  }

  getRegisteredContextMenuItems(): { pluginId: string; item: PluginContextMenuItem }[] {
    const items: { pluginId: string; item: PluginContextMenuItem }[] = [];

    for (const plugin of this.getActivePlugins()) {
      if (plugin.contextMenuItems) {
        for (const item of plugin.contextMenuItems) {
          items.push({ pluginId: plugin.manifest.id, item });
        }
      }
    }

    return items;
  }

  // --------------------------------------------------------------------------
  // Error Management
  // --------------------------------------------------------------------------

  private recordError(pluginId: string, message: string, hook?: PluginHook): void {
    const error: PluginError = {
      pluginId,
      error: message,
      timestamp: Date.now(),
      hook
    };

    this.errors.push(error);

    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }

    this.emit('plugin-error', error);
  }

  getErrors(pluginId?: string): PluginError[] {
    if (pluginId) {
      return this.errors.filter(e => e.pluginId === pluginId);
    }
    return [...this.errors];
  }

  clearErrors(pluginId?: string): void {
    if (pluginId) {
      this.errors = this.errors.filter(e => e.pluginId !== pluginId);
    } else {
      this.errors = [];
    }
  }

  // --------------------------------------------------------------------------
  // Store Operations
  // --------------------------------------------------------------------------

  getStorePlugins(): PluginStoreEntry[] {
    return SAMPLE_STORE_PLUGINS;
  }

  getFeaturedPlugins(): PluginStoreEntry[] {
    return SAMPLE_STORE_PLUGINS.filter(p => p.featured);
  }

  getPopularPlugins(limit: number = 10): PluginStoreEntry[] {
    return [...SAMPLE_STORE_PLUGINS]
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  searchStore(query: string): PluginStoreEntry[] {
    const q = query.toLowerCase();
    return SAMPLE_STORE_PLUGINS.filter(p =>
      p.manifest.name.toLowerCase().includes(q) ||
      p.manifest.description.toLowerCase().includes(q) ||
      p.manifest.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // --------------------------------------------------------------------------
  // Event System
  // --------------------------------------------------------------------------

  on(event: string, handler: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(handler => {
      try {
        handler(...args);
      } catch (e) {
        console.error('Event handler error:', e);
      }
    });
  }

  // --------------------------------------------------------------------------
  // Plugin Settings
  // --------------------------------------------------------------------------

  getPluginSettings(pluginId: string): Record<string, any> {
    const plugin = this.plugins.get(pluginId);
    return plugin?.settings || {};
  }

  updatePluginSettings(pluginId: string, settings: Record<string, any>): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.settings = { ...plugin.settings, ...settings };
      this.saveInstalledPlugins();
      this.emit('plugin-settings-changed', pluginId, plugin.settings);
    }
  }

  // --------------------------------------------------------------------------
  // Statistics
  // --------------------------------------------------------------------------

  getStatistics(): {
    total: number;
    active: number;
    disabled: number;
    errors: number;
    categories: Record<string, number>;
  } {
    const plugins = this.getAllPlugins();
    const categories: Record<string, number> = {};

    plugins.forEach(p => {
      const cat = p.manifest.category;
      categories[cat] = (categories[cat] || 0) + 1;
    });

    return {
      total: plugins.length,
      active: plugins.filter(p => p.status === 'active').length,
      disabled: plugins.filter(p => p.status === 'disabled').length,
      errors: plugins.filter(p => p.status === 'error').length,
      categories
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const pluginManager = new PluginManager();

// ============================================================================
// REACT HOOK
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

export function usePluginSystem() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [settings, setSettings] = useState<PluginSystemSettings>(pluginManager.getSettings());
  const [storePlugins] = useState<PluginStoreEntry[]>(pluginManager.getStorePlugins());
  const [errors, setErrors] = useState<PluginError[]>([]);

  useEffect(() => {
    const updatePlugins = () => setPlugins(pluginManager.getAllPlugins());
    const updateSettings = (s: PluginSystemSettings) => setSettings(s);
    const updateErrors = () => setErrors(pluginManager.getErrors());

    // Initial load
    updatePlugins();
    updateErrors();

    // Subscribe to events
    pluginManager.on('plugin-installed', updatePlugins);
    pluginManager.on('plugin-uninstalled', updatePlugins);
    pluginManager.on('plugin-activated', updatePlugins);
    pluginManager.on('plugin-deactivated', updatePlugins);
    pluginManager.on('plugin-updated', updatePlugins);
    pluginManager.on('settings-changed', updateSettings);
    pluginManager.on('plugin-error', updateErrors);

    return () => {
      pluginManager.off('plugin-installed', updatePlugins);
      pluginManager.off('plugin-uninstalled', updatePlugins);
      pluginManager.off('plugin-activated', updatePlugins);
      pluginManager.off('plugin-deactivated', updatePlugins);
      pluginManager.off('plugin-updated', updatePlugins);
      pluginManager.off('settings-changed', updateSettings);
      pluginManager.off('plugin-error', updateErrors);
    };
  }, []);

  const installPlugin = useCallback(async (entry: PluginStoreEntry) => {
    return pluginManager.installPlugin(entry);
  }, []);

  const uninstallPlugin = useCallback(async (pluginId: string) => {
    return pluginManager.uninstallPlugin(pluginId);
  }, []);

  const activatePlugin = useCallback(async (pluginId: string) => {
    return pluginManager.activatePlugin(pluginId);
  }, []);

  const deactivatePlugin = useCallback(async (pluginId: string) => {
    return pluginManager.deactivatePlugin(pluginId);
  }, []);

  const updatePlugin = useCallback(async (pluginId: string) => {
    return pluginManager.updatePlugin(pluginId);
  }, []);

  const updateSettings = useCallback((updates: Partial<PluginSystemSettings>) => {
    pluginManager.updateSettings(updates);
  }, []);

  const searchStore = useCallback((query: string) => {
    return pluginManager.searchStore(query);
  }, []);

  const isInstalled = useCallback((pluginId: string) => {
    return pluginManager.isInstalled(pluginId);
  }, []);

  return {
    plugins,
    settings,
    storePlugins,
    errors,
    installPlugin,
    uninstallPlugin,
    activatePlugin,
    deactivatePlugin,
    updatePlugin,
    updateSettings,
    searchStore,
    isInstalled,
    statistics: pluginManager.getStatistics(),
    featuredPlugins: pluginManager.getFeaturedPlugins(),
    popularPlugins: pluginManager.getPopularPlugins()
  };
}
