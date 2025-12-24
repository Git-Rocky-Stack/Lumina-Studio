import React, { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Confetti celebration effect
interface ConfettiProps {
  active: boolean;
  count?: number;
  duration?: number;
  colors?: string[];
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  rotation: number;
  scale: number;
  shape: 'square' | 'circle' | 'triangle';
}

export const Confetti: React.FC<ConfettiProps> = ({
  active,
  count = 50,
  duration = 3000,
  colors = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#22c55e', '#00d4ff'],
  onComplete,
}) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (active) {
      const newPieces: ConfettiPiece[] = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        shape: ['square', 'circle', 'triangle'][Math.floor(Math.random() * 3)] as 'square' | 'circle' | 'triangle',
      }));
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, count, colors, duration, onComplete]);

  const renderShape = (piece: ConfettiPiece) => {
    switch (piece.shape) {
      case 'circle':
        return <div className="w-3 h-3 rounded-full" style={{ backgroundColor: piece.color }} />;
      case 'triangle':
        return (
          <div
            className="w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: `10px solid ${piece.color}`,
            }}
          />
        );
      default:
        return <div className="w-3 h-3" style={{ backgroundColor: piece.color }} />;
    }
  };

  return (
    <AnimatePresence>
      {pieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              className="absolute"
              style={{
                left: `${piece.x}%`,
                transform: `scale(${piece.scale})`,
              }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{
                y: '110vh',
                opacity: [1, 1, 0],
                rotate: piece.rotation + 720,
                x: [0, Math.sin(piece.id) * 100, Math.sin(piece.id * 2) * 50],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: duration / 1000,
                ease: 'easeOut',
              }}
            >
              {renderShape(piece)}
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

// Sparkle effect
interface SparkleProps {
  color?: string;
  size?: number;
  className?: string;
}

export const Sparkle: React.FC<SparkleProps> = ({
  color = '#fbbf24',
  size = 20,
  className = '',
}) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      className={className}
      initial={{ scale: 0, rotate: 0 }}
      animate={{
        scale: [0, 1, 0],
        rotate: [0, 180],
      }}
      transition={{
        duration: 0.6,
        ease: 'easeInOut',
      }}
    >
      <path
        d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
        fill={color}
      />
    </motion.svg>
  );
};

// Sparkles container that spawns sparkles randomly
interface SparklesProps {
  children: React.ReactNode;
  color?: string;
  count?: number;
  className?: string;
}

export const Sparkles: React.FC<SparklesProps> = ({
  children,
  color = '#fbbf24',
  count = 3,
  className = '',
}) => {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

  useEffect(() => {
    const generateSparkle = () => ({
      id: Math.random(),
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 10 + Math.random() * 15,
    });

    const interval = setInterval(() => {
      setSparkles((prev) => {
        const newSparkles = [...prev, generateSparkle()];
        if (newSparkles.length > count) {
          return newSparkles.slice(-count);
        }
        return newSparkles;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [count]);

  return (
    <span className={`relative inline-block ${className}`}>
      {sparkles.map((sparkle) => (
        <span
          key={sparkle.id}
          className="absolute pointer-events-none"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Sparkle color={color} size={sparkle.size} />
        </span>
      ))}
      <span className="relative z-10">{children}</span>
    </span>
  );
};

// Floating particles background
interface FloatingParticlesProps {
  count?: number;
  color?: string;
  minSize?: number;
  maxSize?: number;
  speed?: 'slow' | 'medium' | 'fast';
  className?: string;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 30,
  color = 'rgba(99, 102, 241, 0.3)',
  minSize = 2,
  maxSize = 6,
  speed = 'medium',
  className = '',
}) => {
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: minSize + Math.random() * (maxSize - minSize),
      duration: speed === 'slow' ? 20 + Math.random() * 10 : speed === 'fast' ? 5 + Math.random() * 5 : 10 + Math.random() * 10,
      delay: Math.random() * 5,
    }));
  }, [count, minSize, maxSize, speed]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: color,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.sin(particle.id) * 20, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// Rising bubbles effect
interface BubblesProps {
  count?: number;
  className?: string;
}

export const Bubbles: React.FC<BubblesProps> = ({
  count = 20,
  className = '',
}) => {
  const bubbles = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 10 + Math.random() * 30,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 8,
    }));
  }, [count]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full border border-white/20"
          style={{
            width: bubble.size,
            height: bubble.size,
            left: `${bubble.x}%`,
            bottom: -bubble.size,
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)',
          }}
          animate={{
            y: [0, -window.innerHeight - bubble.size * 2],
            x: [0, Math.sin(bubble.id) * 50],
          }}
          transition={{
            duration: bubble.duration,
            repeat: Infinity,
            delay: bubble.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};

// Success checkmark animation
interface SuccessCheckProps {
  size?: number;
  color?: string;
  className?: string;
}

export const SuccessCheck: React.FC<SuccessCheckProps> = ({
  size = 80,
  color = '#22c55e',
  className = '',
}) => {
  return (
    <motion.div
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      {/* Circle */}
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="absolute"
      >
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </motion.svg>

      {/* Checkmark */}
      <motion.svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M5 13l4 4L19 7"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.5, ease: 'easeOut' }}
        />
      </motion.svg>
    </motion.div>
  );
};

// Pulse ripple effect
interface PulseRippleProps {
  color?: string;
  size?: number;
  duration?: number;
  className?: string;
}

export const PulseRipple: React.FC<PulseRippleProps> = ({
  color = 'rgba(99, 102, 241, 0.5)',
  size = 100,
  duration = 2,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${color}` }}
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{
            duration,
            repeat: Infinity,
            delay: i * (duration / 3),
            ease: 'easeOut',
          }}
        />
      ))}
      <div
        className="absolute inset-1/4 rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

// Typing indicator (like chat apps)
interface TypingIndicatorProps {
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-zinc-400"
          animate={{
            y: [0, -6, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// Fireworks effect
interface FireworksProps {
  active: boolean;
  onComplete?: () => void;
}

export const Fireworks: React.FC<FireworksProps> = ({
  active,
  onComplete,
}) => {
  const [explosions, setExplosions] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  useEffect(() => {
    if (active) {
      const colors = ['#ff0000', '#ffa500', '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ffffff'];
      const newExplosions = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 40,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setExplosions(newExplosions);

      const timer = setTimeout(() => {
        setExplosions([]);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [active, onComplete]);

  return (
    <AnimatePresence>
      {explosions.map((explosion) => (
        <div
          key={explosion.id}
          className="fixed pointer-events-none z-50"
          style={{
            left: `${explosion.x}%`,
            top: `${explosion.y}%`,
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            return (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: explosion.color }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos(angle) * 100,
                  y: Math.sin(angle) * 100 + 50,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{
                  duration: 1,
                  ease: 'easeOut',
                  delay: Math.random() * 0.3,
                }}
              />
            );
          })}
        </div>
      ))}
    </AnimatePresence>
  );
};

// Loading spinner with particles
interface ParticleSpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

export const ParticleSpinner: React.FC<ParticleSpinnerProps> = ({
  size = 40,
  color = '#6366f1',
  className = '',
}) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * (size / 3);
        const y = Math.sin(angle) * (size / 3);

        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size / 8,
              height: size / 8,
              backgroundColor: color,
              left: '50%',
              top: '50%',
              marginLeft: -(size / 16),
              marginTop: -(size / 16),
            }}
            animate={{
              x: [x, x * 1.5, x],
              y: [y, y * 1.5, y],
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
};

export default Confetti;
