// =============================================
// Style Presets Panel Component
// Quick application of saved design styles
// =============================================

import React, { useState, useEffect } from 'react';
import {
  Palette,
  Heart,
  Plus,
  Check,
  Trash2,
  ChevronRight,
  Loader2,
  Star,
  Sparkles,
} from 'lucide-react';
import { aiDesignAssistant, StylePreset } from '../../services/aiDesignAssistantService';

// =============================================
// Types
// =============================================

interface StylePresetsPanelProps {
  onApplyPreset?: (styleData: StylePreset['style_data']) => void;
  onSaveCurrentStyle?: () => StylePreset['style_data'];
  className?: string;
}

// =============================================
// Default Presets
// =============================================

const defaultPresets: Omit<StylePreset, 'id' | 'user_id'>[] = [
  {
    name: 'Modern Minimal',
    description: 'Clean, contemporary design with subtle shadows',
    style_data: {
      colors: ['#ffffff', '#f3f4f6', '#111827', '#6366f1'],
      fonts: ['Inter', 'SF Pro Display'],
      spacing: { small: 8, medium: 16, large: 24 },
      borderRadius: 12,
      shadows: [{ blur: 10, offset: 4, color: 'rgba(0,0,0,0.1)' }],
    },
    is_favorite: false,
    usage_count: 0,
  },
  {
    name: 'Bold & Vibrant',
    description: 'Eye-catching colors with strong contrasts',
    style_data: {
      colors: ['#f97316', '#8b5cf6', '#ec4899', '#14b8a6'],
      fonts: ['Poppins', 'Montserrat'],
      spacing: { small: 12, medium: 20, large: 32 },
      borderRadius: 16,
      shadows: [{ blur: 20, offset: 8, color: 'rgba(0,0,0,0.15)' }],
    },
    is_favorite: false,
    usage_count: 0,
  },
  {
    name: 'Elegant Dark',
    description: 'Sophisticated dark theme with gold accents',
    style_data: {
      colors: ['#18181b', '#27272a', '#f5f5f5', '#d4af37'],
      fonts: ['Playfair Display', 'Lato'],
      spacing: { small: 8, medium: 16, large: 24 },
      borderRadius: 8,
      shadows: [{ blur: 16, offset: 6, color: 'rgba(0,0,0,0.3)' }],
    },
    is_favorite: false,
    usage_count: 0,
  },
  {
    name: 'Soft Pastel',
    description: 'Gentle, calming colors for friendly designs',
    style_data: {
      colors: ['#fef3c7', '#fce7f3', '#dbeafe', '#d1fae5'],
      fonts: ['Nunito', 'Quicksand'],
      spacing: { small: 10, medium: 18, large: 28 },
      borderRadius: 20,
      shadows: [{ blur: 8, offset: 2, color: 'rgba(0,0,0,0.05)' }],
    },
    is_favorite: false,
    usage_count: 0,
  },
];

// =============================================
// Style Presets Panel Component
// =============================================

