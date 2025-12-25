import React from 'react';

interface DirectorConceptProps {
  concept: string;
  isBuildingStoryboard: boolean;
  onConceptChange: (concept: string) => void;
  onBuildStoryboard: () => void;
}

/**
 * Director concept input for initial storyboard generation
 */
const DirectorConcept: React.FC<DirectorConceptProps> = ({
  concept,
  isBuildingStoryboard,
  onConceptChange,
  onBuildStoryboard,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
      <div className="max-w-3xl w-full space-y-12 animate-in fade-in zoom-in duration-1000">
        <div className="w-24 h-24 bg-accent/10 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border border-accent/20">
          <i className="fas fa-wand-sparkles text-4xl text-accent" aria-hidden="true"></i>
        </div>
        <h2 className="text-5xl font-black tracking-tighter text-white uppercase">
          The Director Engine
        </h2>
        <div className="relative group p-1 bg-white/5 rounded-[3.5rem] border border-white/10 focus-within:border-accent/40 transition-all shadow-3xl">
          <textarea
            value={concept}
            onChange={(e) => onConceptChange(e.target.value)}
            placeholder="Describe your cinematic concept..."
            className="w-full h-56 bg-transparent border-none rounded-[3rem] p-10 text-xl text-white focus:ring-0 outline-none resize-none"
            aria-label="Cinematic concept description"
          />
          <div className="absolute bottom-6 right-6">
            <button
              onClick={onBuildStoryboard}
              disabled={isBuildingStoryboard || !concept}
              className="bg-white text-black px-12 py-5 rounded-[2.5rem] font-black text-xs hover:scale-105 transition-all flex items-center gap-4 disabled:opacity-30 uppercase tracking-widest shadow-2xl"
            >
              {isBuildingStoryboard ? (
                <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
              ) : (
                <i className="fas fa-film" aria-hidden="true"></i>
              )}{' '}
              Generate Storyboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectorConcept;
