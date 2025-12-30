// ============================================================================
// ANIMATION TIMELINE PANEL - UI COMPONENTS
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { animationManager } from '../../services/animationService';
import {
  formatTime,
  EASING_INFO,
  PROPERTY_INFO,
  DEFAULT_PRESETS
} from '../../types/animation';
import type {
  AnimationSequence,
  AnimationTrack,
  Keyframe,
  PlaybackState,
  EasingType,
  AnimatableProperty,
  AnimationPreset
} from '../../types/animation';
import type { DesignElement } from '../../types';

// ============================================================================
// DESIGN SYSTEM TOKENS
// ============================================================================

const colors = {
  background: {
    primary: '#0a0a0f',
    secondary: '#12121a',
    tertiary: '#1a1a24',
    elevated: '#1e1e2a',
    hover: '#252532'
  },
  border: {
    subtle: '#2a2a3a',
    default: '#3a3a4a',
    focus: '#6366f1'
  },
  text: {
    primary: '#ffffff',
    secondary: '#a0a0b0',
    tertiary: '#707080'
  },
  accent: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  track: {
    default: '#3b82f6',
    position: '#22c55e',
    scale: '#f59e0b',
    opacity: '#8b5cf6',
    rotation: '#ec4899',
    color: '#14b8a6'
  }
};

// ============================================================================
// MAIN TIMELINE PANEL
// ============================================================================

interface AnimationTimelinePanelProps {
  elements: DesignElement[];
  selectedElementIds: string[];
  onElementUpdate?: (elementId: string, updates: Partial<DesignElement>) => void;
}

