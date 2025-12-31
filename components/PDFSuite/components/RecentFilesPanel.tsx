// ============================================
// RecentFilesPanel Component
// Displays recently opened files
// ============================================

import React from 'react';
import type { RecentFile } from '../hooks/useRecentFiles';

interface RecentFilesPanelProps {
  recentFiles: RecentFile[];
  onFileSelect: (file: RecentFile) => void;
  onFileRemove: (id: string) => void;
  onClearAll: () => void;
  formatFileSize: (bytes: number) => string;
  formatDate: (timestamp: number) => string;
  className?: string;
}

export const RecentFilesPanel: React.FC<RecentFilesPanelProps> = ({
  recentFiles,
  onFileSelect,
  onFileRemove,
  onClearAll,
  formatFileSize,
  formatDate,
  className = '',
}) => {
  if (recentFiles.length === 0) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
          <i className="fas fa-history text-2xl text-slate-300"></i>
        </div>
        <p className="text-slate-500 font-medium">No recent files</p>
        <p className="text-slate-400 text-sm mt-1">
          Files you open will appear here
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h3 className="type-card text-slate-700">Recent Files</h3>
        <button
          onClick={onClearAll}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Files list */}
      <div className="divide-y divide-slate-100">
        {recentFiles.map((file) => (
          <div
            key={file.id}
            className="group px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-3"
            onClick={() => onFileSelect(file)}
          >
            {/* Thumbnail or icon */}
            <div className="w-12 h-14 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
              {file.thumbnail ? (
                <img
                  src={file.thumbnail}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <i className="fas fa-file-pdf text-xl text-rose-400"></i>
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">
                {file.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span>{formatFileSize(file.size)}</span>
                {file.pageCount && (
                  <>
                    <span>-</span>
                    <span>{file.pageCount} pages</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {formatDate(file.lastOpened)}
              </p>
            </div>

            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileRemove(file.id);
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
              title="Remove from recent"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentFilesPanel;
