// ============================================
// useFontLoader - Google Fonts API Integration
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';

// Types
export interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  popularity?: number;
  lastModified?: string;
  files?: Record<string, string>;
}

export interface FontVariant {
  weight: number;
  style: 'normal' | 'italic';
  label: string;
}

export interface FontPairing {
  heading: string;
  body: string;
  description: string;
  tags: string[];
}

interface FontCache {
  fonts: GoogleFont[];
  timestamp: number;
}

// Popular font pairings
const POPULAR_PAIRINGS: FontPairing[] = [
  { heading: 'Playfair Display', body: 'Source Sans Pro', description: 'Elegant and readable', tags: ['elegant', 'classic'] },
  { heading: 'Roboto', body: 'Open Sans', description: 'Clean and modern', tags: ['modern', 'minimal'] },
  { heading: 'Montserrat', body: 'Merriweather', description: 'Bold headers with readable body', tags: ['professional', 'readable'] },
  { heading: 'Oswald', body: 'Lato', description: 'Strong and friendly', tags: ['bold', 'friendly'] },
  { heading: 'Raleway', body: 'Roboto', description: 'Sleek and versatile', tags: ['sleek', 'versatile'] },
  { heading: 'Poppins', body: 'Nunito', description: 'Modern and approachable', tags: ['modern', 'friendly'] },
  { heading: 'Bebas Neue', body: 'Montserrat', description: 'Impact with clarity', tags: ['impact', 'display'] },
  { heading: 'Lora', body: 'Source Sans Pro', description: 'Literary and clean', tags: ['literary', 'editorial'] },
  { heading: 'Ubuntu', body: 'Open Sans', description: 'Tech-friendly duo', tags: ['tech', 'clean'] },
  { heading: 'Work Sans', body: 'Libre Baskerville', description: 'Contemporary contrast', tags: ['contemporary', 'contrast'] },
];

// System fonts (always available)
const SYSTEM_FONTS: GoogleFont[] = [
  { family: 'Arial', variants: ['regular', 'italic', '700', '700italic'], subsets: ['latin'], category: 'sans-serif' },
  { family: 'Helvetica', variants: ['regular', 'italic', '700', '700italic'], subsets: ['latin'], category: 'sans-serif' },
  { family: 'Times New Roman', variants: ['regular', 'italic', '700', '700italic'], subsets: ['latin'], category: 'serif' },
  { family: 'Georgia', variants: ['regular', 'italic', '700', '700italic'], subsets: ['latin'], category: 'serif' },
  { family: 'Courier New', variants: ['regular', 'italic', '700', '700italic'], subsets: ['latin'], category: 'monospace' },
  { family: 'Verdana', variants: ['regular', 'italic', '700', '700italic'], subsets: ['latin'], category: 'sans-serif' },
  { family: 'Trebuchet MS', variants: ['regular', 'italic', '700', '700italic'], subsets: ['latin'], category: 'sans-serif' },
  { family: 'Impact', variants: ['regular'], subsets: ['latin'], category: 'display' },
];

