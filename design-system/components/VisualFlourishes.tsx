/**
 * Visual Flourishes
 * Gradient borders, Enhanced glass morphism, Aurora backgrounds, Success animations, Mode transitions
 */

import React, { useState, useEffect } from 'react';

// ============================================================================
// GRADIENT BORDER
// ============================================================================

interface GradientBorderProps {
  children: React.ReactNode;
  gradient?: string;
  borderWidth?: number;
  borderRadius?: number;
  animated?: boolean;
  className?: string;
}

export const GradientBorder: React.FC<GradientBorderProps> = ({
  children,
  gradient = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
  borderWidth = 2,
  borderRadius = 16,
  animated = false,
  className = '',
}) => {
  return (
    <div
      className={`relative p-[${borderWidth}px] ${className}`}
      style={{
        background: gradient,
        borderRadius,
        animation: animated ? 'gradient-rotate 3s linear infinite' : undefined,
      }}
    >
      <div
        className="bg-white h-full"
        style={{ borderRadius: borderRadius - borderWidth }}
      >
        {children}
      </div>
      {animated && (
        <style>{`
          @keyframes gradient-rotate {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
          }
        `}</style>
      )}
    </div>
  );
};

// ============================================================================
// ANIMATED GRADIENT BORDER
// ============================================================================

interface AnimatedBorderProps {
  children: React.ReactNode;
  colors?: string[];
  speed?: number;
  borderWidth?: number;
  borderRadius?: number;
  glowIntensity?: number;
  className?: string;
}

