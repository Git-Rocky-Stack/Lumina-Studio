import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExportPlatform,
  ExportQuality,
  PLATFORM_CONFIGS,
  QUALITY_SETTINGS
} from '../../types/export';
import type {
  ExportFormat,
  QualityAnalysis
} from '../../types/export';
import {
  getPlatformConfig,
  estimateFileSize,
  generateFileName,
  createExportJob,
  executeExport,
  executeBatchExport,
  analyzeExportQuality,
  saveToHistory,
  getExportHistory
} from '../../services/unifiedExportService';

interface UnifiedExportProps {
  isOpen: boolean;
  onClose: () => void;
  sourceType: 'canvas' | 'template' | 'image' | 'video' | 'pdf';
  sourceData: any;
  sourceName: string;
  sourceWidth?: number;
  sourceHeight?: number;
  previewImage?: string;
}

const UnifiedExport: React.FC<UnifiedExportProps> = ({
  isOpen,
  onClose,
  sourceType,
  sourceData,
  sourceName,
  sourceWidth = 1920,
  sourceHeight = 1080,
  previewImage
}) => {
  // Platform selection
  const [selectedPlatform, setSelectedPlatform] = useState<ExportPlatform>(ExportPlatform.ORIGINAL);
  const [platformCategory, setPlatformCategory] = useState<'all' | 'social' | 'web' | 'email' | 'print' | 'general'>('all');

  // Export settings
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState<ExportQuality>(ExportQuality.HIGH);
  const [customWidth, setCustomWidth] = useState(sourceWidth);
  const [customHeight, setCustomHeight] = useState(sourceHeight);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [transparentBg, setTransparentBg] = useState(false);
  const [fileName, setFileName] = useState(sourceName);
  const [autoFileName, setAutoFileName] = useState(true);

  // Destination
  const [destination, setDestination] = useState<'download' | 'clipboard' | 'cloud'>('download');

  // Batch export
  const [batchPlatforms, setBatchPlatforms] = useState<ExportPlatform[]>([]);

  // Quality analysis
  const [qualityAnalysis, setQualityAnalysis] = useState<QualityAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<'export' | 'batch' | 'history'>('export');

  // Get platform config
  const platformConfig = useMemo(() => getPlatformConfig(selectedPlatform), [selectedPlatform]);

  // Filter platforms by category
  const filteredPlatforms = useMemo(() => {
    if (platformCategory === 'all') return PLATFORM_CONFIGS;
    return PLATFORM_CONFIGS.filter(p => p.category === platformCategory);
  }, [platformCategory]);

  // Update format when platform changes
  useEffect(() => {
    setFormat(platformConfig.recommendedFormat);
    if (selectedPlatform !== ExportPlatform.CUSTOM && selectedPlatform !== ExportPlatform.ORIGINAL) {
      setCustomWidth(platformConfig.width);
      setCustomHeight(platformConfig.height);
    }
  }, [selectedPlatform, platformConfig]);

  // Generate auto filename
  useEffect(() => {
    if (autoFileName) {
      setFileName(generateFileName({
        baseName: sourceName,
        platform: selectedPlatform,
        format,
        width: customWidth,
        height: customHeight,
        includeDate: true
      }).replace(`.${format}`, ''));
    }
  }, [sourceName, selectedPlatform, format, customWidth, customHeight, autoFileName]);

  // Run quality analysis
  const runQualityAnalysis = useCallback(async () => {
    if (!previewImage) return;

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeExportQuality(
        previewImage,
        selectedPlatform,
        customWidth,
        customHeight
      );
      setQualityAnalysis(analysis);
    } catch (error) {
      console.error('Quality analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [previewImage, selectedPlatform, customWidth, customHeight]);

  // Estimate file size
  const estimatedSize = useMemo(() => {
    return estimateFileSize(customWidth, customHeight, format, quality);
  }, [customWidth, customHeight, format, quality]);

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportError(null);
    setExportSuccess(false);

    try {
      const job = createExportJob(sourceType, sourceData, sourceName, selectedPlatform, {
        format,
        quality,
        width: customWidth,
        height: customHeight,
        maintainAspectRatio,
        transparentBackground: transparentBg,
        fileName: `${fileName}.${format}`,
        destination
      });

      const result = await executeExport(job);

      if (result.status === 'completed') {
        setExportSuccess(true);
        saveToHistory(result, previewImage);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setExportError(result.error || 'Export failed');
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
      setExportProgress(100);
    }
  };

  // Handle batch export
  const handleBatchExport = async () => {
    if (batchPlatforms.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);

    try {
      const jobs = batchPlatforms.map(platform =>
        createExportJob(sourceType, sourceData, sourceName, platform, {
          quality,
          destination
        })
      );

      let completed = 0;
      await executeBatchExport({
        id: `batch_${Date.now()}`,
        jobs,
        parallelLimit: 2,
        onJobComplete: (job) => {
          completed++;
          setExportProgress((completed / jobs.length) * 100);
          saveToHistory(job, previewImage);
        }
      });

      setExportSuccess(true);
      setTimeout(onClose, 1500);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Batch export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Toggle batch platform
  const toggleBatchPlatform = (platform: ExportPlatform) => {
    setBatchPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="type-section text-slate-900">Export</h2>
            <p className="type-body-sm text-slate-500">
              Optimize and export your design for any platform
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {[
              { id: 'export', label: 'Single Export', icon: 'fa-download' },
              { id: 'batch', label: 'Batch Export', icon: 'fa-layer-group' },
              { id: 'history', label: 'History', icon: 'fa-clock-rotate-left' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg type-body-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <i className={`fas ${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          <AnimatePresence mode="wait">
            {activeTab === 'export' && (
              <motion.div
                key="export"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex overflow-hidden"
              >
                {/* Left: Platform Selection */}
                <div className="w-80 border-r border-slate-200 p-6 overflow-y-auto">
                  {/* Category Filter */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['all', 'social', 'web', 'email', 'print', 'general'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setPlatformCategory(cat as any)}
                        className={`px-3 py-1.5 rounded-lg type-micro font-medium capitalize transition-colors ${
                          platformCategory === cat
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Platform Grid */}
                  <div className="space-y-2">
                    {filteredPlatforms.map(platform => (
                      <button
                        key={platform.id}
                        onClick={() => setSelectedPlatform(platform.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          selectedPlatform === platform.id
                            ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-700'
                            : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          selectedPlatform === platform.id ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500'
                        }`}>
                          <i className={`fab ${platform.icon} text-lg`}></i>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="type-body-sm font-medium">{platform.label}</p>
                          <p className="type-micro text-slate-400">
                            {platform.width}x{platform.height} &middot; {platform.recommendedFormat.toUpperCase()}
                          </p>
                        </div>
                        {selectedPlatform === platform.id && (
                          <i className="fas fa-check text-indigo-500"></i>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Center: Preview & Settings */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Preview */}
                    <div>
                      <p className="type-label text-slate-500 mb-3">Preview</p>
                      <div
                        className="aspect-square bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center relative"
                        style={{ backgroundColor: platformConfig.colorSpace === 'CMYK' ? '#f8f8f8' : '#f1f5f9' }}
                      >
                        {previewImage ? (
                          <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-slate-400">
                            <i className="fas fa-image text-4xl mb-2"></i>
                            <p className="type-body-sm">No preview available</p>
                          </div>
                        )}

                        {/* Platform overlay */}
                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                          <span className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg type-micro text-white">
                            {customWidth} x {customHeight}
                          </span>
                          <span className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg type-micro text-white">
                            {format.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Quality Analysis */}
                      {qualityAnalysis && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <span className="type-body-sm font-medium text-slate-700">Quality Score</span>
                            <span className={`type-subsection font-bold ${
                              qualityAnalysis.overallScore >= 80 ? 'text-emerald-600' :
                              qualityAnalysis.overallScore >= 60 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {qualityAnalysis.overallScore}/100
                            </span>
                          </div>

                          {qualityAnalysis.issues.length > 0 && (
                            <div className="space-y-2">
                              {qualityAnalysis.issues.slice(0, 3).map((issue, i) => (
                                <div
                                  key={i}
                                  className={`flex items-start gap-2 type-body-sm ${
                                    issue.severity === 'error' ? 'text-red-600' :
                                    issue.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'
                                  }`}
                                >
                                  <i className={`fas ${
                                    issue.severity === 'error' ? 'fa-circle-xmark' :
                                    issue.severity === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'
                                  } mt-0.5`}></i>
                                  <span>{issue.message}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={runQualityAnalysis}
                        disabled={isAnalyzing || !previewImage}
                        className="mt-3 w-full py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 type-body-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {isAnalyzing ? (
                          <span><i className="fas fa-spinner fa-spin mr-2"></i>Analyzing...</span>
                        ) : (
                          <span><i className="fas fa-wand-magic-sparkles mr-2"></i>AI Quality Check</span>
                        )}
                      </button>
                    </div>

                    {/* Settings */}
                    <div className="space-y-5">
                      {/* Format */}
                      <div>
                        <p className="type-label text-slate-500 mb-2">Format</p>
                        <div className="grid grid-cols-4 gap-2">
                          {platformConfig.allowedFormats.map(fmt => (
                            <button
                              key={fmt}
                              onClick={() => setFormat(fmt)}
                              className={`py-2 rounded-lg type-body-sm font-medium uppercase transition-colors ${
                                format === fmt
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {fmt}
                              {fmt === platformConfig.recommendedFormat && (
                                <i className="fas fa-star text-xs ml-1 opacity-60"></i>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quality */}
                      <div>
                        <p className="type-label text-slate-500 mb-2">Quality</p>
                        <div className="grid grid-cols-5 gap-2">
                          {Object.entries(QUALITY_SETTINGS).map(([key, value]) => (
                            <button
                              key={key}
                              onClick={() => setQuality(key as ExportQuality)}
                              className={`py-2 rounded-lg type-micro font-medium capitalize transition-colors ${
                                quality === key
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              title={value.description}
                            >
                              {key}
                            </button>
                          ))}
                        </div>
                        <p className="mt-1 type-micro text-slate-400">
                          {QUALITY_SETTINGS[quality].description}
                        </p>
                      </div>

                      {/* Dimensions */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="type-label text-slate-500">Dimensions</p>
                          <label className="flex items-center gap-2 type-micro text-slate-500">
                            <input
                              type="checkbox"
                              checked={maintainAspectRatio}
                              onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                              className="rounded"
                            />
                            Lock ratio
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <input
                              type="number"
                              value={customWidth}
                              onChange={(e) => {
                                const w = parseInt(e.target.value) || 0;
                                setCustomWidth(w);
                                if (maintainAspectRatio && sourceWidth && sourceHeight) {
                                  setCustomHeight(Math.round(w * (sourceHeight / sourceWidth)));
                                }
                              }}
                              className="lumina-input w-full rounded-lg text-center"
                              disabled={selectedPlatform !== ExportPlatform.CUSTOM}
                            />
                            <p className="type-micro text-slate-400 text-center mt-1">Width</p>
                          </div>
                          <i className="fas fa-times text-slate-300"></i>
                          <div className="flex-1">
                            <input
                              type="number"
                              value={customHeight}
                              onChange={(e) => {
                                const h = parseInt(e.target.value) || 0;
                                setCustomHeight(h);
                                if (maintainAspectRatio && sourceWidth && sourceHeight) {
                                  setCustomWidth(Math.round(h * (sourceWidth / sourceHeight)));
                                }
                              }}
                              className="lumina-input w-full rounded-lg text-center"
                              disabled={selectedPlatform !== ExportPlatform.CUSTOM}
                            />
                            <p className="type-micro text-slate-400 text-center mt-1">Height</p>
                          </div>
                        </div>
                      </div>

                      {/* File Name */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="type-label text-slate-500">File Name</p>
                          <label className="flex items-center gap-2 type-micro text-slate-500">
                            <input
                              type="checkbox"
                              checked={autoFileName}
                              onChange={(e) => setAutoFileName(e.target.checked)}
                              className="rounded"
                            />
                            Auto name
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            className="lumina-input flex-1 rounded-lg"
                            disabled={autoFileName}
                          />
                          <span className="text-slate-400 type-body-sm">.{format}</span>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="flex items-center gap-4">
                        {format === 'png' && (
                          <label className="flex items-center gap-2 type-body-sm text-slate-600">
                            <input
                              type="checkbox"
                              checked={transparentBg}
                              onChange={(e) => setTransparentBg(e.target.checked)}
                              className="rounded"
                            />
                            Transparent background
                          </label>
                        )}
                      </div>

                      {/* Estimated Size */}
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="type-body-sm text-slate-600">Estimated file size</span>
                          <span className="type-body font-medium text-slate-800">
                            ~{estimatedSize.size} {estimatedSize.unit}
                          </span>
                        </div>
                        {platformConfig.maxFileSize && estimatedSize.unit === 'KB' && estimatedSize.size > platformConfig.maxFileSize && (
                          <p className="mt-2 type-micro text-amber-600">
                            <i className="fas fa-triangle-exclamation mr-1"></i>
                            May exceed {platformConfig.maxFileSize}KB limit
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'batch' && (
              <motion.div
                key="batch"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 p-6 overflow-y-auto"
              >
                <div className="mb-6">
                  <h3 className="type-subsection text-slate-800 mb-2">Batch Export</h3>
                  <p className="type-body-sm text-slate-500">
                    Export to multiple platforms at once. Select the platforms you need:
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {PLATFORM_CONFIGS.filter(p => p.id !== ExportPlatform.CUSTOM && p.id !== ExportPlatform.ORIGINAL).map(platform => (
                    <button
                      key={platform.id}
                      onClick={() => toggleBatchPlatform(platform.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        batchPlatforms.includes(platform.id)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                        batchPlatforms.includes(platform.id) ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <i className={`fab ${platform.icon} text-xl`}></i>
                      </div>
                      <p className="type-body-sm font-medium text-slate-700">{platform.label}</p>
                      <p className="type-micro text-slate-400">{platform.width}x{platform.height}</p>
                      {batchPlatforms.includes(platform.id) && (
                        <div className="mt-2">
                          <i className="fas fa-check-circle text-indigo-500"></i>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {batchPlatforms.length > 0 && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="type-body-sm text-slate-600">
                        {batchPlatforms.length} platform{batchPlatforms.length > 1 ? 's' : ''} selected
                      </span>
                      <button
                        onClick={() => setBatchPlatforms([])}
                        className="type-body-sm text-slate-400 hover:text-slate-600"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {batchPlatforms.map(p => {
                        const config = getPlatformConfig(p);
                        return (
                          <span key={p} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full type-micro">
                            {config.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 p-6 overflow-y-auto"
              >
                <ExportHistory />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            {/* Destination */}
            <div className="flex items-center gap-4">
              <span className="type-body-sm text-slate-500">Export to:</span>
              <div className="flex gap-2">
                {[
                  { id: 'download', label: 'Download', icon: 'fa-download' },
                  { id: 'clipboard', label: 'Clipboard', icon: 'fa-clipboard' },
                  { id: 'cloud', label: 'Cloud', icon: 'fa-cloud-arrow-up' }
                ].map(dest => (
                  <button
                    key={dest.id}
                    onClick={() => setDestination(dest.id as any)}
                    className={`px-4 py-2 rounded-xl type-body-sm font-medium transition-colors ${
                      destination === dest.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <i className={`fas ${dest.icon} mr-2`}></i>
                    {dest.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <div className="flex items-center gap-3">
              {exportError && (
                <span className="type-body-sm text-red-500">
                  <i className="fas fa-exclamation-circle mr-1"></i>
                  {exportError}
                </span>
              )}

              {exportSuccess && (
                <span className="type-body-sm text-emerald-500">
                  <i className="fas fa-check-circle mr-1"></i>
                  Export complete!
                </span>
              )}

              <button
                onClick={activeTab === 'batch' ? handleBatchExport : handleExport}
                disabled={isExporting || (activeTab === 'batch' && batchPlatforms.length === 0)}
                className={`px-8 py-3 rounded-2xl font-bold transition-all ${
                  isExporting || (activeTab === 'batch' && batchPlatforms.length === 0)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-200'
                }`}
              >
                {isExporting ? (
                  <span className="flex items-center gap-2">
                    <i className="fas fa-spinner fa-spin"></i>
                    Exporting... {Math.round(exportProgress)}%
                  </span>
                ) : activeTab === 'batch' ? (
                  <span>
                    <i className="fas fa-layer-group mr-2"></i>
                    Export {batchPlatforms.length} Formats
                  </span>
                ) : (
                  <span>
                    <i className="fas fa-download mr-2"></i>
                    Export
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Export History Component
const ExportHistory: React.FC = () => {
  const [history] = useState(getExportHistory());

  if (history.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-clock-rotate-left text-4xl text-slate-300 mb-4"></i>
          <p className="type-body text-slate-500">No export history yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map(entry => {
        const config = getPlatformConfig(entry.job.platform);
        return (
          <div
            key={entry.id}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200"
          >
            {entry.thumbnail ? (
              <img
                src={entry.thumbnail}
                alt={entry.job.fileName}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center">
                <i className="fas fa-image text-slate-400"></i>
              </div>
            )}
            <div className="flex-1">
              <p className="type-body-sm font-medium text-slate-800">{entry.job.fileName}</p>
              <p className="type-micro text-slate-400">
                {config.label} &middot; {entry.job.format.toUpperCase()} &middot;
                {new Date(entry.job.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-lg type-micro ${
                entry.job.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {entry.job.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UnifiedExport;