export const AnimationTimelinePanel: React.FC<AnimationTimelinePanelProps> = ({
  elements,
  selectedElementIds,
  onElementUpdate
}) => {
  const [activeSequence, setActiveSequence] = useState<AnimationSequence | null>(null);
  const [sequences, setSequences] = useState<AnimationSequence[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(animationManager.getPlaybackState());
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);

  // Load sequences
  useEffect(() => {
    setSequences(animationManager.getAllSequences());
    setActiveSequence(animationManager.getActiveSequence());

    animationManager.setOnSequenceChange(seq => {
      setActiveSequence(seq);
      setSequences(animationManager.getAllSequences());
    });

    animationManager.setOnPlaybackUpdate(state => setPlaybackState(state));
    animationManager.setOnTimeUpdate(time => setCurrentTime(time));

    animationManager.setOnElementUpdate((elementId, values) => {
      onElementUpdate?.(elementId, values as Partial<DesignElement>);
    });

    return () => {
      animationManager.setOnSequenceChange(() => {});
      animationManager.setOnPlaybackUpdate(() => {});
      animationManager.setOnTimeUpdate(() => {});
      animationManager.setOnElementUpdate(() => {});
    };
  }, [onElementUpdate]);

  // Create new sequence
  const handleCreateSequence = useCallback(() => {
    const name = `Sequence ${sequences.length + 1}`;
    animationManager.createSequence(name);
  }, [sequences.length]);

  // Add track for selected element
  const handleAddTrack = useCallback((property: AnimatableProperty) => {
    if (!activeSequence || selectedElementIds.length === 0) return;

    selectedElementIds.forEach(elementId => {
      animationManager.addTrack(activeSequence.id, elementId, property);
    });

    setActiveSequence(animationManager.getActiveSequence());
  }, [activeSequence, selectedElementIds]);

  // Handle keyframe click on timeline
  const handleTimelineClick = useCallback((e: React.MouseEvent, trackId: string) => {
    if (!activeSequence || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / zoom) * 1000;

    const track = activeSequence.tracks.find(t => t.id === trackId);
    if (!track) return;

    const element = elements.find(el => el.id === track.elementId);
    if (!element) return;

    // Get current value from element
    let value: number | string = 0;
    switch (track.property) {
      case 'x': value = element.x; break;
      case 'y': value = element.y; break;
      case 'width': value = element.width; break;
      case 'height': value = element.height; break;
      case 'rotation': value = (element as any).rotation || 0; break;
      case 'opacity': value = (element as any).opacity ?? 1; break;
      case 'scale': value = (element as any).scale || 1; break;
      default: value = 0;
    }

    animationManager.addKeyframe(activeSequence.id, trackId, time, value);
    setActiveSequence(animationManager.getActiveSequence());
  }, [activeSequence, elements, zoom]);

  // Playback controls
  const togglePlay = useCallback(() => {
    if (playbackState.isPlaying) {
      animationManager.pause();
    } else {
      animationManager.play();
    }
  }, [playbackState.isPlaying]);

  const handleStop = useCallback(() => {
    animationManager.stop();
  }, []);

  // Seek on timeline header click
  const handleSeek = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / zoom) * 1000;

    animationManager.seek(time);
  }, [zoom]);

  // Apply preset
  const handleApplyPreset = useCallback((preset: AnimationPreset) => {
    if (!activeSequence || selectedElementIds.length === 0) return;

    selectedElementIds.forEach(elementId => {
      animationManager.applyPreset(activeSequence.id, elementId, preset.id, currentTime);
    });

    setActiveSequence(animationManager.getActiveSequence());
    setIsPresetsOpen(false);
  }, [activeSequence, selectedElementIds, currentTime]);

  return (
    <div
      className="h-64 flex flex-col border-t"
      style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.subtle }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: colors.border.subtle }}
      >
        <div className="flex items-center gap-3">
          {/* Sequence Selector */}
          <select
            value={activeSequence?.id || ''}
            onChange={e => animationManager.setActiveSequence(e.target.value || null)}
            className="px-3 py-1.5 text-sm rounded-lg outline-none"
            style={{
              backgroundColor: colors.background.tertiary,
              color: colors.text.primary,
              border: `1px solid ${colors.border.subtle}`
            }}
          >
            <option value="">No Sequence</option>
            {sequences.map(seq => (
              <option key={seq.id} value={seq.id}>{seq.name}</option>
            ))}
          </select>

          <button
            onClick={handleCreateSequence}
            className="p-1.5 rounded transition-colors hover:bg-white/10"
            title="New Sequence"
          >
            <i className="fa-solid fa-plus text-sm" style={{ color: colors.text.secondary }} />
          </button>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStop}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
            title="Stop"
          >
            <i className="fa-solid fa-stop text-sm" style={{ color: colors.text.secondary }} />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: colors.accent.primary }}
          >
            <i
              className={`fa-solid ${playbackState.isPlaying ? 'fa-pause' : 'fa-play'} text-white`}
              style={{ marginLeft: playbackState.isPlaying ? 0 : 2 }}
            />
          </button>

          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm font-mono" style={{ color: colors.text.primary }}>
              {formatTime(currentTime)}
            </span>
            <span className="text-sm" style={{ color: colors.text.tertiary }}>/</span>
            <span className="text-sm font-mono" style={{ color: colors.text.tertiary }}>
              {formatTime(activeSequence?.duration || 0)}
            </span>
          </div>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPresetsOpen(true)}
            className="px-3 py-1.5 text-sm rounded-lg transition-colors"
            style={{ backgroundColor: colors.background.tertiary, color: colors.text.secondary }}
          >
            <i className="fa-solid fa-wand-magic-sparkles mr-1.5" />
            Presets
          </button>

          {/* Zoom */}
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-magnifying-glass text-xs" style={{ color: colors.text.tertiary }} />
            <input
              type="range"
              min={50}
              max={200}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Labels */}
        <div
          className="w-48 flex-shrink-0 overflow-y-auto border-r"
          style={{ borderColor: colors.border.subtle }}
        >
          {activeSequence?.tracks.map(track => {
            const element = elements.find(el => el.id === track.elementId);
            return (
              <TrackLabel
                key={track.id}
                track={track}
                elementName={element?.name || 'Unknown'}
                onToggle={() => {
                  animationManager.toggleTrackEnabled(activeSequence.id, track.id);
                  setActiveSequence(animationManager.getActiveSequence());
                }}
                onDelete={() => {
                  animationManager.removeTrack(activeSequence.id, track.id);
                  setActiveSequence(animationManager.getActiveSequence());
                }}
              />
            );
          })}

          {/* Add Track Button */}
          {selectedElementIds.length > 0 && activeSequence && (
            <AddTrackDropdown onAdd={handleAddTrack} />
          )}
        </div>

        {/* Timeline Tracks */}
        <div className="flex-1 overflow-auto" ref={timelineRef}>
          {/* Time Ruler */}
          <TimeRuler
            duration={activeSequence?.duration || 3000}
            zoom={zoom}
            currentTime={currentTime}
            onSeek={handleSeek}
          />

          {/* Tracks */}
          <div className="relative">
            {activeSequence?.tracks.map(track => (
              <TrackTimeline
                key={track.id}
                track={track}
                duration={activeSequence.duration}
                zoom={zoom}
                selectedKeyframeId={selectedKeyframeId}
                onKeyframeSelect={setSelectedKeyframeId}
                onAddKeyframe={(time, value) => {
                  animationManager.addKeyframe(activeSequence.id, track.id, time, value);
                  setActiveSequence(animationManager.getActiveSequence());
                }}
                onClick={e => handleTimelineClick(e, track.id)}
              />
            ))}

            {/* Playhead */}
            <motion.div
              className="absolute top-0 bottom-0 w-0.5 z-10 pointer-events-none"
              style={{
                left: (currentTime / 1000) * zoom,
                backgroundColor: colors.accent.error
              }}
              animate={{ left: (currentTime / 1000) * zoom }}
            >
              <div
                className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full"
                style={{ backgroundColor: colors.accent.error }}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Presets Modal */}
      <AnimatePresence>
        {isPresetsOpen && (
          <PresetsModal
            presets={animationManager.getPresets()}
            onApply={handleApplyPreset}
            onClose={() => setIsPresetsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// TRACK LABEL
// ============================================================================

interface TrackLabelProps {
  track: AnimationTrack;
  elementName: string;
  onToggle: () => void;
  onDelete: () => void;
}

const TrackLabel: React.FC<TrackLabelProps> = ({
  track,
  elementName,
  onToggle,
  onDelete
}) => {
  const propertyColor = getPropertyColor(track.property);

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 border-b group"
      style={{
        borderColor: colors.border.subtle,
        opacity: track.enabled ? 1 : 0.5
      }}
    >
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: propertyColor }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate" style={{ color: colors.text.primary }}>
          {elementName}
        </div>
        <div className="text-xs" style={{ color: colors.text.tertiary }}>
          {PROPERTY_INFO[track.property].label}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-white/10"
          title={track.enabled ? 'Disable' : 'Enable'}
        >
          <i
            className={`fa-solid ${track.enabled ? 'fa-eye' : 'fa-eye-slash'} text-xs`}
            style={{ color: colors.text.tertiary }}
          />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-white/10"
          title="Delete"
        >
          <i className="fa-solid fa-trash text-xs" style={{ color: colors.accent.error }} />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// ADD TRACK DROPDOWN
// ============================================================================

interface AddTrackDropdownProps {
  onAdd: (property: AnimatableProperty) => void;
}

const AddTrackDropdown: React.FC<AddTrackDropdownProps> = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);

  const properties: AnimatableProperty[] = [
    'x', 'y', 'width', 'height', 'rotation', 'scale', 'opacity'
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors hover:bg-white/5"
        style={{ color: colors.text.secondary }}
      >
        <i className="fa-solid fa-plus text-xs" />
        Add Property
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 right-0 mt-1 py-1 rounded-lg shadow-xl z-20"
            style={{ backgroundColor: colors.background.elevated }}
          >
            {properties.map(prop => (
              <button
                key={prop}
                onClick={() => {
                  onAdd(prop);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 transition-colors hover:bg-white/10"
                style={{ color: colors.text.primary }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getPropertyColor(prop) }}
                />
                {PROPERTY_INFO[prop].label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// TIME RULER
// ============================================================================

interface TimeRulerProps {
  duration: number;
  zoom: number;
  currentTime: number;
  onSeek: (e: React.MouseEvent) => void;
}

const TimeRuler: React.FC<TimeRulerProps> = ({ duration, zoom, currentTime, onSeek }) => {
  const width = (duration / 1000) * zoom;
  const tickInterval = zoom >= 100 ? 500 : 1000;
  const ticks: number[] = [];

  for (let t = 0; t <= duration; t += tickInterval) {
    ticks.push(t);
  }

  return (
    <div
      className="h-6 border-b cursor-pointer relative"
      style={{
        width,
        backgroundColor: colors.background.tertiary,
        borderColor: colors.border.subtle
      }}
      onClick={onSeek}
    >
      {ticks.map(time => (
        <div
          key={time}
          className="absolute top-0 bottom-0 flex flex-col items-center"
          style={{ left: (time / 1000) * zoom }}
        >
          <div
            className="w-px h-2"
            style={{ backgroundColor: colors.border.default }}
          />
          <span className="text-xs" style={{ color: colors.text.tertiary }}>
            {(time / 1000).toFixed(1)}s
          </span>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// TRACK TIMELINE
// ============================================================================

interface TrackTimelineProps {
  track: AnimationTrack;
  duration: number;
  zoom: number;
  selectedKeyframeId: string | null;
  onKeyframeSelect: (id: string | null) => void;
  onAddKeyframe: (time: number, value: number | string) => void;
  onClick: (e: React.MouseEvent) => void;
}

const TrackTimeline: React.FC<TrackTimelineProps> = ({
  track,
  duration,
  zoom,
  selectedKeyframeId,
  onKeyframeSelect,
  onClick
}) => {
  const width = (duration / 1000) * zoom;
  const propertyColor = getPropertyColor(track.property);

  return (
    <div
      className="h-10 border-b relative cursor-crosshair"
      style={{
        width,
        borderColor: colors.border.subtle,
        opacity: track.enabled ? 1 : 0.5
      }}
      onClick={onClick}
    >
      {/* Connection lines */}
      {track.keyframes.length > 1 && (
        <svg className="absolute inset-0 pointer-events-none">
          {track.keyframes.map((kf, i) => {
            if (i === 0) return null;
            const prev = track.keyframes[i - 1];
            const x1 = (prev.time / 1000) * zoom;
            const x2 = (kf.time / 1000) * zoom;
            return (
              <line
                key={kf.id}
                x1={x1}
                y1={20}
                x2={x2}
                y2={20}
                stroke={propertyColor}
                strokeWidth={2}
                strokeOpacity={0.5}
              />
            );
          })}
        </svg>
      )}

      {/* Keyframes */}
      {track.keyframes.map(kf => (
        <motion.div
          key={kf.id}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer"
          style={{ left: (kf.time / 1000) * zoom }}
          whileHover={{ scale: 1.2 }}
          onClick={e => {
            e.stopPropagation();
            onKeyframeSelect(kf.id);
          }}
        >
          <div
            className="w-3 h-3 rounded-sm rotate-45"
            style={{
              backgroundColor: propertyColor,
              boxShadow: selectedKeyframeId === kf.id
                ? `0 0 0 2px ${colors.background.secondary}, 0 0 0 4px ${colors.accent.primary}`
                : 'none'
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

// ============================================================================
// PRESETS MODAL
// ============================================================================

interface PresetsModalProps {
  presets: AnimationPreset[];
  onApply: (preset: AnimationPreset) => void;
  onClose: () => void;
}

const PresetsModal: React.FC<PresetsModalProps> = ({ presets, onApply, onClose }) => {
  const [category, setCategory] = useState<'all' | 'entrance' | 'exit' | 'emphasis' | 'motion'>('all');

  const filteredPresets = category === 'all'
    ? presets
    : presets.filter(p => p.category === category);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-2xl max-h-[70vh] overflow-hidden rounded-xl"
        style={{ backgroundColor: colors.background.secondary }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: colors.border.subtle }}
        >
          {/* Typography: type-subsection - 20px/700 */}
          <h3 className="type-subsection" style={{ color: colors.text.primary }}>
            Animation Presets
          </h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-white/10">
            <i className="fa-solid fa-xmark" style={{ color: colors.text.secondary }} />
          </button>
        </div>

        <div className="p-4">
          {/* Category Filter */}
          <div className="flex gap-2 mb-4">
            {(['all', 'entrance', 'exit', 'emphasis', 'motion'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className="px-3 py-1.5 text-sm rounded-lg capitalize transition-colors"
                style={{
                  backgroundColor: category === cat ? colors.accent.primary : colors.background.tertiary,
                  color: category === cat ? '#fff' : colors.text.secondary
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto">
            {filteredPresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => onApply(preset)}
                className="p-4 rounded-lg text-left transition-colors hover:bg-white/5"
                style={{
                  backgroundColor: colors.background.tertiary,
                  border: `1px solid ${colors.border.subtle}`
                }}
              >
                <div className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  {preset.name}
                </div>
                <div className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
                  {preset.duration}ms
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPropertyColor(property: AnimatableProperty): string {
  switch (property) {
    case 'x':
    case 'y':
      return colors.track.position;
    case 'scale':
    case 'scaleX':
    case 'scaleY':
    case 'width':
    case 'height':
      return colors.track.scale;
    case 'opacity':
      return colors.track.opacity;
    case 'rotation':
      return colors.track.rotation;
    case 'fill':
    case 'stroke':
      return colors.track.color;
    default:
      return colors.track.default;
  }
}

export default AnimationTimelinePanel;
