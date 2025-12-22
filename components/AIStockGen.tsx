
import React, { useState, useEffect, useCallback, useRef } from 'react';
import LEDProgressBar from './LEDProgressBar';
import { 
  generateHighQualityImage, 
  generateBatchImages, 
  generateStyleSuggestions, 
  generateAnimatedLoop, 
  pollVideoOperation, 
  fetchVideoData 
} from '../services/geminiService';
import { simulateProfessionalExport, downloadFile, syncToGoogleDrive } from '../services/exportService';

const REASSURING_MESSAGES = [
  "Initializing neural motion paths...",
  "Synthesizing temporal consistency...",
  "Rendering cinematic frame interpolation...",
  "Perfecting seamless loop geometry...",
  "Gemini is calculating global illumination...",
  "Finalizing high-fidelity rasterization..."
];

const PRESET_STYLES = [
  { id: 'cinematic', label: 'Cinematic Lighting', prompt: 'cinematic lighting, dramatic shadows, high contrast, professional photography', icon: 'fa-clapperboard' },
  { id: 'vaporwave', label: 'Vaporwave', prompt: 'vaporwave aesthetic, neon pink and teal, 80s retro futurism, glitch art', icon: 'fa-bolt-lightning' },
  { id: 'surrealism', label: 'Surrealism', prompt: 'surrealism style, dreamlike imagery, illogical scenes, Salvador Dali influence', icon: 'fa-eye' },
  { id: 'artdeco', label: 'Art Deco', prompt: 'art deco style, geometric patterns, bold colors, 1920s vintage luxury', icon: 'fa-gem' },
  { id: 'lowpoly', label: 'Low Poly', prompt: 'low poly 3d art, angular geometry, stylized minimalist aesthetic', icon: 'fa-cubes' },
  { id: 'abstract', label: 'Abstract Expressionism', prompt: 'abstract expressionism, gestural brushstrokes, emotional intensity, non-representational', icon: 'fa-palette' },
  { id: 'neoclassical', label: 'Neo-Classical', prompt: 'neo-classical style, marble textures, refined symmetry, academic art influence, architectural elegance, soft natural light', icon: 'fa-landmark' },
  { id: 'cyberpunk', label: 'Cyberpunk Futurism', prompt: 'cyberpunk futurism, rainy neon cityscapes, high-tech hardware, glowing interfaces, hyper-modern aesthetic, high contrast', icon: 'fa-microchip' },
  { id: 'filmnoir', label: 'Vintage Film Noir', prompt: 'vintage film noir, dramatic chiaroscuro lighting, high-contrast monochrome, 1940s cinema aesthetic, smoky atmosphere, mysterious', icon: 'fa-film' },
  { id: 'fantasy', label: 'Whimsical Fantasy', prompt: 'whimsical fantasy art, enchanting fairytale landscapes, vibrant magic glows, soft focus, illustrative storybook style, ethereal colors', icon: 'fa-wand-sparkles' }
];

interface SynthesizedAsset {
  id: string;
  url?: string;
  prompt: string;
  ratio: string;
  status: 'pending' | 'ready' | 'error';
  isVideo?: boolean;
  energy?: number;
  progress?: number;
}

