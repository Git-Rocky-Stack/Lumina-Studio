// ============================================================================
// STOCK PHOTO INTEGRATION - SERVICE
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  StockPhoto,
  StockProvider,
  StockSearchParams,
  StockSearchResult,
  StockSettings,
  DownloadHistoryEntry,
  FavoritePhoto,
  DEFAULT_SETTINGS,
  deduplicatePhotos
} from '../types/stockPhotos';

// ============================================================================
// MOCK DATA - In production, these would be real API calls
// ============================================================================

const MOCK_PHOTOS: StockPhoto[] = [
  {
    id: '1',
    provider: 'unsplash',
    title: 'Mountain Landscape',
    photographer: { name: 'John Doe', url: 'https://unsplash.com/@johndoe' },
    urls: {
      thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200',
      small: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      medium: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080',
      large: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920',
      original: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4'
    },
    dimensions: { width: 1920, height: 1080 },
    color: '#4A90A4',
    tags: ['mountain', 'landscape', 'nature', 'sky'],
    likes: 1250,
    downloads: 5400,
    sourceUrl: 'https://unsplash.com/photos/1',
    downloadUrl: 'https://unsplash.com/photos/1/download'
  },
  {
    id: '2',
    provider: 'unsplash',
    title: 'Ocean Sunset',
    photographer: { name: 'Jane Smith', url: 'https://unsplash.com/@janesmith' },
    urls: {
      thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200',
      small: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
      medium: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080',
      large: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920',
      original: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e'
    },
    dimensions: { width: 1920, height: 1280 },
    color: '#F4A460',
    tags: ['ocean', 'sunset', 'beach', 'tropical'],
    likes: 2300,
    downloads: 8900,
    sourceUrl: 'https://unsplash.com/photos/2',
    downloadUrl: 'https://unsplash.com/photos/2/download'
  },
  {
    id: '3',
    provider: 'pexels',
    title: 'Modern Office',
    photographer: { name: 'Alex Johnson', url: 'https://pexels.com/@alexjohnson' },
    urls: {
      thumbnail: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?w=200',
      small: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?w=400',
      medium: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?w=1080',
      large: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?w=1920',
      original: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'
    },
    dimensions: { width: 1920, height: 1280 },
    color: '#E8E8E8',
    tags: ['office', 'business', 'workspace', 'modern'],
    likes: 890,
    downloads: 3200,
    sourceUrl: 'https://pexels.com/photo/1181406',
    downloadUrl: 'https://pexels.com/photo/1181406/download'
  },
  {
    id: '4',
    provider: 'pexels',
    title: 'Coffee and Laptop',
    photographer: { name: 'Sarah Wilson', url: 'https://pexels.com/@sarahwilson' },
    urls: {
      thumbnail: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?w=200',
      small: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?w=400',
      medium: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?w=1080',
      large: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?w=1920',
      original: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg'
    },
    dimensions: { width: 1280, height: 1920 },
    color: '#8B4513',
    tags: ['coffee', 'laptop', 'work', 'productivity'],
    likes: 1560,
    downloads: 6700,
    sourceUrl: 'https://pexels.com/photo/1181671',
    downloadUrl: 'https://pexels.com/photo/1181671/download'
  },
  {
    id: '5',
    provider: 'pixabay',
    title: 'Abstract Gradient',
    photographer: { name: 'Creative Studio', url: 'https://pixabay.com/users/creativestudio' },
    urls: {
      thumbnail: 'https://cdn.pixabay.com/photo/2020/06/19/22/33/gradient-5319866_960_720.jpg',
      small: 'https://cdn.pixabay.com/photo/2020/06/19/22/33/gradient-5319866_960_720.jpg',
      medium: 'https://cdn.pixabay.com/photo/2020/06/19/22/33/gradient-5319866_1280.jpg',
      large: 'https://cdn.pixabay.com/photo/2020/06/19/22/33/gradient-5319866_1920.jpg',
      original: 'https://cdn.pixabay.com/photo/2020/06/19/22/33/gradient-5319866_1920.jpg'
    },
    dimensions: { width: 1920, height: 1080 },
    color: '#FF6B6B',
    tags: ['abstract', 'gradient', 'colorful', 'background'],
    likes: 670,
    downloads: 2100,
    sourceUrl: 'https://pixabay.com/photos/5319866',
    downloadUrl: 'https://pixabay.com/photos/5319866/download'
  },
  {
    id: '6',
    provider: 'unsplash',
    title: 'City Skyline',
    photographer: { name: 'Mike Chen', url: 'https://unsplash.com/@mikechen' },
    urls: {
      thumbnail: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200',
      small: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400',
      medium: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1080',
      large: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920',
      original: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b'
    },
    dimensions: { width: 1920, height: 1080 },
    color: '#1A1A2E',
    tags: ['city', 'skyline', 'urban', 'night'],
    likes: 3400,
    downloads: 12000,
    sourceUrl: 'https://unsplash.com/photos/6',
    downloadUrl: 'https://unsplash.com/photos/6/download'
  },
  {
    id: '7',
    provider: 'pexels',
    title: 'Fresh Vegetables',
    photographer: { name: 'Food Photographer', url: 'https://pexels.com/@foodphotographer' },
    urls: {
      thumbnail: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=200',
      small: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=400',
      medium: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=1080',
      large: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?w=1920',
      original: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'
    },
    dimensions: { width: 1920, height: 1280 },
    color: '#228B22',
    tags: ['food', 'vegetables', 'healthy', 'fresh'],
    likes: 980,
    downloads: 4500,
    sourceUrl: 'https://pexels.com/photo/1640777',
    downloadUrl: 'https://pexels.com/photo/1640777/download'
  },
  {
    id: '8',
    provider: 'pixabay',
    title: 'Technology Circuit',
    photographer: { name: 'Tech Images', url: 'https://pixabay.com/users/techimages' },
    urls: {
      thumbnail: 'https://cdn.pixabay.com/photo/2016/11/19/14/00/circuit-board-1839594_960_720.jpg',
      small: 'https://cdn.pixabay.com/photo/2016/11/19/14/00/circuit-board-1839594_960_720.jpg',
      medium: 'https://cdn.pixabay.com/photo/2016/11/19/14/00/circuit-board-1839594_1280.jpg',
      large: 'https://cdn.pixabay.com/photo/2016/11/19/14/00/circuit-board-1839594_1920.jpg',
      original: 'https://cdn.pixabay.com/photo/2016/11/19/14/00/circuit-board-1839594_1920.jpg'
    },
    dimensions: { width: 1920, height: 1280 },
    color: '#00FF00',
    tags: ['technology', 'circuit', 'electronics', 'digital'],
    likes: 1200,
    downloads: 5600,
    sourceUrl: 'https://pixabay.com/photos/1839594',
    downloadUrl: 'https://pixabay.com/photos/1839594/download'
  }
];

