/**
 * Progressive Image Component
 *
 * World-class image loading with:
 * - Blur-up placeholder technique
 * - Lazy loading with Intersection Observer
 * - Smooth transition from placeholder to full image
 * - Error handling with fallback
 * - Responsive srcset support
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springs } from '../animations';

// ============================================================================
// TYPES
// ============================================================================

interface ProgressiveImageProps {
  src: string;
  alt: string;
  placeholder?: string; // Low-quality placeholder
  blurhash?: string; // Blurhash string
  width?: number;
  height?: number;
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2' | '21:9' | 'auto';
  className?: string;
  imgClassName?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallback?: React.ReactNode;
  srcSet?: string;
  sizes?: string;
}

// ============================================================================
// ASPECT RATIO MAP
// ============================================================================

const aspectRatioMap = {
  '1:1': 'aspect-square',
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '3:2': 'aspect-[3/2]',
  '21:9': 'aspect-[21/9]',
  'auto': '',
};

// ============================================================================
// DEFAULT PLACEHOLDER (Subtle gradient)
// ============================================================================

const defaultPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNlMmU4ZjAiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNjYmQzZGUiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+';

// ============================================================================
// PROGRESSIVE IMAGE COMPONENT
// ============================================================================

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  placeholder = defaultPlaceholder,
  blurhash,
  width,
  height,
  aspectRatio = 'auto',
  className = '',
  imgClassName = '',
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError,
  fallback,
  srcSet,
  sizes,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(loading === 'eager');
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Start loading slightly before in view
        threshold: 0,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  }[objectFit];

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${aspectRatioMap[aspectRatio]} ${className}`}
      style={{
        width: width ? `${width}px` : undefined,
        height: height && aspectRatio === 'auto' ? `${height}px` : undefined,
      }}
    >
      {/* Placeholder layer */}
      <AnimatePresence>
        {!isLoaded && !hasError && (
          <motion.div
            className="absolute inset-0 bg-slate-200 dark:bg-slate-700"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Low-quality placeholder image */}
            <img
              src={placeholder}
              alt=""
              className={`w-full h-full ${objectFitClass} blur-lg scale-110`}
              aria-hidden="true"
            />

            {/* Shimmer overlay */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              }}
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          {fallback || (
            <div className="text-center text-slate-400 dark:text-slate-500">
              <svg
                className="w-12 h-12 mx-auto mb-2 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm">Failed to load</p>
            </div>
          )}
        </div>
      )}

      {/* Main image */}
      {isInView && !hasError && (
        <motion.img
          ref={imgRef}
          src={src}
          alt={alt}
          srcSet={srcSet}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={springs.smooth}
          className={`
            absolute inset-0 w-full h-full
            ${objectFitClass}
            ${imgClassName}
          `}
          loading={loading}
        />
      )}
    </div>
  );
};

// ============================================================================
// AVATAR WITH PROGRESSIVE LOADING
// ============================================================================

interface ProgressiveAvatarProps {
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fallbackInitials?: string;
  className?: string;
}

const avatarSizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
};

export const ProgressiveAvatar: React.FC<ProgressiveAvatarProps> = ({
  src,
  alt,
  size = 'md',
  fallbackInitials,
  className = '',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const initials = fallbackInitials || alt.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      className={`
        relative overflow-hidden rounded-full
        bg-gradient-to-br from-indigo-400 to-violet-500
        ${avatarSizes[size]}
        ${className}
      `}
    >
      {/* Initials fallback */}
      {(!isLoaded || hasError) && (
        <div className="absolute inset-0 flex items-center justify-center text-white font-semibold">
          {initials}
        </div>
      )}

      {/* Image */}
      {!hasError && (
        <motion.img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </div>
  );
};

// ============================================================================
// BACKGROUND IMAGE WITH LOADING
// ============================================================================

interface ProgressiveBackgroundProps {
  src: string;
  placeholder?: string;
  children?: React.ReactNode;
  className?: string;
  overlayClassName?: string;
}

export const ProgressiveBackground: React.FC<ProgressiveBackgroundProps> = ({
  src,
  placeholder = defaultPlaceholder,
  children,
  className = '',
  overlayClassName = 'bg-black/50',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background image */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${currentSrc})` }}
        initial={{ scale: 1.1, filter: 'blur(20px)' }}
        animate={{
          scale: isLoaded ? 1 : 1.1,
          filter: isLoaded ? 'blur(0px)' : 'blur(20px)',
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Overlay */}
      <div className={`absolute inset-0 ${overlayClassName}`} />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default ProgressiveImage;
