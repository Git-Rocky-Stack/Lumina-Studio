# Enhanced Annotations Quick Start Guide

Get up and running with Lumina-Studio's enhanced annotation system in 5 minutes.

## Installation

```bash
# Install required dependencies
npm install framer-motion lucide-react
```

## Basic Usage

### 1. Import the Hook

```typescript
import { useEnhancedAnnotations } from '@/components/PDFSuite/hooks';
```

### 2. Initialize in Your Component

```typescript
const MyPDFViewer = () => {
  const annotations = useEnhancedAnnotations({
    userId: 'current-user-id',
    userName: 'Current User Name',
    enableAI: true,
    enableCollaboration: true,
  });

  return (
    // Your component JSX
  );
};
```

### 3. Add Components

```typescript
import {
  AnnotationLayersPanel,
  RichTextToolbar,
  VoiceNoteRecorder,
  AISuggestionsPanel,
  AnnotationTemplatesGallery,
  CollaboratorPresence,
  AnnotationSearchFilter,
  EnhancedCommentThreads,
} from '@/components/PDFSuite/components';
```

## Component Quick Reference

### Layers Panel
```typescript
<AnnotationLayersPanel
  layers={annotations.layers}
  activeLayerId={annotations.activeLayerId}
  onCreateLayer={annotations.createLayer}
  onUpdateLayer={annotations.updateLayer}
  onDeleteLayer={annotations.deleteLayer}
  onReorderLayers={annotations.reorderLayers}
  onSetActiveLayer={annotations.setActiveLayer}
  annotationCount={{ default: 5, layer1: 3 }}
/>
```

**What it does:** Organize annotations into layers with visibility/lock controls.

---

### Rich Text Toolbar
```typescript
const [format, setFormat] = useState({
  bold: false,
  italic: false,
  fontSize: 12,
  // ... other format options
});

<RichTextToolbar
  format={format}
  onFormatChange={(updates) => setFormat({ ...format, ...updates })}
/>
```

**What it does:** Format text annotations with fonts, colors, alignment, etc.

---

### Voice Note Recorder
```typescript
<VoiceNoteRecorder
  annotationId="annotation-123"
  existingNotes={annotations.voiceNotes.filter(vn => vn.annotationId === "annotation-123")}
  isRecording={annotations.isRecording}
  onStartRecording={() => annotations.startRecording("annotation-123")}
  onStopRecording={annotations.stopRecording}
  onDeleteNote={annotations.deleteVoiceNote}
  onTranscribe={annotations.transcribeVoiceNote}
/>
```

**What it does:** Record, play, and transcribe voice notes attached to annotations.

---

### AI Suggestions Panel
```typescript
<AISuggestionsPanel
  suggestions={annotations.aiSuggestions}
  isGenerating={annotations.isGeneratingAI}
  onAccept={annotations.acceptSuggestion}
  onDismiss={annotations.dismissSuggestion}
  onGenerate={annotations.generateAISuggestions}
  selectedAnnotationId={selectedAnnotationId}
/>
```

**What it does:** Display and manage AI-powered annotation improvements.

---

### Templates Gallery
```typescript
<AnnotationTemplatesGallery
  templates={annotations.templates}
  selectedAnnotationIds={annotations.selectedIds}
  onApplyTemplate={annotations.applyTemplate}
  onSaveAsTemplate={annotations.saveAsTemplate}
  onDeleteTemplate={annotations.deleteTemplate}
  currentPage={currentPage}
/>
```

**What it does:** Create and apply reusable annotation templates.

---

### Collaborator Presence
```typescript
<CollaboratorPresence
  collaborators={annotations.collaborators}
  currentUserId="current-user-id"
  currentPage={currentPage}
  onFollowUser={(userId) => {
    // Navigate to user's page
  }}
/>
```

**What it does:** Show real-time presence of other users viewing the document.

---

### Search & Filter
```typescript
<AnnotationSearchFilter
  annotations={annotations.annotations}
  onFilterChange={annotations.filterAnnotations}
  onSearch={annotations.searchAnnotations}
  availableAuthors={["User 1", "User 2"]}
  availableLayers={annotations.layers.map(l => ({
    id: l.id,
    name: l.name,
    color: l.color
  }))}
/>
```

**What it does:** Search and filter annotations by multiple criteria.

---

### Comment Threads
```typescript
<EnhancedCommentThreads
  annotations={annotations.annotations}
  currentUserId="current-user-id"
  currentUserName="Current User"
  onAddReply={(annId, content) => {
    // Add reply logic
  }}
  onDeleteReply={(annId, replyId) => {
    // Delete reply logic
  }}
  onUpdateAnnotation={annotations.updateAnnotation}
  onAddReaction={annotations.addReaction}
  onRemoveReaction={annotations.removeReaction}
  onGoToAnnotation={(ann) => {
    // Navigate to annotation
  }}
/>
```

**What it does:** Display threaded comments with reactions and resolution tracking.

---

## Common Operations

### Create an Annotation
```typescript
const newAnnotation = annotations.addAnnotation(
  'highlight',              // type
  1,                        // pageNumber
  { x: 100, y: 100, width: 200, height: 20 },  // rect
  {
    contents: 'This is important',
    author: 'John Doe',
    color: '#FFEB3B'
  }
);
```

