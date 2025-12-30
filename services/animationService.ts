// ============================================================================
// ANIMATION TIMELINE SERVICE
// ============================================================================

import {
  generateAnimationId,
  getValueAtTime,
  formatTime,
  DEFAULT_PRESETS
} from '../types/animation';
import type {
  AnimationProject,
  AnimationSequence,
  AnimationTrack,
  Keyframe,
  PlaybackState,
  TimelineSettings,
  AnimationPreset,
  AnimatableProperty,
  EasingType,
  InterpolatedValue
} from '../types/animation';
import type { DesignElement } from '../types';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  PROJECT: 'lumina_animation_project',
  SETTINGS: 'lumina_animation_settings',
  CUSTOM_PRESETS: 'lumina_animation_presets'
};

// ============================================================================
// ANIMATION MANAGER
// ============================================================================

class AnimationManager {
  private project: AnimationProject;
  private playbackState: PlaybackState;
  private settings: TimelineSettings;
  private presets: AnimationPreset[];
  private animationFrame: number | null = null;
  private lastFrameTime: number = 0;

  // Callbacks
  private onPlaybackUpdate: ((state: PlaybackState) => void) | null = null;
  private onTimeUpdate: ((time: number) => void) | null = null;
  private onSequenceChange: ((sequence: AnimationSequence | null) => void) | null = null;
  private onElementUpdate: ((elementId: string, values: Record<string, any>) => void) | null = null;

