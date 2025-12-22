
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import CollaborationHeader from './CollaborationHeader';
import LEDProgressBar from './LEDProgressBar';
import { DesignElement, MaskType, AnimationType, AnimationDirection, AnimationEasing } from '../types';
import { generateBackground, generateText } from '../services/geminiService';
import { simulateProfessionalExport, syncToGoogleDrive, downloadFile } from '../services/exportService';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 700;
const MAX_TIMELINE_SEC = 5;

const BG_STYLES = [
  { id: 'cinematic', label: 'Cinematic', icon: 'fa-clapperboard', prompt: 'cinematic lighting, ultra-detailed, professional photography' },
  { id: 'minimalist', label: 'Minimal', icon: 'fa-leaf', prompt: 'clean, simple, soft shadows, flat design, modern' },
  { id: 'cyberpunk', label: 'Cyber', icon: 'fa-bolt', prompt: 'neon lights, high contrast, futuristic, synthwave' },
  { id: 'papercut', label: 'Paper', icon: 'fa-scissors', prompt: '3d layered paper art, vibrant colors, depth of field' },
  { id: 'isometric', label: 'Isometric', icon: 'fa-cube', prompt: 'isometric view, cute 3d render, clay style, soft' },
  { id: 'watercolor', label: 'Artistic', icon: 'fa-palette', prompt: 'soft watercolor painting, ethereal, textured paper, hand-drawn' }
];

interface AnimationPreset {
  id: string;
  label: string;
  icon: string;
  config: {
    animation: AnimationType;
    animationDirection?: AnimationDirection;
    easing?: AnimationEasing;
  };
}

const ANIMATION_PRESETS: AnimationPreset[] = [
  { id: 'fade-in', label: 'Fade In', icon: 'fa-cloud', config: { animation: 'fade', easing: 'ease-out' } },
  { id: 'fade-out', label: 'Fade Out', icon: 'fa-cloud-meatball', config: { animation: 'fade-out', easing: 'ease-out' } },
  { id: 'bounce-in', label: 'Bounce In', icon: 'fa-basketball', config: { animation: 'bounce', easing: 'bounce-phys' } },
  { id: 'slide-left', label: 'Slide L', icon: 'fa-arrow-left', config: { animation: 'slide', animationDirection: 'left', easing: 'ease-out' } },
  { id: 'slide-right', label: 'Slide R', icon: 'fa-arrow-right', config: { animation: 'slide', animationDirection: 'right', easing: 'ease-out' } },
  { id: 'slide-up', label: 'Slide U', icon: 'fa-arrow-up', config: { animation: 'slide', animationDirection: 'up', easing: 'ease-out' } },
  { id: 'slide-down', label: 'Slide D', icon: 'fa-arrow-down', config: { animation: 'slide', animationDirection: 'down', easing: 'ease-out' } },
  { id: 'zoom-in', label: 'Zoom In', icon: 'fa-magnifying-glass-plus', config: { animation: 'zoom', animationDirection: 'in', easing: 'elastic' } },
  { id: 'zoom-out', label: 'Zoom Out', icon: 'fa-magnifying-glass-minus', config: { animation: 'zoom', animationDirection: 'out', easing: 'ease-out' } },
];

type TransformType = 'move' | 'scale-tl' | 'scale-tr' | 'scale-bl' | 'scale-br' | 'rotate' | 'skew-x' | 'skew-y';

interface TransformState {
  elementId: string;
  type: TransformType;
  startX: number;
  startY: number;
  startEl: DesignElement;
}

interface AnimationClipboard {
  animation: AnimationType;
  direction?: AnimationDirection;
  easing?: AnimationEasing;
  duration: number;
  delay: number;
  loop?: string;
}

