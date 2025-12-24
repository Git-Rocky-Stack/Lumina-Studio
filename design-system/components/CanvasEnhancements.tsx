/**
 * Canvas Enhancements Component
 * Smart guides, Artboard presets, Layer groups, Blend modes, Eyedropper, Rulers, Zoom controls
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';

// ============================================================================
// SMART GUIDES
// ============================================================================

interface GuidePosition {
  type: 'horizontal' | 'vertical';
  position: number;
  label?: string;
}

interface SmartGuidesProps {
  canvasWidth: number;
  canvasHeight: number;
  activeElement?: { x: number; y: number; width: number; height: number };
  elements: { x: number; y: number; width: number; height: number }[];
  snapThreshold?: number;
  showCenterGuides?: boolean;
  className?: string;
}

export const SmartGuides: React.FC<SmartGuidesProps> = ({
  canvasWidth,
  canvasHeight,
  activeElement,
  elements,
  snapThreshold = 5,
  showCenterGuides = true,
  className = '',
}) => {
  const [guides, setGuides] = useState<GuidePosition[]>([]);

  useEffect(() => {
    if (!activeElement) {
      setGuides([]);
      return;
    }

    const newGuides: GuidePosition[] = [];
    const activeCenterX = activeElement.x + activeElement.width / 2;
    const activeCenterY = activeElement.y + activeElement.height / 2;

    // Canvas center guides
    if (showCenterGuides) {
      if (Math.abs(activeCenterX - canvasWidth / 2) < snapThreshold) {
        newGuides.push({ type: 'vertical', position: canvasWidth / 2, label: 'Center' });
      }
      if (Math.abs(activeCenterY - canvasHeight / 2) < snapThreshold) {
        newGuides.push({ type: 'horizontal', position: canvasHeight / 2, label: 'Center' });
      }
    }

    // Element alignment guides
    elements.forEach((el) => {
      if (el === activeElement) return;

      // Left edge alignment
      if (Math.abs(activeElement.x - el.x) < snapThreshold) {
        newGuides.push({ type: 'vertical', position: el.x });
      }
      // Right edge alignment
      if (Math.abs(activeElement.x + activeElement.width - (el.x + el.width)) < snapThreshold) {
        newGuides.push({ type: 'vertical', position: el.x + el.width });
      }
      // Center X alignment
      if (Math.abs(activeCenterX - (el.x + el.width / 2)) < snapThreshold) {
        newGuides.push({ type: 'vertical', position: el.x + el.width / 2 });
      }

      // Top edge alignment
      if (Math.abs(activeElement.y - el.y) < snapThreshold) {
        newGuides.push({ type: 'horizontal', position: el.y });
      }
      // Bottom edge alignment
      if (Math.abs(activeElement.y + activeElement.height - (el.y + el.height)) < snapThreshold) {
        newGuides.push({ type: 'horizontal', position: el.y + el.height });
      }
      // Center Y alignment
      if (Math.abs(activeCenterY - (el.y + el.height / 2)) < snapThreshold) {
        newGuides.push({ type: 'horizontal', position: el.y + el.height / 2 });
      }
    });

    setGuides(newGuides);
  }, [activeElement, elements, canvasWidth, canvasHeight, snapThreshold, showCenterGuides]);

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {guides.map((guide, idx) => (
        <div
          key={idx}
          className="absolute bg-accent"
          style={
            guide.type === 'vertical'
              ? { left: guide.position, top: 0, width: 1, height: '100%' }
              : { top: guide.position, left: 0, height: 1, width: '100%' }
          }
        >
          {guide.label && (
            <span
              className="absolute text-[8px] font-bold text-accent bg-white px-1 rounded"
              style={
                guide.type === 'vertical'
                  ? { top: 4, left: 4 }
                  : { left: 4, top: 4 }
              }
            >
              {guide.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// ARTBOARD PRESETS
// ============================================================================

interface ArtboardPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  category: 'social' | 'print' | 'web' | 'video' | 'custom';
  icon: string;
}

const defaultPresets: ArtboardPreset[] = [
  // Social Media
  { id: 'instagram-post', name: 'Instagram Post', width: 1080, height: 1080, category: 'social', icon: 'fa-instagram' },
  { id: 'instagram-story', name: 'Instagram Story', width: 1080, height: 1920, category: 'social', icon: 'fa-instagram' },
  { id: 'facebook-post', name: 'Facebook Post', width: 1200, height: 630, category: 'social', icon: 'fa-facebook' },
  { id: 'twitter-post', name: 'Twitter/X Post', width: 1200, height: 675, category: 'social', icon: 'fa-twitter' },
  { id: 'linkedin-post', name: 'LinkedIn Post', width: 1200, height: 627, category: 'social', icon: 'fa-linkedin' },
  { id: 'tiktok', name: 'TikTok', width: 1080, height: 1920, category: 'social', icon: 'fa-tiktok' },
  { id: 'youtube-thumb', name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'social', icon: 'fa-youtube' },

  // Print
  { id: 'a4', name: 'A4', width: 2480, height: 3508, category: 'print', icon: 'fa-file' },
  { id: 'letter', name: 'Letter', width: 2550, height: 3300, category: 'print', icon: 'fa-file' },
  { id: 'business-card', name: 'Business Card', width: 1050, height: 600, category: 'print', icon: 'fa-address-card' },
  { id: 'poster', name: 'Poster (24x36)', width: 7200, height: 10800, category: 'print', icon: 'fa-image' },

  // Web
  { id: 'desktop-hd', name: 'Desktop HD', width: 1920, height: 1080, category: 'web', icon: 'fa-desktop' },
  { id: 'desktop-4k', name: 'Desktop 4K', width: 3840, height: 2160, category: 'web', icon: 'fa-desktop' },
  { id: 'mobile', name: 'Mobile', width: 375, height: 812, category: 'web', icon: 'fa-mobile' },
  { id: 'tablet', name: 'Tablet', width: 768, height: 1024, category: 'web', icon: 'fa-tablet' },

  // Video
  { id: 'video-hd', name: '1080p HD', width: 1920, height: 1080, category: 'video', icon: 'fa-video' },
  { id: 'video-4k', name: '4K UHD', width: 3840, height: 2160, category: 'video', icon: 'fa-video' },
  { id: 'video-vertical', name: 'Vertical Video', width: 1080, height: 1920, category: 'video', icon: 'fa-video' },
];

interface ArtboardPresetsProps {
  onSelect: (preset: ArtboardPreset) => void;
  currentWidth?: number;
  currentHeight?: number;
  className?: string;
}

export const ArtboardPresets: React.FC<ArtboardPresetsProps> = ({
  onSelect,
  currentWidth,
  currentHeight,
  className = '',
}) => {
  const [activeCategory, setActiveCategory] = useState<ArtboardPreset['category']>('social');
  const [customWidth, setCustomWidth] = useState(currentWidth || 1920);
  const [customHeight, setCustomHeight] = useState(currentHeight || 1080);

  const categories: { id: ArtboardPreset['category']; label: string; icon: string }[] = [
    { id: 'social', label: 'Social', icon: 'fa-share-nodes' },
    { id: 'print', label: 'Print', icon: 'fa-print' },
    { id: 'web', label: 'Web', icon: 'fa-globe' },
    { id: 'video', label: 'Video', icon: 'fa-video' },
    { id: 'custom', label: 'Custom', icon: 'fa-sliders' },
  ];

  const filteredPresets = defaultPresets.filter(p => p.category === activeCategory);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700">Artboard Size</h4>
        {currentWidth && currentHeight && (
          <span className="text-[10px] text-slate-400">
            {currentWidth} x {currentHeight}
          </span>
        )}
      </div>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
              activeCategory === cat.id
                ? 'bg-white text-accent shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <i className={`fas ${cat.icon} mr-1`} />
            {cat.label}
          </button>
        ))}
      </div>

      {activeCategory === 'custom' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Width</label>
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Height</label>
              <input
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <button
            onClick={() => onSelect({ id: 'custom', name: 'Custom', width: customWidth, height: customHeight, category: 'custom', icon: 'fa-sliders' })}
            className="w-full py-2.5 bg-accent text-white rounded-xl font-bold text-sm hover:brightness-110 transition-all"
          >
            Apply Custom Size
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {filteredPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelect(preset)}
              className={`p-3 rounded-xl border text-left transition-all hover:border-accent hover:bg-accent/5 ${
                currentWidth === preset.width && currentHeight === preset.height
                  ? 'border-accent bg-accent/10'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <i className={`fab ${preset.icon} text-slate-400 text-xs`} />
                <span className="text-xs font-bold text-slate-700">{preset.name}</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {preset.width} x {preset.height}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// BLEND MODES
// ============================================================================

type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

interface BlendModeSelectorProps {
  value: BlendMode;
  onChange: (mode: BlendMode) => void;
  opacity?: number;
  onOpacityChange?: (opacity: number) => void;
  className?: string;
}

const blendModes: { mode: BlendMode; label: string; group: string }[] = [
  { mode: 'normal', label: 'Normal', group: 'Normal' },
  { mode: 'multiply', label: 'Multiply', group: 'Darken' },
  { mode: 'darken', label: 'Darken', group: 'Darken' },
  { mode: 'color-burn', label: 'Color Burn', group: 'Darken' },
  { mode: 'screen', label: 'Screen', group: 'Lighten' },
  { mode: 'lighten', label: 'Lighten', group: 'Lighten' },
  { mode: 'color-dodge', label: 'Color Dodge', group: 'Lighten' },
  { mode: 'overlay', label: 'Overlay', group: 'Contrast' },
  { mode: 'soft-light', label: 'Soft Light', group: 'Contrast' },
  { mode: 'hard-light', label: 'Hard Light', group: 'Contrast' },
  { mode: 'difference', label: 'Difference', group: 'Inversion' },
  { mode: 'exclusion', label: 'Exclusion', group: 'Inversion' },
  { mode: 'hue', label: 'Hue', group: 'Component' },
  { mode: 'saturation', label: 'Saturation', group: 'Component' },
  { mode: 'color', label: 'Color', group: 'Component' },
  { mode: 'luminosity', label: 'Luminosity', group: 'Component' },
];

export const BlendModeSelector: React.FC<BlendModeSelectorProps> = ({
  value,
  onChange,
  opacity = 100,
  onOpacityChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const groups = [...new Set(blendModes.map(b => b.group))];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600">Blend Mode</span>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-2 hover:border-slate-300 transition-all"
          >
            {blendModes.find(b => b.mode === value)?.label || 'Normal'}
            <i className={`fas fa-chevron-down text-[8px] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
              {groups.map((group) => (
                <div key={group}>
                  <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase bg-slate-50">
                    {group}
                  </div>
                  {blendModes
                    .filter(b => b.group === group)
                    .map((blend) => (
                      <button
                        key={blend.mode}
                        onClick={() => { onChange(blend.mode); setIsOpen(false); }}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-50 transition-colors ${
                          value === blend.mode ? 'text-accent font-bold' : 'text-slate-700'
                        }`}
                      >
                        {blend.label}
                      </button>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {onOpacityChange && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Opacity</span>
            <span className="text-xs text-slate-400">{opacity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => onOpacityChange(parseInt(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EYEDROPPER TOOL
// ============================================================================

interface EyedropperProps {
  onColorPick: (color: string) => void;
  className?: string;
}

export const Eyedropper: React.FC<EyedropperProps> = ({ onColorPick, className = '' }) => {
  const [isActive, setIsActive] = useState(false);
  const [pickedColor, setPickedColor] = useState<string | null>(null);

  const handlePick = useCallback(async () => {
    if (!('EyeDropper' in window)) {
      alert('Eyedropper is not supported in this browser');
      return;
    }

    setIsActive(true);
    try {
      // @ts-ignore - EyeDropper API
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      setPickedColor(result.sRGBHex);
      onColorPick(result.sRGBHex);
    } catch (e) {
      // User cancelled or error
    }
    setIsActive(false);
  }, [onColorPick]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={handlePick}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
          isActive
            ? 'bg-accent text-white'
            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
        }`}
      >
        <i className="fas fa-eye-dropper" />
      </button>
      {pickedColor && (
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg border border-slate-200 shadow-inner"
            style={{ backgroundColor: pickedColor }}
          />
          <span className="text-xs font-mono text-slate-600">{pickedColor}</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// RULERS
// ============================================================================

interface RulersProps {
  width: number;
  height: number;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
  unit?: 'px' | 'in' | 'cm';
  className?: string;
}

export const Rulers: React.FC<RulersProps> = ({
  width,
  height,
  zoom = 1,
  offsetX = 0,
  offsetY = 0,
  unit = 'px',
  className = '',
}) => {
  const rulerSize = 20;
  const majorTickInterval = 100;
  const minorTickInterval = 10;

  const renderHorizontalRuler = () => {
    const ticks = [];
    for (let i = 0; i <= width; i += minorTickInterval) {
      const isMajor = i % majorTickInterval === 0;
      ticks.push(
        <div
          key={`h-${i}`}
          className="absolute"
          style={{
            left: (i - offsetX) * zoom,
            top: 0,
            width: 1,
            height: isMajor ? rulerSize : rulerSize / 2,
          }}
        >
          <div className="w-px h-full bg-slate-300" />
          {isMajor && (
            <span className="absolute top-0 left-1 text-[8px] text-slate-400 font-mono">
              {i}
            </span>
          )}
        </div>
      );
    }
    return ticks;
  };

  const renderVerticalRuler = () => {
    const ticks = [];
    for (let i = 0; i <= height; i += minorTickInterval) {
      const isMajor = i % majorTickInterval === 0;
      ticks.push(
        <div
          key={`v-${i}`}
          className="absolute"
          style={{
            top: (i - offsetY) * zoom,
            left: 0,
            height: 1,
            width: isMajor ? rulerSize : rulerSize / 2,
          }}
        >
          <div className="h-px w-full bg-slate-300" />
          {isMajor && (
            <span
              className="absolute left-1 text-[8px] text-slate-400 font-mono"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {i}
            </span>
          )}
        </div>
      );
    }
    return ticks;
  };

  return (
    <div className={className}>
      {/* Corner */}
      <div
        className="absolute top-0 left-0 bg-slate-100 border-r border-b border-slate-200 z-50 flex items-center justify-center"
        style={{ width: rulerSize, height: rulerSize }}
      >
        <span className="text-[8px] text-slate-400">{unit}</span>
      </div>

      {/* Horizontal Ruler */}
      <div
        className="absolute top-0 bg-slate-50 border-b border-slate-200 z-40 overflow-hidden"
        style={{ left: rulerSize, right: 0, height: rulerSize }}
      >
        <div className="relative h-full">
          {renderHorizontalRuler()}
        </div>
      </div>

      {/* Vertical Ruler */}
      <div
        className="absolute left-0 bg-slate-50 border-r border-slate-200 z-40 overflow-hidden"
        style={{ top: rulerSize, bottom: 0, width: rulerSize }}
      >
        <div className="relative w-full">
          {renderVerticalRuler()}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ZOOM CONTROLS
