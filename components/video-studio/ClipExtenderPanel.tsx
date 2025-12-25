import React from 'react';

type SynthesisMode = 'smooth' | 'kinetic' | 'resolve' | 'shift';

interface ClipExtenderPanelProps {
  targetExtensionSeconds: 7 | 14;
  synthesisMode: SynthesisMode;
  extensionInstruction: string;
  isGenerating: boolean;
  isForecasting: boolean;
  onBack: () => void;
  onTargetSecondsChange: (seconds: 7 | 14) => void;
  onSynthesisModeChange: (mode: SynthesisMode) => void;
  onInstructionChange: (instruction: string) => void;
  onForecast: () => void;
  onExtend: () => void;
}

const SYNTHESIS_MODES: { id: SynthesisMode; icon: string; label: string }[] = [
  { id: 'smooth', icon: 'fa-wind', label: 'Seamless' },
  { id: 'kinetic', icon: 'fa-bolt', label: 'Kinetic' },
  { id: 'resolve', icon: 'fa-stop', label: 'Eased Out' },
  { id: 'shift', icon: 'fa-shuffle', label: 'Shifted' },
];

/**
 * Clip extender panel for temporal expansion of video shots
 */
const ClipExtenderPanel: React.FC<ClipExtenderPanelProps> = ({
  targetExtensionSeconds,
  synthesisMode,
  extensionInstruction,
  isGenerating,
  isForecasting,
  onBack,
  onTargetSecondsChange,
  onSynthesisModeChange,
  onInstructionChange,
  onForecast,
  onExtend,
}) => {
  return (
    <div className="space-y-10 animate-in slide-in-from-right-8">
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">
          Clip Extender
        </h4>
        <button
          onClick={onBack}
          className="text-slate-500 hover:text-white transition-colors"
          aria-label="Back to shot properties"
        >
          <i className="fas fa-arrow-left" aria-hidden="true"></i>
        </button>
      </div>

      <div className="space-y-6">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
          Duration
        </p>
        <div className="grid grid-cols-2 gap-4" role="radiogroup" aria-label="Extension duration">
          <button
            onClick={() => onTargetSecondsChange(7)}
            className={`py-4 rounded-2xl text-[10px] font-black border transition-all ${
              targetExtensionSeconds === 7
                ? 'bg-accent border-accent text-white shadow-lg'
                : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'
            }`}
            role="radio"
            aria-checked={targetExtensionSeconds === 7}
          >
            +7 SEC
          </button>
          <button
            onClick={() => onTargetSecondsChange(14)}
            className={`py-4 rounded-2xl text-[10px] font-black border transition-all ${
              targetExtensionSeconds === 14
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'
            }`}
            role="radio"
            aria-checked={targetExtensionSeconds === 14}
          >
            +14 SEC
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
          Logic
        </p>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Synthesis mode">
          {SYNTHESIS_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onSynthesisModeChange(mode.id)}
              className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                synthesisMode === mode.id
                  ? 'bg-white/10 border-accent text-accent shadow-lg'
                  : 'bg-white/5 border-white/10 text-slate-500'
              }`}
              role="radio"
              aria-checked={synthesisMode === mode.id}
            >
              <i className={`fas ${mode.icon} text-sm`} aria-hidden="true"></i>
              <span className="text-[8px] font-black uppercase tracking-widest">
                {mode.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            Instruction
          </p>
          <button
            onClick={onForecast}
            disabled={isForecasting}
            className="text-[8px] font-black text-accent uppercase hover:underline disabled:opacity-50"
          >
            {isForecasting ? (
              <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
            ) : (
              <i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i>
            )}{' '}
            Forecast
          </button>
        </div>
        <textarea
          value={extensionInstruction}
          onChange={(e) => onInstructionChange(e.target.value)}
          placeholder="What happens next..."
          className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:ring-1 focus:ring-accent resize-none"
          aria-label="Extension instruction"
        />
      </div>

      <button
        onClick={onExtend}
        disabled={isGenerating}
        className="w-full py-5 bg-accent text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
        ) : (
          <i className="fas fa-expand" aria-hidden="true"></i>
        )}{' '}
        Synthesize Expansion
      </button>
    </div>
  );
};

export default ClipExtenderPanel;
