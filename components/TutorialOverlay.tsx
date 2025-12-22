
import React, { useState } from 'react';

const TutorialOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const steps = [
    { title: 'The Multi-Modal Canvas', text: 'Mix text, images, and videos seamlessly in our unified editor.', icon: 'fa-layer-group' },
    { title: 'AI Storyboarding', text: 'Let Gemini break down your script into professional cinematic shots.', icon: 'fa-clapperboard' },
    { title: 'Brand Intelligence', text: 'Sync your brand voice across all generated assets automatically.', icon: 'fa-brain' },
    { title: 'Workspace Sync', text: 'Every version is automatically backed up to your Google Drive.', icon: 'fa-cloud-arrow-up' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
           <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }}></div>
        </div>
        
        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-8 mx-auto text-indigo-600 text-3xl">
           <i className={`fas ${steps[step].icon}`}></i>
        </div>

        <h3 className="text-3xl font-black text-slate-900 mb-4 text-center tracking-tighter">{steps[step].title}</h3>
        <p className="text-slate-500 text-center leading-relaxed mb-10">{steps[step].text}</p>

        <div className="flex gap-4">
           {step > 0 && (
             <button onClick={() => setStep(s => s - 1)} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all">Back</button>
           )}
           <button 
             onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : onClose()} 
             className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
           >
             {step < steps.length - 1 ? 'Next' : 'Launch Studio'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;
