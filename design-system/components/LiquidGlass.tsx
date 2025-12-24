import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface LiquidGlassProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  color?: string;
  blur?: number;
}

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  children,
  className = '',
  intensity = 0.5,
  color = 'rgba(255, 255, 255, 0.1)',
  blur = 20,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 15 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const rotateX = useTransform(y, [-100, 100], [5 * intensity, -5 * intensity]);
  const rotateY = useTransform(x, [-100, 100], [-5 * intensity, 5 * intensity]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glass layer */}
      <div
        className="absolute inset-0 rounded-inherit"
        style={{
          background: color,
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
        }}
      />

      {/* Refraction highlight */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${50}% ${50}%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
          x: useTransform(x, v => v * 0.1),
          y: useTransform(y, v => v * 0.1),
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

// Cursor Trail Effect
interface CursorTrailProps {
  color?: string;
  size?: number;
  trailLength?: number;
  enabled?: boolean;
}

export const CursorTrail: React.FC<CursorTrailProps> = ({
  color = 'var(--accent)',
  size = 8,
  trailLength = 10,
  enabled = true,
}) => {
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      idRef.current += 1;
      setTrail(prev => {
        const newTrail = [...prev, { x: e.clientX, y: e.clientY, id: idRef.current }];
        if (newTrail.length > trailLength) {
          return newTrail.slice(-trailLength);
        }
        return newTrail;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled, trailLength]);

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {trail.map((point, index) => (
        <motion.div
          key={point.id}
          className="absolute rounded-full"
          style={{
            left: point.x - size / 2,
            top: point.y - size / 2,
            width: size,
            height: size,
            backgroundColor: color,
          }}
          initial={{ opacity: 0.8, scale: 1 }}
          animate={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.5 }}
        />
      ))}
    </div>
  );
};

// Spotlight Cursor Effect
interface SpotlightCursorProps {
  size?: number;
  color?: string;
  enabled?: boolean;
}

export const SpotlightCursor: React.FC<SpotlightCursorProps> = ({
  size = 300,
  color = 'rgba(99, 102, 241, 0.15)',
  enabled = true,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <motion.div
      className="fixed pointer-events-none z-[9998]"
      animate={{
        x: position.x - size / 2,
        y: position.y - size / 2,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        borderRadius: '50%',
      }}
    />
  );
};

// Ripple Effect on Click
interface RippleProps {
  color?: string;
  duration?: number;
}

export const useRipple = (color = 'rgba(255, 255, 255, 0.3)', duration = 600) => {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const idRef = useRef(0);

  const createRipple = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    idRef.current += 1;
    const newRipple = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      id: idRef.current,
    };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, duration);
  };

  const RippleContainer = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full"
          style={{
            left: ripple.x,
            top: ripple.y,
            backgroundColor: color,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ width: 0, height: 0, opacity: 0.5 }}
          animate={{ width: 500, height: 500, opacity: 0 }}
          transition={{ duration: duration / 1000 }}
        />
      ))}
    </div>
  );

  return { createRipple, RippleContainer };
};

// Glow on Hover
interface GlowHoverProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  intensity?: number;
}

export const GlowHover: React.FC<GlowHoverProps> = ({
  children,
  className = '',
  color = 'var(--accent)',
  intensity = 0.5,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        boxShadow: isHovered
          ? `0 0 ${30 * intensity}px ${10 * intensity}px ${color}40`
          : '0 0 0 0 transparent',
      }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default LiquidGlass;
