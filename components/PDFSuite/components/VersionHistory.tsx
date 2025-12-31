// ============================================
// VersionHistory Component
// Track document changes and allow rollback
// ============================================

import React, { useState, useCallback, useMemo } from 'react';

export interface DocumentVersion {
  id: string;
  name: string;
  timestamp: number;
  author: string;
  description: string;
  changeType: 'edit' | 'annotation' | 'page' | 'form' | 'redaction' | 'merge' | 'auto-save';
  changeCount: number;
  snapshot?: string; // Base64 encoded PDF snapshot or reference
  isCurrent: boolean;
  isAutoSave: boolean;
}

export interface VersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  versions: DocumentVersion[];
  currentVersionId: string;
  onRestoreVersion: (versionId: string) => void;
  onCompareVersions: (versionA: string, versionB: string) => void;
  onCreateVersion: (name: string, description: string) => void;
  onDeleteVersion: (versionId: string) => void;
  onDownloadVersion: (versionId: string) => void;
  className?: string;
}

const CHANGE_TYPE_INFO: Record<DocumentVersion['changeType'], { icon: string; color: string; label: string }> = {
  'edit': { icon: 'fas fa-edit', color: 'text-blue-500', label: 'Text Edit' },
  'annotation': { icon: 'fas fa-highlighter', color: 'text-yellow-500', label: 'Annotation' },
  'page': { icon: 'fas fa-file', color: 'text-green-500', label: 'Page Change' },
  'form': { icon: 'fas fa-wpforms', color: 'text-purple-500', label: 'Form Field' },
  'redaction': { icon: 'fas fa-eraser', color: 'text-red-500', label: 'Redaction' },
  'merge': { icon: 'fas fa-object-group', color: 'text-teal-500', label: 'Merge' },
  'auto-save': { icon: 'fas fa-save', color: 'text-slate-400', label: 'Auto-save' },
};

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

const formatFullDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  isOpen,
  onClose,
  versions,
  currentVersionId,
  onRestoreVersion,
  onCompareVersions,
  onCreateVersion,
  onDeleteVersion,
  onDownloadVersion,
  className = '',
}) => {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDescription, setNewVersionDescription] = useState('');
  const [showAutoSaves, setShowAutoSaves] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Filter versions based on auto-save toggle
  const filteredVersions = useMemo(() => {
    if (showAutoSaves) return versions;
    return versions.filter((v) => !v.isAutoSave);
  }, [versions, showAutoSaves]);

  // Group versions by date
  const groupedVersions = useMemo(() => {
    const groups: Record<string, DocumentVersion[]> = {};

    filteredVersions.forEach((version) => {
      const date = new Date(version.timestamp).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(version);
    });

    return Object.entries(groups).sort((a, b) => {
      const dateA = new Date(a[1][0].timestamp);
      const dateB = new Date(b[1][0].timestamp);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredVersions]);

  const toggleVersionSelection = useCallback((versionId: string) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      }
      if (prev.length < 2) {
        return [...prev, versionId];
      }
      return [prev[1], versionId];
    });
  }, []);

  const handleCreateVersion = useCallback(() => {
    if (newVersionName.trim()) {
      onCreateVersion(newVersionName.trim(), newVersionDescription.trim());
      setNewVersionName('');
      setNewVersionDescription('');
      setShowCreateModal(false);
    }
  }, [newVersionName, newVersionDescription, onCreateVersion]);

  const handleCompare = useCallback(() => {
    if (selectedVersions.length === 2) {
      onCompareVersions(selectedVersions[0], selectedVersions[1]);
    }
  }, [selectedVersions, onCompareVersions]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-history text-amber-600"></i>
              </div>
              <div>
                <h2 className="type-section text-slate-800">Version History</h2>
                <p className="type-caption text-slate-500">
                  {versions.length} version{versions.length !== 1 ? 's' : ''} saved
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Actions bar */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors flex items-center gap-1.5"
            >
              <i className="fas fa-plus"></i>
              Save Version
            </button>
            <button
              onClick={handleCompare}
              disabled={selectedVersions.length !== 2}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                selectedVersions.length === 2
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <i className="fas fa-code-compare"></i>
              Compare Selected
            </button>
            <div className="flex-1"></div>
            <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={showAutoSaves}
                onChange={(e) => setShowAutoSaves(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              Show auto-saves
            </label>
          </div>
        </div>

        {/* Version List */}
        <div className="flex-1 overflow-y-auto">
          {groupedVersions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <i className="fas fa-history text-3xl text-slate-300"></i>
              </div>
              <p className="type-label text-slate-500 mb-1">No versions yet</p>
              <p className="type-caption text-slate-400">
                Save a version to track your changes
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {groupedVersions.map(([date, dateVersions]) => (
                <div key={date}>
                  {/* Date header */}
                  <div className="sticky top-0 bg-slate-50 px-6 py-2 z-10">
                    <span className="text-xs font-medium text-slate-500">{date}</span>
                  </div>

                  {/* Versions for this date */}
                  {dateVersions.map((version) => {
                    const typeInfo = CHANGE_TYPE_INFO[version.changeType];
                    const isSelected = selectedVersions.includes(version.id);
                    const isExpanded = expandedVersion === version.id;
                    const isCurrent = version.id === currentVersionId;

                    return (
                      <div
                        key={version.id}
                        className={`px-6 py-3 hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-amber-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Selection checkbox */}
                          <button
                            onClick={() => toggleVersionSelection(version.id)}
                            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'border-slate-300 hover:border-amber-400'
                            }`}
                          >
                            {isSelected && <i className="fas fa-check text-[10px]"></i>}
                          </button>

                          {/* Change type icon */}
                          <div className={`mt-1 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center ${typeInfo.color}`}>
                            <i className={`${typeInfo.icon} text-sm`}></i>
                          </div>

                          {/* Version info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800 truncate">
                                {version.name}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">
                                  CURRENT
                                </span>
                              )}
                              {version.isAutoSave && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded">
                                  AUTO
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-400">
                                {formatRelativeTime(version.timestamp)}
                              </span>
                              <span className="text-slate-300">·</span>
                              <span className="text-xs text-slate-400">
                                {version.author}
                              </span>
                              <span className="text-slate-300">·</span>
                              <span className={`text-xs ${typeInfo.color}`}>
                                {version.changeCount} {typeInfo.label.toLowerCase()}{version.changeCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {version.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {version.description}
                              </p>
                            )}

                            {/* Expanded details */}
                            {isExpanded && (
                              <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
                                <p><strong>Created:</strong> {formatFullDate(version.timestamp)}</p>
                                <p><strong>Type:</strong> {typeInfo.label}</p>
                                <p><strong>Changes:</strong> {version.changeCount}</p>
                                {version.description && (
                                  <p><strong>Notes:</strong> {version.description}</p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setExpandedVersion(isExpanded ? null : version.id)}
                              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Details"
                            >
                              <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-xs`}></i>
                            </button>
                            <button
                              onClick={() => onDownloadVersion(version.id)}
                              className="w-7 h-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Download"
                            >
                              <i className="fas fa-download text-xs"></i>
                            </button>
                            {!isCurrent && (
                              <>
                                <button
                                  onClick={() => onRestoreVersion(version.id)}
                                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                                  title="Restore this version"
                                >
                                  <i className="fas fa-undo text-xs"></i>
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(version.id)}
                                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Delete"
                                >
                                  <i className="fas fa-trash text-xs"></i>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Delete confirmation */}
                        {confirmDelete === version.id && (
                          <div className="mt-3 p-3 bg-red-50 rounded-lg flex items-center justify-between">
                            <span className="text-sm text-red-700">Delete this version?</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  onDeleteVersion(version.id);
                                  setConfirmDelete(null);
                                }}
                                className="px-3 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            <i className="fas fa-info-circle mr-1"></i>
            Versions are saved automatically when you make changes
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors text-sm"
          >
            Close
          </button>
        </div>

        {/* Create Version Modal */}
        {showCreateModal && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl w-[400px] p-6">
              <h3 className="type-label text-slate-800 mb-4">Save New Version</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Version Name *
                  </label>
                  <input
                    type="text"
                    value={newVersionName}
                    onChange={(e) => setNewVersionName(e.target.value)}
                    placeholder="e.g., Final draft, Review changes"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={newVersionDescription}
                    onChange={(e) => setNewVersionDescription(e.target.value)}
                    placeholder="What changes did you make?"
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVersion}
                  disabled={!newVersionName.trim()}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    newVersionName.trim()
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Save Version
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
