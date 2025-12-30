// ============================================================================
// STOCK PHOTO INTEGRATION - TYPE DEFINITIONS
// ============================================================================

/**
 * Stock photo provider
 */
export type StockProvider = 'unsplash' | 'pexels' | 'pixabay' | 'all';

/**
 * Image orientation
 */
export type ImageOrientation = 'all' | 'landscape' | 'portrait' | 'square';

/**
 * Image color filter
 */
export type ImageColor =
  | 'all'
  | 'black_and_white'
  | 'black'
  | 'white'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'purple'
  | 'magenta'
  | 'green'
  | 'teal'
  | 'blue';

/**
 * Stock photo
 */
export interface StockPhoto {
  id: string;
  provider: StockProvider;
  title: string;
  description?: string;
  photographer: {
    name: string;
    url: string;
    avatar?: string;
  };
  urls: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  };
  dimensions: {
    width: number;
    height: number;
  };
  color?: string;
  tags: string[];
  likes?: number;
  downloads?: number;
  sourceUrl: string;
  downloadUrl: string;
}

/**
 * Search parameters
 */
export interface StockSearchParams {
  query: string;
  provider?: StockProvider;
  orientation?: ImageOrientation;
  color?: ImageColor;
  page?: number;
  perPage?: number;
  orderBy?: 'relevant' | 'latest' | 'popular';
  safeSearch?: boolean;
}

/**
 * Search result
 */
export interface StockSearchResult {
  photos: StockPhoto[];
  totalResults: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
  provider: StockProvider;
}

/**
 * Collection/Category
 */
export interface StockCollection {
  id: string;
  title: string;
  description?: string;
  coverPhoto?: string;
  photoCount: number;
  provider: StockProvider;
}

/**
 * Curated category
 */
export interface CuratedCategory {
  id: string;
  name: string;
  icon: string;
  searchQuery: string;
  color: string;
}

/**
 * Download history entry
 */
export interface DownloadHistoryEntry {
  id: string;
  photo: StockPhoto;
  downloadedAt: number;
  usedIn?: string[];
}

/**
 * Favorite photo
 */
export interface FavoritePhoto {
  photo: StockPhoto;
  addedAt: number;
  tags: string[];
}

/**
 * Stock settings
 */