// ============================================================================
// STOCK PHOTOS MANAGER
// ============================================================================

class StockPhotosManager {
  private settings: StockSettings = DEFAULT_SETTINGS;
  private favorites: FavoritePhoto[] = [];
  private downloadHistory: DownloadHistoryEntry[] = [];
  private searchCache: Map<string, StockSearchResult> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  // --------------------------------------------------------------------------
  // Storage
  // --------------------------------------------------------------------------

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('lumina_stock_photos');
      if (saved) {
        const data = JSON.parse(saved);
        this.settings = { ...DEFAULT_SETTINGS, ...data.settings };
        this.favorites = data.favorites || [];
        this.downloadHistory = data.downloadHistory || [];
      }
    } catch (e) {
      console.error('Failed to load stock photos data:', e);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        settings: this.settings,
        favorites: this.favorites,
        downloadHistory: this.downloadHistory.slice(0, this.settings.maxHistoryItems)
      };
      localStorage.setItem('lumina_stock_photos', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save stock photos data:', e);
    }
  }

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------

  async search(params: StockSearchParams): Promise<StockSearchResult> {
    const cacheKey = JSON.stringify(params);

    // Check cache
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey)!;
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Filter mock photos based on search params
    let filteredPhotos = [...MOCK_PHOTOS];

    // Filter by query
    if (params.query) {
      const query = params.query.toLowerCase();
      filteredPhotos = filteredPhotos.filter(photo =>
        photo.title.toLowerCase().includes(query) ||
        photo.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by provider
    if (params.provider && params.provider !== 'all') {
      filteredPhotos = filteredPhotos.filter(photo => photo.provider === params.provider);
    }

    // Filter by orientation
    if (params.orientation && params.orientation !== 'all') {
      filteredPhotos = filteredPhotos.filter(photo => {
        const { width, height } = photo.dimensions;
        switch (params.orientation) {
          case 'landscape': return width > height;
          case 'portrait': return height > width;
          case 'square': return Math.abs(width - height) / width < 0.1;
          default: return true;
        }
      });
    }

    // Sort
    if (params.orderBy === 'popular') {
      filteredPhotos.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else if (params.orderBy === 'latest') {
      // Shuffle to simulate latest
      filteredPhotos.sort(() => Math.random() - 0.5);
    }

    // Pagination
    const page = params.page || 1;
    const perPage = params.perPage || 20;
    const start = (page - 1) * perPage;
    const paginatedPhotos = filteredPhotos.slice(start, start + perPage);

    const result: StockSearchResult = {
      photos: paginatedPhotos,
      totalResults: filteredPhotos.length,
      totalPages: Math.ceil(filteredPhotos.length / perPage),
      currentPage: page,
      hasMore: start + perPage < filteredPhotos.length,
      provider: params.provider || 'all'
    };

    // Cache result
    this.searchCache.set(cacheKey, result);

    return result;
  }

  async getTrending(): Promise<StockPhoto[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...MOCK_PHOTOS].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 6);
  }

  async getByCategory(category: string): Promise<StockPhoto[]> {
    const result = await this.search({ query: category, perPage: 12 });
    return result.photos;
  }

  // --------------------------------------------------------------------------
  // Favorites
  // --------------------------------------------------------------------------

  addToFavorites(photo: StockPhoto, tags: string[] = []): void {
    if (this.isFavorite(photo.id, photo.provider)) return;

    this.favorites.unshift({
      photo,
      addedAt: Date.now(),
      tags
    });

    this.saveToStorage();
    this.notifyListeners();
  }

  removeFromFavorites(photoId: string, provider: StockProvider): void {
    this.favorites = this.favorites.filter(
      f => !(f.photo.id === photoId && f.photo.provider === provider)
    );
    this.saveToStorage();
    this.notifyListeners();
  }

  isFavorite(photoId: string, provider: StockProvider): boolean {
    return this.favorites.some(
      f => f.photo.id === photoId && f.photo.provider === provider
    );
  }

  getFavorites(): FavoritePhoto[] {
    return [...this.favorites];
  }

  // --------------------------------------------------------------------------
  // Download
  // --------------------------------------------------------------------------

  async downloadPhoto(photo: StockPhoto, size: 'small' | 'medium' | 'large' | 'original' = 'large'): Promise<string> {
    const url = photo.urls[size];

    // Add to history
    this.downloadHistory.unshift({
      id: `${photo.provider}_${photo.id}_${Date.now()}`,
      photo,
      downloadedAt: Date.now()
    });

    // Limit history size
    this.downloadHistory = this.downloadHistory.slice(0, this.settings.maxHistoryItems);

    this.saveToStorage();
    this.notifyListeners();

    // Return the URL for insertion
    return url;
  }

  getDownloadHistory(): DownloadHistoryEntry[] {
    return [...this.downloadHistory];
  }

  clearDownloadHistory(): void {
    this.downloadHistory = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  // --------------------------------------------------------------------------
  // Settings
  // --------------------------------------------------------------------------

  getSettings(): StockSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<StockSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveToStorage();
    this.notifyListeners();
  }

  // --------------------------------------------------------------------------
  // Event System
  // --------------------------------------------------------------------------

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  // --------------------------------------------------------------------------
  // Cache Management
  // --------------------------------------------------------------------------

  clearCache(): void {
    this.searchCache.clear();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const stockPhotosManager = new StockPhotosManager();

// ============================================================================
// REACT HOOK
// ============================================================================

export function useStockPhotos() {
  const [searchResults, setSearchResults] = useState<StockSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<FavoritePhoto[]>([]);
  const [history, setHistory] = useState<DownloadHistoryEntry[]>([]);
  const [settings, setSettings] = useState<StockSettings>(stockPhotosManager.getSettings());
  const [trending, setTrending] = useState<StockPhoto[]>([]);

  useEffect(() => {
    const update = () => {
      setFavorites(stockPhotosManager.getFavorites());
      setHistory(stockPhotosManager.getDownloadHistory());
      setSettings(stockPhotosManager.getSettings());
    };

    update();

    // Load trending
    stockPhotosManager.getTrending().then(setTrending);

    return stockPhotosManager.subscribe(update);
  }, []);

  const search = useCallback(async (params: StockSearchParams) => {
    setIsLoading(true);
    try {
      const result = await stockPhotosManager.search(params);
      setSearchResults(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async (params: StockSearchParams) => {
    if (!searchResults || !searchResults.hasMore) return;

    setIsLoading(true);
    try {
      const result = await stockPhotosManager.search({
        ...params,
        page: searchResults.currentPage + 1
      });

      setSearchResults({
        ...result,
        photos: deduplicatePhotos([...searchResults.photos, ...result.photos])
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchResults]);

  const downloadPhoto = useCallback(async (
    photo: StockPhoto,
    size?: 'small' | 'medium' | 'large' | 'original'
  ) => {
    return stockPhotosManager.downloadPhoto(photo, size || settings.autoDownloadSize);
  }, [settings]);

  const toggleFavorite = useCallback((photo: StockPhoto) => {
    if (stockPhotosManager.isFavorite(photo.id, photo.provider)) {
      stockPhotosManager.removeFromFavorites(photo.id, photo.provider);
    } else {
      stockPhotosManager.addToFavorites(photo);
    }
  }, []);

  const isFavorite = useCallback((photo: StockPhoto) => {
    return stockPhotosManager.isFavorite(photo.id, photo.provider);
  }, []);

  const updateSettings = useCallback((updates: Partial<StockSettings>) => {
    stockPhotosManager.updateSettings(updates);
  }, []);

  return {
    searchResults,
    isLoading,
    favorites,
    history,
    settings,
    trending,
    search,
    loadMore,
    downloadPhoto,
    toggleFavorite,
    isFavorite,
    updateSettings,
    clearHistory: () => stockPhotosManager.clearDownloadHistory()
  };
}
