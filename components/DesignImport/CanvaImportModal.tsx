// =============================================
// Canva Import Modal Component
// Import designs from Canva exports
// =============================================

import React, { useState, useCallback, useRef } from 'react';
import {
  X,
  Upload,
  FileImage,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileUp,
  File,
  Trash2,
} from 'lucide-react';
import { designImport, LuminaElement } from '../../services/designImportService';

// =============================================
// Types
// =============================================

interface CanvaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (elements: LuminaElement[], projectId?: string) => void;
}

interface UploadedFile {
  file: File;
  preview?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

// =============================================
// Component
// =============================================

export const CanvaImportModal: React.FC<CanvaImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  // State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // =============================================
  // Handlers
  // =============================================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(files);
  }, []);

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const ext = file.name.toLowerCase().split('.').pop();
      return ['svg', 'png', 'jpg', 'jpeg', 'pdf', 'psd'].includes(ext || '');
    });

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'pending',
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const processFiles = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);

    const allElements: LuminaElement[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const uploadedFile = uploadedFiles[i];

      // Update status
      setUploadedFiles(prev => {
        const newFiles = [...prev];
        newFiles[i] = { ...newFiles[i], status: 'processing' };
        return newFiles;
      });

      try {
        const ext = uploadedFile.file.name.toLowerCase().split('.').pop();

        if (ext === 'svg') {
          const svgText = await uploadedFile.file.text();
          const element = designImport.parseSVG(svgText);
          if (element) {
            allElements.push(element);
          }
        } else if (['png', 'jpg', 'jpeg'].includes(ext || '')) {
          // Create image element
          const dataUrl = await readFileAsDataUrl(uploadedFile.file);
          const dimensions = await getImageDimensions(dataUrl);

          const element: LuminaElement = {
            id: `img-${Date.now()}-${i}`,
            type: 'image',
            x: 0,
            y: 0,
            width: dimensions.width,
            height: dimensions.height,
            src: dataUrl,
          };
          allElements.push(element);
        }

        // Update status to completed
        setUploadedFiles(prev => {
          const newFiles = [...prev];
          newFiles[i] = { ...newFiles[i], status: 'completed' };
          return newFiles;
        });
      } catch (error) {
        // Update status to error
        setUploadedFiles(prev => {
          const newFiles = [...prev];
          newFiles[i] = {
            ...newFiles[i],
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          return newFiles;
        });
      }
    }

    setIsProcessing(false);

    if (allElements.length > 0) {
      onImportComplete(allElements);
    }
  };

  // =============================================
  // Utilities
  // =============================================

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve({ width: 400, height: 300 });
      img.src = src;
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <FileImage className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Import from Canva</h2>
              <p className="text-sm text-zinc-500">Import exported Canva designs</p>
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
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center
              cursor-pointer transition-all ${
                isDragging
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/30'
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".svg,.png,.jpg,.jpeg,.pdf,.psd"
              onChange={handleFileInput}
              className="hidden"
            />

            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
              ${isDragging ? 'bg-cyan-500/20' : 'bg-zinc-800'}`}>
              <FileUp className={`w-8 h-8 ${isDragging ? 'text-cyan-400' : 'text-zinc-500'}`} />
            </div>

            <h3 className="text-lg font-medium text-white mb-2">
              {isDragging ? 'Drop files here' : 'Drag & drop your files'}
            </h3>
            <p className="text-sm text-zinc-500 mb-4">
              or click to browse your computer
            </p>
            <p className="text-xs text-zinc-600">
              Supported: SVG, PNG, JPG, PDF, PSD
            </p>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
            <h4 className="text-sm font-medium text-zinc-300 mb-2">How to export from Canva:</h4>
            <ol className="text-xs text-zinc-500 space-y-1 list-decimal list-inside">
              <li>Open your design in Canva</li>
              <li>Click "Share" then "Download"</li>
              <li>Select SVG format for best results (PNG/JPG also supported)</li>
              <li>Upload the exported file here</li>
            </ol>
          </div>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-zinc-300">
                Files ({uploadedFiles.length})
              </h4>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl
                      border border-zinc-700/50"
                  >
                    {/* Preview */}
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-12 h-12 rounded-lg object-cover bg-zinc-900"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center">
                        <File className="w-6 h-6 text-zinc-500" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{file.file.name}</p>
                      <p className="text-xs text-zinc-500">{formatFileSize(file.file.size)}</p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {file.status === 'pending' && (
                        <span className="text-xs text-zinc-500">Pending</span>
                      )}
                      {file.status === 'processing' && (
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                      )}
                      {file.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      )}
                      {file.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}

                      {file.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="p-1 rounded hover:bg-zinc-700 text-zinc-500
                            hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
          <span className="text-sm text-zinc-500">
            {uploadedFiles.filter(f => f.status === 'pending').length} file(s) ready to import
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white
                hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={processFiles}
              disabled={uploadedFiles.filter(f => f.status === 'pending').length === 0 || isProcessing}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-cyan-500 text-white
                hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Files
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvaImportModal;
