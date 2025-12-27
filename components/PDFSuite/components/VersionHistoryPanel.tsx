// ============================================
// VersionHistoryPanel - Document Version Timeline
// ============================================

import React, { useState, useEffect } from 'react';
import cloudStorageService, {
  CloudProvider,
  CloudFile,
  FileVersion,
} from '../../../services/cloudStorageService';

interface VersionHistoryPanelProps {
  file: CloudFile;
  onRestore?: (version: FileVersion) => void;
  onPreview?: (version: FileVersion) => void;
  onDownload?: (version: FileVersion) => void;
  className?: string;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  file,
  onRestore,
  onPreview,
  onDownload,
  className = '',
}) => {
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<FileVersion | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<[FileVersion | null, FileVersion | null]>([null, null]);

  useEffect(() => {
    loadVersionHistory();
  }, [file.id]);

  const loadVersionHistory = async () => {
    setIsLoading(true);
    try {
      const history = await cloudStorageService.getVersionHistory(file.provider, file.id);
      setVersions(history);
    } catch (error) {
      console.error('Failed to load version history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (version: FileVersion) => {
    setIsRestoring(true);
    try {
      await cloudStorageService.restoreVersion(file.provider, file.id, version.id);
      onRestore?.(version);
      await loadVersionHistory();
    } catch (error) {
      console.error('Failed to restore version:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCompareSelect = (version: FileVersion) => {
    if (!compareVersions[0]) {
      setCompareVersions([version, null]);
    } else if (!compareVersions[1]) {
      setCompareVersions([compareVersions[0], version]);
    } else {
      setCompareVersions([version, null]);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Today at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `Yesterday at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (days < 7) {
      return d.toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' });
    } else {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  };

  const formatSize = (bytes: number) => {
    return cloudStorageService.formatFileSize(bytes);
  };

  const getSizeChange = (current: FileVersion, previous: FileVersion | undefined) => {
    if (!previous) return null;
    const diff = current.size - previous.size;
    if (diff === 0) return null;
    const percent = Math.round((Math.abs(diff) / previous.size) * 100);
    return {
      diff,
      percent,
      isIncrease: diff > 0,
    };
  };

  // Group versions by date
  const groupedVersions = versions.reduce((acc, version) => {
    const date = new Date(version.modifiedAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(version);
    return acc;
  }, {} as Record<string, FileVersion[]>);

  return (
    <div className={`bg-[#1a1a2e] rounded-xl border border-white/10 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Version History</h3>
              <p className="text-sm text-white/50">{versions.length} versions</p>
            </div>
          </div>
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              compareMode
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            Compare
          </button>
        </div>

        {/* Compare bar */}
        {compareMode && (
          <div className="mt-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
            <p className="text-sm text-purple-300 mb-2">
              Select two versions to compare
            </p>
            <div className="flex items-center gap-2">
              <div className={`flex-1 p-2 rounded-lg border ${
                compareVersions[0] ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5'
              }`}>
                {compareVersions[0] ? (
                  <span className="text-sm text-white">v{compareVersions[0].versionNumber}</span>
                ) : (
                  <span className="text-sm text-white/40">Select first...</span>
                )}
              </div>
              <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <div className={`flex-1 p-2 rounded-lg border ${
                compareVersions[1] ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-white/5'
              }`}>
                {compareVersions[1] ? (
                  <span className="text-sm text-white">v{compareVersions[1].versionNumber}</span>
                ) : (
                  <span className="text-sm text-white/40">Select second...</span>
                )}
              </div>
              {compareVersions[0] && compareVersions[1] && (
                <button
                  onClick={() => {
                    // Compare action
                    console.log('Comparing versions:', compareVersions);
                  }}
                  className="px-3 py-2 bg-purple-500 rounded-lg text-white text-sm font-medium"
                >
                  Compare
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Version List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <svg className="w-12 h-12 mx-auto mb-3 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No version history available</p>
          </div>
        ) : (
          <div className="p-4">
            {Object.entries(groupedVersions).map(([date, dateVersions]) => (
              <div key={date} className="mb-6 last:mb-0">
                <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
                  {date}
                </h4>
                <div className="space-y-2 relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-white/10" />

                  {dateVersions.map((version, index) => {
                    const previousVersion = versions.find(v => v.versionNumber === version.versionNumber - 1);
                    const sizeChange = getSizeChange(version, previousVersion);
                    const isSelected = compareMode && (
                      compareVersions[0]?.id === version.id ||
                      compareVersions[1]?.id === version.id
                    );

                    return (
                      <div
                        key={version.id}
                        className={`relative pl-10 ${
                          compareMode ? 'cursor-pointer' : ''
                        }`}
                        onClick={() => compareMode && handleCompareSelect(version)}
                      >
                        {/* Timeline dot */}
                        <div className={`absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 ${
                          version.versionNumber === versions[0].versionNumber
                            ? 'bg-purple-500 border-purple-500'
                            : isSelected
                              ? 'bg-purple-500 border-purple-500'
                              : 'bg-[#1a1a2e] border-white/30'
                        }`} />

                        <div className={`p-3 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-purple-500/20 border border-purple-500'
                            : 'bg-white/5 hover:bg-white/10 border border-transparent'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">
                                  Version {version.versionNumber}
                                </span>
                                {version.versionNumber === versions[0].versionNumber && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                                    Current
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-white/40 mt-0.5">
                                {formatDate(version.modifiedAt)}
                              </p>
                            </div>
                            {!compareMode && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => onPreview?.(version)}
                                  className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                                  title="Preview"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => onDownload?.(version)}
                                  className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                                  title="Download"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </button>
                                {version.versionNumber !== versions[0].versionNumber && (
                                  <button
                                    onClick={() => handleRestore(version)}
                                    disabled={isRestoring}
                                    className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors disabled:opacity-50"
                                    title="Restore this version"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Modified by */}
                          {version.modifiedBy && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <span className="text-[10px] text-purple-300">
                                  {version.modifiedBy.name?.charAt(0) || version.modifiedBy.email.charAt(0)}
                                </span>
                              </div>
                              <span className="text-xs text-white/60">
                                {version.modifiedBy.name || version.modifiedBy.email}
                              </span>
                            </div>
                          )}

                          {/* Size info */}
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-white/40">{formatSize(version.size)}</span>
                            {sizeChange && (
                              <span className={`flex items-center gap-0.5 ${
                                sizeChange.isIncrease ? 'text-green-400' : 'text-red-400'
                              }`}>
                                <svg className={`w-3 h-3 ${sizeChange.isIncrease ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                {sizeChange.isIncrease ? '+' : '-'}{formatSize(Math.abs(sizeChange.diff))}
                                ({sizeChange.percent}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 bg-white/5 flex items-center justify-between">
        <p className="text-xs text-white/40">
          Versions are kept for 30 days
        </p>
        <button
          onClick={loadVersionHistory}
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

// Compact version for inline use
export const VersionBadge: React.FC<{
  file: CloudFile;
  onClick?: () => void;
  className?: string;
}> = ({ file, onClick, className = '' }) => {
  const [versionCount, setVersionCount] = useState(0);

  useEffect(() => {
    const loadCount = async () => {
      try {
        const versions = await cloudStorageService.getVersionHistory(file.provider, file.id);
        setVersionCount(versions.length);
      } catch (error) {
        console.error('Failed to load version count:', error);
      }
    };
    loadCount();
  }, [file.id, file.provider]);

  if (versionCount <= 1) return null;

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors ${className}`}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-xs font-medium">{versionCount} versions</span>
    </button>
  );
};

export default VersionHistoryPanel;
