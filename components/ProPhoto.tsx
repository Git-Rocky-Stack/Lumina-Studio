
import React, { useState, useRef, useEffect, useCallback } from 'react';
import LEDProgressBar from './LEDProgressBar';
import { editImage, analyzeMedia } from '../services/geminiService';
import { PhotoLayer, PhotoFilter } from '../types';

const TOOLS = [
  { id: 'select', icon: 'fa-mouse-pointer', label: 'Selection Tool' },
  { id: 'marquee', icon: 'fa-vector-square', label: 'Rect Marquee' },
  { id: 'lasso', icon: 'fa-wand-sparkles', label: 'Magic Lasso' },
  { id: 'crop', icon: 'fa-crop-simple', label: 'AI Crop' },
  { id: 'healing', icon: 'fa-hand-holding-magic', label: 'Neural Healing' },
  { id: 'brush', icon: 'fa-brush', label: 'Generative Brush' },
  { id: 'clone', icon: 'fa-copy', label: 'Smart Clone' },
  { id: 'eraser', icon: 'fa-eraser', label: 'Intelligent Eraser' },
  { id: 'text', icon: 'fa-t', label: 'Typography' },
];

type TransformType = 'move' | 'scale-tl' | 'scale-tr' | 'scale-bl' | 'scale-br' | 'rotate' | 'skew-x' | 'skew-y';

interface TransformState {
  layerId: string;
  type: TransformType;
  startX: number;
  startY: number;
  startLayer: PhotoLayer;
}

