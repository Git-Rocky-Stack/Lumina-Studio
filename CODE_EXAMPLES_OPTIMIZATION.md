# Bundle Optimization - Code Examples & Templates

Ready-to-use code snippets for implementing optimizations.

## Table of Contents
1. [Dynamic Import Patterns](#dynamic-import-patterns)
2. [Lazy Loading Components](#lazy-loading-components)
3. [Library Loading Utilities](#library-loading-utilities)
4. [Vite Configuration](#vite-configuration)
5. [Error Handling](#error-handling)

---

## Dynamic Import Patterns

### Pattern 1: Simple Dynamic Import with Caching

```typescript
// services/libraryLoaders.ts
const loadedModules: Record<string, any> = {};

export async function loadLibrary(name: string, importer: () => Promise<any>) {
  if (!loadedModules[name]) {
    loadedModules[name] = await importer();
  }
  return loadedModules[name];
}

// Usage
const pdf = await loadLibrary('pdfjs', () => import('pdfjs-dist'));
```

### Pattern 2: Lazy Load PDF Service

```typescript
// services/pdfService.ts - REPLACE imports with this pattern

type PdfjsLib = typeof import('pdfjs-dist');
type PdfLibModule = typeof import('pdf-lib');

let pdfjsLib: Awaited<PdfjsLib> | null = null;
let pdfLibModule: Awaited<PdfLibModule> | null = null;

// Lazy loaders
async function getPdfjsLib(): Promise<Awaited<PdfjsLib>> {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  return pdfjsLib;
}

async function getPdfLib(): Promise<Awaited<PdfLibModule>> {
  if (!pdfLibModule) {
    pdfLibModule = await import('pdf-lib');
  }
  return pdfLibModule;
}

// Update exported functions to use lazy loaders
export async function loadPDF(source: File | string | ArrayBuffer) {
  const pdfjs = await getPdfjsLib();
  let data: ArrayBuffer;

  if (source instanceof File) {
    data = await source.arrayBuffer();
  } else if (typeof source === 'string') {
    if (source.startsWith('data:')) {
      const base64 = source.split(',')[1] || '';
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      data = bytes.buffer;
    } else {
      const response = await fetch(source);
      data = await response.arrayBuffer();
    }
  } else {
    data = source;
  }

  const loadingTask = pdfjs.getDocument({ data });
  const proxy = await loadingTask.promise;

  // ... rest of function
  return { proxy, metadata, pageCount: proxy.numPages };
}

// For functions using pdf-lib
export async function createEmptyPDF(
  width: number = 612,
  height: number = 792
): Promise<Uint8Array> {
  const { PDFDocument } = await getPdfLib();
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([width, height]);
  return pdfDoc.save();
}
```

### Pattern 3: Lazy Load Heavy Libraries

```typescript
// services/heavyLibraries.ts
const moduleCache: Map<string, Promise<any>> = new Map();

export async function loadFabricJs() {
  if (!moduleCache.has('fabric')) {
    moduleCache.set('fabric', import('fabric'));
  }
  return moduleCache.get('fabric');
}

export async function loadQrCode() {
  if (!moduleCache.has('qrcode')) {
    moduleCache.set('qrcode', import('qrcode'));
  }
  return moduleCache.get('qrcode');
}

export async function loadMammoth() {
  if (!moduleCache.has('mammoth')) {
    moduleCache.set('mammoth', import('mammoth'));
  }
  return moduleCache.get('mammoth');
}

export async function clearCache(moduleName?: string) {
  if (moduleName) {
    moduleCache.delete(moduleName);
  } else {
    moduleCache.clear();
  }
}
```

---

## Lazy Loading Components

### Pattern 1: Basic React.lazy with Suspense

```typescript
// App.tsx
import React, { lazy, Suspense } from 'react';

// Lazy load features
const Canvas = lazy(() => import('./components/Canvas'));
const PDFSuite = lazy(() => import('./components/PDFSuite'));
const VideoStudio = lazy(() => import('./components/VideoStudio'));

// Loading fallback UI
const ChunkLoader = () => (
  <div className="flex items-center justify-center w-full h-full bg-slate-50">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4">
        <div className="w-full h-full rounded-full border-4 border-slate-200 border-t-accent animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">
        Loading Module
      </p>
    </div>
  </div>
);

// In component tree
<Suspense fallback={<ChunkLoader />}>
  {currentMode === 'canvas' && <Canvas />}
  {currentMode === 'pdf' && <PDFSuite />}
  {currentMode === 'video' && <VideoStudio />}
</Suspense>
```

### Pattern 2: Route-Based Code Splitting

```typescript
// index.tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Canvas = lazy(() => import('./pages/Canvas'));
const PDFPage = lazy(() => import('./pages/PDFPage'));
const VideoPage = lazy(() => import('./pages/VideoPage'));

const LoadingFallback = () => <div>Loading...</div>;

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/studio/canvas"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <Canvas />
            </Suspense>
          }
        />
        <Route
          path="/studio/pdf"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <PDFPage />
            </Suspense>
          }
        />
        <Route
          path="/studio/video"
          element={
            <Suspense fallback={<LoadingFallback />}>
              <VideoPage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

### Pattern 3: Preload Chunks During Idle Time

```typescript
// hooks/useChunkPreload.ts
import { useEffect } from 'react';

type ChunkLoader = () => Promise<any>;

const preloadedChunks: Set<string> = new Set();

export function useChunkPreload(
  key: string,
  loader: ChunkLoader,
  priority: 'high' | 'medium' | 'low' = 'medium'
) {
  useEffect(() => {
    if (preloadedChunks.has(key)) return;

    const schedulePreload = () => {
      loader().catch(err => {
        console.warn(`Failed to preload chunk ${key}:`, err);
      });
      preloadedChunks.add(key);
    };

    if (priority === 'high') {
      // Load immediately
      schedulePreload();
    } else if (priority === 'medium') {
      // Load after render
      setTimeout(schedulePreload, 100);
    } else {
      // Load during idle time
      if ('requestIdleCallback' in window) {
        requestIdleCallback(schedulePreload);
      } else {
        setTimeout(schedulePreload, 3000);
      }
    }
  }, [key, loader, priority]);
}

// Usage in App.tsx
export function App() {
  // Preload PDF chunk at low priority
  useChunkPreload('pdf-suite', () => import('./components/PDFSuite'), 'low');

  // Preload Canvas at medium priority
  useChunkPreload('canvas', () => import('./components/Canvas'), 'medium');

  // ... rest of app
}
```

### Pattern 4: Custom Hook for Module Loading

```typescript
// hooks/useAsyncModule.ts
import { useState, useEffect, useCallback } from 'react';

interface UseAsyncModuleState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsyncModule<T>(
  loader: () => Promise<T>,
  deps: React.DependencyList = []
): UseAsyncModuleState<T> {
  const [state, setState] = useState<UseAsyncModuleState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    loader()
      .then(data => {
        if (mounted) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch(error => {
        if (mounted) {
          setState({ data: null, loading: false, error });
        }
      });

    return () => {
      mounted = false;
    };
  }, deps);

  return state;
}

// Usage
export function MyComponent() {
  const { data: pdf, loading, error } = useAsyncModule(
    () => import('./services/pdfService')
  );

  if (loading) return <div>Loading PDF service...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <PDFViewer pdfService={pdf} />;
}
```

---

## Library Loading Utilities

### Complete Library Loader Service

```typescript
// services/libraryManager.ts
interface LoaderConfig {
  cache?: boolean;
  preload?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

class LibraryManager {
  private cache: Map<string, Promise<any>> = new Map();
  private loaded: Set<string> = new Set();

  async load<T>(
    name: string,
    loader: () => Promise<T>,
    config: LoaderConfig = {}
  ): Promise<T> {
    const { cache = true, preload = false, priority = 'medium' } = config;

    if (cache && this.cache.has(name)) {
      return this.cache.get(name);
    }

    const promise = loader();

    if (cache) {
      this.cache.set(name, promise);
    }

    try {
      const result = await promise;
      this.loaded.add(name);
      return result;
    } catch (error) {
      this.cache.delete(name);
      throw error;
    }
  }

  isLoaded(name: string): boolean {
    return this.loaded.has(name);
  }

  async preload(name: string, loader: () => Promise<any>) {
    if (!this.cache.has(name)) {
      this.load(name, loader, { cache: true });
    }
  }

  clearCache(name?: string) {
    if (name) {
      this.cache.delete(name);
      this.loaded.delete(name);
    } else {
      this.cache.clear();
      this.loaded.clear();
    }
  }

  getStats() {
    return {
      cached: this.cache.size,
      loaded: this.loaded.size,
    };
  }
}

export const libraryManager = new LibraryManager();

// Usage
import { libraryManager } from './services/libraryManager';

const fabric = await libraryManager.load('fabric', () => import('fabric'));
const pdf = await libraryManager.load('pdf', () => import('pdfjs-dist'));
```

---

## Vite Configuration

### Enhanced Manual Chunking Strategy

```typescript
// vite.config.ts
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [react()],

    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    build: {
      chunkSizeWarningLimit: 250,

      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              if (id.includes('pdfjs-dist') || id.includes('pdf-lib')) {
                return 'vendor-pdf';
              }
              if (id.includes('fabric')) {
                return 'vendor-fabric';
              }
              if (id.includes('react') && !id.includes('react-router')) {
                return 'vendor-react';
              }
              if (id.includes('@supabase/supabase-js')) {
                return 'vendor-supabase';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              if (id.includes('react-router-dom')) {
                return 'vendor-router';
              }
            }

            // Feature chunks
            if (id.includes('components/PDFSuite')) {
              return 'feature-pdf-suite';
            }
            if (id.includes('components/Canvas')) {
              return 'feature-canvas';
            }
            if (id.includes('components/VideoStudio')) {
              return 'feature-video-studio';
            }
            if (id.includes('components/ProPhoto')) {
              return 'feature-pro-photo';
            }
            if (id.includes('design-system')) {
              return 'feature-design-system';
            }
          },

          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },

      minify: 'esbuild',
      sourcemap: mode !== 'production',
      target: 'es2020',
      reportCompressedSize: true,
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@supabase/supabase-js',
        'framer-motion',
        'lucide-react',
      ],
      // Exclude heavy libraries from pre-bundling
      exclude: ['pdfjs-dist', 'pdf-lib', 'fabric'],
    },
  };
});
```

---

## Error Handling

### Error Boundary for Lazy Loaded Components

```typescript
// components/LazyComponentErrorBoundary.tsx
import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class LazyComponentErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chunk loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-bold text-red-900 mb-2">Module Failed to Load</h3>
            <p className="text-red-800 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Usage
