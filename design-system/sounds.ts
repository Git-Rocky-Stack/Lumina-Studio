/**
 * Sound Design System
 *
 * Subtle audio feedback for premium UX with:
 * - Lightweight Web Audio API usage
 * - User preference respect (mute/volume)
 * - Haptic-like sound effects
 * - Accessibility-friendly (never required)
 */

// ============================================================================
// TYPES
// ============================================================================

type SoundName =
  | 'click'
  | 'success'
  | 'error'
  | 'warning'
  | 'notification'
  | 'toggle'
  | 'pop'
  | 'swoosh'
  | 'complete'
  | 'delete'
  | 'hover'
  | 'focus'
  | 'type'
  | 'send'
  | 'receive';

interface SoundConfig {
  enabled: boolean;
  volume: number; // 0-1
  reducedMotion: boolean;
}

// ============================================================================
// AUDIO CONTEXT MANAGEMENT
// ============================================================================

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

// Resume audio context on user interaction (required by browsers)
function resumeAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

// ============================================================================
// SOUND SYNTHESIS (No external files needed)
// ============================================================================

function createOscillator(
  ctx: AudioContext,
  frequency: number,
  type: OscillatorType = 'sine',
  duration: number = 0.1
): { oscillator: OscillatorNode; gainNode: GainNode } {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  return { oscillator, gainNode };
}

// ============================================================================
// SOUND DEFINITIONS
// ============================================================================

const soundDefinitions: Record<SoundName, (ctx: AudioContext, volume: number) => void> = {
  // Soft click - like a keyboard key
  click: (ctx, volume) => {
    const { oscillator, gainNode } = createOscillator(ctx, 1200, 'sine', 0.05);
    gainNode.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  },

  // Success chime - upward progression
  success: (ctx, volume) => {
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const { oscillator, gainNode } = createOscillator(ctx, freq, 'sine');
      const startTime = ctx.currentTime + i * 0.08;
      gainNode.gain.setValueAtTime(volume * 0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    });
  },

  // Error buzz - low frequency
  error: (ctx, volume) => {
    const { oscillator, gainNode } = createOscillator(ctx, 200, 'square', 0.15);
    gainNode.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  },

  // Warning - attention-grabbing
  warning: (ctx, volume) => {
    [0, 0.1].forEach((delay) => {
      const { oscillator, gainNode } = createOscillator(ctx, 440, 'triangle');
      const startTime = ctx.currentTime + delay;
      gainNode.gain.setValueAtTime(volume * 0.12, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.08);
    });
  },

  // Notification - pleasant ping
  notification: (ctx, volume) => {
    const { oscillator, gainNode } = createOscillator(ctx, 880, 'sine');
    gainNode.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    oscillator.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  },

  // Toggle switch
  toggle: (ctx, volume) => {
    const { oscillator, gainNode } = createOscillator(ctx, 800, 'sine', 0.04);
    gainNode.gain.setValueAtTime(volume * 0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.04);
  },

  // Pop - bubble-like
  pop: (ctx, volume) => {
    const { oscillator, gainNode } = createOscillator(ctx, 400, 'sine');
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  },

  // Swoosh - quick transition
  swoosh: (ctx, volume) => {
    const noise = ctx.createBufferSource();
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(8000, ctx.currentTime + 0.1);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume * 0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    noise.start(ctx.currentTime);
  },

  // Complete - satisfying finish
  complete: (ctx, volume) => {
    const notes = [523.25, 783.99, 1046.5]; // C5, G5, C6
    notes.forEach((freq, i) => {
      const { oscillator, gainNode } = createOscillator(ctx, freq, 'sine');
      const startTime = ctx.currentTime + i * 0.1;
      gainNode.gain.setValueAtTime(volume * 0.12, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.4);
    });
  },

  // Delete - descending
  delete: (ctx, volume) => {
    const { oscillator, gainNode } = createOscillator(ctx, 600, 'sine');
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
    gainNode.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  },

  // Hover - very subtle
  hover: (ctx, volume) => {
    const { oscillator, gainNode } = createOscillator(ctx, 2000, 'sine', 0.02);
    gainNode.gain.setValueAtTime(volume * 0.03, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.02);
  },

  // Focus - gentle
  focus: (ctx, volume) => {
    const { oscillator, gainNode } = createOscillator(ctx, 1500, 'sine', 0.03);
    gainNode.gain.setValueAtTime(volume * 0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.03);
  },

  // Type - keyboard-like
  type: (ctx, volume) => {
    const freq = 1000 + Math.random() * 200;
    const { oscillator, gainNode } = createOscillator(ctx, freq, 'sine', 0.02);
    gainNode.gain.setValueAtTime(volume * 0.03, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.02);
  },

  // Send - whoosh up
  send: (ctx, volume) => {
    const { oscillator, gainNode } = createOscillator(ctx, 400, 'sine');
    oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
    gainNode.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  },

  // Receive - whoosh down
  receive: (ctx, volume) => {
    const { oscillator, gainNode } = createOscillator(ctx, 1200, 'sine');
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
    gainNode.gain.setValueAtTime(volume * 0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  },
};

