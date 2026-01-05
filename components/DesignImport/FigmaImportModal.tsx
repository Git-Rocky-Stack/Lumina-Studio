// =============================================
// Figma Import Modal Component
// Import designs from Figma files
// =============================================

import React, { useState, useCallback } from 'react';
import {
  X,
  Upload,
  Link,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileImage,
  Layers,
  Settings,
  ChevronDown,
  ChevronRight,
  Info,
} from 'lucide-react';
import { designImport, ImportOptions, LuminaElement } from '../../services/designImportService';

// =============================================
// Types
// =============================================

interface FigmaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (elements: LuminaElement[], projectId?: string) => void;
}

interface ImportProgress {
  status: 'idle' | 'fetching' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  warnings: string[];
  errors: string[];
}

// =============================================
// Component
// =============================================

export const FigmaImportModal: React.FC<FigmaImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  // State
  const [figmaUrl, setFigmaUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    flattenGroups: false,
    importImages: true,
    preserveIds: false,
    maxDepth: 10,
  });
  const [progress, setProgress] = useState<ImportProgress>({
    status: 'idle',
    progress: 0,
    message: '',
    warnings: [],
    errors: [],
  });
  const [previewNodes, setPreviewNodes] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

  // =============================================
  // Handlers
  // =============================================

  const extractFileKey = (url: string): string | null => {
    // Figma URL format: https://www.figma.com/file/FILEKEY/filename
    const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const handleFetchPreview = async () => {
    const fileKey = extractFileKey(figmaUrl);
    if (!fileKey) {
      setProgress({
        ...progress,
        status: 'error',
        message: 'Invalid Figma URL',
        errors: ['Please enter a valid Figma file URL'],
      });
      return;
    }

    if (!accessToken) {
      setProgress({
        ...progress,
        status: 'error',
        message: 'Access token required',
        errors: ['Please enter your Figma personal access token'],
      });
      return;
    }

    setProgress({
      status: 'fetching',
      progress: 20,
      message: 'Fetching file structure...',
      warnings: [],
      errors: [],
    });

    // Set the token
    designImport.setFigmaToken(accessToken);

    // Fetch file info
    const file = await designImport.getFigmaFile(fileKey);
    if (!file) {
      setProgress({
        status: 'error',
        progress: 0,
        message: 'Failed to fetch file',
        warnings: [],
        errors: ['Could not fetch file. Check your access token and file URL.'],
      });
      return;
    }

    // Extract top-level frames/pages
    const nodes: Array<{ id: string; name: string; type: string }> = [];
    if (file.document?.children) {
      file.document.children.forEach((page: any) => {
        if (page.children) {
          page.children.forEach((child: any) => {
            if (child.type === 'FRAME' || child.type === 'COMPONENT') {
              nodes.push({
                id: child.id,
                name: child.name,
                type: child.type,
              });
            }
          });
        }
      });
    }

    setPreviewNodes(nodes);
    setSelectedNodeIds(nodes.map(n => n.id));
    setProgress({
      status: 'idle',
      progress: 0,
      message: `Found ${nodes.length} frames`,
      warnings: [],
      errors: [],
    });
  };

  const handleImport = async () => {
    const fileKey = extractFileKey(figmaUrl);
    if (!fileKey) return;

    setProgress({
      status: 'processing',
      progress: 30,
      message: 'Importing designs...',
      warnings: [],
      errors: [],
    });

    try {
      const result = await designImport.importFromFigma(
        fileKey,
        selectedNodeIds.length > 0 ? selectedNodeIds : undefined,
        importOptions
      );

      if (result) {
        // Get import result from database
        const { supabase } = await import('../../lib/supabase');
        const { data } = await supabase
          .from('design_imports')
          .select('*')
          .eq('id', result)
          .single();

        if (data && data.result_data) {
          setProgress({
            status: 'completed',
            progress: 100,
            message: 'Import complete!',
            warnings: data.warnings || [],
            errors: data.errors || [],
          });

          onImportComplete(data.result_data.elements || [], data.result_project_id);
        }
      } else {
        throw new Error('Import failed');
      }
    } catch (error) {
      setProgress({
        status: 'error',
        progress: 0,
        message: 'Import failed',
        warnings: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  };

  const toggleNodeSelection = (nodeId: string) => {
    setSelectedNodeIds(prev =>
      prev.includes(nodeId)
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  // =============================================
  // Render
  // =============================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden
        bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <FileImage className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Import from Figma</h2>
              <p className="text-sm text-zinc-500">Import designs directly from Figma</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white
              transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Figma URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Figma File URL</label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="url"
                value={figmaUrl}
                onChange={(e) => setFigmaUrl(e.target.value)}
                placeholder="https://www.figma.com/file/..."
                className="w-full pl-11 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50
                  rounded-xl text-white placeholder-zinc-500 focus:border-violet-500/50
                  focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>
          </div>

          {/* Access Token Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              Personal Access Token
              <a
                href="https://www.figma.com/developers/api#access-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300"
              >
                <Info className="w-4 h-4" />
              </a>
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Enter your Figma access token"
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50
                rounded-xl text-white placeholder-zinc-500 focus:border-violet-500/50
                focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>

          {/* Fetch Button */}
          {previewNodes.length === 0 && (
            <button
              onClick={handleFetchPreview}
              disabled={!figmaUrl || !accessToken || progress.status === 'fetching'}
              className="w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2
                bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50
                disabled:cursor-not-allowed transition-colors"
            >
              {progress.status === 'fetching' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Fetch File Structure
                </>
              )}
            </button>
          )}

          {/* Preview Nodes */}
          {previewNodes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-300">
                  Select Frames to Import
                </label>
                <button
                  onClick={() => setSelectedNodeIds(
                    selectedNodeIds.length === previewNodes.length
                      ? []
                      : previewNodes.map(n => n.id)
                  )}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  {selectedNodeIds.length === previewNodes.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-zinc-800/30 rounded-xl
                border border-zinc-700/50">
                {previewNodes.map((node) => (
                  <label
                    key={node.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-700/50
                      cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedNodeIds.includes(node.id)}
                      onChange={() => toggleNodeSelection(node.id)}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-700
                        text-violet-500 focus:ring-violet-500/20"
                    />
                    <Layers className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-300">{node.name}</span>
                    <span className="text-xs text-zinc-500 ml-auto">{node.type}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Options */}
          <div className="border border-zinc-700/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-4 py-3
                hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-zinc-400">
                <Settings className="w-4 h-4" />
                <span className="text-sm">Advanced Options</span>
              </div>
              {showAdvanced ? (
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              )}
            </button>

            {showAdvanced && (
              <div className="px-4 pb-4 space-y-4 border-t border-zinc-700/50">
                <label className="flex items-center justify-between py-2">
                  <span className="text-sm text-zinc-400">Flatten Groups</span>
                  <input
                    type="checkbox"
                    checked={importOptions.flattenGroups}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      flattenGroups: e.target.checked,
                    })}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-700
                      text-violet-500 focus:ring-violet-500/20"
                  />
                </label>
                <label className="flex items-center justify-between py-2">
                  <span className="text-sm text-zinc-400">Import Images</span>
                  <input
                    type="checkbox"
                    checked={importOptions.importImages}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      importImages: e.target.checked,
                    })}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-700
                      text-violet-500 focus:ring-violet-500/20"
                  />
                </label>
                <label className="flex items-center justify-between py-2">
                  <span className="text-sm text-zinc-400">Preserve Original IDs</span>
                  <input
                    type="checkbox"
                    checked={importOptions.preserveIds}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      preserveIds: e.target.checked,
                    })}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-700
                      text-violet-500 focus:ring-violet-500/20"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Progress/Status */}
          {progress.status !== 'idle' && (
            <div className={`p-4 rounded-xl border ${
              progress.status === 'completed'
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : progress.status === 'error'
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-violet-500/10 border-violet-500/20'
            }`}>
              <div className="flex items-center gap-3">
                {progress.status === 'completed' && (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                )}
                {progress.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                {(progress.status === 'fetching' || progress.status === 'processing') && (
                  <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                )}
                <span className={`text-sm ${
                  progress.status === 'completed'
                    ? 'text-emerald-400'
                    : progress.status === 'error'
                    ? 'text-red-400'
                    : 'text-violet-400'
                }`}>
                  {progress.message}
                </span>
              </div>

              {/* Progress bar */}
              {(progress.status === 'fetching' || progress.status === 'processing') && (
                <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              )}

              {/* Warnings */}
              {progress.warnings.length > 0 && (
                <div className="mt-3 space-y-1">
                  {progress.warnings.map((warning, i) => (
                    <p key={i} className="text-xs text-amber-400">{warning}</p>
                  ))}
                </div>
              )}

              {/* Errors */}
              {progress.errors.length > 0 && (
                <div className="mt-3 space-y-1">
                  {progress.errors.map((error, i) => (
                    <p key={i} className="text-xs text-red-400">{error}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {previewNodes.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
            <span className="text-sm text-zinc-500">
              {selectedNodeIds.length} frames selected
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setPreviewNodes([]);
                  setSelectedNodeIds([]);
                }}
                className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white
                  hover:bg-zinc-800 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={selectedNodeIds.length === 0 || progress.status === 'processing'}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-violet-500 text-white
                  hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors flex items-center gap-2"
              >
                {progress.status === 'processing' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import Selected
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FigmaImportModal;
