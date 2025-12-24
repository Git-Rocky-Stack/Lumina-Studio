import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, MotionValue } from 'framer-motion';
import { springPresets } from '../animations';

// Parallax container for scroll-based effects
interface ParallaxSectionProps {
  children: React.ReactNode;
  speed?: number; // -1 to 1, negative = opposite direction
  className?: string;
  offset?: ['start end' | 'end start' | 'center center', 'start end' | 'end start' | 'center center'];
}

export const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  speed = 0.5,
  className = '',
  offset = ['start end', 'end start'],
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset,
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, -speed * 100]);
  const springY = useSpring(y, { stiffness: 100, damping: 30 });

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y: springY }}>
        {children}
      </motion.div>
    </div>
  );
};

// Parallax background with multiple layers
interface ParallaxBackgroundProps {
  layers: Array<{
    image: string;
    speed: number;
    opacity?: number;
    blur?: number;
  }>;
  height?: string;
  className?: string;
}

export const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({
  layers,
  height = '100vh',
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{ height }}
    >
      {layers.map((layer, index) => {
        const y = useTransform(scrollYProgress, [0, 1], [0, layer.speed * 200]);

        return (
          <motion.div
            key={index}
            className="absolute inset-0"
            style={{
              y,
              backgroundImage: `url(${layer.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: layer.opacity ?? 1,
              filter: layer.blur ? `blur(${layer.blur}px)` : undefined,
              zIndex: index,
            }}
          />
        );
      })}
    </div>
  );
};

// Scroll-triggered reveal animation
interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 50,
  once = true,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-100px' });

  const getInitialState = () => {
    switch (direction) {
      case 'up': return { opacity: 0, y: distance };
      case 'down': return { opacity: 0, y: -distance };
      case 'left': return { opacity: 0, x: distance };
      case 'right': return { opacity: 0, x: -distance };
      case 'scale': return { opacity: 0, scale: 0.8 };
      default: return { opacity: 0 };
    }
  };

  const getFinalState = () => {
    switch (direction) {
      case 'up':
      case 'down': return { opacity: 1, y: 0 };
      case 'left':
      case 'right': return { opacity: 1, x: 0 };
      case 'scale': return { opacity: 1, scale: 1 };
      default: return { opacity: 1 };
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={getInitialState()}
      animate={isInView ? getFinalState() : getInitialState()}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Staggered scroll reveal for lists
interface StaggeredRevealProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
  itemClassName?: string;
}

export const StaggeredReveal: React.FC<StaggeredRevealProps> = ({
  children,
  staggerDelay = 0.1,
  className = '',
  itemClassName = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{
            duration: 0.5,
            delay: index * staggerDelay,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className={itemClassName}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

// Horizontal scroll section
interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
}

export const HorizontalScroll: React.FC<HorizontalScrollProps> = ({
  children,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-75%']);
  const springX = useSpring(x, { stiffness: 100, damping: 30 });

  return (
    <div ref={containerRef} className={`h-[300vh] relative ${className}`}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <motion.div
          className="flex gap-8 px-8"
          style={{ x: springX }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

// Scroll progress indicator
interface ScrollProgressProps {
  color?: string;
  height?: number;
  position?: 'top' | 'bottom';
  className?: string;
}

export const ScrollProgress: React.FC<ScrollProgressProps> = ({
  color = '#6366f1',
  height = 3,
  position = 'top',
  className = '',
}) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className={`fixed left-0 right-0 z-50 origin-left ${position === 'top' ? 'top-0' : 'bottom-0'} ${className}`}
      style={{
        height,
        backgroundColor: color,
        scaleX,
      }}
    />
  );
};

// Text reveal on scroll (character by character)
interface TextRevealProps {
  text: string;
  className?: string;
  charClassName?: string;
}

export const TextReveal: React.FC<TextRevealProps> = ({
  text,
  className = '',
  charClassName = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const words = text.split(' ');

  return (
    <div ref={ref} className={className}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block">
          {word.split('').map((char, charIndex) => (
            <motion.span
              key={charIndex}
              className={`inline-block ${charClassName}`}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{
                duration: 0.3,
                delay: (wordIndex * word.length + charIndex) * 0.03,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              {char}
            </motion.span>
          ))}
          <span className="inline-block">&nbsp;</span>
        </span>
      ))}
    </div>
  );
};

// Pinned section that stays while content scrolls
interface PinnedSectionProps {
  children: React.ReactNode;
  pinnedContent: React.ReactNode;
  className?: string;
}

export const PinnedSection: React.FC<PinnedSectionProps> = ({
  children,
  pinnedContent,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Pinned element */}
      <div className="sticky top-0 h-screen flex items-center">
        {pinnedContent}
      </div>

      {/* Scrolling content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// Zoom on scroll effect
interface ZoomOnScrollProps {
  children: React.ReactNode;
  startScale?: number;
  endScale?: number;
  className?: string;
}

export const ZoomOnScroll: React.FC<ZoomOnScrollProps> = ({
  children,
  startScale = 0.8,
  endScale = 1,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [startScale, endScale]);
  const springScale = useSpring(scale, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ scale: springScale }}
    >
      {children}
    </motion.div>
  );
};

// Rotating on scroll
interface RotateOnScrollProps {
  children: React.ReactNode;
  degrees?: number;
  className?: string;
}

export const RotateOnScroll: React.FC<RotateOnScrollProps> = ({
  children,
  degrees = 360,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const rotate = useTransform(scrollYProgress, [0, 1], [0, degrees]);
  const springRotate = useSpring(rotate, { stiffness: 50, damping: 20 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotate: springRotate }}
    >
      {children}
    </motion.div>
  );
};

// Blur on scroll
interface BlurOnScrollProps {
  children: React.ReactNode;
  maxBlur?: number;
  className?: string;
}

export const BlurOnScroll: React.FC<BlurOnScrollProps> = ({
  children,
  maxBlur = 10,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['center center', 'end start'],
  });

  const blur = useTransform(scrollYProgress, [0, 1], [0, maxBlur]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.5]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        filter: blur.get() > 0 ? `blur(${blur.get()}px)` : undefined,
        opacity,
      }}
    >
      {children}
    </motion.div>
  );
};

// Counter animation on scroll
interface CounterProps {
  from?: number;
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export const Counter: React.FC<CounterProps> = ({
  from = 0,
  to,
  duration = 2,
  suffix = '',
  prefix = '',
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (!isInView) return;

    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    const updateCount = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.floor(from + (to - from) * eased);
      setCount(current);

      if (now < endTime) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(to);
      }
    };

    requestAnimationFrame(updateCount);
  }, [isInView, from, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

export default ParallaxSection;
