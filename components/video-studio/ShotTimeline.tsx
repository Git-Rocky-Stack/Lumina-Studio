import React from 'react';
import { Shot, TransitionType } from '../../types';

interface TransitionPreset {
  type: TransitionType;
  label: string;
  icon: string;
  desc: string;
}

interface TransitionCategory {
  category: string;
  presets: TransitionPreset[];
}

interface ShotTimelineProps {
  shots: Shot[];
  activeShotIndex: number;
  editingTransitionIndex: number | null;
  transitionPresets: TransitionCategory[];
  onSelectShot: (index: number) => void;
  onEditTransition: (index: number) => void;
}

/**
 * Timeline component for shot and transition management
 */
const ShotTimeline: React.FC<ShotTimelineProps> = ({
  shots,
  activeShotIndex,
  editingTransitionIndex,
  transitionPresets,
  onSelectShot,
  onEditTransition,
}) => {
  const getTransitionIcon = (transitionType: TransitionType) => {
    const preset = transitionPresets
      .flatMap((c) => c.presets)
      .find((p) => p.type === transitionType);
    return preset?.icon || 'fa-bolt-lightning';
  };

  return (
    <div
      className="h-64 border-t border-white/5 bg-[#050505] p-6 flex flex-col z-30"
      role="region"
      aria-label="Shot timeline"
    >
      <div className="flex justify-between items-center mb-6 px-4">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Master Assembly
        </h4>
        <span className="text-[9px] font-mono text-accent bg-accent/5 px-3 py-1 rounded-lg border border-accent/10">
          00:00:{String(activeShotIndex * 5).padStart(2, '0')} / CLIP PULSE
        </span>
      </div>
      <div
        className="flex-1 flex gap-4 items-center overflow-x-auto pb-4 scrollbar-hide"
        role="list"
        aria-label="Shot list"
      >
        {shots.map((shot, idx) => (
          <React.Fragment key={shot.id}>
            {/* Shot Node */}
            <div
              onClick={() => onSelectShot(idx)}
              className={`flex-shrink-0 relative h-32 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
                activeShotIndex === idx
                  ? 'border-accent ring-8 ring-accent/10'
                  : 'border-white/5 hover:border-white/20'
              }`}
              style={{ width: '160px' }}
              role="listitem"
              aria-selected={activeShotIndex === idx}
            >
              {shot.videoUrl ? (
                <video
                  src={shot.videoUrl}
                  className="w-full h-full object-cover opacity-50"
                />
              ) : (
                <div className="w-full h-full bg-[#0A0A0B] flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white/5">{idx + 1}</span>
                </div>
              )}
              <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-[8px] font-black text-white/30 uppercase mb-1">
                  SHOT {idx + 1}
                </p>
                <p className="text-[9px] font-bold text-white truncate">{shot.prompt}</p>
              </div>
              {activeShotIndex === idx && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              )}
            </div>

            {/* Transition Node (between shots) */}
            {idx < shots.length - 1 && (
              <div
                onClick={() => onEditTransition(idx + 1)}
                className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-all ${
                  editingTransitionIndex === idx + 1
                    ? 'bg-accent border-accent text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10 hover:border-white/30'
                }`}
                title="Edit AI Transition"
                role="button"
                aria-label={`Edit transition between shot ${idx + 1} and ${idx + 2}`}
              >
                <i
                  className={`fas ${getTransitionIcon(shots[idx + 1].transition)} text-[10px]`}
                  aria-hidden="true"
                ></i>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ShotTimeline;
