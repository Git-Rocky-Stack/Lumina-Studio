// ============================================
// CompressionSettings - PDF Optimization Panel
// ============================================

import React, { useState, useMemo } from 'react';

// Types
type CompressionPreset = 'web' | 'print' | 'archive' | 'custom';
type ImageQuality = 'minimum' | 'low' | 'medium' | 'high' | 'maximum';

interface CompressionOptions {
  preset: CompressionPreset;
  imageQuality: ImageQuality;
  imageResolution: number; // DPI
  downscaleImages: boolean;
  compressImages: boolean;
  convertToGrayscale: boolean;
  removeMetadata: boolean;
  removeBookmarks: boolean;
  removeAnnotations: boolean;
  removeFormFields: boolean;
  removeJavaScript: boolean;
  removeEmbeddedFiles: boolean;
  flattenLayers: boolean;
  optimizeFonts: boolean;
  subsetFonts: boolean;
  linearize: boolean; // Fast web view
}

interface CompressionSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onCompress: (options: CompressionOptions) => Promise<void>;
  originalSize: number; // bytes
  className?: string;
}

// Preset configurations
const PRESETS: Record<CompressionPreset, Partial<CompressionOptions>> = {
  web: {
    imageQuality: 'medium',
    imageResolution: 150,
    downscaleImages: true,
    compressImages: true,
    convertToGrayscale: false,
    removeMetadata: true,
    optimizeFonts: true,
    subsetFonts: true,
    linearize: true
  },
  print: {
    imageQuality: 'high',
    imageResolution: 300,
    downscaleImages: false,
    compressImages: true,
    convertToGrayscale: false,
    removeMetadata: false,
    optimizeFonts: true,
    subsetFonts: false,
    linearize: false
  },
  archive: {
    imageQuality: 'maximum',
    imageResolution: 600,
    downscaleImages: false,
    compressImages: false,
    convertToGrayscale: false,
    removeMetadata: false,
    optimizeFonts: false,
    subsetFonts: false,
    linearize: false
  },
  custom: {}
};

// Helper
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const estimateCompression = (preset: CompressionPreset, options: CompressionOptions): number => {
  let ratio = 1.0;

  // Image compression impact
  const qualityImpact: Record<ImageQuality, number> = {
    minimum: 0.15,
    low: 0.25,
    medium: 0.45,
    high: 0.65,
    maximum: 0.85
  };
  ratio *= options.compressImages ? qualityImpact[options.imageQuality] : 1;

  // Resolution impact
  if (options.downscaleImages) {
    ratio *= options.imageResolution / 300;
  }

  // Feature removal impact
  if (options.removeMetadata) ratio *= 0.95;
  if (options.removeBookmarks) ratio *= 0.98;
  if (options.removeAnnotations) ratio *= 0.90;
  if (options.removeFormFields) ratio *= 0.92;
  if (options.removeJavaScript) ratio *= 0.99;
  if (options.removeEmbeddedFiles) ratio *= 0.85;
  if (options.flattenLayers) ratio *= 0.88;
  if (options.subsetFonts) ratio *= 0.90;
  if (options.convertToGrayscale) ratio *= 0.70;

  return Math.min(1, Math.max(0.05, ratio));
};