// ============================================================================

interface ZoomControlsProps {
  value: number;
  onChange: (zoom: number) => void;
  min?: number;
  max?: number;
  presets?: number[];
  onFitToScreen?: () => void;
  className?: string;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  value,
  onChange,
  min = 10,
  max = 400,
  presets = [25, 50, 100, 150, 200, 300],
  onFitToScreen,
  className = '',
}) => {
  const [showPresets, setShowPresets] = useState(false);

  const zoomIn = () => onChange(Math.min(max, value + 25));
  const zoomOut = () => onChange(Math.max(min, value - 25));

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={zoomOut}
        disabled={value <= min}
        className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 disabled:opacity-50 transition-all"
      >
        <i className="fas fa-minus text-xs" />
      </button>

      <div className="relative">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 min-w-[60px] hover:bg-slate-200 transition-all"
        >
          {value}%
        </button>

        {showPresets && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
            {presets.map((preset) => (
              <button
                key={preset}
                onClick={() => { onChange(preset); setShowPresets(false); }}
                className={`w-full px-4 py-2 text-xs hover:bg-slate-50 transition-colors ${
                  value === preset ? 'text-accent font-bold' : 'text-slate-700'
                }`}
              >
                {preset}%
              </button>
            ))}
            {onFitToScreen && (
              <>
                <div className="border-t border-slate-100" />
                <button
                  onClick={() => { onFitToScreen(); setShowPresets(false); }}
                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-expand text-[10px]" />
                  Fit to Screen
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <button
        onClick={zoomIn}
        disabled={value >= max}
        className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 disabled:opacity-50 transition-all"
      >
        <i className="fas fa-plus text-xs" />
      </button>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-24 accent-accent"
      />
    </div>
  );
};

export default {
  SmartGuides,
  ArtboardPresets,
  BlendModeSelector,
  Eyedropper,
  Rulers,
  ZoomControls,
};
