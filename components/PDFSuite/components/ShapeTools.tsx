// ============================================
// ShapeTools - Shape Drawing Palette
// ============================================

import React, { useState } from 'react';

// Types
export type ShapeType =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'ellipse'
  | 'circle'
  | 'triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'star'
  | 'heart'
  | 'line'
  | 'arrow'
  | 'double-arrow'
  | 'curved-arrow'
  | 'bracket'
  | 'brace'
  | 'callout'
  | 'speech-bubble'
  | 'thought-bubble';

export interface ShapeConfig {
  type: ShapeType;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  cornerRadius?: number;
  arrowSize?: number;
}

interface ShapeToolsProps {
  selectedShape: ShapeType | null;
  onSelectShape: (shape: ShapeType) => void;
  config: Partial<ShapeConfig>;
  onConfigChange: (config: Partial<ShapeConfig>) => void;
  className?: string;
}

// Shape categories
const SHAPE_CATEGORIES = {
  basic: {
    label: 'Basic Shapes',
    shapes: [
      { type: 'rectangle' as ShapeType, label: 'Rectangle' },
      { type: 'rounded-rectangle' as ShapeType, label: 'Rounded Rectangle' },
      { type: 'ellipse' as ShapeType, label: 'Ellipse' },
      { type: 'circle' as ShapeType, label: 'Circle' },
      { type: 'triangle' as ShapeType, label: 'Triangle' },
      { type: 'diamond' as ShapeType, label: 'Diamond' },
    ]
  },
  polygon: {
    label: 'Polygons',
    shapes: [
      { type: 'pentagon' as ShapeType, label: 'Pentagon' },
      { type: 'hexagon' as ShapeType, label: 'Hexagon' },
      { type: 'star' as ShapeType, label: 'Star' },
      { type: 'heart' as ShapeType, label: 'Heart' },
    ]
  },
  lines: {
    label: 'Lines & Arrows',
    shapes: [
      { type: 'line' as ShapeType, label: 'Line' },
      { type: 'arrow' as ShapeType, label: 'Arrow' },
      { type: 'double-arrow' as ShapeType, label: 'Double Arrow' },
      { type: 'curved-arrow' as ShapeType, label: 'Curved Arrow' },
    ]
  },
  callouts: {
    label: 'Callouts',
    shapes: [
      { type: 'bracket' as ShapeType, label: 'Bracket' },
      { type: 'brace' as ShapeType, label: 'Brace' },
      { type: 'callout' as ShapeType, label: 'Callout' },
      { type: 'speech-bubble' as ShapeType, label: 'Speech Bubble' },
      { type: 'thought-bubble' as ShapeType, label: 'Thought Bubble' },
    ]
  }
};

// Color presets
const COLOR_PRESETS = [
  '#FF0000', '#FF6B00', '#FFD000', '#00C853', '#00BCD4',
  '#2196F3', '#3F51B5', '#9C27B0', '#E91E63', '#000000',
  '#FFFFFF', '#9E9E9E', '#607D8B', 'transparent'
];

