import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';

// Animated Gradient Mesh Background (like macOS Sonoma)
interface GradientMeshProps {
  className?: string;
  colors?: string[];
  speed?: 'slow' | 'medium' | 'fast';
  blur?: number;
  opacity?: number;
  interactive?: boolean;
}

export const GradientMesh: React.FC<GradientMeshProps> = ({
  className = '',
  colors = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316'],
  speed = 'medium',
  blur = 100,
  opacity = 0.5,
  interactive = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const speedConfig = {
    slow: 30,
    medium: 20,
    fast: 10,
  };

  const animationDuration = speedConfig[speed];

  useEffect(() => {
    if (!interactive) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    };

    const container = containerRef.current;
    container?.addEventListener('mousemove', handleMouseMove);
    return () => container?.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ filter: `blur(${blur}px)` }}
        preserveAspectRatio="none"
      >
        <defs>
          {colors.map((color, i) => (
            <radialGradient
              key={i}
              id={`grad-${i}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        {colors.map((_, i) => {
          const angle = (i / colors.length) * Math.PI * 2;
          const baseX = 50 + Math.cos(angle) * 30;
          const baseY = 50 + Math.sin(angle) * 30;

          return (
            <motion.circle
              key={i}
              r="40%"
              fill={`url(#grad-${i})`}
              initial={{ cx: `${baseX}%`, cy: `${baseY}%` }}
              animate={{
                cx: [
                  `${baseX}%`,
                  `${baseX + 20}%`,
                  `${baseX - 10}%`,
                  `${baseX}%`,
                ],
                cy: [
                  `${baseY}%`,
                  `${baseY - 15}%`,
                  `${baseY + 20}%`,
                  `${baseY}%`,
                ],
              }}
              transition={{
                duration: animationDuration + i * 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                transform: interactive
                  ? `translate(${(mousePos.x - 0.5) * 50}px, ${(mousePos.y - 0.5) * 50}px)`
                  : undefined,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};

// Aurora Background (Northern Lights effect)
interface AuroraBackgroundProps {
  className?: string;
  colors?: string[];
  intensity?: 'subtle' | 'medium' | 'vibrant';
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  className = '',
  colors = ['#00d4ff', '#7c3aed', '#22c55e'],
  intensity = 'medium',
}) => {
  const intensityConfig = {
    subtle: { opacity: 0.3, blur: 150 },
    medium: { opacity: 0.5, blur: 100 },
    vibrant: { opacity: 0.7, blur: 80 },
  };

  const config = intensityConfig[intensity];

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 100%)`,
        }}
      />

      {colors.map((color, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: '200%',
            height: '50%',
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            filter: `blur(${config.blur}px)`,
            opacity: config.opacity,
            left: '-50%',
          }}
          initial={{ top: `${20 + i * 20}%`, rotate: -5 + i * 3 }}
          animate={{
            top: [`${20 + i * 20}%`, `${30 + i * 20}%`, `${20 + i * 20}%`],
            rotate: [-5 + i * 3, 5 + i * 3, -5 + i * 3],
            x: ['-10%', '10%', '-10%'],
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// Glassmorphism Panel
interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  blur?: number;
  opacity?: number;
  border?: boolean;
  glow?: boolean;
  glowColor?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = '',
  blur = 20,
  opacity = 0.8,
  border = true,
  glow = false,
  glowColor = 'rgba(99, 102, 241, 0.3)',
}) => {
  return (
    <div
      className={`
        relative rounded-2xl overflow-hidden
        ${className}
      `}
      style={{
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        backgroundColor: `rgba(255, 255, 255, ${opacity * 0.1})`,
        boxShadow: glow
          ? `0 0 40px ${glowColor}, 0 25px 50px -12px rgba(0, 0, 0, 0.25)`
          : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Border gradient */}
      {border && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 100%)',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px',
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Inner glow */}
      {glow && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at center, ${glowColor} 0%, transparent 70%)`,
            opacity: 0.5,
          }}
        />
      )}
    </div>
  );
};

// Animated Blob Background
interface BlobBackgroundProps {
  className?: string;
  color1?: string;
  color2?: string;
  color3?: string;
}

export const BlobBackground: React.FC<BlobBackgroundProps> = ({
  className = '',
  color1 = '#6366f1',
  color2 = '#a855f7',
  color3 = '#ec4899',
}) => {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Blob 1 */}
      <motion.div
        className="absolute w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
        style={{ backgroundColor: color1 }}
        animate={{
          x: [0, 100, 50, 0],
          y: [0, 50, 100, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Blob 2 */}
      <motion.div
        className="absolute w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
        style={{ backgroundColor: color2, right: 0 }}
        animate={{
          x: [0, -100, -50, 0],
          y: [0, 100, 50, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Blob 3 */}
      <motion.div
        className="absolute w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-70"
        style={{ backgroundColor: color3, bottom: 0, left: '50%' }}
        animate={{
          x: ['-50%', '-30%', '-70%', '-50%'],
          y: [0, -50, -100, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

// Noise Texture Overlay
interface NoiseOverlayProps {
  opacity?: number;
  className?: string;
}

export const NoiseOverlay: React.FC<NoiseOverlayProps> = ({
  opacity = 0.03,
  className = '',
}) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
  );
};

// Shimmer Effect
interface ShimmerProps {
  className?: string;
  duration?: number;
}

export const Shimmer: React.FC<ShimmerProps> = ({
  className = '',
  duration = 2,
}) => {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
          transform: 'skewX(-20deg)',
        }}
        animate={{
          x: ['-200%', '200%'],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

// Spotlight Effect
interface SpotlightProps {
  className?: string;
  size?: number;
}

export const Spotlight: React.FC<SpotlightProps> = ({
  className = '',
  size = 400,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current) return;
      const rect = spotlightRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={spotlightRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="absolute pointer-events-none transition-opacity duration-300"
        style={{
          width: size,
          height: size,
          left: mousePos.x - size / 2,
          top: mousePos.y - size / 2,
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        }}
      />
    </div>
  );
};

// Grid Pattern Background
interface GridPatternProps {
  className?: string;
  size?: number;
  color?: string;
  opacity?: number;
}

export const GridPattern: React.FC<GridPatternProps> = ({
  className = '',
  size = 40,
  color = 'currentColor',
  opacity = 0.1,
}) => {
  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{
        opacity,
        backgroundImage: `
          linear-gradient(${color} 1px, transparent 1px),
          linear-gradient(90deg, ${color} 1px, transparent 1px)
        `,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
};

// Dot Pattern Background
interface DotPatternProps {
  className?: string;
  size?: number;
  spacing?: number;
  color?: string;
  opacity?: number;
}

export const DotPattern: React.FC<DotPatternProps> = ({
  className = '',
  size = 2,
  spacing = 20,
  color = 'currentColor',
  opacity = 0.2,
}) => {
  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{
        opacity,
        backgroundImage: `radial-gradient(${color} ${size}px, transparent ${size}px)`,
        backgroundSize: `${spacing}px ${spacing}px`,
      }}
    />
  );
};

export default GradientMesh;
