/**
 * Productivity Features
 * Batch operations, Smart folders, Session recovery, Duplicate project, Archive, Global search
 */

import React, { useState, useEffect, useCallback } from 'react';

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

interface BatchOperation {
  id: string;
  label: string;
  icon: string;
  action: (selectedIds: string[]) => void;
  destructive?: boolean;
}

interface BatchOperationsBarProps {
  selectedCount: number;
  selectedIds: string[];
  operations: BatchOperation[];
  onClearSelection: () => void;
  onSelectAll?: () => void;
  totalCount?: number;
  className?: string;
}

export const BatchOperationsBar: React.FC<BatchOperationsBarProps> = ({
  selectedCount,
  selectedIds,
  operations,
  onClearSelection,
  onSelectAll,
  totalCount,
  className = '',
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300 ${className}`}>
      <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center font-bold">
            {selectedCount}
          </div>
          <div>
            <p className="type-body-sm font-semibold">Selected</p>
            {totalCount && (
              <p className="type-micro text-slate-400">of {totalCount} items</p>
            )}
          </div>
        </div>

        <div className="w-px h-10 bg-slate-700" />

        <div className="flex items-center gap-2">
          {operations.map((op) => (
            <button
              key={op.id}
              onClick={() => op.action(selectedIds)}
              className={`px-4 py-2 rounded-xl type-label flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ${
                op.destructive
                  ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <i className={`fas ${op.icon}`} />
              {op.label}
            </button>
          ))}
        </div>

        <div className="w-px h-10 bg-slate-700" />

        <div className="flex items-center gap-2">
          {onSelectAll && (
            <button
              onClick={onSelectAll}
              className="px-3 py-1.5 type-micro text-slate-400 hover:text-white transition-colors"
            >
              Select All
            </button>
          )}
          <button
            onClick={onClearSelection}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SMART FOLDERS
// ============================================================================

interface SmartFolder {
  id: string;
  name: string;
  icon: string;
  color: string;
  rules: SmartFolderRule[];
  count: number;
}

interface SmartFolderRule {
  field: 'type' | 'date' | 'tag' | 'size' | 'name';
  operator: 'equals' | 'contains' | 'before' | 'after' | 'greater' | 'less';
  value: string;
}

interface SmartFoldersProps {
  folders: SmartFolder[];
  activeId?: string;
  onSelect: (folder: SmartFolder) => void;
  onCreateFolder?: () => void;
  onEditFolder?: (folder: SmartFolder) => void;
  className?: string;
}

