# Bundle Optimization Implementation Guide

This guide provides step-by-step instructions to implement the bundle optimization strategies outlined in `BUNDLE_OPTIMIZATION_ANALYSIS.md`.

## Table of Contents
1. [Quick Wins - Phase 1](#phase-1-quick-wins)
2. [Dynamic Imports Setup](#dynamic-imports-setup)
3. [Component Lazy Loading](#component-lazy-loading)
4. [Library Optimization](#library-optimization)
5. [Testing & Validation](#testing--validation)

---

## Phase 1: Quick Wins

### Task 1.1: Update Vite Configuration

**File**: `vite.config.ts` ✓ COMPLETED

The configuration has been updated with:
- Feature-based manual chunking strategy
- Separate chunks for heavy libraries (PDF, Fabric, etc.)
- Exclusion of heavy libraries from pre-bundling

**Verify the changes:**
```bash
npm run build
# Look for output like:
# feature-pdf-suite-*.js
# feature-canvas-*.js
# vendor-pdf-*.js
# etc.
```

### Task 1.2: Implement Dynamic Import Service

**File**: `services/lazyLoadService.ts` ✓ COMPLETED

This service provides utilities for lazy loading heavy modules:

```typescript
// Usage in components
import { lazyLoadPdfService } from './services/lazyLoadService';

// When PDF feature is accessed
const pdfService = await lazyLoadPdfService();
const { loadPDF } = pdfService;
```

**Key Features**:
- Module caching to prevent multiple imports
- Preload functionality for idle time
- Error handling and fallbacks

---

## Dynamic Imports Setup

### Step 1: Update PDF Service

**File**: `services/pdfService.ts`

The service has been partially updated. Complete the migration:

```typescript
// CURRENT (top of file)
let pdfjsLib: Awaited<PdfjsLib> | null = null;
let pdfLibModule: Awaited<PdfLibModule> | null = null;

async function loadPdfjsLib(): Promise<Awaited<PdfjsLib>> {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  return pdfjsLib;
}

// TO DO: Update all function signatures to use async loading
// Example:
export async function loadPDF(source: File | string | ArrayBuffer) {
  const pdfjs = await loadPdfjsLib();
  const loadingTask = pdfjs.getDocument({ data });
  // ... rest of implementation
}
```

**Impact**: Moves ~400KB of PDF libraries out of main bundle

### Step 2: Create Module Wrapper for Heavy Libraries

Create `services/libraryLoaders.ts`:

```typescript
/**
 * Lazy loaders for heavy third-party libraries
 * Reduces initial bundle size by deferring loading
 */

const loaders: Record<string, Promise<any>> = {};

export async function loadFabric() {
  if (!loaders.fabric) {
    loaders.fabric = import('fabric').then(mod => mod.fabric);
  }
  return loaders.fabric;
}

export async function loadMammoth() {
  if (!loaders.mammoth) {
    loaders.mammoth = import('mammoth');
  }
  return loaders.mammoth;
}

export async function loadQrCode() {
  if (!loaders.qrcode) {
    loaders.qrcode = import('qrcode');
  }
  return loaders.qrcode;
}

export async function preloadLibraries() {
  // Called during idle time
  requestIdleCallback?.(() => {
    // Preload likely candidates
    loadFabric().catch(err => console.warn('Failed to preload Fabric', err));
  }) || setTimeout(() => {
    loadFabric().catch(err => console.warn('Failed to preload Fabric', err));
  }, 3000);
}
```

**Usage**:
```typescript
// In Canvas component
import { loadFabric } from '../services/libraryLoaders';

const initCanvas = async () => {
  const fabric = await loadFabric();
  const canvas = new fabric.Canvas('canvas-element');
};
```

### Step 3: Update Component Imports

**File**: `App.tsx`

Ensure all heavy components are lazy loaded:

```typescript
import React, { useState, useEffect, lazy, Suspense } from 'react';

// Lazy load heavy components
const Canvas = lazy(() => import('./components/Canvas'));
const VideoStudio = lazy(() => import('./components/VideoStudio'));
const AIStockGen = lazy(() => import('./components/AIStockGen'));
const PDFSuite = lazy(() => import('./components/PDFSuite'));
const ProPhoto = lazy(() => import('./components/ProPhoto/index'));
const Assistant = lazy(() => import('./components/Assistant'));
const BrandHub = lazy(() => import('./components/BrandHub'));
const MarketingHub = lazy(() => import('./components/MarketingHub'));
const AssetHub = lazy(() => import('./components/AssetHub'));
const Personalization = lazy(() => import('./components/Personalization'));
const FeaturesGuide = lazy(() => import('./components/FeaturesGuide'));

// Loading fallback
const ModuleLoader: React.FC = () => (
  <div className="flex-1 h-full flex items-center justify-center bg-slate-50">
    <div className="text-center space-y-4">
      <div className="animate-spin">Loading...</div>
    </div>
  </div>
);

// In render:
<Suspense fallback={<ModuleLoader />}>
  {currentMode === StudioMode.DESIGN && <Canvas />}
  {currentMode === StudioMode.VIDEO && <VideoStudio />}
  {/* ... etc */}
</Suspense>
```

---

## Component Lazy Loading

### Strategy: Route-Based Code Splitting

Ensure routes load chunks only when accessed:

```typescript
// In index.tsx - Setup route-level code splitting
<Routes>
  {/* Public routes - loaded immediately */}
  <Route path="/" element={<LandingPage />} />

  {/* Feature routes - lazy loaded */}
  <Route
    path="/studio/canvas"
    element={
      <Suspense fallback={<LoadingScreen />}>
        <Canvas />
      </Suspense>
    }
  />

  <Route
    path="/studio/pdf"
    element={
      <Suspense fallback={<LoadingScreen />}>
        <PDFSuite />
      </Suspense>
    }
  />
</Routes>
```

### Progressive Module Loading

Create `hooks/useLazyComponent.ts`:

```typescript
import { lazy, ComponentType } from 'react';

export function useLazyComponent<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>
): T | null {
  const Component = lazy(loader);
  return Component as T;
}

// Usage:
const Canvas = useLazyComponent(() => import('./components/Canvas'));
```

---

## Library Optimization

### Option 1: Replace Fabric.js with Konva.js

**Comparison**:
- Fabric.js: ~200KB minified
- Konva.js: ~20KB minified
- Savings: ~180KB

**Migration Steps**:

```typescript
// Before (Fabric.js)
import { fabric } from 'fabric';
const canvas = new fabric.Canvas('canvas');

// After (Konva.js)
import Konva from 'konva';
const stage = new Konva.Stage({
  container: 'canvas',
  width: window.innerWidth,
  height: window.innerHeight,
});
```

**When to use**:
- If you need advanced rendering (3D transforms, effects) → Keep Fabric.js
- If basic drawing only → Switch to Konva.js
- If very simple drawing → Use native Canvas API

### Option 2: Replace pdf-lib with jsPDF

**Comparison**:
- pdf-lib: ~150KB
- jsPDF: ~40KB
- Savings: ~110KB

**Migration Example**:

```typescript
// Before
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const pdfDoc = await PDFDocument.create();
const page = pdfDoc.addPage([612, 792]);
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

page.drawText('Hello World', {
  x: 50,
  y: 750,
  size: 12,
  font,
  color: rgb(0, 0, 0),
});

const pdfBytes = await pdfDoc.save();

// After
import jsPDF from 'jspdf';

const doc = new jsPDF();
doc.text('Hello World', 50, 750);
const pdfBytes = doc.output('arraybuffer');
```

**Evaluation Checklist**:
- [ ] Does your app only create simple text/image PDFs? → Use jsPDF
- [ ] Do you need form field support? → Keep pdf-lib or use server
- [ ] Do you need advanced PDF manipulation? → Consider server-side

### Option 3: Optimize Google AI Library

**Current**: 252.78 KB

**Review Usage**:
```bash
# Find all @google/genai imports
grep -r "@google/genai" src/ --include="*.ts" --include="*.tsx"
```

**Possible Solutions**:
1. Use direct API calls instead of SDK
2. Move to server-side (Cloudflare Worker)
3. Lazy load in specific features only

**Server-Side Example** (Cloudflare Worker):
```typescript
// In server/cloudflare-ai-worker/src/index.ts
export async function generateText(prompt: string) {
  // Use @google/genai on server instead of client
  const model = genai.getGenerativeModel({ model: 'gemini-pro' });
  return model.generateContent(prompt);
}
```

---

## Testing & Validation

### Build Analysis

```bash
# 1. Run production build
npm run build

# 2. Check file sizes
ls -lh dist/assets/

# 3. Compare before/after
# Before: index--WSGQbqj.js (967.56 KB)
# After: Should be <350 KB

# 4. Analyze chunk distribution
# Look for:
# - feature-*.js files (should be <100 KB each)
# - vendor-*.js files properly separated
# - No massive index-*.js files
```

### Bundle Analyzer Setup

Install bundle visualizer:
```bash
npm install --save-dev vite-plugin-visualizer
```

Update `vite.config.ts`:
```typescript
import { visualizer } from 'vite-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
  // ... rest of config
});
```

Run: `npm run build` → Opens stats.html for visualization

### Performance Testing

```typescript
// Add to index.tsx - Monitor chunk loading times
const monitorChunkLoading = () => {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry: any) => {
      if (entry.name.includes('feature-') || entry.name.includes('vendor-')) {
        console.log(`Chunk loaded: ${entry.name} (${entry.duration}ms)`);
      }
    });
  });

  observer.observe({ entryTypes: ['resource'] });
};

monitorChunkLoading();
```

### Lighthouse Testing

```bash
# Generate Lighthouse report
npm run build && npx lighthouse http://localhost:3000 --view
```

**Metrics to Watch**:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Total Blocking Time (TBT)

---

## Implementation Checklist

### Phase 1: Quick Wins (Week 1)
- [x] Update `vite.config.ts` with feature-based chunking
- [x] Create `services/lazyLoadService.ts`
- [ ] Test build: `npm run build`
- [ ] Verify chunk distribution improved
- [ ] Measure gzipped size reduction

### Phase 2: Dynamic Imports (Week 2)
- [ ] Complete PDF service refactoring with dynamic imports
- [ ] Create `services/libraryLoaders.ts` for heavy libraries
- [ ] Update Canvas/ProPhoto components to use lazy loaders
- [ ] Test PDF features still work correctly
- [ ] Measure impact on main chunk size

### Phase 3: Library Evaluation (Week 2-3)
- [ ] Profile Fabric.js usage in Canvas
- [ ] Test Konva.js as replacement (if applicable)
- [ ] Evaluate pdf-lib vs jsPDF
- [ ] Test Google AI library optimization
- [ ] Run full test suite after replacements

### Phase 4: Monitoring (Week 3)
- [ ] Setup bundle analyzer visualization
- [ ] Setup Lighthouse tracking
- [ ] Monitor Core Web Vitals
- [ ] Create CI/CD bundle size tracking
- [ ] Document final results

---

## Troubleshooting

### Issue: Lazy Loaded Component Takes Too Long to Appear

**Solution**: Use `Suspense` with better fallback UI
```typescript
<Suspense fallback={<OptimizedLoadingScreen />}>
  <Component />
</Suspense>
```

### Issue: Dynamic Import Errors

**Solution**: Add proper error boundaries
```typescript
const ComponentWithErrorBoundary = lazy(() =>
  import('./Component').catch(err => {
    console.error('Failed to load component:', err);
    return { default: ErrorFallback };
  })
);
```

### Issue: PDF Viewer Not Loading

**Solution**: Ensure worker is configured in lazy loader
```typescript
async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = `path/to/pdf.worker.min.js`;
  return pdfjs;
}
```

### Issue: Performance Still Slow After Optimization

**Checklist**:
- [ ] Are all components lazy loaded?
- [ ] Is main chunk still >350KB? Investigate why
- [ ] Are you preloading necessary chunks?
- [ ] Check network tab for unused chunks being loaded

---

## Expected Results Timeline

| Week | Task | Est. Reduction |
|------|------|----------------|
| 1 | Vite config + dynamic imports | 20-30% |
| 2 | PDF service + library loaders | 30-40% |
| 2-3 | Library replacements | 40-50% |
| 3 | Fine-tuning & monitoring | 50-60% |

**Total Expected**: 50-60% bundle size reduction (400-500KB to 150-200KB gzipped)

---

**Last Updated**: December 28, 2025
**Status**: Ready for Implementation
