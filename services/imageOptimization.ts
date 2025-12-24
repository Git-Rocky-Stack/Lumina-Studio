/**
 * Image Optimization Pipeline
 *
 * Handles WebP/AVIF conversion, responsive srcset generation,
 * lazy loading, and CDN-backed image optimization.
 */

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number;
  placeholder?: boolean;
}

export interface ResponsiveImage {
  src: string;
  srcSet: string;
  sizes: string;
  placeholder: string;
  width: number;
  height: number;
}

// Cloudflare Images or similar CDN endpoint
const CDN_BASE = 'https://imagedelivery.net';
const FALLBACK_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+';

// Standard breakpoints for responsive images
const BREAKPOINTS = [320, 480, 640, 768, 1024, 1280, 1536, 1920];

/**
 * Check if browser supports WebP
 */
export const supportsWebP = (): boolean => {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
};

/**
 * Check if browser supports AVIF
 */
export const supportsAVIF = async (): Promise<boolean> => {
  if (typeof Image === 'undefined') return false;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABpAQ0AIyDWdSQQoGOAGGZBp+eQ/5y/k=';
  });
};

/**
 * Generate optimized image URL with transformations
 */
export const getOptimizedUrl = (
  originalUrl: string,
  options: ImageOptions = {}
): string => {
  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    fit = 'cover',
  } = options;

  // For external URLs, use a CDN transform proxy
  if (originalUrl.startsWith('http')) {
    // Use Cloudflare Polish or similar
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    params.set('q', quality.toString());
    params.set('fit', fit);
    if (format !== 'auto') params.set('f', format);

    // If using Cloudflare Images
    // return `${CDN_BASE}/YOUR_ACCOUNT_ID/${originalUrl}/${params.toString()}`;

    // Fallback: return original with query params for future CDN integration
    const separator = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${separator}${params.toString()}`;
  }

  return originalUrl;
};

/**
 * Generate responsive srcset for an image
 */
export const generateSrcSet = (
  originalUrl: string,
  options: ImageOptions = {}
): string => {
  const { quality = 80, format = 'auto' } = options;

  return BREAKPOINTS
    .map(width => {
      const url = getOptimizedUrl(originalUrl, { ...options, width, quality, format });
      return `${url} ${width}w`;
    })
    .join(', ');
};

/**
 * Generate sizes attribute for responsive images
 */
export const generateSizes = (config: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  default?: string;
} = {}): string => {
  const {
    mobile = '100vw',
    tablet = '50vw',
    desktop = '33vw',
    default: defaultSize = '100vw'
  } = config;

  return [
    `(max-width: 640px) ${mobile}`,
    `(max-width: 1024px) ${tablet}`,
    `(max-width: 1536px) ${desktop}`,
    defaultSize
  ].join(', ');
};

/**
 * Generate a tiny placeholder image (LQIP - Low Quality Image Placeholder)
 */
export const generatePlaceholder = async (
  originalUrl: string,
  width: number = 20
): Promise<string> => {
  try {
    // Create a tiny version of the image
    const img = new Image();
    img.crossOrigin = 'anonymous';

    return new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const aspectRatio = img.height / img.width;
        canvas.width = width;
        canvas.height = Math.round(width * aspectRatio);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.1));
        } else {
          resolve(FALLBACK_PLACEHOLDER);
        }
      };
      img.onerror = () => resolve(FALLBACK_PLACEHOLDER);
      img.src = originalUrl;
    });
  } catch {
    return FALLBACK_PLACEHOLDER;
  }
};

/**
 * Create a complete responsive image object
 */
export const createResponsiveImage = async (
  originalUrl: string,
  options: ImageOptions & {
    aspectRatio?: number;
    sizesConfig?: Parameters<typeof generateSizes>[0];
  } = {}
): Promise<ResponsiveImage> => {
  const { aspectRatio = 16 / 9, sizesConfig, ...imageOptions } = options;
  const width = options.width || 1920;
  const height = options.height || Math.round(width / aspectRatio);

  const [placeholder] = await Promise.all([
    generatePlaceholder(originalUrl),
  ]);

  return {
    src: getOptimizedUrl(originalUrl, { ...imageOptions, width, height }),
    srcSet: generateSrcSet(originalUrl, imageOptions),
    sizes: generateSizes(sizesConfig),
    placeholder,
    width,
    height,
  };
};

/**
 * Preload critical images
 */
export const preloadImage = (url: string, options: ImageOptions = {}): void => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = getOptimizedUrl(url, options);

  if (options.format === 'webp') {
    link.type = 'image/webp';
  } else if (options.format === 'avif') {
    link.type = 'image/avif';
  }

  document.head.appendChild(link);
};

/**
 * Intersection Observer for lazy loading
 */
export const createLazyLoader = (
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px 0px',
    threshold: 0.01,
    ...options,
  };

  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    });
  }, defaultOptions);
};

/**
 * Convert image to WebP format client-side
 */
export const convertToWebP = async (
  file: File,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not convert to WebP'));
          }
        },
        'image/webp',
        quality
      );
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Get optimal format based on browser support
 */
export const getOptimalFormat = async (): Promise<'avif' | 'webp' | 'jpeg'> => {
  if (await supportsAVIF()) return 'avif';
  if (supportsWebP()) return 'webp';
  return 'jpeg';
};

// Image cache for repeated requests
const imageCache = new Map<string, ResponsiveImage>();

/**
 * Get or create cached responsive image
 */
export const getCachedResponsiveImage = async (
  url: string,
  options: Parameters<typeof createResponsiveImage>[1] = {}
): Promise<ResponsiveImage> => {
  const cacheKey = `${url}-${JSON.stringify(options)}`;

  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  const image = await createResponsiveImage(url, options);
  imageCache.set(cacheKey, image);

  // Limit cache size
  if (imageCache.size > 100) {
    const firstKey = imageCache.keys().next().value;
    if (firstKey) imageCache.delete(firstKey);
  }

  return image;
};

export default {
  getOptimizedUrl,
  generateSrcSet,
  generateSizes,
  generatePlaceholder,
  createResponsiveImage,
  preloadImage,
  createLazyLoader,
  convertToWebP,
  getOptimalFormat,
  getCachedResponsiveImage,
  supportsWebP,
  supportsAVIF,
};
