import React, { useRef } from 'react';

export interface AudioTrack {
  id: string;
  name: string;
  genre: string;
  color: string;
  bpm: number;
  tags: string[];
  url: string;
}

interface AudioLibraryPanelProps {
  audioLibrary: AudioTrack[];
  selectedAudio: AudioTrack;
  audioSearchQuery: string;
  previewingAudioId: string | null;
  onSelectAudio: (track: AudioTrack) => void;
  onSearchChange: (query: string) => void;
  onSemanticSearch: () => void;
  onTogglePreview: (track: AudioTrack, e: React.MouseEvent) => void;
}

/**
 * Audio library panel with semantic search and track selection
 */
const AudioLibraryPanel: React.FC<AudioLibraryPanelProps> = ({
  audioLibrary,
  selectedAudio,
  audioSearchQuery,
  previewingAudioId,
  onSelectAudio,
  onSearchChange,
  onSemanticSearch,
  onTogglePreview,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
          Audio Scoring
        </h4>
        <div className="text-accent bg-accent/10 p-2 rounded-lg">
          <i className="fas fa-waveform-lines text-[10px]" aria-hidden="true"></i>
        </div>
      </div>
      <div className="relative group">
        <input
          type="text"
          value={audioSearchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSemanticSearch()}
          placeholder="Semantic Audio Search..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-[10px] outline-none focus:ring-1 focus:ring-accent transition-all"
          aria-label="Search audio tracks"
        />
        <i
          className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]"
          aria-hidden="true"
        ></i>
      </div>
      <div
        className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide"
        role="listbox"
        aria-label="Audio tracks"
      >
        {audioLibrary.map((track) => (
          <div
            key={track.id}
            onClick={() => onSelectAudio(track)}
            className={`group p-4 rounded-3xl border transition-all cursor-pointer flex items-center gap-4 ${
              selectedAudio.id === track.id
                ? 'bg-accent border-accent text-white shadow-xl'
                : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'
            }`}
            role="option"
            aria-selected={selectedAudio.id === track.id}
          >
            <button
              onClick={(e) => onTogglePreview(track, e)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                previewingAudioId === track.id
                  ? 'bg-white text-accent animate-pulse'
                  : 'bg-white/5'
              }`}
              aria-label={previewingAudioId === track.id ? 'Pause preview' : 'Play preview'}
            >
              <i
                className={`fas ${
                  previewingAudioId === track.id ? 'fa-pause' : 'fa-play'
                } text-[10px]`}
                aria-hidden="true"
              ></i>
            </button>
            <div className="flex-1 min-w-0">
              <p
                className={`text-[10px] font-black uppercase tracking-widest truncate ${
                  selectedAudio.id === track.id ? 'text-white' : 'text-slate-200'
                }`}
              >
                {track.name}
              </p>
              <p className="text-[8px] opacity-60 font-bold">
                {track.bpm} BPM &bull; {track.genre}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AudioLibraryPanel;
