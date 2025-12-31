// ============================================
// PDFMergePanel Component
// Merge multiple PDFs into a single document
// ============================================

import React, { useState, useCallback, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  thumbnail?: string;
}

interface PDFMergePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMergeComplete: (mergedPdf: Uint8Array, filename: string) => void;
  className?: string;
}

export const PDFMergePanel: React.FC<PDFMergePanelProps> = ({
  isOpen,
  onClose,
  onMergeComplete,
  className = '',
}) => {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add files to the list
  const handleAddFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    setError(null);

    for (const file of fileArray) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are supported');
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();

        // Generate thumbnail from first page
        let thumbnail: string | undefined;
        try {
          // Using pdfjs for thumbnail would require importing it
          // For simplicity, we'll skip thumbnail generation here
        } catch {
          // Thumbnail generation failed, continue without it
        }

        const pdfFile: PDFFile = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          pageCount,
          thumbnail,
        };

        setFiles((prev) => [...prev, pdfFile]);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        setError(`Failed to load ${file.name}: Invalid or corrupted PDF`);
      }
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleAddFiles(e.target.files);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleAddFiles]
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files) {
        handleAddFiles(e.dataTransfer.files);
      }
    },
    [handleAddFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Remove a file
  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Reorder files with drag and drop
  const handleFileDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleFileDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleFileDrop = useCallback(
    (index: number) => {
      if (draggedIndex === null || draggedIndex === index) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }

      setFiles((prev) => {
        const newFiles = [...prev];
        const [removed] = newFiles.splice(draggedIndex, 1);
        newFiles.splice(index, 0, removed);
        return newFiles;
      });

      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [draggedIndex]
  );

  const handleFileDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Move file up/down
  const moveFile = useCallback((index: number, direction: 'up' | 'down') => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newFiles.length) return prev;
      [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
      return newFiles;
    });
  }, []);

  // Merge PDFs
  const handleMerge = useCallback(async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files to merge');
      return;
    }

    setIsMerging(true);
    setError(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const pdfFile of files) {
        const arrayBuffer = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `merged-${timestamp}.pdf`;

      onMergeComplete(mergedBytes, filename);

      // Clear files and close
      setFiles([]);
      onClose();
    } catch (err) {
      console.error('Merge failed:', err);
      setError('Failed to merge PDFs. Please try again.');
    } finally {
      setIsMerging(false);
    }
  }, [files, onMergeComplete, onClose]);

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Calculate total pages
  const totalPages = files.reduce((sum, f) => sum + f.pageCount, 0);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-object-group text-emerald-600"></i>
            </div>
            <div>
              <h2 className="type-section text-slate-800">Merge PDFs</h2>
              <p className="type-caption text-slate-500">Combine multiple PDFs into one document</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors cursor-pointer mb-6"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <i className="fas fa-cloud-upload-alt text-2xl text-slate-400"></i>
            </div>
            <p className="type-label text-slate-700 mb-1">Drop PDFs here or click to browse</p>
            <p className="type-caption text-slate-400">Add files in the order you want them merged</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600 flex items-center gap-2">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          {/* Files list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="type-card text-slate-700">
                  {files.length} file{files.length !== 1 ? 's' : ''} ({totalPages} pages)
                </h3>
                <button
                  onClick={() => setFiles([])}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Clear all
                </button>
              </div>

              {files.map((file, index) => (
                <div
                  key={file.id}
                  draggable
                  onDragStart={() => handleFileDragStart(index)}
                  onDragOver={(e) => handleFileDragOver(e, index)}
                  onDrop={() => handleFileDrop(index)}
                  onDragEnd={handleFileDragEnd}
                  className={`
                    group flex items-center gap-3 p-3 rounded-xl border transition-all
                    ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
                    ${dragOverIndex === index ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}
                  `}
                >
                  {/* Drag handle */}
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                    <i className="fas fa-grip-vertical"></i>
                  </div>

                  {/* Order number */}
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-bold text-sm">
                    {index + 1}
                  </div>

                  {/* File icon */}
                  <div className="w-10 h-12 bg-rose-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-file-pdf text-rose-400"></i>
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{formatSize(file.size)}</span>
                      <span>-</span>
                      <span>{file.pageCount} page{file.pageCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveFile(index, 'up')}
                      disabled={index === 0}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        index === 0 ? 'text-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Move up"
                    >
                      <i className="fas fa-chevron-up text-xs"></i>
                    </button>
                    <button
                      onClick={() => moveFile(index, 'down')}
                      disabled={index === files.length - 1}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        index === files.length - 1 ? 'text-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Move down"
                    >
                      <i className="fas fa-chevron-down text-xs"></i>
                    </button>
                    <button
                      onClick={() => handleRemoveFile(file.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Remove"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {files.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">No PDFs added yet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-slate-500 text-sm">
            {files.length >= 2 ? (
              <>
                <i className="fas fa-info-circle mr-2"></i>
                Drag to reorder. First file will be at the beginning.
              </>
            ) : (
              <>
                <i className="fas fa-lightbulb mr-2 text-amber-500"></i>
                Add at least 2 PDFs to merge
              </>
            )}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMerge}
              disabled={files.length < 2 || isMerging}
              className={`px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-all ${
                files.length >= 2 && !isMerging
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isMerging ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Merging...
                </>
              ) : (
                <>
                  <i className="fas fa-object-group"></i>
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

export default PDFMergePanel;
