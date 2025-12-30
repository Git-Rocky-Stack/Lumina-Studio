// ============================================================================
// ANIMATION TIMELINE SYSTEM - TYPE DEFINITIONS
// ============================================================================

import type { DesignElement } from '../types';

/**
 * Animation easing types
 */
export type EasingType =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInElastic'
  | 'easeOutElastic'
  | 'easeInOutElastic'
  | 'easeInBounce'
  | 'easeOutBounce'
  | 'spring'
  | 'custom';

/**
 * Animatable property types
 */
export type AnimatableProperty =
  | 'x'
  | 'y'
  | 'width'
  | 'height'
  | 'rotation'
  | 'scale'
  | 'scaleX'
  | 'scaleY'
  | 'opacity'
  | 'fill'
  | 'stroke'
  | 'strokeWidth'
  | 'borderRadius'
  | 'blur'
  | 'shadow';

/**
 * Keyframe definition
 */
export interface Keyframe {
  id: string;
  time: number; // milliseconds
  value: number | string;
  easing: EasingType;
  customEasing?: [number, number, number, number]; // cubic-bezier values
}

/**
 * Animation track for a single property
 */
export interface AnimationTrack {
  id: string;
  elementId: string;
  property: AnimatableProperty;
  keyframes: Keyframe[];
  enabled: boolean;
}

/**
 * Animation sequence containing multiple tracks
 */
export interface AnimationSequence {
  id: string;
  name: string;
  duration: number; // total duration in ms
  tracks: AnimationTrack[];
  loop: boolean;
  loopCount?: number; // -1 for infinite
  autoPlay: boolean;
  delay: number;
}

/**
 * Animation project containing all sequences
 */
export interface AnimationProject {
  id: string;
  sequences: AnimationSequence[];
  activeSequenceId: string | null;
  fps: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Playback state
 */
export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  playbackRate: number;
  direction: 'forward' | 'reverse';
}

/**
 * Timeline view settings
 */
export interface TimelineSettings {
  zoom: number; // pixels per second
  snapToGrid: boolean;
  gridSize: number; // ms
  showWaveforms: boolean;
  showCurves: boolean;
  autoScroll: boolean;
}

/**
 * Animation preset
 */
export interface AnimationPreset {
  id: string;
  name: string;
  category: 'entrance' | 'exit' | 'emphasis' | 'motion' | 'custom';
  duration: number;
  tracks: Omit<AnimationTrack, 'id' | 'elementId'>[];
  thumbnail?: string;
}

/**
 * Interpolated value at a given time
 */
export interface InterpolatedValue {
  property: AnimatableProperty;
  value: number | string;
  time: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const EASING_FUNCTIONS: Record<EasingType, string> = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
  easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  easeInElastic: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  easeOutElastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInOutElastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  easeInBounce: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  easeOutBounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  custom: 'linear'
};

export const EASING_INFO: Record<EasingType, { label: string; icon: string }> = {
  linear: { label: 'Linear', icon: 'fa-minus' },
  easeIn: { label: 'Ease In', icon: 'fa-arrow-right' },
  easeOut: { label: 'Ease Out', icon: 'fa-arrow-left' },
  easeInOut: { label: 'Ease In Out', icon: 'fa-arrows-left-right' },
  easeInQuad: { label: 'Ease In Quad', icon: 'fa-arrow-right' },
  easeOutQuad: { label: 'Ease Out Quad', icon: 'fa-arrow-left' },
  easeInOutQuad: { label: 'Ease In Out Quad', icon: 'fa-arrows-left-right' },
  easeInCubic: { label: 'Ease In Cubic', icon: 'fa-arrow-right' },
  easeOutCubic: { label: 'Ease Out Cubic', icon: 'fa-arrow-left' },
  easeInOutCubic: { label: 'Ease In Out Cubic', icon: 'fa-arrows-left-right' },
  easeInElastic: { label: 'Ease In Elastic', icon: 'fa-wave-square' },
  easeOutElastic: { label: 'Ease Out Elastic', icon: 'fa-wave-square' },
  easeInOutElastic: { label: 'Ease In Out Elastic', icon: 'fa-wave-square' },
  easeInBounce: { label: 'Ease In Bounce', icon: 'fa-basketball' },
  easeOutBounce: { label: 'Ease Out Bounce', icon: 'fa-basketball' },
  spring: { label: 'Spring', icon: 'fa-burst' },
  custom: { label: 'Custom', icon: 'fa-bezier-curve' }
};

