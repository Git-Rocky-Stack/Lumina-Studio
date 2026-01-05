// Keyboard Shortcuts Panel - Manage shortcuts, macros, and vim mode
import React, { useState, useEffect, useCallback } from 'react';
import {
  Keyboard,
  Command,
  Play,
  Square,
  Plus,
  Edit2,
  Trash2,
  Search,
  Settings,
  Zap,
  Terminal,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Save,
} from 'lucide-react';
import {
  keyboardShortcutsService,
  KeyboardShortcut,
  RecordedMacro,
  VimState,
} from '../../services/keyboardShortcutsService';

interface ShortcutsPanelProps {
  onClose?: () => void;
}

export const ShortcutsPanel: React.FC<ShortcutsPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'macros' | 'vim'>('shortcuts');
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [macros, setMacros] = useState<RecordedMacro[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('general');
  const [isRecording, setIsRecording] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<KeyboardShortcut | null>(null);
  const [vimEnabled, setVimEnabled] = useState(false);
  const [vimState, setVimState] = useState<VimState | null>(null);

  // Load data
  useEffect(() => {
    loadShortcuts();
    loadMacros();
    setVimEnabled(keyboardShortcutsService.isVimEnabled());
  }, []);

  const loadShortcuts = async () => {
    const data = await keyboardShortcutsService.getUserShortcuts();
    setShortcuts(data);
  };

  const loadMacros = async () => {
    const data = await keyboardShortcutsService.getUserMacros();
    setMacros(data);
  };

  // Group shortcuts by category
  const shortcutsByCategory = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  // Filter shortcuts
  const filteredShortcuts = searchQuery
    ? shortcuts.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.keyCombo.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  // Macro recording
  const handleStartRecording = () => {
    keyboardShortcutsService.startRecording();
    setIsRecording(true);
  };

  const handleStopRecording = async () => {
    const steps = keyboardShortcutsService.stopRecording();
    setIsRecording(false);

    if (steps.length > 0) {
      const name = prompt('Enter a name for this macro:');
      if (name) {
        await keyboardShortcutsService.saveMacro(name, steps);
        loadMacros();
      }
    }
  };

  const handlePlayMacro = async (macro: RecordedMacro) => {
    await keyboardShortcutsService.playMacro(macro);
  };

  const handleDeleteMacro = async (macroId: string) => {
    if (confirm('Delete this macro?')) {
      await keyboardShortcutsService.deleteMacro(macroId);
      loadMacros();
    }
  };

  // Vim mode
  const handleToggleVim = () => {
    if (vimEnabled) {
      keyboardShortcutsService.disableVimMode();
      setVimEnabled(false);
      setVimState(null);
    } else {
      keyboardShortcutsService.enableVimMode();
      setVimEnabled(true);
    }
  };

  // Shortcut editing
  const handleEditShortcut = (shortcut: KeyboardShortcut) => {
    setEditingShortcut(shortcut);
  };

  const handleSaveShortcut = async (shortcut: KeyboardShortcut) => {
    await keyboardShortcutsService.updateShortcut(shortcut.id, {
      keyCombo: shortcut.keyCombo,
      isEnabled: shortcut.isEnabled,
    });
    setEditingShortcut(null);
    loadShortcuts();
  };

  const handleDeleteShortcut = async (id: string) => {
    if (confirm('Delete this shortcut?')) {
      await keyboardShortcutsService.deleteShortcut(id);
      loadShortcuts();
    }
  };

  const handleResetShortcuts = async () => {
    if (confirm('Reset all shortcuts to defaults?')) {
      // Implementation would reset to defaults
      loadShortcuts();
    }
  };

  const formatKeyCombo = (combo: string): React.ReactNode => {
    const parts = combo.split('+');
    return (
      <span className="flex items-center gap-1">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono border border-gray-200 dark:border-gray-600">
              {part.charAt(0).toUpperCase() + part.slice(1)}
            </kbd>
            {i < parts.length - 1 && <span className="text-gray-400">+</span>}
          </React.Fragment>
        ))}
      </span>
    );
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    general: <Command size={14} />,
    editing: <Edit2 size={14} />,
    navigation: <Zap size={14} />,
    tools: <Settings size={14} />,
    vim: <Terminal size={14} />,
    custom: <Plus size={14} />,
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-indigo-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <span className="sr-only">Close</span>
            &times;
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['shortcuts', 'macros', 'vim'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'shortcuts' && <Keyboard className="inline w-4 h-4 mr-1" />}
            {tab === 'macros' && <Play className="inline w-4 h-4 mr-1" />}
            {tab === 'vim' && <Terminal className="inline w-4 h-4 mr-1" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Shortcuts Tab */}
        {activeTab === 'shortcuts' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search shortcuts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setEditingShortcut({} as KeyboardShortcut)}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600"
              >
                <Plus size={14} />
                Add Custom
              </button>
              <button
                onClick={handleResetShortcuts}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            </div>

            {/* Shortcuts List */}
            {filteredShortcuts ? (
              <div className="space-y-2">
                {filteredShortcuts.map(shortcut => (
                  <ShortcutItem
                    key={shortcut.id}
                    shortcut={shortcut}
                    onEdit={() => handleEditShortcut(shortcut)}
                    onDelete={() => handleDeleteShortcut(shortcut.id)}
                    formatKeyCombo={formatKeyCombo}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(shortcutsByCategory).map(([category, categoryShortcuts]) => (
                  <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {categoryIcons[category]}
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                        <span className="text-gray-400">({categoryShortcuts.length})</span>
                      </div>
                      {expandedCategory === category ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                    {expandedCategory === category && (
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {categoryShortcuts.map(shortcut => (
                          <ShortcutItem
                            key={shortcut.id}
                            shortcut={shortcut}
                            onEdit={() => handleEditShortcut(shortcut)}
                            onDelete={() => handleDeleteShortcut(shortcut.id)}
                            formatKeyCombo={formatKeyCombo}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Macros Tab */}
        {activeTab === 'macros' && (
          <div className="space-y-4">
            {/* Recording Controls */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {isRecording ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-red-500">Recording...</span>
                  </div>
                  <button
                    onClick={handleStopRecording}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                  >
                    <Square size={14} />
                    Stop
                  </button>
                </>
              ) : (
                <button
                  onClick={handleStartRecording}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600"
                >
                  <Play size={14} />
                  Record Macro
                </button>
              )}
            </div>

            {/* Macros List */}
            <div className="space-y-2">
              {macros.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Command className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No macros recorded yet</p>
                  <p className="text-xs mt-1">Click "Record Macro" to create one</p>
                </div>
              ) : (
                macros.map(macro => (
                  <MacroItem
                    key={macro.id}
                    macro={macro}
                    onPlay={() => handlePlayMacro(macro)}
                    onDelete={() => handleDeleteMacro(macro.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Vim Tab */}
        {activeTab === 'vim' && (
          <div className="space-y-4">
            {/* Vim Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Terminal className={`w-5 h-5 ${vimEnabled ? 'text-green-500' : 'text-gray-400'}`} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Vim Mode</p>
                  <p className="text-xs text-gray-500">Enable vim-style navigation and editing</p>
                </div>
              </div>
              <button
                onClick={handleToggleVim}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  vimEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    vimEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {vimEnabled && (
              <>
                {/* Vim Status */}
                <div className="p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span>Mode: NORMAL</span>
                    <span className="text-gray-500">:help for commands</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Buffer:</span>
                    <span className="text-white">_</span>
                  </div>
                </div>

                {/* Vim Commands Reference */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Reference</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      { key: 'h/j/k/l', desc: 'Move left/down/up/right' },
                      { key: 'i', desc: 'Insert mode' },
                      { key: 'v', desc: 'Visual mode' },
                      { key: 'Esc', desc: 'Normal mode' },
                      { key: 'dd', desc: 'Delete element' },
                      { key: 'yy', desc: 'Copy element' },
                      { key: 'p', desc: 'Paste' },
                      { key: 'u', desc: 'Undo' },
                      { key: 'Ctrl+r', desc: 'Redo' },
                      { key: 'gg', desc: 'Go to first element' },
                      { key: 'G', desc: 'Go to last element' },
                      { key: ':w', desc: 'Save' },
                    ].map(cmd => (
                      <div key={cmd.key} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">
                          {cmd.key}
                        </kbd>
                        <span className="text-gray-600 dark:text-gray-400">{cmd.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Edit Shortcut Modal */}
      {editingShortcut && (
        <ShortcutEditModal
          shortcut={editingShortcut}
          onSave={handleSaveShortcut}
          onClose={() => setEditingShortcut(null)}
        />
      )}
    </div>
  );
};

// Shortcut Item Component
interface ShortcutItemProps {
  shortcut: KeyboardShortcut;
  onEdit: () => void;
  onDelete: () => void;
  formatKeyCombo: (combo: string) => React.ReactNode;
}

const ShortcutItem: React.FC<ShortcutItemProps> = ({ shortcut, onEdit, onDelete, formatKeyCombo }) => (
  <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${shortcut.isEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
      <span className="text-sm text-gray-700 dark:text-gray-300">{shortcut.name}</span>
    </div>
    <div className="flex items-center gap-2">
      {formatKeyCombo(shortcut.keyCombo)}
      <button onClick={onEdit} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
        <Edit2 size={14} className="text-gray-400" />
      </button>
      {shortcut.category === 'custom' && (
        <button onClick={onDelete} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
          <Trash2 size={14} className="text-red-400" />
        </button>
      )}
    </div>
  </div>
);

// Macro Item Component
interface MacroItemProps {
  macro: RecordedMacro;
  onPlay: () => void;
  onDelete: () => void;
}

const MacroItem: React.FC<MacroItemProps> = ({ macro, onPlay, onDelete }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: macro.color + '20' }}
      >
        <Command size={16} style={{ color: macro.color }} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{macro.name}</p>
        <p className="text-xs text-gray-500">
          {macro.steps.length} steps
          {macro.timesUsed > 0 && ` • Used ${macro.timesUsed} times`}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={onPlay}
        className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
      >
        <Play size={14} />
      </button>
      <button
        onClick={onDelete}
        className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
      >
        <Trash2 size={14} />
      </button>
    </div>
  </div>
);

// Shortcut Edit Modal
interface ShortcutEditModalProps {
  shortcut: KeyboardShortcut;
  onSave: (shortcut: KeyboardShortcut) => void;
  onClose: () => void;
}

const ShortcutEditModal: React.FC<ShortcutEditModalProps> = ({ shortcut, onSave, onClose }) => {
  const [keyCombo, setKeyCombo] = useState(shortcut.keyCombo || '');
  const [isRecording, setIsRecording] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();
    e.stopPropagation();

    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');

    const key = e.key.toLowerCase();
    if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
      parts.push(key);
      setKeyCombo(parts.join('+'));
      setIsRecording(false);
    }
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isRecording, handleKeyDown]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {shortcut.id ? 'Edit Shortcut' : 'Add Custom Shortcut'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Key Combination
            </label>
            <div
              onClick={() => setIsRecording(true)}
              className={`px-4 py-3 bg-gray-50 dark:bg-gray-900 border rounded-lg cursor-pointer ${
                isRecording
                  ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {isRecording ? (
                <span className="text-indigo-500">Press keys...</span>
              ) : keyCombo ? (
                <span className="font-mono">{keyCombo}</span>
              ) : (
                <span className="text-gray-400">Click to record</span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave({ ...shortcut, keyCombo })}
              disabled={!keyCombo}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsPanel;
