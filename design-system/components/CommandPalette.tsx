import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Command, ArrowRight, CornerDownLeft,
  Folder, FileText, Settings, Palette, Video, Image, Wand2,
  Layers, Type, Download, Share2, Undo, Redo, Copy, Scissors,
  Trash2, Eye, EyeOff, Lock, Unlock, Grid, List, Home, Star,
  Clock, Zap, Globe, ChevronRight
} from 'lucide-react';
import { springPresets } from '../animations';
import { useSoundEffect } from '../sounds';

// Types
interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string[];
  category?: string;
  keywords?: string[];
  action?: () => void;
  children?: CommandItem[];
}

interface CommandGroup {
  label: string;
  items: CommandItem[];
}

interface CommandPaletteContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  registerCommands: (commands: CommandItem[]) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

// Provider
export const CommandPaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [commands, setCommands] = useState<CommandItem[]>([]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  const registerCommands = useCallback((newCommands: CommandItem[]) => {
    setCommands(prev => [...prev, ...newCommands]);
  }, []);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return (
    <CommandPaletteContext.Provider value={{ isOpen, open, close, toggle, registerCommands }}>
      {children}
      <CommandPalette isOpen={isOpen} onClose={close} commands={commands} />
    </CommandPaletteContext.Provider>
  );
};

export const useCommandPalette = () => {
  const context = useContext(CommandPaletteContext);
  if (!context) throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  return context;
};

// Default commands
const defaultCommands: CommandGroup[] = [
  {
    label: 'Navigation',
    items: [
      { id: 'home', label: 'Go to Home', icon: <Home size={18} />, shortcut: ['⌘', 'H'], keywords: ['home', 'main', 'dashboard'] },
      { id: 'workspace', label: 'Open Workspace', icon: <Folder size={18} />, shortcut: ['⌘', 'D'], keywords: ['workspace', 'files', 'projects'] },
      { id: 'canvas', label: 'Design Canvas', icon: <Layers size={18} />, shortcut: ['⌘', '1'], keywords: ['canvas', 'design', 'editor'] },
      { id: 'video', label: 'Video Studio', icon: <Video size={18} />, shortcut: ['⌘', '2'], keywords: ['video', 'studio', 'create'] },
      { id: 'stock', label: 'Stock Generator', icon: <Image size={18} />, shortcut: ['⌘', 'S'], keywords: ['stock', 'images', 'ai', 'generate'] },
      { id: 'settings', label: 'Settings', icon: <Settings size={18} />, shortcut: ['⌘', ','], keywords: ['settings', 'preferences', 'config'] },
    ],
  },
  {
    label: 'Actions',
    items: [
      { id: 'new-project', label: 'New Project', icon: <FileText size={18} />, shortcut: ['⌘', 'N'], keywords: ['new', 'create', 'project'] },
      { id: 'ai-generate', label: 'AI Generate', icon: <Wand2 size={18} />, shortcut: ['⌘', 'G'], keywords: ['ai', 'generate', 'create', 'magic'] },
      { id: 'export', label: 'Export', icon: <Download size={18} />, shortcut: ['⌘', 'E'], keywords: ['export', 'download', 'save'] },
      { id: 'share', label: 'Share', icon: <Share2 size={18} />, shortcut: ['⌘', 'Shift', 'S'], keywords: ['share', 'collaborate', 'send'] },
    ],
  },
  {
    label: 'Edit',
    items: [
      { id: 'undo', label: 'Undo', icon: <Undo size={18} />, shortcut: ['⌘', 'Z'], keywords: ['undo', 'back'] },
      { id: 'redo', label: 'Redo', icon: <Redo size={18} />, shortcut: ['⌘', 'Shift', 'Z'], keywords: ['redo', 'forward'] },
      { id: 'copy', label: 'Copy', icon: <Copy size={18} />, shortcut: ['⌘', 'C'], keywords: ['copy', 'duplicate'] },
      { id: 'cut', label: 'Cut', icon: <Scissors size={18} />, shortcut: ['⌘', 'X'], keywords: ['cut', 'remove'] },
      { id: 'delete', label: 'Delete', icon: <Trash2 size={18} />, shortcut: ['Del'], keywords: ['delete', 'remove', 'trash'] },
    ],
  },
  {
    label: 'View',
    items: [
      { id: 'toggle-sidebar', label: 'Toggle Sidebar', icon: <Grid size={18} />, shortcut: ['⌘', 'B'], keywords: ['sidebar', 'toggle', 'hide', 'show'] },
      { id: 'zoom-in', label: 'Zoom In', icon: <Eye size={18} />, shortcut: ['⌘', '+'], keywords: ['zoom', 'in', 'larger'] },
      { id: 'zoom-out', label: 'Zoom Out', icon: <EyeOff size={18} />, shortcut: ['⌘', '-'], keywords: ['zoom', 'out', 'smaller'] },
      { id: 'grid-view', label: 'Grid View', icon: <Grid size={18} />, keywords: ['grid', 'view', 'layout'] },
      { id: 'list-view', label: 'List View', icon: <List size={18} />, keywords: ['list', 'view', 'layout'] },
    ],
  },
  {
    label: 'Quick Actions',
    items: [
      { id: 'recent', label: 'Recent Files', icon: <Clock size={18} />, keywords: ['recent', 'files', 'history'] },
      { id: 'favorites', label: 'Favorites', icon: <Star size={18} />, keywords: ['favorites', 'starred', 'bookmarks'] },
      { id: 'quick-export', label: 'Quick Export', icon: <Zap size={18} />, keywords: ['quick', 'export', 'fast'] },
      { id: 'publish', label: 'Publish to Web', icon: <Globe size={18} />, keywords: ['publish', 'web', 'deploy'] },
    ],
  },
];

