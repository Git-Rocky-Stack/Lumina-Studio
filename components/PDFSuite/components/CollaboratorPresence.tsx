// ============================================
// CollaboratorPresence Component
// Real-time user presence indicators for collaborative annotations
// ============================================

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Eye, MousePointer2, MessageSquare } from 'lucide-react';
import type { CollaboratorPresence as CollaboratorPresenceType } from '../hooks/useEnhancedAnnotations';

interface CollaboratorPresenceProps {
  collaborators: CollaboratorPresenceType[];
  currentUserId: string;
  currentPage: number;
  onFollowUser?: (userId: string) => void;
  className?: string;
}

export const CollaboratorPresence: React.FC<CollaboratorPresenceProps> = ({
  collaborators,
  currentUserId,
  currentPage,
  onFollowUser,
  className = '',
}) => {
  // Filter out current user and get active collaborators
  const activeCollaborators = useMemo(() => {
    const now = Date.now();
    return collaborators
      .filter(
        (c) =>
          c.userId !== currentUserId &&
          now - c.lastActivity < 30000 // Active in last 30 seconds
      )
      .sort((a, b) => b.lastActivity - a.lastActivity);
  }, [collaborators, currentUserId]);

  // Collaborators on current page
  const onCurrentPage = useMemo(
    () => activeCollaborators.filter((c) => c.currentPage === currentPage),
    [activeCollaborators, currentPage]
  );

  // Collaborators on other pages
  const onOtherPages = useMemo(
    () => activeCollaborators.filter((c) => c.currentPage !== currentPage),
    [activeCollaborators, currentPage]
  );

  if (activeCollaborators.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      {/* Floating Avatar Stack */}
      <div className="fixed bottom-6 right-6 z-30">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-full shadow-lg border-2 border-slate-200 p-2"
        >
          <div className="flex items-center gap-2 px-2">
            <Users className="w-4 h-4 text-slate-600" />

            {/* Avatar Stack */}
            <div className="flex -space-x-2">
              {activeCollaborators.slice(0, 5).map((collaborator, index) => (
                <CollaboratorAvatar
                  key={collaborator.userId}
                  collaborator={collaborator}
                  index={index}
                  isOnCurrentPage={collaborator.currentPage === currentPage}
                  onClick={() => onFollowUser?.(collaborator.userId)}
                />
              ))}
            </div>

            {activeCollaborators.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white">
                <span className="text-xs font-bold text-slate-600">
                  +{activeCollaborators.length - 5}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Expanded Panel */}
        <AnimatePresence>
          {activeCollaborators.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full right-0 mb-3 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-700">
                    Active Collaborators
                  </h3>
                  <span className="ml-auto px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                    {activeCollaborators.length}
                  </span>
                </div>
              </div>

              {/* Current Page Section */}
              {onCurrentPage.length > 0 && (
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                    On this page
                  </p>
                  <div className="space-y-2">
                    {onCurrentPage.map((collaborator) => (
                      <CollaboratorListItem
                        key={collaborator.userId}
                        collaborator={collaborator}
                        onFollow={() => onFollowUser?.(collaborator.userId)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Pages Section */}
              {onOtherPages.length > 0 && (
                <div className="px-4 py-3 max-h-48 overflow-y-auto">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                    Other pages
                  </p>
                  <div className="space-y-2">
                    {onOtherPages.map((collaborator) => (
                      <CollaboratorListItem
                        key={collaborator.userId}
                        collaborator={collaborator}
                        onFollow={() => onFollowUser?.(collaborator.userId)}
                        showPageNumber
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cursor Indicators for current page */}
      <AnimatePresence>
        {onCurrentPage.map(
          (collaborator) =>
            collaborator.cursor && (
              <CursorIndicator
                key={collaborator.userId}
                collaborator={collaborator}
              />
            )
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// CollaboratorAvatar Component
// ============================================

interface CollaboratorAvatarProps {
  collaborator: CollaboratorPresenceType;
  index: number;
  isOnCurrentPage: boolean;
  onClick?: () => void;
}

const CollaboratorAvatar: React.FC<CollaboratorAvatarProps> = ({
  collaborator,
  index,
  isOnCurrentPage,
  onClick,
}) => {
  const initials = collaborator.userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="relative group"
      title={`${collaborator.userName} - Page ${collaborator.currentPage}`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white transition-transform group-hover:scale-110 ${
          isOnCurrentPage ? 'ring-2 ring-emerald-500' : ''
        }`}
        style={{ backgroundColor: collaborator.userColor }}
      >
        {initials}
      </div>

      {/* Activity Pulse */}
      {isOnCurrentPage && (
        <motion.div
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 rounded-full bg-emerald-500"
        />
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {collaborator.userName}
      </div>
    </motion.button>
  );
};

// ============================================
// CollaboratorListItem Component
// ============================================

interface CollaboratorListItemProps {
  collaborator: CollaboratorPresenceType;
  onFollow?: () => void;
  showPageNumber?: boolean;
}

const CollaboratorListItem: React.FC<CollaboratorListItemProps> = ({
  collaborator,
  onFollow,
  showPageNumber = false,
}) => {
  const initials = collaborator.userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const timeSinceActive = Date.now() - collaborator.lastActivity;
  const isActive = timeSinceActive < 5000; // Active in last 5 seconds

  return (
    <div className="flex items-center gap-3 group">
      {/* Avatar */}
      <div className="relative">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: collaborator.userColor }}
        >
          {initials}
        </div>

        {/* Active Indicator */}
        {isActive && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">
          {collaborator.userName}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {showPageNumber && (
            <>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Page {collaborator.currentPage}
              </span>
            </>
          )}
          {collaborator.selectedAnnotationId && (
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Viewing annotation
            </span>
          )}
        </div>
      </div>

      {/* Follow Button */}
      {onFollow && showPageNumber && (
        <button
          onClick={onFollow}
          className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded text-xs font-medium transition-all"
        >
          Follow
        </button>
      )}
    </div>
  );
};

// ============================================
// CursorIndicator Component
// ============================================

interface CursorIndicatorProps {
  collaborator: CollaboratorPresenceType;
}

const CursorIndicator: React.FC<CursorIndicatorProps> = ({ collaborator }) => {
  if (!collaborator.cursor) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      style={{
        position: 'fixed',
        left: collaborator.cursor.x,
        top: collaborator.cursor.y,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      className="flex items-start gap-2"
    >
      {/* Cursor Icon */}
      <div style={{ color: collaborator.userColor }}>
        <MousePointer2 className="w-5 h-5 drop-shadow-lg" />
      </div>

      {/* Name Tag */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="px-2 py-1 rounded text-xs font-medium text-white shadow-lg whitespace-nowrap"
        style={{ backgroundColor: collaborator.userColor }}
      >
        {collaborator.userName}
      </motion.div>
    </motion.div>
  );
};

export default CollaboratorPresence;