const Canvas: React.FC = () => {
  const [elements, setElements] = useState<DesignElement[]>([
    { id: '1', type: 'text', content: 'Lumina Studio', x: 100, y: 100, width: 300, height: 60, fontSize: 40, zIndex: 1, isVisible: true, rotation: 0, skewX: 0, skewY: 0, animation: 'fade', animationDuration: 1, animationDelay: 0, animationEasing: 'ease-out' },
    { id: '2', type: 'text', content: 'AI Powered Creative Suite', x: 100, y: 165, width: 300, height: 30, fontSize: 16, zIndex: 2, isVisible: true, rotation: 0, skewX: 0, skewY: 0, animation: 'slide', animationDirection: 'right', animationDuration: 1.2, animationDelay: 0.2, animationEasing: 'ease-out' },
    { id: '3', type: 'image', content: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=400&q=80', x: 150, y: 250, width: 200, height: 200, zIndex: 3, isVisible: true, mask: 'circle', rotation: 0, skewX: 0, skewY: 0, animation: 'zoom', animationDirection: 'in', animationDuration: 1.5, animationDelay: 0.5, animationEasing: 'elastic' },
  ]);
  
  const [history, setHistory] = useState<DesignElement[][]>([]);
  const [future, setFuture] = useState<DesignElement[][]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hoveringId, setHoveringId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'tools' | 'ai' | 'layers' | 'animation'>('tools');
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [bgPrompt, setBgPrompt] = useState('');
  const [generatingBg, setGeneratingBg] = useState(false);
  const [selectedBgStyle, setSelectedBgStyle] = useState(BG_STYLES[0]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [transform, setTransform] = useState<TransformState | null>(null);
  const [animationClipboard, setAnimationClipboard] = useState<AnimationClipboard | null>(null);
  
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const canvasRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const saveToHistory = useCallback((newState: DesignElement[]) => {
    setHistory(prev => [...prev, elements]);
    setFuture([]);
    setElements(newState);
    localStorage.setItem('lumina_canvas_state', JSON.stringify(newState));
  }, [elements]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      if (elements) setFuture(f => [elements, ...f]);
      setElements(previous);
      return prev.slice(0, -1);
    });
  }, [elements]);

  const redo = useCallback(() => {
    setFuture(prev => {
      if (prev.length === 0) return prev;
      const next = prev[0];
      if (elements) setHistory(h => [...h, elements]);
      setElements(next);
      return prev.slice(1);
    });
  }, [elements]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!transform || !canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const deltaX = currentX - transform.startX;
      const deltaY = currentY - transform.startY;
      
      const { startEl, type } = transform;
      let updates: Partial<DesignElement> = {};

      switch (type) {
        case 'move':
          updates = { x: startEl.x + deltaX, y: startEl.y + deltaY };
          break;
        case 'scale-br':
          updates = { width: Math.max(10, startEl.width + deltaX), height: Math.max(10, startEl.height + deltaY) };
          break;
        case 'scale-bl':
          // Fix: replaced startLayer with startEl
          updates = { 
            x: startEl.x + deltaX, 
            width: Math.max(10, startEl.width - deltaX), 
            height: Math.max(10, startEl.height + deltaY) 
          };
          break;
        case 'scale-tr':
          updates = { 
            y: startEl.y + deltaY, 
            width: Math.max(10, startEl.width + deltaX), 
            height: Math.max(10, startEl.height - deltaY) 
          };
          break;
        case 'scale-tl':
          updates = { 
            x: startEl.x + deltaX, 
            y: startEl.y + deltaY, 
            width: Math.max(10, startEl.width - deltaX), 
            height: Math.max(10, startEl.height - deltaY) 
          };
          break;
        case 'rotate':
          const centerX = startEl.x + startEl.width / 2;
          const centerY = startEl.y + startEl.height / 2;
          const angle = Math.atan2(currentY - centerY, currentX - centerX) * (180 / Math.PI) + 90;
          updates = { rotation: Math.round(angle / 15) * 15 };
          break;
        case 'skew-x':
          updates = { skewX: (startEl.skewX || 0) + Math.round(deltaX / 2) };
          break;
        case 'skew-y':
          updates = { skewY: (startEl.skewY || 0) + Math.round(deltaY / 2) };
          break;
      }

      setElements(prev => prev.map(el => el.id === transform.elementId ? { ...el, ...updates } : el));
    };

    const handleMouseUp = () => {
      if (transform) {
        setHistory(h => [...h, elements]);
        setTransform(null);
      }
    };

    if (transform) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [transform, elements]);

  const onTransformStart = (e: React.MouseEvent, id: string, type: TransformType) => {
    e.stopPropagation();
    e.preventDefault();
    const el = elements.find(e => e.id === id);
    if (!el || el.isLocked) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setTransform({
      elementId: id,
      type,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      startEl: { ...el }
    });
  };

  const moveLayerToIndex = (fromId: string, toId: string) => {
    const fromIdx = elements.findIndex(e => e.id === fromId);
    const toIdx = elements.findIndex(e => e.id === toId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;

    const newElements = [...elements];
    const [movedItem] = newElements.splice(fromIdx, 1);
    newElements.splice(toIdx, 0, movedItem);

    const synced = newElements.map((el, i) => ({ ...el, zIndex: i + 1 }));
    saveToHistory(synced);
  };

  const bringToFront = () => {
    if (selectedIds.length === 0) return;
    const targets = new Set(selectedIds);
    const nonTargets = elements.filter(e => !targets.has(e.id));
    const targetsList = elements.filter(e => targets.has(e.id));
    const synced = [...nonTargets, ...targetsList].map((el, i) => ({ ...el, zIndex: i + 1 }));
    saveToHistory(synced);
  };

  const sendToBack = () => {
    if (selectedIds.length === 0) return;
    const targets = new Set(selectedIds);
    const nonTargets = elements.filter(e => !targets.has(e.id));
    const targetsList = elements.filter(e => targets.has(e.id));
    const synced = [...targetsList, ...nonTargets].map((el, i) => ({ ...el, zIndex: i + 1 }));
    saveToHistory(synced);
  };

  const groupSelected = () => {
    if (selectedIds.length < 2) return;
    const groupId = `group-${Date.now()}`;
    const nextState = elements.map(el => 
      selectedIds.includes(el.id) ? { ...el, groupId } : el
    );
    saveToHistory(nextState);
  };

  const ungroup = (groupId: string) => {
    const nextState = elements.map(el => 
      el.groupId === groupId ? { ...el, groupId: undefined } : el
    );
    saveToHistory(nextState);
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.delete(groupId);
      return next;
    });
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  useEffect(() => {
    const textContent = elements
      .filter(el => el.type === 'text')
      .map(el => el.content)
      .join(', ');

    if (textContent.length > 5) {
      const timer = setTimeout(async () => {
        try {
          const result = await generateText(`Based on the design text "${textContent}", suggest 3 creative visual atmosphere descriptions for a background. Return as a plain string list separated by semi-colons.`);
          if (result.text) {
            setAiSuggestions(result.text.split(';').map(s => s.trim().replace(/^\d+\.\s*/, '')));
          }
        } catch (e) {
          console.error(e);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [elements]);

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
    const saved = localStorage.getItem('lumina_canvas_state');
    if (saved) {
      try { setElements(JSON.parse(saved)); } catch (e) { console.error("Failed to load saved state", e); }
    }
  }, []);

  const handleCloudSave = async () => {
    setIsCloudSyncing(true);
    await syncToGoogleDrive(elements, "Lumina_Cloud_Project");
    setIsCloudSyncing(false);
    alert("Project securely synced to Google Drive.");
  };

  const generateSVGContent = () => {
    const svgHeader = `<svg width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" xmlns="http://www.w3.org/2000/svg">`;
    const svgFooter = `</svg>`;
    const bg = `<rect width="100%" height="100%" fill="white" />`;
    
    const svgElements = elements
      .filter(el => el.isVisible)
      .sort((a, b) => a.zIndex - b.zIndex)
      .map(el => {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const transform = `rotate(${el.rotation || 0}, ${cx}, ${cy}) skewX(${el.skewX || 0}) skewY(${el.skewY || 0})`;
        
        if (el.type === 'text') {
          return `<text x="${el.x}" y="${el.y + (el.fontSize || 16)}" font-size="${el.fontSize}" font-family="Inter, sans-serif" font-weight="900" transform="${transform}">${el.content}</text>`;
        } else {
          return `<image href="${el.content}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" transform="${transform}" />`;
        }
      }).join('\n');
      
    return `${svgHeader}\n${bg}\n${svgElements}\n${svgFooter}`;
  };

  const handleExport = async (format: 'png' | 'pdf' | 'svg' | 'webp') => {
    setExporting(true);
    setExportProgress(0);
    const success = await simulateProfessionalExport({
      fileName: `Lumina_Design_${Date.now()}`,
      format: format,
      quality: 'ultra',
      onProgress: (p) => setExportProgress(p)
    });
    
    if (success) {
      if (format === 'svg') {
        const svgString = generateSVGContent();
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        downloadFile(url, `Lumina_Export_${Date.now()}.svg`);
        URL.revokeObjectURL(url);
      }
      
      setExporting(false);
      setShowExportModal(false);
      alert(`${format.toUpperCase()} Export Complete.`);
    }
  };

  const handleGenerateBg = async (customPrompt?: string) => {
    const activePrompt = customPrompt || bgPrompt;
    if (!activePrompt && !customPrompt) return;
    
    setGeneratingBg(true);
    try {
      const textContext = elements.filter(el => el.type === 'text').map(el => el.content).join(', ');
      const finalPrompt = `${activePrompt}. Subject context: ${textContext}. Style: ${selectedBgStyle.prompt}`;
      
      const url = await generateBackground(textContext || "abstract design", finalPrompt);
      
      const filteredElements = elements.filter(el => el.id !== 'bg-master');
      const newBg: DesignElement = {
        id: 'bg-master',
        type: 'image',
        content: url,
        x: 0,
        y: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        zIndex: 0,
        isVisible: true
      };
      saveToHistory([newBg, ...filteredElements]);
      setBgPrompt('');
    } catch (e) {
      console.error(e);
      alert("AI Synthesis failed. Please try a different prompt.");
    } finally {
      setGeneratingBg(false);
    }
  };

  const updateElement = (id: string, updates: Partial<DesignElement>) => {
    const newState = elements.map(el => el.id === id ? { ...el, ...updates } : el);
    saveToHistory(newState);
  };

  const updateSelectedElements = (updates: Partial<DesignElement>) => {
    const newState = elements.map(el => selectedIds.includes(el.id) ? { ...el, ...updates } : el);
    saveToHistory(newState);
  };

  const toggleVisibility = (id: string) => {
    updateElement(id, { isVisible: !elements.find(e => e.id === id)?.isVisible });
  };

  const toggleLock = (id: string) => {
    updateElement(id, { isLocked: !elements.find(e => e.id === id)?.isLocked });
  };

  const deleteElement = (id: string) => {
    saveToHistory(elements.filter(el => el.id !== id));
    setSelectedIds([]);
  };

  const maskStyle = (type?: MaskType) => {
    switch (type) {
      case 'circle': return { borderRadius: '50%' };
      case 'rounded': return { borderRadius: '24px' };
      case 'star': return { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' };
      case 'diamond': return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
      default: return {};
    }
  };

  const getAnimationClassName = (el: DesignElement) => {
    if (!isPreviewMode || el.animation === 'none') return '';
    let base = `animate-lumina-${el.animation}`;
    if (el.animation === 'slide') base = `animate-lumina-slide-${el.animationDirection || 'up'}`;
    else if (el.animation === 'zoom') base = `animate-lumina-zoom-${el.animationDirection || 'in'}`;
    const easing = `easing-${el.animationEasing || 'ease-out'}`;
    return `${base} ${easing} animation-fill-both`;
  };

  const triggerPreview = () => {
    setIsPreviewMode(false);
    setTimeout(() => setIsPreviewMode(true), 50);
  };

  const applyPreset = (preset: AnimationPreset) => {
    updateSelectedElements({
      animation: preset.config.animation,
      animationDirection: preset.config.animationDirection,
      animationEasing: preset.config.easing || 'ease-out',
      animationDuration: selectedEl?.animationDuration || 1,
      animationDelay: selectedEl?.animationDelay || 0,
    });
  };

  const handleMagicStagger = () => {
    if (selectedIds.length < 2) return;
    const sorted = elements
      .filter(el => selectedIds.includes(el.id))
      .sort((a, b) => a.zIndex - b.zIndex);
    
    const nextState = elements.map(el => {
      const idx = sorted.findIndex(s => s.id === el.id);
      if (idx !== -1) {
        return { ...el, animationDelay: idx * 0.25 };
      }
      return el;
    });
    saveToHistory(nextState);
  };

  const copyAnimation = () => {
    if (!selectedEl) return;
    setAnimationClipboard({
      animation: selectedEl.animation || 'none',
      direction: selectedEl.animationDirection,
      easing: selectedEl.animationEasing,
      duration: selectedEl.animationDuration || 1,
      delay: selectedEl.animationDelay || 0,
      loop: selectedEl.animationIterationCount
    });
  };

  const pasteAnimation = () => {
    if (!animationClipboard || selectedIds.length === 0) return;
    updateSelectedElements({
      animation: animationClipboard.animation,
      animationDirection: animationClipboard.direction,
      animationEasing: animationClipboard.easing,
      animationDuration: animationClipboard.duration,
      animationDelay: animationClipboard.delay,
      animationIterationCount: animationClipboard.loop
    });
  };

  const selectedEl = elements.find(e => e.id === selectedIds[0]);

  const isPresetActive = (preset: AnimationPreset) => {
    if (!selectedEl) return false;
    const sameAnim = selectedEl.animation === preset.config.animation;
    const sameDir = selectedEl.animationDirection === preset.config.animationDirection;
    return sameAnim && (preset.config.animationDirection === undefined || sameDir);
  };

  const handleTimelineInteraction = (e: React.MouseEvent, elId: string, type: 'move' | 'stretch') => {
    e.stopPropagation();
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startX = e.clientX;
    const targetEl = elements.find(el => el.id === elId);
    if (!targetEl) return;
    const initialDelay = targetEl.animationDelay || 0;
    const initialDuration = targetEl.animationDuration || 1;
    const onMouseMove = (moveE: MouseEvent) => {
      const deltaX = moveE.clientX - startX;
      const deltaSec = (deltaX / rect.width) * MAX_TIMELINE_SEC;
      if (type === 'move') {
        const newDelay = Math.max(0, Math.min(MAX_TIMELINE_SEC - initialDuration, initialDelay + deltaSec));
        setElements(prev => prev.map(el => el.id === elId ? { ...el, animationDelay: parseFloat(newDelay.toFixed(2)) } : el));
      } else {
        const newDuration = Math.max(0.1, Math.min(MAX_TIMELINE_SEC - initialDelay, initialDuration + deltaSec));
        setElements(prev => prev.map(el => el.id === elId ? { ...el, animationDuration: parseFloat(newDuration.toFixed(2)) } : el));
      }
    };
    const onMouseUp = () => {
      saveToHistory(elements);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const layerTree = useMemo(() => {
    const tree: Record<string, DesignElement[]> = { ungrouped: [] };
    elements.forEach(el => {
      if (el.groupId) {
        if (!tree[el.groupId]) tree[el.groupId] = [];
        tree[el.groupId].push(el);
      } else {
        tree['ungrouped'].push(el);
      }
    });
    return tree;
  }, [elements]);

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden relative font-sans">
      <CollaborationHeader title="Professional Design Studio" onPublish={() => setShowExportModal(true)} />

      <div className="h-14 bg-white border-b border-slate-100 px-8 flex items-center justify-between text-slate-500 shadow-sm z-30">
        <div className="flex items-center gap-6 border-r border-slate-100 pr-6 mr-6">
          <button onClick={undo} disabled={history.length === 0} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl disabled:opacity-20 transition-all active:scale-90"><i className="fas fa-undo"></i></button>
          <button onClick={redo} disabled={future.length === 0} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl disabled:opacity-20 transition-all active:scale-90"><i className="fas fa-redo"></i></button>
          <div className="w-px h-6 bg-slate-100"></div>
          <button onClick={handleCloudSave} disabled={isCloudSyncing} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:scale-110 ${isCloudSyncing ? 'text-accent' : 'hover:bg-slate-50'}`}>
            <i className={`fas ${isCloudSyncing ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}`}></i>
          </button>
        </div>

        <div className="flex-1 flex items-center gap-4">
           {selectedIds.length > 0 && (
             <div className="flex items-center gap-4 bg-slate-50 px-6 py-2 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                <span className="text-[10px] font-black uppercase text-slate-400 mr-2 tracking-widest">Quick Properties</span>
                <select 
                  className="bg-transparent text-[10px] font-bold outline-none uppercase cursor-pointer hover:text-slate-900 transition-colors"
                  onChange={(e) => updateSelectedElements({ mask: e.target.value as MaskType })}
                  value={selectedEl?.mask || 'none'}
                >
                  <option value="none">No Mask</option>
                  <option value="circle">Circle</option>
                  <option value="rounded">Rounded</option>
                  <option value="star">Star</option>
                  <option value="diamond">Diamond</option>
                </select>
                <div className="w-px h-4 bg-slate-200"></div>
                <button onClick={() => selectedIds.forEach(id => deleteElement(id))} className="text-rose-500 hover:text-rose-600 transition-colors hover:scale-110 active:scale-90"><i className="fas fa-trash-alt text-xs"></i></button>
             </div>
           )}
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={triggerPreview}
             className="px-6 py-2.5 bg-rose-50 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center gap-2 hover:scale-105 active:scale-95"
           >
             <i className="fas fa-play"></i> {isPreviewMode ? 'Restart Test' : 'Run Motion Test'}
           </button>
           <button 
             onClick={() => handleExport('svg')}
             className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2 hover:scale-105 active:scale-95"
           >
             <i className="fas fa-code"></i> Quick SVG
           </button>
           <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg hover:scale-105 active:scale-95">New Element</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-20 bg-white border-r border-slate-100 flex flex-col items-center py-8 gap-8 text-slate-300 h-full shadow-sm z-20">
          <button onClick={() => setActiveTab('tools')} className={`p-4 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-90 ${activeTab === 'tools' ? 'bg-accent-soft text-accent shadow-lg' : 'hover:bg-slate-50'}`} title="Tools & Geometry"><i className="fas fa-vector-square"></i></button>
          <button onClick={() => setActiveTab('layers')} className={`p-4 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-90 ${activeTab === 'layers' ? 'bg-amber-50 text-amber-600 shadow-lg' : 'hover:bg-slate-50'}`} title="Layers"><i className="fas fa-layer-group"></i></button>
          <button onClick={() => setActiveTab('animation')} className={`p-4 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-90 ${activeTab === 'animation' ? 'bg-slate-900 text-white shadow-lg' : 'hover:bg-slate-50'}`} title="Animation"><i className="fas fa-clapperboard"></i></button>
          <button onClick={() => setActiveTab('ai')} className={`p-4 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-90 ${activeTab === 'ai' ? 'bg-purple-50 text-purple-600 shadow-lg' : 'hover:bg-slate-50'}`} title="Lumina AI"><i className="fas fa-sparkles"></i></button>
        </div>

        <div className="flex-1 flex justify-center items-center overflow-auto bg-[#F1F5F9] relative" onClick={() => setSelectedIds([])}>
           <div ref={canvasRef} className="w-[500px] h-[700px] bg-white shadow-[0_0_80px_rgba(0,0,0,0.05)] relative overflow-hidden" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
              {generatingBg && (
                <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-12">
                   <div className="w-16 h-16 mb-6 relative">
                      <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                      <div className="absolute inset-0 border-t-4 border-purple-400 rounded-full animate-spin"></div>
                      <i className="fas fa-sparkles absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400 animate-pulse"></i>
                   </div>
                   <h3 className="text-white text-xl font-black uppercase tracking-tighter mb-2">Synthesizing Atmosphere</h3>
                   <div className="w-48 bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
                   </div>
                </div>
              )}
              
              {elements.filter(el => el.isVisible).sort((a, b) => a.zIndex - b.zIndex).map((el) => {
                const isSelected = selectedIds.includes(el.id);
                const isHovering = hoveringId === el.id;
                const animClass = getAnimationClassName(el);
                
                return (
                  <div 
                    key={el.id} 
                    onMouseEnter={() => setHoveringId(el.id)}
                    onMouseLeave={() => setHoveringId(null)}
                    className={`absolute group cursor-move transition-all duration-300 ${isSelected ? `lumina-selection-active z-50 ${isHovering ? 'shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]' : 'shadow-2xl'}` : ''} ${animClass}`}
                    style={{ 
                      left: el.x, 
                      top: el.y, 
                      width: el.width, 
                      height: el.height,
                      zIndex: el.zIndex,
                      transform: `rotate(${el.rotation || 0}deg) skew(${el.skewX || 0}deg, ${el.skewY || 0}deg) ${isSelected ? (isHovering ? 'scale(1.06)' : 'scale(1.02)') : 'scale(1)'}`,
                      animationDuration: isPreviewMode && el.animation !== 'none' ? `${el.animationDuration || 1}s` : '0s',
                      animationDelay: isPreviewMode && el.animation !== 'none' ? `${el.animationDelay || 0}s` : '0s',
                      animationIterationCount: el.animationIterationCount || '1'
                    }} 
                    onMouseDown={(e) => {
                      if (el.isLocked) return;
                      onTransformStart(e, el.id, 'move');
                      if (e.shiftKey) setSelectedIds(prev => prev.includes(el.id) ? prev.filter(i => i !== el.id) : [...prev, el.id]);
                      else setSelectedIds([el.id]);
                    }}
                  >
                    {isSelected && !el.isLocked && !isPreviewMode && (
                      <div className="absolute inset-[-4px] border border-accent/30 pointer-events-none">
                         <div className="absolute -top-10 left-0 bg-slate-900 text-white px-3 py-1 rounded-lg flex items-center gap-2 shadow-2xl animate-lumina-pop-in">
                            <i className={`fas ${el.type === 'text' ? 'fa-font' : 'fa-image'} text-accent text-[8px]`}></i>
                            <span className="text-[8px] font-black uppercase tracking-widest">{el.type}</span>
                            <span className="w-px h-2 bg-white/20"></span>
                            <span className="text-[8px] font-mono opacity-60">Z{el.zIndex}</span>
                         </div>
                         <svg className="absolute inset-0 w-full h-full overflow-visible">
                            <rect 
                              x="0" y="0" width="100%" height="100%" fill="none" 
                              stroke="var(--accent)" strokeWidth="1" strokeDasharray="5,5"
                              style={{ animation: 'lumina-dash-march 1s linear infinite' }}
                            />
                         </svg>
                      </div>
                    )}

                    {el.type === 'text' ? (
                      <div style={{ fontSize: el.fontSize, width: '100%' }} className="font-black text-slate-900 leading-tight outline-none tracking-tighter text-center select-none">
                        {el.content}
                      </div>
                    ) : (
                      <img src={el.content} style={{ ...maskStyle(el.mask) }} className="w-full h-full object-cover pointer-events-none select-none" />
                    )}

                    {isSelected && !el.isLocked && !isPreviewMode && (
                      <>
                        {/* Scale Handles (Corners) */}
                        <div onMouseDown={(e) => onTransformStart(e, el.id, 'scale-tl')} className="lumina-handle absolute -top-2 -left-2 w-4 h-4 border border-accent rounded-sm cursor-nw-resize z-[60] bg-white shadow-sm"></div>
                        <div onMouseDown={(e) => onTransformStart(e, el.id, 'scale-tr')} className="lumina-handle absolute -top-2 -right-2 w-4 h-4 border border-accent rounded-sm cursor-ne-resize z-[60] bg-white shadow-sm"></div>
                        <div onMouseDown={(e) => onTransformStart(e, el.id, 'scale-bl')} className="lumina-handle absolute -bottom-2 -left-2 w-4 h-4 border border-accent rounded-sm cursor-sw-resize z-[60] bg-white shadow-sm"></div>
                        <div onMouseDown={(e) => onTransformStart(e, el.id, 'scale-br')} className="lumina-handle absolute -bottom-2 -right-2 w-4 h-4 border border-accent rounded-sm cursor-se-resize z-[60] bg-white shadow-sm"></div>
                        
                        {/* Skew X Handles (Top & Bottom Center) - Emerald */}
                        <div onMouseDown={(e) => onTransformStart(e, el.id, 'skew-x')} title="Skew Horizontal" className="lumina-handle absolute top-[-6px] left-1/2 -translate-x-1/2 w-4 h-4 border-2 border-emerald-500 bg-white rotate-45 cursor-ew-resize z-[60] flex items-center justify-center group/skx-t shadow-lg">
                           <div className="absolute hidden group-hover/skx-t:block bg-emerald-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-sm -top-8 whitespace-nowrap shadow-xl">SKEW X</div>
                           <i className="fas fa-arrows-left-right text-emerald-500 text-[6px] -rotate-45"></i>
                        </div>
                        <div onMouseDown={(e) => onTransformStart(e, el.id, 'skew-x')} title="Skew Horizontal" className="lumina-handle absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-4 h-4 border-2 border-emerald-500 bg-white rotate-45 cursor-ew-resize z-[60] flex items-center justify-center group/skx-b shadow-lg">
                           <div className="absolute hidden group-hover/skx-b:block bg-emerald-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-sm -bottom-8 whitespace-nowrap shadow-xl">SKEW X</div>
                           <i className="fas fa-arrows-left-right text-emerald-500 text-[6px] -rotate-45"></i>
                        </div>

                        {/* Skew Y Handles (Left & Right Center) - Amber */}
                        <div onMouseDown={(e) => onTransformStart(e, el.id, 'skew-y')} title="Skew Vertical" className="lumina-handle absolute left-[-6px] top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-amber-500 bg-white rotate-45 cursor-ns-resize z-[60] flex items-center justify-center group/sky-l shadow-lg">
                           <div className="absolute hidden group-hover/sky-l:block bg-amber-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-sm -left-14 whitespace-nowrap shadow-xl">SKEW Y</div>
                           <i className="fas fa-arrows-up-down text-amber-500 text-[6px] -rotate-45"></i>
                        </div>
                        <div onMouseDown={(e) => onTransformStart(e, el.id, 'skew-y')} title="Skew Vertical" className="lumina-handle absolute right-[-6px] top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-amber-500 bg-white rotate-45 cursor-ns-resize z-[60] flex items-center justify-center group/sky-r shadow-lg">
                           <div className="absolute hidden group-hover/sky-r:block bg-amber-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-sm -right-14 whitespace-nowrap shadow-xl">SKEW Y</div>
                           <i className="fas fa-arrows-up-down text-amber-500 text-[6px] -rotate-45"></i>
                        </div>

                        {/* Rotation Handle */}
                        <div onMouseDown={(e) => onTransformStart(e, el.id, 'rotate')} className="absolute -top-16 left-1/2 -translate-x-1/2 group/rotate z-[60] flex flex-col items-center">
                           <div className="w-px h-6 bg-accent/40"></div>
                           <div className="lumina-handle w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center cursor-alias shadow-xl hover:border-accent hover:scale-110 transition-all">
                              <i className="fas fa-rotate text-accent text-xs"></i>
                           </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
           </div>
        </div>

        <div className="w-80 bg-white border-l border-slate-100 flex flex-col shadow-2xl z-20 overflow-hidden">
          <div className="p-8 flex-1 flex flex-col overflow-hidden">
            {activeTab === 'layers' ? (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Composition Layers</h4>
                  <div className="flex gap-2">
                    <button onClick={groupSelected} title="Group Selection" className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-accent hover:scale-110 active:scale-90 transition-all"><i className="fas fa-object-group text-xs"></i></button>
                    <button onClick={bringToFront} title="Bring to Front" className="p-2 bg-slate-50 rounded-lg text-slate-400 hover:text-accent hover:scale-110 active:scale-90 transition-all"><i className="fas fa-layer-group rotate-180 text-xs"></i></button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-6">
                  {(Object.entries(layerTree) as [string, DesignElement[]][]).map(([groupId, els]) => {
                    if (els.length === 0) return null;
                    const isGroup = groupId !== 'ungrouped';
                    const isCollapsed = collapsedGroups.has(groupId);
                    
                    return (
                      <div key={groupId} className={`space-y-2 ${isGroup ? 'bg-slate-50/50 rounded-2xl p-2 border border-slate-100' : ''}`}>
                        {isGroup && (
                          <div className="flex items-center justify-between px-2 mb-2">
                            <button 
                              onClick={() => toggleGroupCollapse(groupId)}
                              className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all hover:translate-x-1"
                            >
                              <i className={`fas fa-chevron-right transition-transform ${!isCollapsed ? 'rotate-90' : ''}`}></i>
                              Group Context
                            </button>
                            <button onClick={() => ungroup(groupId)} className="text-[8px] font-black text-rose-400 uppercase hover:underline active:scale-90 transition-transform">Ungroup</button>
                          </div>
                        )}

                        {!isCollapsed && els.sort((a, b) => b.zIndex - a.zIndex).map((el) => {
                          const isSelected = selectedIds.includes(el.id);
                          return (
                            <div 
                              key={el.id} 
                              draggable
                              onDragStart={() => setDraggedLayerId(el.id)}
                              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                              onDrop={() => { if(draggedLayerId) moveLayerToIndex(draggedLayerId, el.id); setDraggedLayerId(null); }}
                              onClick={() => setSelectedIds([el.id])} 
                              className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer group/row relative hover:translate-x-1 ${isSelected ? 'bg-white border-accent shadow-lg shadow-accent/5' : 'bg-white border-slate-50 hover:border-slate-200'}`}
                            >
                              <div className="flex items-center justify-center text-slate-200 cursor-grab active:cursor-grabbing px-1">
                                <i className="fas fa-grip-vertical text-[10px]"></i>
                              </div>
                              
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shadow-inner">
                                {el.type === 'image' ? (
                                  <img src={el.content} className="w-full h-full object-cover" />
                                ) : (
                                  <i className="fas fa-font text-slate-400 text-xs"></i>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                 <p className={`text-[10px] font-black truncate uppercase tracking-tight ${isSelected ? 'text-accent' : 'text-slate-700'}`}>
                                   {el.type === 'text' ? el.content : 'Image Asset'}
                                 </p>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase">Z{el.zIndex} • {el.type}</p>
                              </div>

                              <div className="flex gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); toggleVisibility(el.id); }} className={`p-1.5 rounded-lg hover:bg-slate-50 transition-all hover:scale-110 active:scale-90 ${el.isVisible ? 'text-slate-300' : 'text-rose-500'}`}><i className="fas fa-eye text-[10px]"></i></button>
                                <button onClick={(e) => { e.stopPropagation(); toggleLock(el.id); }} className={`p-1.5 rounded-lg hover:bg-slate-50 transition-all hover:scale-110 active:scale-90 ${el.isLocked ? 'text-amber-500' : 'text-slate-300'}`}><i className="fas fa-lock text-[10px]"></i></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-auto pt-6 border-t border-slate-100 flex gap-2">
                   <button onClick={bringToFront} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98]">To Front</button>
                   <button onClick={sendToBack} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]">To Back</button>
                </div>
              </div>
            ) : activeTab === 'animation' ? (
              <div className="flex flex-col h-full overflow-y-auto scrollbar-hide space-y-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Motion Lab</h4>
                  <div className="flex gap-2">
                    <button onClick={handleMagicStagger} title="Magic Stagger Selection" className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-all hover:scale-110 active:scale-90"><i className="fas fa-wand-magic-sparkles text-xs"></i></button>
                    <button onClick={triggerPreview} className="text-[9px] text-rose-500 font-black uppercase tracking-widest hover:underline hover:scale-105 transition-transform active:scale-95">Test Sequence</button>
                  </div>
                </div>

                {/* TRACK-BASED VISUAL SEQUENCER */}
                <div className="space-y-6">
                   <div className="flex items-center justify-between ml-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Master Sequence</p>
                      <button 
                        onClick={() => updateSelectedElements({ animationIterationCount: selectedEl?.animationIterationCount === 'infinite' ? '1' : 'infinite' })}
                        className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 ${selectedEl?.animationIterationCount === 'infinite' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}
                      >
                        <i className="fas fa-repeat mr-1"></i> Loop Composition
                      </button>
                   </div>
                   <div ref={timelineRef} className="bg-slate-950 rounded-[2rem] p-6 pt-10 space-y-4 relative overflow-hidden shadow-2xl group/timeline">
                      {/* Timeline Markers */}
                      <div className="absolute top-0 left-0 right-0 h-8 flex justify-between items-center px-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md z-20">
                         {[0, 1, 2, 3, 4, 5].map(s => (
                           <span key={s} className="text-[8px] font-mono text-slate-500">{s}s</span>
                         ))}
                      </div>

                      {/* Timeline Tracks */}
                      <div className="space-y-4 relative z-10 max-h-[300px] overflow-y-auto scrollbar-hide pr-1 mt-4">
                         {elements.map(el => {
                           const isSelected = selectedIds.includes(el.id);
                           return (
                             <div key={el.id} className="relative h-10 group/track flex items-center border-b border-white/5 last:border-0 pb-2">
                                {/* Track Header (Thumbnail/Icon) */}
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 mr-4 flex-shrink-0">
                                   {el.type === 'image' ? (
                                     <img src={el.content} className="w-full h-full object-cover opacity-60" />
                                   ) : (
                                     <i className="fas fa-font text-slate-600 text-[10px]"></i>
                                   )}
                                </div>

                                {/* Track Content */}
                                <div className="flex-1 relative h-full">
                                   <div 
                                     className={`absolute h-8 top-0 rounded-xl transition-all flex items-center justify-center px-4 border ${isSelected ? 'bg-accent/20 border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)] z-20' : 'bg-white/5 border-white/5 opacity-30 hover:opacity-100 cursor-pointer hover:bg-white/10'}`}
                                     style={{ 
                                       left: `${((el.animationDelay || 0) / MAX_TIMELINE_SEC) * 100}%`,
                                       width: `${((el.animationDuration || 1) / MAX_TIMELINE_SEC) * 100}%`
                                     }}
                                     onClick={(e) => { e.stopPropagation(); setSelectedIds([el.id]); }}
                                     onMouseDown={(e) => isSelected && handleTimelineInteraction(e, el.id, 'move')}
                                   >
                                      <span className={`text-[8px] font-black uppercase truncate pointer-events-none select-none ${isSelected ? 'text-accent' : 'text-slate-500'}`}>
                                         {el.type === 'text' ? el.content.substring(0, 12) : 'Asset Layer'}
                                      </span>
                                      
                                      {/* Duration Handle */}
                                      {isSelected && (
                                        <div onMouseDown={(e) => handleTimelineInteraction(e, el.id, 'stretch')} className="absolute top-0 right-0 w-4 h-full cursor-ew-resize opacity-0 group-hover/track:opacity-100 flex items-center justify-center">
                                           <div className="w-1.5 h-4 bg-accent rounded-full border border-slate-950"></div>
                                        </div>
                                      )}

                                      {/* Timing Tooltip */}
                                      {isSelected && (
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 bg-accent text-white text-[7px] font-black rounded opacity-0 group-hover/track:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                                           {el.animationDelay}s - {((el.animationDelay || 0) + (el.animationDuration || 1)).toFixed(1)}s
                                        </div>
                                      )}
                                   </div>
                                </div>
                             </div>
                           );
                         })}
                      </div>

                      {/* Playhead Scrubber */}
                      {isPreviewMode && (
                        <div className="absolute top-0 bottom-0 w-px bg-rose-500 z-30 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-lumina-playhead">
                           <div className="w-3 h-3 bg-rose-500 rounded-full absolute -top-1.5 -left-[5px] border-2 border-slate-950"></div>
                        </div>
                      )}
                   </div>
                </div>

                {selectedIds.length > 0 ? (
                  <div className="space-y-8 animate-in slide-in-from-right-4 pb-12">
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] space-y-6 shadow-inner relative overflow-hidden">
                       <div className="flex justify-between items-center mb-2">
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Motion Synthesis</h4>
                          <div className="flex gap-2">
                            <button onClick={copyAnimation} title="Copy Animation Style" className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm hover:scale-110 active:scale-90"><i className="fas fa-copy text-[10px]"></i></button>
                            <button onClick={pasteAnimation} disabled={!animationClipboard} title="Paste Animation Style" className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm disabled:opacity-20 hover:scale-110 active:scale-90"><i className="fas fa-paste text-[10px]"></i></button>
                          </div>
                       </div>
                       
                       <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Behavior Primitive</label>
                          <select 
                            value={selectedEl?.animation || 'none'}
                            onChange={(e) => updateSelectedElements({ animation: e.target.value as AnimationType })}
                            className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none focus:ring-1 focus:ring-accent shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
                          >
                             <option value="none">Static Composition</option>
                             <option value="fade">Opacity Fade</option>
                             <option value="fade-out">Opacity Out</option>
                             <option value="slide">Vector Shift</option>
                             <option value="bounce">Kinetic Bounce</option>
                             <option value="zoom">Temporal Scale</option>
                          </select>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Direction</label>
                             <select 
                               value={selectedEl?.animationDirection || 'up'}
                               disabled={selectedEl?.animation === 'fade' || selectedEl?.animation === 'fade-out'}
                               onChange={(e) => updateSelectedElements({ animationDirection: e.target.value as AnimationDirection })}
                               className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none focus:ring-1 focus:ring-accent disabled:opacity-30 shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
                             >
                                <option value="up">Top (North)</option>
                                <option value="down">Bottom (South)</option>
                                <option value="left">Left (West)</option>
                                <option value="right">Right (East)</option>
                                <option value="in">Inward</option>
                                <option value="out">Outward</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Interpolation</label>
                             <select 
                               value={selectedEl?.animationEasing || 'ease-out'}
                               onChange={(e) => updateSelectedElements({ animationEasing: e.target.value as AnimationEasing })}
                               className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none focus:ring-1 focus:ring-accent shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
                             >
                                <option value="linear">Linear (Constant)</option>
                                <option value="ease-out">Cinema Ease (Smooth)</option>
                                <option value="elastic">Physics Elastic (Organic)</option>
                                <option value="bounce-phys">Gravity Bounce (Physical)</option>
                             </select>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 mt-2 pt-6">
                          <div className="space-y-3">
                             <div className="flex justify-between items-center px-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Duration</label>
                                <span className="text-[9px] font-bold text-accent">{selectedEl?.animationDuration || 1}s</span>
                             </div>
                             <input 
                              type="range" step="0.1" min="0.1" max="5"
                              value={selectedEl?.animationDuration || 1}
                              onChange={(e) => updateSelectedElements({ animationDuration: parseFloat(e.target.value) })}
                              className="w-full accent-accent h-1 bg-slate-200 rounded-full appearance-none cursor-pointer"
                             />
                          </div>
                          <div className="space-y-3">
                             <div className="flex justify-between items-center px-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Delay</label>
                                <span className="text-[9px] font-bold text-accent">{selectedEl?.animationDelay || 0}s</span>
                             </div>
                             <input 
                              type="range" step="0.1" min="0" max="5"
                              value={selectedEl?.animationDelay || 0}
                              onChange={(e) => updateSelectedElements({ animationDelay: parseFloat(e.target.value) })}
                              className="w-full accent-accent h-1 bg-slate-200 rounded-full appearance-none cursor-pointer"
                             />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">High-Fidelity Presets</p>
                      <div className="grid grid-cols-3 gap-2">
                        {ANIMATION_PRESETS.map(preset => (
                          <button 
                            key={preset.id} 
                            onClick={() => applyPreset(preset)} 
                            className={`p-4 rounded-2xl border text-[8px] font-black uppercase transition-all flex flex-col items-center gap-2 hover:translate-y-[-2px] hover:shadow-md ${isPresetActive(preset) ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.05]' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
                          >
                            <i className={`fas ${preset.icon} text-lg mb-1`}></i>
                            <span className="text-center leading-tight">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-24 px-8 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 opacity-60 flex flex-col items-center justify-center gap-6">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 shadow-inner"><i className="fas fa-wand-magic-sparkles text-2xl"></i></div>
                    <p className="text-[11px] text-slate-500 font-black leading-relaxed px-4 uppercase tracking-widest">Select composition layers to activate motion synthesis controls.</p>
                  </div>
                )}
              </div>
            ) : activeTab === 'ai' ? (
              <div className="flex flex-col h-full overflow-y-auto scrollbar-hide space-y-10">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Generative Intelligence</h4>
                </div>

                <div className="p-8 bg-purple-950 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
                   <i className="fas fa-sparkles absolute -top-4 -right-4 text-7xl opacity-10 rotate-12"></i>
                   <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-1">Atmosphere Synthesis</p>
                   <p className="text-xs font-bold mb-6 italic opacity-80">Design from abstract prompt</p>
                   <textarea 
                    value={bgPrompt} 
                    onChange={(e) => setBgPrompt(e.target.value)} 
                    placeholder="Describe the perfect backdrop..." 
                    className="w-full h-28 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white mb-6 outline-none focus:ring-1 focus:ring-purple-400 resize-none transition-all placeholder:text-white/20" 
                   />
                   
                   <div className="space-y-4 mb-8">
                     <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-1">Visual Style</p>
                     <div className="grid grid-cols-3 gap-2">
                       {BG_STYLES.map(style => (
                         <button 
                          key={style.id} 
                          onClick={() => setSelectedBgStyle(style)}
                          className={`p-3 rounded-xl border text-[8px] font-black uppercase transition-all flex flex-col items-center gap-1.5 hover:scale-105 active:scale-95 ${selectedBgStyle.id === style.id ? 'bg-white text-purple-900 border-white' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                         >
                            <i className={`fas ${style.icon} text-[10px]`}></i>
                            <span className="truncate w-full text-center">{style.label}</span>
                         </button>
                       ))}
                     </div>
                   </div>

                   <button 
                    onClick={() => handleGenerateBg()} 
                    disabled={generatingBg || !bgPrompt} 
                    className="w-full py-5 bg-white text-purple-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-[0.98] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                   >
                     {generatingBg ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic"></i>}
                     Synthesize Background
                   </button>
                </div>

                {aiSuggestions.length > 0 && (
                  <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center gap-2 px-2">
                       <i className="fas fa-sparkles text-purple-400 text-xs"></i>
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Magic Insights</h4>
                    </div>
                    <div className="space-y-3">
                      {aiSuggestions.map((suggestion, idx) => (
                        <button 
                          key={idx}
                          onClick={() => handleGenerateBg(suggestion)}
                          disabled={generatingBg}
                          className="w-full text-left p-5 bg-white border border-slate-100 rounded-2xl hover:border-purple-200 hover:shadow-lg hover:shadow-purple-500/5 transition-all group relative overflow-hidden hover:translate-x-1"
                        >
                           <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <i className="fas fa-arrow-right text-purple-400 text-[10px]"></i>
                           </div>
                           <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic pr-4">"{suggestion}"</p>
                           <div className="mt-3 flex items-center gap-2">
                              <span className="text-[8px] font-black uppercase tracking-widest text-purple-400">Contextual Match</span>
                           </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] shadow-inner text-center space-y-4">
                   <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-300">
                      <i className="fas fa-brain"></i>
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold leading-relaxed px-4">Lumina AI analyzes your canvas elements to suggest backgrounds that enhance your narrative.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-10 animate-in slide-in-from-right-4">
                 <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Geometric precision</h4>
                 </div>
                 {selectedEl ? (
                    <div className="space-y-8">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">X Position</label>
                             <input type="number" value={Math.round(selectedEl.x)} onChange={(e) => updateElement(selectedEl.id, { x: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-1 focus:ring-accent outline-none hover:border-slate-300 transition-colors" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Y Position</label>
                             <input type="number" value={Math.round(selectedEl.y)} onChange={(e) => updateElement(selectedEl.id, { y: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-1 focus:ring-accent outline-none hover:border-slate-300 transition-colors" />
                          </div>
                       </div>
                       <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] space-y-8 shadow-inner">
                          <div className="space-y-4">
                             <div className="flex justify-between items-center px-1">
                                <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-arrows-left-right"></i> Horizontal Skew</label>
                                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{selectedEl.skewX || 0}°</span>
                             </div>
                             <input type="range" min="-45" max="45" step="1" value={selectedEl.skewX || 0} onChange={(e) => updateElement(selectedEl.id, { skewX: parseInt(e.target.value) })} className="w-full accent-emerald-500 h-1 bg-slate-200 rounded-full appearance-none cursor-pointer" />
                          </div>
                          <div className="space-y-4">
                             <div className="flex justify-between items-center px-1">
                                <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-arrows-up-down"></i> Vertical Skew</label>
                                <span className="text-[10px] font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">{selectedEl.skewY || 0}°</span>
                             </div>
                             <input type="range" min="-45" max="45" step="1" value={selectedEl.skewY || 0} onChange={(e) => updateElement(selectedEl.id, { skewY: parseInt(e.target.value) })} className="w-full accent-amber-500 h-1 bg-slate-200 rounded-full appearance-none cursor-pointer" />
                          </div>
                       </div>
                       <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
                          <i className="fas fa-sparkles absolute -top-4 -right-4 text-6xl opacity-10"></i>
                          <p className="text-[10px] text-accent font-black uppercase tracking-widest mb-1">Canvas Engine</p>
                          <p className="text-xs font-bold mb-6 italic opacity-80">Syncing geometric state...</p>
                          <button onClick={() => setShowExportModal(true)} className="w-full py-4 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all">Deliver Selection</button>
                       </div>
                    </div>
                 ) : (
                    <div className="text-center py-20 px-8 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 opacity-60">
                       <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-inner"><i className="fas fa-mouse-pointer text-xl"></i></div>
                       <p className="text-[11px] text-slate-500 font-bold leading-relaxed">Select an element to access geometric and skew properties.</p>
                    </div>
                 )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
           <div className="w-full max-w-lg bg-white p-16 rounded-[4rem] shadow-2xl relative overflow-hidden">
              <button onClick={() => setShowExportModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors hover:rotate-90"><i className="fas fa-times text-xl"></i></button>
              <div className="w-20 h-20 bg-accent-soft rounded-[2.5rem] flex items-center justify-center text-accent mb-10 mx-auto shadow-inner"><i className="fas fa-file-export text-3xl"></i></div>
              <h3 className="text-4xl font-black text-center mb-2 tracking-tighter uppercase">Deliver Design</h3>
              <p className="text-center text-slate-400 text-sm mb-12 font-medium">Select professional-grade output parameters</p>
              {exporting ? (
                <div className="space-y-8 text-center py-10">
                  <LEDProgressBar progress={exportProgress} segments={24} className="max-w-xs mx-auto" />
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em]">Rasterizing Composition</p>
                    <p className="text-3xl font-black text-accent">{Math.round(exportProgress)}%</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { format: 'png', label: 'Lossless PNG', desc: 'Standard production raster', icon: 'fa-image' },
                    { format: 'pdf', label: 'Vector PDF', desc: 'Commercial print vectors', icon: 'fa-file-pdf' },
                    { format: 'webp', label: 'Hyper-WebP', desc: 'AI-optimized light format', icon: 'fa-bolt' },
                    { format: 'svg', label: 'Source SVG', desc: 'Layered vector data', icon: 'fa-code' },
                  ].map((opt) => (
                    <button key={opt.format} onClick={() => handleExport(opt.format as any)} className="group p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:border-accent hover:bg-accent-soft transition-all text-left flex items-center gap-8 hover:scale-[1.02] active:scale-[0.98]">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-accent group-hover:shadow-xl transition-all border border-slate-100"><i className={`fas ${opt.icon} text-lg`}></i></div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{opt.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