// Main Component
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands?: CommandItem[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands = [],
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [breadcrumb, setBreadcrumb] = useState<CommandItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const playSound = useSoundEffect();

  // Flatten commands for searching
  const allItems = React.useMemo(() => {
    const items: CommandItem[] = [];
    defaultCommands.forEach(group => {
      group.items.forEach(item => {
        items.push({ ...item, category: group.label });
      });
    });
    commands.forEach(item => items.push(item));
    return items;
  }, [commands]);

  // Filter items based on query
  const filteredItems = React.useMemo(() => {
    if (!query) {
      // Group items when no query
      return defaultCommands;
    }

    const lowerQuery = query.toLowerCase();
    const matched = allItems.filter(item => {
      const matchLabel = item.label.toLowerCase().includes(lowerQuery);
      const matchKeywords = item.keywords?.some(k => k.toLowerCase().includes(lowerQuery));
      const matchDescription = item.description?.toLowerCase().includes(lowerQuery);
      return matchLabel || matchKeywords || matchDescription;
    });

    return matched.length > 0 ? [{ label: 'Results', items: matched }] : [];
  }, [query, allItems]);

  // Flat list for keyboard navigation
  const flatItems = React.useMemo(() => {
    const items: CommandItem[] = [];
    filteredItems.forEach(group => {
      if ('items' in group) {
        group.items.forEach(item => items.push(item));
      }
    });
    return items;
  }, [filteredItems]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setBreadcrumb([]);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % flatItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + flatItems.length) % flatItems.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          handleSelect(flatItems[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        if (breadcrumb.length > 0) {
          setBreadcrumb(prev => prev.slice(0, -1));
        } else {
          onClose();
        }
        break;
      case 'Backspace':
        if (query === '' && breadcrumb.length > 0) {
          setBreadcrumb(prev => prev.slice(0, -1));
        }
        break;
    }
  }, [flatItems, selectedIndex, breadcrumb, query, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = (item: CommandItem) => {
    playSound('click');

    if (item.children && item.children.length > 0) {
      setBreadcrumb(prev => [...prev, item]);
      setQuery('');
      setSelectedIndex(0);
    } else if (item.action) {
      item.action();
      onClose();
    } else {
      // Default action - could be navigation
      console.log('Selected:', item.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Palette */}
          <motion.div
            className="relative w-full max-w-2xl mx-4 overflow-hidden rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/50 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={springPresets.snappy}
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
              {/* Breadcrumb */}
              {breadcrumb.length > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  {breadcrumb.map((item, i) => (
                    <React.Fragment key={item.id}>
                      <span className="text-zinc-400">{item.label}</span>
                      <ChevronRight size={14} className="text-zinc-400" />
                    </React.Fragment>
                  ))}
                </div>
              )}

              <Search size={20} className="text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search commands..."
                className="flex-1 bg-transparent text-zinc-900 dark:text-white placeholder-zinc-400 outline-none text-base"
              />

              {/* Shortcut hint */}
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">esc</kbd>
                <span>to close</span>
              </div>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="text-zinc-400 dark:text-zinc-500 mb-2">
                    No results found
                  </div>
                  <p className="text-sm text-zinc-400">
                    Try searching for something else
                  </p>
                </div>
              ) : (
                filteredItems.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    {'label' in group && group.label && (
                      <div className="px-4 py-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        {group.label}
                      </div>
                    )}
                    {'items' in group && group.items.map((item, itemIndex) => {
                      const flatIndex = filteredItems
                        .slice(0, groupIndex)
                        .reduce((acc, g) => acc + ('items' in g ? g.items.length : 0), 0) + itemIndex;
                      const isSelected = flatIndex === selectedIndex;

                      return (
                        <motion.button
                          key={item.id}
                          data-index={flatIndex}
                          onClick={() => handleSelect(item)}
                          className={`
                            flex items-center gap-3 w-full px-4 py-2.5 text-left
                            transition-colors
                            ${isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}
                          `}
                          initial={false}
                          animate={{
                            x: isSelected ? 4 : 0,
                          }}
                          transition={{ duration: 0.1 }}
                        >
                          {/* Icon */}
                          <span className={`shrink-0 ${isSelected ? 'text-indigo-500' : 'text-zinc-400'}`}>
                            {item.icon || <Command size={18} />}
                          </span>

                          {/* Label & description */}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{item.label}</div>
                            {item.description && (
                              <div className="text-xs text-zinc-400 truncate">{item.description}</div>
                            )}
                          </div>

                          {/* Shortcut or arrow */}
                          {item.children ? (
                            <ArrowRight size={16} className="text-zinc-400" />
                          ) : item.shortcut ? (
                            <div className="flex items-center gap-0.5">
                              {item.shortcut.map((key, i) => (
                                <kbd
                                  key={i}
                                  className="px-1.5 py-0.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500"
                                >
                                  {key}
                                </kbd>
                              ))}
                            </div>
                          ) : null}
                        </motion.button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-200 dark:border-zinc-700 text-xs text-zinc-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">↵</kbd>
                  select
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Command size={12} />
                <span>Lumina Studio</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook to register custom commands
export const useRegisterCommands = (commands: CommandItem[], deps: any[] = []) => {
  const { registerCommands } = useCommandPalette();

  useEffect(() => {
    registerCommands(commands);
  }, deps);
};

// Trigger button component
export const CommandPaletteTrigger: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { open } = useCommandPalette();

  return (
    <motion.button
      onClick={open}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg
        bg-zinc-100 dark:bg-zinc-800
        text-zinc-500 dark:text-zinc-400
        hover:bg-zinc-200 dark:hover:bg-zinc-700
        transition-colors text-sm
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Search size={14} />
      <span>Search...</span>
      <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-600">
        ⌘K
      </kbd>
    </motion.button>
  );
};

export { CommandPalette };
export default CommandPaletteProvider;
