import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, Image, Video, Music, FileText, X, Check, AlertCircle } from 'lucide-react';
import { springPresets } from '../animations';
import { useSoundEffect } from '../sounds';

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

interface DragDropUploadProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onUpload,
  accept = '*',
  multiple = true,
  maxSize = 50 * 1024 * 1024, // 50MB default
  maxFiles = 10,
  disabled = false,
  className = '',
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const playSound = useSoundEffect();

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return <Image size={20} />;
    if (type.startsWith('video/')) return <Video size={20} />;
    if (type.startsWith('audio/')) return <Music size={20} />;
    if (type.includes('pdf') || type.includes('document')) return <FileText size={20} />;
    return <File size={20} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File too large. Max size is ${formatFileSize(maxSize)}`;
    }
    return null;
  };

  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles = Array.from(fileList).slice(0, maxFiles - files.length);

    const uploadFiles: UploadedFile[] = newFiles.map(file => {
      const error = validateFile(file);
      return {
        id: Math.random().toString(36).slice(2),
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        progress: error ? 0 : 0,
        status: error ? 'error' : 'uploading',
        error,
      };
    });

    setFiles(prev => [...prev, ...uploadFiles]);

    // Simulate upload with progress
    const validFiles = uploadFiles.filter(f => f.status !== 'error');

    for (const uploadFile of validFiles) {
      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? { ...f, progress: i } : f
        ));
      }

      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id ? { ...f, status: 'complete', progress: 100 } : f
      ));
      playSound('success');
    }

    // Call actual upload handler
    try {
      await onUpload(validFiles.map(f => f.file));
    } catch (error) {
      // Handle upload error
    }
  }, [files, maxFiles, maxSize, onUpload, playSound]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter(f => f.id !== id);
    });
  };

  return (
    <div className={className}>
      {/* Drop zone */}
      <motion.div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer
          transition-colors
          ${isDragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-zinc-300 dark:border-zinc-600 hover:border-indigo-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        animate={{
          scale: isDragging ? 1.02 : 1,
        }}
        transition={springPresets.snappy}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        {children || (
          <div className="flex flex-col items-center gap-3">
            <motion.div
              className={`
                w-16 h-16 rounded-full flex items-center justify-center
                ${isDragging ? 'bg-indigo-100 dark:bg-indigo-800' : 'bg-zinc-100 dark:bg-zinc-800'}
              `}
              animate={{
                y: isDragging ? -5 : 0,
              }}
            >
              <Upload
                size={24}
                className={isDragging ? 'text-indigo-500' : 'text-zinc-400'}
              />
            </motion.div>

            <div>
              <p className="font-medium text-zinc-900 dark:text-white">
                {isDragging ? 'Drop files here' : 'Drag and drop files here'}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                or click to browse
              </p>
            </div>

            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Max {formatFileSize(maxSize)} per file • Up to {maxFiles} files
            </p>
          </div>
        )}

        {/* Overlay when dragging */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              className="absolute inset-0 rounded-xl bg-indigo-500/10 border-2 border-indigo-500 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-indigo-500 text-white px-4 py-2 rounded-full font-medium"
              >
                Drop to upload
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            className="mt-4 space-y-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {files.map((file, index) => (
              <motion.div
                key={file.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Preview or icon */}
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                  {file.preview ? (
                    <img src={file.preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-zinc-400">{getFileIcon(file.file)}</span>
                  )}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {formatFileSize(file.file.size)}
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {file.status === 'uploading' && (
                    <div className="w-20">
                      <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-indigo-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {file.status === 'complete' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"
                    >
                      <Check size={14} className="text-white" />
                    </motion.div>
                  )}

                  {file.status === 'error' && (
                    <div className="flex items-center gap-1 text-red-500">
                      <AlertCircle size={16} />
                      <span className="text-xs">{file.error}</span>
                    </div>
                  )}

                  <motion.button
                    onClick={() => removeFile(file.id)}
                    className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={16} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Global drop zone overlay (for dropping anywhere in the app)
interface GlobalDropZoneProps {
  onDrop: (files: File[]) => void;
  accept?: string;
}

export const GlobalDropZone: React.FC<GlobalDropZoneProps> = ({
  onDrop,
  accept = '*',
}) => {
  const [isActive, setIsActive] = useState(false);
  const dragCounter = useRef(0);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current++;
      if (e.dataTransfer?.types.includes('Files')) {
        setIsActive(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsActive(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsActive(false);

      if (e.dataTransfer?.files.length) {
        onDrop(Array.from(e.dataTransfer.files));
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onDrop]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="fixed inset-0 z-[200] bg-indigo-500/10 backdrop-blur-sm flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="p-8 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-2xl border-2 border-dashed border-indigo-500"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Upload size={32} className="text-indigo-500" />
              </motion.div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  Drop your files
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                  Release to upload
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Compact file input button
interface FileInputButtonProps {
  onSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FileInputButton: React.FC<FileInputButtonProps> = ({
  onSelect,
  accept = '*',
  multiple = false,
  children,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onSelect(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      <motion.button
        onClick={() => inputRef.current?.click()}
        className={className}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {children}
      </motion.button>
    </>
  );
};

export default DragDropUpload;
