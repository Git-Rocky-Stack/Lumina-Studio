import type { PhotoLayer } from '../../types';

// ============================================
// BRUSH SYSTEM TYPES
// ============================================

export type BrushType = 'round' | 'soft' | 'flat' | 'airbrush' | 'pencil' | 'marker' | 'textured';

export interface BrushPreset {
  id: string;
  name: string;
  type: BrushType;
  size: number;           // 1-1000 pixels
  hardness: number;       // 0-100%
  opacity: number;        // 0-100%
  flow: number;           // 0-100% (paint accumulation rate)
  spacing: number;        // 1-200% (distance between dabs)
  angle: number;          // 0-360 degrees
  roundness: number;      // 0-100%
  scattering: number;     // 0-100%
  pressureSensitivity: {
    size: boolean;
    opacity: boolean;
    hardness: boolean;
    flow: boolean;
  };
  texture?: string;       // base64 for textured brushes
  isCustom?: boolean;
}

export interface BrushPoint {
  x: number;
  y: number;
  pressure: number;       // 0-1 from Pointer Events API
  tiltX: number;          // -90 to 90
  tiltY: number;          // -90 to 90
  timestamp: number;
}

export interface BrushStroke {
  id: string;
  layerId: string;
  points: BrushPoint[];
  brush: BrushPreset;
  color: string;
  blendMode: ExtendedBlendMode;
  timestamp: number;
}

// ============================================
// EXTENDED BLEND MODES
// ============================================

export type ExtendedBlendMode =
  | 'normal'
  | 'dissolve'
  | 'darken'
  | 'multiply'
  | 'color-burn'
  | 'linear-burn'
  | 'darker-color'
  | 'lighten'
  | 'screen'
  | 'color-dodge'
  | 'linear-dodge'
  | 'lighter-color'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'vivid-light'
  | 'linear-light'
  | 'pin-light'
  | 'hard-mix'
  | 'difference'
  | 'exclusion'
  | 'subtract'
  | 'divide'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

// ============================================
// LAYER EFFECTS TYPES
// ============================================

export type LayerEffectType =
  | 'dropShadow'
  | 'innerShadow'
  | 'outerGlow'
  | 'innerGlow'
  | 'bevelEmboss'
  | 'stroke'
  | 'colorOverlay'
  | 'gradientOverlay'
  | 'patternOverlay';

export interface DropShadowSettings {
  color: string;
  opacity: number;        // 0-100%
  angle: number;          // 0-360
  distance: number;       // pixels
  spread: number;         // 0-100%
  size: number;           // blur in pixels
  contour: 'linear' | 'gaussian' | 'cove';
  antiAliased: boolean;
  useGlobalLight: boolean;
}

export interface InnerShadowSettings {
  color: string;
  opacity: number;
  angle: number;
  distance: number;
  choke: number;          // 0-100%
  size: number;
  contour: 'linear' | 'gaussian' | 'cove';
  antiAliased: boolean;
  useGlobalLight: boolean;
}

export interface OuterGlowSettings {
  color: string;
  opacity: number;
  technique: 'softer' | 'precise';
  spread: number;
  size: number;
  contour: 'linear' | 'gaussian' | 'cove';
  antiAliased: boolean;
  noise: number;          // 0-100%
}

export interface InnerGlowSettings {
  color: string;
  opacity: number;
  technique: 'softer' | 'precise';
  source: 'center' | 'edge';
  choke: number;
  size: number;
  contour: 'linear' | 'gaussian' | 'cove';
  antiAliased: boolean;
  noise: number;
}

export interface StrokeSettings {
  color: string;
  size: number;           // 1-250 pixels
  position: 'outside' | 'inside' | 'center';
  opacity: number;
  fillType: 'color' | 'gradient' | 'pattern';
  gradient?: GradientSettings;
}

export interface BevelEmbossSettings {
  style: 'outer-bevel' | 'inner-bevel' | 'emboss' | 'pillow-emboss' | 'stroke-emboss';
  technique: 'smooth' | 'chisel-hard' | 'chisel-soft';
  depth: number;          // 1-1000%
  direction: 'up' | 'down';
  size: number;
  soften: number;
  angle: number;
  altitude: number;       // 0-90
  highlightMode: ExtendedBlendMode;
  highlightColor: string;
  highlightOpacity: number;
  shadowMode: ExtendedBlendMode;
  shadowColor: string;
  shadowOpacity: number;
}

