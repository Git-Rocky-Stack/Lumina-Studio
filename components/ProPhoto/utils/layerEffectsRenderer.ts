import { Shadow } from 'fabric';
import type { FabricObject } from 'fabric';
import type {
  LayerEffect,
  DropShadowSettings,
  InnerShadowSettings,
  OuterGlowSettings,
  InnerGlowSettings,
  StrokeSettings,
  ColorOverlaySettings,
} from '../types';

// Default effect settings
export const defaultEffectSettings: Record<string, any> = {
  dropShadow: {
    color: '#000000',
    opacity: 75,
    angle: 120,
    distance: 5,
    spread: 0,
    size: 5,
    contour: 'linear',
    antiAliased: true,
    useGlobalLight: true,
  } as DropShadowSettings,

  innerShadow: {
    color: '#000000',
    opacity: 75,
    angle: 120,
    distance: 5,
    choke: 0,
    size: 5,
    contour: 'linear',
    antiAliased: true,
    useGlobalLight: true,
  } as InnerShadowSettings,

  outerGlow: {
    color: '#ffff00',
    opacity: 75,
    technique: 'softer',
    spread: 0,
    size: 5,
    contour: 'linear',
    antiAliased: true,
    noise: 0,
  } as OuterGlowSettings,

  innerGlow: {
    color: '#ffff00',
    opacity: 75,
    technique: 'softer',
    source: 'edge',
    choke: 0,
    size: 5,
    contour: 'linear',
    antiAliased: true,
    noise: 0,
  } as InnerGlowSettings,

  stroke: {
    color: '#000000',
    size: 3,
    position: 'outside',
    opacity: 100,
    fillType: 'color',
  } as StrokeSettings,

  colorOverlay: {
    color: '#ff0000',
    opacity: 100,
    blendMode: 'normal',
  } as ColorOverlaySettings,
};

