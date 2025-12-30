// ============================================================================
// VERSION HISTORY & TIME TRAVEL - UI COMPONENTS
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { versionManager, describeChange, getElementIcon } from '../../services/versionService';
import { formatVersionTime, formatVersionNumber } from '../../types/version';
import type {
  VersionMetadata,
  VersionBranch,
  VersionComparison,
  VersionSnapshot
} from '../../types/version';
import type { DesignElement } from '../../types';

// ============================================================================
// VERSION HISTORY PANEL
// ============================================================================

interface VersionHistoryPanelProps {
  onRestore: (elements: DesignElement[]) => void;
  currentElements: DesignElement[];
  userName?: string;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  onRestore,
  currentElements,
  userName = 'You'
}) => {
  const [versions, setVersions] = useState<VersionMetadata[]>([]);
  const [branches, setBranches] = useState<VersionBranch[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showBranches, setShowBranches] = useState(false);
  const [filter, setFilter] = useState<'all' | 'milestones' | 'autosaves'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setVersions(versionManager.getVersions());
    setBranches(versionManager.getBranches());

    versionManager.setOnVersionChange(setVersions);
    versionManager.setOnBranchChange(setBranches);
  }, []);

  const filteredVersions = useMemo(() => {
    let result = versions;

    if (filter === 'milestones') {
      result = result.filter(v => v.isMilestone);
    } else if (filter === 'autosaves') {
      result = result.filter(v => v.isAutoSave);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.name.toLowerCase().includes(query) ||
        v.description?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [versions, filter, searchQuery]);

  const handleSaveVersion = useCallback(() => {
    const name = prompt('Version name:', `Version ${versions.length + 1}`);
    if (name) {
      versionManager.createVersion(currentElements, {
        name,
        authorName: userName,
        isMilestone: true
      });
    }
  }, [currentElements, versions.length, userName]);

  const handleRestore = useCallback((versionId: string) => {
    const elements = versionManager.restoreVersion(versionId, { createNewVersion: true });
    if (elements) {
      onRestore(elements);
    }
  }, [onRestore]);

  const handleCompare = useCallback((versionId: string) => {
    if (compareVersionId === versionId) {
      setCompareVersionId(null);
      setShowComparison(false);
    } else if (!compareVersionId) {
      setCompareVersionId(versionId);
    } else {
      setSelectedVersionId(compareVersionId);
      setCompareVersionId(versionId);
      setShowComparison(true);
    }
  }, [compareVersionId]);

  const currentBranch = versionManager.getCurrentBranch();
  const currentVersion = versionManager.getCurrentVersion();

  return (
    <div className="w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-sm tracking-wide">VERSION HISTORY</h3>
          <button
            onClick={handleSaveVersion}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
          >
            <i className="fas fa-plus mr-1.5"></i>
            Save Version
          </button>
        </div>

        {/* Branch selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBranches(!showBranches)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors"
          >
            <i className="fas fa-code-branch"></i>
            <span>{currentBranch?.name || 'Main'}</span>
            <i className={`fas fa-chevron-${showBranches ? 'up' : 'down'} text-[10px]`}></i>
          </button>
          {currentVersion && (
            <span className="text-[10px] opacity-70">
              @ {formatVersionNumber(currentVersion.versionNumber)}
            </span>
          )}
        </div>
      </div>

      {/* Branch dropdown */}
      <AnimatePresence>
        {showBranches && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-slate-200 overflow-hidden"
          >
            <div className="p-3 bg-slate-50">
              <div className="space-y-1">
                {branches.map(branch => (
                  <button
                    key={branch.id}
                    onClick={() => {
                      versionManager.switchBranch(branch.id);
                      setShowBranches(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                      branch.id === currentBranch?.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <i className="fas fa-code-branch"></i>
                      {branch.name}
                      {branch.isDefault && (
                        <span className="px-1.5 py-0.5 bg-slate-200 rounded text-[9px] uppercase">
                          default
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  const name = prompt('Branch name:');
                  if (name) {
                    versionManager.createBranch(name);
                  }
                }}
                className="w-full mt-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                <i className="fas fa-plus mr-1.5"></i>
                Create Branch
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="p-3 border-b border-slate-100">
        <div className="flex gap-1 mb-2">
          {(['all', 'milestones', 'autosaves'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filter === f
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            type="text"
            placeholder="Search versions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
      </div>

      {/* Compare mode indicator */}
      {compareVersionId && !showComparison && (
        <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
          <i className="fas fa-info-circle mr-1.5"></i>
          Select another version to compare
          <button
            onClick={() => setCompareVersionId(null)}
            className="ml-2 text-amber-900 underline"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Version list */}
      <div className="max-h-96 overflow-y-auto">
        {filteredVersions.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <i className="fas fa-history text-3xl mb-3 opacity-50"></i>
            <p className="text-xs">No versions yet</p>
            <p className="text-[10px] mt-1">Save a version to start tracking</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredVersions.map((version, index) => (
              <VersionListItem
                key={version.id}
                version={version}
                isSelected={selectedVersionId === version.id}
                isCompareTarget={compareVersionId === version.id}
                isCurrent={version.id === currentVersion?.id}
                isFirst={index === 0}
                onSelect={() => setSelectedVersionId(version.id)}
                onRestore={() => handleRestore(version.id)}
                onCompare={() => handleCompare(version.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comparison view */}
      <AnimatePresence>
        {showComparison && selectedVersionId && compareVersionId && (
          <VersionComparisonView
            versionIdA={selectedVersionId}
            versionIdB={compareVersionId}
            onClose={() => {
              setShowComparison(false);
              setCompareVersionId(null);
              setSelectedVersionId(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// VERSION LIST ITEM
// ============================================================================

interface VersionListItemProps {
  version: VersionMetadata;
  isSelected: boolean;
  isCompareTarget: boolean;
  isCurrent: boolean;
  isFirst: boolean;
  onSelect: () => void;
  onRestore: () => void;
  onCompare: () => void;
}

const VersionListItem: React.FC<VersionListItemProps> = ({
  version,
  isSelected,
  isCompareTarget,
  isCurrent,
  isFirst,
  onSelect,
  onRestore,
  onCompare
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      layout
      className={`relative group ${
        isSelected ? 'bg-indigo-50' : isCompareTarget ? 'bg-amber-50' : 'hover:bg-slate-50'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Timeline connector */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200">
        {!isFirst && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-300 rounded-full -translate-y-1"></div>}
      </div>

      <div className="relative flex items-start gap-3 p-3 pl-10">
        {/* Version indicator */}
        <div className={`absolute left-4 top-4 w-4 h-4 rounded-full border-2 ${
          isCurrent
            ? 'bg-indigo-500 border-indigo-500'
            : version.isMilestone
            ? 'bg-amber-400 border-amber-400'
            : version.isAutoSave
            ? 'bg-slate-300 border-slate-300'
            : 'bg-white border-slate-300'
        }`}>
          {isCurrent && (
            <motion.div
              className="absolute inset-0 bg-indigo-500 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ opacity: 0.3 }}
            />
          )}
        </div>

        {/* Thumbnail */}
        {version.thumbnail && (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
            <img src={version.thumbnail} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-800 truncate">
              {version.name}
            </span>
            {version.isMilestone && (
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-bold uppercase">
                Milestone
              </span>
            )}
            {isCurrent && (
              <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-bold uppercase">
                Current
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
            <span>{formatVersionTime(version.timestamp)}</span>
            <span>•</span>
            <span>{version.elementCount} elements</span>
          </div>
          {version.description && (
            <p className="text-[10px] text-slate-400 mt-1 truncate">{version.description}</p>
          )}
        </div>

        {/* Actions */}
        <AnimatePresence>
          {showActions && !isCurrent && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-1"
            >
              <button
                onClick={onCompare}
                className={`p-1.5 rounded-lg transition-colors ${
                  isCompareTarget
                    ? 'bg-amber-200 text-amber-700'
                    : 'hover:bg-slate-200 text-slate-500'
                }`}
                title="Compare"
              >
                <i className="fas fa-not-equal text-xs"></i>
              </button>
              <button
                onClick={onRestore}
                className="p-1.5 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                title="Restore"
              >
                <i className="fas fa-undo text-xs"></i>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ============================================================================
// VERSION COMPARISON VIEW
// ============================================================================

interface VersionComparisonViewProps {
  versionIdA: string;
  versionIdB: string;
  onClose: () => void;
}

const VersionComparisonView: React.FC<VersionComparisonViewProps> = ({
  versionIdA,
  versionIdB,
  onClose
}) => {
  const comparison = useMemo(() => {
    return versionManager.compareVersions(versionIdA, versionIdB);
  }, [versionIdA, versionIdB]);

  if (!comparison) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-0 bg-white z-10 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-slate-800">Version Comparison</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {comparison.versionA.name} → {comparison.versionB.name}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <i className="fas fa-times text-slate-500"></i>
        </button>
      </div>

      {/* Summary */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 bg-white rounded-lg">
            <div className="text-lg font-black text-emerald-500">{comparison.summary.addedCount}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Added</div>
          </div>
          <div className="p-2 bg-white rounded-lg">
            <div className="text-lg font-black text-rose-500">{comparison.summary.removedCount}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Removed</div>
          </div>
          <div className="p-2 bg-white rounded-lg">
            <div className="text-lg font-black text-amber-500">{comparison.summary.modifiedCount}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Changed</div>
          </div>
          <div className="p-2 bg-white rounded-lg">
            <div className="text-lg font-black text-slate-400">{comparison.summary.unchangedCount}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Same</div>
          </div>
        </div>
      </div>

      {/* Changes list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Added */}
        {comparison.diff.added.length > 0 && (
          <div>
            <h5 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">
              <i className="fas fa-plus-circle mr-1.5"></i>
              Added Elements
            </h5>
            <div className="space-y-1">
              {comparison.diff.added.map(el => (
                <div key={el.id} className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                  <i className={`fas ${getElementIcon(el.type)} text-emerald-500 text-xs`}></i>
                  <span className="text-xs text-emerald-800">{el.content?.substring(0, 30) || el.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Removed */}
        {comparison.diff.removed.length > 0 && (
          <div>
            <h5 className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2">
              <i className="fas fa-minus-circle mr-1.5"></i>
              Removed Elements
            </h5>
            <div className="space-y-1">
              {comparison.diff.removed.map(el => (
                <div key={el.id} className="flex items-center gap-2 p-2 bg-rose-50 rounded-lg">
                  <i className={`fas ${getElementIcon(el.type)} text-rose-500 text-xs`}></i>
                  <span className="text-xs text-rose-800 line-through">{el.content?.substring(0, 30) || el.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modified */}
        {comparison.diff.modified.length > 0 && (
          <div>
            <h5 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">
              <i className="fas fa-edit mr-1.5"></i>
              Modified Elements
            </h5>
            <div className="space-y-1">
              {comparison.diff.modified.map(change => (
                <div key={change.elementId} className="p-2 bg-amber-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-800">{change.elementId}</span>
                    <span className="text-[10px] text-amber-600">{describeChange(change)}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-amber-600">
                    {change.changedProperties.slice(0, 3).join(', ')}
                    {change.changedProperties.length > 3 && ` +${change.changedProperties.length - 3} more`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// TIME TRAVEL SLIDER
// ============================================================================

interface TimeTravelSliderProps {
  onTimeChange: (elements: DesignElement[]) => void;
}

export const TimeTravelSlider: React.FC<TimeTravelSliderProps> = ({ onTimeChange }) => {
  const [versions, setVersions] = useState<VersionMetadata[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const allVersions = versionManager.getVersions();
    setVersions(allVersions.reverse()); // Oldest first
    setCurrentIndex(allVersions.length - 1);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        if (prev >= versions.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, versions.length]);

  useEffect(() => {
    if (versions[currentIndex]) {
      const snapshot = versionManager.getSnapshot(versions[currentIndex].id);
      if (snapshot) {
        onTimeChange(snapshot.elements);
      }
    }
  }, [currentIndex, versions, onTimeChange]);

  if (versions.length < 2) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
          <i className="fas fa-clock-rotate-left mr-2 text-indigo-500"></i>
          Time Travel
        </h4>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-2 rounded-lg transition-colors ${
            isPlaying ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
          }`}
        >
          <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`}></i>
        </button>
      </div>

      <div className="relative">
        <input
          type="range"
          min={0}
          max={versions.length - 1}
          value={currentIndex}
          onChange={e => setCurrentIndex(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between mt-2 text-[10px] text-slate-500">
          <span>{versions[0]?.name}</span>
          <span className="font-bold text-indigo-600">
            {versions[currentIndex]?.name}
          </span>
          <span>{versions[versions.length - 1]?.name}</span>
        </div>
      </div>

      <div className="mt-3 text-center text-xs text-slate-500">
        {formatVersionTime(versions[currentIndex]?.timestamp || '')}
      </div>
    </div>
  );
};

// ============================================================================
// QUICK VERSION BUTTON
// ============================================================================

interface QuickVersionButtonProps {
  currentElements: DesignElement[];
  userName?: string;
}

export const QuickVersionButton: React.FC<QuickVersionButtonProps> = ({
  currentElements,
  userName
}) => {
  const [showSaved, setShowSaved] = useState(false);

  const handleQuickSave = useCallback(() => {
    versionManager.createVersion(currentElements, {
      name: `Quick save`,
      authorName: userName,
      isAutoSave: false
    });
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  }, [currentElements, userName]);

  return (
    <button
      onClick={handleQuickSave}
      className="relative flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors"
    >
      <i className={`fas fa-${showSaved ? 'check' : 'bookmark'} ${showSaved ? 'text-emerald-500' : ''}`}></i>
      <span>{showSaved ? 'Saved!' : 'Save Version'}</span>
      <AnimatePresence>
        {showSaved && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"
          >
            <i className="fas fa-check text-white text-[8px]"></i>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default VersionHistoryPanel;
