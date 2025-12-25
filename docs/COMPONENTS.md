# Lumina Studio Component Documentation

## Architecture Overview

Lumina Studio uses a modular component architecture with:
- **Lazy loading** for heavy modules
- **Context providers** for global state
- **Design system** for consistent UI

```
App.tsx
├── Providers (Onboarding, CommandPalette, ServiceWorker)
├── Sidebar (navigation)
├── Main Content Area
│   └── Lazy-loaded modules (Canvas, VideoStudio, etc.)
└── Global UI (Confetti, ScrollProgress, InstallPrompt)
```

---

## Core Components

### App.tsx
Main application component with routing and global state.

**Features:**
- Theme management (6 color themes)
- Keyboard shortcuts (Ctrl+Z/Y for undo/redo)
- Global file drop handling
- Module lazy loading

### Sidebar.tsx
Navigation sidebar with mode switching.

**Props:** None (uses internal state)

**Modes:**
- Workspace, Canvas, Video, Stock, PDF, Photo
- Assistant, Brand, Marketing, Assets, Settings, Features

---

## Canvas Components

### Canvas.tsx
Main canvas editor for design work.

**Location:** `components/Canvas.tsx`

**Features:**
- Multi-element selection
- Drag and drop layers
- Undo/redo history
- Animation preview
- Export (PNG, SVG)

**Sub-components:**
- `CanvasToolbar.tsx` - Toolbar with undo/redo, cloud sync
- `LayerPanel.tsx` - Layer management
- `AnimationPanel.tsx` - Animation timeline

### CanvasToolbar
```tsx
interface CanvasToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onCloudSave: () => void;
  isCloudSyncing: boolean;
  onExportSVG: () => void;
  onPreview: () => void;
  isPreviewMode: boolean;
  onShowExportModal: () => void;
  selectedCount: number;
  selectedMask?: string;
  onMaskChange: (mask: string) => void;
  onDeleteSelected: () => void;
}
```

### LayerPanel
```tsx
interface LayerPanelProps {
  elements: DesignElement[];
  selectedIds: string[];
  collapsedGroups: Set<string>;
  draggedLayerId: string | null;
  onSelectElement: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDragStart: (id: string) => void;
  onDrop: (targetId: string) => void;
  onDragEnd: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onGroupSelected: () => void;
  onUngroup: (groupId: string) => void;
  onToggleGroupCollapse: (groupId: string) => void;
}
```

---

## Video Studio Components

### VideoStudio.tsx
Video generation and editing studio.

**Location:** `components/VideoStudio.tsx`

**Features:**
- AI storyboard generation
- Shot-by-shot video generation
- Audio library with semantic search
- Video interrogation (AI analysis)
- Clip extension

**Sub-components:**
- `VideoStudioHeader.tsx` - Title, aspect ratio, export
- `AudioLibraryPanel.tsx` - Audio selection
- `SourceIntelligencePanel.tsx` - Video upload
- `VideoInterrogator.tsx` - AI video analysis
- `ShotTimeline.tsx` - Timeline view
- `ShotPropertiesPanel.tsx` - Shot editing
- `TransitionLabPanel.tsx` - Transition effects
- `ClipExtenderPanel.tsx` - Video extension

### VideoStudioHeader
```tsx
interface VideoStudioHeaderProps {
  title: string;
  aspectRatio: VideoAspectRatio;
  onTitleChange: (title: string) => void;
  onAspectRatioChange: (ratio: VideoAspectRatio) => void;
  onShowExportModal: () => void;
}
```

### AudioLibraryPanel
```tsx
interface AudioLibraryPanelProps {
  audioLibrary: AudioTrack[];
  selectedAudio: AudioTrack;
  audioSearchQuery: string;
  previewingAudioId: string | null;
  onSelectAudio: (track: AudioTrack) => void;
  onSearchChange: (query: string) => void;
  onSemanticSearch: () => void;
  onTogglePreview: (track: AudioTrack, e: React.MouseEvent) => void;
}
```

---

## Design System Components

### Location: `design-system/`

### Toast
Toast notification system.

```tsx
import { useToast } from '../design-system';

const toast = useToast();
toast.success('Saved!');
toast.error('Failed', { description: 'Please try again' });
```

### ErrorBoundary
React error boundary with fallback UI.

```tsx
import { ErrorBoundary } from '../components/ErrorBoundary';

<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>
```

### Skeleton Components
Loading skeletons for async content.

```tsx
import { SkeletonCanvas, SkeletonCard } from '../components/skeletons';

<Suspense fallback={<SkeletonCanvas />}>
  <Canvas />
</Suspense>
```

**Available Skeletons:**
- `SkeletonBase` - Base shimmer component
- `SkeletonText` - Text placeholder
- `SkeletonCard` - Card layout
- `SkeletonListItem` - List item
- `SkeletonAssetGrid` - Asset grid
- `SkeletonSidebar` - Sidebar nav
- `SkeletonCanvas` - Canvas editor
- `SkeletonVideoStudio` - Video editor
- `SkeletonWorkspace` - Dashboard
- `SkeletonFullPage` - Full page loader

---

## Services

### geminiService.ts
Google Gemini AI integration.

**Functions:**
- `generateText(prompt, options)` - Text generation
- `generateImage(prompt)` - Image generation
- `startVideoGeneration(prompt, ratio)` - Start video gen
- `pollVideoOperation(operation)` - Poll video status
- `fetchVideoData(uri)` - Download video
- `generateStoryboardFromScript(script)` - Create storyboard
- `extendVideo(video, prompt, ratio)` - Extend video
- `analyzeMedia(data, prompt, mime)` - Analyze media
- `semanticAudioSearch(query, library)` - Search audio
- `analyzeVideoContent(data, query, mime)` - Analyze video

### observability.ts
Web Vitals and Sentry integration.

**Functions:**
- `initObservability()` - Initialize monitoring
- `trackWebVitals()` - Start Web Vitals tracking
- `reportError(error, context)` - Report error to Sentry

---

## Types

### Location: `types/index.ts`

```tsx
// Design elements
interface DesignElement {
  id: string;
  type: 'text' | 'image';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  isVisible: boolean;
  isLocked: boolean;
  groupId?: string;
  mask?: MaskType;
  animation?: ElementAnimation;
}

// Video types
interface Shot {
  id: string;
  prompt: string;
  camera: string;
  lighting: string;
  lensType: string;
  motionDescription: string;
  cinematicDetail: string;
  motionScore: number;
  duration: number;
  status: 'pending' | 'generating' | 'ready' | 'extending' | 'error';
  videoUrl?: string;
  rawVideoData?: any;
  transition: TransitionType;
  transitionIntensity: number;
  transitionDuration: number;
}

type VideoAspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:2';
type TransitionType = 'cut' | 'crossfade' | 'glitch' | 'dissolve' | 'zoom' | 'slide';
```

---

## Patterns

### Lazy Loading
```tsx
const Component = lazy(() => import('./Component'));

<Suspense fallback={<SkeletonComponent />}>
  <Component />
</Suspense>
```

### Error Handling
```tsx
<ErrorBoundary
  onError={(error, info) => reportError(error, info)}
  fallback={<ErrorFallback />}
>
  <Component />
</ErrorBoundary>
```

### Toast Notifications
```tsx
try {
  await operation();
  toast.success('Success!');
} catch (error) {
  toast.error('Failed', { description: error.message });
}
```
