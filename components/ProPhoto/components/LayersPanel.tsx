import React, { useState } from 'react';
import type { PhotoLayerExtended, ExtendedBlendMode } from '../types';

const BLEND_MODES: { value: ExtendedBlendMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'dissolve', label: 'Dissolve' },
  { value: 'darken', label: 'Darken' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'screen', label: 'Screen' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
  { value: 'hue', label: 'Hue' },
  { value: 'saturation', label: 'Saturation' },
  { value: 'color', label: 'Color' },
  { value: 'luminosity', label: 'Luminosity' },
];

interface LayersPanelProps {
  layers: PhotoLayerExtended[];
  selectedLayerIds: string[];
  onLayerSelect: (id: string, multi?: boolean) => void;
  onLayerUpdate: (id: string, updates: Partial<PhotoLayerExtended>) => void;
  onLayerAdd: () => void;
  onLayerDelete: (id: string) => void;
  onLayerDuplicate: (id: string) => void;
  onLayerReorder: (fromIndex: number, toIndex: number) => void;
  onOpenEffects: (id: string) => void;
  className?: string;
}

export default function LayersPanel({
  layers,
  selectedLayerIds,
  onLayerSelect,
  onLayerUpdate,
  onLayerAdd,
  onLayerDelete,
  onLayerDuplicate,
  onLayerReorder,
  onOpenEffects,
  className = '',
}: LayersPanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const selectedLayer = layers.find(l => selectedLayerIds.includes(l.id));

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      onLayerReorder(draggedIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDropIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropIndex(null);
  };

  return (
    <div className={`flex flex-col bg-[#2D2D30] ${className}`}>
      {/* Header */}
      <div className="px-4 py-2 bg-[#2D2D30] border-b border-black/40 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Layers
        </span>
        <div className="flex gap-2">
          <button
            onClick={onLayerAdd}
            className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-white"
            title="New Layer"
          >
            <i className="fas fa-plus text-[10px]" />
          </button>
          <button
            onClick={() => selectedLayerIds[0] && onLayerDelete(selectedLayerIds[0])}
            disabled={!selectedLayerIds.length || layers.length <= 1}
            className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-white disabled:opacity-30"
            title="Delete Layer"
          >
            <i className="fas fa-trash text-[10px]" />
          </button>
        </div>
      </div>

      {/* Blend Mode & Opacity */}
      {selectedLayer && (
        <div className="px-4 py-3 border-b border-black/20 space-y-3">
          {/* Blend Mode */}
          <div className="flex items-center gap-2">
            <label className="text-[9px] font-bold uppercase text-slate-500 w-16">Blend</label>
            <select
              value={selectedLayer.blendMode}
              onChange={(e) => onLayerUpdate(selectedLayer.id, { blendMode: e.target.value as ExtendedBlendMode })}
              className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-1 text-[10px] text-white outline-none focus:border-accent"
            >
              {BLEND_MODES.map(mode => (
                <option key={mode.value} value={mode.value}>{mode.label}</option>
              ))}
            </select>
          </div>

          {/* Opacity */}
          <div className="flex items-center gap-2">
            <label className="text-[9px] font-bold uppercase text-slate-500 w-16">Opacity</label>
            <input
              type="range"
              min={0}
              max={100}
              value={selectedLayer.opacity * 100}
              onChange={(e) => onLayerUpdate(selectedLayer.id, { opacity: parseInt(e.target.value) / 100 })}
              className="flex-1 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-accent"
            />
            <span className="text-[10px] font-mono text-white w-10 text-right">
              {Math.round(selectedLayer.opacity * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {layers.slice().reverse().map((layer, reversedIndex) => {
          const index = layers.length - 1 - reversedIndex;
          const isSelected = selectedLayerIds.includes(layer.id);
          const isDragging = draggedIndex === index;
          const isDropTarget = dropIndex === index;

          return (
            <div
              key={layer.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={(e) => onLayerSelect(layer.id, e.shiftKey || e.ctrlKey || e.metaKey)}
              onDoubleClick={() => onOpenEffects(layer.id)}
              className={`
                relative h-14 px-3 border-b border-black/10 flex items-center gap-3 cursor-pointer
                transition-all duration-150
                ${isSelected ? 'bg-[#094771] border-l-4 border-l-accent' : 'hover:bg-white/5'}
                ${isDragging ? 'opacity-50' : ''}
                ${isDropTarget ? 'border-t-2 border-t-accent' : ''}
              `}
            >
              {/* Visibility Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLayerUpdate(layer.id, { visible: !layer.visible });
                }}
                className={`w-5 text-center ${layer.visible ? 'text-slate-400' : 'text-slate-700'}`}
              >
                <i className={`fas ${layer.visible ? 'fa-eye' : 'fa-eye-slash'} text-[10px]`} />
              </button>

              {/* Lock Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLayerUpdate(layer.id, { locked: !layer.locked });
                }}
                className={`w-5 text-center ${layer.locked ? 'text-amber-500' : 'text-slate-700'}`}
              >
                <i className={`fas ${layer.locked ? 'fa-lock' : 'fa-lock-open'} text-[10px]`} />
              </button>

              {/* Thumbnail */}
              <div className="w-10 h-10 bg-slate-800 rounded border border-white/10 overflow-hidden flex-shrink-0 shadow-inner">
                {layer.thumbnail || layer.content ? (
                  <img
                    src={layer.thumbnail || layer.content}
                    alt={layer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <i className="fas fa-image text-xs" />
                  </div>
                )}
              </div>

              {/* Layer Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white truncate">{layer.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {layer.effects && layer.effects.filter(e => e.enabled).length > 0 && (
                    <span className="text-[8px] text-accent font-bold uppercase">
                      fx
                    </span>
                  )}
                  {layer.mask && (
                    <span className="text-[8px] text-slate-500 font-bold uppercase">
                      mask
                    </span>
                  )}
                  {layer.smartObject && (
                    <span className="text-[8px] text-purple-400 font-bold uppercase">
                      smart
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerDuplicate(layer.id);
                  }}
                  className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-white"
                  title="Duplicate Layer"
                >
                  <i className="fas fa-copy text-[8px]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="px-3 py-2 border-t border-black/40 flex items-center gap-1">
        <button
          className="flex-1 h-7 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 text-slate-400 hover:text-white"
          onClick={onLayerAdd}
          title="New Layer"
        >
          <i className="fas fa-plus text-[9px]" />
          <span className="text-[9px] font-bold uppercase">New Layer</span>
        </button>
        <button
          className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          onClick={() => selectedLayerIds[0] && onLayerDuplicate(selectedLayerIds[0])}
          disabled={!selectedLayerIds.length}
          title="Duplicate Layer"
        >
          <i className="fas fa-clone text-[9px]" />
        </button>
        <button
          className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          title="Create Group"
        >
          <i className="fas fa-folder text-[9px]" />
        </button>
        <button
          className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          onClick={() => selectedLayerIds[0] && onOpenEffects(selectedLayerIds[0])}
          disabled={!selectedLayerIds.length}
          title="Layer Effects"
        >
          <i className="fas fa-fx text-[9px]">fx</i>
        </button>
      </div>
    </div>
  );
}