export const StylePresetsPanel: React.FC<StylePresetsPanelProps> = ({
  onApplyPreset,
  onSaveCurrentStyle,
  className = '',
}) => {
  const [presets, setPresets] = useState<StylePreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingNew, setSavingNew] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // =============================================
  // Load Presets
  // =============================================

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    setIsLoading(true);
    try {
      const userPresets = await aiDesignAssistant.getStylePresets();
      setPresets(userPresets);
    } catch (err) {
      console.error('Failed to load presets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================
  // Actions
  // =============================================

  const handleApply = async (preset: StylePreset | Omit<StylePreset, 'id' | 'user_id'>) => {
    if ('id' in preset && preset.id) {
      setApplyingId(preset.id);
      try {
        const styleData = await aiDesignAssistant.applyStylePreset(preset.id);
        if (styleData) {
          onApplyPreset?.(styleData);
        }
      } catch (err) {
        console.error('Failed to apply preset:', err);
      } finally {
        setApplyingId(null);
      }
    } else {
      onApplyPreset?.(preset.style_data);
    }
  };

  const handleSaveNew = async () => {
    if (!newPresetName.trim() || !onSaveCurrentStyle) return;

    setSavingNew(true);
    try {
      const currentStyle = onSaveCurrentStyle();
      await aiDesignAssistant.saveStylePreset(newPresetName, currentStyle);
      setNewPresetName('');
      loadPresets();
    } catch (err) {
      console.error('Failed to save preset:', err);
    } finally {
      setSavingNew(false);
    }
  };

  // =============================================
  // Render
  // =============================================

  const displayedDefaults = showAll ? defaultPresets : defaultPresets.slice(0, 2);

  return (
    <div className={`style-presets-panel ${className}`}>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-zinc-200">Style Presets</span>
          </div>
          {onSaveCurrentStyle && (
            <button
              onClick={() => setSavingNew(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg
                bg-violet-500/10 text-violet-400 hover:bg-violet-500/20
                transition-colors"
            >
              <Plus className="w-3 h-3" />
              Save Current
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-3">
          {/* Save New Preset Form */}
          {savingNew && onSaveCurrentStyle && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="Preset name..."
                className="flex-1 px-2 py-1 text-sm bg-transparent border-none
                  text-zinc-200 placeholder-zinc-500 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveNew}
                disabled={!newPresetName.trim()}
                className="p-1.5 rounded-lg bg-violet-500 text-white
                  hover:bg-violet-600 disabled:opacity-50
                  transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setSavingNew(false);
                  setNewPresetName('');
                }}
                className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400
                  transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* User Presets */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            </div>
          ) : presets.length > 0 ? (
            <div className="space-y-2">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Your Presets
              </span>
              {presets.map((preset) => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  onApply={() => handleApply(preset)}
                  isApplying={applyingId === preset.id}
                />
              ))}
            </div>
          ) : null}

          {/* Default Presets */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Templates
            </span>
            {displayedDefaults.map((preset, index) => (
              <PresetCard
                key={index}
                preset={preset}
                onApply={() => handleApply(preset)}
                isApplying={false}
              />
            ))}
            {defaultPresets.length > 2 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full flex items-center justify-center gap-1 py-2
                  text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                {showAll ? 'Show Less' : `Show ${defaultPresets.length - 2} More`}
                <ChevronRight className={`w-3 h-3 transition-transform ${showAll ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================
// Preset Card Component
// =============================================

interface PresetCardProps {
  preset: StylePreset | Omit<StylePreset, 'id' | 'user_id'>;
  onApply: () => void;
  isApplying: boolean;
}

const PresetCard: React.FC<PresetCardProps> = ({ preset, onApply, isApplying }) => {
  return (
    <div
      className="group relative p-3 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/50
        border border-zinc-700/30 hover:border-zinc-700/50
        cursor-pointer transition-all duration-200"
      onClick={onApply}
    >
      {/* Color Preview */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex -space-x-1">
          {preset.style_data.colors.slice(0, 4).map((color, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full border-2 border-zinc-800"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        {'is_favorite' in preset && preset.is_favorite && (
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
        )}
      </div>

      {/* Info */}
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-zinc-200">{preset.name}</h4>
          {'usage_count' in preset && preset.usage_count > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-zinc-500">
              <Star className="w-3 h-3" />
              {preset.usage_count}
            </span>
          )}
        </div>
        {preset.description && (
          <p className="text-xs text-zinc-500 mt-0.5">{preset.description}</p>
        )}
      </div>

      {/* Font Preview */}
      <div className="flex gap-2 mt-2">
        {preset.style_data.fonts.map((font, i) => (
          <span
            key={i}
            className="px-2 py-0.5 text-xs rounded bg-zinc-700/50 text-zinc-400"
            style={{ fontFamily: font }}
          >
            {font}
          </span>
        ))}
      </div>

      {/* Apply Button */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg
            bg-violet-500 text-white hover:bg-violet-600
            transition-colors"
          disabled={isApplying}
        >
          {isApplying ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-3 h-3" />
              Apply
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default StylePresetsPanel;
