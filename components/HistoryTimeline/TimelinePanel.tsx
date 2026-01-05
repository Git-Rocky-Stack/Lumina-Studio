// History Timeline Panel - Visual history scrubber with thumbnails
import React, { useState, useEffect, useRef } from 'react';
import {
  History,
  Undo2,
  Redo2,
  Save,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Clock,
  Bookmark,
  Plus,
  Trash2,
  RotateCcw,
  GitMerge,
  Image,
  CheckCircle,
} from 'lucide-react';
import {
  canvasHistoryService,
  HistoryEntry,
  HistoryActionType,
  Branch,
  CanvasState,
} from '../../services/canvasHistoryService';

interface TimelinePanelProps {
  projectId: string;
  onStateRestore?: (state: CanvasState) => void;
  onClose?: () => void;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  projectId,
  onStateRestore,
  onClose,
}) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [showBranches, setShowBranches] = useState(false);
  const [showCheckpoints, setShowCheckpoints] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Initialize service and load history
  useEffect(() => {
    canvasHistoryService.initialize(projectId, {
      onHistoryChange: (hist, index) => {
        setHistory(hist);
        setCurrentIndex(index);
      },
      onStateRestore: onStateRestore,
    });

    loadHistory();

    return () => {
      canvasHistoryService.dispose();
    };
  }, [projectId]);

  const loadHistory = async () => {
    const hist = await canvasHistoryService.loadProjectHistory(projectId, currentBranch);
    setHistory(hist);
    setCurrentIndex(hist.length - 1);

    const branchList = await canvasHistoryService.listBranches();
    setBranches(branchList);
  };

  // Handle undo
  const handleUndo = () => {
    const result = canvasHistoryService.undo();
    if (result.success && result.state && onStateRestore) {
      onStateRestore(result.state);
    }
  };

  // Handle redo
  const handleRedo = () => {
    const result = canvasHistoryService.redo();
    if (result.success && result.state && onStateRestore) {
      onStateRestore(result.state);
    }
  };

  // Handle go to version
  const handleGoToVersion = (version: number) => {
    const result = canvasHistoryService.goToVersion(version);
    if (result.success && result.state && onStateRestore) {
      onStateRestore(result.state);
    }
  };

  // Handle create checkpoint
  const handleCreateCheckpoint = () => {
    const name = prompt('Enter checkpoint name:');
    if (name) {
      const currentState = history[currentIndex]?.canvasState;
      if (currentState) {
        canvasHistoryService.createCheckpoint(name, currentState);
      }
    }
  };

  // Handle create branch
  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;

    const branch = await canvasHistoryService.createBranch(newBranchName.trim());
    if (branch) {
      const branchList = await canvasHistoryService.listBranches();
      setBranches(branchList);
      setNewBranchName('');
      setIsCreatingBranch(false);
    }
  };

  // Handle switch branch
  const handleSwitchBranch = async (branchName: string) => {
    const success = await canvasHistoryService.switchBranch(branchName);
    if (success) {
      setCurrentBranch(branchName);
      setShowBranches(false);
    }
  };

  // Handle merge branch
  const handleMergeBranch = async (sourceBranch: string) => {
    const success = await canvasHistoryService.mergeBranch(sourceBranch);
    if (success) {
      loadHistory();
    }
  };

  // Get action icon
  const getActionIcon = (actionType: HistoryActionType): React.ReactNode => {
    const icons: Partial<Record<HistoryActionType, React.ReactNode>> = {
      create: <Plus className="w-3 h-3 text-green-500" />,
      delete: <Trash2 className="w-3 h-3 text-red-500" />,
      update: <RotateCcw className="w-3 h-3 text-blue-500" />,
      move: <RotateCcw className="w-3 h-3 text-orange-500" />,
      checkpoint: <Bookmark className="w-3 h-3 text-purple-500" />,
      autosave: <Save className="w-3 h-3 text-gray-400" />,
    };
    return icons[actionType] || <Clock className="w-3 h-3 text-gray-400" />;
  };

  // Format time ago
  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  // Get checkpoints
  const checkpoints = history.filter(entry => entry.isCheckpoint);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">History</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={!canvasHistoryService.canUndo()}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canvasHistoryService.canRedo()}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-30"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded ml-2"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Branch Selector */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <button
            onClick={() => setShowBranches(!showBranches)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
          >
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 dark:text-gray-300">{currentBranch}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${showBranches ? 'rotate-180' : ''}`}
            />
          </button>

          {showBranches && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
              {branches.map(branch => (
                <button
                  key={branch.name}
                  onClick={() => handleSwitchBranch(branch.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    branch.name === currentBranch ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-gray-500" />
                    <span>{branch.name}</span>
                    {branch.name === currentBranch && (
                      <CheckCircle className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                  {branch.name !== currentBranch && branch.name !== 'main' && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleMergeBranch(branch.name);
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      title={`Merge ${branch.name} into ${currentBranch}`}
                    >
                      <GitMerge className="w-3 h-3" />
                    </button>
                  )}
                </button>
              ))}

              <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                {isCreatingBranch ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBranchName}
                      onChange={e => setNewBranchName(e.target.value)}
                      placeholder="Branch name"
                      className="flex-1 px-2 py-1 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded"
                      autoFocus
                    />
                    <button
                      onClick={handleCreateBranch}
                      disabled={!newBranchName.trim()}
                      className="px-2 py-1 bg-blue-500 text-white text-sm rounded disabled:opacity-50"
                    >
                      Create
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreatingBranch(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                  >
                    <Plus className="w-4 h-4" />
                    Create Branch
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleCreateCheckpoint}
          className="flex items-center gap-1 px-2 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs"
        >
          <Bookmark className="w-3 h-3" />
          Save Checkpoint
        </button>
        <button
          onClick={() => setShowCheckpoints(!showCheckpoints)}
          className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs ${
            showCheckpoints
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          {showCheckpoints ? 'All History' : `Checkpoints (${checkpoints.length})`}
        </button>
      </div>

      {/* Timeline */}
      <div ref={timelineRef} className="flex-1 overflow-auto">
        <div className="p-3">
          {/* Timeline Scrubber */}
          <div className="mb-4">
            <input
              type="range"
              min={0}
              max={Math.max(0, history.length - 1)}
              value={currentIndex}
              onChange={e => handleGoToVersion(history[parseInt(e.target.value)]?.versionNumber)}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Start</span>
              <span>Now</span>
            </div>
          </div>

          {/* History Items */}
          <div className="space-y-1">
            {(showCheckpoints ? checkpoints : history)
              .slice()
              .reverse()
              .map((entry, idx) => {
                const realIndex = showCheckpoints
                  ? history.findIndex(h => h.id === entry.id)
                  : history.length - 1 - idx;
                const isActive = realIndex === currentIndex;
                const isPast = realIndex < currentIndex;

                return (
                  <button
                    key={entry.id}
                    onClick={() => handleGoToVersion(entry.versionNumber)}
                    className={`w-full flex items-start gap-3 p-2 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                        : isPast
                        ? 'opacity-60 hover:bg-gray-50 dark:hover:bg-gray-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center mt-1">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isActive
                            ? 'bg-blue-500'
                            : entry.isCheckpoint
                            ? 'bg-purple-500'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                      {!showCheckpoints && idx < history.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700" />
                      )}
                    </div>

                    {/* Entry content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getActionIcon(entry.actionType)}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {entry.actionLabel}
                        </span>
                        {entry.isCheckpoint && (
                          <Bookmark className="w-3 h-3 text-purple-500 flex-shrink-0" />
                        )}
                        {entry.isAutosave && (
                          <span className="text-xs text-gray-400">(auto)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(entry.createdAt)}</span>
                        {entry.changedElements.length > 0 && (
                          <span className="text-gray-400">
                            {entry.changedElements.length} element{entry.changedElements.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Thumbnail */}
                    {entry.thumbnailUrl && (
                      <div className="w-12 h-9 rounded bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                        <img
                          src={entry.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </button>
                );
              })}
          </div>

          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <History className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">No history yet</p>
              <p className="text-xs mt-1">Changes will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{history.length} states</span>
          <span>
            Version {currentIndex + 1} of {history.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimelinePanel;
