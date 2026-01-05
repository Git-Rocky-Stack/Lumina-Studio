// =============================================
// AI Suggestions Panel Component
// Proactive design improvement suggestions
// =============================================

import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  ArrowRight,
  X,
  Check,
  Sparkles,
  Palette,
  Layout,
  Accessibility,
  TrendingUp,
  RefreshCw,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { aiDesignAssistant, DesignSuggestion, DesignAction } from '../../services/aiDesignAssistantService';

// =============================================
// Types
// =============================================

interface AISuggestionsPanelProps {
  projectId?: string;
  onApplySuggestion?: (actions: DesignAction[]) => void;
  className?: string;
}

const suggestionTypeConfig = {
  improvement: {
    icon: Sparkles,
    color: 'violet',
    label: 'Improvement',
  },
  alternative: {
    icon: Palette,
    color: 'blue',
    label: 'Alternative',
  },
  accessibility: {
    icon: Accessibility,
    color: 'emerald',
    label: 'Accessibility',
  },
  trend: {
    icon: TrendingUp,
    color: 'amber',
    label: 'Trending',
  },
};

// =============================================
// AI Suggestions Panel Component
// =============================================

export const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
  projectId,
  onApplySuggestion,
  className = '',
}) => {
  const [suggestions, setSuggestions] = useState<DesignSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // =============================================
  // Load Suggestions
  // =============================================

  useEffect(() => {
    loadSuggestions();
  }, [projectId]);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const data = await aiDesignAssistant.getSuggestions(projectId);
      setSuggestions(data);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSuggestions = async () => {
    setIsRefreshing(true);
    await loadSuggestions();
    setIsRefreshing(false);
  };

  // =============================================
  // Actions
  // =============================================

  const handleApply = async (suggestion: DesignSuggestion) => {
    setApplyingId(suggestion.id);
    try {
      const actions = await aiDesignAssistant.applySuggestion(suggestion.id);
      if (actions.length > 0) {
        onApplySuggestion?.(actions);
      }
      // Remove from list after applying
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (err) {
      console.error('Failed to apply suggestion:', err);
    } finally {
      setApplyingId(null);
    }
  };

  const handleDismiss = async (suggestionId: string) => {
    try {
      await aiDesignAssistant.dismissSuggestion(suggestionId);
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (err) {
      console.error('Failed to dismiss suggestion:', err);
    }
  };

  // =============================================
  // Render
  // =============================================

  if (suggestions.length === 0 && !isLoading) {
    return null; // Don't show panel if no suggestions
  }

  return (
    <div className={`ai-suggestions-panel ${className}`}>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-zinc-800
            cursor-pointer hover:bg-zinc-800/30 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-amber-500/10">
              <Lightbulb className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-sm font-medium text-zinc-200">AI Suggestions</span>
            {suggestions.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-violet-500/20 text-violet-400">
                {suggestions.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                refreshSuggestions();
              }}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg hover:bg-zinc-700/50 text-zinc-400
                hover:text-zinc-300 disabled:opacity-50 transition-colors"
              title="Refresh suggestions"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            )}
          </div>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No suggestions available</p>
                <p className="text-xs text-zinc-600 mt-1">
                  AI will suggest improvements as you design
                </p>
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  isExpanded={expandedId === suggestion.id}
                  isApplying={applyingId === suggestion.id}
                  onToggle={() => setExpandedId(
                    expandedId === suggestion.id ? null : suggestion.id
                  )}
                  onApply={() => handleApply(suggestion)}
                  onDismiss={() => handleDismiss(suggestion.id)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================
// Suggestion Card Component
// =============================================

interface SuggestionCardProps {
  suggestion: DesignSuggestion;
  isExpanded: boolean;
  isApplying: boolean;
  onToggle: () => void;
  onApply: () => void;
  onDismiss: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  isExpanded,
  isApplying,
  onToggle,
  onApply,
  onDismiss,
}) => {
  const config = suggestionTypeConfig[suggestion.suggestion_type];
  const Icon = config.icon;

  const colorClasses = {
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <div
      className={`
        group rounded-xl border transition-all duration-200
        ${isExpanded
          ? 'bg-zinc-800/50 border-zinc-700/50'
          : 'bg-zinc-800/30 border-zinc-700/30 hover:bg-zinc-800/40'
        }
      `}
    >
      {/* Header */}
      <div
        className="flex items-start gap-3 p-3 cursor-pointer"
        onClick={onToggle}
      >
        <div className={`p-1.5 rounded-lg ${colorClasses[config.color as keyof typeof colorClasses]}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-zinc-200">
            {suggestion.suggestion_data.title}
          </h4>
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
            {suggestion.suggestion_data.description}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-500">
            {Math.round(suggestion.confidence_score * 100)}%
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Preview (if available) */}
          {suggestion.suggestion_data.preview && (
            <div className="relative rounded-lg overflow-hidden bg-zinc-900 border border-zinc-700/50">
              <div className="aspect-video flex items-center justify-center">
                <Eye className="w-6 h-6 text-zinc-600" />
                <span className="ml-2 text-sm text-zinc-500">Preview</span>
              </div>
            </div>
          )}

          {/* Actions Count */}
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Layout className="w-3.5 h-3.5" />
            <span>
              {suggestion.suggestion_data.actions.length} change{suggestion.suggestion_data.actions.length !== 1 ? 's' : ''} will be applied
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
              disabled={isApplying}
              className="
                flex-1 flex items-center justify-center gap-1.5 px-3 py-2
                rounded-lg bg-violet-500 text-white text-sm
                hover:bg-violet-600 disabled:opacity-50
                transition-colors
              "
            >
              {isApplying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Apply
                </>
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="
                px-3 py-2 rounded-lg text-sm
                bg-zinc-700/50 text-zinc-400 hover:text-zinc-300
                hover:bg-zinc-700 transition-colors
              "
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISuggestionsPanel;
