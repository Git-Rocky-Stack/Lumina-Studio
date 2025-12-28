import { useState } from 'react';
import type { BrushPreset } from '../types';
import { brushCategories, getBrushesForCategory } from '../utils/brushPresets';

interface BrushSettingsProps {
  brushPreset: BrushPreset;
  onBrushChange: (preset: BrushPreset) => void;
  primaryColor: string;
  secondaryColor: string;
  onPrimaryColorChange: (color: string) => void;
  onSecondaryColorChange: (color: string) => void;
  onSwapColors: () => void;
  className?: string;
}

export default function BrushSettings({
  brushPreset,
  onBrushChange,
  primaryColor,
  secondaryColor,
  onPrimaryColorChange,
  onSecondaryColorChange,
  onSwapColors,
  className = '',
}: BrushSettingsProps) {
  const [showPresets, setShowPresets] = useState(false);
  const [activeCategory, setActiveCategory] = useState('basic');

  const handleSliderChange = (key: keyof BrushPreset, value: number) => {
    onBrushChange({ ...brushPreset, [key]: value });
  };

  const handlePressureSensitivityChange = (key: keyof BrushPreset['pressureSensitivity']) => {
    onBrushChange({
      ...brushPreset,
      pressureSensitivity: {
        ...brushPreset.pressureSensitivity,
        [key]: !brushPreset.pressureSensitivity[key],
      },
    });
  };

  return (
    <div className={`bg-[#2D2D30] border-b border-black/40 ${className}`}>
      {/* Brush Presets Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="w-full px-4 py-2 flex items-center gap-3 hover:bg-white/5 transition-colors"
        >
          {/* Brush preview */}
          <div
            className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center"
            style={{
              background: `radial-gradient(circle, ${primaryColor} 0%, transparent ${brushPreset.hardness}%)`,
            }}
          >
            <div
              className="rounded-full bg-current"
              style={{
                width: `${Math.min(24, brushPreset.size / 4)}px`,
                height: `${Math.min(24, brushPreset.size / 4)}px`,
                color: primaryColor,
              }}
            />
          </div>

          <div className="flex-1 text-left">
            <p className="text-[11px] font-bold text-white">{brushPreset.name}</p>
            <p className="text-[9px] text-slate-500">{brushPreset.size}px • {brushPreset.hardness}% hardness</p>
          </div>

          <i className={`fas fa-chevron-${showPresets ? 'up' : 'down'} text-slate-500 text-[10px]`} />
        </button>

        {/* Presets Panel */}
        {showPresets && (
          <div className="absolute top-full left-0 right-0 z-50 bg-[#1E1E1E] border border-white/10 shadow-2xl max-h-80 overflow-hidden">
            {/* Category tabs */}
            <div className="flex border-b border-white/10 overflow-x-auto scrollbar-hide">
              {brushCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`
                    px-3 py-2 text-[9px] font-bold uppercase whitespace-nowrap
                    ${activeCategory === cat.id
                      ? 'text-accent border-b-2 border-accent bg-white/5'
                      : 'text-slate-500 hover:text-white'
                    }
                  `}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Brush list */}
            <div className="max-h-48 overflow-y-auto p-2 grid grid-cols-2 gap-1">
              {getBrushesForCategory(activeCategory).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onBrushChange(preset);
                    setShowPresets(false);
                  }}
                  className={`
                    p-2 rounded flex items-center gap-2 text-left
                    ${brushPreset.id === preset.id
                      ? 'bg-accent/20 border border-accent/30'
                      : 'hover:bg-white/5'
                    }
                  `}
                >
                  <div
                    className="w-6 h-6 rounded-full border border-white/20"
                    style={{
                      background: `radial-gradient(circle, #fff 0%, transparent ${preset.hardness}%)`,
                    }}
                  />
                  <span className="text-[10px] text-slate-300 truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Brush Settings */}
      <div className="p-4 space-y-4">
        {/* Size */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-bold uppercase text-slate-400">Size</label>
            <span className="text-[10px] font-mono text-white">{brushPreset.size}px</span>
          </div>
          <input
            type="range"
            min={1}
            max={500}
            value={brushPreset.size}
            onChange={(e) => handleSliderChange('size', parseInt(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-accent"
          />
        </div>

        {/* Hardness */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-bold uppercase text-slate-400">Hardness</label>
            <span className="text-[10px] font-mono text-white">{brushPreset.hardness}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={brushPreset.hardness}
            onChange={(e) => handleSliderChange('hardness', parseInt(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-accent"
          />
        </div>

        {/* Opacity */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-bold uppercase text-slate-400">Opacity</label>
            <span className="text-[10px] font-mono text-white">{brushPreset.opacity}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={brushPreset.opacity}
            onChange={(e) => handleSliderChange('opacity', parseInt(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-accent"
          />
        </div>

        {/* Flow */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-bold uppercase text-slate-400">Flow</label>
            <span className="text-[10px] font-mono text-white">{brushPreset.flow}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={brushPreset.flow}
            onChange={(e) => handleSliderChange('flow', parseInt(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-accent"
          />
        </div>

        {/* Pressure Sensitivity */}
        <div className="pt-2 border-t border-white/10">
          <label className="text-[9px] font-bold uppercase text-slate-400 block mb-2">
            Pressure Sensitivity
          </label>
          <div className="flex flex-wrap gap-2">
            {(['size', 'opacity', 'hardness', 'flow'] as const).map((key) => (
              <button
                key={key}
                onClick={() => handlePressureSensitivityChange(key)}
                className={`
                  px-2 py-1 rounded text-[9px] font-bold uppercase
                  ${brushPreset.pressureSensitivity[key]
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'bg-white/5 text-slate-500 hover:text-white'
                  }
                `}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Color Picker */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-4">
          {/* Foreground/Background colors */}
          <div className="relative w-12 h-12">
            {/* Background color */}
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => onSecondaryColorChange(e.target.value)}
              className="absolute bottom-0 right-0 w-7 h-7 rounded border border-white/20 cursor-pointer"
              title="Background Color"
            />
            {/* Foreground color */}
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => onPrimaryColorChange(e.target.value)}
              className="absolute top-0 left-0 w-8 h-8 rounded border-2 border-white/30 cursor-pointer shadow-lg z-10"
              title="Foreground Color"
            />
          </div>

          {/* Swap colors */}
          <button
            onClick={onSwapColors}
            className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center"
            title="Swap Colors (X)"
          >
            <i className="fas fa-arrow-right-arrow-left text-[10px] text-slate-400 rotate-90" />
          </button>

          {/* Reset colors */}
          <button
            onClick={() => {
              onPrimaryColorChange('#000000');
              onSecondaryColorChange('#ffffff');
            }}
            className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center"
            title="Reset Colors (D)"
          >
            <div className="w-4 h-4 relative">
              <div className="absolute top-0 left-0 w-2 h-2 bg-black border border-white/30" />
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-white border border-white/30" />
            </div>
          </button>

          {/* Color display */}
          <div className="flex-1 text-right">
            <p className="text-[9px] font-mono text-slate-400">{primaryColor.toUpperCase()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
