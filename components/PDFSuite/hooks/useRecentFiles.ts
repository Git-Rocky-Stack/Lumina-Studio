// ============================================
// useRecentFiles Hook
// Manages recent files using localStorage
// ============================================

import { useState, useCallback, useEffect } from 'react';

export interface RecentFile {
  id: string;
  name: string;
  size: number;
  lastOpened: number;
  pageCount?: number;
  thumbnail?: string;
}

const STORAGE_KEY = 'lumina-pdf-recent-files';
const MAX_RECENT_FILES = 10;

export function useRecentFiles() {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  // Load recent files from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentFile[];
        // Sort by most recently opened
        parsed.sort((a, b) => b.lastOpened - a.lastOpened);
        setRecentFiles(parsed);
      }
    } catch (error) {
      console.error('Failed to load recent files:', error);
    }
  }, []);

  // Save to localStorage
  const saveToStorage = useCallback((files: RecentFile[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch (error) {
      console.error('Failed to save recent files:', error);
    }
  }, []);

  // Add a file to recent files
  const addRecentFile = useCallback((file: {
    name: string;
    size: number;
    pageCount?: number;
    thumbnail?: string;
  }) => {
    setRecentFiles((prev) => {
      // Generate ID from name and size
      const id = `${file.name}-${file.size}`;

      // Remove existing entry if present
      const filtered = prev.filter((f) => f.id !== id);

      // Create new entry
      const newEntry: RecentFile = {
        id,
        name: file.name,
        size: file.size,
        lastOpened: Date.now(),
        pageCount: file.pageCount,
        thumbnail: file.thumbnail,
      };

      // Add to beginning and limit to max
      const updated = [newEntry, ...filtered].slice(0, MAX_RECENT_FILES);

      // Save to localStorage
      saveToStorage(updated);

      return updated;
    });
  }, [saveToStorage]);

  // Update thumbnail for a file
  const updateThumbnail = useCallback((id: string, thumbnail: string) => {
    setRecentFiles((prev) => {
      const updated = prev.map((f) =>
        f.id === id ? { ...f, thumbnail } : f
      );
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // Update page count for a file
  const updatePageCount = useCallback((id: string, pageCount: number) => {
    setRecentFiles((prev) => {
      const updated = prev.map((f) =>
        f.id === id ? { ...f, pageCount } : f
      );
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // Remove a file from recent files
  const removeRecentFile = useCallback((id: string) => {
    setRecentFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // Clear all recent files
  const clearRecentFiles = useCallback(() => {
    setRecentFiles([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recent files:', error);
    }
  }, []);

  // Format file size for display
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  // Format date for display
  const formatDate = useCallback((timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes < 1) return 'Just now';
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }, []);

  return {
    recentFiles,
    addRecentFile,
    updateThumbnail,
    updatePageCount,
    removeRecentFile,
    clearRecentFiles,
    formatFileSize,
    formatDate,
  };
}

export default useRecentFiles;
