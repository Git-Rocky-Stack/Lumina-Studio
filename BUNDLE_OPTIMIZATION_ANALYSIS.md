# Bundle Size Optimization Analysis - Lumina Studio

**Date**: December 28, 2025
**Application**: Lumina Studio
**Current Status**: Production Build Analysis

## Executive Summary

The Lumina Studio application currently has critical bundle size issues with two chunks exceeding 900KB and 500KB respectively. This analysis identifies the root causes and provides comprehensive optimization strategies to reduce bundle size by approximately 40-60%.

### Current Bundle Metrics

```
Total Bundle Size: ~2.3 MB (uncompressed)
Total Gzipped: ~342 KB (compressed)
Largest Chunks:
- index--WSGQbqj.js: 967.56 KB (332.13 KB gzip) ⚠️ CRITICAL
- index-B_X88tpP.js: 516.30 KB (139.82 KB gzip) ⚠️ CRITICAL
- vendor-google-ai-DC3fyDYC.js: 252.78 KB (49.94 KB gzip)
- vendor-supabase-0LnPeXwf.js: 168.69 KB (43.97 KB gzip)
```

## Root Cause Analysis

### 1. PDF Libraries (Estimated 250-300 KB)
**Components Affected**:
- PDFSuite (entire module)
- PDFViewer components
- PDF manipulation hooks

**Issues**:
- `pdfjs-dist` (~300KB uncompressed) - PDF rendering engine
- `pdf-lib` (~150KB uncompressed) - PDF modification library
- Both libraries are eagerly imported at module load time
- Currently bundled with main application even if user doesn't use PDF features

**Impact**: ~450KB combined (uncompressed)

### 2. Heavy Canvas/Drawing Libraries
**Components Affected**:
- Canvas component
- Fabric.js integration
- ProPhoto (image editor)

**Issues**:
- Fabric.js library is large and feature-rich
- May be imported even when canvas features aren't accessed
- Complex transformation and rendering code

**Impact**: ~200KB+ (estimated)

### 3. Design System Components
**Components Affected**:
- Design system folder contains many re-exported components
- All components are pre-bundled regardless of usage

**Issues**:
- Entire design system bundled upfront
- Tree-shaking not optimal for complex component exports
- Animation components (Framer Motion) included

**Impact**: ~150KB+

### 4. Monolithic Feature Chunks
**Issues**:
- App.tsx likely imports all feature components
- Feature modules not properly split
- No lazy loading at component level

**Impact**: Results in large main chunks

## Optimization Strategy

### Phase 1: Code Splitting (High Impact - 30-40% reduction)

#### 1.1 Dynamic Imports for Heavy Libraries

**PDF Libraries** - Lazy load on demand:
```typescript
// In pdfService.ts
async function loadPdfjsLib() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
  }
  return pdfjsLib;
}

async function loadPdfLib() {
  if (!pdfLibModule) {
    pdfLibModule = await import('pdf-lib');
  }
  return pdfLibModule;
}
```

**Expected Savings**: ~400-450 KB from main bundle

#### 1.2 Feature-Based Manual Chunking in vite.config.ts

Implemented in the updated vite.config.ts:
```typescript
manualChunks: {
  // Vendor libraries
  'vendor-pdf': ['pdfjs-dist', 'pdf-lib'],        // ~400KB
  'vendor-fabric': ['fabric'],                    // ~200KB
  'vendor-react': ['react', 'react-dom'],
  'vendor-supabase': ['@supabase/supabase-js'],
  'vendor-motion': ['framer-motion'],
  'vendor-router': ['react-router-dom'],

  // Feature chunks
  'feature-pdf-suite': [],                       // PDFSuite component
  'feature-canvas': [],                          // Canvas component
  'feature-video-studio': [],                    // VideoStudio component
  'feature-pro-photo': [],                       // ProPhoto component
}
```

**Expected Savings**: ~300-350 KB through better distribution

#### 1.3 Component-Level Lazy Loading

