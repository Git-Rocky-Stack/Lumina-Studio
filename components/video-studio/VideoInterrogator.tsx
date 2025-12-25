import React from 'react';

interface AnalyticalPrompt {
  id: string;
  label: string;
  icon: string;
  query: string;
}

interface InterrogationEntry {
  q: string;
  a: string;
}

interface VideoInterrogatorProps {
  uploadedVideoUrl: string;
  uploadedVideoMime: string;
  interrogationHistory: InterrogationEntry[];
  interrogationQuery: string;
  isInterrogating: boolean;
  analyticalPrompts: AnalyticalPrompt[];
  onClose: () => void;
  onQueryChange: (query: string) => void;
  onInterrogate: (customQuery?: string) => void;
}

/**
 * Video interrogation overlay with AI analysis capabilities
 */
const VideoInterrogator: React.FC<VideoInterrogatorProps> = ({
  uploadedVideoUrl,
  uploadedVideoMime,
  interrogationHistory,
  interrogationQuery,
  isInterrogating,
  analyticalPrompts,
  onClose,
  onQueryChange,
  onInterrogate,
}) => {
  return (
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-50 animate-in fade-in duration-500 flex flex-col"
      role="dialog"
      aria-label="Visual Interrogator"
    >
      <div className="p-8 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white shadow-2xl">
            <i className="fas fa-brain text-xl" aria-hidden="true"></i>
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-white">
              Visual Interrogator
            </h3>
            <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">
              Active Clip: {uploadedVideoMime}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
          aria-label="Close interrogator"
        >
          <i className="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-12 space-y-8 scrollbar-hide">
          {interrogationHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/10">
                <i
                  className="fas fa-wand-magic-sparkles text-3xl text-white/20"
                  aria-hidden="true"
                ></i>
              </div>
              <h4 className="text-lg font-black text-white mb-2 uppercase tracking-widest">
                Initialize Dialogue
              </h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Ask Gemini anything about this scene to extract production metadata.
              </p>
            </div>
          ) : (
            interrogationHistory.map((chat, i) => (
              <div
                key={i}
                className="space-y-4 animate-in slide-in-from-bottom-4 duration-500"
              >
                <div className="flex justify-end">
                  <div className="bg-accent text-white px-6 py-4 rounded-[2rem] rounded-tr-none text-xs font-black shadow-xl uppercase tracking-tight">
                    {chat.q}
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-white/10 text-slate-200 p-8 rounded-[2.5rem] rounded-tl-none text-xs leading-relaxed font-medium italic shadow-2xl max-w-[80%] relative overflow-hidden group">
                    {!chat.a && (
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:200ms]"></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                          Extracting...
                        </span>
                      </div>
                    )}
                    {chat.a}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="w-80 border-l border-white/5 bg-black/40 p-8 flex flex-col gap-6 overflow-y-auto scrollbar-hide">
          <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 px-2">
            Guided Analysis
          </h4>
          <div className="space-y-3">
            {analyticalPrompts.map((p) => (
              <button
                key={p.id}
                onClick={() => onInterrogate(p.query)}
                className="w-full text-left p-5 rounded-[1.5rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent transition-all group flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-accent">
                  <i className={`fas ${p.icon} text-sm`} aria-hidden="true"></i>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white leading-tight">
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-8 bg-gradient-to-t from-black to-transparent">
        <div className="max-w-4xl mx-auto relative">
          <input
            type="text"
            value={interrogationQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onInterrogate()}
            placeholder="Ask Gemini about this scene..."
            className="w-full bg-slate-900 border border-white/10 rounded-full px-10 py-6 text-sm text-white focus:ring-2 focus:ring-accent outline-none shadow-2xl transition-all"
            aria-label="Interrogation query"
          />
          <button
            onClick={() => onInterrogate()}
            disabled={isInterrogating || !interrogationQuery}
            className="absolute right-3 top-3 bottom-3 px-8 bg-accent text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-30 flex items-center gap-2"
          >
            {isInterrogating ? (
              <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
            ) : (
              <i className="fas fa-paper-plane" aria-hidden="true"></i>
            )}
            INTERROGATE
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoInterrogator;