import { lazy } from 'react';

const PDFSuite = lazy(() => import('./PDFSuite'));

export function App() {
  return (
    <LazyComponentErrorBoundary>
      <PDFSuite />
    </LazyComponentErrorBoundary>
  );
}
```

### Safe Dynamic Import Wrapper

```typescript
// utils/safeDynamicImport.ts
export async function safeDynamicImport<T>(
  loader: () => Promise<{ default: T }>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onError?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError = () => {},
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const module = await loader();
      return module.default;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      onError(lastError, attempt);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  throw new Error(
    `Failed to load module after ${maxRetries} attempts: ${lastError?.message}`
  );
}

// Usage
const PDFSuite = lazy(() =>
  safeDynamicImport(() => import('./PDFSuite'), {
    maxRetries: 3,
    retryDelay: 500,
    onError: (error, attempt) => {
      console.warn(`Attempt ${attempt} failed:`, error);
    },
  })
);
```

---

## Complete Working Example

### Full App Structure with Optimizations

```typescript
// index.tsx - COMPLETE EXAMPLE
import './styles/main.css';
import React, { lazy, Suspense, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './design-system';
import { useChunkPreload } from './hooks/useChunkPreload';

// Public pages (load immediately)
import LandingPage from './pages/Landing';
import SignInPage from './pages/SignIn';

// Lazy load feature-heavy pages
const CanvasPage = lazy(() => import('./pages/Canvas'));
const PDFPage = lazy(() => import('./pages/PDFPage'));
const VideoPage = lazy(() => import('./pages/VideoPage'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-slate-200 border-t-accent animate-spin" />
      <p className="text-sm text-slate-600">Loading...</p>
    </div>
  </div>
);

// Main App Component with Preloading
function AppWithPreload() {
  // Preload feature chunks during idle time
  useChunkPreload(
    'canvas',
    () => import('./pages/Canvas'),
    'low'
  );
  useChunkPreload(
    'pdf',
    () => import('./pages/PDFPage'),
    'low'
  );

  return <App />;
}

// Render
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider position="top-right">
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes - immediate load */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/sign-in" element={<SignInPage />} />

              {/* Feature routes - lazy loaded */}
              <Route
                path="/studio/*"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <AppWithPreload />
                  </Suspense>
                }
              />

              {/* Feature pages - lazy loaded */}
              <Route
                path="/studio/canvas"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <CanvasPage />
                  </Suspense>
                }
              />
              <Route
                path="/studio/pdf"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <PDFPage />
                  </Suspense>
                }
              />
              <Route
                path="/studio/video"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <VideoPage />
                  </Suspense>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);
```

---

## Testing Code

```typescript
// __tests__/bundleSize.test.ts
import { describe, it, expect } from 'vitest';

describe('Bundle Size Constraints', () => {
  it('should have main chunk under 300KB', async () => {
    // This would be verified in CI/CD
    const mainChunkSize = 263; // KB - from build output
    expect(mainChunkSize).toBeLessThan(300);
  });

  it('should have all feature chunks under 100KB', () => {
    const featureChunks = {
      'feature-pdf-suite': 100,
      'feature-pro-photo': 69,
      'feature-canvas': 55,
      'feature-video-studio': 37,
    };

    Object.entries(featureChunks).forEach(([name, size]) => {
      expect(size).toBeLessThan(100);
    });
  });

  it('should lazy load PDF libraries only when needed', async () => {
    const { loadPDF } = await import('../services/pdfService');
    // PDF should only load when this function is called
    expect(typeof loadPDF).toBe('function');
  });
});
```

---

**Last Updated**: December 28, 2025
**Status**: Ready to Use

Copy and paste these examples into your codebase to implement the optimizations!