// Shape icons
const ShapeIcon: React.FC<{ type: ShapeType; className?: string }> = ({ type, className = 'w-6 h-6' }) => {
  const iconClass = `${className} stroke-current`;

  switch (type) {
    case 'rectangle':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" strokeWidth={2} /></svg>;
    case 'rounded-rectangle':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="4" strokeWidth={2} /></svg>;
    case 'ellipse':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9" ry="6" strokeWidth={2} /></svg>;
    case 'circle':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" strokeWidth={2} /></svg>;
    case 'triangle':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><polygon points="12,4 22,20 2,20" strokeWidth={2} strokeLinejoin="round" /></svg>;
    case 'diamond':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><polygon points="12,2 22,12 12,22 2,12" strokeWidth={2} /></svg>;
    case 'pentagon':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><polygon points="12,2 22,9 18,21 6,21 2,9" strokeWidth={2} /></svg>;
    case 'hexagon':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><polygon points="12,2 21,7 21,17 12,22 3,17 3,7" strokeWidth={2} /></svg>;
    case 'star':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" strokeWidth={2} /></svg>;
    case 'heart':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth={2} /></svg>;
    case 'line':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><line x1="5" y1="19" x2="19" y2="5" strokeWidth={2} strokeLinecap="round" /></svg>;
    case 'arrow':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><path d="M5 12h14m0 0l-6-6m6 6l-6 6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case 'double-arrow':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><path d="M7 8l-4 4 4 4m10-8l4 4-4 4M3 12h18" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case 'curved-arrow':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 8-8m8 8a8 8 0 0 1-8 8" strokeWidth={2} strokeLinecap="round" /><path d="M12 4l-2 2 2 2m0 12l2-2-2-2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case 'bracket':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><path d="M8 4H5v16h3M16 4h3v16h-3" strokeWidth={2} strokeLinecap="round" /></svg>;
    case 'brace':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><path d="M8 4c-2 0-3 1-3 3v4c0 1-1 2-2 2 1 0 2 1 2 2v4c0 2 1 3 3 3M16 4c2 0 3 1 3 3v4c0 1 1 2 2 2-1 0-2 1-2 2v4c0 2-1 3-3 3" strokeWidth={2} strokeLinecap="round" /></svg>;
    case 'callout':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><path d="M3 5h18v12H9l-4 4v-4H3V5z" strokeWidth={2} strokeLinejoin="round" /></svg>;
    case 'speech-bubble':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeWidth={2} /></svg>;
    case 'thought-bubble':
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><circle cx="12" cy="10" r="7" strokeWidth={2} /><circle cx="7" cy="19" r="2" strokeWidth={2} /><circle cx="4" cy="22" r="1" strokeWidth={2} /></svg>;
    default:
      return <svg className={iconClass} fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" strokeWidth={2} /></svg>;
  }
};

