
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  startVideoGeneration,
  pollVideoOperation,
  fetchVideoData,
  generateStoryboardFromScript,
  extendVideo,
  analyzeMedia,
  generateText,
  semanticAudioSearch,
  analyzeVideoContent
} from '../services/geminiService';
import { Shot, Storyboard, TransitionType, VideoAspectRatio } from '../types';
import { useToast } from '../design-system';

const AUDIO_LIBRARY = [
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
    ]
  },
  {
    category: 'Glitch',
    presets: [
      { type: 'glitch', label: 'RGB Inversion', icon: 'fa-bolt', desc: 'Chromatic aberration and channel splitting effect.' },
      { type: 'glitch', label: 'Data Mosh', icon: 'fa-dna', desc: 'Synthesize pixel corruption for high-energy cuts.' },
      { type: 'cut', label: 'Hard Byte', icon: 'fa-scissors', desc: 'Precision jump-cut with subtle frame stutter.' },
    ]
  },
  {
    category: 'Dramatic',
    presets: [
      { type: 'zoom', label: 'Cinema Slam', icon: 'fa-expand-arrows-alt', desc: 'Aggressive zoom blur for high-impact reveals.' },
      { type: 'slide', label: 'Direct Wipe', icon: 'fa-arrow-right', desc: 'Directional sweep with AI-generated motion vectors.' },
      { type: 'glitch', label: 'Light Leak', icon: 'fa-sun', desc: 'Intense optical overexposure during scene change.' },
    ]
  }
];

const CAMERA_OPTIONS = [
  'Static Eye-Level', 'Low-Angle Hero', 'High-Angle Birdseye', 'Slow Dolly In', 'Slow Dolly Out',
  'Pan Left-to-Right', 'Fast Whip Pan', 'Drone Orbit', 'Handheld Shaky', 'Extreme Close-Up'
];

const LIGHTING_OPTIONS = [
  'Natural Sunlight', 'Golden Hour Glow', 'Cinematic Low-Key', 'Cyberpunk Neon', 
  'Studio Softbox', 'Volumetric Fog', 'Black & White High-Contrast', 'Sunset Silhouette'
];

const LENS_OPTIONS = [
  '14mm Ultra-Wide', '24mm Wide-Angle', '35mm Narrative Standard', '50mm Prime Portrait',
  '85mm Telephoto', '135mm Compression', 'Macro Detailed', 'Anamorphic Cinema'
];

