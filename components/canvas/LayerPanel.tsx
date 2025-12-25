import React from 'react';
import { DesignElement } from '../../types';

interface LayerPanelProps {
  elements: DesignElement[];
  selectedIds: string[];
  collapsedGroups: Set<string>;
  draggedLayerId: string | null;
  onSelectElement: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDragStart: (id: string) => void;
  onDrop: (targetId: string) => void;
  onDragEnd: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onGroupSelected: () => void;
  onUngroup: (groupId: string) => void;
  onToggleGroupCollapse: (groupId: string) => void;
}

/**
 * Layer panel component for managing canvas element layers
 */
const LayerPanel: React.FC<LayerPanelProps> = ({
  elements,
  selectedIds,
  collapsedGroups,
  draggedLayerId,
  onSelectElement,
  onToggleVisibility,
  onToggleLock,
  onDragStart,
  onDrop,
  onDragEnd,
  onBringToFront,
  onSendToBack,
  onGroupSelected,
  onUngroup,
  onToggleGroupCollapse,
}) => {
  // Build layer tree with groups
  const layerTree = React.useMemo(() => {
    const tree: Record<string, DesignElement[]> = { ungrouped: [] };
    elements.forEach((el) => {
      if (el.groupId) {
        if (!tree[el.groupId]) tree[el.groupId] = [];
        tree[el.groupId].push(el);
      } else {
        tree['ungrouped'].push(el);
      }
    });
    return tree;
  }, [elements]);

  const renderLayerItem = (el: DesignElement) => {
    const isSelected = selectedIds.includes(el.id);

    return (
      <div
        key={el.id}
        draggable
        onDragStart={() => onDragStart(el.id)}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={() => {
          if (draggedLayerId) onDrop(el.id);
          onDragEnd();
        }}
        onClick={() => onSelectElement(el.id)}
        className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer group/row relative hover:translate-x-1 ${
          isSelected
            ? 'bg-white border-accent shadow-lg shadow-accent/5'
            : 'bg-white border-slate-50 hover:border-slate-200'
        }`}
        role="listitem"
        aria-selected={isSelected}
      >
        {/* Drag Handle */}
        <div className="flex items-center justify-center text-slate-200 cursor-grab active:cursor-grabbing px-1">
          <i className="fas fa-grip-vertical text-[10px]" aria-hidden="true"></i>
        </div>

        {/* Thumbnail */}
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shadow-inner">
          {el.type === 'image' ? (
            <img
              src={el.content}
              alt="Layer thumbnail"
              className="w-full h-full object-cover"
            />
          ) : (
            <i className="fas fa-font text-slate-400 text-xs" aria-hidden="true"></i>
          )}
        </div>

        {/* Layer Info */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-[10px] font-black truncate uppercase tracking-tight ${
              isSelected ? 'text-accent' : 'text-slate-700'
            }`}
          >
            {el.type === 'text' ? el.content : 'Image Asset'}
          </p>
          <p className="text-[8px] font-bold text-slate-400 uppercase">
            Z{el.zIndex} • {el.type}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(el.id);
            }}
            className={`p-1.5 rounded-lg hover:bg-slate-50 transition-all hover:scale-110 active:scale-90 ${
              el.isVisible ? 'text-slate-300' : 'text-rose-500'
            }`}
            aria-label={el.isVisible ? 'Hide layer' : 'Show layer'}
          >
            <i className="fas fa-eye text-[10px]" aria-hidden="true"></i>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock(el.id);
            }}
            className={`p-1.5 rounded-lg hover:bg-slate-50 transition-all hover:scale-110 active:scale-90 ${
              el.isLocked ? 'text-amber-500' : 'text-slate-300'
            }`}
            aria-label={el.isLocked ? 'Unlock layer' : 'Lock layer'}
          >
            <i className="fas fa-lock text-[10px]" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Composition Layers
        </h4>
        <div className="flex gap-2">
          <button
            onClick={onGroupSelected}
            title="Group Selection"
            className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-accent hover:scale-110 active:scale-90 transition-all"
            aria-label="Group selected layers"
          >
            <i className="fas fa-object-group text-xs" aria-hidden="true"></i>
          </button>
          <button
            onClick={onBringToFront}
            title="Bring to Front"
            className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-accent hover:scale-110 active:scale-90 transition-all"
            aria-label="Bring selected layers to front"
          >
            <i className="fas fa-layer-group rotate-180 text-xs" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      {/* Layer List */}
      <div
        className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-6"
        role="list"
        aria-label="Canvas layers"
      >
        {(Object.entries(layerTree) as [string, DesignElement[]][]).map(
          ([groupId, els]) => {
            if (els.length === 0) return null;
            const isGroup = groupId !== 'ungrouped';
            const isCollapsed = collapsedGroups.has(groupId);

            return (
              <div
                key={groupId}
                className={`space-y-2 ${
                  isGroup
                    ? 'bg-slate-50/50 rounded-2xl p-2 border border-slate-100'
                    : ''
                }`}
              >
                {isGroup && (
                  <div className="flex items-center justify-between px-2 mb-2">
                    <button
                      onClick={() => onToggleGroupCollapse(groupId)}
                      className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all hover:translate-x-1"
                      aria-expanded={!isCollapsed}
                    >
                      <i
                        className={`fas fa-chevron-right transition-transform ${
                          !isCollapsed ? 'rotate-90' : ''
                        }`}
                        aria-hidden="true"
                      ></i>
                      Group Context
                    </button>
                    <button
                      onClick={() => onUngroup(groupId)}
                      className="text-[8px] font-black text-rose-400 uppercase hover:underline active:scale-90 transition-transform"
                    >
                      Ungroup
                    </button>
                  </div>
                )}

                {!isCollapsed &&
                  els
                    .sort((a, b) => b.zIndex - a.zIndex)
                    .map((el) => renderLayerItem(el))}
              </div>
            );
          }
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-auto pt-6 border-t border-slate-100 flex gap-2">
        <button
          onClick={onBringToFront}
          className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          To Front
        </button>
        <button
          onClick={onSendToBack}
          className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          To Back
        </button>
      </div>
    </div>
  );
};

export default LayerPanel;
