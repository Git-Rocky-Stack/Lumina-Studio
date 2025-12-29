/**
 * Lazy Load Service
 * Dynamically imports heavy dependencies to improve initial bundle size
 * and code splitting efficiency
 */

// Cache for loaded modules
const moduleCache = new Map<string, Promise<any>>();

/**
 * Lazy load the PDF service
 * pdfjs-dist + pdf-lib are loaded on-demand when PDF features are accessed
 */
export const lazyLoadPdfService = async () => {
  if (!moduleCache.has('pdfService')) {
    moduleCache.set('pdfService', import('./pdfService'));
  }
  return moduleCache.get('pdfService');
};

/**
 * Lazy load Fabric.js for canvas operations
 * Large library that's only needed in Canvas component
 */
export const lazyLoadFabricJs = async () => {
  if (!moduleCache.has('fabric')) {
    moduleCache.set('fabric', import('fabric'));
  }
  return moduleCache.get('fabric');
};

/**
 * Lazy load Mammoth for document parsing
 * Only needed when importing Word documents
 */
export const lazyLoadMammoth = async () => {
  if (!moduleCache.has('mammoth')) {
    moduleCache.set('mammoth', import('mammoth'));
  }
  return moduleCache.get('mammoth');
};

/**
 * Lazy load QR Code library
 * Only needed for QR code generation features
 */
export const lazyLoadQrCode = async () => {
  if (!moduleCache.has('qrcode')) {
    moduleCache.set('qrcode', import('qrcode'));
  }
  return moduleCache.get('qrcode');
};

/**
 * Lazy load Sharp for image processing (if used server-side)
 * Note: Sharp is for Node.js, consider using browser alternatives
 */
export const lazyLoadImageProcessor = async () => {
  if (!moduleCache.has('imageProcessor')) {
    // For now, this would need to be implemented as a service
    // using browser-compatible image processing libraries
    moduleCache.set('imageProcessor', Promise.resolve({}));
  }
  return moduleCache.get('imageProcessor');
};

/**
 * Preload critical modules ahead of time
 * Call this during idle time or after initial render
 */
export const preloadCriticalModules = () => {
  // Preload modules that are likely to be used soon
  requestIdleCallback?.(() => {
    // Preload PDF service if user is likely to use PDF features
    lazyLoadPdfService().catch(err => console.warn('Failed to preload PDF service:', err));
  }) || setTimeout(() => {
    lazyLoadPdfService().catch(err => console.warn('Failed to preload PDF service:', err));
  }, 3000);
};

/**
 * Clear module cache (useful for testing or memory management)
 */
export const clearModuleCache = () => {
  moduleCache.clear();
};
