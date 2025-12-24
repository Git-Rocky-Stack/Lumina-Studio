import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudioMode } from '../types';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: string;
  category: 'navigation' | 'action' | 'create' | 'settings';
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  onNavigate: (mode: StudioMode) => void;
  onAction?: (action: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ onNavigate, onAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    { id: 'nav-dashboard', label: 'Go to Dashboard', icon: 'fa-house', category: 'navigation', action: () => onNavigate(StudioMode.WORKSPACE) },
    { id: 'nav-canvas', label: 'Go to Canvas', description: 'Open the design canvas', icon: 'fa-layer-group', category: 'navigation', shortcut: 'G C', action: () => onNavigate(StudioMode.CANVAS) },
    { id: 'nav-assets', label: 'Go to Assets', icon: 'fa-boxes-stacked', category: 'navigation', action: () => onNavigate(StudioMode.ASSETS) },
    { id: 'nav-stock', label: 'Go to AI Stock', description: 'Generate AI images', icon: 'fa-camera-retro', category: 'navigation', shortcut: 'G S', action: () => onNavigate(StudioMode.STOCK) },
    { id: 'nav-video', label: 'Go to Video Studio', icon: 'fa-video', category: 'navigation', action: () => onNavigate(StudioMode.VIDEO) },
    { id: 'nav-photo', label: 'Go to Pro Photo', icon: 'fa-image-portrait', category: 'navigation', action: () => onNavigate(StudioMode.PRO_PHOTO) },
    { id: 'nav-pdf', label: 'Go to PDF Suite', icon: 'fa-file-pdf', category: 'navigation', action: () => onNavigate(StudioMode.PDF) },
    { id: 'nav-brand', label: 'Go to Brand Hub', icon: 'fa-fingerprint', category: 'navigation', action: () => onNavigate(StudioMode.BRANDING) },
    { id: 'nav-marketing', label: 'Go to Marketing', icon: 'fa-bullhorn', category: 'navigation', action: () => onNavigate(StudioMode.MARKETING) },

    // Create actions
    { id: 'create-design', label: 'Create New Design', description: 'Start a blank canvas', icon: 'fa-plus', category: 'create', shortcut: 'N', action: () => { onNavigate(StudioMode.CANVAS); onAction?.('new-design'); } },
    { id: 'create-ai-image', label: 'Generate AI Image', description: 'Create with AI', icon: 'fa-wand-magic-sparkles', category: 'create', action: () => { onNavigate(StudioMode.STOCK); } },
    { id: 'upload-file', label: 'Upload File', description: 'Import assets', icon: 'fa-upload', category: 'create', shortcut: 'U', action: () => { onAction?.('upload'); } },

    // Actions
    { id: 'action-undo', label: 'Undo', icon: 'fa-undo', category: 'action', shortcut: 'Ctrl+Z', action: () => window.dispatchEvent(new Event('lumina-undo')) },
    { id: 'action-redo', label: 'Redo', icon: 'fa-redo', category: 'action', shortcut: 'Ctrl+Shift+Z', action: () => window.dispatchEvent(new Event('lumina-redo')) },
    { id: 'action-export', label: 'Export Design', icon: 'fa-download', category: 'action', shortcut: 'Ctrl+E', action: () => { onAction?.('export'); } },
    { id: 'action-save', label: 'Save to Cloud', icon: 'fa-cloud-arrow-up', category: 'action', shortcut: 'Ctrl+S', action: () => { onAction?.('save'); } },

    // Settings
    { id: 'settings-personalize', label: 'Personalization Settings', icon: 'fa-sliders', category: 'settings', action: () => onNavigate(StudioMode.PERSONALIZATION) },
    { id: 'settings-shortcuts', label: 'Keyboard Shortcuts', icon: 'fa-keyboard', category: 'settings', shortcut: '?', action: () => { onAction?.('shortcuts'); } },
  ], [onNavigate, onAction]);

  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(
      cmd => cmd.label.toLowerCase().includes(lowerQuery) ||
             cmd.description?.toLowerCase().includes(lowerQuery) ||
             cmd.category.includes(lowerQuery)
    );
  }, [commands, query]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const flatCommands = useMemo(() => {
    return Object.values(groupedCommands).flat();
  }, [groupedCommands]);

  // Handle keyboard shortcuts to open palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle navigation within list
  const handleKeyNavigation = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, flatCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          flatCommands[selectedIndex].action();
          setIsOpen(false);
        }
        break;
    }
  }, [flatCommands, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedItem = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedItem?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const executeCommand = (command: CommandItem) => {
    command.action();
    setIsOpen(false);
  };

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    action: 'Actions',
    create: 'Create',
    settings: 'Settings',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <i className="fas fa-search text-slate-500" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                  onKeyDown={handleKeyNavigation}
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-lg"
                  aria-label="Search commands"
                />
                <kbd className="px-2 py-1 rounded bg-white/5 text-slate-500 text-xs font-mono">
                  ESC
                </kbd>
              </div>
            </div>

            {/* Commands list */}
            <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2" role="listbox">
              {flatCommands.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <i className="fas fa-search text-2xl mb-3 block" aria-hidden="true" />
                  <p>No commands found</p>
                </div>
              ) : (
                Object.entries(groupedCommands).map(([category, items]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {categoryLabels[category] || category}
                    </div>
                    {items.map((command, idx) => {
                      const globalIndex = flatCommands.indexOf(command);
                      return (
                        <button
                          key={command.id}
                          data-index={globalIndex}
                          onClick={() => executeCommand(command)}
                          role="option"
                          aria-selected={globalIndex === selectedIndex}
                          className={`w-full px-3 py-3 rounded-xl flex items-center gap-4 transition-all ${
                            globalIndex === selectedIndex
                              ? 'bg-indigo-500/20 text-white'
                              : 'text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            globalIndex === selectedIndex ? 'bg-indigo-500/30' : 'bg-white/5'
                          }`}>
                            <i className={`fas ${command.icon}`} aria-hidden="true" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium">{command.label}</div>
                            {command.description && (
                              <div className="text-sm text-slate-500">{command.description}</div>
                            )}
                          </div>
                          {command.shortcut && (
                            <kbd className="px-2 py-1 rounded bg-white/5 text-slate-500 text-xs font-mono">
                              {command.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5">↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5">Enter</kbd>
                  to select
                </span>
              </div>
              <span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/5">Ctrl</kbd>
                +
                <kbd className="px-1.5 py-0.5 rounded bg-white/5">K</kbd>
                to open
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
