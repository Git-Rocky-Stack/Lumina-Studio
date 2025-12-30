// ============================================================================
// AI IMAGE ENHANCEMENT - UI COMPONENTS
// ============================================================================

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EnhancementType,
  EnhancementOptions,
  StylePreset,
  UpscaleFactor,
  ENHANCEMENT_INFO,
  STYLE_PRESETS,
  DEFAULT_PRESETS,
  fileToDataUrl,
  downloadImage
} from '../../types/imageEnhancement';
import { useImageEnhancement } from '../../services/imageEnhancementService';

// ============================================================================
// ENHANCEMENT TOOL BUTTON
// ============================================================================

interface ToolButtonProps {
  type: EnhancementType;
  selected: boolean;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ type, selected, onClick }) => {
  const info = ENHANCEMENT_INFO[type];

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg transition-all w-full text-left ${
        selected
          ? 'bg-white/10 border-2 border-blue-500'
          : 'bg-white/5 border border-white/10 hover:bg-white/10'
      }`}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${info.color}20` }}
      >
        <i className={`fa-solid ${info.icon}`} style={{ color: info.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white text-sm">{info.label}</span>
          {info.isPro && (
            <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] rounded">
              PRO
            </span>
          )}
        </div>
        <p className="text-xs text-white/50 truncate">{info.description}</p>
      </div>
    </motion.button>
  );
};

// ============================================================================
// STYLE PRESET CARD
// ============================================================================

interface StyleCardProps {
  preset: StylePreset;
  selected: boolean;
  onClick: () => void;
}

