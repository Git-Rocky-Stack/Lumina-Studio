import React from 'react';
import { DesignElement, AnimationType, AnimationDirection, AnimationEasing } from '../../types';

interface AnimationPreset {
  id: string;
  label: string;
  icon: string;
  config: {
    animation: AnimationType;
    animationDirection?: AnimationDirection;
    easing?: AnimationEasing;
  };
}

const ANIMATION_PRESETS: AnimationPreset[] = [
  { id: 'fade-in', label: 'Fade In', icon: 'fa-cloud', config: { animation: 'fade', easing: 'ease-out' } },
  { id: 'fade-out', label: 'Fade Out', icon: 'fa-cloud-meatball', config: { animation: 'fade-out', easing: 'ease-out' } },
  { id: 'bounce-in', label: 'Bounce In', icon: 'fa-basketball', config: { animation: 'bounce', easing: 'bounce-phys' } },
  { id: 'slide-left', label: 'Slide L', icon: 'fa-arrow-left', config: { animation: 'slide', animationDirection: 'left', easing: 'ease-out' } },
  { id: 'slide-right', label: 'Slide R', icon: 'fa-arrow-right', config: { animation: 'slide', animationDirection: 'right', easing: 'ease-out' } },
  { id: 'slide-up', label: 'Slide U', icon: 'fa-arrow-up', config: { animation: 'slide', animationDirection: 'up', easing: 'ease-out' } },
  { id: 'slide-down', label: 'Slide D', icon: 'fa-arrow-down', config: { animation: 'slide', animationDirection: 'down', easing: 'ease-out' } },
  { id: 'zoom-in', label: 'Zoom In', icon: 'fa-magnifying-glass-plus', config: { animation: 'zoom', animationDirection: 'in', easing: 'elastic' } },
  { id: 'zoom-out', label: 'Zoom Out', icon: 'fa-magnifying-glass-minus', config: { animation: 'zoom', animationDirection: 'out', easing: 'ease-out' } },
];

interface AnimationPanelProps {
  elements: DesignElement[];
  selectedIds: string[];
  selectedElement: DesignElement | undefined;
  isPreviewMode: boolean;
  animationClipboard: {
    animation: AnimationType;
    direction?: AnimationDirection;
    easing?: AnimationEasing;
    duration: number;
    delay: number;
    loop?: string;
  } | null;
  maxTimelineSec: number;
  timelineRef: React.RefObject<HTMLDivElement>;
  onTriggerPreview: () => void;
  onMagicStagger: () => void;
  onCopyAnimation: () => void;
  onPasteAnimation: () => void;
  onUpdateSelectedElements: (updates: Partial<DesignElement>) => void;
  onSelectElement: (id: string) => void;
  onTimelineInteraction: (e: React.MouseEvent, elId: string, type: 'move' | 'stretch') => void;
}

/**
 * Animation panel component for managing element animations
 */