export const ShapeTools: React.FC<ShapeToolsProps> = ({
  selectedShape,
  onSelectShape,
  config,
  onConfigChange,
  className = ''
}) => {
  const [activeCategory, setActiveCategory] = useState<keyof typeof SHAPE_CATEGORIES>('basic');
  const [showStrokeColor, setShowStrokeColor] = useState(false);
  const [showFillColor, setShowFillColor] = useState(false);

  return (
    <div className={`bg-[#1a1a2e] rounded-xl border border-white/10 overflow-hidden ${className}`}>
      {/* Category Tabs */}
      <div className="flex border-b border-white/10">
        {(Object.keys(SHAPE_CATEGORIES) as Array<keyof typeof SHAPE_CATEGORIES>).map(key => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`flex-1 px-3 py-2 text-xs transition-colors ${
              activeCategory === key
                ? 'bg-purple-500/20 text-purple-300 border-b-2 border-purple-500'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            {SHAPE_CATEGORIES[key].label}
          </button>
        ))}
      </div>

      {/* Shape Grid */}
      <div className="p-3">
        <div className="grid grid-cols-4 gap-2">
          {SHAPE_CATEGORIES[activeCategory].shapes.map(shape => (
            <button
              key={shape.type}
              onClick={() => onSelectShape(shape.type)}
              title={shape.label}
              className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                selectedShape === shape.type
                  ? 'bg-purple-500/30 text-purple-300 ring-2 ring-purple-500'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShapeIcon type={shape.type} />
            </button>
          ))}
        </div>
      </div>

      {/* Shape Settings */}
      <div className="p-3 border-t border-white/10 space-y-3">
        {/* Colors */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => {
                setShowStrokeColor(!showStrokeColor);
                setShowFillColor(false);
              }}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10"
            >
              <div
                className="w-5 h-5 rounded border border-white/30"
                style={{ backgroundColor: config.strokeColor || '#000000' }}
              />
              <span className="text-xs text-white/70">Stroke</span>
            </button>

            {showStrokeColor && (
              <div className="absolute bottom-full left-0 mb-1 p-2 bg-[#252540] rounded-lg shadow-xl border border-white/10 z-50">
                <div className="grid grid-cols-5 gap-1">
                  {COLOR_PRESETS.map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        onConfigChange({ strokeColor: color });
                        setShowStrokeColor(false);
                      }}
                      className={`w-6 h-6 rounded border ${
                        config.strokeColor === color ? 'border-white' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: color === 'transparent' ? undefined : color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowFillColor(!showFillColor);
                setShowStrokeColor(false);
              }}
              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/10"
            >
              <div
                className="w-5 h-5 rounded border border-white/30"
                style={{ backgroundColor: config.fillColor === 'transparent' ? undefined : config.fillColor || 'transparent' }}
              />
              <span className="text-xs text-white/70">Fill</span>
            </button>

            {showFillColor && (
              <div className="absolute bottom-full left-0 mb-1 p-2 bg-[#252540] rounded-lg shadow-xl border border-white/10 z-50">
                <div className="grid grid-cols-5 gap-1">
                  {COLOR_PRESETS.map(color => (
                    <button
                      key={color}
                      onClick={() => {
                        onConfigChange({ fillColor: color });
                        setShowFillColor(false);
                      }}
                      className={`w-6 h-6 rounded border ${
                        config.fillColor === color ? 'border-white' : 'border-white/20'
                      }`}
                      style={{ backgroundColor: color === 'transparent' ? undefined : color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stroke Width */}
        <div>
          <label className="block text-xs text-white/50 mb-1">Stroke Width</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={20}
              value={config.strokeWidth || 2}
              onChange={(e) => onConfigChange({ strokeWidth: parseInt(e.target.value) })}
              className="flex-1 accent-purple-500"
            />
            <span className="text-xs text-white/60 w-6">{config.strokeWidth || 2}px</span>
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-xs text-white/50 mb-1">Opacity</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              value={(config.opacity || 1) * 100}
              onChange={(e) => onConfigChange({ opacity: parseInt(e.target.value) / 100 })}
              className="flex-1 accent-purple-500"
            />
            <span className="text-xs text-white/60 w-8">{Math.round((config.opacity || 1) * 100)}%</span>
          </div>
        </div>

        {/* Corner Radius (for rectangles) */}
        {selectedShape === 'rounded-rectangle' && (
          <div>
            <label className="block text-xs text-white/50 mb-1">Corner Radius</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={50}
                value={config.cornerRadius || 10}
                onChange={(e) => onConfigChange({ cornerRadius: parseInt(e.target.value) })}
                className="flex-1 accent-purple-500"
              />
              <span className="text-xs text-white/60 w-6">{config.cornerRadius || 10}px</span>
            </div>
          </div>
        )}

        {/* Arrow Size (for arrows) */}
        {(selectedShape === 'arrow' || selectedShape === 'double-arrow' || selectedShape === 'curved-arrow') && (
          <div>
            <label className="block text-xs text-white/50 mb-1">Arrow Size</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={5}
                max={30}
                value={config.arrowSize || 15}
                onChange={(e) => onConfigChange({ arrowSize: parseInt(e.target.value) })}
                className="flex-1 accent-purple-500"
              />
              <span className="text-xs text-white/60 w-6">{config.arrowSize || 15}px</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-t border-white/10 flex gap-2">
        <button
          onClick={() => onConfigChange({ fillColor: 'transparent' })}
          className="flex-1 py-1.5 text-xs rounded bg-white/5 text-white/70 hover:bg-white/10"
        >
          No Fill
        </button>
        <button
          onClick={() => onConfigChange({ strokeColor: config.fillColor, fillColor: config.strokeColor })}
          className="flex-1 py-1.5 text-xs rounded bg-white/5 text-white/70 hover:bg-white/10"
        >
          Swap Colors
        </button>
      </div>
    </div>
  );
};

export default ShapeTools;
