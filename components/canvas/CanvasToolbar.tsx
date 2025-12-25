import React from 'react';

interface CanvasToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onCloudSave: () => void;
  isCloudSyncing: boolean;
  onExportSVG: () => void;
  onPreview: () => void;
  isPreviewMode: boolean;
  onShowExportModal: () => void;
  selectedCount: number;
  selectedMask?: string;
  onMaskChange: (mask: string) => void;
  onDeleteSelected: () => void;
}

/**
 * Canvas toolbar component with undo/redo, cloud sync, and export actions
 */
const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onCloudSave,
  isCloudSyncing,
  onExportSVG,
  onPreview,
  isPreviewMode,
  onShowExportModal,
  selectedCount,
  selectedMask,
  onMaskChange,
  onDeleteSelected,
}) => {
  return (
    <div
      className="h-14 bg-white border-b border-slate-100 px-8 flex items-center justify-between text-slate-500 shadow-sm z-30"
      role="toolbar"
      aria-label="Canvas toolbar"
    >
      {/* Left Section: History & Sync */}
      <div className="flex items-center gap-6 border-r border-slate-100 pr-6 mr-6">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last action"
          className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl disabled:opacity-20 transition-all active:scale-90"
        >
          <i className="fas fa-undo" aria-hidden="true"></i>
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo last action"
          className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl disabled:opacity-20 transition-all active:scale-90"
        >
          <i className="fas fa-redo" aria-hidden="true"></i>
        </button>
        <div className="w-px h-6 bg-slate-100" aria-hidden="true"></div>
        <button
          onClick={onCloudSave}
          disabled={isCloudSyncing}
          aria-label={isCloudSyncing ? 'Saving to cloud' : 'Save to cloud'}
          aria-busy={isCloudSyncing}
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:scale-110 ${
            isCloudSyncing ? 'text-accent' : 'hover:bg-slate-50'
          }`}
        >
          <i
            className={`fas ${isCloudSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}`}
            aria-hidden="true"
          ></i>
        </button>
      </div>

      {/* Center Section: Quick Properties */}
      <div className="flex-1 flex items-center gap-4">
        {selectedCount > 0 && (
          <div className="flex items-center gap-4 bg-slate-50 px-6 py-2 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
            <span className="text-[10px] font-black uppercase text-slate-400 mr-2 tracking-widest">
              Quick Properties
            </span>
            <select
              className="bg-transparent text-[10px] font-bold outline-none uppercase cursor-pointer hover:text-slate-900 transition-colors"
              onChange={(e) => onMaskChange(e.target.value)}
              value={selectedMask || 'none'}
              aria-label="Element mask shape"
            >
              <option value="none">No Mask</option>
              <option value="circle">Circle</option>
              <option value="rounded">Rounded</option>
              <option value="star">Star</option>
              <option value="diamond">Diamond</option>
            </select>
            <div className="w-px h-4 bg-slate-200"></div>
            <button
              onClick={onDeleteSelected}
              className="text-rose-500 hover:text-rose-600 transition-colors hover:scale-110 active:scale-90"
              aria-label="Delete selected elements"
            >
              <i className="fas fa-trash-alt text-xs"></i>
            </button>
          </div>
        )}
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={onPreview}
          className="px-6 py-2.5 bg-rose-50 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center gap-2 hover:scale-105 active:scale-95"
          aria-label={isPreviewMode ? 'Restart animation preview' : 'Run animation preview'}
        >
          <i className="fas fa-play"></i>
          {isPreviewMode ? 'Restart Test' : 'Run Motion Test'}
        </button>
        <button
          onClick={onExportSVG}
          className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2 hover:scale-105 active:scale-95"
          aria-label="Quick export as SVG"
        >
          <i className="fas fa-code"></i> Quick SVG
        </button>
        <button
          onClick={onShowExportModal}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg hover:scale-105 active:scale-95"
          aria-label="Add new element to canvas"
        >
          New Element
        </button>
      </div>
    </div>
  );
};

export default CanvasToolbar;