const AnimationPanel: React.FC<AnimationPanelProps> = ({
  elements,
  selectedIds,
  selectedElement,
  isPreviewMode,
  animationClipboard,
  maxTimelineSec,
  timelineRef,
  onTriggerPreview,
  onMagicStagger,
  onCopyAnimation,
  onPasteAnimation,
  onUpdateSelectedElements,
  onSelectElement,
  onTimelineInteraction,
}) => {
  const applyPreset = (preset: AnimationPreset) => {
    onUpdateSelectedElements({
      animation: preset.config.animation,
      animationDirection: preset.config.animationDirection,
      animationEasing: preset.config.easing || 'ease-out',
      animationDuration: selectedElement?.animationDuration || 1,
      animationDelay: selectedElement?.animationDelay || 0,
    });
  };

  const isPresetActive = (preset: AnimationPreset): boolean => {
    if (!selectedElement) return false;
    const sameAnim = selectedElement.animation === preset.config.animation;
    const sameDir = selectedElement.animationDirection === preset.config.animationDirection;
    return sameAnim && (preset.config.animationDirection === undefined || sameDir);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Motion Lab
        </h4>
        <div className="flex gap-2">
          <button
            onClick={onMagicStagger}
            title="Magic Stagger Selection"
            className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all hover:scale-110 active:scale-90"
            aria-label="Apply magic stagger to selection"
          >
            <i className="fas fa-wand-magic-sparkles text-xs" aria-hidden="true"></i>
          </button>
          <button
            onClick={onTriggerPreview}
            className="text-[9px] text-rose-500 font-black uppercase tracking-widest hover:underline hover:scale-105 transition-transform active:scale-95"
          >
            Test Sequence
          </button>
        </div>
      </div>

      {/* Timeline Sequencer */}
      <div className="space-y-6">
        <div className="flex items-center justify-between ml-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Master Sequence
          </p>
          <button
            onClick={() =>
              onUpdateSelectedElements({
                animationIterationCount:
                  selectedElement?.animationIterationCount === 'infinite' ? '1' : 'infinite',
              })
            }
            className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 ${
              selectedElement?.animationIterationCount === 'infinite'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
            aria-pressed={selectedElement?.animationIterationCount === 'infinite'}
          >
            <i className="fas fa-repeat mr-1" aria-hidden="true"></i> Loop Composition
          </button>
        </div>

        {/* Timeline */}
        <div
          ref={timelineRef}
          className="bg-slate-950 rounded-[2rem] p-6 pt-10 space-y-4 relative overflow-hidden shadow-2xl group/timeline"
          role="region"
          aria-label="Animation timeline"
        >
          {/* Timeline Markers */}
          <div className="absolute top-0 left-0 right-0 h-8 flex justify-between items-center px-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md z-20">
            {[0, 1, 2, 3, 4, 5].map((s) => (
              <span key={s} className="text-[8px] font-mono text-slate-500">
                {s}s
              </span>
            ))}
          </div>

          {/* Timeline Tracks */}
          <div className="space-y-4 relative z-10 max-h-[300px] overflow-y-auto scrollbar-hide pr-1 mt-4">
            {elements.map((el) => {
              const isSelected = selectedIds.includes(el.id);
              return (
                <div
                  key={el.id}
                  className="relative h-10 group/track flex items-center border-b border-white/5 last:border-0 pb-2"
                >
                  {/* Track Header */}
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 mr-4 flex-shrink-0">
                    {el.type === 'image' ? (
                      <img src={el.content} alt="" className="w-full h-full object-cover opacity-60" />
                    ) : (
                      <i className="fas fa-font text-slate-600 text-[10px]" aria-hidden="true"></i>
                    )}
                  </div>

                  {/* Track Content */}
                  <div className="flex-1 relative h-full">
                    <div
                      className={`absolute h-8 top-0 rounded-xl transition-all flex items-center justify-center px-4 border ${
                        isSelected
                          ? 'bg-accent/20 border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)] z-20'
                          : 'bg-white/5 border-white/5 opacity-30 hover:opacity-100 cursor-pointer hover:bg-white/10'
                      }`}
                      style={{
                        left: `${((el.animationDelay || 0) / maxTimelineSec) * 100}%`,
                        width: `${((el.animationDuration || 1) / maxTimelineSec) * 100}%`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectElement(el.id);
                      }}
                      onMouseDown={(e) => isSelected && onTimelineInteraction(e, el.id, 'move')}
                      role="button"
                      aria-label={`Animation track for ${el.type === 'text' ? el.content : 'Asset'}`}
                    >
                      <span
                        className={`text-[8px] font-black uppercase truncate pointer-events-none select-none ${
                          isSelected ? 'text-accent' : 'text-slate-500'
                        }`}
                      >
                        {el.type === 'text' ? el.content.substring(0, 12) : 'Asset Layer'}
                      </span>

                      {/* Duration Handle */}
                      {isSelected && (
                        <div
                          onMouseDown={(e) => onTimelineInteraction(e, el.id, 'stretch')}
                          className="absolute top-0 right-0 w-4 h-full cursor-ew-resize opacity-0 group-hover/track:opacity-100 flex items-center justify-center"
                          aria-label="Resize animation duration"
                        >
                          <div className="w-1.5 h-4 bg-accent rounded-full border border-slate-950"></div>
                        </div>
                      )}

                      {/* Timing Tooltip */}
                      {isSelected && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 bg-accent text-white text-[7px] font-black rounded opacity-0 group-hover/track:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                          {el.animationDelay}s -{' '}
                          {((el.animationDelay || 0) + (el.animationDuration || 1)).toFixed(1)}s
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Playhead */}
          {isPreviewMode && (
            <div className="absolute top-0 bottom-0 w-px bg-rose-500 z-30 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-lumina-playhead">
              <div className="w-3 h-3 bg-rose-500 rounded-full absolute -top-1.5 -left-[5px] border-2 border-slate-950"></div>
            </div>
          )}
        </div>
      </div>

      {/* Animation Controls */}
      {selectedIds.length > 0 ? (
        <div className="space-y-8 animate-in slide-in-from-right-4 pb-12">
          {/* Motion Synthesis Controls */}
          <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] space-y-6 shadow-inner relative overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                Motion Synthesis
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={onCopyAnimation}
                  title="Copy Animation Style"
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:scale-110 active:scale-90"
                  aria-label="Copy animation style"
                >
                  <i className="fas fa-copy text-[10px]" aria-hidden="true"></i>
                </button>
                <button
                  onClick={onPasteAnimation}
                  disabled={!animationClipboard}
                  title="Paste Animation Style"
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm disabled:opacity-20 hover:scale-110 active:scale-90"
                  aria-label="Paste animation style"
                >
                  <i className="fas fa-paste text-[10px]" aria-hidden="true"></i>
                </button>
              </div>
            </div>

            {/* Animation Type */}
            <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Behavior Primitive
              </label>
              <select
                value={selectedElement?.animation || 'none'}
                onChange={(e) =>
                  onUpdateSelectedElements({ animation: e.target.value as AnimationType })
                }
                className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none focus:ring-1 focus:ring-accent shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
                aria-label="Animation type"
              >
                <option value="none">Static Composition</option>
                <option value="fade">Opacity Fade</option>
                <option value="fade-out">Opacity Out</option>
                <option value="slide">Vector Shift</option>
                <option value="bounce">Kinetic Bounce</option>
                <option value="zoom">Temporal Scale</option>
              </select>
            </div>

            {/* Direction & Easing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Direction
                </label>
                <select
                  value={selectedElement?.animationDirection || 'up'}
                  disabled={
                    selectedElement?.animation === 'fade' ||
                    selectedElement?.animation === 'fade-out'
                  }
                  onChange={(e) =>
                    onUpdateSelectedElements({
                      animationDirection: e.target.value as AnimationDirection,
                    })
                  }
                  className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none focus:ring-1 focus:ring-accent disabled:opacity-30 shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
                  aria-label="Animation direction"
                >
                  <option value="up">Top (North)</option>
                  <option value="down">Bottom (South)</option>
                  <option value="left">Left (West)</option>
                  <option value="right">Right (East)</option>
                  <option value="in">Inward</option>
                  <option value="out">Outward</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Interpolation
                </label>
                <select
                  value={selectedElement?.animationEasing || 'ease-out'}
                  onChange={(e) =>
                    onUpdateSelectedElements({
                      animationEasing: e.target.value as AnimationEasing,
                    })
                  }
                  className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none focus:ring-1 focus:ring-accent shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
                  aria-label="Animation easing"
                >
                  <option value="linear">Linear (Constant)</option>
                  <option value="ease-out">Cinema Ease (Smooth)</option>
                  <option value="elastic">Physics Elastic (Organic)</option>
                  <option value="bounce-phys">Gravity Bounce (Physical)</option>
                </select>
              </div>
            </div>

            {/* Duration & Delay Sliders */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 mt-2 pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    Duration
                  </label>
                  <span className="text-[9px] font-bold text-accent">
                    {selectedElement?.animationDuration || 1}s
                  </span>
                </div>
                <input
                  type="range"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={selectedElement?.animationDuration || 1}
                  onChange={(e) =>
                    onUpdateSelectedElements({ animationDuration: parseFloat(e.target.value) })
                  }
                  className="w-full accent-accent h-1 bg-slate-200 rounded-full appearance-none cursor-pointer"
                  aria-label="Animation duration"
                />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    Delay
                  </label>
                  <span className="text-[9px] font-bold text-accent">
                    {selectedElement?.animationDelay || 0}s
                  </span>
                </div>
                <input
                  type="range"
                  step="0.1"
                  min="0"
                  max="5"
                  value={selectedElement?.animationDelay || 0}
                  onChange={(e) =>
                    onUpdateSelectedElements({ animationDelay: parseFloat(e.target.value) })
                  }
                  className="w-full accent-accent h-1 bg-slate-200 rounded-full appearance-none cursor-pointer"
                  aria-label="Animation delay"
                />
              </div>
            </div>
          </div>

          {/* Animation Presets */}
          <div className="space-y-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">
              High-Fidelity Presets
            </p>
            <div className="grid grid-cols-3 gap-2" role="listbox" aria-label="Animation presets">
              {ANIMATION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`p-4 rounded-2xl border text-[8px] font-black uppercase transition-all flex flex-col items-center gap-2 hover:translate-y-[-2px] hover:shadow-md ${
                    isPresetActive(preset)
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.05]'
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                  }`}
                  role="option"
                  aria-selected={isPresetActive(preset)}
                >
                  <i className={`fas ${preset.icon} text-lg mb-1`} aria-hidden="true"></i>
                  <span className="text-center leading-tight">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-24 px-8 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 opacity-60 flex flex-col items-center justify-center gap-6">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 shadow-inner">
            <i className="fas fa-wand-magic-sparkles text-2xl" aria-hidden="true"></i>
          </div>
          <p className="text-[11px] text-slate-500 font-black leading-relaxed px-4 uppercase tracking-widest">
            Select composition layers to activate motion synthesis controls.
          </p>
        </div>
      )}
    </div>
  );
};

export default AnimationPanel;
