import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '../../design-system';
import { editImage, analyzeMedia } from '../../services/geminiService';
import LEDProgressBar from '../LEDProgressBar';

// Components
import PhotoCanvas from './components/PhotoCanvas';
import ToolPalette from './components/ToolPalette';
import BrushSettings from './components/BrushSettings';
import LayersPanel from './components/LayersPanel';
import HistoryPanel from './components/HistoryPanel';
import AdjustmentsPanel from './components/AdjustmentsPanel';
import LayerEffectsPanel from './components/LayerEffectsPanel';

// Hooks
import { usePhotoHistory } from './hooks/usePhotoHistory';

// Types & Utils
import type {
  PhotoLayerExtended,
  PhotoTool,
  BrushPreset,
  BrushStroke,
  LayerEffect,
  ExtendedFilterType,
  HistorySnapshot,
} from './types';
import { DEFAULT_BRUSH_PRESET } from './types';
import { defaultBrushPresets } from './utils/brushPresets';
import { createFilter, applyFilterPreset } from './utils/filterPipeline';

type RightPanel = 'layers' | 'adjustments' | 'history';

export default function ProPhoto() {
  const toast = useToast();

  // Canvas state
  const [zoom, setZoom] = useState(1);

  // Tool state
  const [activeTool, setActiveTool] = useState<PhotoTool>('select');
  const [brushPreset, setBrushPreset] = useState<BrushPreset>(defaultBrushPresets[0] || DEFAULT_BRUSH_PRESET);
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');

  // Layer state
  const [layers, setLayers] = useState<PhotoLayerExtended[]>([
    {
      id: 'layer-1',
      name: 'Background',
      type: 'raster',
      content: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80',
      opacity: 1,
      blendMode: 'normal',
      visible: true,
      locked: false,
      filters: [],
      effects: [],
      x: 50,
      y: 50,
      width: 800,
      height: 500,
      rotation: 0,
      skewX: 0,
      skewY: 0,
    },
  ]);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>(['layer-1']);

  // Panel state
  const [rightPanel, setRightPanel] = useState<RightPanel>('layers');
  const [showBrushSettings, setShowBrushSettings] = useState(false);
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [effectsLayerId, setEffectsLayerId] = useState<string | null>(null);

  // AI state
  const [genPrompt, setGenPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPhase, setProcessingPhase] = useState(0);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History hook
  const {
    canUndo,
    canRedo,
    historyStack,
    currentIndex,
    undo,
    redo,
    pushState,
    createCheckpoint,
    jumpToSnapshot,
    clearHistory,
  } = usePhotoHistory({
    canvas: null, // Will be set by PhotoCanvas
    layers,
    onRestore: (snapshot: HistorySnapshot) => {
      setLayers(snapshot.layerStates);
      setSelectedLayerIds(snapshot.selectedLayerIds);
    },
  });

  // Active layer
  const activeLayer = layers.find(l => selectedLayerIds.includes(l.id)) || null;

  // Drawing tools check
  const isDrawingTool = ['brush', 'pencil', 'eraser', 'airbrush', 'clone', 'mixer'].includes(activeTool);

  // Handle layer selection
  const handleLayerSelect = useCallback((id: string, multi = false) => {
    if (multi) {
      setSelectedLayerIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else {
      setSelectedLayerIds([id]);
    }
  }, []);

  // Handle layer update
  const handleLayerUpdate = useCallback((id: string, updates: Partial<PhotoLayerExtended>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  // Handle layer add
  const handleLayerAdd = useCallback(() => {
    const newLayer: PhotoLayerExtended = {
      id: `layer-${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      type: 'raster',
      content: '',
      opacity: 1,
      blendMode: 'normal',
      visible: true,
      locked: false,
      filters: [],
      effects: [],
      x: 100,
      y: 100,
      width: 400,
      height: 300,
      rotation: 0,
      skewX: 0,
      skewY: 0,
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerIds([newLayer.id]);
    pushState('Add layer');
  }, [layers.length, pushState]);

  // Handle layer delete
  const handleLayerDelete = useCallback((id: string) => {
    if (layers.length <= 1) return;
    setLayers(prev => prev.filter(l => l.id !== id));
    setSelectedLayerIds(prev => prev.filter(i => i !== id));
    pushState('Delete layer');
  }, [layers.length, pushState]);

  // Handle layer duplicate
  const handleLayerDuplicate = useCallback((id: string) => {
    const layer = layers.find(l => l.id === id);
    if (!layer) return;

    const newLayer: PhotoLayerExtended = {
      ...layer,
      id: `layer-${Date.now()}`,
      name: `${layer.name} copy`,
      x: layer.x + 20,
      y: layer.y + 20,
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerIds([newLayer.id]);
    pushState('Duplicate layer');
  }, [layers, pushState]);

  // Handle layer reorder
  const handleLayerReorder = useCallback((fromIndex: number, toIndex: number) => {
    setLayers(prev => {
      const newLayers = [...prev];
      const [moved] = newLayers.splice(fromIndex, 1);
      if (moved) {
        newLayers.splice(toIndex, 0, moved);
      }
      return newLayers;
    });
    pushState('Reorder layers');
  }, [pushState]);

  // Handle brush stroke
  const handleBrushStroke = useCallback((_stroke: BrushStroke) => {
    pushState('Brush stroke');
    // In a full implementation, this would merge the stroke to the layer
  }, [pushState]);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (re) => {
      const newLayer: PhotoLayerExtended = {
        id: `layer-${Date.now()}`,
        name: file.name,
        type: 'raster',
        content: re.target?.result as string,
        opacity: 1,
        blendMode: 'normal',
        visible: true,
        locked: false,
        filters: [],
        effects: [],
        x: 100,
        y: 100,
        width: 400,
        height: 300,
        rotation: 0,
        skewX: 0,
        skewY: 0,
      };
      setLayers(prev => [...prev, newLayer]);
      setSelectedLayerIds([newLayer.id]);
      pushState('Import image');
    };
    reader.readAsDataURL(file);
  }, [pushState]);

  // Handle AI edit
  const handleGenerativeEdit = useCallback(async () => {
    if (!genPrompt || !activeLayer) return;

    setIsProcessing(true);
    setProcessingPhase(0);
    const phaseInterval = setInterval(() => setProcessingPhase(p => (p + 1) % 100), 200);

    try {
      const base64 = activeLayer.content.split(',')[1] || activeLayer.content;
      const updatedImage = await editImage(base64, genPrompt);
      handleLayerUpdate(activeLayer.id, {
        content: updatedImage,
        name: `${activeLayer.name} (AI Edited)`,
      });
      setGenPrompt('');
      pushState(`AI Edit: ${genPrompt.slice(0, 30)}...`);
      toast.success('AI Edit Complete', { description: 'Your edit has been applied' });
    } catch (error) {
      console.error(error);
      toast.error('AI Synthesis Failed', { description: 'The AI engine encountered an error. Please try again.' });
    } finally {
      clearInterval(phaseInterval);
      setIsProcessing(false);
    }
  }, [genPrompt, activeLayer, handleLayerUpdate, pushState, toast]);

  // Handle analyze
  const handleAnalyze = useCallback(async () => {
    if (!activeLayer) return;

    setIsAnalyzing(true);
    try {
      const base64 = activeLayer.content.split(',')[1] || activeLayer.content;
      const result = await analyzeMedia(
        'Provide a professional histogram and color balance audit of this image. Identify compositional strengths.',
        { data: base64, mimeType: 'image/png' }
      );
      setAnalysis(result ?? null);
    } catch (e) {
      console.error(e);
      toast.error('Analysis Failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [activeLayer, toast]);

  // Filter handlers
  const handleFilterChange = useCallback((filterId: string, value: number) => {
    if (!activeLayer) return;
    handleLayerUpdate(activeLayer.id, {
      filters: activeLayer.filters.map(f =>
        f.id === filterId ? { ...f, value } : f
      ),
    });
  }, [activeLayer, handleLayerUpdate]);

  const handleFilterAdd = useCallback((type: ExtendedFilterType) => {
    if (!activeLayer) return;
    const newFilter = createFilter(type);
    handleLayerUpdate(activeLayer.id, {
      filters: [...activeLayer.filters, newFilter],
    });
  }, [activeLayer, handleLayerUpdate]);

  const handleFilterRemove = useCallback((filterId: string) => {
    if (!activeLayer) return;
    handleLayerUpdate(activeLayer.id, {
      filters: activeLayer.filters.filter(f => f.id !== filterId),
    });
  }, [activeLayer, handleLayerUpdate]);

  const handleFilterToggle = useCallback((filterId: string) => {
    if (!activeLayer) return;
    handleLayerUpdate(activeLayer.id, {
      filters: activeLayer.filters.map(f =>
        f.id === filterId ? { ...f, enabled: !f.enabled } : f
      ),
    });
  }, [activeLayer, handleLayerUpdate]);

  const handleApplyPreset = useCallback((presetId: string) => {
    if (!activeLayer) return;
    const presetFilters = applyFilterPreset(presetId);
    handleLayerUpdate(activeLayer.id, { filters: presetFilters });
    pushState(`Apply preset: ${presetId}`);
  }, [activeLayer, handleLayerUpdate, pushState]);

  const handleResetFilters = useCallback(() => {
    if (!activeLayer) return;
    handleLayerUpdate(activeLayer.id, { filters: [] });
    pushState('Reset filters');
  }, [activeLayer, handleLayerUpdate, pushState]);

  // Effects handlers
  const handleOpenEffects = useCallback((layerId: string) => {
    setEffectsLayerId(layerId);
    setShowEffectsPanel(true);
  }, []);

  const handleEffectsChange = useCallback((effects: LayerEffect[]) => {
    if (!effectsLayerId) return;
    handleLayerUpdate(effectsLayerId, { effects });
  }, [effectsLayerId, handleLayerUpdate]);

  // Color swap
  const handleSwapColors = useCallback(() => {
    const temp = primaryColor;
    setPrimaryColor(secondaryColor);
    setSecondaryColor(temp);
  }, [primaryColor, secondaryColor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v': setActiveTool('move'); break;
          case 'm': setActiveTool('select'); break;
          case 'l': setActiveTool('lassoFree'); break;
          case 'w': setActiveTool('magicWand'); break;
          case 'c': setActiveTool('crop'); break;
          case 'b': setActiveTool('brush'); setShowBrushSettings(true); break;
          case 'n': setActiveTool('pencil'); break;
          case 'e': setActiveTool('eraser'); break;
          case 's': setActiveTool('clone'); break;
          case 'g': setActiveTool('gradient'); break;
          case 'i': setActiveTool('eyedropper'); break;
          case 't': setActiveTool('text'); break;
          case 'p': setActiveTool('pen'); break;
          case 'h': setActiveTool('hand'); break;
          case 'z': setActiveTool('zoom'); break;
          case 'x': handleSwapColors(); break;
          case 'd':
            setPrimaryColor('#000000');
            setSecondaryColor('#ffffff');
            break;
          case '[':
            setBrushPreset(prev => ({ ...prev, size: Math.max(1, prev.size - 5) }));
            break;
          case ']':
            setBrushPreset(prev => ({ ...prev, size: Math.min(500, prev.size + 5) }));
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwapColors]);

  return (
    <div className="h-full flex flex-col bg-[#1A1A1B] text-slate-300 font-sans overflow-hidden select-none">
      {/* Header */}
      <header className="h-12 bg-[#0F0F0F] border-b border-white/5 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-purple-600 rounded flex items-center justify-center text-white font-bold text-xs shadow-lg">
            Ps
          </div>
          <div className="flex items-center gap-4 text-[11px] font-medium tracking-tight uppercase text-slate-500">
            <button className="hover:text-white transition-colors">File</button>
            <button className="hover:text-white transition-colors">Edit</button>
            <button className="hover:text-white transition-colors">Image</button>
            <button className="hover:text-white transition-colors">Layer</button>
            <button className="hover:text-white transition-colors">Filter</button>
            <button className="hover:text-white transition-colors">View</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded text-[9px] font-black text-accent uppercase tracking-widest">
            {isProcessing ? 'Processing...' : 'Neural Ready'}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold rounded uppercase tracking-widest"
          >
            Import
          </button>
          <button className="px-4 py-1.5 bg-accent text-white text-[10px] font-bold rounded uppercase tracking-widest hover:brightness-110 shadow-lg">
            Export
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*"
          />
        </div>
      </header>

      {/* AI Bar */}
      <div className="h-10 bg-[#252526] border-b border-black/20 flex items-center px-4 gap-4 z-40">
        <i className="fas fa-wand-magic-sparkles text-accent animate-pulse" />
        <input
          type="text"
          value={genPrompt}
          onChange={(e) => setGenPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerativeEdit()}
          placeholder="Describe your edit... (e.g., 'make the sky more dramatic')"
          className="flex-1 bg-black/20 border border-white/5 rounded px-4 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-slate-600"
        />
        <button
          onClick={handleGenerativeEdit}
          disabled={isProcessing || !genPrompt}
          className="px-4 py-1.5 bg-[#3E3E42] hover:bg-[#4E4E52] rounded text-[10px] font-bold uppercase tracking-widest disabled:opacity-30"
        >
          {isProcessing ? <i className="fas fa-spinner fa-spin" /> : 'Apply AI Edit'}
        </button>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !activeLayer}
          className="px-3 py-1.5 bg-[#3E3E42] hover:bg-[#4E4E52] rounded text-[10px] font-bold uppercase tracking-widest disabled:opacity-30"
          title="Analyze Image"
        >
          <i className={`fas ${isAnalyzing ? 'fa-spinner fa-spin' : 'fa-microscope'}`} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tool Palette */}
        <ToolPalette
          activeTool={activeTool}
          onToolChange={(tool) => {
            setActiveTool(tool);
            if (['brush', 'pencil', 'eraser'].includes(tool)) {
              setShowBrushSettings(true);
            }
          }}
        />

        {/* Brush Settings Panel (collapsible) */}
        {showBrushSettings && isDrawingTool && (
          <div className="w-56 bg-[#252526] border-r border-black/40 flex flex-col">
            <div className="px-4 py-2 border-b border-black/40 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Brush
              </span>
              <button
                onClick={() => setShowBrushSettings(false)}
                className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-slate-500"
              >
                <i className="fas fa-chevron-left text-[8px]" />
              </button>
            </div>
            <BrushSettings
              brushPreset={brushPreset}
              onBrushChange={setBrushPreset}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              onPrimaryColorChange={setPrimaryColor}
              onSecondaryColorChange={setSecondaryColor}
              onSwapColors={handleSwapColors}
              className="flex-1 overflow-y-auto"
            />
          </div>
        )}

        {/* Canvas Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <PhotoCanvas
            layers={layers}
            selectedLayerIds={selectedLayerIds}
            activeTool={activeTool}
            brushPreset={brushPreset}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            zoom={zoom}
            onLayerUpdate={handleLayerUpdate}
            onSelectionChange={setSelectedLayerIds}
            onBrushStroke={handleBrushStroke}
            onZoomChange={setZoom}
          />

          {/* Processing overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
              <div className="w-16 h-16 mb-6 relative">
                <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
                <div className="absolute inset-0 border-t-4 border-accent rounded-full animate-spin" />
              </div>
              <h3 className="text-white text-xl font-black uppercase tracking-tighter mb-4">
                Neural Re-Synthesis
              </h3>
              <LEDProgressBar progress={processingPhase} segments={20} className="w-48 mb-4" />
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="w-72 bg-[#252526] border-l border-black/40 flex flex-col">
          {/* Panel Tabs */}
          <div className="h-10 bg-[#2D2D30] border-b border-black/40 flex">
            {(['layers', 'adjustments', 'history'] as RightPanel[]).map((panel) => (
              <button
                key={panel}
                onClick={() => setRightPanel(panel)}
                className={`
                  flex-1 text-[9px] font-bold uppercase tracking-widest
                  ${rightPanel === panel
                    ? 'text-accent border-b-2 border-accent bg-white/5'
                    : 'text-slate-500 hover:text-white'
                  }
                `}
              >
                {panel}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {rightPanel === 'layers' && (
              <LayersPanel
                layers={layers}
                selectedLayerIds={selectedLayerIds}
                onLayerSelect={handleLayerSelect}
                onLayerUpdate={handleLayerUpdate}
                onLayerAdd={handleLayerAdd}
                onLayerDelete={handleLayerDelete}
                onLayerDuplicate={handleLayerDuplicate}
                onLayerReorder={handleLayerReorder}
                onOpenEffects={handleOpenEffects}
                className="flex-1"
              />
            )}

            {rightPanel === 'adjustments' && (
              <AdjustmentsPanel
                layer={activeLayer}
                onFilterChange={handleFilterChange}
                onFilterAdd={handleFilterAdd}
                onFilterRemove={handleFilterRemove}
                onFilterToggle={handleFilterToggle}
                onApplyPreset={handleApplyPreset}
                onResetAll={handleResetFilters}
                className="flex-1"
              />
            )}

            {rightPanel === 'history' && (
              <HistoryPanel
                snapshots={historyStack}
                currentIndex={currentIndex}
                onJumpToSnapshot={jumpToSnapshot}
                onUndo={undo}
                onRedo={redo}
                onCreateCheckpoint={() => {
                  const name = prompt('Checkpoint name:');
                  if (name) createCheckpoint(name);
                }}
                onClearHistory={clearHistory}
                canUndo={canUndo}
                canRedo={canRedo}
                className="flex-1"
              />
            )}
          </div>

          {/* Analysis Panel (when available) */}
          {analysis && (
            <div className="p-4 border-t border-black/40 bg-slate-900/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[9px] font-black text-accent uppercase tracking-widest">
                  AI Analysis
                </h4>
                <button
                  onClick={() => setAnalysis(null)}
                  className="text-slate-600 hover:text-white"
                >
                  <i className="fas fa-times text-[10px]" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">{analysis}</p>
            </div>
          )}
        </aside>
      </div>

      {/* Status Bar */}
      <footer className="h-6 bg-[#007ACC] text-white flex items-center px-4 justify-between text-[9px] font-bold z-50">
        <div className="flex items-center gap-4">
          <span className="uppercase">{activeTool}</span>
          {activeLayer && <span>{activeLayer.name}</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>{Math.round(zoom * 100)}%</span>
          <span>{layers.length} layers</span>
          <span>Lumina Photo Pro</span>
        </div>
      </footer>

      {/* Layer Effects Panel */}
      <LayerEffectsPanel
        isOpen={showEffectsPanel}
        onClose={() => setShowEffectsPanel(false)}
        layer={layers.find(l => l.id === effectsLayerId) || null}
        onEffectsChange={handleEffectsChange}
      />
    </div>
  );
}