### Create a Layer
```typescript
const newLayer = annotations.createLayer('Review Comments', '#FF5722');
```

### Move Annotation to Layer
```typescript
annotations.moveAnnotationToLayer('annotation-id', 'layer-id');
```

### Add Voice Note
```typescript
// Start recording
await annotations.startRecording('annotation-id');

// Stop recording (returns VoiceNote)
const voiceNote = await annotations.stopRecording();
```

### Generate AI Suggestions
```typescript
await annotations.generateAISuggestions('annotation-id');
```

### Accept AI Suggestion
```typescript
annotations.acceptSuggestion('suggestion-id');
```

### Save as Template
```typescript
const template = annotations.saveAsTemplate(
  'Legal Review Template',
  'Standard legal document review annotations',
  ['ann-1', 'ann-2', 'ann-3'],
  'legal'
);
```

### Apply Template
```typescript
annotations.applyTemplate('template-id', currentPage);
```

### Add Reaction
```typescript
annotations.addReaction('annotation-id', '👍');
```

### Resolve Annotation
```typescript
annotations.updateAnnotation('annotation-id', {
  isResolved: true,
  resolvedBy: 'Current User',
  resolvedAt: Date.now()
});
```

---

## TypeScript Types

All types are exported from the hook:

```typescript
import type {
  AnnotationLayer,
  RichTextAnnotation,
  VoiceNote,
  AISuggestion,
  AnnotationTemplate,
  CollaboratorPresence,
  AnnotationReaction,
  EnhancedAnnotation,
  AnnotationFilters,
  AnnotationStats,
} from '@/components/PDFSuite/hooks';
```

---

## State Management

The hook manages all state internally. Key state includes:

- `annotations`: Array of all annotations
- `selectedIds`: Currently selected annotation IDs
- `layers`: Array of annotation layers
- `activeLayerId`: Currently active layer
- `voiceNotes`: Array of voice notes
- `aiSuggestions`: Array of AI suggestions
- `templates`: Array of saved templates
- `collaborators`: Array of active collaborators

---

## Backend Integration

### Sync Annotations
```typescript
const annotations = useEnhancedAnnotations({
  userId: 'user-123',
  userName: 'John Doe',
  onAnnotationChange: async (updatedAnnotations) => {
    // Sync to your backend
    await fetch('/api/annotations', {
      method: 'POST',
      body: JSON.stringify(updatedAnnotations)
    });
  }
});
```

### Sync Layers
```typescript
const annotations = useEnhancedAnnotations({
  // ...
  onLayerChange: async (updatedLayers) => {
    await fetch('/api/layers', {
      method: 'POST',
      body: JSON.stringify(updatedLayers)
    });
  }
});
```

### Upload Voice Notes
```typescript
const voiceNote = await annotations.stopRecording();
if (voiceNote) {
  const formData = new FormData();
  formData.append('audio', voiceNote.audioBlob);
  formData.append('annotationId', voiceNote.annotationId);

  await fetch('/api/voice-notes', {
    method: 'POST',
    body: formData
  });
}
```

---

## Styling Customization

All components use Tailwind CSS and can be customized:

```typescript
<AnnotationLayersPanel
  className="custom-class"
  // Component accepts className prop
/>
```

Override colors in your Tailwind config:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        indigo: {
          // Your custom indigo shades
        }
      }
    }
  }
}
```

---

## Performance Tips

1. **Memoize callbacks:**
```typescript
const handleAnnotationSelect = useCallback((id: string) => {
  // Your logic
}, [/* dependencies */]);
```

2. **Debounce search:**
```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (query) => annotations.searchAnnotations(query),
  300
);
```

3. **Virtualize large lists:**
```typescript
import { FixedSizeList } from 'react-window';

// Use for 100+ annotations
```

---

## Troubleshooting

### Voice recording not working
- Ensure HTTPS (required for MediaRecorder API)
- Check microphone permissions
- Verify browser compatibility (Chrome 90+, Firefox 88+)

### AI suggestions not appearing
- Set `enableAI: true` in hook options
- Ensure annotation has `contents` field
- Implement actual AI endpoint (placeholder in hook)

### Performance issues with many annotations
- Implement pagination or virtualization
- Use `React.memo` on list items
- Debounce search and filter operations

---

## Example: Complete Implementation

See `EnhancedPDFAnnotationDemo.tsx` for a complete working example with:
- Tabbed interface
- Multiple panels
- Full feature integration
- Proper state management
- Responsive layout

---

## Next Steps

1. Read the full documentation: `ENHANCED_ANNOTATIONS_README.md`
2. Explore the demo component: `EnhancedPDFAnnotationDemo.tsx`
3. Review TypeScript types in `useEnhancedAnnotations.ts`
4. Customize styling to match your brand
5. Integrate with your backend API
6. Add tests for critical workflows

---

## Support

For questions or issues:
1. Check the full documentation
2. Review component source code
3. Examine the demo implementation
4. Refer to Lumina-Studio main docs

---

**Version:** 1.0.0
**Last Updated:** 2026-01-05
