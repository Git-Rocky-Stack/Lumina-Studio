// ============================================
// LiveCursors Component
// Real-time cursor visualization with smooth animations
// Integrates with new room-based collaboration
// ============================================

import React, { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import type {
  RoomParticipant,
  CursorPosition,
  SelectionRange,
} from '../../types/collaboration';

// ============================================
// Types
// ============================================

interface LiveCursorsProps {
  participants: RoomParticipant[];
  cursors: Map<string, CursorPosition>;
  selections: Map<string, SelectionRange>;
  currentUserId?: string;
  containerRef?: React.RefObject<HTMLElement>;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
}

interface AnimatedCursorProps {
  participant: RoomParticipant;
  position: CursorPosition;
  scale?: number;
  offsetX?: number;
  offsetY?: number;
}

// ============================================
// Animated Cursor Component
// ============================================

const AnimatedCursor: React.FC<AnimatedCursorProps> = ({
  participant,
  position,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
}) => {
  const x = useMotionValue(position.x * scale + offsetX);
  const y = useMotionValue(position.y * scale + offsetY);

  const springX = useSpring(x, { stiffness: 500, damping: 50, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 500, damping: 50, mass: 0.5 });

  useEffect(() => {
    x.set(position.x * scale + offsetX);
    y.set(position.y * scale + offsetY);
  }, [position.x, position.y, scale, offsetX, offsetY, x, y]);

  const initials = participant.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: springX,
        top: springY,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          transform: 'translate(-2px, -2px)',
        }}
      >
        <path
          d="M5.65 2.65L20.35 12L12 14.5L9 21.35L5.65 2.65Z"
          fill={participant.color}
          stroke="white"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>

      {/* Name Tag */}
      <motion.div
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute left-5 top-4 flex items-center gap-1.5 whitespace-nowrap"
      >
        <div
          className="px-2.5 py-1 rounded-lg shadow-lg text-white text-xs font-semibold"
          style={{ backgroundColor: participant.color }}
        >
          {participant.display_name}
        </div>

        {/* Status indicator */}
        {participant.status === 'active' && (
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: participant.color }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.div>
    </motion.div>
  );
};

// ============================================
// Selection Highlight Component
// ============================================

interface SelectionHighlightProps {
  participant: RoomParticipant;
  selection: SelectionRange;
  getElementBounds?: (elementId: string) => DOMRect | null;
}

const SelectionHighlight: React.FC<SelectionHighlightProps> = ({
  participant,
  selection,
  getElementBounds,
}) => {
  // In a real implementation, you'd get the actual bounds
  // of the selected element and render the highlight there
  // For now, this is a placeholder that renders nothing
  // since we need the actual element bounds from the canvas

  return null; // Selection highlighting handled by parent canvas
};

// ============================================
// Live Cursors Main Component
// ============================================

export const LiveCursors: React.FC<LiveCursorsProps> = ({
  participants,
  cursors,
  selections,
  currentUserId,
  containerRef,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
}) => {
  // Filter out current user and get participants with cursor positions
  const visibleCursors = useMemo(() => {
    return participants
      .filter((p) => p.user_id !== currentUserId)
      .map((p) => ({
        participant: p,
        cursor: cursors.get(p.user_id),
      }))
      .filter((item) => item.cursor !== undefined);
  }, [participants, cursors, currentUserId]);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 50 }}
    >
      <AnimatePresence>
        {visibleCursors.map(({ participant, cursor }) => (
          <AnimatedCursor
            key={participant.user_id}
            participant={participant}
            position={cursor!}
            scale={scale}
            offsetX={offsetX}
            offsetY={offsetY}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// Presence Avatars Strip Component
// ============================================

interface PresenceAvatarsProps {
  participants: RoomParticipant[];
  currentUserId?: string;
  maxVisible?: number;
  onAvatarClick?: (participant: RoomParticipant) => void;
  showStatus?: boolean;
}

export const PresenceAvatars: React.FC<PresenceAvatarsProps> = ({
  participants,
  currentUserId,
  maxVisible = 4,
  onAvatarClick,
  showStatus = true,
}) => {
  const otherParticipants = useMemo(
    () => participants.filter((p) => p.user_id !== currentUserId),
    [participants, currentUserId]
  );

  const visibleParticipants = otherParticipants.slice(0, maxVisible);
  const extraCount = otherParticipants.length - maxVisible;

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="flex items-center">
      {/* Avatar stack */}
      <div className="flex -space-x-2">
        <AnimatePresence mode="popLayout">
          {visibleParticipants.map((participant, index) => (
            <motion.button
              key={participant.user_id}
              initial={{ opacity: 0, scale: 0, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0, x: 10 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onAvatarClick?.(participant)}
              className="relative group"
              style={{ zIndex: maxVisible - index }}
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-md transition-transform hover:scale-110 hover:z-50"
                style={{ backgroundColor: participant.color }}
              >
                {participant.avatar_url ? (
                  <img
                    src={participant.avatar_url}
                    alt={participant.display_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(participant.display_name)
                )}
              </div>

              {/* Status dot */}
              {showStatus && (
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                    participant.status === 'active'
                      ? 'bg-emerald-500'
                      : participant.status === 'idle'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                />
              )}

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {participant.display_name}
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900"
                />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Extra count badge */}
        {extraCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold"
          >
            +{extraCount}
          </motion.div>
        )}
      </div>
    </div>
  );
};

// ============================================
// Connection Status Indicator
// ============================================

interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  participantCount: number;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  isConnecting,
  participantCount,
}) => {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold">
      {isConnecting ? (
        <>
          <motion.div
            className="w-2 h-2 rounded-full bg-amber-500"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
          <span className="text-amber-600">Connecting...</span>
        </>
      ) : isConnected ? (
        <>
          <motion.div
            className="w-2 h-2 rounded-full bg-emerald-500"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <span className="text-emerald-600">
            Live {participantCount > 1 ? `· ${participantCount} online` : ''}
          </span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 rounded-full bg-slate-400" />
          <span className="text-slate-500">Offline</span>
        </>
      )}
    </div>
  );
};

export default LiveCursors;
