import type { HistorySnapshot } from '../types';

interface HistoryPanelProps {
  snapshots: HistorySnapshot[];
  currentIndex: number;
  onJumpToSnapshot: (snapshotId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onCreateCheckpoint: () => void;
  onClearHistory: () => void;
  canUndo: boolean;
  canRedo: boolean;
  className?: string;
}

export default function HistoryPanel({
  snapshots,
  currentIndex,
  onJumpToSnapshot,
  onUndo,
  onRedo,
  onCreateCheckpoint,
  onClearHistory,
  canUndo,
  canRedo,
  className = '',
}: HistoryPanelProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className={`flex flex-col bg-[#2D2D30] ${className}`}>
      {/* Header */}
      <div className="px-4 py-2 bg-[#2D2D30] border-b border-black/40 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          History
        </span>
        <div className="flex gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <i className="fas fa-rotate-left text-[10px]" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Shift+Z)"
          >
            <i className="fas fa-rotate-right text-[10px]" />
          </button>
          <button
            onClick={onCreateCheckpoint}
            className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-white"
            title="Create Checkpoint"
          >
            <i className="fas fa-bookmark text-[10px]" />
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {snapshots.length === 0 ? (
          <div className="p-4 text-center">
            <i className="fas fa-clock-rotate-left text-2xl text-slate-700 mb-2" />
            <p className="text-[10px] text-slate-500">No history yet</p>
          </div>
        ) : (
          snapshots.map((snapshot, index) => {
            const isCurrent = index === currentIndex;
            const isPast = index < currentIndex;

            return (
              <button
                key={snapshot.id}
                onClick={() => onJumpToSnapshot(snapshot.id)}
                className={`
                  w-full px-3 py-2 flex items-center gap-3 text-left border-b border-black/10
                  transition-all duration-150
                  ${isCurrent
                    ? 'bg-accent/20 border-l-4 border-l-accent'
                    : isPast
                      ? 'hover:bg-white/5 opacity-80'
                      : 'hover:bg-white/5 opacity-40'
                  }
                `}
              >
                {/* Index/Checkpoint indicator */}
                <div className={`
                  w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold
                  ${snapshot.isCheckpoint
                    ? 'bg-amber-500/20 text-amber-400'
                    : isCurrent
                      ? 'bg-accent/30 text-accent'
                      : 'bg-white/5 text-slate-500'
                  }
                `}>
                  {snapshot.isCheckpoint ? (
                    <i className="fas fa-bookmark" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Thumbnail */}
                {snapshot.thumbnail && (
                  <div className="w-8 h-8 bg-slate-800 rounded overflow-hidden flex-shrink-0 border border-white/10">
                    <img
                      src={snapshot.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Description */}
                <div className="flex-1 min-w-0">
                  <p className={`
                    text-[10px] font-medium truncate
                    ${isCurrent ? 'text-white' : 'text-slate-400'}
                  `}>
                    {snapshot.checkpointName || snapshot.description}
                  </p>
                  <p className="text-[8px] text-slate-600">{formatTime(snapshot.timestamp)}</p>
                </div>

                {/* Current indicator */}
                {isCurrent && (
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-black/40 flex items-center justify-between">
        <span className="text-[9px] text-slate-500">
          {snapshots.length} {snapshots.length === 1 ? 'state' : 'states'}
        </span>
        <button
          onClick={onClearHistory}
          disabled={snapshots.length === 0}
          className="text-[9px] text-slate-500 hover:text-red-400 disabled:opacity-30"
        >
          Clear History
        </button>
      </div>
    </div>
  );
}
