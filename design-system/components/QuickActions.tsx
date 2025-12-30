import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  shortcut?: string;
  color?: string;
  onClick: () => void;
}

interface QuickActionsBarProps {
  actions: QuickAction[];
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  actions,
  position = 'bottom-right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-40 ${className}`}>
      {/* Action buttons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-16 right-0 flex flex-col-reverse gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHoveredAction(action.id)}
                onMouseLeave={() => setHoveredAction(null)}
                className="relative flex items-center gap-3"
              >
                {/* Label tooltip */}
                <AnimatePresence>
                  {hoveredAction === action.id && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="absolute right-full mr-3 px-3 py-1.5 bg-slate-900 text-white type-body-sm rounded-lg whitespace-nowrap"
                    >
                      {action.label}
                      {action.shortcut && (
                        <span className="ml-2 text-slate-400">{action.shortcut}</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action button */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  style={{ backgroundColor: action.color || 'var(--accent)' }}
                >
                  <i className={`fas ${action.icon} text-white`} />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-accent text-white shadow-xl flex items-center justify-center hover:shadow-2xl transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        <i className="fas fa-plus text-xl" />
      </motion.button>
    </div>
  );
};

// Smart Search Component
interface SearchResult {
  id: string;
  type: 'project' | 'asset' | 'template' | 'action' | 'setting';
  title: string;
  subtitle?: string;
  icon?: string;
  onClick: () => void;
}

interface SmartSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => SearchResult[];
  recentSearches?: string[];
  className?: string;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  isOpen,
  onClose,
  onSearch,
  recentSearches = [],
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (value.trim()) {
        const searchResults = onSearch(value);
        setResults(searchResults);
        setSelectedIndex(0);
      } else {
        setResults([]);
      }
    },
    [onSearch]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      results[selectedIndex].onClick();
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const typeIcons = {
    project: 'fa-folder',
    asset: 'fa-image',
    template: 'fa-clone',
    action: 'fa-bolt',
    setting: 'fa-cog',
  };

