
import React, { useState, useMemo, useEffect, useRef } from 'react';
import LEDProgressBar from './LEDProgressBar';
import { 
  generateText, 
  suggestAssetMetadata, 
  generateHighQualityImage, 
  analyzeAssetDeep,
  bulkSuggestTags,
  suggestRelatedAssets 
} from '../services/geminiService';

interface AssetVersion {
  id: string;
  url: string;
  date: number;
  label: string;
  changeLog?: string;
  metadata?: any;
}

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'design' | 'audio' | 'model3d';
  project: string;
  date: number; // timestamp
  size: string;
  tags: string[];
  thumbnail?: string;
  color: string;
  description?: string;
  versions: AssetVersion[];
  priority: 'low' | 'medium' | 'high';
  resolution?: { width: number; height: number };
  duration?: number; // seconds
  dominantColors?: string[];
  telemetry?: any;
}

const INITIAL_ASSETS: Asset[] = [
  { 
    id: '1', name: 'Summer_Campaign_v2.mp4', type: 'video', project: 'Summer Launch 2025', 
    date: Date.now() - 1000 * 60 * 60 * 2, size: '42.5 MB', 
    tags: ['outdoor', 'bright', 'marketing'], color: 'text-purple-500',
    description: "Cinematic drone shots of the coastal product line.",
    priority: 'high',
    resolution: { width: 3840, height: 2160 },
    duration: 15,
    dominantColors: ['#0ea5e9', '#f8fafc', '#f59e0b'],
    versions: [
      { id: 'v1', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', date: Date.now() - 1000 * 60 * 60 * 5, label: 'Initial Cut', changeLog: 'Raw drone ingest', metadata: { codec: 'H.264', bitrate: '15Mbps' } },
      { id: 'v2', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80', date: Date.now() - 1000 * 60 * 60 * 2, label: 'Final Edit', changeLog: 'Color graded and stabilized', metadata: { codec: 'ProRes 422', bitrate: '120Mbps' } },
    ]
  },
  { 
    id: '2', name: 'Brand_Guide_2025.pdf', type: 'pdf', project: 'General Brand Assets', 
    date: Date.now() - 1000 * 60 * 60 * 24, size: '4.2 MB', 
    tags: ['branding', 'manual'], color: 'text-rose-500',
    description: "Complete visual identity guidelines for Lumina ecosystem.",
    priority: 'medium',
    dominantColors: ['#e11d48', '#ffffff'],
    versions: [{ id: 'v1', url: 'https://images.unsplash.com/photo-1586717791821-3f44a563dc4c?w=800&q=80', date: Date.now() - 1000 * 60 * 60 * 24, label: 'Master Copy', changeLog: 'Initial release', metadata: { pages: 42, format: 'PDF/X-4' } }]
  },
  { 
    id: '3', name: 'Nebula_City_Concept.png', type: 'image', project: 'Project Odyssey', 
    date: Date.now() - 1000 * 60 * 60 * 48, size: '12.8 MB', 
    tags: ['ai-gen', 'sci-fi', 'neon'], color: 'text-emerald-500',
    description: "AI-generated cityscape with bioluminescent architecture.",
    priority: 'high',
    resolution: { width: 4096, height: 2304 },
    dominantColors: ['#10b981', '#7c3aed', '#000000'],
    versions: [{ id: 'v1', url: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=800&q=80', date: Date.now() - 1000 * 60 * 60 * 48, label: 'Render 1.0', metadata: { model: 'Gemini 3 Pro', seed: 42 } }]
  },
  {
    id: '4', name: 'Lumina_Drone_V3.obj', type: 'model3d', project: 'Hardware R&D',
    date: Date.now() - 1000 * 60 * 60 * 12, size: '156 MB',
    tags: ['industrial', '3d-model', 'cad'], color: 'text-indigo-500',
    description: "3D mesh of the Lumina specialized cinematography drone.",
    priority: 'high',
    dominantColors: ['#334155', '#94a3b8'],
    thumbnail: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&q=80',
    telemetry: { vertices: '1.2M', triangles: '2.4M', materials: 12 },
    versions: [{ id: 'v1', url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&q=80', date: Date.now() - 1000 * 60 * 60 * 12, label: 'Final Mesh', metadata: { polygons: '2.4M', textures: '4K' } }]
  }
];

const AssetHub: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  const [semanticSearchType, setSemanticSearchType] = useState<'keyword' | 'lumina'>('keyword');

  const [filterType, setFilterType] = useState<string | 'all'>('all');
  const [filterProject, setFilterProject] = useState<string | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'duration'>('date');
  
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
  const [isAnalyzingDeep, setIsAnalyzingDeep] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState<any>(null);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  const [recommendations, setRecommendations] = useState<Asset[]>([]);
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);

  const [mediaLoading, setMediaLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<'mesh' | 'wireframe' | 'render'>('render');

  const [analysisProgress, setAnalysisProgress] = useState(0);

  const projects = useMemo(() => Array.from(new Set(assets.map(a => a.project))), [assets]);
  
  const selectedAsset = useMemo(() => 
    assets.find(a => a.id === selectedAssetId), 
    [assets, selectedAssetId]
  );

  const activeVersion = useMemo(() => {
    if (!selectedAsset) return null;
    return selectedAsset.versions.find(v => v.id === activeVersionId) || selectedAsset.versions[selectedAsset.versions.length - 1];
  }, [selectedAsset, activeVersionId]);

  const filteredAssets = useMemo(() => {
    let results = assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           asset.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = filterType === 'all' || asset.type === filterType;
      const matchesProject = filterProject === 'all' || asset.project === filterProject;
      return matchesSearch && matchesType && matchesProject;
    });

    return results.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return parseFloat(b.size) - parseFloat(a.size);
      return b.date - a.date;
    });
  }, [assets, searchQuery, filterType, filterProject, sortBy]);

  useEffect(() => {
    const fetchRecs = async () => {
      if (!selectedAsset && filterProject === 'all') {
        setRecommendations([]);
        return;
      }

      setIsGeneratingRecs(true);
      try {
        const sourceContext = selectedAsset 
          ? { id: selectedAsset.id, name: selectedAsset.name, tags: selectedAsset.tags, type: selectedAsset.type }
          : { project: filterProject, assetsCount: assets.filter(a => a.project === filterProject).length };

        const otherAssets = assets.filter(a => a.id !== selectedAssetId);
        
        const recIds = await suggestRelatedAssets(sourceContext, otherAssets);
        const recList = assets.filter(a => recIds.includes(a.id));
        setRecommendations(recList);
      } catch (e) {
        console.error("Recommendations failed", e);
      } finally {
        setIsGeneratingRecs(false);
      }
    };

    const debounceTimer = setTimeout(fetchRecs, 500);
    return () => clearTimeout(debounceTimer);
  }, [selectedAssetId, filterProject, assets]);

  const handleDeepAnalysis = async () => {
    if (!selectedAsset) return;
    setIsAnalyzingDeep(true);
    setAnalysisProgress(0);
    const interval = setInterval(() => setAnalysisProgress(p => p < 90 ? p + 2 : p), 100);
    
    try {
      const analysis = await analyzeAssetDeep(selectedAsset.name, selectedAsset.description || "", selectedAsset.tags);
      setDeepAnalysis(analysis);
      setAnalysisProgress(100);
    } catch (e) {
      console.error(e);
    } finally {
      clearInterval(interval);
      setTimeout(() => setIsAnalyzingDeep(false), 500);
    }
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery) return;
    setIsSemanticSearching(true);
    setSemanticSearchType('lumina');
    try {
      const res = await generateText(`User wants to find assets matching this concept: "${searchQuery}". 
      From this list, rank them by conceptual match. Return ONLY a JSON array of asset IDs.
      Assets: ${JSON.stringify(assets.map(a => ({id: a.id, name: a.name, tags: a.tags, desc: a.description})))}`, { fast: true });
      
      const cleanJson = res.text?.replace(/```json|```/g, '').trim();
      const rankedIds = JSON.parse(cleanJson || "[]");
      
      if (rankedIds.length > 0) {
        const reordered = [...assets].sort((a, b) => {
          const idxA = rankedIds.indexOf(a.id);
          const idxB = rankedIds.indexOf(b.id);
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
        setAssets(reordered);
      }
    } catch (e) {
      console.error("Semantic search failed", e);
    } finally {
      setIsSemanticSearching(false);
    }
  };

  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleSpeedCycle = () => {
    const speeds = [0.5, 1, 1.5, 2];
    const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = (val / 100) * duration;
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let timer: any;
    if (previewAsset?.type === 'model3d' && isPlaying) {
      timer = setInterval(() => setRotation(r => (r + 1) % 360), 30);
    }
    return () => clearInterval(timer);
  }, [previewAsset, isPlaying]);

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden font-sans">
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col p-8 gap-10 overflow-y-auto scrollbar-hide z-30 shadow-xl">
        <div className="space-y-6 scroll-reveal">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Workspaces</h4>
            <button className="text-accent hover:scale-125 transition-transform duration-300"><i className="fas fa-plus-circle text-sm"></i></button>
          </div>
          <div className="space-y-1">
             <button 
               onClick={() => setFilterProject('all')}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 hover:translate-x-1 ${filterProject === 'all' ? 'bg-accent text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               <i className="fas fa-border-all text-xs"></i>
               <span className="text-[11px] font-black uppercase tracking-tight">All Assets</span>
             </button>
             {projects.map((p, i) => (
               <button 
                key={p} 
                onClick={() => setFilterProject(p)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 hover:translate-x-1 scroll-reveal ${filterProject === p ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                style={{ animationDelay: `${i * 0.05}s` }}
               >
                 <i className="fas fa-folder-open text-xs"></i>
                 <span className="text-[11px] font-black uppercase tracking-tight truncate">{p}</span>
               </button>
             ))}
          </div>
        </div>

        <div className="space-y-6 scroll-reveal" style={{ animationDelay: '0.3s' }}>
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Production Status</h4>
           <div className="space-y-2">
              {[
                { label: 'Synced', icon: 'fa-cloud-check', color: 'text-emerald-500' },
                { label: 'In Review', icon: 'fa-clock', color: 'text-amber-500' },
                { label: 'Drafts', icon: 'fa-file-signature', color: 'text-indigo-500' },
                { label: 'Archive', icon: 'fa-box-archive', color: 'text-slate-400' },
              ].map((status, i) => (
                <button key={status.label} className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 rounded-xl transition-all duration-300 group hover:translate-x-1 scroll-reveal" style={{ animationDelay: `${0.4 + (i * 0.05)}s` }}>
                  <div className="flex items-center gap-3">
                    <i className={`fas ${status.icon} ${status.color} text-[10px] transition-transform duration-300 group-hover:scale-110`}></i>
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900">{status.label}</span>
                  </div>
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="px-10 py-10 bg-white border-b border-slate-200 flex flex-col gap-10 shadow-sm z-20 animate-in fade-in duration-700">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Your Assets</h2>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  Live Syncing with Project: <span className="text-indigo-600">{filterProject}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 scroll-reveal">
            <div className="flex-1 relative group">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSemanticSearchType('keyword'); }}
                placeholder={semanticSearchType === 'lumina' ? "Describe what you're looking for..." : "Search tags, names, or metadata..."} 
                className={`w-full pl-14 pr-40 py-5 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-sm font-medium outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all shadow-inner ${semanticSearchType === 'lumina' ? 'ring-2 ring-purple-500/20' : ''}`}
              />
              <i className={`fas ${semanticSearchType === 'lumina' ? 'fa-wand-magic-sparkles text-purple-500' : 'fa-search text-slate-300'} absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors`}></i>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-12 bg-slate-50/40 scrollbar-hide">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {filteredAssets.map((asset, i) => (
                <div 
                  key={asset.id} 
                  onClick={() => { setSelectedAssetId(asset.id); setActiveVersionId(null); setDeepAnalysis(null); }}
                  className={`group bg-white rounded-[3.5rem] border-2 transition-all duration-500 overflow-hidden relative cursor-pointer hover:scale-[1.03] active:scale-[0.98] scroll-reveal ${selectedAssetId === asset.id ? 'border-accent ring-[15px] ring-accent/5' : 'border-white shadow-sm hover:shadow-2xl hover:border-slate-100'}`}
                  style={{ animationDelay: `${(i % 12) * 0.05}s` }}
                >
                  <div className="aspect-video w-full flex items-center justify-center bg-slate-900 relative overflow-hidden">
                      {asset.thumbnail ? (
                        <img src={asset.thumbnail} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={asset.name} />
                      ) : (
                        <i className={`fas ${asset.type === 'video' ? 'fa-file-video' : asset.type === 'pdf' ? 'fa-file-pdf' : asset.type === 'model3d' ? 'fa-cube' : 'fa-file-image'} text-5xl text-white/10 group-hover:scale-125 transition-transform duration-1000`}></i>
                      )}
                      
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPreviewAsset(asset); setMediaLoading(true); }}
                          className="w-16 h-16 bg-white rounded-full text-slate-900 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-transform"
                        >
                          <i className="fas fa-expand-alt text-xl"></i>
                        </button>
                      </div>
                  </div>

                  <div className="p-10">
                    <h3 className="font-black text-slate-900 text-sm truncate pr-4 uppercase tracking-tight mb-4">{asset.name}</h3>
                    <div className="flex gap-2 mb-6">
                      <span className="px-2 py-1 bg-slate-900 text-white text-[8px] font-black rounded uppercase tracking-tighter">{asset.type}</span>
                      <span className="px-2 py-1 bg-slate-100 text-slate-400 text-[8px] font-black rounded uppercase tracking-tighter">{asset.size}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`w-[500px] bg-white border-l border-slate-200 transition-all duration-500 flex flex-col z-40 ${selectedAssetId ? 'mr-0' : '-mr-[500px]'}`}>
            {selectedAsset && (
              <div className="flex-1 flex flex-col overflow-hidden">
                 <div className="p-12 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm animate-in slide-in-from-right-4 duration-500">
                    <h3 className="font-black text-slate-900 uppercase tracking-tighter text-2xl">Asset Intelligence</h3>
                    <button onClick={() => setSelectedAssetId(null)} className="text-slate-300 hover:text-slate-900 hover:rotate-90 transition-all text-2xl"><i className="fas fa-times text-2xl"></i></button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
                    <div className="aspect-video w-full bg-slate-950 rounded-[3rem] border border-white/5 flex items-center justify-center overflow-hidden relative group shadow-2xl scroll-reveal">
                       <img 
                        src={activeVersion?.url || selectedAsset.thumbnail} 
                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 opacity-80" 
                       />
                    </div>

                    <div className="space-y-6 scroll-reveal">
                       <div className="flex items-center justify-between px-2">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">AI Generated Preview</h4>
                         <button onClick={handleDeepAnalysis} className="text-[10px] text-accent font-black uppercase tracking-widest flex items-center gap-2 hover:underline hover:scale-105 transition-transform active:scale-95">
                           {isAnalyzingDeep ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic"></i>} Synthesize Summary
                         </button>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetHub;
