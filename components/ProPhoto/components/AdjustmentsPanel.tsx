import { useState } from 'react';
import type { ExtendedPhotoFilter, ExtendedFilterType, PhotoLayerExtended } from '../types';
import { filterConfigs, filterCategories, filterPresets } from '../utils/filterPipeline';

interface AdjustmentsPanelProps {
  layer: PhotoLayerExtended | null;
  onFilterChange: (filterId: string, value: number) => void;
  onFilterAdd: (type: ExtendedFilterType) => void;
  onFilterRemove?: (filterId: string) => void;
  onFilterToggle: (filterId: string) => void;
  onApplyPreset: (presetId: string) => void;
  onResetAll: () => void;
  className?: string;
}

export default function AdjustmentsPanel({
  layer,
  onFilterChange,
  onFilterAdd,
  onFilterRemove: _onFilterRemove,
  onFilterToggle,
  onApplyPreset,
  onResetAll,
  className = '',
}: AdjustmentsPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [showPresets, setShowPresets] = useState(false);

  const filters = layer?.filters || [];

  const getFilterValue = (type: ExtendedFilterType): ExtendedPhotoFilter | undefined => {
    return filters.find(f => f.type === type);
  };

  const handleSliderChange = (type: ExtendedFilterType, value: number) => {
    const existing = getFilterValue(type);
    if (existing) {
      onFilterChange(existing.id, value);
    } else {
      onFilterAdd(type);
      // Value will be set by the parent after adding
    }
  };

  const renderSlider = (type: ExtendedFilterType) => {
    const config = filterConfigs[type];
    if (!config) return null;

    const filter = getFilterValue(type);
    const value = filter ? (typeof filter.value === 'number' ? filter.value : 0) : config.defaultValue;
    const isActive = filter?.enabled ?? false;
    const isModified = value !== config.defaultValue;

    return (
      <div key={type} className="space-y-1">
        <div className="flex items-center justify-between">
          <button
            onClick={() => filter ? onFilterToggle(filter.id) : onFilterAdd(type)}
            className={`
              text-[9px] font-bold uppercase tracking-wide
              ${isActive ? 'text-white' : 'text-slate-500'}
              ${isModified ? 'text-accent' : ''}
            `}
          >
            {config.label}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">
              {value}{config.unit || ''}
            </span>
            {isModified && (
              <button
                onClick={() => handleSliderChange(type, config.defaultValue)}
                className="text-[8px] text-slate-600 hover:text-white"
                title="Reset"
              >
                <i className="fas fa-rotate-left" />
              </button>
            )}
          </div>
        </div>
        <div className="relative">
          <input
            type="range"
            min={config.min}
            max={config.max}
            step={config.step}
            value={value}
            onChange={(e) => handleSliderChange(type, parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-accent"
          />
          {/* Center line for bipolar sliders */}
          {config.min < 0 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-slate-500 pointer-events-none"
              style={{ left: `${((0 - config.min) / (config.max - config.min)) * 100}%` }}
            />
          )}
        </div>
      </div>
    );
  };

  const currentCategory = filterCategories.find(c => c.id === activeTab);

  if (!layer) {
    return (
      <div className={`flex flex-col bg-[#2D2D30] ${className}`}>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <i className="fas fa-sliders text-2xl text-slate-700 mb-2" />
            <p className="text-[10px] text-slate-500">Select a layer to adjust</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-[#2D2D30] ${className}`}>
      {/* Header */}
      <div className="px-4 py-2 bg-[#2D2D30] border-b border-black/40 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Adjustments
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className={`
              px-2 py-1 rounded text-[9px] font-bold uppercase
              ${showPresets ? 'bg-accent/20 text-accent' : 'bg-white/5 text-slate-500 hover:text-white'}
            `}
          >
            Presets
          </button>
          <button
            onClick={onResetAll}
            className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-white"
            title="Reset All"
          >
            <i className="fas fa-rotate-left text-[10px]" />
          </button>
        </div>
      </div>

      {/* Presets Panel */}
      {showPresets && (
        <div className="p-3 border-b border-black/40 bg-black/20">
          <div className="grid grid-cols-3 gap-2">
            {filterPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  onApplyPreset(preset.id);
                  setShowPresets(false);
                }}
                className="px-2 py-2 rounded bg-white/5 hover:bg-white/10 text-[9px] font-medium text-slate-400 hover:text-white transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex border-b border-black/40 overflow-x-auto scrollbar-hide">
        {filterCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`
              px-3 py-2 text-[9px] font-bold uppercase whitespace-nowrap transition-colors
              ${activeTab === cat.id
                ? 'text-accent border-b-2 border-accent bg-white/5'
                : 'text-slate-500 hover:text-white'
              }
            `}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Adjustments */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentCategory?.filters.map((filterType) => renderSlider(filterType))}
      </div>

      {/* Active Filters List */}
      {filters.filter(f => f.enabled).length > 0 && (
        <div className="px-3 py-2 border-t border-black/40">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[8px] text-slate-600 uppercase mr-1">Active:</span>
            {filters.filter(f => f.enabled).map((filter) => (
              <span
                key={filter.id}
                className="px-1.5 py-0.5 rounded bg-accent/20 text-accent text-[8px] font-bold"
              >
                {filterConfigs[filter.type]?.label || filter.type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
