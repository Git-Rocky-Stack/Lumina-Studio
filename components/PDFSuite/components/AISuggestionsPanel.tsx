// ============================================
// AISuggestionsPanel Component
// AI-powered annotation suggestions with accept/dismiss actions
// ============================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Check,
  X,
  Lightbulb,
  MessageSquare,
  Languages,
  TrendingUp,
  Wand2,
} from 'lucide-react';
import type { AISuggestion } from '../hooks/useEnhancedAnnotations';

interface AISuggestionsPanelProps {
  suggestions: AISuggestion[];
  isGenerating: boolean;
  onAccept: (suggestionId: string) => void;
  onDismiss: (suggestionId: string) => void;
  onGenerate: (annotationId: string) => void;
  selectedAnnotationId?: string;
  className?: string;
}

const SUGGESTION_TYPE_CONFIG = {
  grammar: {
    icon: MessageSquare,
    label: 'Grammar',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  clarity: {
    icon: Lightbulb,
    label: 'Clarity',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  tone: {
    icon: TrendingUp,
    label: 'Tone',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
  },
  summary: {
    icon: MessageSquare,
    label: 'Summary',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  translation: {
    icon: Languages,
    label: 'Translation',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
  },
  improvement: {
    icon: Wand2,
    label: 'Improvement',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
};

export const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
  suggestions,
  isGenerating,
  onAccept,
  onDismiss,
  onGenerate,
  selectedAnnotationId,
  className = '',
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'dismissed'>('pending');

  // Filter suggestions
  const filteredSuggestions =
    filterStatus === 'all'
      ? suggestions
      : suggestions.filter((s) => s.status === filterStatus);

  // Pending count
  const pendingCount = suggestions.filter((s) => s.status === 'pending').length;

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700">AI Suggestions</h3>
              {pendingCount > 0 && (
                <p className="text-xs text-slate-500">{pendingCount} pending</p>
              )}
            </div>
          </div>

          {selectedAnnotationId && (
            <button
              onClick={() => onGenerate(selectedAnnotationId)}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(['all', 'pending', 'accepted', 'dismissed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterStatus === status
                  ? 'bg-white text-slate-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Generating State */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-6 border-b border-slate-100"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 opacity-20"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Analyzing content...</p>
              <p className="text-xs text-slate-500">AI is generating suggestions</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((suggestion) => (
              <motion.div
                key={suggestion.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="border-b border-slate-100"
              >
                <SuggestionCard
                  suggestion={suggestion}
                  isExpanded={expandedId === suggestion.id}
                  onToggleExpand={() =>
                    setExpandedId(expandedId === suggestion.id ? null : suggestion.id)
                  }
                  onAccept={() => onAccept(suggestion.id)}
                  onDismiss={() => onDismiss(suggestion.id)}
                />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-3">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                {filterStatus === 'pending'
                  ? 'No pending suggestions'
                  : `No ${filterStatus} suggestions`}
              </p>
              <p className="text-xs text-slate-500 max-w-[200px]">
                Select an annotation and click Generate to get AI suggestions
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Stats */}
      {filteredSuggestions.length > 0 && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">
              {filteredSuggestions.length} suggestion
              {filteredSuggestions.length !== 1 ? 's' : ''}
            </span>
            <span className="text-slate-500">Powered by AI</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// SuggestionCard Component
// ============================================

interface SuggestionCardProps {
  suggestion: AISuggestion;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAccept: () => void;
  onDismiss: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  isExpanded,
  onToggleExpand,
  onAccept,
  onDismiss,
}) => {
  const config = SUGGESTION_TYPE_CONFIG[suggestion.type];
  const Icon = config.icon;

  // Confidence color
  const confidenceColor =
    suggestion.confidence >= 0.8
      ? 'text-emerald-600'
      : suggestion.confidence >= 0.6
      ? 'text-amber-600'
      : 'text-slate-500';

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold ${config.color}`}>
              {config.label}
            </span>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <span className={`text-xs font-medium ${confidenceColor}`}>
                {Math.round(suggestion.confidence * 100)}% confident
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">{suggestion.reason}</p>
        </div>
      </div>

      {/* Comparison */}
      <div className="space-y-2 mb-3">
        {/* Original */}
        <div
          className={`p-3 rounded-lg border ${
            suggestion.status === 'pending'
              ? 'bg-rose-50 border-rose-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <p className="text-xs font-medium text-slate-500 mb-1">Original</p>
          <p className="text-sm text-slate-700 leading-relaxed">
            {isExpanded
              ? suggestion.originalText
              : suggestion.originalText.slice(0, 60) +
                (suggestion.originalText.length > 60 ? '...' : '')}
          </p>
        </div>

        {/* Suggested */}
        <div
          className={`p-3 rounded-lg border ${
            suggestion.status === 'accepted'
              ? 'bg-emerald-50 border-emerald-200'
              : suggestion.status === 'pending'
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <p className="text-xs font-medium text-emerald-600 mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Suggested
          </p>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {isExpanded
              ? suggestion.suggestedText
              : suggestion.suggestedText.slice(0, 60) +
                (suggestion.suggestedText.length > 60 ? '...' : '')}
          </p>
        </div>
      </div>

      {/* Expand Toggle */}
      {(suggestion.originalText.length > 60 || suggestion.suggestedText.length > 60) && (
        <button
          onClick={onToggleExpand}
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mb-3"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}

      {/* Actions */}
      {suggestion.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <X className="w-4 h-4" />
            Dismiss
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Check className="w-4 h-4" />
            Accept
          </button>
        </div>
      )}

      {/* Status Badge */}
      {suggestion.status !== 'pending' && (
        <div
          className={`flex items-center justify-center gap-2 py-2 rounded-lg ${
            suggestion.status === 'accepted'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {suggestion.status === 'accepted' ? (
            <>
              <Check className="w-4 h-4" />
              <span className="text-xs font-medium">Accepted</span>
            </>
          ) : (
            <>
              <X className="w-4 h-4" />
              <span className="text-xs font-medium">Dismissed</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AISuggestionsPanel;
