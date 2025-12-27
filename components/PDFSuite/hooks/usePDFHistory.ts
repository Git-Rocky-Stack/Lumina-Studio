// ============================================
// usePDFHistory Hook
// Manages undo/redo history for PDF operations
// ============================================

import { useState, useCallback, useRef, useEffect } from 'react';
import type { HistoryAction, HistoryActionType, HistoryState } from '../types';

interface UsePDFHistoryOptions {
  maxHistory?: number;
  onUndo?: (action: HistoryAction) => void;
  onRedo?: (action: HistoryAction) => void;
}

interface UsePDFHistoryReturn {
  // State
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  currentIndex: number;

  // Actions
  undo: () => HistoryAction | null;
  redo: () => HistoryAction | null;
  addAction: (action: Omit<HistoryAction, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;

  // Batch operations
  startBatch: (description: string) => void;
  endBatch: () => void;
  cancelBatch: () => void;

  // History inspection
  getHistory: () => HistoryAction[];
  getUndoStack: () => HistoryAction[];
  getRedoStack: () => HistoryAction[];
  getLastAction: () => HistoryAction | null;

  // Checkpoints
  createCheckpoint: (name: string) => string;
  restoreCheckpoint: (checkpointId: string) => boolean;
  getCheckpoints: () => Array<{ id: string; name: string; timestamp: number }>;
}

export function usePDFHistory(
  options: UsePDFHistoryOptions = {}
): UsePDFHistoryReturn {
  const { maxHistory = 100, onUndo, onRedo } = options;

  // State
  const [historyState, setHistoryState] = useState<HistoryState>({
    actions: [],
    currentIndex: -1,
    maxHistory,
    canUndo: false,
    canRedo: false,
  });

  // Batch operation state
  const batchRef = useRef<{
    isActive: boolean;
    description: string;
    actions: HistoryAction[];
  }>({
    isActive: false,
    description: '',
    actions: [],
  });

  // Checkpoints
  const checkpointsRef = useRef<
    Map<string, { name: string; index: number; timestamp: number }>
  >(new Map());

  // Generate unique ID
  const generateId = useCallback(() => {
    return `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add action to history
  const addAction = useCallback(
    (action: Omit<HistoryAction, 'id' | 'timestamp'>) => {
      const fullAction: HistoryAction = {
        ...action,
        id: generateId(),
        timestamp: Date.now(),
      };

      // If batch is active, add to batch instead
      if (batchRef.current.isActive) {
        batchRef.current.actions.push(fullAction);
        return;
      }

      setHistoryState((prev) => {
        // Remove any redo actions (actions after current index)
        const newActions = prev.actions.slice(0, prev.currentIndex + 1);

        // Add new action
        newActions.push(fullAction);

        // Limit history size
        while (newActions.length > maxHistory) {
          newActions.shift();
        }

        const newIndex = newActions.length - 1;

        return {
          ...prev,
          actions: newActions,
          currentIndex: newIndex,
          canUndo: newIndex >= 0,
          canRedo: false,
        };
      });
    },
    [generateId, maxHistory]
  );

  // Undo
  const undo = useCallback((): HistoryAction | null => {
    if (!historyState.canUndo) return null;

    const action = historyState.actions[historyState.currentIndex];
    if (!action) return null;

    setHistoryState((prev) => {
      const newIndex = prev.currentIndex - 1;
      return {
        ...prev,
        currentIndex: newIndex,
        canUndo: newIndex >= 0,
        canRedo: true,
      };
    });

    onUndo?.(action);
    return action;
  }, [historyState.canUndo, historyState.actions, historyState.currentIndex, onUndo]);

  // Redo
  const redo = useCallback((): HistoryAction | null => {
    if (!historyState.canRedo) return null;

    const nextIndex = historyState.currentIndex + 1;
    const action = historyState.actions[nextIndex];
    if (!action) return null;

    setHistoryState((prev) => {
      const newIndex = prev.currentIndex + 1;
      return {
        ...prev,
        currentIndex: newIndex,
        canUndo: true,
        canRedo: newIndex < prev.actions.length - 1,
      };
    });

    onRedo?.(action);
    return action;
  }, [historyState.canRedo, historyState.actions, historyState.currentIndex, onRedo]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistoryState({
      actions: [],
      currentIndex: -1,
      maxHistory,
      canUndo: false,
      canRedo: false,
    });
    checkpointsRef.current.clear();
    batchRef.current = {
      isActive: false,
      description: '',
      actions: [],
    };
  }, [maxHistory]);

  // Batch operations
  const startBatch = useCallback((description: string) => {
    batchRef.current = {
      isActive: true,
      description,
      actions: [],
    };
  }, []);

  const endBatch = useCallback(() => {
    if (!batchRef.current.isActive) return;

    const batchActions = batchRef.current.actions;
    const description = batchRef.current.description;

    batchRef.current = {
      isActive: false,
      description: '',
      actions: [],
    };

    if (batchActions.length === 0) return;

    // Create a batch action that contains all the individual actions
    addAction({
      type: 'batch',
      description,
      data: batchActions,
      inverse: batchActions.map((a) => a.inverse).reverse(),
    });
  }, [addAction]);

  const cancelBatch = useCallback(() => {
    batchRef.current = {
      isActive: false,
      description: '',
      actions: [],
    };
  }, []);

  // History inspection
  const getHistory = useCallback((): HistoryAction[] => {
    return [...historyState.actions];
  }, [historyState.actions]);

  const getUndoStack = useCallback((): HistoryAction[] => {
    return historyState.actions.slice(0, historyState.currentIndex + 1);
  }, [historyState.actions, historyState.currentIndex]);

  const getRedoStack = useCallback((): HistoryAction[] => {
    return historyState.actions.slice(historyState.currentIndex + 1);
  }, [historyState.actions, historyState.currentIndex]);

  const getLastAction = useCallback((): HistoryAction | null => {
    if (historyState.currentIndex < 0) return null;
    return historyState.actions[historyState.currentIndex] || null;
  }, [historyState.actions, historyState.currentIndex]);

  // Checkpoints
  const createCheckpoint = useCallback(
    (name: string): string => {
      const id = generateId();
      checkpointsRef.current.set(id, {
        name,
        index: historyState.currentIndex,
        timestamp: Date.now(),
      });
      return id;
    },
    [generateId, historyState.currentIndex]
  );

  const restoreCheckpoint = useCallback(
    (checkpointId: string): boolean => {
      const checkpoint = checkpointsRef.current.get(checkpointId);
      if (!checkpoint) return false;

      setHistoryState((prev) => {
        const newIndex = Math.min(checkpoint.index, prev.actions.length - 1);
        return {
          ...prev,
          currentIndex: newIndex,
          canUndo: newIndex >= 0,
          canRedo: newIndex < prev.actions.length - 1,
        };
      });

      return true;
    },
    []
  );

  const getCheckpoints = useCallback(() => {
    return Array.from(checkpointsRef.current.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      timestamp: data.timestamp,
    }));
  }, []);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    // State
    canUndo: historyState.canUndo,
    canRedo: historyState.canRedo,
    historyLength: historyState.actions.length,
    currentIndex: historyState.currentIndex,

    // Actions
    undo,
    redo,
    addAction,
    clearHistory,

    // Batch operations
    startBatch,
    endBatch,
    cancelBatch,

    // History inspection
    getHistory,
    getUndoStack,
    getRedoStack,
    getLastAction,

    // Checkpoints
    createCheckpoint,
    restoreCheckpoint,
    getCheckpoints,
  };
}

export default usePDFHistory;
