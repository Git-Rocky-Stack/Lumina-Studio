import React from 'react';
import { Shot } from '../../types';

interface ShotPropertiesPanelProps {
  shot: Shot;
  isGenerating: boolean;
  cameraOptions: string[];
  onUpdateShot: (updates: Partial<Shot>) => void;
  onGenerateShot: () => void;
  onShowExtendControls: () => void;
}

/**
 * Shot properties panel for editing shot parameters
 */
const ShotPropertiesPanel: React.FC<ShotPropertiesPanelProps> = ({
  shot,
  isGenerating,
  cameraOptions,
  onUpdateShot,
  onGenerateShot,
  onShowExtendControls,
}) => {
  return (
    <div className="space-y-10 animate-in slide-in-from-right-4">
      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5 pb-6">
        Shot Parameters
      </h4>
      <div className="space-y-3">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
          Narrative Focus
        </p>
        <textarea
          value={shot.prompt}
          onChange={(e) => onUpdateShot({ prompt: e.target.value })}
          className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:ring-1 focus:ring-accent resize-none"
          aria-label="Shot narrative prompt"
        />
      </div>
      <div className="space-y-3">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
          Camera Movement
        </p>
        <select
          value={shot.camera}
          onChange={(e) => onUpdateShot({ camera: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-slate-200 appearance-none"
          aria-label="Camera movement style"
        >
          {cameraOptions.map((o) => (
            <option key={o} value={o} className="bg-slate-900">
              {o}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-3">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
          Cinematic Nuance
        </p>
        <textarea
          value={shot.cinematicDetail || ''}
          onChange={(e) => onUpdateShot({ cinematicDetail: e.target.value })}
          placeholder="Lens flares..."
          className="w-full h-20 bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-slate-400 outline-none resize-none italic"
          aria-label="Cinematic details"
        />
      </div>

      <div className="pt-6 border-t border-white/5 space-y-4">
        <button
          onClick={onGenerateShot}
          disabled={isGenerating}
          className="w-full py-5 bg-accent text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:brightness-110 transition-all"
        >
          {isGenerating ? (
            <i className="fas fa-spinner fa-spin mr-2" aria-hidden="true"></i>
          ) : (
            <i className="fas fa-bolt mr-2" aria-hidden="true"></i>
          )}{' '}
          Render Sequence
        </button>
        {shot.videoUrl && (
          <button
            onClick={onShowExtendControls}
            className="w-full py-4 bg-white/5 text-slate-400 border border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <i className="fas fa-arrows-left-right-to-line" aria-hidden="true"></i>{' '}
            Temporal Expansion
          </button>
        )}
      </div>
    </div>
  );
};

export default ShotPropertiesPanel;
