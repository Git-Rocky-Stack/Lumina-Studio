// ============================================
// LUMINA FONT SERVICE
// Google Fonts Integration & Typography Utilities
// ============================================

// Types
export interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  version?: string;
  lastModified?: string;
  files?: Record<string, string>;
}

export interface FontVariant {
  weight: number;
  style: 'normal' | 'italic';
  label: string;
  cssValue: string;
}

export interface FontPairing {
  heading: string;
  body: string;
  description: string;
  tags: string[];
  ratio?: number; // Size ratio between heading and body
}

export interface FontMetrics {
  ascender: number;
  descender: number;
  lineGap: number;
  unitsPerEm: number;
  xHeight: number;
  capHeight: number;
}

// Cache
const fontCache = new Map<string, GoogleFont[]>();
const loadedFonts = new Set<string>();

// ============================================
// GOOGLE FONTS API
// ============================================

const GOOGLE_FONTS_API_KEY = 'AIzaSyBwIX97bVWr3-6AIUvGkcNnmFgirefZ6Sw';
const GOOGLE_FONTS_API_URL = 'https://www.googleapis.com/webfonts/v1/webfonts';

export async function fetchGoogleFonts(
  options: {
    sort?: 'alpha' | 'date' | 'popularity' | 'style' | 'trending';
    category?: string;
  } = {}
): Promise<GoogleFont[]> {
  const cacheKey = `${options.sort || 'popularity'}-${options.category || 'all'}`;

  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey)!;
  }

  try {
    const params = new URLSearchParams({
      key: GOOGLE_FONTS_API_KEY,
      sort: options.sort || 'popularity'
    });

    const response = await fetch(`${GOOGLE_FONTS_API_URL}?${params}`);

    if (!response.ok) {
      throw new Error('Failed to fetch Google Fonts');
    }

    const data = await response.json();
    let fonts: GoogleFont[] = data.items.map((item: any) => ({
      family: item.family,
      variants: item.variants,
      subsets: item.subsets,
      category: item.category,
      version: item.version,
      lastModified: item.lastModified,
      files: item.files
    }));

    if (options.category) {
      fonts = fonts.filter(f => f.category === options.category);
    }

    fontCache.set(cacheKey, fonts);
    return fonts;
  } catch (error) {
    console.error('Error fetching Google Fonts:', error);
    return getFallbackFonts();
  }
}

