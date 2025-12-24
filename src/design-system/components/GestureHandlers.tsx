import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, PanInfo } from 'framer-motion';
import { springPresets } from '../animations';

// Pinch to zoom hook
interface UsePinchZoomOptions {
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
}

interface UsePinchZoomReturn {
  scale: number;
  position: { x: number; y: number };
  handlers: {
    onWheel: (e: React.WheelEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  reset: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setScale: (scale: number) => void;
}

export const usePinchZoom = (options: UsePinchZoomOptions = {}): UsePinchZoomReturn => {
  const { minScale = 0.5, maxScale = 4, initialScale = 1 } = options;

  const [scale, setScale] = useState(initialScale);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const initialDistance = useRef<number | null>(null);
  const initialScale$ = useRef(scale);

  const clampScale = useCallback((s: number) => Math.max(minScale, Math.min(maxScale, s)), [minScale, maxScale]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setScale(prev => clampScale(prev + delta));
  }, [clampScale]);

  const getTouchDistance = (touches: React.TouchList) => {
    const [t1, t2] = [touches[0], touches[1]];
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistance.current = getTouchDistance(e.touches);
      initialScale$.current = scale;
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance.current) {
      const currentDistance = getTouchDistance(e.touches);
      const scaleChange = currentDistance / initialDistance.current;
      setScale(clampScale(initialScale$.current * scaleChange));
    }
  }, [clampScale]);

  const handleTouchEnd = useCallback(() => {
    initialDistance.current = null;
  }, []);

  const reset = useCallback(() => {
    setScale(initialScale);
    setPosition({ x: 0, y: 0 });
  }, [initialScale]);

  const zoomIn = useCallback(() => {
    setScale(prev => clampScale(prev * 1.2));
  }, [clampScale]);

  const zoomOut = useCallback(() => {
    setScale(prev => clampScale(prev / 1.2));
  }, [clampScale]);

  return {
    scale,
    position,
    handlers: {
      onWheel: handleWheel,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    reset,
    zoomIn,
    zoomOut,
    setScale: (s) => setScale(clampScale(s)),
  };
};

// Pannable container
interface PannableContainerProps {
  children: React.ReactNode;
  scale?: number;
  minScale?: number;
  maxScale?: number;
  className?: string;
  onScaleChange?: (scale: number) => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
  enablePan?: boolean;
  enableZoom?: boolean;
}

export const PannableContainer: React.FC<PannableContainerProps> = ({
  children,
  scale: externalScale,
  minScale = 0.25,
  maxScale = 4,
  className = '',
  onScaleChange,
  onPositionChange,
  enablePan = true,
  enableZoom = true,
}) => {
  const [internalScale, setInternalScale] = useState(1);
  const scale = externalScale ?? internalScale;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, springPresets.smooth);
  const springY = useSpring(y, springPresets.smooth);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!enableZoom) return;
    e.preventDefault();

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const delta = e.deltaY * -0.001;
    const newScale = Math.max(minScale, Math.min(maxScale, scale + delta));

    // Zoom towards mouse position
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;

    const scaleDiff = newScale - scale;
    x.set(x.get() - mouseX * scaleDiff / scale);
    y.set(y.get() - mouseY * scaleDiff / scale);

    setInternalScale(newScale);
    onScaleChange?.(newScale);
  }, [scale, minScale, maxScale, enableZoom, x, y, onScaleChange]);

  const handlePanStart = () => {
    if (!enablePan) return;
    setIsPanning(true);
  };

  const handlePan = (_: any, info: PanInfo) => {
    if (!enablePan || !isPanning) return;
    x.set(x.get() + info.delta.x);
    y.set(y.get() + info.delta.y);
    onPositionChange?.({ x: x.get(), y: y.get() });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onWheel={handleWheel}
      style={{ cursor: isPanning ? 'grabbing' : enablePan ? 'grab' : 'default' }}
    >
      <motion.div
        className="absolute inset-0 origin-center"
        style={{
          x: springX,
          y: springY,
          scale,
        }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Swipeable container
interface SwipeableProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

export const Swipeable: React.FC<SwipeableProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = '',
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info;

    // Horizontal swipe
    if (Math.abs(offset.x) > threshold || Math.abs(velocity.x) > 500) {
      if (offset.x > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }

    // Vertical swipe
    if (Math.abs(offset.y) > threshold || Math.abs(velocity.y) > 500) {
      if (offset.y > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    // Reset position
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={className}
      style={{ x, y }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
};

// Long press handler
interface LongPressableProps {
  children: React.ReactNode;
  onLongPress: () => void;
  onPress?: () => void;
  duration?: number;
  className?: string;
}

export const LongPressable: React.FC<LongPressableProps> = ({
  children,
  onLongPress,
  onPress,
  duration = 500,
  className = '',
}) => {
  const timerRef = useRef<NodeJS.Timeout>();
  const isLongPress = useRef(false);

  const handleStart = () => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, duration);
  };

  const handleEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (!isLongPress.current) {
      onPress?.();
    }
  };

  const handleCancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  return (
    <motion.div
      className={className}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleCancel}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleCancel}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
};

// Pull to refresh
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 80,
  className = '',
}) => {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const y = useMotionValue(0);
  const pullProgress = useTransform(y, [0, threshold], [0, 1]);
  const rotation = useTransform(pullProgress, [0, 1], [0, 180]);

  const handleDragEnd = async () => {
    if (y.get() >= threshold && !refreshing) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    y.set(0);
    setPulling(false);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Refresh indicator */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-10"
        style={{ y: useTransform(y, [0, threshold], [-40, 10]) }}
      >
        {refreshing ? (
          <motion.div
            className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <motion.svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-indigo-500"
            style={{ rotate: rotation }}
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </motion.svg>
        )}
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ y }}
        drag="y"
        dragConstraints={{ top: 0, bottom: threshold }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragStart={() => setPulling(true)}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  );
};

// Double tap handler
interface DoubleTapProps {
  children: React.ReactNode;
  onDoubleTap: () => void;
  onSingleTap?: () => void;
  delay?: number;
  className?: string;
}

export const DoubleTap: React.FC<DoubleTapProps> = ({
  children,
  onDoubleTap,
  onSingleTap,
  delay = 300,
  className = '',
}) => {
  const lastTap = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap.current;

    if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
      // Double tap
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      onDoubleTap();
    } else {
      // Single tap - wait to see if double tap follows
      timeoutRef.current = setTimeout(() => {
        onSingleTap?.();
      }, delay);
    }

    lastTap.current = now;
  };

  return (
    <motion.div
      className={className}
      onClick={handleTap}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
};

export default PannableContainer;