export const PROPERTY_INFO: Record<AnimatableProperty, { label: string; unit: string; min?: number; max?: number }> = {
  x: { label: 'Position X', unit: 'px' },
  y: { label: 'Position Y', unit: 'px' },
  width: { label: 'Width', unit: 'px', min: 0 },
  height: { label: 'Height', unit: 'px', min: 0 },
  rotation: { label: 'Rotation', unit: 'deg' },
  scale: { label: 'Scale', unit: '', min: 0 },
  scaleX: { label: 'Scale X', unit: '', min: 0 },
  scaleY: { label: 'Scale Y', unit: '', min: 0 },
  opacity: { label: 'Opacity', unit: '', min: 0, max: 1 },
  fill: { label: 'Fill Color', unit: '' },
  stroke: { label: 'Stroke Color', unit: '' },
  strokeWidth: { label: 'Stroke Width', unit: 'px', min: 0 },
  borderRadius: { label: 'Border Radius', unit: 'px', min: 0 },
  blur: { label: 'Blur', unit: 'px', min: 0 },
  shadow: { label: 'Shadow', unit: '' }
};

export const DEFAULT_PRESETS: AnimationPreset[] = [
  {
    id: 'fade-in',
    name: 'Fade In',
    category: 'entrance',
    duration: 500,
    tracks: [{
      property: 'opacity',
      keyframes: [
        { id: 'k1', time: 0, value: 0, easing: 'easeOut' },
        { id: 'k2', time: 500, value: 1, easing: 'easeOut' }
      ],
      enabled: true
    }]
  },
  {
    id: 'fade-out',
    name: 'Fade Out',
    category: 'exit',
    duration: 500,
    tracks: [{
      property: 'opacity',
      keyframes: [
        { id: 'k1', time: 0, value: 1, easing: 'easeIn' },
        { id: 'k2', time: 500, value: 0, easing: 'easeIn' }
      ],
      enabled: true
    }]
  },
  {
    id: 'slide-in-left',
    name: 'Slide In Left',
    category: 'entrance',
    duration: 600,
    tracks: [
      {
        property: 'x',
        keyframes: [
          { id: 'k1', time: 0, value: -100, easing: 'easeOutCubic' },
          { id: 'k2', time: 600, value: 0, easing: 'easeOutCubic' }
        ],
        enabled: true
      },
      {
        property: 'opacity',
        keyframes: [
          { id: 'k1', time: 0, value: 0, easing: 'easeOut' },
          { id: 'k2', time: 300, value: 1, easing: 'easeOut' }
        ],
        enabled: true
      }
    ]
  },
  {
    id: 'slide-in-right',
    name: 'Slide In Right',
    category: 'entrance',
    duration: 600,
    tracks: [
      {
        property: 'x',
        keyframes: [
          { id: 'k1', time: 0, value: 100, easing: 'easeOutCubic' },
          { id: 'k2', time: 600, value: 0, easing: 'easeOutCubic' }
        ],
        enabled: true
      },
      {
        property: 'opacity',
        keyframes: [
          { id: 'k1', time: 0, value: 0, easing: 'easeOut' },
          { id: 'k2', time: 300, value: 1, easing: 'easeOut' }
        ],
        enabled: true
      }
    ]
  },
  {
    id: 'scale-up',
    name: 'Scale Up',
    category: 'entrance',
    duration: 400,
    tracks: [{
      property: 'scale',
      keyframes: [
        { id: 'k1', time: 0, value: 0, easing: 'easeOutElastic' },
        { id: 'k2', time: 400, value: 1, easing: 'easeOutElastic' }
      ],
      enabled: true
    }]
  },
  {
    id: 'bounce',
    name: 'Bounce',
    category: 'emphasis',
    duration: 800,
    tracks: [{
      property: 'scale',
      keyframes: [
        { id: 'k1', time: 0, value: 1, easing: 'easeInOut' },
        { id: 'k2', time: 200, value: 1.2, easing: 'easeInOut' },
        { id: 'k3', time: 400, value: 0.9, easing: 'easeInOut' },
        { id: 'k4', time: 600, value: 1.05, easing: 'easeInOut' },
        { id: 'k5', time: 800, value: 1, easing: 'easeInOut' }
      ],
      enabled: true
    }]
  },
  {
    id: 'pulse',
    name: 'Pulse',
    category: 'emphasis',
    duration: 600,
    tracks: [{
      property: 'opacity',
      keyframes: [
        { id: 'k1', time: 0, value: 1, easing: 'easeInOut' },
        { id: 'k2', time: 300, value: 0.5, easing: 'easeInOut' },
        { id: 'k3', time: 600, value: 1, easing: 'easeInOut' }
      ],
      enabled: true
    }]
  },
  {
    id: 'shake',
    name: 'Shake',
    category: 'emphasis',
    duration: 500,
    tracks: [{
      property: 'x',
      keyframes: [
        { id: 'k1', time: 0, value: 0, easing: 'linear' },
        { id: 'k2', time: 100, value: -10, easing: 'linear' },
        { id: 'k3', time: 200, value: 10, easing: 'linear' },
        { id: 'k4', time: 300, value: -10, easing: 'linear' },
        { id: 'k5', time: 400, value: 10, easing: 'linear' },
        { id: 'k6', time: 500, value: 0, easing: 'linear' }
      ],
      enabled: true
    }]
  },
  {
    id: 'rotate-360',
    name: 'Rotate 360',
    category: 'motion',
    duration: 1000,
    tracks: [{
      property: 'rotation',
      keyframes: [
        { id: 'k1', time: 0, value: 0, easing: 'linear' },
        { id: 'k2', time: 1000, value: 360, easing: 'linear' }
      ],
      enabled: true
    }]
  }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique ID
 */
export function generateAnimationId(prefix: string = 'anim'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Interpolate between two values
 */
export function interpolate(
  startValue: number,
  endValue: number,
  progress: number,
  easing: EasingType = 'linear'
): number {
  const easedProgress = applyEasing(progress, easing);
  return startValue + (endValue - startValue) * easedProgress;
}

/**
 * Apply easing function
 */
export function applyEasing(t: number, easing: EasingType): number {
  switch (easing) {
    case 'linear':
      return t;
    case 'easeIn':
      return t * t * t;
    case 'easeOut':
      return 1 - Math.pow(1 - t, 3);
    case 'easeInOut':
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    case 'easeInQuad':
      return t * t;
    case 'easeOutQuad':
      return 1 - (1 - t) * (1 - t);
    case 'easeInOutQuad':
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case 'easeInCubic':
      return t * t * t;
    case 'easeOutCubic':
      return 1 - Math.pow(1 - t, 3);
    case 'easeInOutCubic':
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    case 'easeOutElastic':
      return t === 0 ? 0 : t === 1 ? 1 :
        Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
    case 'easeOutBounce':
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      }
    case 'spring':
      return 1 - Math.cos(t * Math.PI * 4) * Math.exp(-t * 5);
    default:
      return t;
  }
}

/**
 * Get value at specific time from keyframes
 */
export function getValueAtTime(
  keyframes: Keyframe[],
  time: number
): number | string | null {
  if (keyframes.length === 0) return null;
  if (keyframes.length === 1) return keyframes[0].value;

  // Sort by time
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // Before first keyframe
  if (time <= sorted[0].time) return sorted[0].value;

  // After last keyframe
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

  // Find surrounding keyframes
  for (let i = 0; i < sorted.length - 1; i++) {
    if (time >= sorted[i].time && time <= sorted[i + 1].time) {
      const start = sorted[i];
      const end = sorted[i + 1];
      const duration = end.time - start.time;
      const progress = (time - start.time) / duration;

      // If values are numbers, interpolate
      if (typeof start.value === 'number' && typeof end.value === 'number') {
        return interpolate(start.value, end.value, progress, start.easing);
      }

      // For non-numeric values, return start value until end
      return progress < 1 ? start.value : end.value;
    }
  }

  return null;
}

/**
 * Format time for display (mm:ss:ms)
 */
export function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor((ms % 1000) / 10);

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${millis.toString().padStart(2, '0')}`;
}

/**
 * Parse time string to milliseconds
 */
export function parseTime(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 60000 + parts[1] * 1000 + parts[2] * 10;
  }
  return 0;
}
