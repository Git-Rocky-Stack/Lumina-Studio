/**
 * Enhanced AI Tools Component
 * Advanced AI features: prompt suggestions, style transfer, upscaling, smart crop, background removal, magic eraser, voice-to-prompt, AI history
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';

// ============================================================================
// AI PROMPT SUGGESTIONS
// ============================================================================

interface PromptSuggestion {
  text: string;
  category: 'style' | 'subject' | 'mood' | 'technical';
  confidence: number;
}

interface AIPromptSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onGenerate?: (prompt: string) => void;
  className?: string;
}

export const AIPromptSuggestions: React.FC<AIPromptSuggestionsProps> = ({
  value,
  onChange,
  placeholder = 'Describe your vision...',
  onGenerate,
  className = '',
}) => {
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generateSuggestions = useCallback(async (text: string) => {
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    // Simulate AI suggestions (in production, call actual AI service)
    await new Promise(r => setTimeout(r, 300));

    const baseSuggestions: PromptSuggestion[] = [
      { text: `${text}, cinematic lighting`, category: 'style', confidence: 0.95 },
      { text: `${text}, 8k ultra detailed`, category: 'technical', confidence: 0.9 },
      { text: `${text}, dramatic atmosphere`, category: 'mood', confidence: 0.88 },
      { text: `${text}, professional photography`, category: 'style', confidence: 0.85 },
      { text: `${text}, vibrant colors`, category: 'mood', confidence: 0.82 },
    ];

    setSuggestions(baseSuggestions);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value) generateSuggestions(value);
    }, 500);
    return () => clearTimeout(timer);
  }, [value, generateSuggestions]);

  const categoryColors = {
    style: 'bg-violet-100 text-violet-700',
    subject: 'bg-blue-100 text-blue-700',
    mood: 'bg-amber-100 text-amber-700',
    technical: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="w-full bg-white border border-slate-200 rounded-2xl p-4 pr-12 text-sm resize-none focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all min-h-[100px]"
        />
        {isLoading && (
          <div className="absolute right-4 top-4">
            <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && value && (
          <button
            onClick={() => onGenerate?.(value)}
            className="absolute right-3 bottom-3 p-2 bg-accent text-white rounded-xl hover:brightness-110 transition-all"
          >
            <i className="fas fa-sparkles" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-100">
            <span className="type-micro text-slate-400 px-2">AI Suggestions</span>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onChange(suggestion.text);
                  setShowSuggestions(false);
                }}
                className="w-full p-3 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 group"
              >
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${categoryColors[suggestion.category]}`}>
                  {suggestion.category}
                </span>
                <span className="text-sm text-slate-700 flex-1 group-hover:text-accent transition-colors">
                  {suggestion.text}
                </span>
                <span className="text-[10px] text-slate-400">
                  {Math.round(suggestion.confidence * 100)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// VOICE TO PROMPT
// ============================================================================

interface VoiceToPromptProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export const VoiceToPrompt: React.FC<VoiceToPromptProps> = ({ onTranscript, className = '' }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setTranscript(finalTranscript);
        onTranscript(finalTranscript);
      }
    };

    recognitionRef.current.start();
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={isListening ? stopListening : startListening}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          isListening
            ? 'bg-rose-500 text-white animate-pulse'
            : 'bg-slate-100 text-slate-500 hover:bg-accent hover:text-white'
        }`}
      >
        <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`} />
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-30" />
            <span className="absolute inset-[-4px] rounded-full border-2 border-rose-500/50 animate-pulse" />
          </>
        )}
      </button>
      {transcript && (
        <p className="text-sm text-slate-600 italic flex-1 animate-in fade-in">
          "{transcript}"
        </p>
      )}
    </div>
  );
};

// ============================================================================
// AI HISTORY
// ============================================================================

interface AIHistoryItem {
  id: string;
  prompt: string;
  result: string;
  type: 'image' | 'text' | 'video';
  timestamp: Date;
  liked?: boolean;
}

interface AIHistoryProps {
  items: AIHistoryItem[];
  onSelect: (item: AIHistoryItem) => void;
  onDelete?: (id: string) => void;
  onToggleLike?: (id: string) => void;
  className?: string;
}

export const AIHistory: React.FC<AIHistoryProps> = ({
  items,
  onSelect,
  onDelete,
  onToggleLike,
  className = '',
}) => {
  const [filter, setFilter] = useState<'all' | 'image' | 'text' | 'video' | 'liked'>('all');

  const filteredItems = items.filter((item) => {
    if (filter === 'liked') return item.liked;
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        {(['all', 'image', 'text', 'video', 'liked'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg type-micro whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-accent text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {f === 'liked' && <i className="fas fa-heart mr-1" />}
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-2 overflow-y-auto flex-1">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <i className="fas fa-clock-rotate-left text-2xl mb-2 opacity-50" />
            <p className="text-sm">No history yet</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className="group p-3 bg-white border border-slate-100 rounded-xl hover:border-accent/30 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.type === 'image' ? (
                    <img src={item.result} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <i className={`fas ${item.type === 'video' ? 'fa-video' : 'fa-align-left'} text-slate-400`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="type-label text-slate-700 truncate">{item.prompt}</p>
                  <p className="type-micro text-slate-400 mt-1">{formatTime(item.timestamp)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onToggleLike && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleLike(item.id); }}
                      className={`p-1.5 rounded-lg hover:bg-slate-100 ${item.liked ? 'text-rose-500' : 'text-slate-400'}`}
                    >
                      <i className={`fas fa-heart text-xs`} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                    >
                      <i className="fas fa-trash text-xs" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// STYLE TRANSFER PANEL
// ============================================================================

interface StyleTransferProps {
  sourceImage?: string;
  onTransfer: (styleId: string, sourceImage: string) => void;
  className?: string;
}

const stylePresets = [
  { id: 'oil-painting', name: 'Oil Painting', icon: 'fa-paintbrush', preview: 'linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #F4A460 100%)' },
  { id: 'watercolor', name: 'Watercolor', icon: 'fa-droplet', preview: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 50%, #FFB6C1 100%)' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: 'fa-robot', preview: 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 50%, #0000FF 100%)' },
  { id: 'anime', name: 'Anime', icon: 'fa-star', preview: 'linear-gradient(135deg, #FFB7C5 0%, #FF69B4 50%, #FF1493 100%)' },
  { id: 'sketch', name: 'Pencil Sketch', icon: 'fa-pencil', preview: 'linear-gradient(135deg, #2C2C2C 0%, #4A4A4A 50%, #808080 100%)' },
  { id: 'pop-art', name: 'Pop Art', icon: 'fa-palette', preview: 'linear-gradient(135deg, #FF0000 0%, #FFFF00 33%, #00FF00 66%, #0000FF 100%)' },
];

export const StyleTransferPanel: React.FC<StyleTransferProps> = ({
  sourceImage,
  onTransfer,
  className = '',
}) => {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTransfer = async () => {
    if (!selectedStyle || !sourceImage) return;
    setIsProcessing(true);
    // Simulate processing
    await new Promise(r => setTimeout(r, 2000));
    onTransfer(selectedStyle, sourceImage);
    setIsProcessing(false);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="type-body-sm font-semibold text-slate-700">Style Transfer</h4>
        <span className="type-micro text-slate-400">AI Powered</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stylePresets.map((style) => (
          <button
            key={style.id}
            onClick={() => setSelectedStyle(style.id)}
            className={`relative aspect-square rounded-xl overflow-hidden transition-all ${
              selectedStyle === style.id
                ? 'ring-2 ring-accent ring-offset-2 scale-105'
                : 'hover:scale-105 opacity-80 hover:opacity-100'
            }`}
          >
            <div
              className="absolute inset-0"
              style={{ background: style.preview }}
            />
            <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white">
              <i className={`fas ${style.icon} text-lg mb-1`} />
              <span className="type-micro">{style.name}</span>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleTransfer}
        disabled={!selectedStyle || !sourceImage || isProcessing}
        className="w-full py-3 bg-accent text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110 transition-all"
      >
        {isProcessing ? (
          <>
            <i className="fas fa-spinner fa-spin" />
            Transferring Style...
          </>
        ) : (
          <>
            <i className="fas fa-wand-magic-sparkles" />
            Apply Style Transfer
          </>
        )}
      </button>
    </div>
  );
};

// ============================================================================
// BACKGROUND REMOVAL
// ============================================================================

interface BackgroundRemovalProps {
  image?: string;
  onComplete: (result: string) => void;
  className?: string;
}

export const BackgroundRemoval: React.FC<BackgroundRemovalProps> = ({
  image,
  onComplete,
  className = '',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleRemove = async () => {
    if (!image) return;
    setIsProcessing(true);

    // Simulate AI processing
    await new Promise(r => setTimeout(r, 2500));

    // In production, this would call an actual API
    setPreview(image);
    setIsProcessing(false);
    onComplete(image);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="type-body-sm font-semibold text-slate-700">Background Removal</h4>
        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 type-micro rounded-full">
          AI Powered
        </span>
      </div>

      <div className="relative aspect-video bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23E5E7EB%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23E5E7EB%22%2F%3E%3C%2Fsvg%3E')] rounded-xl overflow-hidden border border-slate-200">
        {image ? (
          <img src={image} alt="Preview" className="w-full h-full object-contain" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <i className="fas fa-image text-2xl mb-2 opacity-50" />
              <p className="text-xs">Select an image</p>
            </div>
          </div>
        )}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-accent/30 border-t-accent rounded-full animate-spin mb-3" />
              <p className="type-body-sm font-semibold text-slate-700">Removing Background...</p>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleRemove}
        disabled={!image || isProcessing}
        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-110 transition-all"
      >
        <i className="fas fa-eraser" />
        Remove Background
      </button>
    </div>
  );
};

// ============================================================================
// SMART CROP
// ============================================================================

interface SmartCropProps {
  image?: string;
  onCrop: (cropData: { x: number; y: number; width: number; height: number }) => void;
  className?: string;
}

const cropPresets = [
  { id: '1:1', label: 'Square', ratio: 1 },
  { id: '16:9', label: 'Landscape', ratio: 16/9 },
  { id: '9:16', label: 'Portrait', ratio: 9/16 },
  { id: '4:3', label: 'Standard', ratio: 4/3 },
  { id: '3:2', label: 'Photo', ratio: 3/2 },
];

export const SmartCrop: React.FC<SmartCropProps> = ({
  image,
  onCrop,
  className = '',
}) => {
  const [selectedPreset, setSelectedPreset] = useState('1:1');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedCrop, setSuggestedCrop] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const analyzeForSmartCrop = async () => {
    if (!image) return;
    setIsAnalyzing(true);

    // Simulate AI analysis
    await new Promise(r => setTimeout(r, 1500));

    // Mock smart crop suggestion (would be AI-determined in production)
    setSuggestedCrop({ x: 10, y: 10, width: 80, height: 80 });
    setIsAnalyzing(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="type-body-sm font-semibold text-slate-700">Smart Crop</h4>
        <button
          onClick={analyzeForSmartCrop}
          disabled={!image || isAnalyzing}
          className="type-micro text-accent hover:underline disabled:opacity-50"
        >
          {isAnalyzing ? 'Analyzing...' : 'AI Suggest'}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {cropPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => setSelectedPreset(preset.id)}
            className={`px-3 py-1.5 rounded-lg type-label transition-all ${
              selectedPreset === preset.id
                ? 'bg-accent text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {suggestedCrop && (
        <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl">
          <div className="flex items-center gap-2 text-accent mb-2">
            <i className="fas fa-lightbulb text-sm" />
            <span className="type-label">AI Suggestion</span>
          </div>
          <p className="type-caption text-slate-600">
            Focus detected at center. Recommended crop maintains subject visibility.
          </p>
          <button
            onClick={() => onCrop(suggestedCrop)}
            className="mt-2 type-label text-accent hover:underline"
          >
            Apply Suggestion
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAGIC ERASER
// ============================================================================

interface MagicEraserProps {
  image?: string;
  onErase: (mask: ImageData) => void;
  className?: string;
}

export const MagicEraser: React.FC<MagicEraserProps> = ({
  image,
  onErase,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvasRef.current!.width = img.width;
      canvasRef.current!.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = image;
  }, [image]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleProcess = async () => {
    if (!canvasRef.current) return;
    setIsProcessing(true);

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
      await new Promise(r => setTimeout(r, 2000)); // Simulate AI processing
      onErase(imageData);
    }

    setIsProcessing(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="type-body-sm font-semibold text-slate-700">Magic Eraser</h4>
        <span className="type-caption text-slate-400">Paint over objects to remove</span>
      </div>

      <div className="relative aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
        <canvas
          ref={canvasRef}
          onMouseDown={() => setIsDrawing(true)}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
          onMouseMove={handleMouseMove}
          className="w-full h-full object-contain cursor-crosshair"
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mb-3" />
              <p className="type-body-sm font-semibold text-slate-700">AI Processing...</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="type-label text-slate-600">Brush Size</span>
          <span className="type-caption text-slate-400">{brushSize}px</span>
        </div>
        <input
          type="range"
          min="5"
          max="50"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="w-full accent-accent"
        />
      </div>

      <button
        onClick={handleProcess}
        disabled={isProcessing}
        className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-110 transition-all"
      >
        <i className="fas fa-wand-magic-sparkles" />
        {isProcessing ? 'Processing...' : 'Apply Magic Eraser'}
      </button>
    </div>
  );
};

export default {
  AIPromptSuggestions,
  VoiceToPrompt,
  AIHistory,
  StyleTransferPanel,
  BackgroundRemoval,
  SmartCrop,
  MagicEraser,
};
