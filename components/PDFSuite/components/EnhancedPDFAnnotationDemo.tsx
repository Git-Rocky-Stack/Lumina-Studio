// ============================================
// EnhancedPDFAnnotationDemo Component
// Example integration of all enhanced annotation components
// ============================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  MessageSquare,
  Sparkles,
  Mic,
  Layout,
  Search,
  Users,
  X,
} from 'lucide-react';

// Import enhanced annotation system
import { useEnhancedAnnotations } from '../hooks/useEnhancedAnnotations';
import { AnnotationLayersPanel } from './AnnotationLayersPanel';
import { RichTextToolbar } from './RichTextToolbar';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { AISuggestionsPanel } from './AISuggestionsPanel';
import { AnnotationTemplatesGallery } from './AnnotationTemplatesGallery';
import { CollaboratorPresence } from './CollaboratorPresence';
import { AnnotationSearchFilter } from './AnnotationSearchFilter';
import { EnhancedCommentThreads } from './EnhancedCommentThreads';

/**
 * Demo component showing integration of enhanced annotation features
 * This is an example implementation - adapt to your PDFViewer structure
 */
export const EnhancedPDFAnnotationDemo: React.FC = () => {
  // Mock user data (replace with your auth system)
  const currentUser = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
  };

  // Mock PDF state (replace with your actual PDF state)
  const [currentPage] = useState(1);

  // Initialize enhanced annotations
  const enhancedAnnotations = useEnhancedAnnotations({
    userId: currentUser.id,
    userName: currentUser.name,
    enableAI: true,
    enableCollaboration: true,
    onAnnotationChange: (annotations) => {
      console.log('Annotations updated:', annotations.length);
      // TODO: Sync to backend
    },
    onLayerChange: (layers) => {
      console.log('Layers updated:', layers.length);
      // TODO: Sync to backend
    },
  });

  // UI state
  const [leftSidebarTab, setLeftSidebarTab] = useState<
    'layers' | 'search' | 'templates'
  >('layers');
  const [rightSidebarTab, setRightSidebarTab] = useState<
    'comments' | 'ai' | 'voice'
  >('comments');
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(
    null
  );

  // Rich text format state (for active text annotation)
  const [richTextFormat, setRichTextFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    fontSize: 12,
    fontFamily: 'Inter, sans-serif',
    textColor: '#000000',
    backgroundColor: 'transparent',
    alignment: 'left' as const,
    listType: null as 'bullet' | 'numbered' | null,
  });

  // Compute annotation count by layer
  const annotationCountByLayer = React.useMemo(() => {
    const counts: Record<string, number> = {};
    enhancedAnnotations.annotations.forEach((ann) => {
      const layerId = ann.layerId || 'default';
      counts[layerId] = (counts[layerId] || 0) + 1;
    });
    return counts;
  }, [enhancedAnnotations.annotations]);

  // Get unique authors
  const availableAuthors = React.useMemo(() => {
    const authors = new Set(
      enhancedAnnotations.annotations.map((a) => a.author).filter(Boolean)
    );
    return Array.from(authors) as string[];
  }, [enhancedAnnotations.annotations]);

  // Get layers for filter
  const availableLayers = React.useMemo(() => {
    return enhancedAnnotations.layers.map((l) => ({
      id: l.id,
      name: l.name,
      color: l.color,
    }));
  }, [enhancedAnnotations.layers]);

  // Handle annotation selection
  const handleAnnotationSelect = (id: string) => {
    setSelectedAnnotationId(id);
    enhancedAnnotations.selectAnnotation(id);
  };

  // Get selected annotation
  const selectedAnnotation = selectedAnnotationId
    ? enhancedAnnotations.annotations.find((a) => a.id === selectedAnnotationId)
    : null;

  // Get voice notes for selected annotation
  const selectedAnnotationVoiceNotes = selectedAnnotation
    ? enhancedAnnotations.voiceNotes.filter(
        (vn) => vn.annotationId === selectedAnnotation.id
      )
    : [];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left Sidebar */}
      <AnimatePresence>
        {showLeftSidebar && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            className="w-80 bg-white border-r border-slate-200 flex flex-col"
          >
            {/* Tabs */}
            <div className="flex-shrink-0 flex border-b border-slate-200">
              <SidebarTab
                icon={Layers}
                label="Layers"
                isActive={leftSidebarTab === 'layers'}
                onClick={() => setLeftSidebarTab('layers')}
              />
              <SidebarTab
                icon={Search}
                label="Search"
                isActive={leftSidebarTab === 'search'}
                onClick={() => setLeftSidebarTab('search')}
              />
              <SidebarTab
                icon={Layout}
                label="Templates"
                isActive={leftSidebarTab === 'templates'}
                onClick={() => setLeftSidebarTab('templates')}
              />
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {leftSidebarTab === 'layers' && (
                <AnnotationLayersPanel
                  layers={enhancedAnnotations.layers}
                  activeLayerId={enhancedAnnotations.activeLayerId}
                  onCreateLayer={enhancedAnnotations.createLayer}
                  onUpdateLayer={enhancedAnnotations.updateLayer}
                  onDeleteLayer={enhancedAnnotations.deleteLayer}
                  onReorderLayers={enhancedAnnotations.reorderLayers}
                  onSetActiveLayer={enhancedAnnotations.setActiveLayer}
                  annotationCount={annotationCountByLayer}
                />
              )}

              {leftSidebarTab === 'search' && (
                <AnnotationSearchFilter
                  annotations={enhancedAnnotations.annotations}
                  onFilterChange={enhancedAnnotations.filterAnnotations}
                  onSearch={enhancedAnnotations.searchAnnotations}
                  availableAuthors={availableAuthors}
                  availableLayers={availableLayers}
                />
              )}

              {leftSidebarTab === 'templates' && (
                <AnnotationTemplatesGallery
                  templates={enhancedAnnotations.templates}
                  selectedAnnotationIds={enhancedAnnotations.selectedIds}
                  onApplyTemplate={enhancedAnnotations.applyTemplate}
                  onSaveAsTemplate={enhancedAnnotations.saveAsTemplate}
                  onDeleteTemplate={enhancedAnnotations.deleteTemplate}
                  currentPage={currentPage}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="flex-shrink-0 bg-white border-b border-slate-200 p-4">
          <div className="flex items-center gap-4">
            {/* Sidebar Toggles */}
            <button
              onClick={() => setShowLeftSidebar(!showLeftSidebar)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showLeftSidebar
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Rich Text Toolbar (when text annotation is active) */}
            <div className="flex-1">
              <RichTextToolbar
                format={richTextFormat}
                onFormatChange={(updates) =>
                  setRichTextFormat({ ...richTextFormat, ...updates })
                }
              />
            </div>

            <button
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showRightSidebar
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
            {/* Placeholder for your PDFViewer component */}
            <div className="aspect-[8.5/11] bg-slate-100 rounded flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold text-slate-600 mb-2">
                  PDF Viewer Integration
                </p>
                <p className="text-sm text-slate-500 max-w-md">
                  Replace this placeholder with your existing PDFViewer component.
                  The enhanced annotation system integrates seamlessly with your
                  current PDF rendering.
                </p>
              </div>
            </div>

            {/* Sample Annotations Overlay */}
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-sm text-indigo-900 font-medium mb-2">
                Active Annotations: {enhancedAnnotations.annotations.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Demo: Create a sample annotation
                    enhancedAnnotations.addAnnotation(
                      'highlight',
                      currentPage,
                      { x: 100, y: 100, width: 200, height: 20 },
                      { contents: 'Sample annotation', author: currentUser.name }
                    );
                  }}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Add Sample Annotation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <AnimatePresence>
        {showRightSidebar && (
          <motion.div
            initial={{ x: 384, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 384, opacity: 0 }}
            className="w-96 bg-white border-l border-slate-200 flex flex-col"
          >
            {/* Tabs */}
            <div className="flex-shrink-0 flex border-b border-slate-200">
              <SidebarTab
                icon={MessageSquare}
                label="Comments"
                isActive={rightSidebarTab === 'comments'}
                onClick={() => setRightSidebarTab('comments')}
                count={
                  enhancedAnnotations.annotations.filter((a) => !a.isResolved).length
                }
              />
              <SidebarTab
                icon={Sparkles}
                label="AI"
                isActive={rightSidebarTab === 'ai'}
                onClick={() => setRightSidebarTab('ai')}
                count={
                  enhancedAnnotations.aiSuggestions.filter((s) => s.status === 'pending')
                    .length
                }
              />
              <SidebarTab
                icon={Mic}
                label="Voice"
                isActive={rightSidebarTab === 'voice'}
                onClick={() => setRightSidebarTab('voice')}
                disabled={!selectedAnnotation}
              />
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {rightSidebarTab === 'comments' && (
                <EnhancedCommentThreads
                  annotations={enhancedAnnotations.annotations}
                  currentUserId={currentUser.id}
                  currentUserName={currentUser.name}
                  onAddReply={(annId, content) => {
                    enhancedAnnotations.addAnnotation(
                      'note',
                      currentPage,
                      { x: 0, y: 0, width: 0, height: 0 },
                      { contents: content }
                    );
                  }}
                  onDeleteReply={() => {}}
                  onUpdateAnnotation={enhancedAnnotations.updateAnnotation}
                  onAddReaction={enhancedAnnotations.addReaction}
                  onRemoveReaction={enhancedAnnotations.removeReaction}
                  onGoToAnnotation={(ann) => {
                    // TODO: Scroll to annotation in PDF
                    console.log('Go to annotation:', ann.id);
                  }}
                />
              )}

              {rightSidebarTab === 'ai' && (
                <AISuggestionsPanel
                  suggestions={enhancedAnnotations.aiSuggestions}
                  isGenerating={enhancedAnnotations.isGeneratingAI}
                  onAccept={enhancedAnnotations.acceptSuggestion}
                  onDismiss={enhancedAnnotations.dismissSuggestion}
                  onGenerate={enhancedAnnotations.generateAISuggestions}
                  selectedAnnotationId={selectedAnnotationId || undefined}
                />
              )}

              {rightSidebarTab === 'voice' && selectedAnnotation && (
                <div className="p-4">
                  <VoiceNoteRecorder
                    annotationId={selectedAnnotation.id}
                    existingNotes={selectedAnnotationVoiceNotes}
                    isRecording={enhancedAnnotations.isRecording}
                    onStartRecording={() =>
                      enhancedAnnotations.startRecording(selectedAnnotation.id)
                    }
                    onStopRecording={enhancedAnnotations.stopRecording}
                    onDeleteNote={enhancedAnnotations.deleteVoiceNote}
                    onTranscribe={enhancedAnnotations.transcribeVoiceNote}
                  />
                </div>
              )}

              {rightSidebarTab === 'voice' && !selectedAnnotation && (
                <div className="flex items-center justify-center h-full p-8 text-center">
                  <div>
                    <Mic className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-600">
                      No annotation selected
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Select an annotation to add voice notes
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Collaboration */}
      <CollaboratorPresence
        collaborators={enhancedAnnotations.collaborators}
        currentUserId={currentUser.id}
        currentPage={currentPage}
        onFollowUser={(userId) => {
          const user = enhancedAnnotations.collaborators.find(
            (c) => c.userId === userId
          );
          if (user) {
            console.log('Follow user to page:', user.currentPage);
            // TODO: Navigate to user's page
          }
        }}
      />
    </div>
  );
};

// ============================================
// SidebarTab Component
// ============================================

interface SidebarTabProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
  disabled?: boolean;
}

const SidebarTab: React.FC<SidebarTabProps> = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  count,
  disabled = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 border-b-2 transition-all ${
      isActive
        ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
        : 'border-transparent text-slate-600 hover:bg-slate-50'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <Icon className="w-4 h-4" />
    <span className="text-sm font-medium">{label}</span>
    {count !== undefined && count > 0 && (
      <span className="px-1.5 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
        {count}
      </span>
    )}
  </button>
);

export default EnhancedPDFAnnotationDemo;
