// ============================================================================
// AUTO-LAYOUT SYSTEM - UI COMPONENTS
// ============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { autoLayoutManager } from '../../services/autoLayoutService';
import { LAYOUT_PRESETS, DEFAULT_BREAKPOINTS, createPadding } from '../../types/autolayout';
import type {
  AutoLayoutFrame,
  LayoutDirection,
  Alignment,
  Padding,
  LayoutPreset,
  Breakpoint
} from '../../types/autolayout';
import type { DesignElement } from '../../types';

// ============================================================================
// AUTO-LAYOUT PANEL
// ============================================================================

interface AutoLayoutPanelProps {
  selectedIds: string[];
  elements: DesignElement[];
  onElementsChange: (elements: DesignElement[]) => void;
}

export const AutoLayoutPanel: React.FC<AutoLayoutPanelProps> = ({
  selectedIds,
  elements,
  onElementsChange
}) => {
  const [activeFrame, setActiveFrame] = useState<AutoLayoutFrame | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  const frames = useMemo(() => autoLayoutManager.getAllFrames(), []);

  const handleCreateFrame = useCallback((presetId?: string) => {
    if (selectedIds.length < 2) return;

    const frame = presetId
      ? autoLayoutManager.createFrameFromPreset(presetId, selectedIds, elements)
      : autoLayoutManager.createFrame({ childIds: selectedIds }, elements);

    if (frame) {
      setActiveFrame(frame);
      const newElements = autoLayoutManager.applyLayout(frame.id, elements);
      onElementsChange(newElements);
    }
    setShowPresets(false);
  }, [selectedIds, elements, onElementsChange]);

  const handleUpdateFrame = useCallback((updates: Partial<AutoLayoutFrame>) => {
    if (!activeFrame) return;

    const updated = autoLayoutManager.updateFrame(activeFrame.id, updates);
    if (updated) {
      setActiveFrame(updated);
      const newElements = autoLayoutManager.applyLayout(updated.id, elements);
      onElementsChange(newElements);
    }
  }, [activeFrame, elements, onElementsChange]);

  const handleDeleteFrame = useCallback(() => {
    if (!activeFrame) return;
    autoLayoutManager.deleteFrame(activeFrame.id);
    setActiveFrame(null);
  }, [activeFrame]);

  return (
    <div className="w-72 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white">
        <h3 className="font-black text-sm tracking-wide">AUTO-LAYOUT</h3>
        <p className="text-[10px] text-white/70 mt-1">Smart responsive layouts</p>
      </div>

      {/* Quick actions */}
      <div className="p-3 border-b border-slate-100">
        <div className="flex gap-2">
          <button
            onClick={() => setShowPresets(true)}
            disabled={selectedIds.length < 2}
            className="flex-1 px-3 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="fas fa-magic mr-1.5"></i>
            Create Frame
          </button>
          <button
            onClick={() => handleCreateFrame()}
            disabled={selectedIds.length < 2}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>
        {selectedIds.length < 2 && (
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Select 2+ elements to create a frame
          </p>
        )}
      </div>

      {/* Presets modal */}
      <AnimatePresence>
        {showPresets && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPresets(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-200">
                <h4 className="font-bold text-sm">Choose Layout Preset</h4>
              </div>
              <div className="p-3 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {LAYOUT_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handleCreateFrame(preset.id)}
                      className="p-3 bg-slate-50 hover:bg-violet-50 rounded-xl text-left transition-colors group"
                    >
                      <div className="w-8 h-8 bg-violet-100 group-hover:bg-violet-200 rounded-lg flex items-center justify-center mb-2 transition-colors">
                        <i className={`fas ${preset.icon} text-violet-600`}></i>
                      </div>
                      <div className="font-bold text-xs text-slate-800">{preset.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active frame settings */}
      {activeFrame ? (
        <div className="p-3 space-y-4">
          {/* Direction */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Direction
            </label>
            <div className="flex gap-1 mt-1.5">
              {(['horizontal', 'vertical'] as LayoutDirection[]).map(dir => (
                <button
                  key={dir}
                  onClick={() => handleUpdateFrame({ direction: dir })}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                    activeFrame.direction === dir
                      ? 'bg-violet-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <i className={`fas fa-arrows-${dir === 'horizontal' ? 'left-right' : 'up-down'} mr-1.5`}></i>
                  {dir === 'horizontal' ? 'Row' : 'Column'}
                </button>
              ))}
            </div>
          </div>

          {/* Gap */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Gap
            </label>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                type="range"
                min={0}
                max={64}
                value={activeFrame.gap}
                onChange={e => handleUpdateFrame({ gap: Number(e.target.value) })}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <span className="w-10 text-center text-xs font-mono text-slate-600">
                {activeFrame.gap}px
              </span>
            </div>
          </div>

          {/* Alignment */}
          <AlignmentControl
            label="Main Axis"
            value={activeFrame.primaryAxisAlignment}
            onChange={value => handleUpdateFrame({ primaryAxisAlignment: value })}
            showSpaceOptions
          />

          <AlignmentControl
            label="Cross Axis"
            value={activeFrame.crossAxisAlignment}
            onChange={value => handleUpdateFrame({ crossAxisAlignment: value })}
          />

          {/* Padding */}
          <PaddingControl
            value={activeFrame.padding}
            onChange={padding => handleUpdateFrame({ padding })}
          />

          {/* Delete */}
          <button
            onClick={handleDeleteFrame}
            className="w-full px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-colors"
          >
            <i className="fas fa-trash mr-1.5"></i>
            Remove Auto-Layout
          </button>
        </div>
      ) : (
        <div className="p-6 text-center text-slate-400">
          <i className="fas fa-layer-group text-3xl mb-3 opacity-50"></i>
          <p className="text-xs">No auto-layout frame selected</p>
          <p className="text-[10px] mt-1">Select elements and create a frame</p>
        </div>
      )}

      {/* Existing frames */}
      {frames.length > 0 && (
        <div className="p-3 border-t border-slate-100">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Frames
          </label>
          <div className="space-y-1 mt-2">
            {frames.map(frame => (
              <button
                key={frame.id}
                onClick={() => setActiveFrame(frame)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                  activeFrame?.id === frame.id
                    ? 'bg-violet-100 text-violet-700'
                    : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <i className="fas fa-vector-square"></i>
                <span className="flex-1 text-left truncate">{frame.name}</span>
                <span className="text-[10px] text-slate-400">{frame.childIds.length}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ALIGNMENT CONTROL
// ============================================================================

interface AlignmentControlProps {
  label: string;
  value: Alignment;
  onChange: (value: Alignment) => void;
  showSpaceOptions?: boolean;
}

const AlignmentControl: React.FC<AlignmentControlProps> = ({
  label,
  value,
  onChange,
  showSpaceOptions
}) => {
  const options: { value: Alignment; icon: string; label: string }[] = [
    { value: 'start', icon: 'fa-align-left', label: 'Start' },
    { value: 'center', icon: 'fa-align-center', label: 'Center' },
    { value: 'end', icon: 'fa-align-right', label: 'End' },
    ...(showSpaceOptions ? [
      { value: 'space-between' as Alignment, icon: 'fa-arrows-left-right-to-line', label: 'Between' },
      { value: 'space-evenly' as Alignment, icon: 'fa-distribute-spacing-horizontal', label: 'Evenly' }
    ] : [
      { value: 'stretch' as Alignment, icon: 'fa-expand', label: 'Stretch' }
    ])
  ];

  return (
    <div>
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex gap-1 mt-1.5">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.label}
            className={`flex-1 py-2 rounded-lg text-xs transition-colors ${
              value === opt.value
                ? 'bg-violet-500 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <i className={`fas ${opt.icon}`}></i>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// PADDING CONTROL
// ============================================================================

interface PaddingControlProps {
  value: Padding;
  onChange: (value: Padding) => void;
}

const PaddingControl: React.FC<PaddingControlProps> = ({ value, onChange }) => {
  const [linked, setLinked] = useState(
    value.top === value.right && value.right === value.bottom && value.bottom === value.left
  );

  const handleChange = (side: keyof Padding, newValue: number) => {
    if (linked) {
      onChange(createPadding(newValue));
    } else {
      onChange({ ...value, [side]: newValue });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Padding
        </label>
        <button
          onClick={() => setLinked(!linked)}
          className={`p-1 rounded transition-colors ${
            linked ? 'text-violet-500' : 'text-slate-400'
          }`}
        >
          <i className={`fas fa-${linked ? 'link' : 'unlink'} text-xs`}></i>
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1 mt-1.5">
        {(['top', 'right', 'bottom', 'left'] as const).map(side => (
          <div key={side} className="relative">
            <input
              type="number"
              value={value[side]}
              onChange={e => handleChange(side, Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] text-slate-400 uppercase">
              {side[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// QUICK ALIGN TOOLBAR
// ============================================================================

interface QuickAlignToolbarProps {
  selectedIds: string[];
  elements: DesignElement[];
  onElementsChange: (elements: DesignElement[]) => void;
  canvasSize: { width: number; height: number };
}

export const QuickAlignToolbar: React.FC<QuickAlignToolbarProps> = ({
  selectedIds,
  elements,
  onElementsChange,
  canvasSize
}) => {
  const handleAlign = useCallback((axis: 'horizontal' | 'vertical', position: 'start' | 'center' | 'end') => {
    const newElements = autoLayoutManager.alignElements(
      selectedIds,
      elements,
      { axis, position, relativeTo: 'selection' },
      canvasSize
    );
    onElementsChange(newElements);
  }, [selectedIds, elements, onElementsChange, canvasSize]);

  const handleDistribute = useCallback((direction: 'horizontal' | 'vertical') => {
    const newElements = autoLayoutManager.distributeElements(
      selectedIds,
      elements,
      { direction, spacing: 'equal', alignment: 'start' }
    );
    onElementsChange(newElements);
  }, [selectedIds, elements, onElementsChange]);

  const handleMatchSize = useCallback((dimension: 'width' | 'height' | 'both') => {
    const newElements = autoLayoutManager.matchSizes(
      selectedIds,
      elements,
      dimension,
      'max'
    );
    onElementsChange(newElements);
  }, [selectedIds, elements, onElementsChange]);

  if (selectedIds.length < 2) return null;

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-xl shadow-lg border border-slate-200">
      {/* Horizontal align */}
      <div className="flex gap-0.5 pr-2 border-r border-slate-200">
        <button
          onClick={() => handleAlign('horizontal', 'start')}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          title="Align Left"
        >
          <i className="fas fa-align-left text-xs"></i>
        </button>
        <button
          onClick={() => handleAlign('horizontal', 'center')}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          title="Align Center H"
        >
          <i className="fas fa-align-center text-xs"></i>
        </button>
        <button
          onClick={() => handleAlign('horizontal', 'end')}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          title="Align Right"
        >
          <i className="fas fa-align-right text-xs"></i>
        </button>
      </div>

      {/* Vertical align */}
      <div className="flex gap-0.5 pr-2 border-r border-slate-200">
        <button
          onClick={() => handleAlign('vertical', 'start')}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          title="Align Top"
        >
          <i className="fas fa-arrow-up-to-line text-xs"></i>
        </button>
        <button
          onClick={() => handleAlign('vertical', 'center')}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          title="Align Center V"
        >
          <i className="fas fa-arrows-up-down text-xs"></i>
        </button>
        <button
          onClick={() => handleAlign('vertical', 'end')}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          title="Align Bottom"
        >
          <i className="fas fa-arrow-down-to-line text-xs"></i>
        </button>
      </div>

      {/* Distribute */}
      <div className="flex gap-0.5 pr-2 border-r border-slate-200">
        <button
          onClick={() => handleDistribute('horizontal')}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          title="Distribute Horizontally"
        >
          <i className="fas fa-distribute-spacing-horizontal text-xs"></i>
        </button>
        <button
          onClick={() => handleDistribute('vertical')}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          title="Distribute Vertically"
        >
          <i className="fas fa-distribute-spacing-vertical text-xs"></i>
        </button>
      </div>

      {/* Match size */}
      <div className="flex gap-0.5">
        <button
          onClick={() => handleMatchSize('width')}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          title="Match Width"
        >
          <i className="fas fa-arrows-left-right text-xs"></i>
        </button>
        <button
          onClick={() => handleMatchSize('height')}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          title="Match Height"
        >
          <i className="fas fa-arrows-up-down text-xs"></i>
        </button>
        <button
          onClick={() => handleMatchSize('both')}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          title="Match Both"
        >
          <i className="fas fa-expand text-xs"></i>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// RESPONSIVE PREVIEW
// ============================================================================

interface ResponsivePreviewProps {
  children: React.ReactNode;
}

export const ResponsivePreview: React.FC<ResponsivePreviewProps> = ({ children }) => {
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>(DEFAULT_BREAKPOINTS[2]);

  return (
    <div className="flex flex-col h-full">
      {/* Breakpoint selector */}
      <div className="flex items-center justify-center gap-2 p-3 bg-slate-100 border-b border-slate-200">
        {DEFAULT_BREAKPOINTS.map(bp => (
          <button
            key={bp.id}
            onClick={() => setActiveBreakpoint(bp)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeBreakpoint.id === bp.id
                ? 'bg-violet-500 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className={`fas ${bp.icon}`}></i>
            <span>{bp.name}</span>
          </button>
        ))}
      </div>

      {/* Preview area */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-200 overflow-auto">
        <div
          className="bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300"
          style={{
            width: activeBreakpoint.maxWidth || activeBreakpoint.minWidth,
            maxWidth: '100%'
          }}
        >
          {children}
        </div>
      </div>

      {/* Size indicator */}
      <div className="p-2 bg-slate-100 text-center text-xs text-slate-500">
        {activeBreakpoint.minWidth}px
        {activeBreakpoint.maxWidth && ` - ${activeBreakpoint.maxWidth}px`}
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default AutoLayoutPanel;
