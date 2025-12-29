import React, { useState } from 'react';

const STORAGE_KEY = 'lumina-tutorial-dismissed';

// Check if tutorial should be shown
export const shouldShowTutorial = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'true';
  } catch {
    return true;
  }
};

const TutorialOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const steps = [
    { title: 'The Multi-Modal Canvas', text: 'Mix text, images, and videos seamlessly in our unified editor.', icon: 'fa-layer-group' },
    { title: 'AI Storyboarding', text: 'Let Gemini break down your script into professional cinematic shots.', icon: 'fa-clapperboard' },
    { title: 'Brand Intelligence', text: 'Sync your brand voice across all generated assets automatically.', icon: 'fa-brain' },
    { title: 'Workspace Sync', text: 'Every version is automatically backed up to your Google Drive.', icon: 'fa-cloud-arrow-up' },
  ];

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // Ignore storage errors
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
           <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }}></div>
        </div>

        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-8 mx-auto text-indigo-600 text-3xl">
           <i className={`fas ${steps[step]?.icon}`}></i>
        </div>

        <h3 className="text-3xl font-black text-slate-900 mb-4 text-center tracking-tighter">{steps[step]?.title}</h3>
        <p className="text-slate-500 text-center leading-relaxed mb-8">{steps[step]?.text}</p>

        {/* Don't show again checkbox - only on last step */}
        {step === steps.length - 1 && (
          <label className="flex items-center justify-center gap-3 mb-6 cursor-pointer group">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-5 h-5 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">
              Don't show this again
            </span>
          </label>
        )}

        <div className="flex gap-4">
           {step > 0 && (
             <button onClick={() => setStep(s => s - 1)} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all">Back</button>
           )}
           <button
             onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : handleClose()}
             className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
           >
             {step < steps.length - 1 ? 'Next' : 'Launch Studio'}
           </button>
        </div>

        {/* Skip button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
          aria-label="Skip tutorial"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
};

export default TutorialOverlay;
