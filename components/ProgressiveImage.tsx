import React, { useState, useEffect, useRef } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
  blurAmount?: number;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * ProgressiveImage Component
 *
 * Provides smooth image loading with:
 * - Lazy loading using Intersection Observer
 * - Blur-up placeholder animation
 * - Error handling with fallback
 * - Accessibility support
 */
const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className = '',
  placeholderColor = 'bg-slate-800',
  blurAmount = 20,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
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
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Placeholder */}
      <div
        className={`absolute inset-0 ${placeholderColor} transition-opacity duration-500 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden="true"
      >
        {/* Loading shimmer animation */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        )}
      </div>

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-center text-slate-500">
            <i className="fas fa-image-slash text-2xl mb-2" aria-hidden="true" />
            <p className="text-xs">Failed to load image</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-all duration-700 ${
            isLoaded ? 'opacity-100 blur-0' : `opacity-0 blur-[${blurAmount}px]`
          }`}
          style={{
            filter: isLoaded ? 'blur(0)' : `blur(${blurAmount}px)`,
          }}
        />
      )}
    </div>
  );
};

/**
 * BackgroundImage Component
 *
 * Optimized background image with progressive loading
 */
export const BackgroundImage: React.FC<{
  src: string;
  alt?: string;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  children?: React.ReactNode;
}> = ({
  src,
  alt = 'Background image',
  className = '',
  overlay = false,
  overlayOpacity = 0.5,
  children,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px', threshold: 0.01 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
  }, [isInView, src]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Background */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          backgroundImage: isLoaded ? `url(${src})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: isLoaded ? 1 : 0,
        }}
        role="img"
        aria-label={alt}
      />

      {/* Placeholder gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 transition-opacity duration-700 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden="true"
      />

      {/* Optional overlay */}
      {overlay && (
        <div
          className="absolute inset-0 bg-slate-950"
          style={{ opacity: overlayOpacity }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

/**
 * Avatar Component with progressive loading
 */
export const Avatar: React.FC<{
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackInitials?: string;
  className?: string;
}> = ({ src, alt, size = 'md', fallbackInitials, className = '' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-lg',
  };

  const initials = fallbackInitials || alt.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      className={`relative rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      {/* Fallback */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white transition-opacity duration-300 ${
          isLoaded && !hasError ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {initials}
      </div>

      {/* Image */}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};

export default ProgressiveImage;
