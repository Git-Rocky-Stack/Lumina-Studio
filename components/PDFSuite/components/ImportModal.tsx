// ============================================
// ImportModal Component
// Multi-format document import wizard
// ============================================

import React, { useState, useCallback, useRef } from 'react';

type ImportFormat = 'pdf' | 'image' | 'docx' | 'html' | 'url';
type ImportStep = 'select' | 'configure' | 'processing' | 'complete';

interface ImportOptions {
  format: ImportFormat;
  files: File[];
  url?: string;
  // Image options
  imageQuality?: 'high' | 'medium' | 'low';
  imageFit?: 'fit' | 'fill' | 'stretch';
  // DOCX options
  preserveFormatting?: boolean;
  extractImages?: boolean;
  // General options
  createNewDocument?: boolean;
  insertAtPage?: number;
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (options: ImportOptions) => Promise<void>;
  currentPageCount?: number;
  className?: string;
}

const IMPORT_FORMATS: { id: ImportFormat; label: string; icon: string; description: string; accepts: string }[] = [
  { id: 'pdf', label: 'PDF Document', icon: 'fa-file-pdf', description: 'Import existing PDF files', accepts: '.pdf' },
  { id: 'image', label: 'Images', icon: 'fa-image', description: 'Convert images to PDF (PNG, JPG, GIF, WebP)', accepts: '.png,.jpg,.jpeg,.gif,.webp,.bmp,.tiff' },
  { id: 'docx', label: 'Word Document', icon: 'fa-file-word', description: 'Import Microsoft Word documents', accepts: '.docx,.doc' },
  { id: 'html', label: 'HTML File', icon: 'fa-code', description: 'Convert HTML pages to PDF', accepts: '.html,.htm' },
  { id: 'url', label: 'Web URL', icon: 'fa-globe', description: 'Capture a webpage as PDF', accepts: '' },
];

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  currentPageCount = 0,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportStep>('select');
  const [selectedFormat, setSelectedFormat] = useState<ImportFormat | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState('');
  const [options, setOptions] = useState<Partial<ImportOptions>>({
    imageQuality: 'high',
    imageFit: 'fit',
    preserveFormatting: true,
    extractImages: true,
    createNewDocument: true,
    insertAtPage: currentPageCount,
  });
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Reset state when modal opens
  const resetState = useCallback(() => {
    setStep('select');
    setSelectedFormat(null);
    setFiles([]);
    setUrl('');
    setProgress(0);
    setError(null);
  }, []);

  // Handle format selection
  const handleFormatSelect = useCallback((format: ImportFormat) => {
    setSelectedFormat(format);
    setError(null);

    if (format === 'url') {
      setStep('configure');
    } else {
      fileInputRef.current?.click();
    }
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setStep('configure');
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    // Detect format from file extension
    const firstFile = droppedFiles[0]!;
    const ext = firstFile.name.split('.').pop()?.toLowerCase();

    let format: ImportFormat = 'pdf';
    if (ext === 'pdf') format = 'pdf';
    else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff'].includes(ext || '')) format = 'image';
    else if (['docx', 'doc'].includes(ext || '')) format = 'docx';
    else if (['html', 'htm'].includes(ext || '')) format = 'html';

    setSelectedFormat(format);
    setFiles(droppedFiles);
    setStep('configure');
  }, []);

  // Handle import
  const handleImport = useCallback(async () => {
    if (!selectedFormat) return;

    setStep('processing');
    setProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90));
      }, 200);

      await onImport({
        format: selectedFormat,
        files,
        url: url || undefined,
        ...options,
      } as ImportOptions);

      clearInterval(progressInterval);
      setProgress(100);
      setStep('complete');

      // Auto close after success
      setTimeout(() => {
        onClose();
        resetState();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStep('configure');
    }
  }, [selectedFormat, files, url, options, onImport, onClose, resetState]);

  // Remove file from list
  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Get file size string
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[600px] max-w-[90vw] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-500 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <i className="fas fa-file-import text-white text-lg"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Import Document</h2>
              <p className="text-xs text-white/70">
                {step === 'select' && 'Choose a file format to import'}
                {step === 'configure' && 'Configure import options'}
                {step === 'processing' && 'Importing your document...'}
                {step === 'complete' && 'Import complete!'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple={selectedFormat === 'image'}
          accept={IMPORT_FORMATS.find((f) => f.id === selectedFormat)?.accepts || ''}
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Format Selection */}
          {step === 'select' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`transition-all ${isDragging ? 'opacity-50' : ''}`}
            >
              {/* Drop zone overlay */}
              {isDragging && (
                <div className="absolute inset-0 bg-indigo-500/20 border-2 border-dashed border-indigo-500 rounded-xl flex items-center justify-center z-10">
                  <div className="text-center">
                    <i className="fas fa-cloud-upload-alt text-4xl text-indigo-500 mb-2"></i>
                    <p className="text-indigo-600 font-bold">Drop files here</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {IMPORT_FORMATS.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => handleFormatSelect(format.id)}
                    className="p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                        <i className={`fas ${format.icon} text-slate-500 group-hover:text-indigo-500`}></i>
                      </div>
                      <span className="font-bold text-slate-700">{format.label}</span>
                    </div>
                    <p className="text-xs text-slate-500">{format.description}</p>
                  </button>
                ))}
              </div>

              <div className="mt-4 p-4 bg-slate-50 rounded-xl text-center">
                <i className="fas fa-info-circle text-slate-400 mr-2"></i>
                <span className="text-sm text-slate-500">
                  Drag and drop files anywhere or click a format to browse
                </span>
              </div>
            </div>
          )}

          {/* Step 2: Configuration */}
          {step === 'configure' && (
            <div className="space-y-6">
              {/* Selected files */}
              {files.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                    Selected Files ({files.length})
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {files.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                      >
                        <i className={`fas ${IMPORT_FORMATS.find((f) => f.id === selectedFormat)?.icon} text-slate-400`}></i>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          onClick={() => removeFile(i)}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* URL input */}
              {selectedFormat === 'url' && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                    Web Page URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Image options */}
              {selectedFormat === 'image' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                      Image Quality
                    </label>
                    <select
                      value={options.imageQuality}
                      onChange={(e) => setOptions({ ...options, imageQuality: e.target.value as 'high' | 'medium' | 'low' })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="high">High (Best Quality)</option>
                      <option value="medium">Medium (Balanced)</option>
                      <option value="low">Low (Smaller Size)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
                      Page Fit
                    </label>
                    <select
                      value={options.imageFit}
                      onChange={(e) => setOptions({ ...options, imageFit: e.target.value as 'fit' | 'fill' | 'stretch' })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="fit">Fit to Page</option>
                      <option value="fill">Fill Page</option>
                      <option value="stretch">Stretch to Fit</option>
                    </select>
                  </div>
                </div>
              )}

              {/* DOCX options */}
              {selectedFormat === 'docx' && (
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.preserveFormatting}
                      onChange={(e) => setOptions({ ...options, preserveFormatting: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">Preserve text formatting</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={options.extractImages}
                      onChange={(e) => setOptions({ ...options, extractImages: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">Include embedded images</span>
                  </label>
                </div>
              )}

              {/* Import destination */}
              {currentPageCount > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 block">
                    Import Destination
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="radio"
                        name="destination"
                        checked={options.createNewDocument}
                        onChange={() => setOptions({ ...options, createNewDocument: true })}
                        className="w-4 h-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-700">Create new document</span>
                        <p className="text-xs text-slate-400">Start fresh with imported content</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="radio"
                        name="destination"
                        checked={!options.createNewDocument}
                        onChange={() => setOptions({ ...options, createNewDocument: false })}
                        className="w-4 h-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-slate-700">Insert into current document</span>
                        <p className="text-xs text-slate-400">Add pages at position:</p>
                        <select
                          value={options.insertAtPage}
                          onChange={(e) => setOptions({ ...options, insertAtPage: parseInt(e.target.value) })}
                          disabled={options.createNewDocument}
                          className="mt-2 px-2 py-1 border border-slate-200 rounded text-xs disabled:opacity-50"
                        >
                          <option value={0}>Beginning</option>
                          {Array.from({ length: currentPageCount }, (_, i) => (
                            <option key={i + 1} value={i + 1}>After page {i + 1}</option>
                          ))}
                        </select>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm flex items-center gap-3">
                  <i className="fas fa-exclamation-circle"></i>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
                <i className="fas fa-spinner fa-spin text-2xl text-indigo-500"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Importing...</h3>
              <p className="text-sm text-slate-500 mb-4">Please wait while we process your files</p>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">{progress}% complete</p>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <i className="fas fa-check text-2xl text-emerald-500"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Import Complete!</h3>
              <p className="text-sm text-slate-500">Your document has been imported successfully</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === 'select' || step === 'configure') && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={step === 'configure' ? () => setStep('select') : onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {step === 'configure' ? (
                <>
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back
                </>
              ) : (
                'Cancel'
              )}
            </button>

            {step === 'configure' && (
              <button
                onClick={handleImport}
                disabled={files.length === 0 && !url}
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <i className="fas fa-file-import"></i>
                Import
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportModal;