export const AnimatedBorder: React.FC<AnimatedBorderProps> = ({
  children,
  colors = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b', '#10b981'],
  speed = 3,
  borderWidth = 2,
  borderRadius = 16,
  glowIntensity = 0.3,
  className = '',
}) => {
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ borderRadius }}
      >
        <defs>
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse">
            {colors.map((color, i) => (
              <stop
                key={i}
                offset={`${(i / (colors.length - 1)) * 100}%`}
                stopColor={color}
              >
                <animate
                  attributeName="offset"
                  values={`${(i / colors.length) * 100}%;${((i + 1) / colors.length) * 100}%;${(i / colors.length) * 100}%`}
                  dur={`${speed}s`}
                  repeatCount="indefinite"
                />
              </stop>
            ))}
          </linearGradient>
        </defs>
        <rect
          x={borderWidth / 2}
          y={borderWidth / 2}
          width={`calc(100% - ${borderWidth}px)`}
          height={`calc(100% - ${borderWidth}px)`}
          rx={borderRadius - borderWidth / 2}
          ry={borderRadius - borderWidth / 2}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={borderWidth}
          style={{
            filter: `drop-shadow(0 0 ${glowIntensity * 20}px ${colors[0]}40)`,
          }}
        />
      </svg>
      <div
        className="relative bg-white"
        style={{
          borderRadius,
          margin: borderWidth,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// ENHANCED GLASS PANEL
// ============================================================================

interface EnhancedGlassPanelProps {
  children: React.ReactNode;
  variant?: 'light' | 'dark' | 'frosted' | 'colored';
  blur?: number;
  opacity?: number;
  borderOpacity?: number;
  accentColor?: string;
  className?: string;
}

export const EnhancedGlassPanel: React.FC<EnhancedGlassPanelProps> = ({
  children,
  variant = 'light',
  blur = 20,
  opacity = 0.7,
  borderOpacity = 0.2,
  accentColor = '#6366f1',
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'dark':
        return {
          background: `rgba(0, 0, 0, ${opacity})`,
          borderColor: `rgba(255, 255, 255, ${borderOpacity})`,
        };
      case 'frosted':
        return {
          background: `rgba(255, 255, 255, ${opacity * 0.6})`,
          borderColor: `rgba(255, 255, 255, ${borderOpacity * 2})`,
        };
      case 'colored':
        return {
          background: `${accentColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
          borderColor: `${accentColor}${Math.round(borderOpacity * 255).toString(16).padStart(2, '0')}`,
        };
      default:
        return {
          background: `rgba(255, 255, 255, ${opacity})`,
          borderColor: `rgba(255, 255, 255, ${borderOpacity})`,
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: styles.background,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        border: `1px solid ${styles.borderColor}`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// ============================================================================
// AURORA BACKGROUND ENHANCED
// ============================================================================

interface AuroraBackgroundEnhancedProps {
  colors?: string[];
  speed?: 'slow' | 'medium' | 'fast';
  intensity?: number;
  children?: React.ReactNode;
  className?: string;
}

export const AuroraBackgroundEnhanced: React.FC<AuroraBackgroundEnhancedProps> = ({
  colors = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'],
  speed = 'medium',
  intensity = 0.5,
  children,
  className = '',
}) => {
  const speedMap = { slow: 20, medium: 12, fast: 6 };
  const duration = speedMap[speed];

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0">
        {colors.map((color, i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at ${30 + i * 20}% ${40 + i * 10}%, ${color}${Math.round(intensity * 128).toString(16).padStart(2, '0')} 0%, transparent 50%)`,
              animation: `aurora-float-${i} ${duration + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * -3}s`,
            }}
          />
        ))}
      </div>
      <div className="relative z-10">{children}</div>
      <style>{`
        @keyframes aurora-float-0 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(10%, -5%) scale(1.1); }
          50% { transform: translate(-5%, 10%) scale(0.9); }
          75% { transform: translate(-10%, -10%) scale(1.05); }
        }
        @keyframes aurora-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-15%, 10%) scale(1.15); }
          50% { transform: translate(10%, -10%) scale(0.95); }
          75% { transform: translate(5%, 15%) scale(1.1); }
        }
        @keyframes aurora-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(5%, 15%) scale(0.9); }
          50% { transform: translate(-15%, -5%) scale(1.1); }
          75% { transform: translate(10%, 5%) scale(1); }
        }
        @keyframes aurora-float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-10%, -15%) scale(1.05); }
          50% { transform: translate(15%, 10%) scale(0.95); }
          75% { transform: translate(-5%, -10%) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// SUCCESS ANIMATION
// ============================================================================

interface SuccessAnimationProps {
  show: boolean;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'check' | 'star' | 'confetti' | 'pulse';
  message?: string;
  className?: string;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  show,
  onComplete,
  size = 'md',
  variant = 'check',
  message,
  className = '',
}) => {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  const sizeMap = { sm: 48, md: 80, lg: 120 };
  const iconSize = sizeMap[size];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-300 ${className}`}>
      <div className="text-center animate-in zoom-in-50 duration-500">
        {variant === 'check' && (
          <div
            className="relative mx-auto mb-4 rounded-full bg-emerald-500"
            style={{ width: iconSize, height: iconSize }}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 52 52">
              <circle
                cx="26"
                cy="26"
                r="25"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
              />
              <circle
                cx="26"
                cy="26"
                r="25"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="166"
                strokeDashoffset="166"
                style={{ animation: 'success-circle 0.6s ease-out forwards' }}
              />
              <path
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 27l7 7 16-16"
                strokeDasharray="50"
                strokeDashoffset="50"
                style={{ animation: 'success-check 0.3s ease-out 0.6s forwards' }}
              />
            </svg>
          </div>
        )}

        {variant === 'star' && (
          <div className="relative mx-auto mb-4" style={{ width: iconSize, height: iconSize }}>
            <i
              className="fas fa-star text-amber-500"
              style={{
                fontSize: iconSize * 0.6,
                animation: 'success-star 0.5s ease-out forwards',
              }}
            />
            {[...Array(8)].map((_, i) => (
              <i
                key={i}
                className="fas fa-star absolute text-amber-300"
                style={{
                  fontSize: iconSize * 0.15,
                  top: '50%',
                  left: '50%',
                  animation: `success-particle 0.6s ease-out ${i * 0.05}s forwards`,
                  '--angle': `${i * 45}deg`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        )}

        {variant === 'pulse' && (
          <div
            className="relative mx-auto mb-4 rounded-full bg-accent"
            style={{ width: iconSize, height: iconSize }}
          >
            <div
              className="absolute inset-0 rounded-full bg-accent"
              style={{ animation: 'success-pulse 1s ease-out infinite' }}
            />
            <i
              className="fas fa-check absolute inset-0 flex items-center justify-center text-white"
              style={{ fontSize: iconSize * 0.4 }}
            />
          </div>
        )}

        {message && (
          <p className="text-lg font-bold text-white animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            {message}
          </p>
        )}
      </div>

      <style>{`
        @keyframes success-circle {
          to { stroke-dashoffset: 0; }
        }
        @keyframes success-check {
          to { stroke-dashoffset: 0; }
        }
        @keyframes success-star {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(0deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes success-particle {
          0% { transform: translate(-50%, -50%) rotate(var(--angle)) translateY(0) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(var(--angle)) translateY(-${iconSize}px) scale(1); opacity: 0; }
        }
        @keyframes success-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// MODE TRANSITION
// ============================================================================

interface ModeTransitionProps {
  children: React.ReactNode;
  mode: string;
  transitionType?: 'fade' | 'slide' | 'zoom' | 'flip' | 'morph';
  duration?: number;
  className?: string;
}

export const ModeTransition: React.FC<ModeTransitionProps> = ({
  children,
  mode,
  transitionType = 'fade',
  duration = 300,
  className = '',
}) => {
  const [displayMode, setDisplayMode] = useState(mode);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (mode !== displayMode) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayMode(mode);
        setIsTransitioning(false);
      }, duration / 2);
      return () => clearTimeout(timer);
    }
  }, [mode, displayMode, duration]);

  const getTransitionClass = () => {
    if (!isTransitioning) return 'opacity-100 transform-none';

    switch (transitionType) {
      case 'slide':
        return 'opacity-0 translate-x-8';
      case 'zoom':
        return 'opacity-0 scale-95';
      case 'flip':
        return 'opacity-0 rotateY-90';
      case 'morph':
        return 'opacity-0 scale-90 blur-sm';
      default:
        return 'opacity-0';
    }
  };

  return (
    <div
      className={`transition-all ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className={`transition-all ${getTransitionClass()}`} style={{ transitionDuration: `${duration / 2}ms` }}>
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// FLOATING PARTICLES BACKGROUND
// ============================================================================

interface FloatingParticlesBackgroundProps {
  count?: number;
  colors?: string[];
  minSize?: number;
  maxSize?: number;
  speed?: number;
  className?: string;
}

export const FloatingParticlesBackground: React.FC<FloatingParticlesBackgroundProps> = ({
  count = 20,
  colors = ['#6366f1', '#8b5cf6', '#d946ef'],
  minSize = 4,
  maxSize = 12,
  speed = 20,
  className = '',
}) => {
  const particles = [...Array(count)].map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: minSize + Math.random() * (maxSize - minSize),
    color: colors[Math.floor(Math.random() * colors.length)],
    duration: speed + Math.random() * speed,
    delay: Math.random() * -speed,
  }));

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            opacity: 0.3,
            animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(20px, -30px) scale(1.2); opacity: 0.5; }
          50% { transform: translate(-10px, -60px) scale(0.8); opacity: 0.4; }
          75% { transform: translate(30px, -30px) scale(1.1); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// SHIMMER TEXT
// ============================================================================

interface ShimmerTextProps {
  children: React.ReactNode;
  colors?: string[];
  speed?: number;
  className?: string;
}

export const ShimmerText: React.FC<ShimmerTextProps> = ({
  children,
  colors = ['#6366f1', '#8b5cf6', '#d946ef', '#6366f1'],
  speed = 3,
  className = '',
}) => {
  const gradient = colors.join(', ');

  return (
    <span
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${gradient})`,
        backgroundSize: '200% 100%',
        animation: `shimmer-text ${speed}s ease-in-out infinite`,
      }}
    >
      {children}
      <style>{`
        @keyframes shimmer-text {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </span>
  );
};

export default {
  GradientBorder,
  AnimatedBorder,
  EnhancedGlassPanel,
  AuroraBackgroundEnhanced,
  SuccessAnimation,
  ModeTransition,
  FloatingParticlesBackground,
  ShimmerText,
};
