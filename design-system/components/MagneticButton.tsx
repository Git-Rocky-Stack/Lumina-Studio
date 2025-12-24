import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  radius?: number;
  onClick?: () => void;
  disabled?: boolean;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  strength = 0.3,
  radius = 100,
  onClick,
  disabled = false,
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 300, damping: 20 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || disabled) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

    if (distance < radius) {
      x.set(distanceX * strength);
      y.set(distanceY * strength);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <motion.button
      ref={ref}
      className={`relative ${className}`}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        className="relative z-10"
        animate={{ scale: isHovered ? 1.05 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
};

// Magnetic Link variant
interface MagneticLinkProps {
  children: React.ReactNode;
  href?: string;
  className?: string;
  strength?: number;
}

export const MagneticLink: React.FC<MagneticLinkProps> = ({
  children,
  href,
  className = '',
  strength = 0.2,
}) => {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 400, damping: 25 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * strength);
    y.set((e.clientY - centerY) * strength);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.a>
  );
};

// Morphing Icon Component
interface MorphingIconProps {
  icon: string;
  activeIcon?: string;
  isActive?: boolean;
  size?: number;
  className?: string;
}

export const MorphingIcon: React.FC<MorphingIconProps> = ({
  icon,
  activeIcon,
  isActive = false,
  size = 20,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <motion.i
        className={`fas ${icon} absolute inset-0 flex items-center justify-center`}
        initial={false}
        animate={{
          opacity: isActive ? 0 : 1,
          scale: isActive ? 0.5 : 1,
          rotate: isActive ? 90 : 0,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ fontSize: size }}
      />
      {activeIcon && (
        <motion.i
          className={`fas ${activeIcon} absolute inset-0 flex items-center justify-center`}
          initial={false}
          animate={{
            opacity: isActive ? 1 : 0,
            scale: isActive ? 1 : 0.5,
            rotate: isActive ? 0 : -90,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{ fontSize: size }}
        />
      )}
    </div>
  );
};

// Animated Icon with multiple states
interface AnimatedIconProps {
  icons: string[];
  currentIndex: number;
  size?: number;
  className?: string;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  icons,
  currentIndex,
  size = 20,
  className = '',
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width: size, height: size }}>
      {icons.map((icon, index) => (
        <motion.i
          key={icon}
          className={`fas ${icon} absolute inset-0 flex items-center justify-center`}
          initial={false}
          animate={{
            opacity: currentIndex === index ? 1 : 0,
            y: currentIndex === index ? 0 : currentIndex > index ? -size : size,
            scale: currentIndex === index ? 1 : 0.8,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{ fontSize: size }}
        />
      ))}
    </div>
  );
};

// Pulsing Icon for notifications
interface PulsingIconProps {
  icon: string;
  pulse?: boolean;
  color?: string;
  size?: number;
  className?: string;
}

export const PulsingIcon: React.FC<PulsingIconProps> = ({
  icon,
  pulse = true,
  color = 'var(--accent)',
  size = 20,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      {pulse && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
      <i className={`fas ${icon} relative z-10`} style={{ fontSize: size, color }} />
    </div>
  );
};

export default MagneticButton;