// ============================================================================
// SOUND MANAGER CLASS
// ============================================================================

class SoundManager {
  private config: SoundConfig = {
    enabled: true,
    volume: 0.5,
    reducedMotion: false,
  };

  constructor() {
    // Check user preferences
    if (typeof window !== 'undefined') {
      // Check for saved preferences
      const saved = localStorage.getItem('lumina_sound_prefs');
      if (saved) {
        try {
          this.config = { ...this.config, ...JSON.parse(saved) };
        } catch (e) {
          // Ignore parse errors
        }
      }

      // Check reduced motion preference
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.config.reducedMotion = mediaQuery.matches;
      mediaQuery.addEventListener('change', (e) => {
        this.config.reducedMotion = e.matches;
      });

      // Resume audio context on first user interaction
      const resumeOnInteraction = () => {
        resumeAudioContext();
        document.removeEventListener('click', resumeOnInteraction);
        document.removeEventListener('keydown', resumeOnInteraction);
      };
      document.addEventListener('click', resumeOnInteraction);
      document.addEventListener('keydown', resumeOnInteraction);
    }
  }

  // Play a sound
  play(name: SoundName): void {
    if (!this.config.enabled || this.config.reducedMotion) return;

    try {
      const ctx = getAudioContext();
      if (ctx.state === 'running') {
        soundDefinitions[name](ctx, this.config.volume);
      }
    } catch (e) {
      // Silently fail - sounds are non-essential
      console.debug('[Sounds] Playback failed:', e);
    }
  }

  // Enable/disable sounds
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.savePrefs();
  }

  // Set volume (0-1)
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
    this.savePrefs();
  }

  // Get current config
  getConfig(): SoundConfig {
    return { ...this.config };
  }

  // Check if sounds are enabled
  isEnabled(): boolean {
    return this.config.enabled && !this.config.reducedMotion;
  }

  private savePrefs(): void {
    try {
      localStorage.setItem('lumina_sound_prefs', JSON.stringify({
        enabled: this.config.enabled,
        volume: this.config.volume,
      }));
    } catch (e) {
      // Storage unavailable
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const sounds = new SoundManager();

// ============================================================================
// REACT HOOK
// ============================================================================

import { useCallback } from 'react';

export function useSound() {
  const play = useCallback((name: SoundName) => {
    sounds.play(name);
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    sounds.setEnabled(enabled);
  }, []);

  const setVolume = useCallback((volume: number) => {
    sounds.setVolume(volume);
  }, []);

  return {
    play,
    setEnabled,
    setVolume,
    isEnabled: sounds.isEnabled(),
    config: sounds.getConfig(),
  };
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const playSound = (name: SoundName) => sounds.play(name);
export const playClick = () => sounds.play('click');
export const playSuccess = () => sounds.play('success');
export const playError = () => sounds.play('error');
export const playNotification = () => sounds.play('notification');
export const playPop = () => sounds.play('pop');

// Alias for useSoundEffect (compatibility)
export const useSoundEffect = useSound;

export default sounds;