export interface ColorOverlaySettings {
  color: string;
  opacity: number;
  blendMode: ExtendedBlendMode;
}

export interface GradientSettings {
  type: 'linear' | 'radial' | 'angle' | 'reflected' | 'diamond';
  stops: Array<{ color: string; position: number }>;
  angle: number;
  scale: number;
  reverse: boolean;
}

export interface GradientOverlaySettings {
  gradient: GradientSettings;
  opacity: number;
  blendMode: ExtendedBlendMode;
  angle: number;
  scale: number;
  alignWithLayer: boolean;
}

export type LayerEffectSettings =
  | { type: 'dropShadow'; settings: DropShadowSettings }
  | { type: 'innerShadow'; settings: InnerShadowSettings }
  | { type: 'outerGlow'; settings: OuterGlowSettings }
  | { type: 'innerGlow'; settings: InnerGlowSettings }
  | { type: 'stroke'; settings: StrokeSettings }
  | { type: 'bevelEmboss'; settings: BevelEmbossSettings }
  | { type: 'colorOverlay'; settings: ColorOverlaySettings }
  | { type: 'gradientOverlay'; settings: GradientOverlaySettings };

export interface LayerEffect {
  id: string;
  type: LayerEffectType;
  enabled: boolean;
  settings: LayerEffectSettings['settings'];
}

// ============================================
// EXTENDED FILTER TYPES
// ============================================

export type ExtendedFilterType =
  | 'brightness'
  | 'contrast'
  | 'saturation'
  | 'hue'
  | 'blur'
  | 'gaussianBlur'
  | 'motionBlur'
  | 'radialBlur'
  | 'sharpen'
  | 'unsharpMask'
  | 'highPass'
  | 'levels'
  | 'curves'
  | 'exposure'
  | 'vibrance'
  | 'colorBalance'
  | 'channelMixer'
  | 'blackAndWhite'
  | 'photoFilter'
  | 'gradientMap'
  | 'posterize'
  | 'threshold'
  | 'invert'
  | 'sepia'
  | 'vignette'
  | 'noise'
  | 'grain'
  | 'ai_enhance';

export interface ExtendedPhotoFilter {
  id: string;
  type: ExtendedFilterType;
  enabled: boolean;
  value: number | Record<string, number>;
}

// ============================================
// LAYER MASK TYPES
// ============================================

export interface LayerMask {
  id: string;
  enabled: boolean;
  linked: boolean;        // linked to layer position
  inverted: boolean;
  density: number;        // 0-100%
  feather: number;        // 0-250 pixels
  data?: ImageData;       // mask bitmap data
}

// ============================================
// EXTENDED PHOTO LAYER
// ============================================

export interface PhotoLayerExtended extends Omit<PhotoLayer, 'blendMode' | 'filters'> {
  blendMode: ExtendedBlendMode;
  filters: ExtendedPhotoFilter[];
  effects: LayerEffect[];
  mask?: LayerMask;
  clippingMask?: string;  // parent layer id for clipping
  smartObject?: boolean;
  thumbnail?: string;     // base64 thumbnail for layers panel
  groupId?: string;       // for layer groups
  isGroup?: boolean;
  isExpanded?: boolean;   // for group collapse state
}

// ============================================
// HISTORY SYSTEM TYPES
// ============================================

export interface HistorySnapshot {
  id: string;
  timestamp: number;
  description: string;
  thumbnail?: string;     // small preview
  canvasState: string;    // serialized Fabric.js state
  layerStates: PhotoLayerExtended[];
  selectedLayerIds: string[];
  isCheckpoint?: boolean;
  checkpointName?: string;
}

export interface HistoryState {
  snapshots: HistorySnapshot[];
  currentIndex: number;
  maxSnapshots: number;
}

// ============================================
// TOOL TYPES
// ============================================

