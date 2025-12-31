// ============================================
// PageActionsToolbar Component
// Floating toolbar for page operations when pages are selected
// ============================================

import React from 'react';

interface PageActionsToolbarProps {
  selectedCount: number;
  totalPages: number;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onDelete: () => void;
  onExtract: () => void;
  onDuplicate: () => void;
  onMoveToStart: () => void;
  onMoveToEnd: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  className?: string;
}

export const PageActionsToolbar: React.FC<PageActionsToolbarProps> = ({
  selectedCount,
  totalPages,
  onRotateLeft,
  onRotateRight,
  onDelete,
  onExtract,
  onDuplicate,
  onMoveToStart,
  onMoveToEnd,
  onSelectAll,
  onDeselectAll,
  className = '',
}) => {
  if (selectedCount === 0) return null;

  const canDelete = totalPages > selectedCount;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-2xl shadow-2xl shadow-black/30 px-2 py-2 flex items-center gap-1 ${className}`}
    >
      {/* Selection info */}
      <div className="px-3 py-1.5 bg-indigo-600 rounded-xl text-sm font-bold flex items-center gap-2">
        <i className="fas fa-check-square"></i>
        <span>{selectedCount} page{selectedCount !== 1 ? 's' : ''}</span>
      </div>

      <div className="w-px h-8 bg-slate-700 mx-1" />

      {/* Rotate actions */}
      <button
        onClick={onRotateLeft}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        title="Rotate Left (Counter-clockwise)"
      >
        <i className="fas fa-rotate-left"></i>
      </button>
      <button
        onClick={onRotateRight}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        title="Rotate Right (Clockwise)"
      >
        <i className="fas fa-rotate-right"></i>
      </button>

      <div className="w-px h-8 bg-slate-700 mx-1" />

      {/* Move actions */}
      <button
        onClick={onMoveToStart}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        title="Move to Start"
      >
        <i className="fas fa-angles-up"></i>
      </button>
      <button
        onClick={onMoveToEnd}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        title="Move to End"
      >
        <i className="fas fa-angles-down"></i>
      </button>

      <div className="w-px h-8 bg-slate-700 mx-1" />

      {/* Duplicate */}
      {selectedCount === 1 && (
        <button
          onClick={onDuplicate}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          title="Duplicate Page"
        >
          <i className="fas fa-copy"></i>
        </button>
      )}

      {/* Extract */}
      <button
        onClick={onExtract}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-emerald-400 hover:bg-slate-700 transition-colors"
        title="Extract Pages"
      >
        <i className="fas fa-file-export"></i>
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        disabled={!canDelete}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
          canDelete
            ? 'text-slate-300 hover:text-rose-400 hover:bg-slate-700'
            : 'text-slate-600 cursor-not-allowed'
        }`}
        title={canDelete ? 'Delete Pages' : 'Cannot delete all pages'}
      >
        <i className="fas fa-trash"></i>
      </button>

      <div className="w-px h-8 bg-slate-700 mx-1" />

      {/* Selection controls */}
      <button
        onClick={onSelectAll}
        className="px-3 py-1.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        title="Select All"
      >
        All
      </button>
      <button
        onClick={onDeselectAll}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        title="Deselect All"
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default PageActionsToolbar;