  const typeColors = {
    project: 'text-blue-500',
    asset: 'text-emerald-500',
    template: 'text-purple-500',
    action: 'text-amber-500',
    setting: 'text-slate-500',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            onClick={e => e.stopPropagation()}
            className={`relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden ${className}`}
          >
            {/* Search Input */}
            <div className="flex items-center gap-4 p-4 border-b border-slate-200 dark:border-slate-700">
              <i className="fas fa-search text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={e => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search everything..."
                className="flex-1 bg-transparent text-lg outline-none text-slate-900 dark:text-white placeholder-slate-400"
                autoFocus
              />
              <kbd className="px-2 py-1 type-caption bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {results.length > 0 ? (
                <div className="p-2">
                  {results.map((result, index) => (
                    <motion.button
                      key={result.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => {
                        result.onClick();
                        onClose();
                      }}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl transition-colors ${
                        selectedIndex === index
                          ? 'bg-accent/10 text-accent'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 ${typeColors[result.type]}`}
                      >
                        <i className={`fas ${result.icon || typeIcons[result.type]}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="type-body-sm text-slate-500">{result.subtitle}</div>
                        )}
                      </div>
                      <span className="type-caption text-slate-400 capitalize">{result.type}</span>
                    </motion.button>
                  ))}
                </div>
              ) : query ? (
                <div className="p-8 text-center text-slate-500">
                  <i className="fas fa-search text-3xl mb-3 opacity-30" />
                  <p>No results found for "{query}"</p>
                </div>
              ) : (
                <div className="p-4">
                  {recentSearches.length > 0 && (
                    <>
                      <div className="type-label text-slate-400 mb-2 px-2">
                        Recent Searches
                      </div>
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleSearch(search)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                        >
                          <i className="fas fa-clock text-slate-400" />
                          <span className="text-slate-600 dark:text-slate-300">{search}</span>
                        </button>
                      ))}
                    </>
                  )}

                  <div className="type-label text-slate-400 mb-2 px-2 mt-4">
                    Quick Actions
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: 'fa-plus', label: 'New Project', shortcut: 'Ctrl+N' },
                      { icon: 'fa-upload', label: 'Upload File', shortcut: 'Ctrl+U' },
                      { icon: 'fa-image', label: 'AI Generate', shortcut: 'Ctrl+G' },
                      { icon: 'fa-cog', label: 'Settings', shortcut: 'Ctrl+,' },
                    ].map(action => (
                      <button
                        key={action.label}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <i className={`fas ${action.icon} text-accent`} />
                        <span className="flex-1 type-body-sm text-slate-700 dark:text-slate-300">
                          {action.label}
                        </span>
                        <kbd className="type-caption text-slate-400">{action.shortcut}</kbd>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between type-caption text-slate-400">
              <div className="flex items-center gap-4">
                <span>
                  <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">↑↓</kbd>{' '}
                  Navigate
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">↵</kbd>{' '}
                  Select
                </span>
              </div>
              <span>Powered by Lumina Search</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Favorites/Bookmarks System
interface Favorite {
  id: string;
  type: 'project' | 'asset' | 'template';
  title: string;
  thumbnail?: string;
  icon?: string;
}

interface FavoritesBarProps {
  favorites: Favorite[];
  onSelect: (favorite: Favorite) => void;
  onRemove: (id: string) => void;
  className?: string;
}

export const FavoritesBar: React.FC<FavoritesBarProps> = ({
  favorites,
  onSelect,
  onRemove,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto py-2 ${className}`}>
      {favorites.map(favorite => (
        <motion.div
          key={favorite.id}
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="group relative flex-shrink-0"
        >
          <button
            onClick={() => onSelect(favorite)}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-accent transition-colors"
          >
            {favorite.thumbnail ? (
              <img
                src={favorite.thumbnail}
                alt={favorite.title}
                className="w-6 h-6 rounded object-cover"
              />
            ) : (
              <i className={`fas ${favorite.icon || 'fa-star'} text-amber-500`} />
            )}
            <span className="type-body-sm text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
              {favorite.title}
            </span>
          </button>

          {/* Remove button */}
          <button
            onClick={e => {
              e.stopPropagation();
              onRemove(favorite.id);
            }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          >
            <i className="fas fa-times text-xs" />
          </button>
        </motion.div>
      ))}

      {favorites.length === 0 && (
        <div className="type-body-sm text-slate-400 italic">
          <i className="fas fa-star mr-2" />
          No favorites yet
        </div>
      )}
    </div>
  );
};

// Recent Files Widget
interface RecentFile {
  id: string;
  title: string;
  type: string;
  thumbnail?: string;
  lastModified: Date;
}

interface RecentFilesProps {
  files: RecentFile[];
  onSelect: (file: RecentFile) => void;
  maxItems?: number;
  className?: string;
}

export const RecentFiles: React.FC<RecentFilesProps> = ({
  files,
  onSelect,
  maxItems = 10,
  className = '',
}) => {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="type-body-sm font-semibold text-slate-700 dark:text-slate-300">
          <i className="fas fa-clock mr-2 text-slate-400" />
          Recent Files
        </h3>
        <button className="type-caption text-accent hover:underline">View All</button>
      </div>

      {files.slice(0, maxItems).map((file, index) => (
        <motion.button
          key={file.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect(file)}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
        >
          {file.thumbnail ? (
            <img
              src={file.thumbnail}
              alt={file.title}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <i className="fas fa-file text-slate-400" />
            </div>
          )}
          <div className="flex-1 text-left">
            <div className="type-body-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-accent transition-colors">
              {file.title}
            </div>
            <div className="type-caption text-slate-400">{formatDate(file.lastModified)}</div>
          </div>
          <span className="type-label text-slate-400">{file.type}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default QuickActionsBar;
