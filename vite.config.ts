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
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 500,
        rollupOptions: {
          output: {
            // Manual chunks for better code splitting
            manualChunks: {
              // React core
              'vendor-react': ['react', 'react-dom'],
              // Supabase auth
              'vendor-supabase': ['@supabase/supabase-js'],
              // Animation library
              'vendor-motion': ['framer-motion'],
              // Router
              'vendor-router': ['react-router-dom'],
              // Google AI services
              'vendor-google-ai': ['@google/genai'],
              // Icons
              'vendor-icons': ['lucide-react'],
            },
          },
        },
        // Minification options - use esbuild for faster builds
        minify: 'esbuild',
        // Generate source maps for debugging
        sourcemap: mode !== 'production',
        // Target modern browsers for smaller bundle
        target: 'es2020',
      },
      // Optimize deps
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          '@supabase/supabase-js',
        ],
      },
    };
});