export interface StockSettings {
  defaultProvider: StockProvider;
  defaultOrientation: ImageOrientation;
  safeSearch: boolean;
  autoDownloadSize: 'small' | 'medium' | 'large' | 'original';
  showAttribution: boolean;
  maxHistoryItems: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_SETTINGS: StockSettings = {
  defaultProvider: 'all',
  defaultOrientation: 'all',
  safeSearch: true,
  autoDownloadSize: 'large',
  showAttribution: true,
  maxHistoryItems: 100
};

export const PROVIDER_INFO: Record<Exclude<StockProvider, 'all'>, {
  name: string;
  icon: string;
  color: string;
  description: string;
  attribution: string;
}> = {
  unsplash: {
    name: 'Unsplash',
    icon: 'fa-camera',
    color: '#000000',
    description: 'Beautiful, free photos',
    attribution: 'Photo by {photographer} on Unsplash'
  },
  pexels: {
    name: 'Pexels',
    icon: 'fa-image',
    color: '#05A081',
    description: 'Free stock photos & videos',
    attribution: 'Photo by {photographer} from Pexels'
  },
  pixabay: {
    name: 'Pixabay',
    icon: 'fa-images',
    color: '#00AB6C',
    description: 'Stunning royalty-free images',
    attribution: 'Photo by {photographer} from Pixabay'
  }
};

export const COLOR_OPTIONS: { value: ImageColor; label: string; hex?: string }[] = [
  { value: 'all', label: 'All Colors' },
  { value: 'black_and_white', label: 'Black & White' },
  { value: 'black', label: 'Black', hex: '#000000' },
  { value: 'white', label: 'White', hex: '#FFFFFF' },
  { value: 'yellow', label: 'Yellow', hex: '#FFEB3B' },
  { value: 'orange', label: 'Orange', hex: '#FF9800' },
  { value: 'red', label: 'Red', hex: '#F44336' },
  { value: 'purple', label: 'Purple', hex: '#9C27B0' },
  { value: 'magenta', label: 'Magenta', hex: '#E91E63' },
  { value: 'green', label: 'Green', hex: '#4CAF50' },
  { value: 'teal', label: 'Teal', hex: '#009688' },
  { value: 'blue', label: 'Blue', hex: '#2196F3' }
];

export const CURATED_CATEGORIES: CuratedCategory[] = [
  { id: 'nature', name: 'Nature', icon: 'fa-leaf', searchQuery: 'nature landscape', color: '#22c55e' },
  { id: 'business', name: 'Business', icon: 'fa-briefcase', searchQuery: 'business office', color: '#3b82f6' },
  { id: 'technology', name: 'Technology', icon: 'fa-microchip', searchQuery: 'technology digital', color: '#8b5cf6' },
  { id: 'people', name: 'People', icon: 'fa-users', searchQuery: 'people portrait', color: '#f59e0b' },
  { id: 'food', name: 'Food', icon: 'fa-utensils', searchQuery: 'food cooking', color: '#ef4444' },
  { id: 'travel', name: 'Travel', icon: 'fa-plane', searchQuery: 'travel adventure', color: '#06b6d4' },
  { id: 'architecture', name: 'Architecture', icon: 'fa-building', searchQuery: 'architecture building', color: '#64748b' },
  { id: 'abstract', name: 'Abstract', icon: 'fa-shapes', searchQuery: 'abstract art', color: '#ec4899' },
  { id: 'animals', name: 'Animals', icon: 'fa-paw', searchQuery: 'animals wildlife', color: '#f97316' },
  { id: 'fitness', name: 'Fitness', icon: 'fa-dumbbell', searchQuery: 'fitness health', color: '#14b8a6' },
  { id: 'fashion', name: 'Fashion', icon: 'fa-shirt', searchQuery: 'fashion style', color: '#a855f7' },
  { id: 'music', name: 'Music', icon: 'fa-music', searchQuery: 'music concert', color: '#6366f1' }
];

export const TRENDING_SEARCHES = [
  'minimal background',
  'gradient abstract',
  'modern office',
  'nature landscape',
  'technology',
  'workspace desk',
  'city night',
  'texture pattern'
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate attribution text
 */
export function generateAttribution(photo: StockPhoto): string {
  const template = PROVIDER_INFO[photo.provider as Exclude<StockProvider, 'all'>]?.attribution;
  return template?.replace('{photographer}', photo.photographer.name) || '';
}

/**
 * Get optimal image URL for size
 */
export function getOptimalUrl(photo: StockPhoto, maxWidth: number): string {
  if (maxWidth <= 200) return photo.urls.thumbnail;
  if (maxWidth <= 400) return photo.urls.small;
  if (maxWidth <= 1080) return photo.urls.medium;
  if (maxWidth <= 1920) return photo.urls.large;
  return photo.urls.original;
}

/**
 * Format number with K/M suffix
 */
export function formatCount(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Calculate aspect ratio
 */
export function getAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

/**
 * Check if image is landscape
 */
export function isLandscape(width: number, height: number): boolean {
  return width > height;
}

/**
 * Check if image is portrait
 */
export function isPortrait(width: number, height: number): boolean {
  return height > width;
}

/**
 * Check if image is square-ish
 */
export function isSquare(width: number, height: number): boolean {
  const ratio = width / height;
  return ratio >= 0.9 && ratio <= 1.1;
}

/**
 * Filter by orientation
 */
export function filterByOrientation(photos: StockPhoto[], orientation: ImageOrientation): StockPhoto[] {
  if (orientation === 'all') return photos;

  return photos.filter(photo => {
    const { width, height } = photo.dimensions;
    switch (orientation) {
      case 'landscape': return isLandscape(width, height);
      case 'portrait': return isPortrait(width, height);
      case 'square': return isSquare(width, height);
      default: return true;
    }
  });
}

/**
 * Deduplicate photos by ID
 */
export function deduplicatePhotos(photos: StockPhoto[]): StockPhoto[] {
  const seen = new Set<string>();
  return photos.filter(photo => {
    const key = `${photo.provider}_${photo.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Download image as blob
 */
export async function downloadImage(url: string): Promise<Blob> {
  const response = await fetch(url);
  return response.blob();
}

/**
 * Create object URL from blob
 */
export function createObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke object URL
 */
export function revokeObjectUrl(url: string): void {
  URL.revokeObjectURL(url);
}
