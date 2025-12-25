import React from 'react';
import { VideoAspectRatio } from '../../types';

interface VideoStudioHeaderProps {
  title: string;
  aspectRatio: VideoAspectRatio;
  onTitleChange: (title: string) => void;
  onAspectRatioChange: (ratio: VideoAspectRatio) => void;
  onShowExportModal: () => void;
}

const ASPECT_RATIOS: VideoAspectRatio[] = ['16:9', '9:16', '1:1', '4:3', '3:2'];

/**
 * Header component for VideoStudio with title, aspect ratio controls, and export
 */
const VideoStudioHeader: React.FC<VideoStudioHeaderProps> = ({
  title,
  aspectRatio,
  onTitleChange,
  onAspectRatioChange,
  onShowExportModal,
}) => {
  return (
    <div
      className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black z-40"
      role="banner"
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
            <i className="fas fa-film text-sm" aria-hidden="true"></i>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent leading-none mb-1">
              Editing Bay Alpha
            </p>
            <input
              type="text"
              value={title}
              className="bg-transparent border-none text-sm font-bold focus:ring-0 text-white p-0 h-4 w-64"
              onChange={(e) => onTitleChange(e.target.value)}
              aria-label="Project title"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div
          className="flex bg-white/5 p-1 rounded-2xl border border-white/10"
          role="radiogroup"
          aria-label="Aspect ratio selection"
        >
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio}
              onClick={() => onAspectRatioChange(ratio)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all ${
                aspectRatio === ratio
                  ? 'bg-white text-black shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
              role="radio"
              aria-checked={aspectRatio === ratio}
            >
              {ratio}
            </button>
          ))}
        </div>
        <button
          onClick={onShowExportModal}
          className="px-10 py-3 bg-white text-black text-[9px] font-black rounded-2xl shadow-xl hover:brightness-90 transition-all uppercase tracking-widest"
          aria-label="Export video"
        >
          Deliver Render
        </button>
      </div>
    </div>
  );
};

export default VideoStudioHeader;