export default function ProPhoto() {
  const [activeTool, setActiveTool] = useState('select');
  const [layers, setLayers] = useState<PhotoLayer[]>([
    { 
      id: 'l1', name: 'Background', type: 'raster', 
      content: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80', 
      opacity: 1, blendMode: 'normal', visible: true, locked: false, filters: [],
      x: 50, y: 50, width: 800, height: 500, rotation: 0, skewX: 0, skewY: 0
    },
  ]);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('l1');
  const [genPrompt, setGenPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPhase, setProcessingPhase] = useState(0);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transform, setTransform] = useState<TransformState | null>(null);
  
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeLayer = layers.find(l => l.id === selectedLayerId);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!transform || !viewportRef.current) return;
      
      const rect = viewportRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const deltaX = currentX - transform.startX;
      const deltaY = currentY - transform.startY;
      
      const { startLayer, type } = transform;
      let updates: Partial<PhotoLayer> = {};

      switch (type) {
        case 'move':
          updates = { x: startLayer.x + deltaX, y: startLayer.y + deltaY };
          break;
        case 'scale-br':
          updates = { width: Math.max(10, startLayer.width + deltaX), height: Math.max(10, startLayer.height + deltaY) };
          break;
        case 'scale-bl':
          updates = { 
            x: startLayer.x + deltaX, 
            width: Math.max(10, startLayer.width - deltaX), 
            height: Math.max(10, startLayer.height + deltaY) 
          };
          break;
        case 'scale-tr':
          updates = { 
            y: startLayer.y + deltaY, 
            width: Math.max(10, startLayer.width + deltaX), 
            height: Math.max(10, startLayer.height - deltaY) 
          };
          break;
        case 'scale-tl':
          updates = { 
            x: startLayer.x + deltaX, 
            y: startLayer.y + deltaY, 
            width: Math.max(10, startLayer.width - deltaX), 
            height: Math.max(10, startLayer.height - deltaY) 
          };
          break;
        case 'rotate':
          const centerX = startLayer.x + startLayer.width / 2;
          const centerY = startLayer.y + startLayer.height / 2;
          const angle = Math.atan2(currentY - centerY, currentX - centerX) * (180 / Math.PI) + 90;
          updates = { rotation: Math.round(angle / 5) * 5 };
          break;
        case 'skew-x':
          updates = { skewX: startLayer.skewX + Math.round(deltaX / 2) };
          break;
        case 'skew-y':
          updates = { skewY: startLayer.skewY + Math.round(deltaY / 2) };
          break;
      }

      setLayers(prev => prev.map(l => l.id === transform.layerId ? { ...l, ...updates } : l));
    };

    const handleMouseUp = () => {
      setTransform(null);
    };

    if (transform) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [transform]);

  const onTransformStart = (e: React.MouseEvent, id: string, type: TransformType) => {
    e.stopPropagation();
    const layer = layers.find(l => l.id === id);
    if (!layer || layer.locked) return;
    
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    setTransform({
      layerId: id,
      type,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      startLayer: { ...layer }
    });
  };

  const handleLayerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      const newLayer: PhotoLayer = {
        id: `l-${Date.now()}`,
        name: file.name,
        type: 'raster',
        content: re.target?.result as string,
        opacity: 1,
        blendMode: 'normal',
        visible: true,
        locked: false,
        filters: [],
        x: 100, y: 100, width: 400, height: 300, rotation: 0, skewX: 0, skewY: 0
      };
      setLayers(prev => [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerativeEdit = async () => {
    if (!genPrompt || !activeLayer) return;
    setIsProcessing(true);
    setProcessingPhase(0);
    const phaseInterval = setInterval(() => setProcessingPhase(p => (p + 1) % 100), 200);

    try {
      const base64 = activeLayer.content.split(',')[1] || activeLayer.content;
      const updatedImage = await editImage(base64, genPrompt);
      setLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, content: updatedImage, name: `${l.name} (AI Edited)` } : l));
      setGenPrompt('');
    } catch (error) {
      console.error(error);
      alert("AI Engine encountered an error during synthesis.");
    } finally {
      clearInterval(phaseInterval);
      setIsProcessing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!activeLayer) return;
    setIsAnalyzing(true);
    try {
      const base64 = activeLayer.content.split(',')[1] || activeLayer.content;
      const result = await analyzeMedia("Provide a professional histogram and color balance audit of this image. Identify compositional strengths.", { data: base64, mimeType: 'image/png' });
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateLayer = (id: string, updates: Partial<PhotoLayer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  return (
    <div className="h-full flex flex-col bg-[#1A1A1B] text-slate-300 font-sans overflow-hidden select-none">
      <header className="h-12 bg-[#0F0F0F] border-b border-white/5 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-accent rounded flex items-center justify-center text-white font-bold text-xs shadow-lg">Ps</div>
          <div className="flex items-center gap-4 text-[11px] font-medium tracking-tight uppercase text-slate-500">
            <button className="hover:text-white transition-colors">File</button>
            <button className="hover:text-white transition-colors">Edit</button>
            <button className="hover:text-white transition-colors">Image</button>
            <button className="hover:text-white transition-colors">Layer</button>
            <button className="hover:text-white transition-colors">Neural</button>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded text-[9px] font-black text-accent uppercase tracking-widest">Neural Processor Active</div>
           <button className="px-6 py-1.5 bg-accent text-white text-[10px] font-black rounded uppercase tracking-widest hover:brightness-110 shadow-lg">Export Master</button>
        </div>
      </header>

      <div className="h-10 bg-[#252526] border-b border-black/20 flex items-center px-4 gap-6 z-40">
        <div className="flex items-center gap-3 border-r border-white/5 pr-6 h-full">
           <i className={`fas ${TOOLS.find(t => t.id === activeTool)?.icon} text-slate-400`}></i>
           <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">{TOOLS.find(t => t.id === activeTool)?.label}</span>
        </div>
        <div className="flex-1 flex items-center gap-4 group">
          <i className="fas fa-wand-magic-sparkles text-accent animate-pulse"></i>
          <input 
            type="text" value={genPrompt} onChange={(e) => setGenPrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGenerativeEdit()}
            placeholder="Neural modification..." className="flex-1 bg-black/20 border border-white/5 rounded px-4 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-slate-600"
          />
          <button onClick={handleGenerativeEdit} disabled={isProcessing || !genPrompt} className="px-4 py-1.5 bg-[#3E3E42] hover:bg-[#4E4E52] rounded text-[10px] font-bold uppercase tracking-widest disabled:opacity-30">
            {isProcessing ? <i className="fas fa-spinner fa-spin"></i> : 'Apply Neural Edit'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-12 bg-[#252526] border-r border-black/40 flex flex-col items-center py-4 gap-4 shadow-2xl z-30">
          {TOOLS.map((tool) => (
            <button key={tool.id} onClick={() => setActiveTool(tool.id)} className={`w-8 h-8 rounded flex items-center justify-center transition-all ${activeTool === tool.id ? 'bg-accent/20 text-accent shadow-inner border border-accent/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
              <i className={`fas ${tool.icon} text-sm`}></i>
            </button>
          ))}
        </aside>

        <main ref={viewportRef} className="flex-1 bg-[#121212] overflow-hidden relative flex items-center justify-center" onClick={() => setSelectedLayerId('')}>
           <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
           
           <div className="relative w-full h-full">
              {layers.filter(l => l.visible).map((layer) => {
                const isSelected = selectedLayerId === layer.id;
                return (
                  <div 
                    key={layer.id}
                    onMouseDown={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); if(activeTool === 'select') onTransformStart(e, layer.id, 'move'); }}
                    className={`absolute cursor-move transition-shadow duration-300 ${isSelected ? 'z-[100]' : ''}`}
                    style={{ 
                      left: layer.x, top: layer.y, width: layer.width, height: layer.height,
                      opacity: layer.opacity, mixBlendMode: layer.blendMode,
                      transform: `rotate(${layer.rotation}deg) skew(${layer.skewX}deg, ${layer.skewY}deg)`,
                      zIndex: layers.indexOf(layer)
                    }}
                  >
                    <img src={layer.content} className="w-full h-full object-cover pointer-events-none" alt={layer.name} />
                    
                    {isSelected && !layer.locked && activeTool === 'select' && (
                      <div className="absolute inset-0 border-2 border-accent/50 pointer-events-none">
                         {/* Corners */}
                         <div onMouseDown={(e) => onTransformStart(e, layer.id, 'scale-tl')} className="absolute -top-2 -left-2 w-4 h-4 bg-white border border-accent pointer-events-auto cursor-nwse-resize"></div>
                         <div onMouseDown={(e) => onTransformStart(e, layer.id, 'scale-tr')} className="absolute -top-2 -right-2 w-4 h-4 bg-white border border-accent pointer-events-auto cursor-nesw-resize"></div>
                         <div onMouseDown={(e) => onTransformStart(e, layer.id, 'scale-bl')} className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border border-accent pointer-events-auto cursor-nesw-resize"></div>
                         <div onMouseDown={(e) => onTransformStart(e, layer.id, 'scale-br')} className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border border-accent pointer-events-auto cursor-nwse-resize"></div>
                         
                         {/* Skew X handles - Emerald */}
                         <div onMouseDown={(e) => onTransformStart(e, layer.id, 'skew-x')} className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-emerald-500 rounded-sm rotate-45 pointer-events-auto cursor-ew-resize flex items-center justify-center shadow-lg">
                            <i className="fas fa-arrows-left-right text-emerald-500 text-[6px] -rotate-45"></i>
                         </div>
                         <div onMouseDown={(e) => onTransformStart(e, layer.id, 'skew-x')} className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-emerald-500 rounded-sm rotate-45 pointer-events-auto cursor-ew-resize flex items-center justify-center shadow-lg">
                            <i className="fas fa-arrows-left-right text-emerald-500 text-[6px] -rotate-45"></i>
                         </div>

                         {/* Skew Y handles - Amber */}
                         <div onMouseDown={(e) => onTransformStart(e, layer.id, 'skew-y')} className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-amber-500 rounded-sm rotate-45 pointer-events-auto cursor-ns-resize flex items-center justify-center shadow-lg">
                            <i className="fas fa-arrows-up-down text-amber-500 text-[6px] -rotate-45"></i>
                         </div>
                         <div onMouseDown={(e) => onTransformStart(e, layer.id, 'skew-y')} className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-amber-500 rounded-sm rotate-45 pointer-events-auto cursor-ns-resize flex items-center justify-center shadow-lg">
                            <i className="fas fa-arrows-up-down text-amber-500 text-[6px] -rotate-45"></i>
                         </div>

                         {/* Rotate */}
                         <div onMouseDown={(e) => onTransformStart(e, layer.id, 'rotate')} className="absolute -top-12 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center pointer-events-auto cursor-alias shadow-xl"><i className="fas fa-rotate text-accent text-[10px]"></i></div>
                      </div>
                    )}
                  </div>
                );
              })}
           </div>

           {isProcessing && (
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[200] flex flex-col items-center justify-center">
                <div className="w-16 h-16 mb-6 relative"><div className="absolute inset-0 border-4 border-white/5 rounded-full"></div><div className="absolute inset-0 border-t-4 border-accent rounded-full animate-spin"></div></div>
                <h3 className="text-white text-xl font-black uppercase tracking-tighter mb-4">Neural Re-Synthesis</h3>
                <LEDProgressBar progress={processingPhase} segments={20} className="w-48 mb-4" />
             </div>
           )}
        </main>

        <aside className="w-72 bg-[#252526] border-l border-black/40 flex flex-col shadow-2xl z-30">
          <div className="flex-1 flex flex-col overflow-hidden border-b border-black/40">
             <div className="px-4 py-2 bg-[#2D2D30] border-b border-black/20 text-[10px] font-black uppercase tracking-widest flex justify-between items-center"><span>Intelligence Panel</span></div>
             <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                {activeLayer ? (
                  <div className="space-y-6">
                     <div className="p-4 bg-slate-900/50 border border-white/5 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[9px] font-black text-accent uppercase tracking-widest">Audit Engine</h4>
                           <button onClick={handleAnalyze} disabled={isAnalyzing} className="text-slate-500 hover:text-white"><i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-microscope'}`}></i></button>
                        </div>
                        {analysis && <p className="text-[10px] text-slate-400 leading-relaxed font-medium italic">{analysis}</p>}
                     </div>
                     <div className="space-y-4">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5 pb-2">Spatial Precision</h4>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1"><span className="text-[8px] font-black uppercase">Skew X</span><input type="number" value={activeLayer.skewX} onChange={(e) => updateLayer(activeLayer.id, { skewX: parseInt(e.target.value) })} className="w-full bg-black/20 border border-white/5 rounded p-1.5 text-[10px]" /></div>
                           <div className="space-y-1"><span className="text-[8px] font-black uppercase">Skew Y</span><input type="number" value={activeLayer.skewY} onChange={(e) => updateLayer(activeLayer.id, { skewY: parseInt(e.target.value) })} className="w-full bg-black/20 border border-white/5 rounded p-1.5 text-[10px]" /></div>
                        </div>
                     </div>
                  </div>
                ) : <div className="h-full flex items-center justify-center opacity-30 pt-20"><p className="text-[10px] font-black uppercase">No Active Selection</p></div>}
             </div>
          </div>

          <div className="h-1/2 flex flex-col bg-[#2D2D30]">
             <div className="px-4 py-2 bg-[#2D2D30] border-b border-black/40 text-[10px] font-black uppercase tracking-widest flex items-center justify-between">
                <span>Layers Stack</span>
                <div className="flex gap-3 text-slate-500"><button onClick={() => fileInputRef.current?.click()} className="hover:text-white"><i className="fas fa-plus"></i></button><input type="file" ref={fileInputRef} onChange={handleLayerUpload} className="hidden" accept="image/*" /></div>
             </div>
             <div className="flex-1 overflow-y-auto scrollbar-hide">
                {layers.slice().reverse().map((layer) => (
                  <div key={layer.id} onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }} className={`h-14 px-4 border-b border-black/10 flex items-center gap-3 cursor-pointer transition-all ${selectedLayerId === layer.id ? 'bg-[#094771] border-l-4 border-l-accent' : 'hover:bg-white/5'}`}>
                    <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }} className={`w-6 text-center ${layer.visible ? 'text-slate-400' : 'text-slate-800'}`}><i className={`fas ${layer.visible ? 'fa-eye' : 'fa-eye-slash'} text-[10px]`}></i></button>
                    <div className="w-10 h-10 bg-slate-800 rounded border border-white/10 overflow-hidden flex-shrink-0 shadow-inner"><img src={layer.content} className="w-full h-full object-cover" /></div>
                    <div className="flex-1 min-w-0"><p className="text-[10px] font-bold truncate">{layer.name}</p></div>
                  </div>
                ))}
             </div>
          </div>
        </aside>
      </div>

      <footer className="h-6 bg-[#007ACC] text-white flex items-center px-4 justify-between text-[9px] font-bold z-50">
         <div className="flex items-center gap-4"><span className="uppercase">Neural Ready</span></div>
         <div className="flex items-center gap-4"><span>Pro Spatial Transformation Engine Alpha</span></div>
      </footer>
    </div>
  );
}
