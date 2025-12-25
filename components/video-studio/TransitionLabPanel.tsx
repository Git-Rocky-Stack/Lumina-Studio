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

interface TransitionLabPanelProps {
  editingTransition: Shot;
  editingTransitionIndex: number;
  transitionPresets: TransitionCategory[];
  onUpdateTransition: (updates: Partial<Shot>) => void;
  onClose: () => void;
}

/**
 * Transition lab panel for editing AI transitions between shots
 */
const TransitionLabPanel: React.FC<TransitionLabPanelProps> = ({
  editingTransition,
  editingTransitionIndex,
  transitionPresets,
  onUpdateTransition,
  onClose,
}) => {
  return (
    <div className="space-y-10 animate-in slide-in-from-right-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">
          Transition Synth
        </h4>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors"
          aria-label="Close transition editor"
        >
          <i className="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>

      <div className="space-y-8">
        {transitionPresets.map((cat) => (
          <div key={cat.category} className="space-y-4">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
              {cat.category}
            </p>
            <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label={`${cat.category} transitions`}>
              {cat.presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => onUpdateTransition({ transition: p.type })}
                  className={`p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${
                    editingTransition.transition === p.type
                      ? 'bg-accent/10 border-accent shadow-lg'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                  role="radio"
                  aria-checked={editingTransition.transition === p.type}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      editingTransition.transition === p.type
                        ? 'bg-accent text-white'
                        : 'bg-white/5'
                    }`}
                  >
                    <i className={`fas ${p.icon} text-xs`} aria-hidden="true"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[10px] font-black uppercase tracking-tight ${
                        editingTransition.transition === p.type
                          ? 'text-white'
                          : 'text-slate-200'
                      }`}
                    >
                      {p.label}
                    </p>
                    <p className="text-[8px] opacity-40 leading-tight line-clamp-1">
                      {p.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-slate-900 border border-white/5 rounded-[2.5rem] space-y-8 shadow-2xl">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Effect Intensity
            </label>
            <span className="text-[10px] font-mono text-accent">
              {editingTransition.transitionIntensity || 5}/10
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={editingTransition.transitionIntensity || 5}
            onChange={(e) =>
              onUpdateTransition({ transitionIntensity: parseInt(e.target.value) })
            }
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-accent"
            aria-label="Transition intensity"
          />
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Temporal Duration
            </label>
            <span className="text-[10px] font-mono text-accent">
              {editingTransition.transitionDuration || 1.0}s
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={editingTransition.transitionDuration || 1.0}
            onChange={(e) =>
              onUpdateTransition({ transitionDuration: parseFloat(e.target.value) })
            }
            className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-accent"
            aria-label="Transition duration"
          />
        </div>
      </div>

      <div className="p-6 bg-accent/5 border border-accent/20 rounded-2xl">
        <p className="text-[9px] font-medium text-accent italic leading-relaxed">
          "Gemini will analyze the last 5 frames of shot {editingTransitionIndex} and
          the first 5 frames of shot {editingTransitionIndex + 1} to synthesize a
          coherent {editingTransition.transition}."
        </p>
      </div>
    </div>
  );
};

export default TransitionLabPanel;