const StyleCard: React.FC<StyleCardProps> = ({ preset, selected, onClick }) => {
  const info = STYLE_PRESETS[preset];

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
        selected
          ? 'bg-purple-500/20 border-2 border-purple-500'
          : 'bg-white/5 border border-white/10 hover:bg-white/10'
      }`}
    >
      <span className="text-2xl">{info.thumbnail}</span>
      <span className="text-xs text-white font-medium">{info.label}</span>
    </motion.button>
  );
};

// ============================================================================
// QUICK PRESET BUTTON
// ============================================================================

interface QuickPresetProps {
  preset: typeof DEFAULT_PRESETS[0];
  onClick: () => void;
  disabled?: boolean;
}

const QuickPreset: React.FC<QuickPresetProps> = ({ preset, onClick, disabled }) => {
  const info = ENHANCEMENT_INFO[preset.type];

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
    >
      <i className={`fa-solid ${preset.icon} text-sm`} style={{ color: info.color }} />
      <span className="text-xs text-white">{preset.name}</span>
    </motion.button>
  );
};

// ============================================================================
// IMAGE PREVIEW
// ============================================================================

interface ImagePreviewProps {
  inputImage: string | null;
  outputImage: string | null;
  isProcessing: boolean;
  progress: number;
  onDownload: () => void;
  onReset: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  inputImage,
  outputImage,
  isProcessing,
  progress,
  onDownload,
  onReset
}) => {
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);

  if (!inputImage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white/5 rounded-xl border border-dashed border-white/20">
        <div className="text-center">
          <i className="fa-solid fa-image text-4xl text-white/20 mb-3" />
          <p className="text-white/50">Upload an image to enhance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white/5 rounded-xl overflow-hidden">
      {/* Image Container */}
      <div className="flex-1 relative flex items-center justify-center p-4 min-h-0">
        {isProcessing ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-center">
              <div className="relative w-24 h-24 mb-4">
                <svg className="w-24 h-24 -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={276.46}
                    strokeDashoffset={276.46 * (1 - progress / 100)}
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
                  {progress}%
                </span>
              </div>
              <p className="text-white/70">Processing with AI...</p>
            </div>
          </div>
        ) : null}

        {showComparison && outputImage ? (
          <div className="relative w-full h-full overflow-hidden">
            <img
              src={outputImage}
              alt="Enhanced"
              className="absolute inset-0 w-full h-full object-contain"
            />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={inputImage}
                alt="Original"
                className="w-full h-full object-contain"
                style={{ width: `${100 / (sliderPosition / 100)}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={e => setSliderPosition(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-col-resize"
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                <i className="fa-solid fa-arrows-left-right text-slate-700 text-xs" />
              </div>
            </div>
          </div>
        ) : (
          <img
            src={outputImage || inputImage}
            alt={outputImage ? 'Enhanced' : 'Original'}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        )}
      </div>

      {/* Controls */}
      {outputImage && (
        <div className="flex items-center justify-between p-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                showComparison
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <i className="fa-solid fa-arrows-left-right mr-1.5" />
              Compare
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="px-3 py-1.5 text-xs bg-white/10 text-white/70 rounded-lg hover:bg-white/20"
            >
              <i className="fa-solid fa-undo mr-1.5" />
              Reset
            </button>
            <button
              onClick={onDownload}
              className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <i className="fa-solid fa-download mr-1.5" />
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// OPTIONS PANEL
// ============================================================================

interface OptionsPanelProps {
  type: EnhancementType;
  options: EnhancementOptions;
  onChange: (options: EnhancementOptions) => void;
}

const OptionsPanel: React.FC<OptionsPanelProps> = ({ type, options, onChange }) => {
  switch (type) {
    case 'upscale':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-2 block">Upscale Factor</label>
            <div className="flex gap-2">
              {([2, 4, 8] as UpscaleFactor[]).map(factor => (
                <button
                  key={factor}
                  onClick={() => onChange({ ...options, upscaleFactor: factor })}
                  className={`flex-1 py-2 rounded-lg type-body-sm font-semibold transition-colors ${
                    options.upscaleFactor === factor
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {factor}x
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={options.preserveDetails ?? true}
              onChange={e => onChange({ ...options, preserveDetails: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-white/70">Preserve fine details</span>
          </label>
        </div>
      );

    case 'background-replace':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-2 block">Background Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['color', 'blur', 'transparent'].map(bgType => (
                <button
                  key={bgType}
                  onClick={() => onChange({ ...options, backgroundType: bgType as any })}
                  className={`py-2 px-3 rounded-lg text-sm capitalize transition-colors ${
                    options.backgroundType === bgType
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {bgType}
                </button>
              ))}
            </div>
          </div>
          {options.backgroundType === 'color' && (
            <div>
              <label className="text-xs text-white/50 mb-2 block">Background Color</label>
              <input
                type="color"
                value={options.backgroundColor || '#ffffff'}
                onChange={e => onChange({ ...options, backgroundColor: e.target.value })}
                className="w-full h-10 rounded-lg cursor-pointer"
              />
            </div>
          )}
          {options.backgroundType === 'blur' && (
            <div>
              <label className="text-xs text-white/50 mb-2 block">
                Blur Intensity: {options.blurIntensity || 10}px
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={options.blurIntensity || 10}
                onChange={e => onChange({ ...options, blurIntensity: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          )}
        </div>
      );

    case 'style-transfer':
      return (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/50 mb-2 block">Style</label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(STYLE_PRESETS) as StylePreset[]).map(style => (
                <StyleCard
                  key={style}
                  preset={style}
                  selected={options.stylePreset === style}
                  onClick={() => onChange({ ...options, stylePreset: style })}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-2 block">
              Strength: {Math.round((options.styleStrength || 0.7) * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={options.styleStrength || 0.7}
              onChange={e => onChange({ ...options, styleStrength: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={options.preserveColor ?? false}
              onChange={e => onChange({ ...options, preserveColor: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-white/70">Preserve original colors</span>
          </label>
        </div>
      );

    default:
      return (
        <div className="text-center py-4 text-white/50 text-sm">
          No additional options for this enhancement
        </div>
      );
  }
};

// ============================================================================
// MAIN PANEL
// ============================================================================

export const ImageEnhancementPanel: React.FC = () => {
  const [selectedType, setSelectedType] = useState<EnhancementType>('auto-enhance');
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [options, setOptions] = useState<EnhancementOptions>({
    upscaleFactor: 2,
    backgroundType: 'transparent',
    stylePreset: 'anime',
    styleStrength: 0.7
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentJob, isProcessing, enhance, history } = useImageEnhancement();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const dataUrl = await fileToDataUrl(file);
      setInputImage(dataUrl);
      setOutputImage(null);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const dataUrl = await fileToDataUrl(file);
      setInputImage(dataUrl);
      setOutputImage(null);
    }
  };

  const handleEnhance = async () => {
    if (!inputImage) return;

    const result = await enhance(selectedType, inputImage, options);
    if (result.success && result.outputImage) {
      setOutputImage(result.outputImage);
    }
  };

  const handlePresetClick = async (preset: typeof DEFAULT_PRESETS[0]) => {
    if (!inputImage) return;

    setSelectedType(preset.type);
    setOptions(prev => ({ ...prev, ...preset.options }));

    const result = await enhance(preset.type, inputImage, preset.options);
    if (result.success && result.outputImage) {
      setOutputImage(result.outputImage);
    }
  };

  const handleDownload = () => {
    if (outputImage) {
      const filename = `enhanced_${Date.now()}.png`;
      downloadImage(outputImage, filename);
    }
  };

  const handleReset = () => {
    setOutputImage(null);
  };

  const enhancementTypes: EnhancementType[] = [
    'auto-enhance',
    'upscale',
    'background-remove',
    'background-replace',
    'style-transfer',
    'denoise',
    'sharpen',
    'hdr',
    'colorize',
    'restore',
    'face-enhance'
  ];

  return (
    <div className="h-full flex bg-[#0f0f1a]">
      {/* Left Panel - Tools */}
      <div className="w-72 border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles text-purple-400" />
            AI Enhancement
          </h2>
        </div>

        {/* Upload Area */}
        <div className="p-4 border-b border-white/10">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="p-4 border-2 border-dashed border-white/20 rounded-lg text-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors"
          >
            <i className="fa-solid fa-cloud-arrow-up text-2xl text-white/40 mb-2" />
            <p className="text-sm text-white/50">
              Drop image or <span className="text-blue-400">browse</span>
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Quick Presets */}
        <div className="p-4 border-b border-white/10">
          <h3 className="text-xs text-white/50 uppercase mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_PRESETS.slice(0, 4).map(preset => (
              <QuickPreset
                key={preset.id}
                preset={preset}
                onClick={() => handlePresetClick(preset)}
                disabled={!inputImage || isProcessing}
              />
            ))}
          </div>
        </div>

        {/* Tool List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs text-white/50 uppercase mb-3">Enhancement Tools</h3>
          <div className="space-y-2">
            {enhancementTypes.map(type => (
              <ToolButton
                key={type}
                type={type}
                selected={selectedType === type}
                onClick={() => setSelectedType(type)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Center - Preview */}
      <div className="flex-1 flex flex-col p-4">
        <ImagePreview
          inputImage={inputImage}
          outputImage={outputImage}
          isProcessing={isProcessing}
          progress={currentJob?.progress || 0}
          onDownload={handleDownload}
          onReset={handleReset}
        />
      </div>

      {/* Right Panel - Options */}
      <div className="w-72 border-l border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <i className={`fa-solid ${ENHANCEMENT_INFO[selectedType].icon}`}
               style={{ color: ENHANCEMENT_INFO[selectedType].color }} />
            {ENHANCEMENT_INFO[selectedType].label}
          </h3>
          <p className="text-xs text-white/50 mt-1">
            {ENHANCEMENT_INFO[selectedType].description}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <OptionsPanel
            type={selectedType}
            options={options}
            onChange={setOptions}
          />
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleEnhance}
            disabled={!inputImage || isProcessing}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isProcessing ? (
              <>
                <i className="fa-solid fa-spinner animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic-sparkles mr-2" />
                Enhance Image
              </>
            )}
          </button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="p-4 border-t border-white/10">
            <h3 className="text-xs text-white/50 uppercase mb-3">Recent</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {history.slice(0, 5).map(entry => (
                <div
                  key={entry.id}
                  className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10"
                >
                  <img
                    src={entry.outputThumbnail}
                    alt="Recent"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEnhancementPanel;
