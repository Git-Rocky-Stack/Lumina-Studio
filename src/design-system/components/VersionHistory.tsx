import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, ChevronRight, ChevronDown, RotateCcw,
  Eye, GitBranch, Clock, User, Plus, Minus,
  ArrowLeft, ArrowRight, Check, X
} from 'lucide-react';
import { springPresets } from '../animations';
import { Avatar } from './AvatarGroup';

// Types
interface Version {
  id: string;
  title: string;
  description?: string;
  timestamp: Date;
  author: {
    name: string;
    avatar?: string;
  };
  changes: VersionChange[];
  snapshot?: string; // Base64 preview image
  isCurrent?: boolean;
  isAutoSave?: boolean;
}

interface VersionChange {
  type: 'added' | 'modified' | 'deleted';
  target: string;
  details?: string;
}

// Main Version History Panel
interface VersionHistoryProps {
  versions: Version[];
  currentVersionId: string;
  onRestore: (versionId: string) => void;
  onPreview: (versionId: string) => void;
  onCompare: (versionId1: string, versionId2: string) => void;
  className?: string;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  versions,
  currentVersionId,
  onRestore,
  onPreview,
  onCompare,
  className = '',
}) => {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const toggleExpanded = (id: string) => {
    setExpandedVersions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleVersionSelect = (id: string) => {
    if (!compareMode) return;

    setSelectedVersions(prev => {
      if (prev.includes(id)) {
        return prev.filter(v => v !== id);
      }
      if (prev.length < 2) {
        return [...prev, id];
      }
      return [prev[1], id];
    });
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      onCompare(selectedVersions[0], selectedVersions[1]);
    }
  };

  // Group versions by date
  const groupedVersions = useMemo(() => {
    const groups: Map<string, Version[]> = new Map();

    versions.forEach(version => {
      const date = version.timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(version);
    });

    return groups;
  }, [versions]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <History size={18} className="text-zinc-400" />
          <h2 className="font-semibold text-zinc-900 dark:text-white">Version History</h2>
        </div>

        <motion.button
          onClick={() => {
            setCompareMode(!compareMode);
            setSelectedVersions([]);
          }}
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${compareMode
              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
          `}
          whileTap={{ scale: 0.95 }}
        >
          <GitBranch size={14} className="inline mr-1.5" />
          Compare
        </motion.button>
      </div>

      {/* Compare bar */}
      <AnimatePresence>
        {compareMode && (
          <motion.div
            className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <span className="text-sm text-indigo-600 dark:text-indigo-400">
              Select 2 versions to compare
              {selectedVersions.length > 0 && ` (${selectedVersions.length}/2)`}
            </span>
            {selectedVersions.length === 2 && (
              <motion.button
                onClick={handleCompare}
                className="px-3 py-1 rounded-lg text-sm font-medium bg-indigo-500 text-white"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Compare Selected
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto">
        {Array.from(groupedVersions.entries()).map(([date, dateVersions]) => (
          <div key={date}>
            {/* Date header */}
            <div className="sticky top-0 px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
              {date}
            </div>

            {/* Versions for this date */}
            {dateVersions.map((version, index) => (
              <VersionItem
                key={version.id}
                version={version}
                isExpanded={expandedVersions.has(version.id)}
                isCurrent={version.id === currentVersionId}
                isSelected={selectedVersions.includes(version.id)}
                compareMode={compareMode}
                onToggle={() => toggleExpanded(version.id)}
                onSelect={() => handleVersionSelect(version.id)}
                onRestore={() => onRestore(version.id)}
                onPreview={() => onPreview(version.id)}
                showConnector={index < dateVersions.length - 1}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Individual version item
interface VersionItemProps {
  version: Version;
  isExpanded: boolean;
  isCurrent: boolean;
  isSelected: boolean;
  compareMode: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onRestore: () => void;
  onPreview: () => void;
  showConnector: boolean;
}

const VersionItem: React.FC<VersionItemProps> = ({
  version,
  isExpanded,
  isCurrent,
  isSelected,
  compareMode,
  onToggle,
  onSelect,
  onRestore,
  onPreview,
  showConnector,
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const changeIcons = {
    added: <Plus size={12} className="text-emerald-500" />,
    modified: <ArrowRight size={12} className="text-amber-500" />,
    deleted: <Minus size={12} className="text-red-500" />,
  };

  return (
    <div className="relative">
      {/* Connector line */}
      {showConnector && (
        <div className="absolute left-7 top-12 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-700" />
      )}

      <motion.div
        className={`
          relative mx-3 my-1 rounded-xl transition-colors cursor-pointer
          ${isSelected
            ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500'
            : isCurrent
              ? 'bg-emerald-50 dark:bg-emerald-900/20'
              : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}
        `}
        onClick={compareMode ? onSelect : onToggle}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.1 }}
      >
        <div className="flex items-start gap-3 p-3">
          {/* Timeline dot */}
          <div className="relative z-10 mt-1">
            <motion.div
              className={`
                w-4 h-4 rounded-full border-2
                ${isCurrent
                  ? 'bg-emerald-500 border-emerald-500'
                  : isSelected
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'}
              `}
              animate={{
                scale: isCurrent || isSelected ? 1.2 : 1,
              }}
            >
              {(isCurrent || isSelected) && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: isCurrent ? '#10b981' : '#6366f1' }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-zinc-900 dark:text-white">
                  {version.title}
                </span>
                {isCurrent && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded">
                    CURRENT
                  </span>
                )}
                {version.isAutoSave && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded">
                    AUTO
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <Clock size={12} />
                {formatTime(version.timestamp)}
              </div>
            </div>

            {version.description && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {version.description}
              </p>
            )}

            {/* Author */}
            <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
              <Avatar src={version.author.avatar} name={version.author.name} size="xs" />
              <span>{version.author.name}</span>
            </div>

            {/* Expanded content */}
            <AnimatePresence>
              {isExpanded && !compareMode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  {/* Preview thumbnail */}
                  {version.snapshot && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                      <img src={version.snapshot} alt="Version preview" className="w-full" />
                    </div>
                  )}

                  {/* Changes */}
                  {version.changes.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        Changes
                      </p>
                      {version.changes.slice(0, 5).map((change, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                          {changeIcons[change.type]}
                          <span className="capitalize">{change.type}</span>
                          <span className="font-medium">{change.target}</span>
                        </div>
                      ))}
                      {version.changes.length > 5 && (
                        <p className="text-xs text-zinc-400">
                          +{version.changes.length - 5} more changes
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {!isCurrent && (
                    <div className="flex gap-2 mt-3">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreview();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Eye size={12} />
                        Preview
                      </motion.button>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestore();
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <RotateCcw size={12} />
                        Restore
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Expand indicator */}
          {!compareMode && (
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              className="text-zinc-400"
            >
              <ChevronRight size={16} />
            </motion.div>
          )}

          {/* Selection checkbox in compare mode */}
          {compareMode && (
            <motion.div
              className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${isSelected
                  ? 'bg-indigo-500 border-indigo-500'
                  : 'border-zinc-300 dark:border-zinc-600'}
              `}
              animate={{ scale: isSelected ? 1.1 : 1 }}
            >
              {isSelected && <Check size={12} className="text-white" />}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Visual diff viewer
interface VisualDiffProps {
  before: { snapshot: string; version: Version };
  after: { snapshot: string; version: Version };
  mode?: 'side-by-side' | 'overlay' | 'slider';
  onClose: () => void;
}

export const VisualDiff: React.FC<VisualDiffProps> = ({
  before,
  after,
  mode = 'slider',
  onClose,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState(mode);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <div className="flex items-center gap-4">
          <h2 className="text-white font-semibold">Compare Versions</h2>

          {/* View mode toggle */}
          <div className="flex rounded-lg bg-white/10 p-1">
            {(['side-by-side', 'overlay', 'slider'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`
                  px-3 py-1 text-xs font-medium rounded-md transition-colors
                  ${viewMode === m
                    ? 'bg-white text-black'
                    : 'text-white/70 hover:text-white'}
                `}
              >
                {m.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <motion.button
          onClick={onClose}
          className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <X size={20} />
        </motion.button>
      </div>

      {/* Version labels */}
      <div className="flex justify-between px-4 py-2">
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <ArrowLeft size={14} />
          <span>{before.version.title}</span>
          <span className="text-white/40">
            {before.version.timestamp.toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <span>{after.version.title}</span>
          <span className="text-white/40">
            {after.version.timestamp.toLocaleDateString()}
          </span>
          <ArrowRight size={14} />
        </div>
      </div>

      {/* Comparison view */}
      <div className="flex-1 relative overflow-hidden">
        {viewMode === 'side-by-side' && (
          <div className="flex h-full">
            <div className="w-1/2 p-4 border-r border-white/10">
              <img src={before.snapshot} alt="Before" className="w-full h-full object-contain" />
            </div>
            <div className="w-1/2 p-4">
              <img src={after.snapshot} alt="After" className="w-full h-full object-contain" />
            </div>
          </div>
        )}

        {viewMode === 'overlay' && (
          <div className="relative h-full p-4">
            <img src={before.snapshot} alt="Before" className="absolute inset-4 w-auto h-auto object-contain opacity-50" />
            <img src={after.snapshot} alt="After" className="absolute inset-4 w-auto h-auto object-contain" />
          </div>
        )}

        {viewMode === 'slider' && (
          <div className="relative h-full">
            {/* Before image (full) */}
            <img src={before.snapshot} alt="Before" className="absolute inset-0 w-full h-full object-contain" />

            {/* After image (clipped) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={after.snapshot}
                alt="After"
                className="absolute inset-0 w-full h-full object-contain"
                style={{ width: `${100 / (sliderPosition / 100)}%` }}
              />
            </div>

            {/* Slider handle */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={(e) => {
                const handleMove = (moveEvent: MouseEvent) => {
                  const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                  const x = moveEvent.clientX - rect.left;
                  setSliderPosition(Math.max(0, Math.min(100, (x / rect.width) * 100)));
                };
                const handleUp = () => {
                  window.removeEventListener('mousemove', handleMove);
                  window.removeEventListener('mouseup', handleUp);
                };
                window.addEventListener('mousemove', handleMove);
                window.addEventListener('mouseup', handleUp);
              }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <ArrowLeft size={12} className="text-zinc-400" />
                <ArrowRight size={12} className="text-zinc-400" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