// Create a new layer effect with default settings
export function createLayerEffect(type: LayerEffect['type']): LayerEffect {
  return {
    id: `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    enabled: true,
    settings: { ...defaultEffectSettings[type] },
  };
}

// Apply drop shadow to Fabric object
function applyDropShadow(object: FabricObject, settings: DropShadowSettings): void {
  const angleRad = (settings.angle * Math.PI) / 180;
  const offsetX = Math.cos(angleRad) * settings.distance;
  const offsetY = Math.sin(angleRad) * settings.distance;

  // Convert hex color with opacity
  const colorWithOpacity = hexToRgba(settings.color, settings.opacity / 100);

  object.shadow = new Shadow({
    color: colorWithOpacity,
    blur: settings.size,
    offsetX,
    offsetY,
    affectStroke: false,
  });
}

// Apply stroke to Fabric object
function applyStroke(object: FabricObject, settings: StrokeSettings): void {
  object.stroke = settings.color;
  object.strokeWidth = settings.size;

  // Handle stroke position
  if (settings.position === 'inside') {
    object.strokeUniform = true;
    object.paintFirst = 'stroke';
  } else if (settings.position === 'outside') {
    object.strokeUniform = true;
    object.paintFirst = 'fill';
  } else {
    object.strokeUniform = true;
    object.paintFirst = 'fill';
  }
}

// Apply outer glow (simulated with shadow)
function applyOuterGlow(object: FabricObject, settings: OuterGlowSettings): void {
  const colorWithOpacity = hexToRgba(settings.color, settings.opacity / 100);

  object.shadow = new Shadow({
    color: colorWithOpacity,
    blur: settings.size * 2, // Glow is typically more spread
    offsetX: 0,
    offsetY: 0,
    affectStroke: true,
  });
}

// Apply all effects to a Fabric object
export function applyLayerEffects(object: FabricObject, effects: LayerEffect[]): void {
  // Reset effects
  object.shadow = null;
  object.stroke = null;
  object.strokeWidth = 0;

  // Sort effects by type priority
  const sortedEffects = [...effects].sort((a, b) => {
    const priority: Record<string, number> = {
      dropShadow: 1,
      outerGlow: 2,
      stroke: 3,
      innerShadow: 4,
      innerGlow: 5,
      colorOverlay: 6,
      gradientOverlay: 7,
      bevelEmboss: 8,
    };
    return (priority[a.type] || 99) - (priority[b.type] || 99);
  });

  // Apply each enabled effect
  // Note: Fabric.js has limitations - only one shadow can be applied
  // We'll prioritize based on effect type
  let shadowApplied = false;

  for (const effect of sortedEffects) {
    if (!effect.enabled) continue;

    switch (effect.type) {
      case 'dropShadow':
        if (!shadowApplied) {
          applyDropShadow(object, effect.settings as DropShadowSettings);
          shadowApplied = true;
        }
        break;

      case 'outerGlow':
        if (!shadowApplied) {
          applyOuterGlow(object, effect.settings as OuterGlowSettings);
          shadowApplied = true;
        }
        break;

      case 'stroke':
        applyStroke(object, effect.settings as StrokeSettings);
        break;

      case 'colorOverlay':
        // Color overlay would need to be implemented via filters
        break;

      // Other effects require more complex implementations
      default:
        break;
    }
  }
}

// Generate CSS for layer effects (for preview/non-canvas rendering)
export function generateEffectCSS(effects: LayerEffect[]): React.CSSProperties {
  const styles: React.CSSProperties = {};
  const boxShadows: string[] = [];
  const filters: string[] = [];

  for (const effect of effects) {
    if (!effect.enabled) continue;

    switch (effect.type) {
      case 'dropShadow': {
        const s = effect.settings as DropShadowSettings;
        const angleRad = (s.angle * Math.PI) / 180;
        const offsetX = Math.cos(angleRad) * s.distance;
        const offsetY = Math.sin(angleRad) * s.distance;
        const color = hexToRgba(s.color, s.opacity / 100);
        boxShadows.push(`${offsetX}px ${offsetY}px ${s.size}px ${s.spread}px ${color}`);
        break;
      }

      case 'innerShadow': {
        const s = effect.settings as InnerShadowSettings;
        const angleRad = (s.angle * Math.PI) / 180;
        const offsetX = Math.cos(angleRad) * s.distance;
        const offsetY = Math.sin(angleRad) * s.distance;
        const color = hexToRgba(s.color, s.opacity / 100);
        boxShadows.push(`inset ${offsetX}px ${offsetY}px ${s.size}px ${s.choke}px ${color}`);
        break;
      }

      case 'outerGlow': {
        const s = effect.settings as OuterGlowSettings;
        const color = hexToRgba(s.color, s.opacity / 100);
        boxShadows.push(`0 0 ${s.size}px ${s.spread}px ${color}`);
        break;
      }

      case 'innerGlow': {
        const s = effect.settings as InnerGlowSettings;
        const color = hexToRgba(s.color, s.opacity / 100);
        boxShadows.push(`inset 0 0 ${s.size}px ${s.choke}px ${color}`);
        break;
      }

      case 'stroke': {
        const s = effect.settings as StrokeSettings;
        if (s.position === 'outside') {
          // Outer stroke via outline
          styles.outline = `${s.size}px solid ${s.color}`;
          styles.outlineOffset = '0px';
        } else {
          // Border for inside/center
          styles.border = `${s.size}px solid ${s.color}`;
          if (s.position === 'inside') {
            styles.boxSizing = 'border-box';
          }
        }
        break;
      }
    }
  }

  if (boxShadows.length > 0) {
    styles.boxShadow = boxShadows.join(', ');
  }

  if (filters.length > 0) {
    styles.filter = filters.join(' ');
  }

  return styles;
}

// Helper: Convert hex color to rgba
function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) return `rgba(0, 0, 0, ${alpha})`;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Effect labels for UI
export const effectLabels: Record<string, string> = {
  dropShadow: 'Drop Shadow',
  innerShadow: 'Inner Shadow',
  outerGlow: 'Outer Glow',
  innerGlow: 'Inner Glow',
  bevelEmboss: 'Bevel & Emboss',
  stroke: 'Stroke',
  colorOverlay: 'Color Overlay',
  gradientOverlay: 'Gradient Overlay',
  patternOverlay: 'Pattern Overlay',
};

// Available effects list
export const availableEffects: Array<{ type: LayerEffect['type']; label: string; icon: string }> = [
  { type: 'dropShadow', label: 'Drop Shadow', icon: 'fa-clone' },
  { type: 'innerShadow', label: 'Inner Shadow', icon: 'fa-square' },
  { type: 'outerGlow', label: 'Outer Glow', icon: 'fa-sun' },
  { type: 'innerGlow', label: 'Inner Glow', icon: 'fa-circle' },
  { type: 'stroke', label: 'Stroke', icon: 'fa-square-full' },
  { type: 'bevelEmboss', label: 'Bevel & Emboss', icon: 'fa-cube' },
  { type: 'colorOverlay', label: 'Color Overlay', icon: 'fa-fill-drip' },
  { type: 'gradientOverlay', label: 'Gradient Overlay', icon: 'fa-palette' },
];

// Duplicate an effect
export function duplicateEffect(effect: LayerEffect): LayerEffect {
  return {
    ...effect,
    id: `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    settings: { ...effect.settings },
  };
}

// Serialize effects to JSON
export function serializeEffects(effects: LayerEffect[]): string {
  return JSON.stringify(effects);
}

// Deserialize effects from JSON
export function deserializeEffects(json: string): LayerEffect[] {
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}