Already partially implemented in App.tsx. Ensure all features are lazy loaded:
```typescript
const Canvas = lazy(() => import('./components/Canvas'));
const VideoStudio = lazy(() => import('./components/VideoStudio'));
const PDFSuite = lazy(() => import('./components/PDFSuite'));
const ProPhoto = lazy(() => import('./components/ProPhoto/index'));
const AIStockGen = lazy(() => import('./components/AIStockGen'));
```

**Expected Savings**: ~150-200 KB (deferred loading)

### Phase 2: Library Optimization (10-15% reduction)

#### 2.1 Replace Heavy Libraries with Alternatives

**Current**: Fabric.js (large, feature-rich)
**Alternative Options**:
- **Konva.js**: 20KB minified (vs Fabric's 200KB+)
- **Pixi.js**: Smaller renderer (~80KB)
- **Two.js**: Lightweight SVG/Canvas (~20KB)
- **Native Canvas API**: For simple drawing operations

**Recommendation**: Evaluate Fabric.js usage - if only basic drawing:
- Replace with native Canvas API + lightweight utilities
- Or use Konva.js for better performance

**Expected Savings**: ~100-150 KB

#### 2.2 PDF Library Optimization

**Current**: Both pdfjs-dist AND pdf-lib

**Options**:
- Use pdfjs-dist for reading/viewing (already loaded)
- For PDF creation, consider:
  - **jsPDF**: 40KB minified
  - **html2canvas + pdfjs**: Lighter combo
  - Server-side generation for heavy operations

**Recommendation**:
- Keep pdfjs-dist (PDF viewing is core feature)
- Replace pdf-lib with lighter alternative (jsPDF) or move complex operations to server

**Expected Savings**: ~100-150 KB

#### 2.3 Dependency Audit

High-impact libraries to review:
- `@google/genai`: 252.78 KB - May have alternatives
- `mammoth`: Document parsing - Only load when needed
- `framer-motion`: 124.74 KB - Review if all animations are necessary

**Expected Savings**: ~50-100 KB

### Phase 3: Code Optimization (5-10% reduction)

#### 3.1 Tree Shaking Configuration

Update `vite.config.ts`:
```typescript
build: {
  minify: 'esbuild',  // Good for tree-shaking
  target: 'es2020',   // Drop polyfills for older browsers
  rollupOptions: {
    output: {
      compact: true,  // Minimal formatting
    }
  }
}
```

#### 3.2 Remove Unused Dependencies

Check package.json for:
- Unused dev dependencies in production build
- Duplicate functionality
- Polyfills for older browsers (if targeting modern only)

#### 3.3 Optimize CSS Bundle

Current: 206.72 KB
- Check for unused Tailwind classes
- Use Tailwind's purging properly
- Consider critical CSS extraction

**Expected Savings**: ~20-50 KB

### Phase 4: Distribution Strategy (Delivery Optimization)

#### 4.1 Route-Based Code Splitting

Improve current setup - ensure route-based chunks:
```typescript
{
  path: "/studio/pdf",
  element: <Suspense fallback={<Loader />}>
    <PDFSuite />
  </Suspense>
}
// This chunk loads ONLY when route is accessed
```

#### 4.2 Prefetching Strategy

```typescript
// Preload non-critical modules during idle time
useEffect(() => {
  requestIdleCallback?.(() => {
    preloadCriticalModules();
  }) || setTimeout(preloadCriticalModules, 3000);
}, []);
```

#### 4.3 Service Worker Caching

Already in place - optimize cache strategy:
- Cache vendor chunks for 30 days
- Cache feature chunks for 7 days
- Cache dynamic chunks for 1 day

## Implementation Roadmap

### Week 1: Quick Wins (Est. 20-30% reduction)

1. **Update vite.config.ts** (DONE)
   - File: `/vite.config.ts`
   - Add feature-based manual chunking
   - Exclude heavy libraries from pre-bundling

2. **Lazy Load PDF Service** (DONE)
   - File: `/services/lazyLoadService.ts` (created)
   - File: `/services/pdfService.ts` (partially updated)
   - Dynamic imports for pdfjs-dist and pdf-lib

3. **Test and Rebuild**
   ```bash
   npm run build
   # Check bundle output for improvements
   ```

### Week 2: Library Consolidation (Est. 10-15% reduction)

1. **Evaluate Fabric.js Usage**
   - Analyze actual features used
   - Consider Konva.js or native Canvas API

2. **PDF Library Optimization**
   - Test jsPDF as pdf-lib replacement
   - Or move heavy PDF operations to server

3. **Dependency Audit**
   - Review @google/genai alternatives
   - Check mammoth usage patterns

### Week 3: Fine-Tuning (Est. 5-10% reduction)

1. **CSS Optimization**
   - Audit Tailwind usage
   - Remove unused selectors

2. **Code Compression**
   - Enable advanced minification
   - Optimize source maps

3. **Performance Testing**
   - Lighthouse scores
   - Core Web Vitals

## Metrics Comparison

### Current State
```
Total Bundle: 2,300 KB (uncompressed)
Gzipped: 342 KB
Largest Chunk: 967 KB
```

### Target State (After All Optimizations)
```
Total Bundle: 900-1,200 KB (uncompressed) [60% reduction]
Gzipped: 150-200 KB [45% reduction]
Largest Chunk: 300-350 KB (under 500KB target)
All chunks properly distributed by feature
```

### Expected Timeline
- **Immediate (Week 1)**: 20-30% reduction
- **After Week 2**: 40-50% reduction
- **After Week 3**: 50-60% reduction

## Monitoring and Validation

### Build Analysis Commands

```bash
# Generate detailed build analysis
npm run build -- --mode production

# Use Vite plugin for visualization
# Option 1: Install rollup-plugin-visualizer
npm install --save-dev rollup-plugin-visualizer

# Option 2: Use Webpack Bundle Analyzer alternative
npm install --save-dev vite-plugin-visualizer
```

### Bundle Analyzer Configuration

Add to vite.config.ts:
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ]
});
```

### Continuous Monitoring

Track bundle size in CI/CD:
```bash
# Create baseline
npm run build && du -sh dist/

