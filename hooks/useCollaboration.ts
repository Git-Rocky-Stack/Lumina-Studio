// ============================================
// useCollaboration Hook
// Real-time collaboration with Supabase
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { roomCollaborationManager } from '../services/collaborationService';
import type {
  CollaborationRoom,
  CollaborationResourceType,
  RoomParticipant,
  CursorPosition,
  SelectionRange,
  CollaborationOperation,
  OperationType,
  CollaborationVersion,
  RoomInvitation,
  RoomPresenceState,
  UseCollaborationOptions,
  UseCollaborationReturn,
} from '../types/collaboration';

// ============================================
// Hook Implementation
// ============================================

export function useCollaboration(options: UseCollaborationOptions): UseCollaborationReturn {
  const {
    resourceType,
    resourceId,
    autoConnect = true,
    onParticipantJoin,
    onParticipantLeave,
    onOperation,
    onCursorMove,
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<CollaborationRoom | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [selections, setSelections] = useState<Map<string, SelectionRange>>(new Map());

  // Track previous participants for join/leave detection
  const prevParticipantsRef = useRef<string[]>([]);

  // Get current user from participants
  const currentUser = participants.find(
    (p) => p.user_id === roomCollaborationManager.getCurrentRoom()?.created_by
  ) || null;

  // ============================================
  // Presence Change Handler
  // ============================================

  const handlePresenceChange = useCallback((state: RoomPresenceState) => {
    setParticipants(state.participants);
    setCursors(new Map(state.cursors));
    setSelections(new Map(state.selections));

    // Detect joins/leaves
    const currentIds = state.participants.map((p) => p.user_id);
    const prevIds = prevParticipantsRef.current;

    // New participants
    const joined = state.participants.filter(
      (p) => !prevIds.includes(p.user_id)
    );
    joined.forEach((p) => onParticipantJoin?.(p));

    // Left participants
    const left = prevIds.filter((id) => !currentIds.includes(id));
    left.forEach((id) => onParticipantLeave?.(id));

    prevParticipantsRef.current = currentIds;

    // Notify cursor moves
    state.cursors.forEach((position, userId) => {
      onCursorMove?.(userId, position);
    });
  }, [onParticipantJoin, onParticipantLeave, onCursorMove]);

  // ============================================
  // Connection Management
  // ============================================

  const connect = useCallback(async (): Promise<boolean> => {
    if (isConnecting || isConnected) return isConnected;

    setIsConnecting(true);
    setError(null);

    try {
      // Get or create room for the resource
      const collabRoom = await roomCollaborationManager.getOrCreateRoom(
        resourceType,
        resourceId,
        `${resourceType}-${resourceId}`
      );

      if (!collabRoom) {
        setError('Failed to create or find collaboration room');
        setIsConnecting(false);
        return false;
      }

      setRoom(collabRoom);

      // Set up callbacks before joining
      roomCollaborationManager.setOnPresenceChange(handlePresenceChange);
      roomCollaborationManager.setOnOperationReceived((op) => onOperation?.(op));
      roomCollaborationManager.setOnConnectionChange(setIsConnected);
      roomCollaborationManager.setOnError(setError);

      // Join the room
      const success = await roomCollaborationManager.joinRoom(collabRoom.id);

      if (!success) {
        setError('Failed to join collaboration room');
        setIsConnecting(false);
        return false;
      }

      setIsConnecting(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      setIsConnecting(false);
      return false;
    }
  }, [resourceType, resourceId, handlePresenceChange, onOperation, isConnecting, isConnected]);

  const disconnect = useCallback(async (): Promise<void> => {
    await roomCollaborationManager.leaveRoom();
    setIsConnected(false);
    setRoom(null);
    setParticipants([]);
    setCursors(new Map());
    setSelections(new Map());
    prevParticipantsRef.current = [];
  }, []);

  // ============================================
  // Auto-connect on mount
  // ============================================

  useEffect(() => {
    if (autoConnect && resourceId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [resourceId]); // Only reconnect when resourceId changes

  // ============================================
  // Presence Actions
  // ============================================

  const updateCursor = useCallback((position: CursorPosition): void => {
    roomCollaborationManager.updateCursor(position);
  }, []);

  const updateSelection = useCallback((selection: SelectionRange | null): void => {
    roomCollaborationManager.updateSelection(selection);
  }, []);

  const updateStatus = useCallback((status: 'active' | 'idle' | 'away'): void => {
    roomCollaborationManager.updateStatus(status);
  }, []);

  // ============================================
  // Operations
  // ============================================

  const sendOperation = useCallback(async (
    type: OperationType,
    targetType: string,
    data: Record<string, any>,
    targetId?: string
  ): Promise<CollaborationOperation | null> => {
    return roomCollaborationManager.sendOperation(type, targetType, data, targetId);
  }, []);

  // ============================================
  // Comments
  // ============================================

  const addComment = useCallback(async (
    content: string,
    positionData?: Record<string, any>
  ): Promise<void> => {
    await roomCollaborationManager.addComment(content, positionData);
  }, []);

  // ============================================
  // Invitations
  // ============================================

  const inviteUser = useCallback(async (
    email: string,
    permission: 'view' | 'comment' | 'edit'
  ): Promise<RoomInvitation | null> => {
    return roomCollaborationManager.inviteUser(email, permission);
  }, []);

  // ============================================
  // Version Snapshots
  // ============================================

  const createSnapshot = useCallback(async (description?: string): Promise<string | null> => {
    // Get current state to snapshot (caller should provide the actual data)
    // This is a placeholder - actual implementation would need the canvas/document state
    const snapshotData = { timestamp: Date.now() };
    return roomCollaborationManager.createSnapshot(snapshotData, description);
  }, []);

  const getVersionHistory = useCallback(async (): Promise<CollaborationVersion[]> => {
    return roomCollaborationManager.getVersionHistory();
  }, []);

  // ============================================
  // Return Hook Value
  // ============================================

  return {
    // Connection state
    isConnected,
    isConnecting,
    error,

    // Room
    room,

    // Participants
    participants,
    currentUser,

    // Presence
    cursors,
    selections,

    // Actions
    connect,
    disconnect,
    updateCursor,
    updateSelection,
    updateStatus,

    // Operations
    sendOperation,

    // Comments
    addComment,

    // Invitations
    inviteUser,

    // Versions
    createSnapshot,
    getVersionHistory,
  };
}

// ============================================
// Lightweight Presence Hook
// For components that only need cursor/presence
// ============================================

export interface UsePresenceReturn {
  participants: RoomParticipant[];
  cursors: Map<string, CursorPosition>;
  updateCursor: (position: CursorPosition) => void;
}

export function usePresence(
  resourceType: CollaborationResourceType,
  resourceId: string
): UsePresenceReturn {
  const { participants, cursors, updateCursor } = useCollaboration({
    resourceType,
    resourceId,
    autoConnect: true,
  });

  return { participants, cursors, updateCursor };
}

// ============================================
// Invitation Hook
// For managing collaboration invitations
// ============================================

export interface UseInvitationsReturn {
  invitations: RoomInvitation[];
  isLoading: boolean;
  accept: (invitationId: string) => Promise<boolean>;
  decline: (invitationId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useInvitations(): UseInvitationsReturn {
  const [invitations, setInvitations] = useState<RoomInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const pending = await roomCollaborationManager.getPendingInvitations();
    setInvitations(pending);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const accept = useCallback(async (invitationId: string): Promise<boolean> => {
    const success = await roomCollaborationManager.acceptInvitation(invitationId);
    if (success) {
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    }
    return success;
  }, []);

  const decline = useCallback(async (invitationId: string): Promise<boolean> => {
    // For now, just remove from list (could implement actual decline)
    setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    return true;
  }, []);

  return {
    invitations,
    isLoading,
    accept,
    decline,
    refresh,
  };
}

export default useCollaboration;
