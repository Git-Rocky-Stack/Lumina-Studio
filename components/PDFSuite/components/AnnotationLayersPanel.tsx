// ============================================
// AnnotationLayersPanel Component
// Manages annotation layers with visibility, lock, and reordering
// ============================================

import React, { useState, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2, MoreVertical } from 'lucide-react';
import type { AnnotationLayer } from '../hooks/useEnhancedAnnotations';

interface AnnotationLayersPanelProps {
  layers: AnnotationLayer[];
  activeLayerId: string | null;
  onCreateLayer: (name: string, color?: string) => void;
  onUpdateLayer: (id: string, updates: Partial<AnnotationLayer>) => void;
  onDeleteLayer: (id: string) => void;
  onReorderLayers: (layerIds: string[]) => void;
  onSetActiveLayer: (id: string | null) => void;
  annotationCount: Record<string, number>;
  className?: string;
}

const LAYER_COLORS = [
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

export const AnnotationLayersPanel: React.FC<AnnotationLayersPanelProps> = ({
  layers,
  activeLayerId,
  onCreateLayer,
  onUpdateLayer,
  onDeleteLayer,
  onReorderLayers,
  onSetActiveLayer,
  annotationCount,
  className = '',
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newLayerName, setNewLayerName] = useState('');
  const [selectedColor, setSelectedColor] = useState(LAYER_COLORS[0]);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Handle create layer
  const handleCreateLayer = useCallback(() => {
    if (!newLayerName.trim()) return;

    onCreateLayer(newLayerName.trim(), selectedColor);
    setNewLayerName('');
    setIsCreating(false);
    setSelectedColor(LAYER_COLORS[0]);
  }, [newLayerName, selectedColor, onCreateLayer]);

  // Handle rename layer
  const handleRenameLayer = useCallback(
    (layerId: string) => {
      if (!editingName.trim()) return;

      onUpdateLayer(layerId, { name: editingName.trim() });
      setEditingLayerId(null);
      setEditingName('');
    },
    [editingName, onUpdateLayer]
  );

  // Start editing
  const startEditing = useCallback((layer: AnnotationLayer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  }, []);

  // Handle reorder
  const handleReorder = useCallback(
    (newOrder: AnnotationLayer[]) => {
      onReorderLayers(newOrder.map((l) => l.id));
    },
    [onReorderLayers]
  );

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700">Layers</h3>
          <button
            onClick={() => setIsCreating(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
            title="Create new layer"
            aria-label="Create new layer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Create Layer Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 py-3 bg-slate-50 border-b border-slate-200"
        >
          <label className="block text-xs font-medium text-slate-700 mb-2">
            New Layer
          </label>
          <input
            type="text"
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateLayer();
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewLayerName('');
              }
            }}
            placeholder="Layer name"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
            autoFocus
          />

          {/* Color Picker */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Layer Color
            </label>
            <div className="flex gap-2">
              {LAYER_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    selectedColor === color
                      ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsCreating(false);
                setNewLayerName('');
              }}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateLayer}
              disabled={!newLayerName.trim()}
              className="flex-1 px-3 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
          </div>
        </motion.div>
      )}

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto">
        <Reorder.Group
          axis="y"
          values={layers}
          onReorder={handleReorder}
          className="space-y-0"
        >
          {layers.map((layer) => (
            <Reorder.Item
              key={layer.id}
              value={layer}
              className="border-b border-slate-100"
            >
              <LayerItem
                layer={layer}
                isActive={activeLayerId === layer.id}
                isEditing={editingLayerId === layer.id}
                editingName={editingName}
                annotationCount={annotationCount[layer.id] || 0}
                onSetActive={() => onSetActiveLayer(layer.id)}
                onToggleVisibility={() =>
                  onUpdateLayer(layer.id, { isVisible: !layer.isVisible })
                }
                onToggleLock={() =>
                  onUpdateLayer(layer.id, { isLocked: !layer.isLocked })
                }
                onDelete={() => onDeleteLayer(layer.id)}
                onStartEdit={() => startEditing(layer)}
                onEditNameChange={setEditingName}
                onSaveEdit={() => handleRenameLayer(layer.id)}
                onCancelEdit={() => {
                  setEditingLayerId(null);
                  setEditingName('');
                }}
                canDelete={layer.id !== 'default'}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {layers.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <div className="w-8 h-8 text-slate-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                  <path d="M3 9h18M9 21V9" strokeWidth="2" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">No layers yet</p>
            <p className="text-xs text-slate-500">
              Create layers to organize your annotations
            </p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">
            {layers.length} {layers.length === 1 ? 'layer' : 'layers'}
          </span>
          <span className="text-slate-500">
            {Object.values(annotationCount).reduce((a, b) => a + b, 0)} annotations
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// LayerItem Component
// ============================================

interface LayerItemProps {
  layer: AnnotationLayer;
  isActive: boolean;
  isEditing: boolean;
  editingName: string;
  annotationCount: number;
  onSetActive: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  onStartEdit: () => void;
  onEditNameChange: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  canDelete: boolean;
}

const LayerItem: React.FC<LayerItemProps> = ({
  layer,
  isActive,
  isEditing,
  editingName,
  annotationCount,
  onSetActive,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onStartEdit,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit,
  canDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      layout
      className={`group px-4 py-3 cursor-pointer transition-colors ${
        isActive ? 'bg-indigo-50' : 'hover:bg-slate-50'
      }`}
      onClick={(e) => {
        if (!isEditing && e.target === e.currentTarget) {
          onSetActive();
        }
      }}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="4" r="1" />
            <circle cx="5" cy="8" r="1" />
            <circle cx="5" cy="12" r="1" />
            <circle cx="11" cy="4" r="1" />
            <circle cx="11" cy="8" r="1" />
            <circle cx="11" cy="12" r="1" />
          </svg>
        </div>

        {/* Layer Color */}
        <div
          className="w-4 h-4 rounded flex-shrink-0"
          style={{ backgroundColor: layer.color }}
        />

        {/* Layer Name */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editingName}
              onChange={(e) => onEditNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
              onBlur={onSaveEdit}
              className="w-full px-2 py-1 bg-white border border-indigo-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div onClick={onSetActive}>
              <p
                className="text-sm font-medium text-slate-700 truncate"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onStartEdit();
                }}
              >
                {layer.name}
              </p>
              <p className="text-xs text-slate-500">
                {annotationCount} {annotationCount === 1 ? 'item' : 'items'}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility();
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                layer.isVisible
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-400 hover:bg-slate-100'
              }`}
              title={layer.isVisible ? 'Hide layer' : 'Show layer'}
              aria-label={layer.isVisible ? 'Hide layer' : 'Show layer'}
            >
              {layer.isVisible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock();
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                layer.isLocked
                  ? 'text-amber-600 hover:bg-amber-50'
                  : 'text-slate-400 hover:bg-slate-100'
              }`}
              title={layer.isLocked ? 'Unlock layer' : 'Lock layer'}
              aria-label={layer.isLocked ? 'Unlock layer' : 'Lock layer'}
            >
              {layer.isLocked ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
            </button>

            {canDelete && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  aria-label="Layer options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartEdit();
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Rename
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </motion.div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AnnotationLayersPanel;
