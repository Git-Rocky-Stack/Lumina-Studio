/**
 * OptimizedImage Component
 *
 * A high-performance image component with:
 * - Lazy loading with Intersection Observer
 * - Blur-up placeholder effect
 * - Responsive srcset generation
 * - WebP/AVIF format detection
 * - Error fallback handling
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getOptimizedUrl,
  generateSrcSet,
  generateSizes,
  generatePlaceholder,
  ImageOptions,
} from '../services/imageOptimization';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty' | 'skeleton';
  blurDataURL?: string;
  onLoadComplete?: () => void;
  sizes?: string;
  aspectRatio?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 80,
  placeholder = 'blur',
  blurDataURL,
  onLoadComplete,
  sizes,
  aspectRatio,
  objectFit = 'cover',
  className = '',
  style,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [placeholderSrc, setPlaceholderSrc] = useState(blurDataURL || '');
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate placeholder on mount
  useEffect(() => {
    if (placeholder === 'blur' && !blurDataURL && src) {
      generatePlaceholder(src, 20).then(setPlaceholderSrc);
    }
  }, [src, placeholder, blurDataURL]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoadComplete?.();
  }, [onLoadComplete]);

  // Handle image error
  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  // Calculate dimensions
  const computedWidth = width || (aspectRatio && height ? height * aspectRatio : undefined);
  const computedHeight = height || (aspectRatio && width ? width / aspectRatio : undefined);

  // Generate optimized URL and srcset
  const optimizedSrc = getOptimizedUrl(src, { width: computedWidth, height: computedHeight, quality });
  const srcSet = generateSrcSet(src, { quality });
  const computedSizes = sizes || generateSizes();

  // Error fallback
  if (hasError) {
    return (
      <div
        ref={containerRef}
        className={`bg-slate-100 flex items-center justify-center ${className}`}
        style={{
          width: computedWidth,
          height: computedHeight,
          aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
          ...style,
        }}
      >
        <div className="text-center text-slate-400 p-4">
          <i className="fas fa-image text-2xl mb-2 block"></i>
          <span className="text-xs">Failed to load</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: computedWidth,
        height: computedHeight,
        aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
        ...style,
      }}
    >
      {/* Placeholder */}
      {placeholder === 'blur' && placeholderSrc && !isLoaded && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl"
          style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
        />
      )}

      {placeholder === 'skeleton' && !isLoaded && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse" />
      )}

      {/* Actual image */}
      {isInView && (
        <img
          ref={imgRef}
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={computedSizes}
          alt={alt}
          width={computedWidth}
          height={computedHeight}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            objectFit,
          }}
          {...props}
        />
      )}

      {/* Loading indicator */}
      {isInView && !isLoaded && placeholder === 'empty' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-accent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;

// Hook for preloading images
export const useImagePreload = (urls: string[]) => {
  useEffect(() => {
    urls.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }, [urls]);
};