const ANALYTICAL_PROMPTS = [
  { id: 'tone', label: 'Tone Detection', icon: 'fa-masks-theater', query: "Analyze visual cues for emotional tone." },
  { id: 'colors', label: 'Palette Analysis', icon: 'fa-palette', query: "Identify dominant colors and suggest palette." },
  { id: 'camera', label: 'Camera Suggestions', icon: 'fa-video', query: "Suggest cinematic camera angles." },
  { id: 'pacing', label: 'Pacing Audit', icon: 'fa-gauge-high', query: "Analyze scene pacing and motion density." },
  { id: 'objects', label: 'Element Extraction', icon: 'fa-tags', query: "Extract key objects and characters." },
  { id: 'lighting', label: 'Lighting Audit', icon: 'fa-lightbulb', query: "Audit lighting and suggest improvements." },
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
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTransitionIndex, setActiveTransitionIndex] = useState<number | null>(null);
  const [audioPrompt, setAudioPrompt] = useState('');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  const [uploadedVideoBase64, setUploadedVideoBase64] = useState<string | null>(null);
  const [uploadedVideoMime, setUploadedVideoMime] = useState<string>('');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  
  const [isInterrogatingMode, setIsInterrogatingMode] = useState(false);
  const [interrogationQuery, setInterrogationQuery] = useState('');
  const [isInterrogating, setIsInterrogating] = useState(false);
  const [interrogationHistory, setInterrogationHistory] = useState<{q: string, a: string}[]>([]);

  const [audioSearchQuery, setAudioSearchQuery] = useState('');
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  const [semanticResults, setSemanticResults] = useState<string[]>([]);
  const [previewingAudioId, setPreviewingAudioId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const [showExtendControls, setShowExtendControls] = useState(false);
  const [extensionInstruction, setExtensionInstruction] = useState('');
  const [targetExtensionSeconds, setTargetExtensionSeconds] = useState<7 | 14>(7);
  const [synthesisMode, setSynthesisMode] = useState<SynthesisMode>('smooth');
  const [forecasts, setForecasts] = useState<string[]>([]);
  const [isForecasting, setIsForecasting] = useState(false);

  // New state for transition editing
  const [editingTransitionIndex, setEditingTransitionIndex] = useState<number | null>(null);

  const saveToHistory = useCallback((newBoard: Storyboard | null) => {
    if (storyboard) setHistory(prev => [...prev, storyboard]);
    setFuture([]);
    setStoryboard(newBoard);
  }, [storyboard]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      if (storyboard) setFuture(f => [storyboard, ...f]);
      setStoryboard(previous);
      return prev.slice(0, -1);
    });
  }, [storyboard]);

  const redo = useCallback(() => {
    setFuture(prev => {
      if (prev.length === 0) return prev;
      const next = prev[0];
      if (storyboard) setHistory(h => [...h, storyboard]);
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
      // @ts-ignore
      const selected = await window.aistudio.hasSelectedApiKey();
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
    // @ts-ignore
    await window.aistudio.openSelectKey();
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
    setInterrogationHistory(prev => [...prev, newEntry]);
    setInterrogationQuery('');

    try {
      const result = await analyzeVideoContent(uploadedVideoBase64, query, uploadedVideoMime);
      setInterrogationHistory(prev => {
        const last = [...prev];
        last[last.length - 1].a = result || "I couldn't extract specific insights for this query.";
        return last;
      });
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("Requested entity was not found.")) {
        setHasKey(false);
        handleKeySelect();
      }
      setInterrogationHistory(prev => {
        const last = [...prev];
        last[last.length - 1].a = "Analysis encountered an error. Please ensure the clip is valid.";
        return last;
      });
    } finally {
      setIsInterrogating(false);
    }
  };

  const handleToggleAudioPreview = (track: typeof AUDIO_LIBRARY[0], e: React.MouseEvent) => {
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
    return AUDIO_LIBRARY.filter(track => {
      return (
        track.name.toLowerCase().includes(query) ||
        track.genre.toLowerCase().includes(query) ||
        track.tags.some(tag => tag.toLowerCase().includes(query))
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
        transitionDuration: 1.0
      }));
      saveToHistory({
        id: `story-${Date.now()}`,
        title: 'New Cinematic Assembly',
        masterConcept: concept,
        shots: newShots,
        aspectRatio: aspectRatio,
        audioTrackId: selectedAudio.id
      });
      setActiveShotIndex(0);
    } catch (error: any) {
      console.error(error);
      if (error?.message?.includes("Requested entity was not found.")) {
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
      const res = await generateText(`Forecast action for: "${shot.prompt}". Suggest 3 continuations for 7s. Cinematic. Separated by semi-colons.`, { fast: true });
      if (res.text) {
        setForecasts(res.text.split(';').map(s => s.trim().replace(/^\d+\.\s*/, '')));
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
                rawVideoData: videoData 
              };
              saveToHistory({ ...storyboard, shots: finalShots });
              setIsGeneratingShot(false);
            }
          }
        } catch (e: any) {
          clearInterval(pollInterval);
          if (e?.message?.includes("Requested entity was not found.")) {
            setHasKey(false);
            handleKeySelect();
          }
          setIsGeneratingShot(false);
        }
      }, 8000);
    } catch (error: any) {
      if (error?.message?.includes("Requested entity was not found.")) {
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
        synthesisMode === 'smooth' ? 'maintaining rhythm' :
        synthesisMode === 'kinetic' ? 'increasing dynamics' :
        synthesisMode === 'resolve' ? 'bringing to elegant halt' :
        'shifting perspective subtly';

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
              finalShots[activeShotIndex] = { ...finalShots[activeShotIndex], status: 'ready', videoUrl, duration: shot.duration + 7, rawVideoData: videoData };
              saveToHistory({ ...storyboard, shots: finalShots });
              setIsGeneratingShot(false);
              setExtensionInstruction('');
              setForecasts([]);
            }
          }
        } catch (e: any) {
          clearInterval(pollInterval);
          if (e?.message?.includes("Requested entity was not found.")) {
            setHasKey(false);
            handleKeySelect();
          }
          setIsGeneratingShot(false);
        }
      }, 8000);
    } catch (error: any) {
      if (error?.message?.includes("Requested entity was not found.")) {
        setHasKey(false);
        handleKeySelect();
      }
      setIsGeneratingShot(false);
    }
  };

  const selectedShot = storyboard?.shots[activeShotIndex];
  const editingTransition = editingTransitionIndex !== null ? storyboard?.shots[editingTransitionIndex] : null;

  // Aspect Ratio Preview Class Mapping
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '16:9': return 'aspect-video w-full max-w-6xl rounded-[3rem]';
      case '9:16': return 'h-full aspect-[9/16] rounded-[4rem]';
      case '1:1': return 'aspect-square h-full max-h-[70vh] rounded-[3.5rem]';
      case '4:3': return 'aspect-[4/3] w-full max-w-5xl rounded-[3rem]';
      case '3:2': return 'aspect-[3/2] w-full max-w-5xl rounded-[3rem]';
      default: return 'aspect-video w-full max-w-6xl rounded-[3rem]';
    }
  };

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#050505] text-white">
        <div className="max-w-md bg-slate-900 border border-white/5 p-12 rounded-[4rem] shadow-3xl">
          <i className="fas fa-video text-5xl text-accent mb-8 shadow-accent/20"></i>
          <h2 className="text-3xl font-black mb-4 tracking-tighter uppercase">Production Authenticator</h2>
          <p className="text-slate-400 mb-10 text-sm leading-relaxed">Linking your Paid API key is required to access the Gemini Veo 3.1 video synthesis engine.</p>
          <button onClick={handleKeySelect} className="w-full bg-accent text-white py-5 rounded-2xl font-black hover:brightness-110 transition-all shadow-2xl uppercase tracking-widest">Activate Studio</button>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="block mt-6 text-[10px] text-slate-500 hover:text-accent transition-colors">Billing Documentation</a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#050505] text-slate-100 overflow-hidden select-none font-sans">
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20"><i className="fas fa-film text-sm"></i></div>
             <div>
               <p className="text-[8px] font-black uppercase tracking-[0.4em] text-accent leading-none mb-1">Editing Bay Alpha</p>
               <input type="text" value={storyboard?.title || 'Production Unnamed'} className="bg-transparent border-none text-sm font-bold focus:ring-0 text-white p-0 h-4 w-64" onChange={(e) => setStoryboard(prev => prev ? {...prev, title: e.target.value} : null)}/>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            {(['16:9', '9:16', '1:1', '4:3', '3:2'] as VideoAspectRatio[]).map((ratio) => (
              <button 
                key={ratio}
                onClick={() => { setAspectRatio(ratio); if(storyboard) saveToHistory({...storyboard, aspectRatio: ratio}); }} 
                className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all ${aspectRatio === ratio ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                {ratio}
              </button>
            ))}
          </div>
          <button onClick={() => setShowExportModal(true)} className="px-10 py-3 bg-white text-black text-[9px] font-black rounded-2xl shadow-xl hover:brightness-90 transition-all uppercase tracking-widest">Deliver Render</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Assets & Audio */}
        <div className="w-80 bg-[#0A0A0B] border-r border-white/5 flex flex-col z-10 overflow-y-auto scrollbar-hide">
          <div className="p-8 space-y-12">
            <div>
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Source Intelligence</h4>
              <div className="space-y-4">
                <label className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-white/10 transition-all group">
                   <i className="fas fa-cloud-arrow-up mr-3 text-accent group-hover:scale-110 transition-transform"></i>
                   Ingest Source Clip
                   <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
                </label>
                {uploadedVideoUrl && (
                  <div className="p-1 bg-white/5 rounded-2xl border border-white/10 group cursor-pointer" onClick={() => setIsInterrogatingMode(true)}>
                     <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
                        <video src={uploadedVideoUrl} className="w-full h-full object-cover opacity-60" muted />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white shadow-xl animate-pulse">
                              <i className="fas fa-brain"></i>
                           </div>
                        </div>
                     </div>
                     <p className="text-[9px] font-black text-center py-2 text-accent uppercase tracking-widest">Activate Interrogator</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Audio Scoring</h4>
                <div className="text-accent bg-accent/10 p-2 rounded-lg"><i className="fas fa-waveform-lines text-[10px]"></i></div>
              </div>
              <div className="relative group">
                   <input type="text" value={audioSearchQuery} onChange={(e) => setAudioSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()} placeholder="Semantic Audio Search..." className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-[10px] outline-none focus:ring-1 focus:ring-accent transition-all" />
                   <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]"></i>
              </div>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
                {filteredAudioLibrary.map((track) => (
                    <div key={track.id} onClick={() => setSelectedAudio(track)} className={`group p-4 rounded-3xl border transition-all cursor-pointer flex items-center gap-4 ${selectedAudio.id === track.id ? 'bg-accent border-accent text-white shadow-xl' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'}`}>
                      <button onClick={(e) => handleToggleAudioPreview(track, e)} className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${previewingAudioId === track.id ? 'bg-white text-accent animate-pulse' : 'bg-white/5'}`}><i className={`fas ${previewingAudioId === track.id ? 'fa-pause' : 'fa-play'} text-[10px]`}></i></button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[10px] font-black uppercase tracking-widest truncate ${selectedAudio.id === track.id ? 'text-white' : 'text-slate-200'}`}>{track.name}</p>
                        <p className="text-[8px] opacity-60 font-bold">{track.bpm} BPM • {track.genre}</p>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Viewport */}
        <div className="flex-1 flex flex-col bg-black relative">
          {storyboard || uploadedVideoUrl ? (
            <div className="flex-1 flex flex-col relative">
              <div className="flex-1 flex items-center justify-center p-12 relative overflow-hidden">
                <div className={`relative transition-all duration-700 shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 bg-[#0A0A0B] flex items-center justify-center overflow-hidden ${getAspectRatioClass()}`}>
                  
                  <video 
                    src={isInterrogatingMode ? uploadedVideoUrl! : storyboard?.shots[activeShotIndex].videoUrl} 
                    className="w-full h-full object-cover" 
                    autoPlay loop muted={isInterrogatingMode} 
                    key={isInterrogatingMode ? 'uploaded' : storyboard?.shots[activeShotIndex].id}
                  />

                  {isInterrogatingMode && uploadedVideoUrl && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-50 animate-in fade-in duration-500 flex flex-col">
                       <div className="p-8 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white shadow-2xl">
                                <i className="fas fa-brain text-xl"></i>
                             </div>
                             <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter text-white">Visual Interrogator</h3>
                                <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Active Clip: {uploadedVideoMime}</p>
                             </div>
                          </div>
                          <button onClick={() => setIsInterrogatingMode(false)} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
                             <i className="fas fa-times"></i>
                          </button>
                       </div>
                       <div className="flex-1 flex overflow-hidden">
                          <div className="flex-1 overflow-y-auto p-12 space-y-8 scrollbar-hide">
                             {interrogationHistory.length === 0 ? (
                               <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                  <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/10">
                                     <i className="fas fa-wand-magic-sparkles text-3xl text-white/20"></i>
                                  </div>
                                  <h4 className="text-lg font-black text-white mb-2 uppercase tracking-widest">Initialize Dialogue</h4>
                                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">Ask Gemini anything about this scene to extract production metadata.</p>
                               </div>
                             ) : (
                               interrogationHistory.map((chat, i) => (
                                 <div key={i} className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
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
                                               <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Extracting...</span>
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
                             <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 px-2">Guided Analysis</h4>
                             <div className="space-y-3">
                               {ANALYTICAL_PROMPTS.map(p => (
                                 <button 
                                  key={p.id} 
                                  onClick={() => handleInterrogate(p.query)}
                                  className="w-full text-left p-5 rounded-[1.5rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent transition-all group flex items-center gap-4"
                                 >
                                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-accent"><i className={`fas ${p.icon} text-sm`}></i></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white leading-tight">{p.label}</span>
                                 </button>
                               ))}
                             </div>
                          </div>
                       </div>
                       <div className="p-8 bg-gradient-to-t from-black to-transparent">
                          <div className="max-w-4xl mx-auto relative">
                             <input type="text" value={interrogationQuery} onChange={(e) => setInterrogationQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleInterrogate()} placeholder="Ask Gemini about this scene..." className="w-full bg-slate-900 border border-white/10 rounded-full px-10 py-6 text-sm text-white focus:ring-2 focus:ring-accent outline-none shadow-2xl transition-all" />
                             <button onClick={() => handleInterrogate()} disabled={isInterrogating || !interrogationQuery} className="absolute right-3 top-3 bottom-3 px-8 bg-accent text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-30 flex items-center gap-2">
                                {isInterrogating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
                                INTERROGATE
                             </button>
                          </div>
                       </div>
                    </div>
                  )}

                  {!isInterrogatingMode && uploadedVideoUrl && (
                    <button onClick={() => setIsInterrogatingMode(true)} className="absolute bottom-8 right-8 bg-white text-black px-6 py-3 rounded-full text-[10px] font-black shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform z-40 uppercase tracking-widest border border-white/20">
                       <i className="fas fa-brain text-accent"></i> Visual Intelligence Mode
                    </button>
                  )}
                </div>
              </div>

              {/* TIMELINE */}
              <div className="h-64 border-t border-white/5 bg-[#050505] p-6 flex flex-col z-30">
                <div className="flex justify-between items-center mb-6 px-4">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Assembly</h4>
                   <span className="text-[9px] font-mono text-accent bg-accent/5 px-3 py-1 rounded-lg border border-accent/10">00:00:{String(activeShotIndex * 5).padStart(2, '0')} / CLIP PULSE</span>
                </div>
                <div className="flex-1 flex gap-4 items-center overflow-x-auto pb-4 scrollbar-hide">
                  {storyboard?.shots.map((shot, idx) => (
                    <React.Fragment key={shot.id}>
                      {/* Shot Node */}
                      <div onClick={() => { setActiveShotIndex(idx); setEditingTransitionIndex(null); }} className={`flex-shrink-0 relative h-32 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${activeShotIndex === idx ? 'border-accent ring-8 ring-accent/10' : 'border-white/5 hover:border-white/20'}`} style={{ width: '160px' }}>
                        {shot.videoUrl ? <video src={shot.videoUrl} className="w-full h-full object-cover opacity-50" /> : <div className="w-full h-full bg-[#0A0A0B] flex flex-col items-center justify-center"><span className="text-2xl font-black text-white/5">{idx + 1}</span></div>}
                        <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent">
                           <p className="text-[8px] font-black text-white/30 uppercase mb-1">SHOT {idx + 1}</p>
                           <p className="text-[9px] font-bold text-white truncate">{shot.prompt}</p>
                        </div>
                        {activeShotIndex === idx && <div className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full animate-pulse"></div>}
                      </div>
                      
                      {/* Transition Node (between shots) */}
                      {idx < storyboard.shots.length - 1 && (
                        <div 
                          onClick={() => { setEditingTransitionIndex(idx + 1); setActiveShotIndex(-1); }}
                          className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-all ${editingTransitionIndex === idx + 1 ? 'bg-accent border-accent text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10 hover:border-white/30'}`}
                          title="Edit AI Transition"
                        >
                          <i className={`fas ${TRANSITION_PRESETS.flatMap(c => c.presets).find(p => p.type === storyboard.shots[idx + 1].transition)?.icon || 'fa-bolt-lightning'} text-[10px]`}></i>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
              <div className="max-w-3xl w-full space-y-12 animate-in fade-in zoom-in duration-1000">
                <div className="w-24 h-24 bg-accent/10 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border border-accent/20"><i className="fas fa-wand-sparkles text-4xl text-accent"></i></div>
                <h2 className="text-5xl font-black tracking-tighter text-white uppercase">The Director Engine</h2>
                <div className="relative group p-1 bg-white/5 rounded-[3.5rem] border border-white/10 focus-within:border-accent/40 transition-all shadow-3xl">
                  <textarea value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Describe your cinematic concept..." className="w-full h-56 bg-transparent border-none rounded-[3rem] p-10 text-xl text-white focus:ring-0 outline-none resize-none" />
                  <div className="absolute bottom-6 right-6">
                    <button onClick={buildStoryboard} disabled={isBuildingStoryboard || !concept} className="bg-white text-black px-12 py-5 rounded-[2.5rem] font-black text-xs hover:scale-105 transition-all flex items-center gap-4 disabled:opacity-30 uppercase tracking-widest shadow-2xl">
                      {isBuildingStoryboard ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-film"></i>} Generate Storyboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Production Properties */}
        <div className="w-80 bg-[#0A0A0B] border-l border-white/5 flex flex-col z-10 overflow-y-auto scrollbar-hide">
          <div className="p-8 space-y-10">
            {selectedShot && !showExtendControls && (
              <div className="space-y-10 animate-in slide-in-from-right-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5 pb-6">Shot Parameters</h4>
                 <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Narrative Focus</p>
                    <textarea value={selectedShot.prompt} onChange={(e) => updateShot(activeShotIndex, { prompt: e.target.value })} className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:ring-1 focus:ring-accent resize-none" />
                 </div>
                 <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Camera Movement</p>
                    <select value={selectedShot.camera} onChange={(e) => updateShot(activeShotIndex, { camera: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-slate-200 appearance-none">
                      {CAMERA_OPTIONS.map(o => <option key={o} value={o} className="bg-slate-900">{o}</option>)}
                    </select>
                 </div>
                 <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cinematic Nuance</p>
                    <textarea value={selectedShot.cinematicDetail || ''} onChange={(e) => updateShot(activeShotIndex, { cinematicDetail: e.target.value })} placeholder="Lens flares..." className="w-full h-20 bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-slate-400 outline-none resize-none italic" />
                 </div>
                 
                 <div className="pt-6 border-t border-white/5 space-y-4">
                   <button onClick={generateActiveShot} disabled={isGeneratingShot} className="w-full py-5 bg-accent text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:brightness-110 transition-all">
                      {isGeneratingShot ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-bolt mr-2"></i>} Render Sequence
                   </button>
                   {selectedShot.videoUrl && (
                     <button onClick={() => setShowExtendControls(true)} className="w-full py-4 bg-white/5 text-slate-400 border border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                        <i className="fas fa-arrows-left-right-to-line"></i> Temporal Expansion
                     </button>
                   )}
                 </div>
              </div>
            )}

            {/* TRANSITION LAB PANEL */}
            {editingTransition && (
              <div className="space-y-10 animate-in slide-in-from-right-4">
                 <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Transition Synth</h4>
                    <button onClick={() => setEditingTransitionIndex(null)} className="text-slate-500 hover:text-white transition-colors"><i className="fas fa-times"></i></button>
                 </div>

                 <div className="space-y-8">
                    {TRANSITION_PRESETS.map((cat) => (
                      <div key={cat.category} className="space-y-4">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">{cat.category}</p>
                        <div className="grid grid-cols-1 gap-2">
                           {cat.presets.map((p) => (
                             <button 
                               key={p.label} 
                               onClick={() => updateShot(editingTransitionIndex!, { transition: p.type })}
                               className={`p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${editingTransition.transition === p.type ? 'bg-accent/10 border-accent shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'}`}
                             >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${editingTransition.transition === p.type ? 'bg-accent text-white' : 'bg-white/5'}`}>
                                   <i className={`fas ${p.icon} text-xs`}></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                   <p className={`text-[10px] font-black uppercase tracking-tight ${editingTransition.transition === p.type ? 'text-white' : 'text-slate-200'}`}>{p.label}</p>
                                   <p className="text-[8px] opacity-40 leading-tight line-clamp-1">{p.desc}</p>
                                </div>
                             </button>
                           ))}
                        </div>
                      </div>
                    ))}
                 </div>

                 <div className="p-6 bg-slate-900 border border-white/5 rounded-[2.5rem] space-y-8 shadow-2xl">
                    <div className="space-y-4">
                       <div className="flex justify-between items-center px-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Effect Intensity</label>
                          <span className="text-[10px] font-mono text-accent">{editingTransition.transitionIntensity || 5}/10</span>
                       </div>
                       <input 
                        type="range" min="1" max="10" step="1" 
                        value={editingTransition.transitionIntensity || 5}
                        onChange={(e) => updateShot(editingTransitionIndex!, { transitionIntensity: parseInt(e.target.value) })}
                        className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-accent"
                       />
                    </div>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center px-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Temporal Duration</label>
                          <span className="text-[10px] font-mono text-accent">{editingTransition.transitionDuration || 1.0}s</span>
                       </div>
                       <input 
                        type="range" min="0.1" max="3.0" step="0.1"
                        value={editingTransition.transitionDuration || 1.0}
                        onChange={(e) => updateShot(editingTransitionIndex!, { transitionDuration: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-accent"
                       />
                    </div>
                 </div>

                 <div className="p-6 bg-accent/5 border border-accent/20 rounded-2xl">
                    <p className="text-[9px] font-medium text-accent italic leading-relaxed">
                      "Gemini will analyze the last 5 frames of shot {editingTransitionIndex!} and the first 5 frames of shot {editingTransitionIndex! + 1} to synthesize a coherent {editingTransition.transition}."
                    </p>
                 </div>
              </div>
            )}

            {selectedShot && showExtendControls && (
              <div className="space-y-10 animate-in slide-in-from-right-8">
                 <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Clip Extender</h4>
                    <button onClick={() => setShowExtendControls(false)} className="text-slate-500 hover:text-white transition-colors"><i className="fas fa-arrow-left"></i></button>
                 </div>

                 <div className="space-y-6">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Duration</p>
                    <div className="grid grid-cols-2 gap-4">
                       <button onClick={() => setTargetExtensionSeconds(7)} className={`py-4 rounded-2xl text-[10px] font-black border transition-all ${targetExtensionSeconds === 7 ? 'bg-accent border-accent text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}>+7 SEC</button>
                       <button onClick={() => setTargetExtensionSeconds(14)} className={`py-4 rounded-2xl text-[10px] font-black border transition-all ${targetExtensionSeconds === 14 ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}>+14 SEC</button>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Logic</p>
                    <div className="grid grid-cols-2 gap-3">
                       {([
                         { id: 'smooth', icon: 'fa-wind', label: 'Seamless' },
                         { id: 'kinetic', icon: 'fa-bolt', label: 'Kinetic' },
                         { id: 'resolve', icon: 'fa-stop', label: 'Eased Out' },
                         { id: 'shift', icon: 'fa-shuffle', label: 'Shifted' }
                       ] as const).map(mode => (
                         <button key={mode.id} onClick={() => setSynthesisMode(mode.id)} className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${synthesisMode === mode.id ? 'bg-white/10 border-accent text-accent shadow-lg' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                            <i className={`fas ${mode.icon} text-sm`}></i>
                            <span className="text-[8px] font-black uppercase tracking-widest">{mode.label}</span>
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Instruction</p>
                       <button onClick={handleForecastNarrative} disabled={isForecasting} className="text-[8px] font-black text-accent uppercase hover:underline disabled:opacity-50">
                          {isForecasting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>} Forecast
                       </button>
                    </div>
                    <textarea value={extensionInstruction} onChange={(e) => setExtensionInstruction(e.target.value)} placeholder="What happens next..." className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-white outline-none focus:ring-1 focus:ring-accent resize-none" />
                 </div>

                 <button onClick={() => handleExtendShot()} disabled={isGeneratingShot} className="w-full py-5 bg-accent text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:brightness-110 transition-all flex items-center justify-center gap-2">
                    {isGeneratingShot ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-expand"></i>} Synthesize Expansion
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoStudio;