export const SmartFolders: React.FC<SmartFoldersProps> = ({
  folders,
  activeId,
  onSelect,
  onCreateFolder,
  onEditFolder,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="type-label text-slate-500">Smart Folders</h4>
        {onCreateFolder && (
          <button
            onClick={onCreateFolder}
            className="w-6 h-6 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-accent hover:text-white transition-all"
          >
            <i className="fas fa-plus text-[10px]" />
          </button>
        )}
      </div>

      {folders.map((folder) => (
        <button
          key={folder.id}
          onClick={() => onSelect(folder)}
          className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all group ${
            activeId === folder.id
              ? 'bg-accent/10 border border-accent/20'
              : 'bg-white border border-slate-100 hover:border-slate-200'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center`}
            style={{ backgroundColor: `${folder.color}20`, color: folder.color }}
          >
            <i className={`fas ${folder.icon} text-sm`} />
          </div>
          <div className="flex-1 text-left">
            <p className={`type-label ${activeId === folder.id ? 'text-accent' : 'text-slate-700'}`}>
              {folder.name}
            </p>
            <p className="type-micro text-slate-400">{folder.count} items</p>
          </div>
          {onEditFolder && (
            <button
              onClick={(e) => { e.stopPropagation(); onEditFolder(folder); }}
              className="w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-all"
            >
              <i className="fas fa-ellipsis text-[10px]" />
            </button>
          )}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// SESSION RECOVERY
// ============================================================================

interface RecoverableSession {
  id: string;
  name: string;
  lastModified: Date;
  type: 'canvas' | 'video' | 'document';
  thumbnail?: string;
  unsavedChanges: number;
}

interface SessionRecoveryModalProps {
  sessions: RecoverableSession[];
  onRecover: (session: RecoverableSession) => void;
  onDiscard: (sessionId: string) => void;
  onDiscardAll: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export const SessionRecoveryModal: React.FC<SessionRecoveryModalProps> = ({
  sessions,
  onRecover,
  onDiscard,
  onDiscardAll,
  onClose,
  isOpen,
}) => {
  if (!isOpen || sessions.length === 0) return null;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return date.toLocaleDateString();
  };

  const typeIcons = {
    canvas: 'fa-paintbrush',
    video: 'fa-video',
    document: 'fa-file-lines',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
              <i className="fas fa-clock-rotate-left text-amber-600 text-xl" />
            </div>
            <div>
              <h3 className="type-subsection text-slate-900">Recover Unsaved Work</h3>
              <p className="type-body-sm text-slate-500">
                {sessions.length} unsaved session{sessions.length > 1 ? 's' : ''} found
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 max-h-80 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="w-16 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                {session.thumbnail ? (
                  <img src={session.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <i className={`fas ${typeIcons[session.type]} text-slate-400`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="type-body-sm font-semibold text-slate-700 truncate">{session.name}</p>
                <p className="type-caption text-slate-400">
                  {formatTime(session.lastModified)} • {session.unsavedChanges} changes
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onRecover(session)}
                  className="px-3 py-1.5 bg-accent text-white rounded-lg type-label hover:brightness-110 transition-all"
                >
                  Recover
                </button>
                <button
                  onClick={() => onDiscard(session.id)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg type-label hover:bg-slate-200 transition-all"
                >
                  Discard
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-between">
          <button
            onClick={onDiscardAll}
            className="px-4 py-2 text-rose-500 type-body-sm font-semibold hover:bg-rose-50 rounded-lg transition-colors"
          >
            Discard All
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg type-body-sm font-semibold hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PROJECT ACTIONS (Duplicate, Archive)
// ============================================================================

interface Project {
  id: string;
  name: string;
  thumbnail?: string;
  createdAt: Date;
  modifiedAt: Date;
  isArchived?: boolean;
}

interface ProjectActionsMenuProps {
  project: Project;
  onDuplicate: (project: Project) => void;
  onArchive: (project: Project) => void;
  onUnarchive: (project: Project) => void;
  onDelete: (project: Project) => void;
  onRename: (project: Project) => void;
  onShare?: (project: Project) => void;
  position?: { x: number; y: number };
  onClose: () => void;
}

export const ProjectActionsMenu: React.FC<ProjectActionsMenuProps> = ({
  project,
  onDuplicate,
  onArchive,
  onUnarchive,
  onDelete,
  onRename,
  onShare,
  position,
  onClose,
}) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  const actions = [
    { id: 'rename', label: 'Rename', icon: 'fa-pencil', action: () => onRename(project) },
    { id: 'duplicate', label: 'Duplicate', icon: 'fa-copy', action: () => onDuplicate(project) },
    ...(onShare ? [{ id: 'share', label: 'Share', icon: 'fa-share-nodes', action: () => onShare(project) }] : []),
    { id: 'divider1', divider: true },
    project.isArchived
      ? { id: 'unarchive', label: 'Unarchive', icon: 'fa-box-open', action: () => onUnarchive(project) }
      : { id: 'archive', label: 'Archive', icon: 'fa-box-archive', action: () => onArchive(project) },
    { id: 'divider2', divider: true },
    { id: 'delete', label: 'Delete', icon: 'fa-trash', action: () => onDelete(project), destructive: true },
  ];

  return (
    <div
      className="fixed z-50 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 min-w-[180px] animate-in fade-in zoom-in-95 duration-150"
      style={position ? { top: position.y, left: position.x } : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      onClick={(e) => e.stopPropagation()}
    >
      {actions.map((action) =>
        'divider' in action && action.divider ? (
          <div key={action.id} className="my-1 border-t border-slate-100" />
        ) : (
          <button
            key={action.id}
            onClick={() => { (action as any).action(); onClose(); }}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
              (action as any).destructive
                ? 'text-rose-500 hover:bg-rose-50'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <i className={`fas ${(action as any).icon} w-4 text-center`} />
            {(action as any).label}
          </button>
        )
      )}
    </div>
  );
};

// ============================================================================
// GLOBAL SEARCH
// ============================================================================

interface SearchResult {
  id: string;
  type: 'project' | 'asset' | 'layer' | 'command' | 'help';
  title: string;
  subtitle?: string;
  icon: string;
  action: () => void;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => SearchResult[];
  recentSearches?: string[];
  className?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  onSearch,
  recentSearches = [],
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (query) {
      setResults(onSearch(query));
      setSelectedIndex(0);
    } else {
      setResults([]);
    }
  }, [query, onSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        results[selectedIndex].action();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  if (!isOpen) return null;

  const typeColors: Record<SearchResult['type'], string> = {
    project: 'bg-accent text-accent',
    asset: 'bg-emerald-500 text-emerald-500',
    layer: 'bg-amber-500 text-amber-500',
    command: 'bg-violet-500 text-violet-500',
    help: 'bg-slate-500 text-slate-500',
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 ${className}`}>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-top-4 duration-300">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <i className="fas fa-search text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, assets, commands..."
              className="flex-1 text-lg outline-none"
              autoFocus
            />
            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-500">ESC</kbd>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            results.map((result, idx) => (
              <button
                key={result.id}
                onClick={() => { result.action(); onClose(); }}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${
                  idx === selectedIndex ? 'bg-slate-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeColors[result.type].split(' ')[0]}/10`}>
                  <i className={`fas ${result.icon} text-sm ${typeColors[result.type].split(' ')[1]}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className="type-body-sm font-semibold text-slate-700">{result.title}</p>
                  {result.subtitle && (
                    <p className="type-caption text-slate-400">{result.subtitle}</p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">
                  {result.type}
                </span>
              </button>
            ))
          ) : query ? (
            <div className="p-8 text-center text-slate-400">
              <i className="fas fa-search text-2xl mb-2 opacity-50" />
              <p className="text-sm">No results found</p>
            </div>
          ) : recentSearches.length > 0 ? (
            <div className="p-4">
              <p className="type-label text-slate-400 mb-3">Recent</p>
              {recentSearches.map((search, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(search)}
                  className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                >
                  <i className="fas fa-clock text-slate-300 text-xs" />
                  {search}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              <i className="fas fa-lightbulb text-2xl mb-2 opacity-50" />
              <p className="text-sm">Start typing to search</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-4 text-[10px] text-slate-400">
          <span><kbd className="px-1.5 py-0.5 bg-slate-100 rounded">↑↓</kbd> Navigate</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-100 rounded">↵</kbd> Select</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-100 rounded">ESC</kbd> Close</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// THEME TOGGLE
// ============================================================================

interface ThemeToggleProps {
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onThemeChange,
  className = '',
}) => {
  const themes = [
    { id: 'light', icon: 'fa-sun', label: 'Light' },
    { id: 'dark', icon: 'fa-moon', label: 'Dark' },
    { id: 'system', icon: 'fa-laptop', label: 'System' },
  ] as const;

  return (
    <div className={`flex gap-1 p-1 bg-slate-100 rounded-xl ${className}`}>
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => onThemeChange(t.id)}
          className={`flex-1 py-2 px-3 rounded-lg type-label flex items-center justify-center gap-1.5 transition-all ${
            theme === t.id
              ? 'bg-white text-accent shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <i className={`fas ${t.icon}`} />
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );
};

export default {
  BatchOperationsBar,
  SmartFolders,
  SessionRecoveryModal,
  ProjectActionsMenu,
  GlobalSearch,
  ThemeToggle,
};
