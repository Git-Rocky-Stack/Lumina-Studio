// ============================================================================
// KEYBOARD SHORTCUTS PANEL - UI COMPONENTS
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { shortcutsManager } from '../../services/shortcutsService';
import {
  CATEGORY_INFO,
  formatShortcut,
  formatKeyForDisplay,
  getModifierName
} from '../../types/shortcuts';
import type {
  KeyboardShortcut,
  ShortcutCategory,
  ShortcutPreset,
  ShortcutConflict,
  ModifierKeys
} from '../../types/shortcuts';

// ============================================================================
// DESIGN SYSTEM TOKENS
// ============================================================================

const colors = {
  background: {
    primary: '#0a0a0f',
    secondary: '#12121a',
    tertiary: '#1a1a24',
    elevated: '#1e1e2a',
    hover: '#252532'
  },
  border: {
    subtle: '#2a2a3a',
    default: '#3a3a4a',
    focus: '#6366f1'
  },
  text: {
    primary: '#ffffff',
    secondary: '#a0a0b0',
    tertiary: '#707080',
    muted: '#505060'
  },
  accent: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444'
  }
};

// ============================================================================
// MAIN SHORTCUTS PANEL
// ============================================================================

interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [activeCategory, setActiveCategory] = useState<ShortcutCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingShortcut, setEditingShortcut] = useState<KeyboardShortcut | null>(null);
  const [conflicts, setConflicts] = useState<ShortcutConflict[]>([]);
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'presets'>('shortcuts');
  const [presets, setPresets] = useState<ShortcutPreset[]>([]);
  const [activePreset, setActivePreset] = useState<ShortcutPreset | undefined>();

  // Load shortcuts and presets
  useEffect(() => {
    setShortcuts(shortcutsManager.getAllShortcuts());
    setConflicts(shortcutsManager.getAllConflicts());
    setPresets(shortcutsManager.getPresets());
    setActivePreset(shortcutsManager.getActivePreset());

    shortcutsManager.setOnShortcutsChange((updated) => {
      setShortcuts(updated);
      setConflicts(shortcutsManager.getAllConflicts());
    });

    return () => {
      shortcutsManager.setOnShortcutsChange(() => {});
    };
  }, []);

  // Filter shortcuts
  const filteredShortcuts = useMemo(() => {
    let result = shortcuts;

    if (activeCategory !== 'all') {
      result = result.filter(s => s.category === activeCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.action.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [shortcuts, activeCategory, searchQuery]);

  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, KeyboardShortcut[]> = {};

    filteredShortcuts.forEach(shortcut => {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = [];
      }
      groups[shortcut.category].push(shortcut);
    });

    return groups;
  }, [filteredShortcuts]);

  // Handle shortcut update
  const handleShortcutUpdate = useCallback((
    id: string,
    key: string,
    modifiers: ModifierKeys
  ) => {
    const result = shortcutsManager.updateShortcut(id, key, modifiers);
    if (!result.success && result.conflict) {
      // Show conflict notification
      console.warn('Shortcut conflict:', result.conflict);
    }
    setEditingShortcut(null);
  }, []);

  // Handle preset apply
  const handleApplyPreset = useCallback((presetId: string) => {
    shortcutsManager.applyPreset(presetId);
    setActivePreset(shortcutsManager.getActivePreset());
  }, []);

  // Handle reset all
  const handleResetAll = useCallback(() => {
    shortcutsManager.resetAllShortcuts();
  }, []);

  // Export config
  const handleExport = useCallback(() => {
    const config = shortcutsManager.exportConfig();
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lumina-shortcuts.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Import config
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          shortcutsManager.importConfig(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-xl shadow-2xl"
          style={{ backgroundColor: colors.background.secondary }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: colors.border.subtle }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.accent.primary + '20' }}
              >
                <i className="fa-solid fa-keyboard" style={{ color: colors.accent.primary }} />
              </div>
              <div>
                <h2 className="type-subsection" style={{ color: colors.text.primary }}>
                  Keyboard Shortcuts
                </h2>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  Customize your workflow with custom shortcuts
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: colors.text.secondary }}
            >
              <i className="fa-solid fa-xmark text-lg" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div
            className="flex border-b"
            style={{ borderColor: colors.border.subtle }}
          >
            <button
              onClick={() => setActiveTab('shortcuts')}
              className="px-6 py-3 type-body-sm font-semibold transition-colors relative"
              style={{
                color: activeTab === 'shortcuts' ? colors.accent.primary : colors.text.secondary
              }}
            >
              Shortcuts
              {activeTab === 'shortcuts' && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: colors.accent.primary }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className="px-6 py-3 type-body-sm font-semibold transition-colors relative"
              style={{
                color: activeTab === 'presets' ? colors.accent.primary : colors.text.secondary
              }}
            >
              Presets
              {activeTab === 'presets' && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: colors.accent.primary }}
                />
              )}
            </button>

            {/* Actions */}
            <div className="ml-auto flex items-center gap-2 px-4">
              <button
                onClick={handleImport}
                className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                style={{
                  backgroundColor: colors.background.tertiary,
                  color: colors.text.secondary
                }}
              >
                <i className="fa-solid fa-upload mr-1.5" />
                Import
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                style={{
                  backgroundColor: colors.background.tertiary,
                  color: colors.text.secondary
                }}
              >
                <i className="fa-solid fa-download mr-1.5" />
                Export
              </button>
              <button
                onClick={handleResetAll}
                className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                style={{
                  backgroundColor: colors.accent.error + '20',
                  color: colors.accent.error
                }}
              >
                <i className="fa-solid fa-rotate-left mr-1.5" />
                Reset All
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex h-[calc(85vh-140px)]">
            {activeTab === 'shortcuts' ? (
              <>
                {/* Category Sidebar */}
                <div
                  className="w-48 border-r overflow-y-auto"
                  style={{ borderColor: colors.border.subtle }}
                >
                  <div className="p-2">
                    <CategoryButton
                      label="All Shortcuts"
                      icon="fa-list"
                      isActive={activeCategory === 'all'}
                      onClick={() => setActiveCategory('all')}
                      count={shortcuts.length}
                    />
                    {(Object.keys(CATEGORY_INFO) as ShortcutCategory[]).map(category => (
                      <CategoryButton
                        key={category}
                        label={CATEGORY_INFO[category].label}
                        icon={CATEGORY_INFO[category].icon}
                        isActive={activeCategory === category}
                        onClick={() => setActiveCategory(category)}
                        count={shortcuts.filter(s => s.category === category).length}
                      />
                    ))}
                  </div>

                  {/* Conflicts Warning */}
                  {conflicts.length > 0 && (
                    <div className="mx-2 mt-4 p-3 rounded-lg" style={{ backgroundColor: colors.accent.warning + '15' }}>
                      <div className="flex items-center gap-2 text-sm" style={{ color: colors.accent.warning }}>
                        <i className="fa-solid fa-exclamation-triangle" />
                        <span>{conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Shortcuts List */}
                <div className="flex-1 overflow-y-auto">
                  {/* Search */}
                  <div className="p-4 border-b" style={{ borderColor: colors.border.subtle }}>
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{ backgroundColor: colors.background.tertiary }}
                    >
                      <i className="fa-solid fa-search text-sm" style={{ color: colors.text.tertiary }} />
                      <input
                        type="text"
                        placeholder="Search shortcuts..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none"
                        style={{ color: colors.text.primary }}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="p-1 rounded hover:bg-white/10"
                        >
                          <i className="fa-solid fa-xmark text-xs" style={{ color: colors.text.tertiary }} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Shortcuts */}
                  <div className="p-4">
                    {activeCategory === 'all' ? (
                      Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                        <div key={category} className="mb-6">
                          <h3
                            className="type-body-sm font-semibold mb-3 flex items-center gap-2"
                            style={{ color: colors.text.secondary }}
                          >
                            <i className={`fa-solid ${CATEGORY_INFO[category as ShortcutCategory].icon}`} />
                            {CATEGORY_INFO[category as ShortcutCategory].label}
                          </h3>
                          <div className="space-y-1">
                            {categoryShortcuts.map(shortcut => (
                              <ShortcutItem
                                key={shortcut.id}
                                shortcut={shortcut}
                                isEditing={editingShortcut?.id === shortcut.id}
                                onEdit={() => setEditingShortcut(shortcut)}
                                onUpdate={handleShortcutUpdate}
                                onCancel={() => setEditingShortcut(null)}
                                hasConflict={conflicts.some(
                                  c => c.shortcut1.id === shortcut.id || c.shortcut2.id === shortcut.id
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="space-y-1">
                        {filteredShortcuts.map(shortcut => (
                          <ShortcutItem
                            key={shortcut.id}
                            shortcut={shortcut}
                            isEditing={editingShortcut?.id === shortcut.id}
                            onEdit={() => setEditingShortcut(shortcut)}
                            onUpdate={handleShortcutUpdate}
                            onCancel={() => setEditingShortcut(null)}
                            hasConflict={conflicts.some(
                              c => c.shortcut1.id === shortcut.id || c.shortcut2.id === shortcut.id
                            )}
                          />
                        ))}
                      </div>
                    )}

                    {filteredShortcuts.length === 0 && (
                      <div className="text-center py-12">
                        <i
                          className="fa-solid fa-search text-3xl mb-3"
                          style={{ color: colors.text.tertiary }}
                        />
                        <p style={{ color: colors.text.secondary }}>No shortcuts found</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Presets Tab */
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-4">
                  {presets.map(preset => (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      isActive={activePreset?.id === preset.id}
                      onApply={() => handleApplyPreset(preset.id)}
                      onDelete={!preset.isBuiltIn ? () => {
                        shortcutsManager.deletePreset(preset.id);
                        setPresets(shortcutsManager.getPresets());
                      } : undefined}
                    />
                  ))}

                  {/* Create New Preset */}
                  <CreatePresetCard
                    onCreate={(name, description) => {
                      shortcutsManager.createPreset(name, description);
                      setPresets(shortcutsManager.getPresets());
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Shortcut Editor Modal */}
        {editingShortcut && (
          <ShortcutEditor
            shortcut={editingShortcut}
            onSave={(key, modifiers) => handleShortcutUpdate(editingShortcut.id, key, modifiers)}
            onCancel={() => setEditingShortcut(null)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// ============================================================================
// CATEGORY BUTTON
// ============================================================================

interface CategoryButtonProps {
  label: string;
  icon: string;
  isActive: boolean;
  onClick: () => void;
  count: number;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({
  label,
  icon,
  isActive,
  onClick,
  count
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors"
    style={{
      backgroundColor: isActive ? colors.accent.primary + '20' : 'transparent',
      color: isActive ? colors.accent.primary : colors.text.secondary
    }}
  >
    <div className="flex items-center gap-2">
      <i className={`fa-solid ${icon} text-xs`} />
      <span>{label}</span>
    </div>
    <span
      className="text-xs px-1.5 py-0.5 rounded"
      style={{ backgroundColor: colors.background.tertiary }}
    >
      {count}
    </span>
  </button>
);

// ============================================================================
// SHORTCUT ITEM
// ============================================================================

interface ShortcutItemProps {
  shortcut: KeyboardShortcut;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (id: string, key: string, modifiers: ModifierKeys) => void;
  onCancel: () => void;
  hasConflict: boolean;
}

const ShortcutItem: React.FC<ShortcutItemProps> = ({
  shortcut,
  isEditing,
  onEdit,
  onUpdate,
  onCancel,
  hasConflict
}) => {
  const handleToggle = () => {
    shortcutsManager.setShortcutEnabled(shortcut.id, !shortcut.enabled);
  };

  const handleReset = () => {
    shortcutsManager.resetShortcut(shortcut.id);
  };

  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg group transition-colors"
      style={{
        backgroundColor: hasConflict ? colors.accent.warning + '10' : 'transparent'
      }}
      onMouseEnter={e => {
        if (!hasConflict) e.currentTarget.style.backgroundColor = colors.background.tertiary;
      }}
      onMouseLeave={e => {
        if (!hasConflict) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div className="flex items-center gap-3">
        {/* Toggle */}
        <button
          onClick={handleToggle}
          className="w-8 h-5 rounded-full transition-colors relative"
          style={{
            backgroundColor: shortcut.enabled ? colors.accent.primary : colors.background.tertiary
          }}
        >
          <motion.div
            animate={{ x: shortcut.enabled ? 14 : 2 }}
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
          />
        </button>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <span
              className="type-body-sm font-semibold"
              style={{
                color: shortcut.enabled ? colors.text.primary : colors.text.tertiary
              }}
            >
              {shortcut.name}
            </span>
            {shortcut.isCustom && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: colors.accent.secondary + '20',
                  color: colors.accent.secondary
                }}
              >
                Custom
              </span>
            )}
            {hasConflict && (
              <i
                className="fa-solid fa-exclamation-triangle text-xs"
                style={{ color: colors.accent.warning }}
              />
            )}
          </div>
          {shortcut.description && (
            <p className="text-xs" style={{ color: colors.text.tertiary }}>
              {shortcut.description}
            </p>
          )}
        </div>
      </div>

      {/* Shortcut Key */}
      <div className="flex items-center gap-2">
        <ShortcutKey shortcut={shortcut} onClick={onEdit} />

        {/* Reset button */}
        {shortcut.isCustom && (
          <button
            onClick={handleReset}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded transition-all hover:bg-white/10"
            title="Reset to default"
          >
            <i className="fa-solid fa-rotate-left text-xs" style={{ color: colors.text.tertiary }} />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SHORTCUT KEY DISPLAY
// ============================================================================

interface ShortcutKeyProps {
  shortcut: KeyboardShortcut;
  onClick?: () => void;
}

const ShortcutKey: React.FC<ShortcutKeyProps> = ({ shortcut, onClick }) => {
  const parts: string[] = [];

  if (shortcut.modifiers.ctrl) parts.push(getModifierName('ctrl'));
  if (shortcut.modifiers.alt) parts.push(getModifierName('alt'));
  if (shortcut.modifiers.shift) parts.push(getModifierName('shift'));
  if (shortcut.modifiers.meta) parts.push(getModifierName('meta'));
  parts.push(formatKeyForDisplay(shortcut.key));

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-white/10"
      style={{ backgroundColor: colors.background.tertiary }}
    >
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          <span
            className="px-1.5 py-0.5 rounded text-xs font-mono font-medium"
            style={{
              backgroundColor: colors.background.elevated,
              color: colors.text.primary,
              border: `1px solid ${colors.border.subtle}`
            }}
          >
            {part}
          </span>
          {index < parts.length - 1 && (
            <span className="text-xs" style={{ color: colors.text.tertiary }}>+</span>
          )}
        </React.Fragment>
      ))}
    </button>
  );
};

// ============================================================================
// SHORTCUT EDITOR
// ============================================================================

interface ShortcutEditorProps {
  shortcut: KeyboardShortcut;
  onSave: (key: string, modifiers: ModifierKeys) => void;
  onCancel: () => void;
}

const ShortcutEditor: React.FC<ShortcutEditorProps> = ({
  shortcut,
  onSave,
  onCancel
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentKey, setCurrentKey] = useState(shortcut.key);
  const [currentModifiers, setCurrentModifiers] = useState<ModifierKeys>({ ...shortcut.modifiers });

  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Ignore modifier-only presses
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

      setCurrentKey(e.key);
      setCurrentModifiers({
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey
      });
      setIsRecording(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-60 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onCancel}
    >
      <motion.div
        className="w-full max-w-md p-6 rounded-xl shadow-2xl"
        style={{ backgroundColor: colors.background.secondary }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="type-subsection mb-2" style={{ color: colors.text.primary }}>
          Edit Shortcut
        </h3>
        <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
          {shortcut.name}
        </p>

        {/* Recording Area */}
        <button
          onClick={() => setIsRecording(true)}
          className="w-full py-8 rounded-lg border-2 border-dashed mb-6 transition-colors"
          style={{
            backgroundColor: isRecording ? colors.accent.primary + '10' : colors.background.tertiary,
            borderColor: isRecording ? colors.accent.primary : colors.border.default
          }}
        >
          {isRecording ? (
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <i
                  className="fa-solid fa-keyboard text-3xl mb-2"
                  style={{ color: colors.accent.primary }}
                />
              </motion.div>
              <p className="text-sm" style={{ color: colors.accent.primary }}>
                Press any key combination...
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              {currentModifiers.ctrl && <KeyBadge label={getModifierName('ctrl')} />}
              {currentModifiers.alt && <KeyBadge label={getModifierName('alt')} />}
              {currentModifiers.shift && <KeyBadge label={getModifierName('shift')} />}
              {currentModifiers.meta && <KeyBadge label={getModifierName('meta')} />}
              <KeyBadge label={formatKeyForDisplay(currentKey)} isMain />
            </div>
          )}
        </button>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg type-body-sm font-semibold transition-colors"
            style={{
              backgroundColor: colors.background.tertiary,
              color: colors.text.secondary
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(currentKey, currentModifiers)}
            className="flex-1 py-2 rounded-lg type-body-sm font-semibold transition-colors"
            style={{
              backgroundColor: colors.accent.primary,
              color: '#ffffff'
            }}
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// KEY BADGE
// ============================================================================

interface KeyBadgeProps {
  label: string;
  isMain?: boolean;
}

const KeyBadge: React.FC<KeyBadgeProps> = ({ label, isMain }) => (
  <span
    className="px-3 py-2 rounded-lg text-sm font-mono font-semibold"
    style={{
      backgroundColor: isMain ? colors.accent.primary : colors.background.elevated,
      color: isMain ? '#ffffff' : colors.text.primary,
      border: `1px solid ${isMain ? colors.accent.primary : colors.border.default}`
    }}
  >
    {label}
  </span>
);

// ============================================================================
// PRESET CARD
// ============================================================================

interface PresetCardProps {
  preset: ShortcutPreset;
  isActive: boolean;
  onApply: () => void;
  onDelete?: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  isActive,
  onApply,
  onDelete
}) => (
  <div
    className="p-4 rounded-xl border transition-colors"
    style={{
      backgroundColor: isActive ? colors.accent.primary + '10' : colors.background.tertiary,
      borderColor: isActive ? colors.accent.primary : colors.border.subtle
    }}
  >
    <div className="flex items-start justify-between mb-3">
      <div>
        <h4 className="font-medium" style={{ color: colors.text.primary }}>
          {preset.name}
        </h4>
        {preset.description && (
          <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
            {preset.description}
          </p>
        )}
      </div>
      {isActive && (
        <span
          className="text-xs px-2 py-1 rounded-full"
          style={{
            backgroundColor: colors.accent.success + '20',
            color: colors.accent.success
          }}
        >
          Active
        </span>
      )}
    </div>

    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: colors.text.tertiary }}>
        {Object.keys(preset.shortcuts).length} custom shortcut
        {Object.keys(preset.shortcuts).length !== 1 ? 's' : ''}
      </span>

      <div className="flex gap-2">
        {onDelete && (
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-xs rounded-lg transition-colors"
            style={{
              backgroundColor: colors.accent.error + '20',
              color: colors.accent.error
            }}
          >
            Delete
          </button>
        )}
        {!isActive && (
          <button
            onClick={onApply}
            className="px-3 py-1.5 text-xs rounded-lg transition-colors"
            style={{
              backgroundColor: colors.accent.primary,
              color: '#ffffff'
            }}
          >
            Apply
          </button>
        )}
      </div>
    </div>
  </div>
);

// ============================================================================
// CREATE PRESET CARD
// ============================================================================

interface CreatePresetCardProps {
  onCreate: (name: string, description?: string) => void;
}

const CreatePresetCard: React.FC<CreatePresetCardProps> = ({ onCreate }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim() || undefined);
    setName('');
    setDescription('');
    setIsCreating(false);
  };

  if (!isCreating) {
    return (
      <button
        onClick={() => setIsCreating(true)}
        className="p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center min-h-[140px] transition-colors hover:border-solid"
        style={{
          borderColor: colors.border.default,
          color: colors.text.secondary
        }}
      >
        <i className="fa-solid fa-plus text-xl mb-2" />
        <span className="text-sm">Create Preset</span>
      </button>
    );
  }

  return (
    <div
      className="p-4 rounded-xl border"
      style={{
        backgroundColor: colors.background.tertiary,
        borderColor: colors.accent.primary
      }}
    >
      <input
        type="text"
        placeholder="Preset name"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
        style={{
          backgroundColor: colors.background.secondary,
          color: colors.text.primary,
          border: `1px solid ${colors.border.subtle}`
        }}
        autoFocus
      />
      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
        style={{
          backgroundColor: colors.background.secondary,
          color: colors.text.primary,
          border: `1px solid ${colors.border.subtle}`
        }}
      />
      <div className="flex gap-2">
        <button
          onClick={() => setIsCreating(false)}
          className="flex-1 py-2 text-sm rounded-lg"
          style={{
            backgroundColor: colors.background.secondary,
            color: colors.text.secondary
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="flex-1 py-2 text-sm rounded-lg transition-colors"
          style={{
            backgroundColor: name.trim() ? colors.accent.primary : colors.background.secondary,
            color: name.trim() ? '#ffffff' : colors.text.tertiary
          }}
        >
          Create
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// QUICK SHORTCUTS CHEATSHEET
// ============================================================================

interface ShortcutCheatsheetProps {
  category?: ShortcutCategory;
  maxItems?: number;
}

export const ShortcutCheatsheet: React.FC<ShortcutCheatsheetProps> = ({
  category,
  maxItems = 10
}) => {
  const shortcuts = useMemo(() => {
    let result = shortcutsManager.getAllShortcuts().filter(s => s.enabled);
    if (category) {
      result = result.filter(s => s.category === category);
    }
    return result.slice(0, maxItems);
  }, [category, maxItems]);

  return (
    <div
      className="p-4 rounded-xl"
      style={{ backgroundColor: colors.background.secondary }}
    >
      <h4
        className="type-body-sm font-semibold mb-3 flex items-center gap-2"
        style={{ color: colors.text.secondary }}
      >
        <i className="fa-solid fa-keyboard" />
        Keyboard Shortcuts
      </h4>
      <div className="space-y-2">
        {shortcuts.map(shortcut => (
          <div
            key={shortcut.id}
            className="flex items-center justify-between text-sm"
          >
            <span style={{ color: colors.text.secondary }}>{shortcut.name}</span>
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{
                backgroundColor: colors.background.tertiary,
                color: colors.text.primary
              }}
            >
              {formatShortcut(shortcut)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// FLOATING SHORTCUT INDICATOR
// ============================================================================

interface ShortcutIndicatorProps {
  action: string;
  className?: string;
}

export const ShortcutIndicator: React.FC<ShortcutIndicatorProps> = ({
  action,
  className = ''
}) => {
  const shortcut = useMemo(() => {
    const shortcuts = shortcutsManager.getAllShortcuts();
    return shortcuts.find(s => s.action === action && s.enabled);
  }, [action]);

  if (!shortcut) return null;

  return (
    <span
      className={`text-xs font-mono px-1.5 py-0.5 rounded ${className}`}
      style={{
        backgroundColor: colors.background.tertiary,
        color: colors.text.tertiary
      }}
    >
      {formatShortcut(shortcut)}
    </span>
  );
};

export default KeyboardShortcutsPanel;
