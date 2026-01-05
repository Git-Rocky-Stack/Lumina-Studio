// =============================================
// Magic Resize Panel Component
// Resize canvas to multiple formats
// =============================================

import React, { useState, useEffect } from 'react';
import {
  Maximize2,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Monitor,
  Printer,
  Plus,
  Check,
  Loader2,
  Download,
  Eye,
  Grid,
  ChevronDown,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
import { magicResize, ResizePreset, ResizeResult } from '../../services/magicResizeService';

// =============================================
// Types
// =============================================

interface ResizePanelProps {
  className?: string;
  canvasElements: any[];
  canvasWidth: number;
  canvasHeight: number;
  onApplyResize: (elements: any[], width: number, height: number) => void;
  onPreviewResize?: (result: ResizeResult) => void;
}

// =============================================
// Platform Icons
// =============================================

const PlatformIcon: React.FC<{ platform?: string; className?: string }> = ({
  platform,
  className = 'w-4 h-4',
}) => {
  switch (platform) {
    case 'instagram':
      return <Instagram className={className} />;
    case 'facebook':
      return <Facebook className={className} />;
    case 'twitter':
      return <Twitter className={className} />;
    case 'linkedin':
      return <Linkedin className={className} />;
    case 'youtube':
      return <Youtube className={className} />;
    default:
      return <Grid className={className} />;
  }
};

// =============================================
// Component
// =============================================

export const ResizePanel: React.FC<ResizePanelProps> = ({
  className = '',
  canvasElements,
  canvasWidth,
  canvasHeight,
  onApplyResize,
  onPreviewResize,
}) => {
  // State
  const [presets, setPresets] = useState<ResizePreset[]>([]);
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [customSizes, setCustomSizes] = useState<Array<{ width: number; height: number; name?: string }>>([]);
  const [expandedCategory, setExpandedCategory] = useState<string>('social');
  const [isResizing, setIsResizing] = useState(false);
  const [results, setResults] = useState<ResizeResult[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customWidth, setCustomWidth] = useState(1080);
  const [customHeight, setCustomHeight] = useState(1080);
  const [customName, setCustomName] = useState('');

  // =============================================
  // Effects
  // =============================================

  useEffect(() => {
    loadPresets();
  }, []);

  // =============================================
  // Data Loading
  // =============================================

  const loadPresets = async () => {
    const allPresets = await magicResize.getPresets();
    setPresets(allPresets);
  };

  // =============================================
  // Handlers
  // =============================================

  const togglePreset = (presetId: string) => {
    setSelectedPresets(prev =>
      prev.includes(presetId)
        ? prev.filter(id => id !== presetId)
        : [...prev, presetId]
    );
  };

  const addCustomSize = () => {
    if (customWidth > 0 && customHeight > 0) {
      setCustomSizes([
        ...customSizes,
        { width: customWidth, height: customHeight, name: customName || undefined },
      ]);
      setShowCustomForm(false);
      setCustomWidth(1080);
      setCustomHeight(1080);
      setCustomName('');
    }
  };

  const removeCustomSize = (index: number) => {
    setCustomSizes(customSizes.filter((_, i) => i !== index));
  };

  const handleResize = async () => {
    if (selectedPresets.length === 0 && customSizes.length === 0) return;
    if (canvasElements.length === 0) return;

    setIsResizing(true);
    setResults([]);

    try {
      const resizeResults = await magicResize.resizeToMultipleFormats(
        canvasElements,
        canvasWidth,
        canvasHeight,
        selectedPresets,
        customSizes
      );

      setResults(resizeResults);
    } catch (error) {
      console.error('Resize failed:', error);
    } finally {
      setIsResizing(false);
    }
  };

  const handleApplyResult = (result: ResizeResult) => {
    onApplyResize(result.canvas_data, result.width, result.height);
  };

  const handlePreviewResult = (result: ResizeResult) => {
    if (onPreviewResize) {
      onPreviewResize(result);
    }
  };

  const selectAllInCategory = (category: string) => {
    const categoryPresets = presets.filter(p => p.category === category);
    const allSelected = categoryPresets.every(p => selectedPresets.includes(p.id));

    if (allSelected) {
      setSelectedPresets(prev =>
        prev.filter(id => !categoryPresets.find(p => p.id === id))
      );
    } else {
      const newIds = categoryPresets.map(p => p.id).filter(id => !selectedPresets.includes(id));
      setSelectedPresets([...selectedPresets, ...newIds]);
    }
  };

  // =============================================
  // Render Helpers
  // =============================================

  const categories = magicResize.getPresetCategories();

  const renderPresetsByCategory = (category: string) => {
    const categoryPresets = presets.filter(p => p.category === category);
    const allSelected = categoryPresets.length > 0 &&
      categoryPresets.every(p => selectedPresets.includes(p.id));

    return (
      <div className="border border-zinc-700/50 rounded-xl overflow-hidden">
        <button
          onClick={() => setExpandedCategory(
            expandedCategory === category ? '' : category
          )}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50"
        >
          <div className="flex items-center gap-2">
            <PlatformIcon
              platform={category === 'social' ? 'instagram' : undefined}
              className="w-4 h-4 text-zinc-500"
            />
            <span className="text-sm font-medium text-zinc-300 capitalize">{category}</span>
            <span className="text-xs text-zinc-500">({categoryPresets.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                selectAllInCategory(category);
              }}
              className={`text-xs px-2 py-1 rounded ${
                allSelected
                  ? 'bg-violet-500/20 text-violet-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
            {expandedCategory === category ? (
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            )}
          </div>
        </button>

        {expandedCategory === category && (
          <div className="px-4 pb-4 grid grid-cols-2 gap-2 border-t border-zinc-700/50 pt-3">
            {categoryPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => togglePreset(preset.id)}
                className={`p-3 rounded-lg text-left transition-all ${
                  selectedPresets.includes(preset.id)
                    ? 'bg-violet-500/20 border-violet-500/50'
                    : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
                } border`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {preset.platform && (
                      <PlatformIcon platform={preset.platform} className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                    <span className="text-sm text-white font-medium truncate">{preset.name}</span>
                  </div>
                  {selectedPresets.includes(preset.id) && (
                    <Check className="w-4 h-4 text-violet-400" />
                  )}
                </div>
                <div className="text-xs text-zinc-500">
                  {preset.width} x {preset.height}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // =============================================
  // Render
  // =============================================

  return (
    <div className={`bg-zinc-900/95 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Maximize2 className="w-5 h-5 text-violet-400" />
          <h3 className="font-medium text-white">Magic Resize</h3>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Current: {canvasWidth} x {canvasHeight}
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {/* Preset Categories */}
        {categories.map((cat) => (
          <div key={cat.id}>
            {renderPresetsByCategory(cat.id)}
          </div>
        ))}

        {/* Custom Sizes */}
        <div className="border border-zinc-700/50 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-300">Custom Sizes</span>
            </div>
            <button
              onClick={() => setShowCustomForm(!showCustomForm)}
              className="text-xs text-violet-400 hover:text-violet-300"
            >
              Add Custom
            </button>
          </div>

          {/* Custom Size Form */}
          {showCustomForm && (
            <div className="px-4 pb-4 space-y-3 border-t border-zinc-700/50 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Width</label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg
                      text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Height</label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg
                      text-sm text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Name (optional)</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Custom Size"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg
                    text-sm text-white placeholder-zinc-600"
                />
              </div>
              <button
                onClick={addCustomSize}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-violet-500
                  text-white hover:bg-violet-600 transition-colors"
              >
                Add Size
              </button>
            </div>
          )}

          {/* Custom Size List */}
          {customSizes.length > 0 && (
            <div className="px-4 pb-4 space-y-2 border-t border-zinc-700/50 pt-3">
              {customSizes.map((size, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-zinc-800/50 rounded-lg"
                >
                  <div>
                    <span className="text-sm text-white">
                      {size.name || `Custom ${index + 1}`}
                    </span>
                    <span className="text-xs text-zinc-500 ml-2">
                      {size.width} x {size.height}
                    </span>
                  </div>
                  <button
                    onClick={() => removeCustomSize(index)}
                    className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resize Button */}
        <button
          onClick={handleResize}
          disabled={
            (selectedPresets.length === 0 && customSizes.length === 0) ||
            isResizing ||
            canvasElements.length === 0
          }
          className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-violet-500
            text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors flex items-center justify-center gap-2"
        >
          {isResizing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Resizing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Resize to {selectedPresets.length + customSizes.length} Format(s)
            </>
          )}
        </button>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-300">Results</h4>
            <div className="grid grid-cols-2 gap-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white truncate">{result.preset_name}</span>
                    <span className="text-xs text-zinc-500">
                      {result.width}x{result.height}
                    </span>
                  </div>

                  {/* Preview placeholder */}
                  <div
                    className="w-full aspect-square bg-zinc-900 rounded-lg mb-2
                      flex items-center justify-center"
                    style={{
                      aspectRatio: `${result.width}/${result.height}`,
                      maxHeight: '80px',
                    }}
                  >
                    <Grid className="w-6 h-6 text-zinc-700" />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePreviewResult(result)}
                      className="flex-1 px-2 py-1.5 rounded text-xs text-zinc-400
                        hover:text-white hover:bg-zinc-700 transition-colors
                        flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Preview
                    </button>
                    <button
                      onClick={() => handleApplyResult(result)}
                      className="flex-1 px-2 py-1.5 rounded text-xs bg-violet-500/20
                        text-violet-400 hover:bg-violet-500/30 transition-colors
                        flex items-center justify-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResizePanel;