const CACHE_KEY = 'lumina-google-fonts-cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function useFontLoader() {
  const [fonts, setFonts] = useState<GoogleFont[]>(SYSTEM_FONTS);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentFonts, setRecentFonts] = useState<string[]>([]);

  const loadingFontsRef = useRef<Set<string>>(new Set());

  // Load fonts from cache or API
  useEffect(() => {
    const loadFonts = async () => {
      // Check cache first
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { fonts: cachedFonts, timestamp }: FontCache = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setFonts([...SYSTEM_FONTS, ...cachedFonts]);
            return;
          }
        }
      } catch {
        // Cache read failed, continue to fetch
      }

      // Fetch from Google Fonts API
      setIsLoading(true);
      try {
        // Using the Google Fonts Developer API
        const response = await fetch(
          'https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=AIzaSyBwIX97bVWr3-6AIUvGkcNnmFgirefZ6Sw'
        );

        if (!response.ok) {
          // Fallback to popular fonts if API fails
          setFonts([...SYSTEM_FONTS, ...getPopularFallbackFonts()]);
          return;
        }

        const data = await response.json();
        const googleFonts: GoogleFont[] = data.items.slice(0, 500).map((item: any, index: number) => ({
          family: item.family,
          variants: item.variants,
          subsets: item.subsets,
          category: item.category,
          popularity: index + 1,
          lastModified: item.lastModified,
          files: item.files,
        }));

        // Cache the results
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          fonts: googleFonts,
          timestamp: Date.now()
        }));

        setFonts([...SYSTEM_FONTS, ...googleFonts]);
      } catch (err) {
        console.error('Failed to load Google Fonts:', err);
        setError('Failed to load fonts. Using system fonts.');
        setFonts([...SYSTEM_FONTS, ...getPopularFallbackFonts()]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFonts();

    // Load recent fonts from localStorage
    try {
      const recent = localStorage.getItem('lumina-recent-fonts');
      if (recent) {
        setRecentFonts(JSON.parse(recent));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Fallback popular fonts if API fails
  const getPopularFallbackFonts = (): GoogleFont[] => [
    { family: 'Roboto', variants: ['100', '300', 'regular', '500', '700', '900'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Open Sans', variants: ['300', 'regular', '600', '700', '800'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Lato', variants: ['100', '300', 'regular', '700', '900'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Montserrat', variants: ['100', '200', '300', 'regular', '500', '600', '700', '800', '900'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Poppins', variants: ['100', '200', '300', 'regular', '500', '600', '700', '800', '900'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Playfair Display', variants: ['regular', '500', '600', '700', '800', '900'], subsets: ['latin'], category: 'serif' },
    { family: 'Merriweather', variants: ['300', 'regular', '700', '900'], subsets: ['latin'], category: 'serif' },
    { family: 'Source Code Pro', variants: ['200', '300', 'regular', '500', '600', '700', '900'], subsets: ['latin'], category: 'monospace' },
    { family: 'Oswald', variants: ['200', '300', 'regular', '500', '600', '700'], subsets: ['latin'], category: 'sans-serif' },
    { family: 'Raleway', variants: ['100', '200', '300', 'regular', '500', '600', '700', '800', '900'], subsets: ['latin'], category: 'sans-serif' },
  ];

  // Load a specific font
  const loadFont = useCallback(async (fontFamily: string, variants: string[] = ['regular', '700']) => {
    // Check if already loaded or loading
    if (loadedFonts.has(fontFamily) || loadingFontsRef.current.has(fontFamily)) {
      return;
    }

    // System fonts don't need loading
    if (SYSTEM_FONTS.some(f => f.family === fontFamily)) {
      setLoadedFonts(prev => new Set([...prev, fontFamily]));
      return;
    }

    loadingFontsRef.current.add(fontFamily);

    try {
      // Create link element for Google Fonts
      const variantsParam = variants.join(',');
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${variantsParam}&display=swap`;
      link.rel = 'stylesheet';

      await new Promise<void>((resolve, reject) => {
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to load font: ${fontFamily}`));
        document.head.appendChild(link);
      });

      setLoadedFonts(prev => new Set([...prev, fontFamily]));

      // Add to recent fonts
      setRecentFonts(prev => {
        const updated = [fontFamily, ...prev.filter(f => f !== fontFamily)].slice(0, 10);
        localStorage.setItem('lumina-recent-fonts', JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error(`Failed to load font: ${fontFamily}`, err);
    } finally {
      loadingFontsRef.current.delete(fontFamily);
    }
  }, [loadedFonts]);

  // Preload multiple fonts
  const preloadFonts = useCallback(async (fontFamilies: string[]) => {
    await Promise.all(fontFamilies.map(family => loadFont(family)));
  }, [loadFont]);

  // Search fonts
  const searchFonts = useCallback((query: string): GoogleFont[] => {
    if (!query.trim()) {
      return selectedCategory
        ? fonts.filter(f => f.category === selectedCategory)
        : fonts;
    }

    const lowerQuery = query.toLowerCase();
    return fonts.filter(font => {
      const matchesQuery = font.family.toLowerCase().includes(lowerQuery);
      const matchesCategory = !selectedCategory || font.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [fonts, selectedCategory]);

  // Get font variants
  const getFontVariants = useCallback((fontFamily: string): FontVariant[] => {
    const font = fonts.find(f => f.family === fontFamily);
    if (!font) return [];

    return font.variants.map(variant => {
      let weight = 400;
      let style: 'normal' | 'italic' = 'normal';

      if (variant === 'regular') {
        weight = 400;
      } else if (variant === 'italic') {
        weight = 400;
        style = 'italic';
      } else if (variant.endsWith('italic')) {
        weight = parseInt(variant) || 400;
        style = 'italic';
      } else {
        weight = parseInt(variant) || 400;
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
        style,
        label: `${weightNames[weight] || weight}${style === 'italic' ? ' Italic' : ''}`
      };
    });
  }, [fonts]);

  // Get font pairings
  const getFontPairings = useCallback((headingFont?: string): FontPairing[] => {
    if (!headingFont) {
      return POPULAR_PAIRINGS;
    }

    // Find pairings that use this heading font
    const matchingPairings = POPULAR_PAIRINGS.filter(p => p.heading === headingFont);
    if (matchingPairings.length > 0) {
      return matchingPairings;
    }

    // Generate suggestions based on category
    const font = fonts.find(f => f.family === headingFont);
    if (!font) return POPULAR_PAIRINGS.slice(0, 3);

    const suggestions: FontPairing[] = [];

    // Find complementary fonts
    if (font.category === 'serif') {
      const sansSerif = fonts.filter(f => f.category === 'sans-serif').slice(0, 3);
      sansSerif.forEach(f => {
        suggestions.push({
          heading: headingFont,
          body: f.family,
          description: 'Serif heading with sans-serif body',
          tags: ['contrast', 'readable']
        });
      });
    } else if (font.category === 'sans-serif') {
      const serif = fonts.filter(f => f.category === 'serif').slice(0, 3);
      serif.forEach(f => {
        suggestions.push({
          heading: headingFont,
          body: f.family,
          description: 'Sans-serif heading with serif body',
          tags: ['modern', 'elegant']
        });
      });
    }

    return suggestions.length > 0 ? suggestions : POPULAR_PAIRINGS.slice(0, 3);
  }, [fonts]);

  // Filter fonts by category
  const filterByCategory = useCallback((category: string | null) => {
    setSelectedCategory(category);
  }, []);

  // Get fonts by category
  const getFontsByCategory = useCallback((category?: string): GoogleFont[] => {
    if (!category) return fonts;
    return fonts.filter(f => f.category === category);
  }, [fonts]);

  // Check if font is loaded
  const isFontLoaded = useCallback((fontFamily: string): boolean => {
    return loadedFonts.has(fontFamily) || SYSTEM_FONTS.some(f => f.family === fontFamily);
  }, [loadedFonts]);

  // Get popular fonts
  const getPopularFonts = useCallback((limit: number = 20): GoogleFont[] => {
    return fonts
      .filter(f => !SYSTEM_FONTS.some(sf => sf.family === f.family))
      .slice(0, limit);
  }, [fonts]);

  return {
    // State
    fonts,
    loadedFonts: Array.from(loadedFonts),
    recentFonts,
    isLoading,
    error,
    searchQuery,
    selectedCategory,

    // Actions
    loadFont,
    preloadFonts,
    searchFonts,
    setSearchQuery,
    filterByCategory,

    // Getters
    getFontVariants,
    getFontPairings,
    getFontsByCategory,
    getPopularFonts,
    isFontLoaded,

    // Constants
    categories: ['serif', 'sans-serif', 'display', 'handwriting', 'monospace'] as const,
    systemFonts: SYSTEM_FONTS,
    popularPairings: POPULAR_PAIRINGS,
  };
}

export default useFontLoader;