export type PhotoTool =
  | 'select'
  | 'move'
  | 'marqueeRect'
  | 'marqueeEllipse'
  | 'lassoFree'
  | 'lassoPolygon'
  | 'lassoMagnetic'
  | 'magicWand'
  | 'quickSelect'
  | 'crop'
  | 'slice'
  | 'eyedropper'
  | 'colorSampler'
  | 'ruler'
  | 'brush'
  | 'pencil'
  | 'colorReplace'
  | 'mixer'
  | 'clone'
  | 'patternStamp'
  | 'historyBrush'
  | 'eraser'
  | 'backgroundEraser'
  | 'magicEraser'
  | 'gradient'
  | 'paintBucket'
  | 'blur'
  | 'sharpen'
  | 'smudge'
  | 'dodge'
  | 'burn'
  | 'sponge'
  | 'pen'
  | 'freeformPen'
  | 'curvaturePen'
  | 'text'
  | 'textVertical'
  | 'pathSelect'
  | 'directSelect'
  | 'rectangle'
  | 'ellipse'
  | 'polygon'
  | 'line'
  | 'customShape'
  | 'hand'
  | 'rotate'
  | 'zoom';

export interface ToolState {
  activeTool: PhotoTool;
  previousTool: PhotoTool | null;
  brushSettings: BrushPreset;
  primaryColor: string;
  secondaryColor: string;
  opacity: number;
  tolerance: number;      // for magic wand, etc.
  feather: number;
  antiAlias: boolean;
  contiguous: boolean;    // for fill tools
  sampleAllLayers: boolean;
}

// ============================================
// CANVAS STATE TYPES
// ============================================

export interface CanvasState {
  width: number;
  height: number;
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
  backgroundColor: string;
  showGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
  snapToGrid: boolean;
  snapToGuides: boolean;
  gridSize: number;
  guides: Array<{ orientation: 'horizontal' | 'vertical'; position: number }>;
}

export interface ViewportState {
  width: number;
  height: number;
  devicePixelRatio: number;
}

// ============================================
// SELECTION TYPES
// ============================================

export interface Selection {
  id: string;
  type: 'rectangle' | 'ellipse' | 'freeform' | 'polygon' | 'magic';
  path: Array<{ x: number; y: number }>;
  feather: number;
  antiAlias: boolean;
  inverted: boolean;
}

// ============================================
// EXPORT TYPES
// ============================================

export type ExportFormat = 'png' | 'jpg' | 'webp' | 'gif' | 'psd' | 'pdf' | 'svg' | 'tiff';

export interface ExportSettings {
  format: ExportFormat;
  quality: number;        // 0-100 for lossy formats
  scale: number;          // 0.1-10
  width?: number;
  height?: number;
  preserveTransparency: boolean;
  colorSpace: 'sRGB' | 'Adobe RGB' | 'ProPhoto RGB';
  bitDepth: 8 | 16 | 32;
  includeMetadata: boolean;
  flattenLayers: boolean;
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_BRUSH_PRESET: BrushPreset = {
  id: 'default-round',
  name: 'Round',
  type: 'round',
  size: 20,
  hardness: 100,
  opacity: 100,
  flow: 100,
  spacing: 25,
  angle: 0,
  roundness: 100,
  scattering: 0,
  pressureSensitivity: {
    size: true,
    opacity: false,
    hardness: false,
    flow: false,
  },
};

export const DEFAULT_DROP_SHADOW: DropShadowSettings = {
  color: '#000000',
  opacity: 75,
  angle: 120,
  distance: 5,
  spread: 0,
  size: 5,
  contour: 'linear',
  antiAliased: true,
  useGlobalLight: true,
};

export const DEFAULT_STROKE: StrokeSettings = {
  color: '#000000',
  size: 3,
  position: 'outside',
  opacity: 100,
  fillType: 'color',
};

export const DEFAULT_OUTER_GLOW: OuterGlowSettings = {
  color: '#ffff00',
  opacity: 75,
  technique: 'softer',
  spread: 0,
  size: 5,
  contour: 'linear',
  antiAliased: true,
  noise: 0,
};

export const DEFAULT_CANVAS_STATE: CanvasState = {
  width: 1920,
  height: 1080,
  zoom: 1,
  panX: 0,
  panY: 0,
  rotation: 0,
  backgroundColor: '#ffffff',
  showGrid: false,
  showRulers: true,
  showGuides: true,
  snapToGrid: false,
  snapToGuides: true,
  gridSize: 10,
  guides: [],
};

export const DEFAULT_TOOL_STATE: ToolState = {
  activeTool: 'select',
  previousTool: null,
  brushSettings: DEFAULT_BRUSH_PRESET,
  primaryColor: '#000000',
  secondaryColor: '#ffffff',
  opacity: 100,
  tolerance: 32,
  feather: 0,
  antiAlias: true,
  contiguous: true,
  sampleAllLayers: false,
};
