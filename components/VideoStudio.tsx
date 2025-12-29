import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  startVideoGeneration,
  pollVideoOperation,
  fetchVideoData,
  generateStoryboardFromScript,
  extendVideo,
  generateText,
  semanticAudioSearch,
  analyzeVideoContent,
} from '../services/geminiService';
import { Shot, Storyboard, TransitionType, VideoAspectRatio } from '../types';
import { useToast } from '../design-system';
import aistudio from '../services/aistudio';
import {
  VideoStudioHeader,
  AudioLibraryPanel,
  AudioTrack,
  SourceIntelligencePanel,
  VideoInterrogator,
  ShotTimeline,
  ShotPropertiesPanel,
  TransitionLabPanel,
  ClipExtenderPanel,
  DirectorConcept,
} from './video-studio';

const AUDIO_LIBRARY: AudioTrack[] = [
  { id: '1', name: 'Cinematic Rise', genre: 'Epic', color: 'bg-rose-500', bpm: 120, tags: ['dramatic', 'orchestral', 'high energy'], url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: '2', name: 'Minimal Tech', genre: 'Corporate', color: 'bg-indigo-500', bpm: 124, tags: ['clean', 'modern', 'precise'], url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: '3', name: 'Sunset Lo-Fi', genre: 'Chill', color: 'bg-amber-500', bpm: 88, tags: ['nostalgic', 'calm', 'relaxing'], url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: '4', name: 'Urban Pulse', genre: 'High Energy', color: 'bg-emerald-500', bpm: 140, tags: ['fast', 'bold', 'electronic'], url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: '5', name: 'Noir Strings', genre: 'Suspense', color: 'bg-slate-700', bpm: 75, tags: ['dark', 'tense', 'mysterious'], url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { id: '6', name: 'Morning Dew', genre: 'Nature', color: 'bg-teal-500', bpm: 60, tags: ['peaceful', 'acoustic', 'bright'], url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  { id: '7', name: 'Hyper Glitch', genre: 'Cyberpunk', color: 'bg-violet-600', bpm: 155, tags: ['chaotic', 'synthetic', 'intense'], url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
  { id: '8', name: 'Vogue Dream', genre: 'Fashion', color: 'bg-pink-500', bpm: 115, tags: ['stylish', 'upbeat', 'glamour'], url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
];

const TRANSITION_PRESETS: { category: string; presets: { type: TransitionType; label: string; icon: string; desc: string }[] }[] = [
  {
    category: 'Smooth',
    presets: [
      { type: 'crossfade', label: 'Ethereal Flow', icon: 'fa-droplet', desc: 'Seamlessly blend frames with liquid interpolation.' },
      { type: 'dissolve', label: 'Vapor Dissolve', icon: 'fa-cloud', desc: 'Soft Gaussian haze transition between scenes.' },
      { type: 'zoom', label: 'Focus Shift', icon: 'fa-compress', desc: 'Slight scale shift to draw focus forward.' },
    ],
  },
  {
    category: 'Glitch',
    presets: [
      { type: 'glitch', label: 'RGB Inversion', icon: 'fa-bolt', desc: 'Chromatic aberration and channel splitting effect.' },
      { type: 'glitch', label: 'Data Mosh', icon: 'fa-dna', desc: 'Synthesize pixel corruption for high-energy cuts.' },
      { type: 'cut', label: 'Hard Byte', icon: 'fa-scissors', desc: 'Precision jump-cut with subtle frame stutter.' },
    ],
  },
  {
    category: 'Dramatic',
    presets: [
      { type: 'zoom', label: 'Cinema Slam', icon: 'fa-expand-arrows-alt', desc: 'Aggressive zoom blur for high-impact reveals.' },
      { type: 'slide', label: 'Direct Wipe', icon: 'fa-arrow-right', desc: 'Directional sweep with AI-generated motion vectors.' },
      { type: 'glitch', label: 'Light Leak', icon: 'fa-sun', desc: 'Intense optical overexposure during scene change.' },
    ],
  },
];

const CAMERA_OPTIONS = [
  'Static Eye-Level', 'Low-Angle Hero', 'High-Angle Birdseye', 'Slow Dolly In', 'Slow Dolly Out',
  'Pan Left-to-Right', 'Fast Whip Pan', 'Drone Orbit', 'Handheld Shaky', 'Extreme Close-Up',
];

const LIGHTING_OPTIONS = [
  'Natural Sunlight', 'Golden Hour Glow', 'Cinematic Low-Key', 'Cyberpunk Neon',
  'Studio Softbox', 'Volumetric Fog', 'Black & White High-Contrast', 'Sunset Silhouette',
];

const LENS_OPTIONS = [
  '14mm Ultra-Wide', '24mm Wide-Angle', '35mm Narrative Standard', '50mm Prime Portrait',
  '85mm Telephoto', '135mm Compression', 'Macro Detailed', 'Anamorphic Cinema',
];

const ANALYTICAL_PROMPTS = [
  { id: 'tone', label: 'Tone Detection', icon: 'fa-masks-theater', query: 'Analyze visual cues for emotional tone.' },
  { id: 'colors', label: 'Palette Analysis', icon: 'fa-palette', query: 'Identify dominant colors and suggest palette.' },
  { id: 'camera', label: 'Camera Suggestions', icon: 'fa-video', query: 'Suggest cinematic camera angles.' },
  { id: 'pacing', label: 'Pacing Audit', icon: 'fa-gauge-high', query: 'Analyze scene pacing and motion density.' },
  { id: 'objects', label: 'Element Extraction', icon: 'fa-tags', query: 'Extract key objects and characters.' },
  { id: 'lighting', label: 'Lighting Audit', icon: 'fa-lightbulb', query: 'Audit lighting and suggest improvements.' },
];

type SynthesisMode = 'smooth' | 'kinetic' | 'resolve' | 'shift';

const VideoStudio: React.FC = () => {
  const toast = useToast();
  const [concept, setConcept] = useState('');
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [history, setHistory] = useState<Storyboard[]>([]);
  const [future, setFuture] = useState<Storyboard[]>([]);
  const [activeShotIndex, setActiveShotIndex] = useState(0);
  const [isBuildingStoryboard, setIsBuildingStoryboard] = useState(false);
  const [isGeneratingShot, setIsGeneratingShot] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [selectedAudio, setSelectedAudio] = useState(AUDIO_LIBRARY[0]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isInterrogatingMode, setIsInterrogatingMode] = useState(false);
  const [interrogationQuery, setInterrogationQuery] = useState('');
  const [isInterrogating, setIsInterrogating] = useState(false);
  const [interrogationHistory, setInterrogationHistory] = useState<{ q: string; a: string }[]>([]);
  const [audioSearchQuery, setAudioSearchQuery] = useState('');
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  const [semanticResults, setSemanticResults] = useState<string[]>([]);
  const [previewingAudioId, setPreviewingAudioId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const [uploadedVideoBase64, setUploadedVideoBase64] = useState<string | null>(null);
  const [uploadedVideoMime, setUploadedVideoMime] = useState<string>('');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [showExtendControls, setShowExtendControls] = useState(false);
  const [extensionInstruction, setExtensionInstruction] = useState('');
  const [targetExtensionSeconds, setTargetExtensionSeconds] = useState<7 | 14>(7);
  const [synthesisMode, setSynthesisMode] = useState<SynthesisMode>('smooth');
  const [forecasts, setForecasts] = useState<string[]>([]);
  const [isForecasting, setIsForecasting] = useState(false);
  const [editingTransitionIndex, setEditingTransitionIndex] = useState<number | null>(null);

  const saveToHistory = useCallback(
    (newBoard: Storyboard | null) => {
      if (storyboard) setHistory((prev) => [...prev, storyboard]);
      setFuture([]);
      setStoryboard(newBoard);
    },
    [storyboard]
  );

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      if (storyboard) setFuture((f) => [storyboard, ...f]);
      setStoryboard(previous);
      return prev.slice(0, -1);
    });
  }, [storyboard]);

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev;
      const next = prev[0];
      if (storyboard) setHistory((h) => [...h, storyboard]);
      setStoryboard(next);
      return prev.slice(1);
    });
  }, [storyboard]);

  useEffect(() => {
    const handleUndo = () => undo();
    const handleRedo = () => redo();
    window.addEventListener('lumina-undo', handleUndo);
    window.addEventListener('lumina-redo', handleRedo);
    return () => {
      window.removeEventListener('lumina-undo', handleUndo);
      window.removeEventListener('lumina-redo', handleRedo);
    };
  }, [undo, redo]);

  useEffect(() => {
    const checkKey = async () => {
      const selected = await aistudio.hasSelectedApiKey();
      setHasKey(selected);
    };
    checkKey();

    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, []);

  const handleKeySelect = async () => {
    await aistudio.openSelectKey();
    setHasKey(true);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedVideoMime(file.type);
    if (uploadedVideoUrl) URL.revokeObjectURL(uploadedVideoUrl);
    setUploadedVideoUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setUploadedVideoBase64(base64);
      setInterrogationHistory([]);
    };
    reader.readAsDataURL(file);
  };

  const handleInterrogate = async (customQuery?: string) => {
    const query = customQuery || interrogationQuery;
    if (!uploadedVideoBase64 || !query) return;

    setIsInterrogating(true);
    const newEntry = { q: query, a: '' };
    setInterrogationHistory((prev) => [...prev, newEntry]);
    setInterrogationQuery('');

    try {
      const result = await analyzeVideoContent(uploadedVideoBase64, query, uploadedVideoMime);
      setInterrogationHistory((prev) => {
        const last = [...prev];
        last[last.length - 1].a = result || "I couldn't extract specific insights for this query.";
        return last;
      });
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes('Requested entity was not found.')) {
        setHasKey(false);
        handleKeySelect();
      }
      setInterrogationHistory((prev) => {
        const last = [...prev];
        last[last.length - 1].a = 'Analysis encountered an error. Please ensure the clip is valid.';
        return last;
      });
    } finally {
      setIsInterrogating(false);
    }
  };

  const handleToggleAudioPreview = (track: AudioTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewingAudioId === track.id) {
      audioPreviewRef.current?.pause();
      setPreviewingAudioId(null);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      const audio = new Audio(track.url);
      audio.onended = () => setPreviewingAudioId(null);
      audio.play().catch(console.error);
      audioPreviewRef.current = audio;
      setPreviewingAudioId(track.id);
    }
  };

  const handleSemanticSearch = async () => {
    if (!audioSearchQuery.trim()) {
      setSemanticResults([]);
      return;
    }
    setIsSemanticSearching(true);
    try {
      const results = await semanticAudioSearch(audioSearchQuery, AUDIO_LIBRARY);
      setSemanticResults(results);
    } catch (e) {
      console.error(e);
      setSemanticResults([]);
    } finally {
      setIsSemanticSearching(false);
    }
  };

  const filteredAudioLibrary = useMemo(() => {
    if (semanticResults.length > 0) {
      return [...AUDIO_LIBRARY].sort((a, b) => {
        const indexA = semanticResults.indexOf(a.id);
        const indexB = semanticResults.indexOf(b.id);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    const query = audioSearchQuery.toLowerCase();
    if (!query) return AUDIO_LIBRARY;
    return AUDIO_LIBRARY.filter((track) => {
      return (
        track.name.toLowerCase().includes(query) ||
        track.genre.toLowerCase().includes(query) ||
        track.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [audioSearchQuery, semanticResults]);

  const buildStoryboard = async () => {
    if (!concept) return;
    setIsBuildingStoryboard(true);
    try {
      const shotsData = await generateStoryboardFromScript(concept);
      const newShots: Shot[] = shotsData.map((s: any, i: number) => ({
        id: `shot-${Date.now()}-${i}`,
        prompt: s.prompt,
        camera: s.camera || CAMERA_OPTIONS[0],
        lighting: s.lighting || LIGHTING_OPTIONS[0],
        lensType: s.lensType || LENS_OPTIONS[2],
        motionDescription: s.motionDescription || '',
        cinematicDetail: s.cinematicDetail || '',
        motionScore: s.motionScore || 5,
        duration: 5,
        status: 'pending',
        transition: 'cut',
        transitionIntensity: 5,
        transitionDuration: 1.0,
      }));
      saveToHistory({
        id: `story-${Date.now()}`,
        title: 'New Cinematic Assembly',
        masterConcept: concept,
        shots: newShots,
        aspectRatio: aspectRatio,
        audioTrackId: selectedAudio.id,
      });
      setActiveShotIndex(0);
    } catch (error: any) {
      console.error(error);
      if (error?.message?.includes('Requested entity was not found.')) {
        setHasKey(false);
        handleKeySelect();
      } else {
        toast.error('Storyboard Failed', { description: 'Failed to build cinematic storyboard. Please try again.' });
      }
    } finally {
      setIsBuildingStoryboard(false);
    }
  };

  const handleForecastNarrative = async () => {
    if (!storyboard) return;
    const shot = storyboard.shots[activeShotIndex];
    if (!shot.prompt) return;

    setIsForecasting(true);
    try {
      const res = await generateText(
        `Forecast action for: "${shot.prompt}". Suggest 3 continuations for 7s. Cinematic. Separated by semi-colons.`,
        { fast: true }
      );
      if (res.text) {
        setForecasts(res.text.split(';').map((s) => s.trim().replace(/^\d+\.\s*/, '')));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsForecasting(false);
    }
  };

  const generateActiveShot = async () => {
    if (!storyboard || isGeneratingShot) return;
    const shot = storyboard.shots[activeShotIndex];
    setIsGeneratingShot(true);
    const updatedShots = [...storyboard.shots];
    updatedShots[activeShotIndex].status = 'generating';
    setStoryboard({ ...storyboard, shots: updatedShots });

    try {
      const enhancedPrompt = `${shot.prompt}. Camera: ${shot.camera}. Lens: ${shot.lensType}. Lighting: ${shot.lighting}. Motion: ${shot.motionDescription}. Detail: ${shot.cinematicDetail}. Energy: ${shot.motionScore}/10.`;

      let operation = await startVideoGeneration(enhancedPrompt, storyboard.aspectRatio);
      const pollInterval = setInterval(async () => {
        try {
          operation = await pollVideoOperation(operation);
          if (operation.done) {
            clearInterval(pollInterval);
            const videoData = operation.response?.generatedVideos?.[0]?.video;
            const uri = videoData?.uri;
            if (uri) {
              const blob = await fetchVideoData(uri);
              const videoUrl = URL.createObjectURL(blob);
              const finalShots = [...storyboard.shots];
              finalShots[activeShotIndex] = {
                ...finalShots[activeShotIndex],
                status: 'ready',
                videoUrl,
                rawVideoData: videoData,
              };
              saveToHistory({ ...storyboard, shots: finalShots });
              setIsGeneratingShot(false);
            }
          }
        } catch (e: any) {
          clearInterval(pollInterval);
          if (e?.message?.includes('Requested entity was not found.')) {
            setHasKey(false);
            handleKeySelect();
          }
          setIsGeneratingShot(false);
        }
      }, 8000);
    } catch (error: any) {
      if (error?.message?.includes('Requested entity was not found.')) {
        setHasKey(false);
        handleKeySelect();
      }
      setIsGeneratingShot(false);
    }
  };

  const updateShot = (index: number, updates: Partial<Shot>) => {
    if (!storyboard) return;
    const newShots = [...storyboard.shots];
    newShots[index] = { ...newShots[index], ...updates };
    saveToHistory({ ...storyboard, shots: newShots });
  };

  const handleExtendShot = async (overridePrompt?: string) => {
    if (!storyboard || !storyboard.shots[activeShotIndex].rawVideoData || isGeneratingShot) return;
    const shot = storyboard.shots[activeShotIndex];
    setIsGeneratingShot(true);

    const updatedShots = [...storyboard.shots];
    updatedShots[activeShotIndex].status = 'extending';
    setStoryboard({ ...storyboard, shots: updatedShots });

    try {
      const modePrompt =
        synthesisMode === 'smooth'
          ? 'maintaining rhythm'
          : synthesisMode === 'kinetic'
            ? 'increasing dynamics'
            : synthesisMode === 'resolve'
              ? 'bringing to elegant halt'
              : 'shifting perspective subtly';

      const prompt = `Extend action: ${shot.prompt}. Narrative: ${overridePrompt || extensionInstruction}. Mode: ${modePrompt}. Temporal consistency focus.`;

      let operation = await extendVideo(shot.rawVideoData, prompt, storyboard.aspectRatio);

      const pollInterval = setInterval(async () => {
        try {
          operation = await pollVideoOperation(operation);
          if (operation.done) {
            clearInterval(pollInterval);
            const videoData = operation.response?.generatedVideos?.[0]?.video;
            const uri = videoData?.uri;
            if (uri) {
              const blob = await fetchVideoData(uri);
              const videoUrl = URL.createObjectURL(blob);

              const finalShots = [...storyboard.shots];
              finalShots[activeShotIndex] = {
                ...finalShots[activeShotIndex],
                status: 'ready',
                videoUrl,
                duration: shot.duration + 7,
                rawVideoData: videoData,
              };
              saveToHistory({ ...storyboard, shots: finalShots });
              setIsGeneratingShot(false);
              setExtensionInstruction('');
              setForecasts([]);
            }
          }
        } catch (e: any) {
          clearInterval(pollInterval);
          if (e?.message?.includes('Requested entity was not found.')) {
            setHasKey(false);
            handleKeySelect();
          }
          setIsGeneratingShot(false);
        }
      }, 8000);
    } catch (error: any) {
      if (error?.message?.includes('Requested entity was not found.')) {
        setHasKey(false);
        handleKeySelect();
      }
      setIsGeneratingShot(false);
    }
  };

  const selectedShot = storyboard?.shots[activeShotIndex];
  const editingTransition = editingTransitionIndex !== null ? storyboard?.shots[editingTransitionIndex] : null;

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '16:9':
        return 'aspect-video w-full max-w-6xl rounded-[3rem]';
      case '9:16':
        return 'h-full aspect-[9/16] rounded-[4rem]';
      case '1:1':
        return 'aspect-square h-full max-h-[70vh] rounded-[3.5rem]';
      case '4:3':
        return 'aspect-[4/3] w-full max-w-5xl rounded-[3rem]';
      case '3:2':
        return 'aspect-[3/2] w-full max-w-5xl rounded-[3rem]';
      default:
        return 'aspect-video w-full max-w-6xl rounded-[3rem]';
    }
  };

  const handleAspectRatioChange = (ratio: VideoAspectRatio) => {
    setAspectRatio(ratio);
    if (storyboard) saveToHistory({ ...storyboard, aspectRatio: ratio });
  };

  const handleTitleChange = (title: string) => {
    if (storyboard) setStoryboard({ ...storyboard, title });
  };

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#050505] text-white">
        <div className="max-w-md bg-slate-900 border border-white/5 p-12 rounded-[4rem] shadow-3xl">
          <i className="fas fa-video text-5xl text-accent mb-8 shadow-accent/20" aria-hidden="true"></i>
          <h2 className="text-3xl font-black mb-4 tracking-tighter uppercase">Production Authenticator</h2>
          <p className="text-slate-400 mb-10 text-sm leading-relaxed">
            Linking your Paid API key is required to access the Gemini Veo 3.1 video synthesis engine.
          </p>
          <button
            onClick={handleKeySelect}
            className="w-full bg-accent text-white py-5 rounded-2xl font-black hover:brightness-110 transition-all shadow-2xl uppercase tracking-widest"
          >
            Activate Studio
          </button>
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noreferrer"
            className="block mt-6 text-[10px] text-slate-500 hover:text-accent transition-colors"
          >
            Billing Documentation
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#050505] text-slate-100 overflow-hidden select-none font-sans">
      <VideoStudioHeader
        title={storyboard?.title || 'Production Unnamed'}
        aspectRatio={aspectRatio}
        onTitleChange={handleTitleChange}
        onAspectRatioChange={handleAspectRatioChange}
        onShowExportModal={() => setShowExportModal(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Assets & Audio */}
        <div className="w-80 bg-[#0A0A0B] border-r border-white/5 flex flex-col z-10 overflow-y-auto scrollbar-hide">
          <div className="p-8 space-y-12">
            <SourceIntelligencePanel
              uploadedVideoUrl={uploadedVideoUrl}
              uploadedVideoMime={uploadedVideoMime}
              onVideoUpload={handleVideoUpload}
              onActivateInterrogator={() => setIsInterrogatingMode(true)}
            />

            <AudioLibraryPanel
              audioLibrary={filteredAudioLibrary}
              selectedAudio={selectedAudio}
              audioSearchQuery={audioSearchQuery}
              previewingAudioId={previewingAudioId}
              onSelectAudio={setSelectedAudio}
              onSearchChange={setAudioSearchQuery}
              onSemanticSearch={handleSemanticSearch}
              onTogglePreview={handleToggleAudioPreview}
            />
          </div>
        </div>

        {/* Center: Viewport */}
        <div className="flex-1 flex flex-col bg-black relative">
          {storyboard || uploadedVideoUrl ? (
            <div className="flex-1 flex flex-col relative">
              <div className="flex-1 flex items-center justify-center p-12 relative overflow-hidden">
                <div
                  className={`relative transition-all duration-700 shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 bg-[#0A0A0B] flex items-center justify-center overflow-hidden ${getAspectRatioClass()}`}
                >
                  <video
                    src={isInterrogatingMode ? uploadedVideoUrl! : storyboard?.shots[activeShotIndex]?.videoUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted={isInterrogatingMode}
                    key={isInterrogatingMode ? 'uploaded' : storyboard?.shots[activeShotIndex]?.id}
                  />

                  {isInterrogatingMode && uploadedVideoUrl && (
                    <VideoInterrogator
                      uploadedVideoUrl={uploadedVideoUrl}
                      uploadedVideoMime={uploadedVideoMime}
                      interrogationHistory={interrogationHistory}
                      interrogationQuery={interrogationQuery}
                      isInterrogating={isInterrogating}
                      analyticalPrompts={ANALYTICAL_PROMPTS}
                      onClose={() => setIsInterrogatingMode(false)}
                      onQueryChange={setInterrogationQuery}
                      onInterrogate={handleInterrogate}
                    />
                  )}

                  {!isInterrogatingMode && uploadedVideoUrl && (
                    <button
                      onClick={() => setIsInterrogatingMode(true)}
                      className="absolute bottom-8 right-8 bg-white text-black px-6 py-3 rounded-full text-[10px] font-black shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform z-40 uppercase tracking-widest border border-white/20"
                    >
                      <i className="fas fa-brain text-accent" aria-hidden="true"></i> Visual Intelligence Mode
                    </button>
                  )}
                </div>
              </div>

              {storyboard && (
                <ShotTimeline
                  shots={storyboard.shots}
                  activeShotIndex={activeShotIndex}
                  editingTransitionIndex={editingTransitionIndex}
                  transitionPresets={TRANSITION_PRESETS}
                  onSelectShot={(idx) => {
                    setActiveShotIndex(idx);
                    setEditingTransitionIndex(null);
                  }}
                  onEditTransition={(idx) => {
                    setEditingTransitionIndex(idx);
                    setActiveShotIndex(-1);
                  }}
                />
              )}
            </div>
          ) : (
            <DirectorConcept
              concept={concept}
              isBuildingStoryboard={isBuildingStoryboard}
              onConceptChange={setConcept}
              onBuildStoryboard={buildStoryboard}
            />
          )}
        </div>

        {/* Right Sidebar: Production Properties */}
        <div className="w-80 bg-[#0A0A0B] border-l border-white/5 flex flex-col z-10 overflow-y-auto scrollbar-hide">
          <div className="p-8 space-y-10">
            {selectedShot && !showExtendControls && (
              <ShotPropertiesPanel
                shot={selectedShot}
                isGenerating={isGeneratingShot}
                cameraOptions={CAMERA_OPTIONS}
                onUpdateShot={(updates) => updateShot(activeShotIndex, updates)}
                onGenerateShot={generateActiveShot}
                onShowExtendControls={() => setShowExtendControls(true)}
              />
            )}

            {editingTransition && editingTransitionIndex !== null && (
              <TransitionLabPanel
                editingTransition={editingTransition}
                editingTransitionIndex={editingTransitionIndex}
                transitionPresets={TRANSITION_PRESETS}
                onUpdateTransition={(updates) => updateShot(editingTransitionIndex, updates)}
                onClose={() => setEditingTransitionIndex(null)}
              />
            )}

            {selectedShot && showExtendControls && (
              <ClipExtenderPanel
                targetExtensionSeconds={targetExtensionSeconds}
                synthesisMode={synthesisMode}
                extensionInstruction={extensionInstruction}
                isGenerating={isGeneratingShot}
                isForecasting={isForecasting}
                onBack={() => setShowExtendControls(false)}
                onTargetSecondsChange={setTargetExtensionSeconds}
                onSynthesisModeChange={setSynthesisMode}
                onInstructionChange={setExtensionInstruction}
                onForecast={handleForecastNarrative}
                onExtend={() => handleExtendShot()}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoStudio;