  constructor() {
    this.project = this.createDefaultProject();
    this.playbackState = {
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      playbackRate: 1,
      direction: 'forward'
    };
    this.settings = {
      zoom: 100,
      snapToGrid: true,
      gridSize: 100,
      showWaveforms: false,
      showCurves: true,
      autoScroll: true
    };
    this.presets = [...DEFAULT_PRESETS];

    this.loadFromStorage();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private createDefaultProject(): AnimationProject {
    return {
      id: generateAnimationId('proj'),
      sequences: [],
      activeSequenceId: null,
      fps: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private loadFromStorage(): void {
    try {
      const projectJson = localStorage.getItem(STORAGE_KEYS.PROJECT);
      const settingsJson = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const presetsJson = localStorage.getItem(STORAGE_KEYS.CUSTOM_PRESETS);

      if (projectJson) {
        this.project = JSON.parse(projectJson);
      }

      if (settingsJson) {
        this.settings = { ...this.settings, ...JSON.parse(settingsJson) };
      }

      if (presetsJson) {
        const customPresets = JSON.parse(presetsJson) as AnimationPreset[];
        this.presets = [...DEFAULT_PRESETS, ...customPresets];
      }
    } catch (error) {
      console.error('Failed to load animation project:', error);
    }
  }

  private saveToStorage(): void {
    try {
      this.project.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(this.project));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      localStorage.setItem(
        STORAGE_KEYS.CUSTOM_PRESETS,
        JSON.stringify(this.presets.filter(p => p.category === 'custom'))
      );
    } catch (error) {
      console.error('Failed to save animation project:', error);
    }
  }

  // ============================================================================
  // SEQUENCE MANAGEMENT
  // ============================================================================

  /**
   * Create a new animation sequence
   */
  createSequence(name: string, duration: number = 3000): AnimationSequence {
    const sequence: AnimationSequence = {
      id: generateAnimationId('seq'),
      name,
      duration,
      tracks: [],
      loop: false,
      autoPlay: false,
      delay: 0
    };

    this.project.sequences.push(sequence);
    this.project.activeSequenceId = sequence.id;
    this.saveToStorage();
    this.onSequenceChange?.(sequence);

    return sequence;
  }

  /**
   * Get active sequence
   */
  getActiveSequence(): AnimationSequence | null {
    if (!this.project.activeSequenceId) return null;
    return this.project.sequences.find(s => s.id === this.project.activeSequenceId) || null;
  }

  /**
   * Set active sequence
   */
  setActiveSequence(sequenceId: string | null): void {
    this.project.activeSequenceId = sequenceId;
    this.stop();
    this.saveToStorage();
    this.onSequenceChange?.(this.getActiveSequence());
  }

  /**
   * Get all sequences
   */
  getAllSequences(): AnimationSequence[] {
    return this.project.sequences;
  }

  /**
   * Update sequence
   */
  updateSequence(sequenceId: string, updates: Partial<AnimationSequence>): AnimationSequence | null {
    const sequence = this.project.sequences.find(s => s.id === sequenceId);
    if (!sequence) return null;

    Object.assign(sequence, updates);
    this.saveToStorage();

    return sequence;
  }

  /**
   * Delete sequence
   */
  deleteSequence(sequenceId: string): boolean {
    const index = this.project.sequences.findIndex(s => s.id === sequenceId);
    if (index === -1) return false;

    this.project.sequences.splice(index, 1);

    if (this.project.activeSequenceId === sequenceId) {
      this.project.activeSequenceId = this.project.sequences[0]?.id || null;
    }

    this.saveToStorage();
    this.onSequenceChange?.(this.getActiveSequence());

    return true;
  }

  /**
   * Duplicate sequence
   */
  duplicateSequence(sequenceId: string): AnimationSequence | null {
    const sequence = this.project.sequences.find(s => s.id === sequenceId);
    if (!sequence) return null;

    const duplicate: AnimationSequence = {
      ...sequence,
      id: generateAnimationId('seq'),
      name: `${sequence.name} Copy`,
      tracks: sequence.tracks.map(track => ({
        ...track,
        id: generateAnimationId('track'),
        keyframes: track.keyframes.map(kf => ({
          ...kf,
          id: generateAnimationId('kf')
        }))
      }))
    };

    this.project.sequences.push(duplicate);
    this.saveToStorage();

    return duplicate;
  }

  // ============================================================================
  // TRACK MANAGEMENT
  // ============================================================================

  /**
   * Add track to sequence
   */
  addTrack(
    sequenceId: string,
    elementId: string,
    property: AnimatableProperty
  ): AnimationTrack | null {
    const sequence = this.project.sequences.find(s => s.id === sequenceId);
    if (!sequence) return null;

    const track: AnimationTrack = {
      id: generateAnimationId('track'),
      elementId,
      property,
      keyframes: [],
      enabled: true
    };

    sequence.tracks.push(track);
    this.saveToStorage();

    return track;
  }

  /**
   * Remove track
   */
  removeTrack(sequenceId: string, trackId: string): boolean {
    const sequence = this.project.sequences.find(s => s.id === sequenceId);
    if (!sequence) return false;

    const index = sequence.tracks.findIndex(t => t.id === trackId);
    if (index === -1) return false;

    sequence.tracks.splice(index, 1);
    this.saveToStorage();

    return true;
  }

  /**
   * Get tracks for element
   */
  getTracksForElement(sequenceId: string, elementId: string): AnimationTrack[] {
    const sequence = this.project.sequences.find(s => s.id === sequenceId);
    if (!sequence) return [];

    return sequence.tracks.filter(t => t.elementId === elementId);
  }

  /**
   * Toggle track enabled
   */
  toggleTrackEnabled(sequenceId: string, trackId: string): boolean {
    const sequence = this.project.sequences.find(s => s.id === sequenceId);
    if (!sequence) return false;

    const track = sequence.tracks.find(t => t.id === trackId);
    if (!track) return false;

    track.enabled = !track.enabled;
    this.saveToStorage();

    return true;
  }

  // ============================================================================
  // KEYFRAME MANAGEMENT
  // ============================================================================

  /**
   * Add keyframe
   */
  addKeyframe(
    sequenceId: string,
    trackId: string,
    time: number,
    value: number | string,
    easing: EasingType = 'easeInOut'
  ): Keyframe | null {
    const sequence = this.project.sequences.find(s => s.id === sequenceId);
    if (!sequence) return null;

    const track = sequence.tracks.find(t => t.id === trackId);
    if (!track) return null;

    // Check if keyframe exists at this time
    const existingIndex = track.keyframes.findIndex(kf => kf.time === time);
    if (existingIndex !== -1) {
      track.keyframes[existingIndex].value = value;
      track.keyframes[existingIndex].easing = easing;
      this.saveToStorage();
      return track.keyframes[existingIndex];
    }

    const keyframe: Keyframe = {
      id: generateAnimationId('kf'),
      time,
      value,
      easing
    };

    track.keyframes.push(keyframe);
    track.keyframes.sort((a, b) => a.time - b.time);
    this.saveToStorage();

    return keyframe;
  }

  /**
   * Update keyframe
   */
  updateKeyframe(
    sequenceId: string,
    trackId: string,
    keyframeId: string,
    updates: Partial<Keyframe>
  ): Keyframe | null {
    const sequence = this.project.sequences.find(s => s.id === sequenceId);
    if (!sequence) return null;

    const track = sequence.tracks.find(t => t.id === trackId);
    if (!track) return null;

    const keyframe = track.keyframes.find(kf => kf.id === keyframeId);
    if (!keyframe) return null;

    Object.assign(keyframe, updates);
    track.keyframes.sort((a, b) => a.time - b.time);
    this.saveToStorage();

    return keyframe;
  }

  /**
   * Delete keyframe
   */
  deleteKeyframe(sequenceId: string, trackId: string, keyframeId: string): boolean {
    const sequence = this.project.sequences.find(s => s.id === sequenceId);
    if (!sequence) return false;

    const track = sequence.tracks.find(t => t.id === trackId);
    if (!track) return false;

    const index = track.keyframes.findIndex(kf => kf.id === keyframeId);
    if (index === -1) return false;

    track.keyframes.splice(index, 1);
    this.saveToStorage();

    return true;
  }

  /**
   * Move keyframe
   */
  moveKeyframe(
    sequenceId: string,
    trackId: string,
    keyframeId: string,
    newTime: number
  ): boolean {
    const sequence = this.project.sequences.find(s => s.id === sequenceId);
    if (!sequence) return false;

    const track = sequence.tracks.find(t => t.id === trackId);
    if (!track) return false;

    const keyframe = track.keyframes.find(kf => kf.id === keyframeId);
    if (!keyframe) return false;

    // Snap to grid if enabled
    if (this.settings.snapToGrid) {
      newTime = Math.round(newTime / this.settings.gridSize) * this.settings.gridSize;
    }

    keyframe.time = Math.max(0, Math.min(newTime, sequence.duration));
    track.keyframes.sort((a, b) => a.time - b.time);
    this.saveToStorage();

    return true;
  }

  // ============================================================================
  // PLAYBACK CONTROL
  // ============================================================================

  /**
   * Play animation
   */
  play(): void {
    if (this.playbackState.isPlaying) return;

    const sequence = this.getActiveSequence();
    if (!sequence) return;

    this.playbackState.isPlaying = true;
    this.playbackState.isPaused = false;
    this.lastFrameTime = performance.now();

    this.animationFrame = requestAnimationFrame(this.tick.bind(this));
    this.onPlaybackUpdate?.(this.playbackState);
  }

  /**
   * Pause animation
   */
  pause(): void {
    if (!this.playbackState.isPlaying) return;

    this.playbackState.isPlaying = false;
    this.playbackState.isPaused = true;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.onPlaybackUpdate?.(this.playbackState);
  }

  /**
   * Stop animation
   */
  stop(): void {
    this.playbackState.isPlaying = false;
    this.playbackState.isPaused = false;
    this.playbackState.currentTime = 0;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.onPlaybackUpdate?.(this.playbackState);
    this.onTimeUpdate?.(0);
  }

  /**
   * Seek to time
   */
  seek(time: number): void {
    const sequence = this.getActiveSequence();
    if (!sequence) return;

    this.playbackState.currentTime = Math.max(0, Math.min(time, sequence.duration));
    this.updateElements();
    this.onTimeUpdate?.(this.playbackState.currentTime);
  }

  /**
   * Set playback rate
   */
  setPlaybackRate(rate: number): void {
    this.playbackState.playbackRate = Math.max(0.1, Math.min(rate, 4));
    this.onPlaybackUpdate?.(this.playbackState);
  }

  /**
   * Toggle playback direction
   */
  toggleDirection(): void {
    this.playbackState.direction = this.playbackState.direction === 'forward' ? 'reverse' : 'forward';
    this.onPlaybackUpdate?.(this.playbackState);
  }

  /**
   * Animation tick
   */
  private tick(timestamp: number): void {
    const sequence = this.getActiveSequence();
    if (!sequence || !this.playbackState.isPlaying) return;

    const delta = (timestamp - this.lastFrameTime) * this.playbackState.playbackRate;
    this.lastFrameTime = timestamp;

    if (this.playbackState.direction === 'forward') {
      this.playbackState.currentTime += delta;

      if (this.playbackState.currentTime >= sequence.duration) {
        if (sequence.loop) {
          this.playbackState.currentTime = 0;
        } else {
          this.playbackState.currentTime = sequence.duration;
          this.pause();
          return;
        }
      }
    } else {
      this.playbackState.currentTime -= delta;

      if (this.playbackState.currentTime <= 0) {
        if (sequence.loop) {
          this.playbackState.currentTime = sequence.duration;
        } else {
          this.playbackState.currentTime = 0;
          this.pause();
          return;
        }
      }
    }

    this.updateElements();
    this.onTimeUpdate?.(this.playbackState.currentTime);

    this.animationFrame = requestAnimationFrame(this.tick.bind(this));
  }

  /**
   * Update elements based on current time
   */
  private updateElements(): void {
    const sequence = this.getActiveSequence();
    if (!sequence) return;

    const elementUpdates = new Map<string, Record<string, any>>();

    sequence.tracks.forEach(track => {
      if (!track.enabled || track.keyframes.length === 0) return;

      const value = getValueAtTime(track.keyframes, this.playbackState.currentTime);
      if (value === null) return;

      if (!elementUpdates.has(track.elementId)) {
        elementUpdates.set(track.elementId, {});
      }

      elementUpdates.get(track.elementId)![track.property] = value;
    });

    elementUpdates.forEach((values, elementId) => {
      this.onElementUpdate?.(elementId, values);
    });
  }

  /**
   * Get interpolated values at current time
   */
  getValuesAtTime(time?: number): Map<string, InterpolatedValue[]> {
    const sequence = this.getActiveSequence();
    if (!sequence) return new Map();

    const t = time ?? this.playbackState.currentTime;
    const result = new Map<string, InterpolatedValue[]>();

    sequence.tracks.forEach(track => {
      if (!track.enabled || track.keyframes.length === 0) return;

      const value = getValueAtTime(track.keyframes, t);
      if (value === null) return;

      if (!result.has(track.elementId)) {
        result.set(track.elementId, []);
      }

      result.get(track.elementId)!.push({
        property: track.property,
        value,
        time: t
      });
    });

    return result;
  }

  // ============================================================================
  // PRESETS
  // ============================================================================

  /**
   * Get all presets
   */
  getPresets(): AnimationPreset[] {
    return this.presets;
  }

  /**
   * Apply preset to element
   */
  applyPreset(
    sequenceId: string,
    elementId: string,
    presetId: string,
    startTime: number = 0
  ): AnimationTrack[] {
    const sequence = this.project.sequences.find(s => s.id === sequenceId);
    if (!sequence) return [];

    const preset = this.presets.find(p => p.id === presetId);
    if (!preset) return [];

    const tracks: AnimationTrack[] = [];

    preset.tracks.forEach(presetTrack => {
      const track: AnimationTrack = {
        id: generateAnimationId('track'),
        elementId,
        property: presetTrack.property,
        keyframes: presetTrack.keyframes.map(kf => ({
          ...kf,
          id: generateAnimationId('kf'),
          time: kf.time + startTime
        })),
        enabled: true
      };

      sequence.tracks.push(track);
      tracks.push(track);
    });

    // Extend sequence duration if needed
    const maxTime = startTime + preset.duration;
    if (maxTime > sequence.duration) {
      sequence.duration = maxTime;
    }

    this.saveToStorage();

    return tracks;
  }

  /**
   * Create custom preset from tracks
   */
  createPreset(name: string, tracks: AnimationTrack[]): AnimationPreset {
    const duration = Math.max(...tracks.flatMap(t => t.keyframes.map(kf => kf.time)));

    const preset: AnimationPreset = {
      id: generateAnimationId('preset'),
      name,
      category: 'custom',
      duration,
      tracks: tracks.map(t => ({
        property: t.property,
        keyframes: t.keyframes.map(kf => ({ ...kf })),
        enabled: t.enabled
      }))
    };

    this.presets.push(preset);
    this.saveToStorage();

    return preset;
  }

  // ============================================================================
  // SETTINGS
  // ============================================================================

  /**
   * Get settings
   */
  getSettings(): TimelineSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(updates: Partial<TimelineSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveToStorage();
  }

  /**
   * Get playback state
   */
  getPlaybackState(): PlaybackState {
    return { ...this.playbackState };
  }

  /**
   * Get project
   */
  getProject(): AnimationProject {
    return this.project;
  }

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  setOnPlaybackUpdate(callback: (state: PlaybackState) => void): void {
    this.onPlaybackUpdate = callback;
  }

  setOnTimeUpdate(callback: (time: number) => void): void {
    this.onTimeUpdate = callback;
  }

  setOnSequenceChange(callback: (sequence: AnimationSequence | null) => void): void {
    this.onSequenceChange = callback;
  }

  setOnElementUpdate(callback: (elementId: string, values: Record<string, any>) => void): void {
    this.onElementUpdate = callback;
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  /**
   * Export animation as CSS
   */
  exportToCss(sequenceId: string): string {
    const sequence = this.project.sequences.find(s => s.id === sequenceId);
    if (!sequence) return '';

    const lines: string[] = [];

    // Group tracks by element
    const tracksByElement = new Map<string, AnimationTrack[]>();
    sequence.tracks.forEach(track => {
      if (!tracksByElement.has(track.elementId)) {
        tracksByElement.set(track.elementId, []);
      }
      tracksByElement.get(track.elementId)!.push(track);
    });

    tracksByElement.forEach((tracks, elementId) => {
      const animName = `animation-${elementId}`;

      lines.push(`@keyframes ${animName} {`);

      // Get all unique times
      const times = new Set<number>();
      tracks.forEach(track => {
        track.keyframes.forEach(kf => times.add(kf.time));
      });

      const sortedTimes = Array.from(times).sort((a, b) => a - b);

      sortedTimes.forEach(time => {
        const percent = (time / sequence.duration * 100).toFixed(1);
        const properties: string[] = [];

        tracks.forEach(track => {
          const value = getValueAtTime(track.keyframes, time);
          if (value !== null) {
            properties.push(`${this.propertyToCss(track.property)}: ${value}${this.getPropertyUnit(track.property)}`);
          }
        });

        if (properties.length > 0) {
          lines.push(`  ${percent}% {`);
          properties.forEach(prop => lines.push(`    ${prop};`));
          lines.push('  }');
        }
      });

      lines.push('}');
      lines.push('');
      lines.push(`.${elementId} {`);
      lines.push(`  animation: ${animName} ${sequence.duration}ms ${sequence.loop ? 'infinite' : 'forwards'};`);
      lines.push('}');
      lines.push('');
    });

    return lines.join('\n');
  }

  private propertyToCss(property: AnimatableProperty): string {
    const map: Record<AnimatableProperty, string> = {
      x: 'transform: translateX',
      y: 'transform: translateY',
      width: 'width',
      height: 'height',
      rotation: 'transform: rotate',
      scale: 'transform: scale',
      scaleX: 'transform: scaleX',
      scaleY: 'transform: scaleY',
      opacity: 'opacity',
      fill: 'background-color',
      stroke: 'border-color',
      strokeWidth: 'border-width',
      borderRadius: 'border-radius',
      blur: 'filter: blur',
      shadow: 'box-shadow'
    };
    return map[property];
  }

  private getPropertyUnit(property: AnimatableProperty): string {
    const units: Record<AnimatableProperty, string> = {
      x: 'px',
      y: 'px',
      width: 'px',
      height: 'px',
      rotation: 'deg',
      scale: '',
      scaleX: '',
      scaleY: '',
      opacity: '',
      fill: '',
      stroke: '',
      strokeWidth: 'px',
      borderRadius: 'px',
      blur: 'px',
      shadow: ''
    };
    return units[property];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const animationManager = new AnimationManager();