export const CompressionSettings: React.FC<CompressionSettingsProps> = ({
  isOpen,
  onClose,
  onCompress,
  originalSize,
  className = ''
}) => {
  // State
  const [options, setOptions] = useState<CompressionOptions>({
    preset: 'web',
    imageQuality: 'medium',
    imageResolution: 150,
    downscaleImages: true,
    compressImages: true,
    convertToGrayscale: false,
    removeMetadata: true,
    removeBookmarks: false,
    removeAnnotations: false,
    removeFormFields: false,
    removeJavaScript: true,
    removeEmbeddedFiles: false,
    flattenLayers: false,
    optimizeFonts: true,
    subsetFonts: true,
    linearize: true
  });

  const [isCompressing, setIsCompressing] = useState(false);

  // Estimated size
  const estimatedRatio = useMemo(() => estimateCompression(options.preset, options), [options]);
  const estimatedSize = Math.round(originalSize * estimatedRatio);
  const savings = originalSize - estimatedSize;
  const savingsPercent = Math.round((1 - estimatedRatio) * 100);

  // Apply preset
  const applyPreset = (preset: CompressionPreset) => {
    setOptions(prev => ({
      ...prev,
      preset,
      ...(PRESETS[preset] || {})
    }));
  };

  // Update option
  const updateOption = <K extends keyof CompressionOptions>(key: K, value: CompressionOptions[K]) => {
    setOptions(prev => ({
      ...prev,
      [key]: value,
      preset: 'custom'
    }));
  };

  // Handle compress
  const handleCompress = async () => {
    setIsCompressing(true);
    try {
      await onCompress(options);
      onClose();
    } catch (error) {
      console.error('Compression failed:', error);
    } finally {
      setIsCompressing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="bg-[#1a1a2e] w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Compress PDF</h2>
              <p className="text-sm text-white/50">Reduce file size while maintaining quality</p>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Size Preview */}
          <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm text-white/50">Original Size</span>
                <p className="text-xl font-semibold text-white">{formatFileSize(originalSize)}</p>
              </div>
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="text-right">
                <span className="text-sm text-white/50">Estimated Size</span>
                <p className="text-xl font-semibold text-green-400">{formatFileSize(estimatedSize)}</p>
              </div>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-teal-500 transition-all duration-500"
                style={{ width: `${estimatedRatio * 100}%` }}
              />
            </div>
            <p className="text-center text-sm text-green-400 mt-2">
              Save ~{formatFileSize(savings)} ({savingsPercent}% reduction)
            </p>
          </div>

          {/* Presets */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Compression Preset</label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { id: 'web', label: 'Web', desc: 'Smallest size', icon: '🌐' },
                { id: 'print', label: 'Print', desc: 'High quality', icon: '🖨️' },
                { id: 'archive', label: 'Archive', desc: 'Best quality', icon: '📦' },
                { id: 'custom', label: 'Custom', desc: 'Your settings', icon: '⚙️' }
              ] as const).map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    options.preset === preset.id
                      ? 'bg-green-500/20 border-2 border-green-500'
                      : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                  }`}
                >
                  <span className="text-2xl block mb-1">{preset.icon}</span>
                  <span className="text-sm text-white block">{preset.label}</span>
                  <span className="text-xs text-white/50">{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Image Settings */}
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Image Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">Image Quality</label>
                <div className="flex gap-2">
                  {(['minimum', 'low', 'medium', 'high', 'maximum'] as ImageQuality[]).map(quality => (
                    <button
                      key={quality}
                      onClick={() => updateOption('imageQuality', quality)}
                      className={`flex-1 py-2 text-xs rounded-lg capitalize transition-all ${
                        options.imageQuality === quality
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {quality}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1">
                  Resolution: {options.imageResolution} DPI
                </label>
                <input
                  type="range"
                  min={72}
                  max={600}
                  step={6}
                  value={options.imageResolution}
                  onChange={(e) => updateOption('imageResolution', parseInt(e.target.value))}
                  className="w-full accent-green-500"
                />
                <div className="flex justify-between text-xs text-white/40">
                  <span>72 DPI (Screen)</span>
                  <span>300 DPI (Print)</span>
                  <span>600 DPI (High)</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.downscaleImages}
                    onChange={(e) => updateOption('downscaleImages', e.target.checked)}
                    className="w-4 h-4 rounded accent-green-500"
                  />
                  Downscale images
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.compressImages}
                    onChange={(e) => updateOption('compressImages', e.target.checked)}
                    className="w-4 h-4 rounded accent-green-500"
                  />
                  Compress images
                </label>
                <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.convertToGrayscale}
                    onChange={(e) => updateOption('convertToGrayscale', e.target.checked)}
                    className="w-4 h-4 rounded accent-green-500"
                  />
                  Convert to grayscale
                </label>
              </div>
            </div>
          </div>

          {/* Content Removal */}
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Remove Content
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.removeMetadata}
                  onChange={(e) => updateOption('removeMetadata', e.target.checked)}
                  className="w-4 h-4 rounded accent-green-500"
                />
                Metadata
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.removeBookmarks}
                  onChange={(e) => updateOption('removeBookmarks', e.target.checked)}
                  className="w-4 h-4 rounded accent-green-500"
                />
                Bookmarks
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.removeAnnotations}
                  onChange={(e) => updateOption('removeAnnotations', e.target.checked)}
                  className="w-4 h-4 rounded accent-green-500"
                />
                Annotations
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.removeFormFields}
                  onChange={(e) => updateOption('removeFormFields', e.target.checked)}
                  className="w-4 h-4 rounded accent-green-500"
                />
                Form fields
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.removeJavaScript}
                  onChange={(e) => updateOption('removeJavaScript', e.target.checked)}
                  className="w-4 h-4 rounded accent-green-500"
                />
                JavaScript
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.removeEmbeddedFiles}
                  onChange={(e) => updateOption('removeEmbeddedFiles', e.target.checked)}
                  className="w-4 h-4 rounded accent-green-500"
                />
                Embedded files
              </label>
            </div>
          </div>

          {/* Optimization */}
          <div className="bg-white/5 rounded-xl p-4">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Optimization
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.flattenLayers}
                  onChange={(e) => updateOption('flattenLayers', e.target.checked)}
                  className="w-4 h-4 rounded accent-green-500"
                />
                Flatten layers
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.optimizeFonts}
                  onChange={(e) => updateOption('optimizeFonts', e.target.checked)}
                  className="w-4 h-4 rounded accent-green-500"
                />
                Optimize fonts
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.subsetFonts}
                  onChange={(e) => updateOption('subsetFonts', e.target.checked)}
                  className="w-4 h-4 rounded accent-green-500"
                />
                Subset fonts
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.linearize}
                  onChange={(e) => updateOption('linearize', e.target.checked)}
                  className="w-4 h-4 rounded accent-green-500"
                />
                Fast web view
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
          <div className="text-sm text-white/50">
            Estimated result: {formatFileSize(estimatedSize)}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCompress}
              disabled={isCompressing}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isCompressing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Compressing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Compress PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompressionSettings;
