import { useState, useCallback, useEffect, useRef } from 'react';
import type { Canvas } from 'fabric';
import type { HistorySnapshot, PhotoLayerExtended, HistoryState } from '../types';

interface UsePhotoHistoryOptions {
  canvas: Canvas | null;
  layers: PhotoLayerExtended[];
  maxSnapshots?: number;
  onRestore?: (snapshot: HistorySnapshot) => void;
}

interface UsePhotoHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  currentIndex: number;
  historyStack: HistorySnapshot[];
  // Actions
  undo: () => void;
  redo: () => void;
  pushState: (description: string) => void;
  createCheckpoint: (name: string) => void;
  restoreToCheckpoint: (checkpointId: string) => void;
  clearHistory: () => void;
  // For visual history panel
  getSnapshot: (index: number) => HistorySnapshot | null;
  jumpToSnapshot: (snapshotId: string) => void;
  getHistoryState: () => HistoryState;
}

const MAX_HISTORY_SIZE = 50;
const HISTORY_STORAGE_KEY = 'lumina_photo_history';

export function usePhotoHistory(options: UsePhotoHistoryOptions): UsePhotoHistoryReturn {
  const {
    canvas,
    layers,
    maxSnapshots = MAX_HISTORY_SIZE,
    onRestore,
  } = options;

  const [historyStack, setHistoryStack] = useState<HistorySnapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isRestoringRef = useRef(false);
  const lastLayerStateRef = useRef<string>('');

  // Serialize current state
  const serializeState = useCallback((): { canvasState: string; layerStates: PhotoLayerExtended[] } => {
    // Fabric.js v6 toJSON doesn't take arguments
    const canvasState = canvas ? JSON.stringify(canvas.toJSON()) : '{}';
    const layerStates = layers.map(layer => ({ ...layer }));
    return { canvasState, layerStates };
  }, [canvas, layers]);

  // Generate thumbnail
  const generateThumbnail = useCallback(async (): Promise<string | undefined> => {
    if (!canvas) return undefined;

    try {
      // Create a smaller version for thumbnail
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 0.5,
        multiplier: 0.1, // 10% of original size
      });
      return dataUrl;
    } catch {
      return undefined;
    }
  }, [canvas]);

  // Push new state to history
  const pushState = useCallback(async (description: string) => {
    if (isRestoringRef.current) return;

    const { canvasState, layerStates } = serializeState();

    // Check if state actually changed
    const stateHash = JSON.stringify({ layers: layerStates.map(l => ({ id: l.id, content: l.content?.slice(0, 50) })) });
    if (stateHash === lastLayerStateRef.current) {
      return; // No changes, don't add to history
    }
    lastLayerStateRef.current = stateHash;

    const thumbnail = await generateThumbnail();

    const snapshot: HistorySnapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      description,
      thumbnail,
      canvasState,
      layerStates,
      selectedLayerIds: [],
    };

    setHistoryStack(prev => {
      // Remove any redo states (everything after current index)
      const newStack = prev.slice(0, currentIndex + 1);

      // Add new snapshot
      newStack.push(snapshot);

      // Trim if exceeds max size
      if (newStack.length > maxSnapshots) {
        return newStack.slice(newStack.length - maxSnapshots);
      }

      return newStack;
    });

    setCurrentIndex(prev => Math.min(prev + 1, maxSnapshots - 1));
  }, [serializeState, generateThumbnail, currentIndex, maxSnapshots]);

  // Restore a snapshot
  const restoreSnapshot = useCallback((snapshot: HistorySnapshot) => {
    isRestoringRef.current = true;

    try {
      // Restore canvas state
      if (canvas && snapshot.canvasState) {
        canvas.loadFromJSON(JSON.parse(snapshot.canvasState)).then(() => {
          canvas.renderAll();
        });
      }

      // Notify parent to restore layer states
      onRestore?.(snapshot);
    } finally {
      // Allow new state changes after a tick
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 100);
    }
  }, [canvas, onRestore]);

  // Undo
  const undo = useCallback(() => {
    if (currentIndex <= 0) return;

    const newIndex = currentIndex - 1;
    const snapshot = historyStack[newIndex];

    if (snapshot) {
      setCurrentIndex(newIndex);
      restoreSnapshot(snapshot);
    }
  }, [currentIndex, historyStack, restoreSnapshot]);

  // Redo
  const redo = useCallback(() => {
    if (currentIndex >= historyStack.length - 1) return;

    const newIndex = currentIndex + 1;
    const snapshot = historyStack[newIndex];

    if (snapshot) {
      setCurrentIndex(newIndex);
      restoreSnapshot(snapshot);
    }
  }, [currentIndex, historyStack, restoreSnapshot]);

  // Create named checkpoint
  const createCheckpoint = useCallback(async (name: string) => {
    const { canvasState, layerStates } = serializeState();
    const thumbnail = await generateThumbnail();

    const checkpoint: HistorySnapshot = {
      id: `checkpoint-${Date.now()}`,
      timestamp: Date.now(),
      description: name,
      thumbnail,
      canvasState,
      layerStates,
      selectedLayerIds: [],
      isCheckpoint: true,
      checkpointName: name,
    };

    setHistoryStack(prev => [...prev.slice(0, currentIndex + 1), checkpoint]);
    setCurrentIndex(prev => prev + 1);
  }, [serializeState, generateThumbnail, currentIndex]);

  // Restore to checkpoint
  const restoreToCheckpoint = useCallback((checkpointId: string) => {
    const index = historyStack.findIndex(s => s.id === checkpointId);
    if (index === -1) return;

    const snapshot = historyStack[index];
    if (snapshot) {
      setCurrentIndex(index);
      restoreSnapshot(snapshot);
    }
  }, [historyStack, restoreSnapshot]);

  // Jump to specific snapshot
  const jumpToSnapshot = useCallback((snapshotId: string) => {
    const index = historyStack.findIndex(s => s.id === snapshotId);
    if (index === -1) return;

    const snapshot = historyStack[index];
    if (snapshot) {
      setCurrentIndex(index);
      restoreSnapshot(snapshot);
    }
  }, [historyStack, restoreSnapshot]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistoryStack([]);
    setCurrentIndex(-1);
    lastLayerStateRef.current = '';
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  }, []);

  // Get snapshot by index
  const getSnapshot = useCallback((index: number): HistorySnapshot | null => {
    return historyStack[index] || null;
  }, [historyStack]);

  // Get full history state
  const getHistoryState = useCallback((): HistoryState => {
    return {
      snapshots: historyStack,
      currentIndex,
      maxSnapshots,
    };
  }, [historyStack, currentIndex, maxSnapshots]);

  // Listen for global undo/redo events
  useEffect(() => {
    const handleUndo = () => undo();
    const handleRedo = () => redo();

    window.addEventListener('lumina-undo', handleUndo);
    window.addEventListener('lumina-redo', handleRedo);

    return () => {
      window.removeEventListener('lumina-undo', handleUndo);
      window.removeEventListener('lumina-redo', handleRedo);
    };
  }, [undo, redo]);

  // Initialize with first state
  useEffect(() => {
    if (historyStack.length === 0 && layers.length > 0 && canvas) {
      pushState('Initial state');
    }
  }, [layers.length, canvas]); // Only run on initial load

  // Computed values
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < historyStack.length - 1;

  return {
    canUndo,
    canRedo,
    currentIndex,
    historyStack,
    undo,
    redo,
    pushState,
    createCheckpoint,
    restoreToCheckpoint,
    clearHistory,
    getSnapshot,
    jumpToSnapshot,
    getHistoryState,
  };
}
