// ============================================
// MergePanel - PDF Merge Interface
// ============================================

import React, { useState, useCallback, useRef } from 'react';

// Types
interface PDFFile {
  id: string;
  file: File;
  name: string;
  pageCount: number;
  fileSize: number;
  thumbnail?: string;
  selectedPages: number[] | 'all';
  isLoading: boolean;
  error?: string;
}

interface MergeOptions {
  outputName: string;
  bookmarks: 'keep' | 'flatten' | 'remove';
  annotations: boolean;
  formFields: boolean;
  attachments: boolean;
  metadata: 'first' | 'custom' | 'none';
  customMetadata?: {
    title?: string;
    author?: string;
    subject?: string;
  };
}

interface MergePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMerge: (files: PDFFile[], options: MergeOptions) => Promise<void>;
  className?: string;
}

// Helper functions
const generateId = () => Math.random().toString(36).substring(2, 9);

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const MergePanel: React.FC<MergePanelProps> = ({
  isOpen,
  onClose,
  onMerge,
  className = ''
}) => {
  // State
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<MergeOptions>({
    outputName: 'merged-document',
    bookmarks: 'keep',
    annotations: true,
    formFields: true,
    attachments: true,
    metadata: 'first'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);

  // Calculate total pages and size
  const totalPages = files.reduce((sum, f) => {
    if (f.selectedPages === 'all') return sum + f.pageCount;
    return sum + f.selectedPages.length;
  }, 0);

  const totalSize = files.reduce((sum, f) => sum + f.fileSize, 0);

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: PDFFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.type !== 'application/pdf') continue;

      const pdfFile: PDFFile = {
        id: generateId(),
        file,
        name: file.name,
        pageCount: 0,
        fileSize: file.size,
        selectedPages: 'all',
        isLoading: true
      };

      newFiles.push(pdfFile);
    }

    setFiles(prev => [...prev, ...newFiles]);

    // Simulate loading page counts (would use pdf.js in production)
    for (const pdfFile of newFiles) {
      setTimeout(() => {
        setFiles(prev => prev.map(f =>
          f.id === pdfFile.id
            ? { ...f, pageCount: Math.floor(Math.random() * 20) + 1, isLoading: false }
            : f
        ));
      }, 500 + Math.random() * 500);
    }
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Remove file
  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // Reorder files
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverIndex !== null && dragItem.current !== dragOverIndex) {
      const newFiles = [...files];
      const [draggedFile] = newFiles.splice(dragItem.current, 1);
      newFiles.splice(dragOverIndex, 0, draggedFile);
      setFiles(newFiles);
    }
    dragItem.current = null;
    setDragOverIndex(null);
  };

  // Move file up/down
  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= files.length) return;

    const newFiles = [...files];
    [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
    setFiles(newFiles);
  };

  // Toggle page selection
  const togglePageSelection = (fileId: string, pageNum: number) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== fileId) return f;

      if (f.selectedPages === 'all') {
        // Switch to custom selection, excluding this page
        const pages = Array.from({ length: f.pageCount }, (_, i) => i + 1).filter(p => p !== pageNum);
        return { ...f, selectedPages: pages };
      } else {
        const pages = [...f.selectedPages];
        const idx = pages.indexOf(pageNum);
        if (idx > -1) {
          pages.splice(idx, 1);
        } else {
          pages.push(pageNum);
          pages.sort((a, b) => a - b);
        }
        return { ...f, selectedPages: pages.length === f.pageCount ? 'all' : pages };
      }
    }));
  };

  // Select all pages for a file
  const selectAllPages = (fileId: string) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, selectedPages: 'all' } : f
    ));
  };

  // Handle merge
  const handleMerge = async () => {
    if (files.length < 2) return;

    setIsMerging(true);
    try {
      await onMerge(files, options);
      onClose();
    } catch (error) {
      console.error('Merge failed:', error);
    } finally {
      setIsMerging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="bg-[#1a1a2e] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Merge PDFs</h2>
              <p className="text-sm text-white/50">Combine multiple PDF files into one</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all mb-4"
          >
            <svg className="w-12 h-12 mx-auto text-white/30 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-white/70 mb-1">Drop PDF files here or click to browse</p>
            <p className="text-white/40 text-sm">Supports multiple files</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/70 text-sm">
                  {files.length} file{files.length !== 1 ? 's' : ''} • {totalPages} pages • {formatFileSize(totalSize)}
                </span>
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Options
                </button>
              </div>

              {/* Options Panel */}
              {showOptions && (
                <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Output filename</label>
                      <input
                        type="text"
                        value={options.outputName}
                        onChange={(e) => setOptions(prev => ({ ...prev, outputName: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/10 rounded-lg text-white text-sm border border-white/10 focus:border-blue-500/50 focus:outline-none"
                        placeholder="merged-document"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Bookmarks</label>
                      <select
                        value={options.bookmarks}
                        onChange={(e) => setOptions(prev => ({ ...prev, bookmarks: e.target.value as 'keep' | 'flatten' | 'remove' }))}
                        className="w-full px-3 py-2 bg-white/10 rounded-lg text-white text-sm border border-white/10 focus:border-blue-500/50 focus:outline-none"
                      >
                        <option value="keep">Keep all bookmarks</option>
                        <option value="flatten">Flatten to single level</option>
                        <option value="remove">Remove bookmarks</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.annotations}
                        onChange={(e) => setOptions(prev => ({ ...prev, annotations: e.target.checked }))}
                        className="w-4 h-4 rounded accent-blue-500"
                      />
                      Keep annotations
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.formFields}
                        onChange={(e) => setOptions(prev => ({ ...prev, formFields: e.target.checked }))}
                        className="w-4 h-4 rounded accent-blue-500"
                      />
                      Keep form fields
                    </label>
                    <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={options.attachments}
                        onChange={(e) => setOptions(prev => ({ ...prev, attachments: e.target.checked }))}
                        className="w-4 h-4 rounded accent-blue-500"
                      />
                      Keep attachments
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-1">Metadata</label>
                    <div className="flex gap-4">
                      {(['first', 'custom', 'none'] as const).map(opt => (
                        <label key={opt} className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                          <input
                            type="radio"
                            name="metadata"
                            checked={options.metadata === opt}
                            onChange={() => setOptions(prev => ({ ...prev, metadata: opt }))}
                            className="w-4 h-4 accent-blue-500"
                          />
                          {opt === 'first' ? 'From first file' : opt === 'custom' ? 'Custom' : 'None'}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* File Cards */}
              {files.map((file, index) => (
                <div
                  key={file.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`bg-white/5 rounded-xl p-4 border transition-all ${
                    dragOverIndex === index ? 'border-blue-500 bg-blue-500/10' : 'border-transparent'
                  } ${file.error ? 'border-red-500/50' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Drag Handle */}
                    <div className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing">
                      <span className="text-white/40 text-sm font-medium">{index + 1}</span>
                      <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-16 h-20 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      {file.isLoading ? (
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                          <path d="M14 2v6h6" />
                        </svg>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{file.name}</h4>
                      <p className="text-white/50 text-sm">
                        {file.isLoading ? 'Loading...' : `${file.pageCount} pages • ${formatFileSize(file.fileSize)}`}
                      </p>

                      {/* Page Selection */}
                      {!file.isLoading && file.pageCount > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-white/50">Pages:</span>
                            <button
                              onClick={() => selectAllPages(file.id)}
                              className={`text-xs px-2 py-0.5 rounded ${
                                file.selectedPages === 'all'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white/10 text-white/70 hover:bg-white/20'
                              }`}
                            >
                              All
                            </button>
                            <span className="text-xs text-white/40">
                              {file.selectedPages === 'all'
                                ? `${file.pageCount} selected`
                                : `${file.selectedPages.length} selected`
                              }
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {Array.from({ length: Math.min(file.pageCount, 10) }, (_, i) => i + 1).map(pageNum => {
                              const isSelected = file.selectedPages === 'all' || file.selectedPages.includes(pageNum);
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => togglePageSelection(file.id, pageNum)}
                                  className={`w-7 h-7 text-xs rounded flex items-center justify-center ${
                                    isSelected
                                      ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                                      : 'bg-white/5 text-white/40 hover:bg-white/10'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            {file.pageCount > 10 && (
                              <span className="text-xs text-white/40 flex items-center px-2">
                                +{file.pageCount - 10} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveFile(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveFile(index, 'down')}
                        disabled={index === files.length - 1}
                        className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-white/50 hover:text-red-400"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {files.length === 0 && (
            <div className="text-center py-8 text-white/40">
              <p>No files added yet. Add at least 2 PDF files to merge.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
          <div className="text-sm text-white/50">
            {files.length >= 2 && (
              <span>Ready to merge {files.length} files into {totalPages} pages</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMerge}
              disabled={files.length < 2 || isMerging}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isMerging ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Merge PDFs
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MergePanel;