// Fallback fonts if API fails
function getFallbackFonts(): GoogleFont[] {
  return [
    { family: 'Roboto', variants: ['100', '300', 'regular', '500', '700', '900', 'italic'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Open Sans', variants: ['300', 'regular', '600', '700', '800'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Lato', variants: ['100', '300', 'regular', '700', '900'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Montserrat', variants: ['100', '200', '300', 'regular', '500', '600', '700', '800', '900'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Poppins', variants: ['100', '200', '300', 'regular', '500', '600', '700', '800', '900'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Playfair Display', variants: ['regular', '500', '600', '700', '800', '900', 'italic'], subsets: ['latin'], category: 'serif' },
    { family: 'Merriweather', variants: ['300', 'regular', '700', '900', 'italic'], subsets: ['latin'], category: 'serif' },
    { family: 'Source Code Pro', variants: ['200', '300', 'regular', '500', '600', '700', '900'], subsets: ['latin'], category: 'monospace' },
    { family: 'Oswald', variants: ['200', '300', 'regular', '500', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Raleway', variants: ['100', '200', '300', 'regular', '500', '600', '700', '800', '900'], subsets: ['latin'], category: 'sans-serif' },
  ];
}

// ============================================
// FONT LOADING
// ============================================

export async function loadFont(
  fontFamily: string,
  variants: string[] = ['400', '700']
): Promise<void> {
  if (loadedFonts.has(fontFamily)) {
    return;
  }

  // Format variants for Google Fonts URL
  const weights = variants
    .map(v => v.replace('regular', '400').replace('italic', '400i'))
    .join(';');

  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${weights}&display=swap`;

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.href = url;
    link.rel = 'stylesheet';

    link.onload = () => {
      loadedFonts.add(fontFamily);
      resolve();
    };

    link.onerror = () => {
      reject(new Error(`Failed to load font: ${fontFamily}`));
    };

    document.head.appendChild(link);
  });
}

export async function loadFonts(fontFamilies: string[]): Promise<void> {
  await Promise.all(fontFamilies.map(family => loadFont(family)));
}

export function isFontLoaded(fontFamily: string): boolean {
  return loadedFonts.has(fontFamily);
}

// ============================================
// FONT VARIANTS
// ============================================

export function parseVariant(variant: string): FontVariant {
  const isItalic = variant.includes('italic');
  let weight = 400;

  if (variant === 'regular' || variant === 'italic') {
    weight = 400;
  } else {
    const numMatch = variant.match(/\d+/);
    if (numMatch) {
      weight = parseInt(numMatch[0]);
    }
  }

  const weightNames: Record<number, string> = {
    100: 'Thin',
    200: 'Extra Light',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'Semi Bold',
    700: 'Bold',
    800: 'Extra Bold',
    900: 'Black'
  };

  return {
    weight,
    style: isItalic ? 'italic' : 'normal',
    label: `${weightNames[weight] || weight}${isItalic ? ' Italic' : ''}`,
    cssValue: `${isItalic ? 'italic ' : ''}${weight}`
  };
}

export function getFontVariants(font: GoogleFont): FontVariant[] {
  return font.variants.map(parseVariant);
}

// ============================================
// FONT PAIRINGS
// ============================================

const POPULAR_PAIRINGS: FontPairing[] = [
  { heading: 'Playfair Display', body: 'Source Sans Pro', description: 'Elegant and readable', tags: ['elegant', 'classic'], ratio: 1.5 },
  { heading: 'Roboto', body: 'Open Sans', description: 'Clean and modern', tags: ['modern', 'minimal'], ratio: 1.3 },
  { heading: 'Montserrat', body: 'Merriweather', description: 'Bold headers with readable body', tags: ['professional', 'readable'], ratio: 1.4 },
  { heading: 'Oswald', body: 'Lato', description: 'Strong and friendly', tags: ['bold', 'friendly'], ratio: 1.5 },
  { heading: 'Raleway', body: 'Roboto', description: 'Sleek and versatile', tags: ['sleek', 'versatile'], ratio: 1.3 },
  { heading: 'Poppins', body: 'Nunito', description: 'Modern and approachable', tags: ['modern', 'friendly'], ratio: 1.3 },
  { heading: 'Bebas Neue', body: 'Montserrat', description: 'Impact with clarity', tags: ['impact', 'display'], ratio: 1.6 },
  { heading: 'Lora', body: 'Source Sans Pro', description: 'Literary and clean', tags: ['literary', 'editorial'], ratio: 1.4 },
  { heading: 'Ubuntu', body: 'Open Sans', description: 'Tech-friendly duo', tags: ['tech', 'clean'], ratio: 1.3 },
  { heading: 'Work Sans', body: 'Libre Baskerville', description: 'Contemporary contrast', tags: ['contemporary', 'contrast'], ratio: 1.4 },
  { heading: 'Archivo Black', body: 'Roboto', description: 'Bold impact', tags: ['bold', 'impact'], ratio: 1.5 },
  { heading: 'DM Serif Display', body: 'DM Sans', description: 'Harmonious contrast', tags: ['elegant', 'harmonious'], ratio: 1.4 },
];

export function getFontPairings(headingFont?: string): FontPairing[] {
  if (!headingFont) {
    return POPULAR_PAIRINGS;
  }

  // Find pairings that use this heading font
  const matchingPairings = POPULAR_PAIRINGS.filter(p => p.heading === headingFont);

  if (matchingPairings.length > 0) {
    return matchingPairings;
  }

  // Generate suggestions based on category
  return generatePairingSuggestions(headingFont);
}

function generatePairingSuggestions(headingFont: string): FontPairing[] {
  // Simple category-based suggestions
  const suggestions: FontPairing[] = [];

  // These would be enhanced with actual font data
  const sansSerif = ['Roboto', 'Open Sans', 'Lato', 'Source Sans Pro'];
  const serif = ['Merriweather', 'Lora', 'Libre Baskerville', 'PT Serif'];

  sansSerif.forEach(body => {
    suggestions.push({
      heading: headingFont,
      body,
      description: `${headingFont} paired with ${body}`,
      tags: ['suggested'],
      ratio: 1.4
    });
  });

  return suggestions.slice(0, 3);
}

export async function suggestPairings(primaryFont: string): Promise<FontPairing[]> {
  // Could be enhanced with AI-based suggestions
  const pairings = getFontPairings(primaryFont);

  // Preload the fonts
  const fontsToLoad = new Set<string>();
  pairings.forEach(p => {
    fontsToLoad.add(p.heading);
    fontsToLoad.add(p.body);
  });

  await loadFonts(Array.from(fontsToLoad));

  return pairings;
}

// ============================================
// FONT SEARCH
// ============================================

export async function searchFonts(
  query: string,
  options: {
    category?: string;
    limit?: number;
  } = {}
): Promise<GoogleFont[]> {
  const fonts = await fetchGoogleFonts({ category: options.category });

  if (!query.trim()) {
    return fonts.slice(0, options.limit || 50);
  }

  const lowerQuery = query.toLowerCase();
  const filtered = fonts.filter(font =>
    font.family.toLowerCase().includes(lowerQuery)
  );

  return filtered.slice(0, options.limit || 50);
}

// ============================================
// FONT CATEGORIES
// ============================================

export const FONT_CATEGORIES = [
  { id: 'serif', label: 'Serif', description: 'Traditional fonts with decorative strokes' },
  { id: 'sans-serif', label: 'Sans Serif', description: 'Clean, modern fonts without strokes' },
  { id: 'display', label: 'Display', description: 'Decorative fonts for headlines' },
  { id: 'handwriting', label: 'Handwriting', description: 'Script and handwritten styles' },
  { id: 'monospace', label: 'Monospace', description: 'Fixed-width fonts for code' },
] as const;

export async function getFontsByCategory(
  category: typeof FONT_CATEGORIES[number]['id']
): Promise<GoogleFont[]> {
  const fonts = await fetchGoogleFonts({ category });
  return fonts;
}

// ============================================
// TYPOGRAPHY UTILITIES
// ============================================

export function calculateTypeScale(
  baseSize: number,
  ratio: number = 1.25,
  steps: number = 6
): number[] {
  const scale: number[] = [];

  for (let i = -2; i <= steps - 3; i++) {
    scale.push(Math.round(baseSize * Math.pow(ratio, i)));
  }

  return scale;
}

export const TYPE_SCALE_RATIOS = {
  'minor-second': 1.067,
  'major-second': 1.125,
  'minor-third': 1.2,
  'major-third': 1.25,
  'perfect-fourth': 1.333,
  'augmented-fourth': 1.414,
  'perfect-fifth': 1.5,
  'golden-ratio': 1.618,
} as const;

export function getFontCSS(
  fontFamily: string,
  weight: number = 400,
  style: 'normal' | 'italic' = 'normal'
): string {
  return `font-family: '${fontFamily}', sans-serif; font-weight: ${weight}; font-style: ${style};`;
}

export function getFontImportURL(fonts: { family: string; weights?: number[] }[]): string {
  const families = fonts.map(f => {
    const weights = f.weights?.join(';') || '400;700';
    return `family=${encodeURIComponent(f.family)}:wght@${weights}`;
  }).join('&');

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// ============================================
// PRELOAD POPULAR FONTS
// ============================================

export async function preloadPopularFonts(): Promise<void> {
  const popularFonts = [
    'Roboto',
    'Open Sans',
    'Montserrat',
    'Lato',
    'Poppins',
  ];

  await loadFonts(popularFonts);
}

export default {
  fetchGoogleFonts,
  loadFont,
  loadFonts,
  isFontLoaded,
  getFontVariants,
  getFontPairings,
  suggestPairings,
  searchFonts,
  getFontsByCategory,
  calculateTypeScale,
  getFontCSS,
  getFontImportURL,
  preloadPopularFonts,
  FONT_CATEGORIES,
  TYPE_SCALE_RATIOS,
};
