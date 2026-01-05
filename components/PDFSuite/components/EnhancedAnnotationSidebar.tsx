// ============================================
// EnhancedAnnotationSidebar Component
// Unified sidebar containing all enhanced annotation features
// ============================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Type,
  Mic,
  Sparkles,
  LayoutTemplate,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Components
import { AnnotationLayersPanel } from './AnnotationLayersPanel';
import { RichTextToolbar } from './RichTextToolbar';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { AISuggestionsPanel } from './AISuggestionsPanel';
import { AnnotationTemplatesGallery } from './AnnotationTemplatesGallery';

// Types
import type {
  AnnotationLayer,
  EnhancedAnnotation,
  VoiceNote,
  AISuggestion,
  AnnotationTemplate,
} from '../hooks/useEnhancedAnnotations';

type TabId = 'layers' | 'richtext' | 'voice' | 'ai' | 'templates';

interface EnhancedAnnotationSidebarProps {
  isOpen: boolean;
  onToggle: () => void;

  // Layers
  layers: AnnotationLayer[];
  activeLayerId: string | null;
  onLayerCreate: (name: string, color?: string) => void;
  onLayerUpdate: (id: string, updates: Partial<AnnotationLayer>) => void;
  onLayerDelete: (id: string) => void;
  onLayerReorder: (layerIds: string[]) => void;
  onLayerSelect: (id: string | null) => void;

  // Rich Text
  selectedAnnotation: EnhancedAnnotation | null;
  onRichTextFormat: (formatting: Record<string, unknown>) => void;

  // Voice Notes
  voiceNotes: VoiceNote[];
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDeleteVoiceNote: (id: string) => void;
  onTranscribe: (id: string) => void;

  // AI Suggestions
  aiSuggestions: AISuggestion[];
  isGeneratingAI: boolean;
  onGenerateSuggestions: (annotationId: string) => void;
  onAcceptSuggestion: (id: string) => void;
  onDismissSuggestion: (id: string) => void;

  // Templates
  templates: AnnotationTemplate[];
  selectedAnnotations: EnhancedAnnotation[];
  currentPage: number;
  onApplyTemplate: (templateId: string, pageNumber: number) => void;
  onSaveTemplate: (
    name: string,
    description: string,
    annotationIds: string[],
    category?: 'review' | 'legal' | 'educational' | 'technical' | 'custom'
  ) => AnnotationTemplate;
  onDeleteTemplate: (id: string) => void;

  className?: string;
}

const TABS: { id: TabId; label: string; icon: typeof Layers }[] = [
  { id: 'layers', label: 'Layers', icon: Layers },
  { id: 'richtext', label: 'Rich Text', icon: Type },
  { id: 'voice', label: 'Voice', icon: Mic },
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
];

export const EnhancedAnnotationSidebar: React.FC<EnhancedAnnotationSidebarProps> = ({
  isOpen,
  onToggle,
  layers,
  activeLayerId,
  onLayerCreate,
  onLayerUpdate,
  onLayerDelete,
  onLayerReorder,
  onLayerSelect,
  selectedAnnotation,
  onRichTextFormat,
  voiceNotes,
  isRecording,
  onStartRecording,
  onStopRecording,
  onDeleteVoiceNote,
  onTranscribe,
  aiSuggestions,
  isGeneratingAI,
  onGenerateSuggestions,
  onAcceptSuggestion,
  onDismissSuggestion,
  templates,
  selectedAnnotations,
  currentPage,
  onApplyTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('layers');
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  return (
    <>
      <div
        className={`relative flex flex-col bg-white border-l border-slate-200 transition-all duration-300 ${
          isOpen ? 'w-80' : 'w-0'
        } ${className}`}
      >
        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-white border border-slate-200 rounded-l-lg shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors z-10"
        >
          {isOpen ? (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isOpen && (
          <>
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTab === 'layers' && (
                  <motion.div
                    key="layers"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <AnnotationLayersPanel
                      layers={layers}
                      activeLayerId={activeLayerId}
                      onCreateLayer={onLayerCreate}
                      onUpdateLayer={onLayerUpdate}
                      onDeleteLayer={onLayerDelete}
                      onReorderLayers={onLayerReorder}
                      onSelectLayer={onLayerSelect}
                    />
                  </motion.div>
                )}

                {activeTab === 'richtext' && (
                  <motion.div
                    key="richtext"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full p-4"
                  >
                    {selectedAnnotation?.type === 'freeText' ||
                    selectedAnnotation?.type === 'richText' ? (
                      <RichTextToolbar
                        initialFormatting={selectedAnnotation.richContent?.formatting}
                        onFormatChange={onRichTextFormat}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Type className="w-12 h-12 text-slate-200 mb-3" />
                        <p className="text-sm font-medium text-slate-600">
                          Select a text annotation
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Rich text formatting will appear here
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'voice' && (
                  <motion.div
                    key="voice"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <VoiceNoteRecorder
                      annotationId={selectedAnnotation?.id}
                      isRecording={isRecording}
                      voiceNotes={voiceNotes.filter(
                        (vn) => vn.annotationId === selectedAnnotation?.id
                      )}
                      onStartRecording={onStartRecording}
                      onStopRecording={onStopRecording}
                      onDeleteVoiceNote={onDeleteVoiceNote}
                      onTranscribe={onTranscribe}
                    />
                  </motion.div>
                )}

                {activeTab === 'ai' && (
                  <motion.div
                    key="ai"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <AISuggestionsPanel
                      suggestions={aiSuggestions}
                      isGenerating={isGeneratingAI}
                      onAccept={onAcceptSuggestion}
                      onDismiss={onDismissSuggestion}
                      onGenerate={onGenerateSuggestions}
                      selectedAnnotationId={selectedAnnotation?.id}
                    />
                  </motion.div>
                )}

                {activeTab === 'templates' && (
                  <motion.div
                    key="templates"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <AnnotationTemplatesGallery
                      templates={templates}
                      selectedAnnotationIds={selectedAnnotations.map((a) => a.id)}
                      onApplyTemplate={onApplyTemplate}
                      onSaveAsTemplate={onSaveTemplate}
                      onDeleteTemplate={onDeleteTemplate}
                      currentPage={currentPage}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* Full Template Gallery Modal */}
      {showTemplateGallery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <AnnotationTemplatesGallery
              templates={templates}
              selectedAnnotationIds={selectedAnnotations.map((a) => a.id)}
              onApplyTemplate={(templateId, page) => {
                onApplyTemplate(templateId, page);
                setShowTemplateGallery(false);
              }}
              onSaveAsTemplate={onSaveTemplate}
              onDeleteTemplate={onDeleteTemplate}
              currentPage={currentPage}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedAnnotationSidebar;