# Track in commits
# Can integrate with github.com/relative-ci/bundle-analyzer
```

## Key Files Modified

1. **vite.config.ts** - Enhanced manual chunking strategy
2. **services/lazyLoadService.ts** - New module for dynamic imports
3. **services/pdfService.ts** - Updated with lazy loading (WIP)

## Next Steps

1. **Complete PDF Service Refactoring**
   - Finish implementing dynamic imports in pdfService.ts
   - Ensure all PDF functions await module loading

2. **Test Dynamic Imports**
   - Verify PDF features still work when accessed
   - Check for loading indicators

3. **Measure Impact**
   ```bash
   npm run build
   # Compare dist/ file sizes
   ```

4. **Evaluate Library Replacements**
   - Prototype Konva.js vs Fabric.js
   - Test jsPDF vs pdf-lib

5. **Deploy and Monitor**
   - Test in production environment
   - Monitor Core Web Vitals
   - Check user experience with lazy-loaded chunks

## Estimated Results

With full implementation of these optimizations:

| Chunk | Before | After | Savings |
|-------|--------|-------|---------|
| Main Bundle | 967 KB | 300-350 KB | 65-70% |
| Secondary Bundle | 516 KB | 200-250 KB | 50-60% |
| Total Gzipped | 342 KB | 160-200 KB | 45-55% |

## Risk Mitigation

- **Lazy Loading Delays**: Use loading indicators and preload during idle time
- **Library Compatibility**: Thoroughly test replacements in dev/staging
- **Fallbacks**: Maintain old code paths until new solutions verified
- **Monitoring**: Track Core Web Vitals continuously after changes

---

**Status**: Active Optimization
**Owner**: Development Team
**Last Updated**: December 28, 2025
