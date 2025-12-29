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
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Increase chunk size warning limit (we're being more granular now)
        chunkSizeWarningLimit: 250,
        rollupOptions: {
          output: {
            // Manual chunks strategy: feature-based splitting
            manualChunks(id) {
              // Vendor chunks - keep these separate
              if (id.includes('node_modules')) {
                // PDF libraries - separate chunk due to size
                if (id.includes('pdfjs-dist') || id.includes('pdf-lib')) {
                  return 'vendor-pdf';
                }
                // Fabric.js (canvas library) - separate chunk
                if (id.includes('fabric')) {
                  return 'vendor-fabric';
                }
                // React core
                if (id.includes('react') && !id.includes('react-router') && !id.includes('@vitejs')) {
                  return 'vendor-react';
                }
                // Supabase auth - has dependencies
                if (id.includes('@supabase/supabase-js')) {
                  return 'vendor-supabase';
                }
                // Framer Motion - animation library
                if (id.includes('framer-motion')) {
                  return 'vendor-motion';
                }
                // Router
                if (id.includes('react-router-dom')) {
                  return 'vendor-router';
                }
                // Google AI services
                if (id.includes('@google/genai')) {
                  return 'vendor-google-ai';
                }
                // Icons
                if (id.includes('lucide-react')) {
                  return 'vendor-icons';
                }
                // Mammoth (document parsing)
                if (id.includes('mammoth')) {
                  return 'vendor-doc-parse';
                }
              }

              // Feature-based splitting for app code
              // PDF Suite components
              if (id.includes('components/PDFSuite')) {
                return 'feature-pdf-suite';
              }
              // Canvas components
              if (id.includes('components/Canvas') || id.includes('components/canvas/')) {
                return 'feature-canvas';
              }
              // Video Studio
              if (id.includes('components/VideoStudio')) {
                return 'feature-video-studio';
              }
              // Photo Editor
              if (id.includes('components/ProPhoto')) {
                return 'feature-pro-photo';
              }
              // AI Stock Generator
              if (id.includes('components/AIStockGen')) {
                return 'feature-ai-stock';
              }
              // Brand Hub
              if (id.includes('components/BrandHub')) {
                return 'feature-brand-hub';
              }
              // Marketing Hub
              if (id.includes('components/MarketingHub')) {
                return 'feature-marketing-hub';
              }
              // Asset Hub
              if (id.includes('components/AssetHub')) {
                return 'feature-asset-hub';
              }
              // Design System components
              if (id.includes('design-system/')) {
                return 'feature-design-system';
              }
            },
            // Optimize chunk file names
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash][extname]',
          },
        },
        // Minification options - use esbuild for faster builds
        minify: 'esbuild',
        // Generate source maps for debugging
        sourcemap: mode !== 'production',
        // Target modern browsers for smaller bundle
        target: 'es2020',
        // Optimize rollup options
        reportCompressedSize: true,
      },
      // Optimize deps
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          '@supabase/supabase-js',
          'react-router-dom',
          'framer-motion',
          'lucide-react',
        ],
        // Exclude heavy libraries from pre-bundling (they're dynamically imported)
        exclude: ['pdfjs-dist', 'pdf-lib', 'fabric'],
      },
    };
});
