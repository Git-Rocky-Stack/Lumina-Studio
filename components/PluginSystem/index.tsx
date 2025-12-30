// ============================================================================
// PLUGIN SYSTEM - UI COMPONENTS
// ============================================================================

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plugin,
  PluginStoreEntry,
  PluginCategory,
  PluginStatus,
  CATEGORY_INFO,
  STATUS_INFO,
  PERMISSION_INFO,
  formatDownloads,
  calculateRiskLevel,
  filterByCategory,
  searchPlugins,
  sortPlugins
} from '../../types/plugin';
import { usePluginSystem } from '../../services/pluginService';

// ============================================================================
// PLUGIN CARD COMPONENT
// ============================================================================

interface PluginCardProps {
  entry: PluginStoreEntry;
  installed?: Plugin;
  onInstall: () => void;
  onUninstall: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onViewDetails: () => void;
}

const PluginCard: React.FC<PluginCardProps> = ({
  entry,
  installed,
  onInstall,
  onUninstall,
  onActivate,
  onDeactivate,
  onViewDetails
}) => {
  const { manifest, rating, ratingCount, downloads, featured, verified, pricing } = entry;
  const categoryInfo = CATEGORY_INFO[manifest.category];
  const riskLevel = calculateRiskLevel(manifest.permissions);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
      onClick={onViewDetails}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${categoryInfo.color}20` }}
        >
          {manifest.icon || categoryInfo.icon.replace('fa-', '')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white truncate">{manifest.name}</h3>
            {verified && (
              <i className="fa-solid fa-badge-check text-blue-400 text-xs" title="Verified" />
            )}
            {featured && (
              <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] rounded">
                Featured
              </span>
            )}
          </div>
          <p className="text-xs text-white/50">{manifest.author.name}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-white/70 mb-3 line-clamp-2">{manifest.description}</p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-white/50 mb-3">
        <div className="flex items-center gap-1">
          <i className="fa-solid fa-star text-yellow-400" />
          <span>{rating.toFixed(1)}</span>
          <span>({ratingCount})</span>
        </div>
        <div className="flex items-center gap-1">
          <i className="fa-solid fa-download" />
          <span>{formatDownloads(downloads)}</span>
        </div>
        <div
          className="px-1.5 py-0.5 rounded text-[10px]"
          style={{ backgroundColor: `${categoryInfo.color}20`, color: categoryInfo.color }}
        >
          {categoryInfo.label}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {manifest.tags.slice(0, 3).map(tag => (
          <span key={tag} className="px-1.5 py-0.5 bg-white/5 text-white/50 text-[10px] rounded">
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        {/* Pricing */}
        <div className="text-sm">
          {pricing?.type === 'free' && (
            <span className="text-green-400">Free</span>
          )}
          {pricing?.type === 'paid' && (
            <span className="text-white">${pricing.price}</span>
          )}
          {pricing?.type === 'freemium' && (
            <span className="text-blue-400">Freemium</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {installed ? (
            <>
              {installed.status === 'active' ? (
                <button
                  onClick={onDeactivate}
                  className="px-3 py-1.5 text-xs bg-white/10 text-white/70 rounded hover:bg-white/20"
                >
                  Disable
                </button>
              ) : (
                <button
                  onClick={onActivate}
                  className="px-3 py-1.5 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                >
                  Enable
                </button>
              )}
              <button
                onClick={onUninstall}
                className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
              >
                Remove
              </button>
            </>
          ) : (
            <button
              onClick={onInstall}
              className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Install
            </button>
          )}
        </div>
      </div>

      {/* Risk indicator */}
      {riskLevel !== 'low' && (
        <div className={`mt-2 text-[10px] ${riskLevel === 'high' ? 'text-red-400' : 'text-yellow-400'}`}>
          <i className="fa-solid fa-shield-halved mr-1" />
          {riskLevel === 'high' ? 'High permissions required' : 'Some permissions required'}
        </div>
      )}
    </motion.div>
  );
};

// ============================================================================
// INSTALLED PLUGIN ROW
// ============================================================================

interface InstalledPluginRowProps {
  plugin: Plugin;
  onActivate: () => void;
  onDeactivate: () => void;
  onUninstall: () => void;
  onSettings: () => void;
}

const InstalledPluginRow: React.FC<InstalledPluginRowProps> = ({
  plugin,
  onActivate,
  onDeactivate,
  onUninstall,
  onSettings
}) => {
  const { manifest, status } = plugin;
  const statusInfo = STATUS_INFO[status];
  const categoryInfo = CATEGORY_INFO[manifest.category];

  return (
    <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
        style={{ backgroundColor: `${categoryInfo.color}20` }}
      >
        {manifest.icon || '?'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-white truncate">{manifest.name}</h4>
          <span className="text-xs text-white/40">v{manifest.version}</span>
        </div>
        <p className="text-xs text-white/50 truncate">{manifest.description}</p>
      </div>

      {/* Status */}
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs shrink-0"
        style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}
      >
        <i className={`fa-solid ${statusInfo.icon}`} />
        <span>{statusInfo.label}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {status === 'active' ? (
          <button
            onClick={onDeactivate}
            className="p-2 text-white/50 hover:text-white/80 hover:bg-white/10 rounded"
            title="Disable"
          >
            <i className="fa-solid fa-pause" />
          </button>
        ) : status === 'disabled' || status === 'installed' ? (
          <button
            onClick={onActivate}
            className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded"
            title="Enable"
          >
            <i className="fa-solid fa-play" />
          </button>
        ) : null}
        <button
          onClick={onSettings}
          className="p-2 text-white/50 hover:text-white/80 hover:bg-white/10 rounded"
          title="Settings"
        >
          <i className="fa-solid fa-gear" />
        </button>
        <button
          onClick={onUninstall}
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
          title="Uninstall"
        >
          <i className="fa-solid fa-trash" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// PLUGIN DETAILS MODAL
// ============================================================================

interface PluginDetailsModalProps {
  entry: PluginStoreEntry;
  installed?: Plugin;
  onClose: () => void;
  onInstall: () => void;
  onUninstall: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
}

const PluginDetailsModal: React.FC<PluginDetailsModalProps> = ({
  entry,
  installed,
  onClose,
  onInstall,
  onUninstall,
  onActivate,
  onDeactivate
}) => {
  const { manifest, rating, ratingCount, downloads, verified, changelog, pricing } = entry;
  const categoryInfo = CATEGORY_INFO[manifest.category];
  const [activeTab, setActiveTab] = useState<'overview' | 'permissions' | 'changelog'>('overview');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1a1a2e] rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: `${categoryInfo.color}20` }}
            >
              {manifest.icon || '?'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white">{manifest.name}</h2>
                {verified && (
                  <i className="fa-solid fa-badge-check text-blue-400" title="Verified" />
                )}
              </div>
              <p className="text-white/50 text-sm mb-2">by {manifest.author.name}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-yellow-400">
                  <i className="fa-solid fa-star" />
                  <span>{rating.toFixed(1)}</span>
                  <span className="text-white/40">({ratingCount})</span>
                </div>
                <div className="flex items-center gap-1 text-white/50">
                  <i className="fa-solid fa-download" />
                  <span>{formatDownloads(downloads)}</span>
                </div>
                <span className="text-white/40">v{manifest.version}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg"
            >
              <i className="fa-solid fa-times" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['overview', 'permissions', 'changelog'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[40vh]">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <p className="text-white/70">{manifest.description}</p>

              <div className="flex flex-wrap gap-2">
                {manifest.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <h4 className="text-xs text-white/40 uppercase mb-1">Category</h4>
                  <p className="text-white" style={{ color: categoryInfo.color }}>
                    {categoryInfo.label}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs text-white/40 uppercase mb-1">License</h4>
                  <p className="text-white">{manifest.license || 'Not specified'}</p>
                </div>
                {manifest.homepage && (
                  <div>
                    <h4 className="text-xs text-white/40 uppercase mb-1">Website</h4>
                    <a href={manifest.homepage} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      Visit
                    </a>
                  </div>
                )}
                {manifest.repository && (
                  <div>
                    <h4 className="text-xs text-white/40 uppercase mb-1">Repository</h4>
                    <a href={manifest.repository} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      GitHub
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-3">
              <p className="text-sm text-white/50 mb-4">
                This plugin requires the following permissions:
              </p>
              {manifest.permissions.map(perm => {
                const info = PERMISSION_INFO[perm];
                return (
                  <div key={perm} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      info.risk === 'high' ? 'bg-red-400' :
                      info.risk === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <div>
                      <h4 className="text-white font-medium text-sm">{info.label}</h4>
                      <p className="text-white/50 text-xs">{info.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'changelog' && (
            <div className="space-y-4">
              {changelog.map((release, i) => (
                <div key={i} className="border-b border-white/10 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-medium">v{release.version}</span>
                    <span className="text-white/40 text-xs">{release.date}</span>
                  </div>
                  <ul className="space-y-1">
                    {release.changes.map((change, j) => (
                      <li key={j} className="text-white/70 text-sm flex items-start gap-2">
                        <span className="text-white/30">•</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <div>
            {pricing?.type === 'free' && (
              <span className="text-green-400 font-medium">Free</span>
            )}
            {pricing?.type === 'paid' && (
              <span className="text-white font-medium">${pricing.price} {pricing.currency}</span>
            )}
            {pricing?.type === 'freemium' && (
              <span className="text-blue-400 font-medium">Free with premium features</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {installed ? (
              <>
                {installed.status === 'active' ? (
                  <button
                    onClick={onDeactivate}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                  >
                    Disable
                  </button>
                ) : (
                  <button
                    onClick={onActivate}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Enable
                  </button>
                )}
                <button
                  onClick={onUninstall}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                >
                  Uninstall
                </button>
              </>
            ) : (
              <button
                onClick={onInstall}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
              >
                Install Plugin
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// PLUGIN SYSTEM SETTINGS
// ============================================================================

interface PluginSettingsPanelProps {
  settings: any;
  onUpdate: (updates: any) => void;
}

const PluginSettingsPanel: React.FC<PluginSettingsPanelProps> = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
        <div>
          <h4 className="text-white font-medium">Enable Plugin System</h4>
          <p className="text-xs text-white/50">Allow plugins to extend app functionality</p>
        </div>
        <button
          onClick={() => onUpdate({ enabled: !settings.enabled })}
          className={`w-12 h-6 rounded-full transition-colors ${
            settings.enabled ? 'bg-blue-500' : 'bg-white/20'
          }`}
        >
          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
            settings.enabled ? 'translate-x-6' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
        <div>
          <h4 className="text-white font-medium">Auto-Update Plugins</h4>
          <p className="text-xs text-white/50">Automatically update plugins when new versions are available</p>
        </div>
        <button
          onClick={() => onUpdate({ autoUpdate: !settings.autoUpdate })}
          className={`w-12 h-6 rounded-full transition-colors ${
            settings.autoUpdate ? 'bg-blue-500' : 'bg-white/20'
          }`}
        >
          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
            settings.autoUpdate ? 'translate-x-6' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
        <div>
          <h4 className="text-white font-medium">Allow Third-Party Plugins</h4>
          <p className="text-xs text-white/50">Install plugins from external sources</p>
        </div>
        <button
          onClick={() => onUpdate({ allowThirdParty: !settings.allowThirdParty })}
          className={`w-12 h-6 rounded-full transition-colors ${
            settings.allowThirdParty ? 'bg-blue-500' : 'bg-white/20'
          }`}
        >
          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
            settings.allowThirdParty ? 'translate-x-6' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
        <div>
          <h4 className="text-white font-medium">Sandbox Mode</h4>
          <p className="text-xs text-white/50">Run plugins in isolated environment for security</p>
        </div>
        <button
          onClick={() => onUpdate({ sandboxMode: !settings.sandboxMode })}
          className={`w-12 h-6 rounded-full transition-colors ${
            settings.sandboxMode ? 'bg-blue-500' : 'bg-white/20'
          }`}
        >
          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
            settings.sandboxMode ? 'translate-x-6' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
        <div>
          <h4 className="text-white font-medium">Update Notifications</h4>
          <p className="text-xs text-white/50">Show notifications when plugin updates are available</p>
        </div>
        <button
          onClick={() => onUpdate({ notifyUpdates: !settings.notifyUpdates })}
          className={`w-12 h-6 rounded-full transition-colors ${
            settings.notifyUpdates ? 'bg-blue-500' : 'bg-white/20'
          }`}
        >
          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
            settings.notifyUpdates ? 'translate-x-6' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      <div className="p-3 bg-white/5 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-white font-medium">Maximum Plugins</h4>
            <p className="text-xs text-white/50">Limit the number of installed plugins</p>
          </div>
          <span className="text-white font-mono">{settings.maxPlugins}</span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          step="10"
          value={settings.maxPlugins}
          onChange={e => onUpdate({ maxPlugins: Number(e.target.value) })}
          className="w-full"
        />
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PLUGIN SYSTEM PANEL
// ============================================================================

type TabType = 'browse' | 'installed' | 'settings';
type SortOption = 'downloads' | 'rating' | 'name';

export const PluginSystemPanel: React.FC = () => {
  const {
    plugins,
    settings,
    storePlugins,
    installPlugin,
    uninstallPlugin,
    activatePlugin,
    deactivatePlugin,
    updateSettings,
    searchStore,
    isInstalled,
    statistics,
    featuredPlugins
  } = usePluginSystem();

  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('downloads');
  const [selectedPlugin, setSelectedPlugin] = useState<PluginStoreEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter and sort plugins
  const filteredPlugins = useMemo(() => {
    let result = storePlugins;

    // Search
    if (searchQuery) {
      result = searchPlugins(result, searchQuery);
    }

    // Category filter
    result = filterByCategory(result, selectedCategory);

    // Sort
    result = sortPlugins(result, sortBy);

    return result;
  }, [storePlugins, searchQuery, selectedCategory, sortBy]);

  const handleInstall = async (entry: PluginStoreEntry) => {
    setIsLoading(true);
    try {
      await installPlugin(entry);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUninstall = async (pluginId: string) => {
    setIsLoading(true);
    try {
      await uninstallPlugin(pluginId);
      setSelectedPlugin(null);
    } finally {
      setIsLoading(false);
    }
  };

  const categories: (PluginCategory | 'all')[] = [
    'all', 'design', 'productivity', 'export', 'integration', 'ai',
    'collaboration', 'animation', 'accessibility', 'developer', 'other'
  ];

  return (
    <div className="h-full flex flex-col bg-[#0f0f1a]">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-puzzle-piece text-purple-400" />
            Plugins
          </h2>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span>{statistics.active} active</span>
            <span>•</span>
            <span>{statistics.total} installed</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
          {(['browse', 'installed', 'settings'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab}
              {tab === 'installed' && plugins.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded-full">
                  {plugins.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div className="h-full flex flex-col">
            {/* Search & Filters */}
            <div className="p-4 space-y-3 border-b border-white/10">
              {/* Search */}
              <div className="relative">
                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search plugins..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => {
                  const info = cat === 'all' ? null : CATEGORY_INFO[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/5 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      {cat === 'all' ? 'All' : info?.label}
                    </button>
                  );
                })}
              </div>

              {/* Sort */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">{filteredPlugins.length} plugins</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white focus:outline-none"
                >
                  <option value="downloads">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Plugin Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Featured Section */}
              {!searchQuery && selectedCategory === 'all' && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                    <i className="fa-solid fa-star text-yellow-400" />
                    Featured
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {featuredPlugins.slice(0, 3).map(entry => (
                      <PluginCard
                        key={entry.manifest.id}
                        entry={entry}
                        installed={plugins.find(p => p.manifest.id === entry.manifest.id)}
                        onInstall={() => handleInstall(entry)}
                        onUninstall={() => handleUninstall(entry.manifest.id)}
                        onActivate={() => activatePlugin(entry.manifest.id)}
                        onDeactivate={() => deactivatePlugin(entry.manifest.id)}
                        onViewDetails={() => setSelectedPlugin(entry)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Plugins */}
              <div className="grid grid-cols-1 gap-3">
                {filteredPlugins
                  .filter(p => searchQuery || selectedCategory !== 'all' || !p.featured)
                  .map(entry => (
                    <PluginCard
                      key={entry.manifest.id}
                      entry={entry}
                      installed={plugins.find(p => p.manifest.id === entry.manifest.id)}
                      onInstall={() => handleInstall(entry)}
                      onUninstall={() => handleUninstall(entry.manifest.id)}
                      onActivate={() => activatePlugin(entry.manifest.id)}
                      onDeactivate={() => deactivatePlugin(entry.manifest.id)}
                      onViewDetails={() => setSelectedPlugin(entry)}
                    />
                  ))}
              </div>

              {filteredPlugins.length === 0 && (
                <div className="text-center py-12">
                  <i className="fa-solid fa-search text-4xl text-white/20 mb-3" />
                  <p className="text-white/50">No plugins found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Installed Tab */}
        {activeTab === 'installed' && (
          <div className="h-full overflow-y-auto p-4">
            {plugins.length > 0 ? (
              <div className="space-y-3">
                {plugins.map(plugin => (
                  <InstalledPluginRow
                    key={plugin.manifest.id}
                    plugin={plugin}
                    onActivate={() => activatePlugin(plugin.manifest.id)}
                    onDeactivate={() => deactivatePlugin(plugin.manifest.id)}
                    onUninstall={() => handleUninstall(plugin.manifest.id)}
                    onSettings={() => {}}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <i className="fa-solid fa-puzzle-piece text-4xl text-white/20 mb-3" />
                <p className="text-white/50 mb-2">No plugins installed</p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="text-blue-400 text-sm hover:underline"
                >
                  Browse plugins
                </button>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="h-full overflow-y-auto p-4">
            <PluginSettingsPanel
              settings={settings}
              onUpdate={updateSettings}
            />
          </div>
        )}
      </div>

      {/* Plugin Details Modal */}
      <AnimatePresence>
        {selectedPlugin && (
          <PluginDetailsModal
            entry={selectedPlugin}
            installed={plugins.find(p => p.manifest.id === selectedPlugin.manifest.id)}
            onClose={() => setSelectedPlugin(null)}
            onInstall={() => handleInstall(selectedPlugin)}
            onUninstall={() => handleUninstall(selectedPlugin.manifest.id)}
            onActivate={() => activatePlugin(selectedPlugin.manifest.id)}
            onDeactivate={() => deactivatePlugin(selectedPlugin.manifest.id)}
          />
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1a2e] rounded-lg">
            <i className="fa-solid fa-spinner animate-spin text-blue-400" />
            <span className="text-white">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PLUGIN STATUS INDICATOR
// ============================================================================

export const PluginStatusIndicator: React.FC<{ status: PluginStatus }> = ({ status }) => {
  const info = STATUS_INFO[status];

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs"
      style={{ backgroundColor: `${info.color}20`, color: info.color }}
    >
      <i className={`fa-solid ${info.icon}`} />
      <span>{info.label}</span>
    </div>
  );
};

// ============================================================================
// PLUGIN TOOLBAR BUTTON
// ============================================================================

export const PluginToolbarButton: React.FC<{
  onClick: () => void;
  activeCount?: number;
}> = ({ onClick, activeCount = 0 }) => {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
      title="Plugins"
    >
      <i className="fa-solid fa-puzzle-piece" />
      {activeCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">
          {activeCount}
        </span>
      )}
    </button>
  );
};

export default PluginSystemPanel;
