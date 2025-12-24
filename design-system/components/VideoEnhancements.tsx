/**
 * Video Studio Enhancements
 * Waveform visualizer, Subtitle generator, Text overlays, B-roll suggestions, Export presets
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ============================================================================
// WAVEFORM VISUALIZER
// ============================================================================

interface WaveformVisualizerProps {
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
  className?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  audioUrl,
  audioBuffer,
  width = 600,
  height = 80,
  color = '#6366f1',
  backgroundColor = '#f1f5f9',
  currentTime = 0,
  duration = 0,
  onSeek,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!audioUrl && !audioBuffer) return;

    const loadAudio = async () => {
      setIsLoading(true);
      try {
        let buffer: AudioBuffer;

        if (audioBuffer) {
          buffer = audioBuffer;
        } else if (audioUrl) {
          const audioContext = new AudioContext();
          const response = await fetch(audioUrl);
          const arrayBuffer = await response.arrayBuffer();
          buffer = await audioContext.decodeAudioData(arrayBuffer);
        } else {
          return;
        }

        const channelData = buffer.getChannelData(0);
        const samples = 200;
        const blockSize = Math.floor(channelData.length / samples);
        const filteredData: number[] = [];

        for (let i = 0; i < samples; i++) {
          const start = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[start + j]);
          }
          filteredData.push(sum / blockSize);
        }

        const max = Math.max(...filteredData);
        const normalized = filteredData.map(n => n / max);
        setWaveformData(normalized);
      } catch (e) {
        console.error('Error loading audio:', e);
      }
      setIsLoading(false);
    };

    loadAudio();
  }, [audioUrl, audioBuffer]);

  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Waveform bars
    const barWidth = width / waveformData.length;
    const barGap = 1;
    const progressRatio = duration > 0 ? currentTime / duration : 0;

    waveformData.forEach((value, i) => {
      const barHeight = value * (height * 0.8);
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      const isPlayed = i / waveformData.length < progressRatio;
      ctx.fillStyle = isPlayed ? color : `${color}40`;
      ctx.fillRect(x + barGap / 2, y, barWidth - barGap, barHeight);
    });

    // Playhead
    if (duration > 0) {
      const playheadX = progressRatio * width;
      ctx.fillStyle = color;
      ctx.fillRect(playheadX - 1, 0, 2, height);
    }
  }, [waveformData, width, height, color, backgroundColor, currentTime, duration]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !canvasRef.current || duration === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / width;
    onSeek(ratio * duration);
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading ? (
        <div
          className="flex items-center justify-center"
          style={{ width, height, backgroundColor }}
        >
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-accent rounded-full animate-spin" />
            <span className="text-xs">Loading waveform...</span>
          </div>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onClick={handleClick}
          className="rounded-lg cursor-pointer"
        />
      )}
    </div>
  );
};

// ============================================================================
// SUBTITLE GENERATOR
// ============================================================================

interface Subtitle {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

interface SubtitleGeneratorProps {
  videoUrl?: string;
  subtitles: Subtitle[];
  onSubtitlesChange: (subtitles: Subtitle[]) => void;
  onGenerate?: () => Promise<void>;
  isGenerating?: boolean;
  className?: string;
}

export const SubtitleGenerator: React.FC<SubtitleGeneratorProps> = ({
  videoUrl,
  subtitles,
  onSubtitlesChange,
  onGenerate,
  isGenerating = false,
  className = '',
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newText, setNewText] = useState('');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleEdit = (subtitle: Subtitle) => {
    setEditingId(subtitle.id);
    setNewText(subtitle.text);
  };

  const handleSave = (id: string) => {
    onSubtitlesChange(
      subtitles.map(s => s.id === id ? { ...s, text: newText } : s)
    );
    setEditingId(null);
    setNewText('');
  };

  const handleDelete = (id: string) => {
    onSubtitlesChange(subtitles.filter(s => s.id !== id));
  };

  const handleAdd = () => {
    const lastSubtitle = subtitles[subtitles.length - 1];
    const startTime = lastSubtitle ? lastSubtitle.endTime : 0;
    const newSubtitle: Subtitle = {
      id: `sub-${Date.now()}`,
      startTime,
      endTime: startTime + 3,
      text: 'New subtitle',
    };
    onSubtitlesChange([...subtitles, newSubtitle]);
    handleEdit(newSubtitle);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700">Subtitles</h4>
        <div className="flex items-center gap-2">
          {onGenerate && (
            <button
              onClick={onGenerate}
              disabled={isGenerating || !videoUrl}
              className="px-3 py-1.5 bg-accent text-white rounded-lg text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5 hover:brightness-110 transition-all"
            >
              {isGenerating ? (
                <i className="fas fa-spinner fa-spin" />
              ) : (
                <i className="fas fa-wand-magic-sparkles" />
              )}
              Auto-Generate
            </button>
          )}
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-all"
          >
            <i className="fas fa-plus mr-1" />
            Add
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {subtitles.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <i className="fas fa-closed-captioning text-2xl mb-2 opacity-50" />
            <p className="text-xs">No subtitles yet</p>
          </div>
        ) : (
          subtitles.map((subtitle) => (
            <div
              key={subtitle.id}
              className="group p-3 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                    {formatTime(subtitle.startTime)}
                  </span>
                  <span className="text-[10px] text-slate-300 mx-1">→</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                    {formatTime(subtitle.endTime)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === subtitle.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-accent outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave(subtitle.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button
                        onClick={() => handleSave(subtitle.id)}
                        className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"
                      >
                        <i className="fas fa-check text-xs" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-50 rounded"
                      >
                        <i className="fas fa-times text-xs" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-700">{subtitle.text}</p>
                  )}
                  {subtitle.speaker && (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Speaker: {subtitle.speaker}
                    </span>
                  )}
                </div>
                {editingId !== subtitle.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(subtitle)}
                      className="p-1.5 text-slate-400 hover:bg-slate-50 rounded"
                    >
                      <i className="fas fa-pencil text-xs" />
                    </button>
                    <button
                      onClick={() => handleDelete(subtitle.id)}
                      className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded"
                    >
                      <i className="fas fa-trash text-xs" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// TEXT OVERLAY EDITOR
// ============================================================================

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  startTime: number;
  endTime: number;
  animation?: 'fade' | 'slide' | 'zoom' | 'typewriter' | 'none';
}

interface TextOverlayEditorProps {
  overlays: TextOverlay[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TextOverlay>) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  className?: string;
}

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Playfair Display', label: 'Playfair' },
  { value: 'Bebas Neue', label: 'Bebas Neue' },
  { value: 'Space Grotesk', label: 'Space Grotesk' },
];

const animationOptions = [
  { value: 'none', label: 'None', icon: 'fa-ban' },
  { value: 'fade', label: 'Fade', icon: 'fa-cloud' },
  { value: 'slide', label: 'Slide', icon: 'fa-arrow-right' },
  { value: 'zoom', label: 'Zoom', icon: 'fa-magnifying-glass-plus' },
  { value: 'typewriter', label: 'Typewriter', icon: 'fa-keyboard' },
];

export const TextOverlayEditor: React.FC<TextOverlayEditorProps> = ({
  overlays,
  selectedId,
  onSelect,
  onUpdate,
  onAdd,
  onDelete,
  className = '',
}) => {
  const selected = overlays.find(o => o.id === selectedId);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700">Text Overlays</h4>
        <button
          onClick={onAdd}
          className="px-3 py-1.5 bg-accent text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:brightness-110 transition-all"
        >
          <i className="fas fa-plus mr-1" />
          Add Text
        </button>
      </div>

      <div className="space-y-2">
        {overlays.map((overlay) => (
          <button
            key={overlay.id}
            onClick={() => onSelect(overlay.id)}
            className={`w-full p-3 rounded-xl border text-left transition-all ${
              selectedId === overlay.id
                ? 'border-accent bg-accent/5'
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 truncate flex-1">
                {overlay.text || 'Empty text'}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(overlay.id); }}
                className="p-1 text-slate-400 hover:text-rose-500 rounded"
              >
                <i className="fas fa-trash text-[10px]" />
              </button>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="space-y-4 p-4 bg-slate-50 rounded-xl animate-in slide-in-from-right-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Text</label>
            <textarea
              value={selected.text}
              onChange={(e) => onUpdate(selected.id, { text: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:ring-1 focus:ring-accent outline-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Font</label>
              <select
                value={selected.fontFamily}
                onChange={(e) => onUpdate(selected.id, { fontFamily: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                {fontOptions.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Size</label>
              <input
                type="number"
                value={selected.fontSize}
                onChange={(e) => onUpdate(selected.id, { fontSize: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Text Color</label>
              <input
                type="color"
                value={selected.color}
                onChange={(e) => onUpdate(selected.id, { color: e.target.value })}
                className="w-full h-8 rounded-lg border border-slate-200 cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Background</label>
              <input
                type="color"
                value={selected.backgroundColor || '#00000000'}
                onChange={(e) => onUpdate(selected.id, { backgroundColor: e.target.value })}
                className="w-full h-8 rounded-lg border border-slate-200 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Animation</label>
            <div className="grid grid-cols-5 gap-1">
              {animationOptions.map((anim) => (
                <button
                  key={anim.value}
                  onClick={() => onUpdate(selected.id, { animation: anim.value as any })}
                  className={`p-2 rounded-lg text-center transition-all ${
                    selected.animation === anim.value
                      ? 'bg-accent text-white'
                      : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <i className={`fas ${anim.icon} text-xs`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// B-ROLL SUGGESTIONS
// ============================================================================

interface BRollSuggestion {
  id: string;
  query: string;
  thumbnailUrl: string;
  duration: number;
  source: 'pexels' | 'unsplash' | 'pixabay';
  relevance: number;
}

interface BRollSuggestionsProps {
  script?: string;
  suggestions: BRollSuggestion[];
  onFetch?: (script: string) => Promise<void>;
  onSelect: (suggestion: BRollSuggestion) => void;
  isFetching?: boolean;
  className?: string;
}

export const BRollSuggestions: React.FC<BRollSuggestionsProps> = ({
  script,
  suggestions,
  onFetch,
  onSelect,
  isFetching = false,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleAnalyze = () => {
    if (onFetch && script) {
      onFetch(script);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700">B-Roll Suggestions</h4>
        <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[9px] font-bold rounded-full uppercase">
          AI Powered
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search stock footage..."
          className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-accent outline-none"
        />
        {onFetch && (
          <button
            onClick={handleAnalyze}
            disabled={isFetching || !script}
            className="px-3 py-2 bg-accent text-white rounded-lg text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 hover:brightness-110 transition-all"
          >
            {isFetching ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-wand-magic-sparkles" />}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
        {suggestions.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-slate-400">
            <i className="fas fa-film text-2xl mb-2 opacity-50" />
            <p className="text-xs">No suggestions yet</p>
            <p className="text-[10px] mt-1">AI will analyze your script for relevant footage</p>
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => onSelect(suggestion)}
              className="relative aspect-video rounded-xl overflow-hidden group hover:ring-2 hover:ring-accent transition-all"
            >
              <img
                src={suggestion.thumbnailUrl}
                alt={suggestion.query}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-[10px] font-bold text-white truncate">{suggestion.query}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] text-white/70">{suggestion.duration}s</span>
                    <span className="text-[8px] text-white/70 capitalize">{suggestion.source}</span>
                    <span className="text-[8px] text-emerald-400 ml-auto">{Math.round(suggestion.relevance * 100)}% match</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <i className="fas fa-plus text-accent text-xs" />
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// EXPORT PRESETS
// ============================================================================

interface ExportPreset {
  id: string;
  name: string;
  platform: string;
  icon: string;
  width: number;
  height: number;
  fps: number;
  bitrate: string;
  codec: string;
  format: string;
}

const defaultExportPresets: ExportPreset[] = [
  { id: 'youtube', name: 'YouTube', platform: 'youtube', icon: 'fa-youtube', width: 1920, height: 1080, fps: 30, bitrate: '16 Mbps', codec: 'H.264', format: 'MP4' },
  { id: 'youtube-4k', name: 'YouTube 4K', platform: 'youtube', icon: 'fa-youtube', width: 3840, height: 2160, fps: 30, bitrate: '45 Mbps', codec: 'H.265', format: 'MP4' },
  { id: 'instagram-feed', name: 'Instagram Feed', platform: 'instagram', icon: 'fa-instagram', width: 1080, height: 1080, fps: 30, bitrate: '5 Mbps', codec: 'H.264', format: 'MP4' },
  { id: 'instagram-story', name: 'Instagram Story', platform: 'instagram', icon: 'fa-instagram', width: 1080, height: 1920, fps: 30, bitrate: '6 Mbps', codec: 'H.264', format: 'MP4' },
  { id: 'tiktok', name: 'TikTok', platform: 'tiktok', icon: 'fa-tiktok', width: 1080, height: 1920, fps: 30, bitrate: '6 Mbps', codec: 'H.264', format: 'MP4' },
  { id: 'twitter', name: 'Twitter/X', platform: 'twitter', icon: 'fa-twitter', width: 1280, height: 720, fps: 30, bitrate: '5 Mbps', codec: 'H.264', format: 'MP4' },
  { id: 'linkedin', name: 'LinkedIn', platform: 'linkedin', icon: 'fa-linkedin', width: 1920, height: 1080, fps: 30, bitrate: '8 Mbps', codec: 'H.264', format: 'MP4' },
  { id: 'web', name: 'Web (WebM)', platform: 'web', icon: 'fa-globe', width: 1920, height: 1080, fps: 30, bitrate: '8 Mbps', codec: 'VP9', format: 'WebM' },
  { id: 'gif', name: 'GIF', platform: 'gif', icon: 'fa-image', width: 480, height: 270, fps: 15, bitrate: 'N/A', codec: 'GIF', format: 'GIF' },
];

interface ExportPresetsProps {
  onSelect: (preset: ExportPreset) => void;
  onCustomExport?: (settings: Partial<ExportPreset>) => void;
  className?: string;
}

export const ExportPresets: React.FC<ExportPresetsProps> = ({
  onSelect,
  onCustomExport,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [customSettings, setCustomSettings] = useState<Partial<ExportPreset>>({
    width: 1920,
    height: 1080,
    fps: 30,
    format: 'MP4',
  });

  const groupedPresets = defaultExportPresets.reduce((acc, preset) => {
    if (!acc[preset.platform]) acc[preset.platform] = [];
    acc[preset.platform].push(preset);
    return acc;
  }, {} as Record<string, ExportPreset[]>);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700">Export Settings</h4>
        <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              activeTab === 'presets' ? 'bg-white text-accent shadow-sm' : 'text-slate-500'
            }`}
          >
            Presets
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              activeTab === 'custom' ? 'bg-white text-accent shadow-sm' : 'text-slate-500'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {activeTab === 'presets' ? (
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {Object.entries(groupedPresets).map(([platform, presets]) => (
            <div key={platform}>
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 capitalize">
                {platform}
              </h5>
              <div className="space-y-1">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => onSelect(preset)}
                    className="w-full p-3 bg-white border border-slate-100 rounded-xl hover:border-accent hover:bg-accent/5 transition-all flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all">
                      <i className={`fab ${preset.icon} text-sm`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold text-slate-700">{preset.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {preset.width}x{preset.height} • {preset.fps}fps • {preset.format}
                      </p>
                    </div>
                    <i className="fas fa-chevron-right text-xs text-slate-300 group-hover:text-accent transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Width</label>
              <input
                type="number"
                value={customSettings.width}
                onChange={(e) => setCustomSettings({ ...customSettings, width: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Height</label>
              <input
                type="number"
                value={customSettings.height}
                onChange={(e) => setCustomSettings({ ...customSettings, height: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">FPS</label>
              <select
                value={customSettings.fps}
                onChange={(e) => setCustomSettings({ ...customSettings, fps: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value={24}>24 fps</option>
                <option value={30}>30 fps</option>
                <option value={60}>60 fps</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Format</label>
              <select
                value={customSettings.format}
                onChange={(e) => setCustomSettings({ ...customSettings, format: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="MP4">MP4 (H.264)</option>
                <option value="WebM">WebM (VP9)</option>
                <option value="MOV">MOV (ProRes)</option>
                <option value="GIF">GIF</option>
              </select>
            </div>
          </div>
          {onCustomExport && (
            <button
              onClick={() => onCustomExport(customSettings)}
              className="w-full py-3 bg-accent text-white rounded-xl font-bold text-sm hover:brightness-110 transition-all"
            >
              <i className="fas fa-download mr-2" />
              Export with Custom Settings
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default {
  WaveformVisualizer,
  SubtitleGenerator,
  TextOverlayEditor,
  BRollSuggestions,
  ExportPresets,
};