export default function AIStockGen() {
  const [prompt, setPrompt] = useState('');
  const [prodMode, setProdMode] = useState<'still' | 'loop'>('still');
  const [motionEnergy, setMotionEnergy] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "4:3" | "16:9" | "9:16">("16:9");
  const [batchCount, setBatchCount] = useState(1);
  const [styles, setStyles] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [history, setHistory] = useState<SynthesizedAsset[]>([]);
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStyleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let interval: any;
    if (generating && prodMode === 'loop') {
      interval = setInterval(() => {
        setPhaseIndex((prev) => (prev + 1) % REASSURING_MESSAGES.length);
      }, 3500);
    } else {
      setPhaseIndex(0);
    }
    return () => clearInterval(interval);
  }, [generating, prodMode]);

  useEffect(() => {
    if (prompt.length > 5) {
      const timer = setTimeout(async () => {
        const suggestions = await generateStyleSuggestions(prompt);
        setStyles(suggestions);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [prompt]);

  const getActiveStylePrompt = () => {
    if (selectedPresetId) {
      return PRESET_STYLES.find(s => s.id === selectedPresetId)?.prompt || '';
    }
    return selectedStyle || 'Professional high-end stock image style. Ultra-detailed.';
  };

  const handleGenerateStill = async () => {
    if (!prompt) return;
    setGenerating(true);
    try {
      const styleContext = getActiveStylePrompt();
      const styledPrompt = `${prompt}. Style: ${styleContext}. Professional stock photography.`;
      
      if (batchCount > 1) {
        const urls = await generateBatchImages(styledPrompt, batchCount, aspectRatio);
        const newAssets: SynthesizedAsset[] = urls.map((url, i) => ({
          id: `still-${Date.now()}-${i}`,
          url,
          prompt: styledPrompt,
          ratio: aspectRatio,
          status: 'ready'
        }));
        setHistory(prev => [...newAssets, ...prev]);
      } else {
        const url = await generateHighQualityImage(styledPrompt, aspectRatio);
        setHistory(prev => [{
          id: `still-${Date.now()}`, 
          url, 
          prompt: styledPrompt, 
          ratio: aspectRatio, 
          status: 'ready'
        }, ...prev]);
      }
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Still synthesis failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateGifBatch = async () => {
    if (!prompt) return;
    setGenerating(true);
    const styleContext = getActiveStylePrompt();
    const styledPrompt = `Cinematic loop: ${prompt}. Motion energy: ${motionEnergy}/10. Artistic direction: ${styleContext}`;
    const videoRatio = (aspectRatio === '9:16' ? '9:16' : '16:9') as "16:9" | "9:16";

    const batchIds = Array.from({ length: batchCount }).map((_, i) => `loop-${Date.now()}-${i}`);
    const placeholders: SynthesizedAsset[] = batchIds.map(id => ({
      id,
      prompt: prompt,
      ratio: videoRatio,
      status: 'pending',
      isVideo: true,
      energy: motionEnergy,
      progress: 0
    }));
    
    setHistory(prev => [...placeholders, ...prev]);

    try {
      const operations = await Promise.all(
        batchIds.map(() => generateAnimatedLoop(styledPrompt, videoRatio))
      );

      await Promise.all(operations.map(async (op, index) => {
        const targetId = batchIds[index];
        let currentOp = op;
        let isDone = false;

        while (!isDone) {
          await new Promise(resolve => setTimeout(resolve, 8000));
          const status = await pollVideoOperation(currentOp);
          
          if (status.done) {
            isDone = true;
            const uri = status.response?.generatedVideos?.[0]?.video?.uri;
            if (uri) {
              const blob = await fetchVideoData(uri);
              const url = URL.createObjectURL(blob);
              setHistory(prev => prev.map(item => 
                item.id === targetId ? { ...item, url, status: 'ready', progress: 100 } : item
              ));
            } else {
              setHistory(prev => prev.map(item => 
                item.id === targetId ? { ...item, status: 'error' } : item
              ));
            }
          } else {
            setHistory(prev => prev.map(item => 
              item.id === targetId ? { ...item, progress: Math.min(95, (item.progress || 0) + 15) } : item
            ));
          }
          currentOp = status;
        }
      }));
    } catch (e: any) {
      console.error("Batch Loop Generation Error:", e);
      batchIds.forEach(id => {
        setHistory(prev => prev.map(item => item.id === id && item.status === 'pending' ? { ...item, status: 'error' } : item));
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (item: SynthesizedAsset) => {
    if (!item.url) return;
    setExportingId(item.id);
    await simulateProfessionalExport({
      fileName: `Lumina_${item.isVideo ? 'Loop' : 'Stock'}_${item.id}`,
      format: item.isVideo ? 'mp4' : 'png',
      quality: 'ultra'
    });
    downloadFile(item.url, `Lumina_Asset_${item.id}.${item.isVideo ? 'mp4' : 'png'}`);
    setExportingId(null);
  };

  const selectedPreset = PRESET_STYLES.find(s => s.id === selectedPresetId);

  return (
    <div className="p-12 h-full overflow-y-auto bg-white scrollbar-hide">
      <header className="mb-12 max-w-6xl mx-auto animate-in fade-in duration-1000">
        <div className="flex items-center gap-3 mb-4">
           <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100 transition-colors cursor-default">Neural Production</div>
           <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-colors cursor-default">Veo 3.1 & Pro Image</div>
        </div>
        <h2 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Synthesis Lab</h2>
        <p className="text-slate-500 text-xl max-w-3xl leading-relaxed font-medium">
          Orchestrate high-fidelity stock photography and cinematic loops for professional creative workflows.
        </p>
      </header>

      <div className="max-w-6xl mx-auto space-y-12 pb-32">
        <div className="bg-slate-50 p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-12 relative overflow-hidden scroll-reveal">
          
          <div className="flex flex-col items-center gap-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Engine Selection</p>
            <div className="flex bg-white p-1.5 rounded-[2.5rem] border border-slate-200 shadow-inner w-full max-w-xl">
               <button 
                onClick={() => setProdMode('still')}
                className={`flex-1 flex items-center justify-center gap-4 px-10 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${prodMode === 'still' ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
               >
                 <i className={`fas fa-camera transition-transform ${prodMode === 'still' ? 'text-accent scale-110' : ''}`}></i>
                 Still Image
               </button>
               <button 
                onClick={() => { setProdMode('loop'); if(aspectRatio === '1:1' || aspectRatio === '4:3') setAspectRatio('16:9'); }}
                className={`flex-1 flex items-center justify-center gap-4 px-10 py-5 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${prodMode === 'loop' ? 'bg-accent text-white shadow-2xl' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
               >
                 <i className={`fas fa-film transition-transform ${prodMode === 'loop' ? 'text-white scale-110' : ''}`}></i>
                 Animated Loop
               </button>
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-6 scroll-reveal">
              <div className="flex justify-between items-end px-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Creative Command</label>
                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg transition-all duration-300 ${prodMode === 'loop' ? 'bg-accent/10 text-accent' : 'bg-slate-200 text-slate-500'}`}>
                  {prodMode === 'loop' ? 'Video Synthesis' : 'Hyper-Res Rendering'}
                </span>
              </div>
              <div className="flex gap-4 items-center group/command">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={prodMode === 'loop' ? "Describe a cinematic camera movement or physical action..." : "Describe a professional composition, lighting setup, or subject..."}
                  className="flex-1 bg-white border border-slate-100 shadow-inner focus:ring-4 focus:ring-accent/10 rounded-[2.5rem] px-10 py-8 text-2xl outline-none transition-all placeholder:text-slate-300 font-medium hover:bg-white focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
               {/* ARTISTIC STYLE ENGINE: REFINED DROPDOWN */}
               <div className="space-y-8 scroll-reveal" style={{ animationDelay: '0.1s' }} ref={dropdownRef}>
                  <div className="flex items-center justify-between px-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Style Synthesis</p>
                    {(selectedPresetId || selectedStyle) && (
                      <button onClick={() => { setSelectedPresetId(null); setSelectedStyle(null); }} className="text-[10px] font-black text-rose-500 uppercase hover:underline transition-all hover:scale-105 active:scale-95">Reset Style</button>
                    )}
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                      className={`w-full bg-white border-2 rounded-[2.5rem] px-10 py-6 flex items-center justify-between text-base font-bold shadow-xl transition-all duration-300 ${isStyleDropdownOpen ? 'border-accent shadow-accent/10 ring-4 ring-accent/5' : 'border-slate-100 hover:border-accent/40'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 ${selectedPresetId || selectedStyle ? 'bg-accent text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>
                           <i className={`fas ${selectedPreset ? selectedPreset.icon : 'fa-wand-magic-sparkles'}`}></i>
                        </div>
                        <div className="text-left">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Visual Direction</p>
                           <p className={`uppercase tracking-tight ${selectedPresetId || selectedStyle ? 'text-slate-900' : 'text-slate-300'}`}>
                              {selectedPreset ? selectedPreset.label : selectedStyle || 'Select Artistic DNA...'}
                           </p>
                        </div>
                      </div>
                      <i className={`fas fa-chevron-down text-slate-300 transition-transform duration-500 ${isStyleDropdownOpen ? 'rotate-180' : ''}`}></i>
                    </button>

                    {isStyleDropdownOpen && (
                      <div className="absolute top-[110%] left-0 right-0 bg-white border border-slate-100 rounded-[3rem] shadow-[0_30px_90px_rgba(0,0,0,0.15)] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="p-4 max-h-[450px] overflow-y-auto scrollbar-hide">
                          <div className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50 mb-2">Neural Presets</div>
                          <div className="grid grid-cols-1 gap-1">
                            {PRESET_STYLES.map((style) => (
                              <button 
                                key={style.id}
                                onClick={() => {
                                  setSelectedPresetId(style.id);
                                  setSelectedStyle(null);
                                  setIsStyleDropdownOpen(false);
                                }}
                                className={`w-full text-left p-5 rounded-[2rem] hover:bg-slate-50 flex items-center justify-between group transition-all duration-300 ${selectedPresetId === style.id ? 'bg-accent-soft/10 text-accent' : 'text-slate-600'}`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${selectedPresetId === style.id ? 'bg-accent text-white shadow-xl' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-accent group-hover:shadow-md'}`}>
                                    <i className={`fas ${style.icon} text-sm`}></i>
                                  </div>
                                  <div>
                                    <p className="text-xs font-black uppercase tracking-tight">{style.label}</p>
                                    <p className="text-[9px] text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-[200px]">{style.prompt.substring(0, 35)}...</p>
                                  </div>
                                </div>
                                {selectedPresetId === style.id && <i className="fas fa-check-circle text-accent animate-in zoom-in"></i>}
                              </button>
                            ))}
                          </div>
                          
                          {styles.length > 0 && (
                            <>
                              <div className="px-6 py-4 mt-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50 mb-2">AI Contextual Recommendations</div>
                              <div className="grid grid-cols-1 gap-1">
                                {styles.map((s) => (
                                  <button 
                                    key={s}
                                    onClick={() => {
                                      setSelectedStyle(s);
                                      setSelectedPresetId(null);
                                      setIsStyleDropdownOpen(false);
                                    }}
                                    className={`w-full text-left p-5 rounded-[2rem] hover:bg-slate-50 flex items-center justify-between transition-all duration-300 ${selectedStyle === s ? 'bg-accent-soft/10 text-accent' : 'text-slate-600'}`}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${selectedStyle === s ? 'bg-accent text-white shadow-xl' : 'bg-slate-100 text-slate-400'}`}>
                                        <i className="fas fa-sparkles text-sm"></i>
                                      </div>
                                      <span className="text-xs font-black uppercase tracking-tight">{s}</span>
                                    </div>
                                    {selectedStyle === s && <i className="fas fa-check-circle text-accent animate-in zoom-in"></i>}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Gemini 3 Pro Neural Style Engine Active</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={prodMode === 'still' ? handleGenerateStill : handleGenerateGifBatch}
                    disabled={generating || !prompt}
                    className={`w-full py-8 rounded-[2.5rem] font-black text-sm disabled:opacity-50 transition-all duration-500 flex items-center justify-center gap-4 shadow-3xl uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] ${prodMode === 'still' ? 'bg-slate-900 text-white hover:bg-black' : 'bg-accent text-white hover:brightness-110 shadow-accent/20'}`}
                  >
                    {generating ? (
                      <><i className="fas fa-spinner fa-spin"></i> INITIALIZING SYNTHESIS</>
                    ) : (
                      <><i className={`fas ${prodMode === 'still' ? 'fa-wand-magic' : 'fa-bolt'}`}></i> DEPLOY {batchCount > 1 ? `BATCH (${batchCount})` : 'MASTER'} SEQUENCE</>
                    )}
                  </button>
               </div>

               {/* PRODUCTION CONFIGURATION */}
               <div className="space-y-12 bg-white/50 p-10 rounded-[4rem] border border-white shadow-inner transition-all duration-500 hover:shadow-md scroll-reveal" style={{ animationDelay: '0.2s' }}>
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Production Configuration</p>
                  <div className="flex flex-wrap gap-8 items-start">
                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Aspect Ratio</p>
                      <div className="flex gap-2">
                        {(prodMode === 'still' ? ['1:1', '4:3', '16:9', '9:16'] : ['16:9', '9:16']).map(val => (
                          <button 
                            key={val}
                            onClick={() => setAspectRatio(val as any)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black border transition-all duration-300 hover:scale-110 active:scale-90 ${aspectRatio === val ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Batch Array</p>
                      <div className="flex gap-2">
                        {[1, 2, 4].map(n => (
                          <button 
                            key={n}
                            onClick={() => setBatchCount(n)}
                            className={`w-12 h-10 rounded-xl text-[10px] font-black border transition-all duration-300 hover:scale-110 active:scale-90 ${batchCount === n ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                          >
                            {n}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {prodMode === 'loop' && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center px-1">
                      <p className="text-[9px] font-black text-accent uppercase tracking-widest">Motion Profile Intensity</p>
                      <span className="text-[10px] font-black text-accent bg-accent/10 px-3 py-1 rounded-lg border border-accent/20 transition-all hover:scale-110">{motionEnergy}/10</span>
                    </div>
                    <div className="relative group px-1">
                      <input 
                        type="range" min="1" max="10" step="1" 
                        value={motionEnergy}
                        onChange={(e) => setMotionEnergy(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-accent transition-all hover:h-3"
                      />
                    </div>
                  </div>
                )}
             </div>
            </div>
          </div>
        </div>

        <div className="space-y-10">
           <div className="flex items-center justify-between border-b border-slate-100 pb-8 scroll-reveal">
              <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Repository Pipeline</h3>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 group cursor-default">
                    <div className="w-2 h-2 rounded-full bg-slate-200 transition-all group-hover:scale-150"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{history.filter(h => !h.isVideo).length} Stills</span>
                 </div>
                 <div className="flex items-center gap-2 group cursor-default">
                    <div className="w-2 h-2 rounded-full bg-accent transition-all group-hover:scale-150"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{history.filter(h => h.isVideo).length} Loops</span>
                 </div>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {history.map((item, i) => (
              <div key={item.id} className={`group relative bg-white rounded-[4rem] overflow-hidden shadow-sm border border-slate-100 transition-all duration-500 scroll-reveal ${item.status === 'ready' ? 'hover:shadow-3xl hover:-translate-y-2' : ''}`} style={{ animationDelay: `${(i % 4) * 0.1}s` }}>
                <div className={`w-full overflow-hidden bg-slate-900 flex items-center justify-center relative ${item.ratio === '16:9' ? 'aspect-video' : item.ratio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'}`}>
                  {item.status === 'pending' ? (
                    <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-12 text-center">
                       <div className="w-16 h-16 mb-6 relative">
                          <div className="absolute inset-0 border-2 border-white/5 rounded-full"></div>
                          <div className="absolute inset-0 border-t-2 border-accent rounded-full animate-spin"></div>
                       </div>
                       <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] mb-4">Synthesizing</p>
                       <LEDProgressBar progress={item.progress || 0} segments={15} className="w-48 mb-6" />
                       <p className="text-slate-500 text-[9px] font-medium italic animate-pulse">"{REASSURING_MESSAGES[phaseIndex]}"</p>
                    </div>
                  ) : item.status === 'error' ? (
                    <div className="absolute inset-0 bg-rose-950/20 flex flex-col items-center justify-center p-12 text-center">
                       <i className="fas fa-exclamation-triangle text-rose-500 text-3xl mb-4"></i>
                       <p className="text-rose-500 text-[10px] font-black uppercase">Synthesis Halted</p>
                    </div>
                  ) : item.status === 'ready' && item.isVideo ? (
                    <video src={item.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.url} alt={item.prompt} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" />
                  )}
                  
                  {item.status === 'ready' && (
                    <div className="absolute top-8 left-8 flex gap-2">
                      {item.isVideo ? (
                        <div className="px-4 py-2 bg-accent/90 backdrop-blur-md rounded-[1.5rem] text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-2xl flex items-center gap-2 border border-white/20 hover:scale-105 transition-transform cursor-default">
                          <i className="fas fa-play text-[8px]"></i> Cinematic Loop
                        </div>
                      ) : (
                        <div className="px-4 py-2 bg-slate-900/90 backdrop-blur-md rounded-[1.5rem] text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-2xl flex items-center gap-2 border border-white/10 hover:scale-105 transition-transform cursor-default">
                          <i className="fas fa-image text-[8px]"></i> Master Frame
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-10">
                  <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-relaxed mb-8 italic opacity-70">"{item.prompt}"</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleDownload(item)}
                      disabled={exportingId === item.id || item.status !== 'ready'}
                      className="flex-1 h-20 rounded-[2rem] bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-xl disabled:opacity-30"
                    >
                      {exportingId === item.id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-export transition-transform group-hover:translate-y-[-2px]"></i>}
                      {exportingId === item.id ? 'Processing...' : `Export ${item.isVideo ? 'MP4' : 'PNG'}`}
                    </button>
                    <button 
                      onClick={() => { if(item.url) syncToGoogleDrive(item, `Lumina_${item.id}`); }}
                      disabled={exportingId === item.id || item.status !== 'ready'}
                      className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all duration-300 hover:scale-110 active:scale-90 disabled:opacity-30 shadow-sm"
                    >
                      <i className="fab fa-google-drive transition-transform group-hover:rotate-12"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
