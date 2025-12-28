import { filters } from 'fabric';
import type { ExtendedPhotoFilter, ExtendedFilterType } from '../types';

// Filter configuration with default values and ranges
export const filterConfigs: Record<ExtendedFilterType, {
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
}> = {
  brightness: { label: 'Brightness', defaultValue: 0, min: -100, max: 100, step: 1, unit: '%' },
  contrast: { label: 'Contrast', defaultValue: 0, min: -100, max: 100, step: 1, unit: '%' },
  saturation: { label: 'Saturation', defaultValue: 0, min: -100, max: 100, step: 1, unit: '%' },
  hue: { label: 'Hue', defaultValue: 0, min: -180, max: 180, step: 1, unit: '°' },
  blur: { label: 'Blur', defaultValue: 0, min: 0, max: 100, step: 1, unit: 'px' },
  gaussianBlur: { label: 'Gaussian Blur', defaultValue: 0, min: 0, max: 50, step: 0.1, unit: 'px' },
  motionBlur: { label: 'Motion Blur', defaultValue: 0, min: 0, max: 50, step: 1, unit: 'px' },
  radialBlur: { label: 'Radial Blur', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
  sharpen: { label: 'Sharpen', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
  unsharpMask: { label: 'Unsharp Mask', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
  highPass: { label: 'High Pass', defaultValue: 0, min: 0, max: 100, step: 1, unit: 'px' },
  levels: { label: 'Levels', defaultValue: 0, min: 0, max: 255, step: 1 },
  curves: { label: 'Curves', defaultValue: 0, min: 0, max: 100, step: 1 },
  exposure: { label: 'Exposure', defaultValue: 0, min: -5, max: 5, step: 0.1, unit: 'EV' },
  vibrance: { label: 'Vibrance', defaultValue: 0, min: -100, max: 100, step: 1, unit: '%' },
  colorBalance: { label: 'Color Balance', defaultValue: 0, min: -100, max: 100, step: 1 },
  channelMixer: { label: 'Channel Mixer', defaultValue: 0, min: -200, max: 200, step: 1, unit: '%' },
  blackAndWhite: { label: 'Black & White', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
  photoFilter: { label: 'Photo Filter', defaultValue: 25, min: 0, max: 100, step: 1, unit: '%' },
  gradientMap: { label: 'Gradient Map', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
  posterize: { label: 'Posterize', defaultValue: 4, min: 2, max: 255, step: 1, unit: 'levels' },
  threshold: { label: 'Threshold', defaultValue: 128, min: 0, max: 255, step: 1 },
  invert: { label: 'Invert', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%' },
  sepia: { label: 'Sepia', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
  vignette: { label: 'Vignette', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
  noise: { label: 'Noise', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
  grain: { label: 'Grain', defaultValue: 0, min: 0, max: 100, step: 1, unit: '%' },
  ai_enhance: { label: 'AI Enhance', defaultValue: 50, min: 0, max: 100, step: 1, unit: '%' },
};

// Filter categories for UI organization
export const filterCategories = [
  {
    id: 'basic',
    name: 'Basic Adjustments',
    filters: ['brightness', 'contrast', 'exposure', 'highlights', 'shadows'] as ExtendedFilterType[],
  },
  {
    id: 'color',
    name: 'Color',
    filters: ['saturation', 'vibrance', 'hue', 'colorBalance', 'channelMixer', 'photoFilter'] as ExtendedFilterType[],
  },
  {
    id: 'tone',
    name: 'Tone',
    filters: ['levels', 'curves', 'blackAndWhite', 'gradientMap'] as ExtendedFilterType[],
  },
  {
    id: 'detail',
    name: 'Detail',
    filters: ['sharpen', 'unsharpMask', 'highPass', 'noise', 'grain'] as ExtendedFilterType[],
  },
  {
    id: 'blur',
    name: 'Blur',
    filters: ['blur', 'gaussianBlur', 'motionBlur', 'radialBlur'] as ExtendedFilterType[],
  },
  {
    id: 'effects',
    name: 'Effects',
    filters: ['vignette', 'sepia', 'posterize', 'threshold', 'invert'] as ExtendedFilterType[],
  },
  {
    id: 'ai',
    name: 'AI',
    filters: ['ai_enhance'] as ExtendedFilterType[],
  },
];

// Convert our filter to Fabric.js filter
export function createFabricFilter(filter: ExtendedPhotoFilter): InstanceType<typeof filters.BaseFilter<string>> | null {
  if (!filter.enabled) return null;

  const value = typeof filter.value === 'number' ? filter.value : 0;

  switch (filter.type) {
    case 'brightness':
      return new filters.Brightness({ brightness: value / 100 });

    case 'contrast':
      return new filters.Contrast({ contrast: value / 100 });

    case 'saturation':
      return new filters.Saturation({ saturation: value / 100 });

    case 'hue':
      return new filters.HueRotation({ rotation: value / 360 });

    case 'blur':
    case 'gaussianBlur':
      return new filters.Blur({ blur: value / 100 });

    case 'sharpen':
      // Fabric doesn't have built-in sharpen, use convolute
      return new filters.Convolute({
        matrix: [
          0, -1 * (value / 100), 0,
          -1 * (value / 100), 1 + 4 * (value / 100), -1 * (value / 100),
          0, -1 * (value / 100), 0,
        ],
      });

    case 'invert':
      return new filters.Invert();

    case 'sepia':
      return new filters.Sepia();

    case 'blackAndWhite':
      return new filters.Grayscale();

    case 'posterize':
      // Custom posterize effect using color matrix
      return new filters.ColorMatrix({
        matrix: [
          1, 0, 0, 0, 0,
          0, 1, 0, 0, 0,
          0, 0, 1, 0, 0,
          0, 0, 0, 1, 0,
        ],
      });

    case 'noise':
      return new filters.Noise({ noise: value * 2.55 });

    case 'vibrance':
      return new filters.Vibrance({ vibrance: value / 100 });

    case 'exposure':
      // Simulate exposure with brightness
      return new filters.Brightness({ brightness: value * 0.2 });

    case 'vignette':
      // Vignette needs custom implementation
      return null;

    default:
      return null;
  }
}

// Build a filter pipeline from multiple filters
export function buildFilterPipeline(filterList: ExtendedPhotoFilter[]): InstanceType<typeof filters.BaseFilter<string>>[] {
  return filterList
    .filter(f => f.enabled)
    .map(createFabricFilter)
    .filter((f): f is InstanceType<typeof filters.BaseFilter<string>> => f !== null);
}

// Create a new filter with default values
export function createFilter(type: ExtendedFilterType): ExtendedPhotoFilter {
  const config = filterConfigs[type];
  return {
    id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    enabled: true,
    value: config?.defaultValue ?? 0,
  };
}

// Preset filter combinations
export const filterPresets = [
  {
    id: 'none',
    name: 'None',
    filters: [],
  },
  {
    id: 'vivid',
    name: 'Vivid',
    filters: [
      { type: 'saturation' as ExtendedFilterType, value: 30 },
      { type: 'contrast' as ExtendedFilterType, value: 15 },
      { type: 'vibrance' as ExtendedFilterType, value: 25 },
    ],
  },
  {
    id: 'warm',
    name: 'Warm',
    filters: [
      { type: 'colorBalance' as ExtendedFilterType, value: 20 },
      { type: 'saturation' as ExtendedFilterType, value: 10 },
    ],
  },
  {
    id: 'cool',
    name: 'Cool',
    filters: [
      { type: 'colorBalance' as ExtendedFilterType, value: -20 },
      { type: 'saturation' as ExtendedFilterType, value: -5 },
    ],
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    filters: [
      { type: 'contrast' as ExtendedFilterType, value: 40 },
      { type: 'brightness' as ExtendedFilterType, value: -10 },
      { type: 'saturation' as ExtendedFilterType, value: -20 },
    ],
  },
  {
    id: 'vintage',
    name: 'Vintage',
    filters: [
      { type: 'sepia' as ExtendedFilterType, value: 30 },
      { type: 'contrast' as ExtendedFilterType, value: -10 },
      { type: 'vignette' as ExtendedFilterType, value: 40 },
    ],
  },
  {
    id: 'bw-high-contrast',
    name: 'B&W High Contrast',
    filters: [
      { type: 'blackAndWhite' as ExtendedFilterType, value: 100 },
      { type: 'contrast' as ExtendedFilterType, value: 30 },
    ],
  },
  {
    id: 'bw-soft',
    name: 'B&W Soft',
    filters: [
      { type: 'blackAndWhite' as ExtendedFilterType, value: 100 },
      { type: 'contrast' as ExtendedFilterType, value: -10 },
      { type: 'brightness' as ExtendedFilterType, value: 5 },
    ],
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    filters: [
      { type: 'contrast' as ExtendedFilterType, value: 20 },
      { type: 'saturation' as ExtendedFilterType, value: -15 },
      { type: 'vignette' as ExtendedFilterType, value: 30 },
    ],
  },
  {
    id: 'hdr',
    name: 'HDR',
    filters: [
      { type: 'sharpen' as ExtendedFilterType, value: 30 },
      { type: 'contrast' as ExtendedFilterType, value: 25 },
      { type: 'vibrance' as ExtendedFilterType, value: 40 },
    ],
  },
];

// Apply preset to a layer
export function applyFilterPreset(presetId: string): ExtendedPhotoFilter[] {
  const preset = filterPresets.find(p => p.id === presetId);
  if (!preset) return [];

  return preset.filters.map(f => ({
    id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: f.type,
    enabled: true,
    value: f.value,
  }));
}
