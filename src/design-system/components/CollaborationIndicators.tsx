import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Eye, Edit3, MessageCircle, Bell, Check, Lock, Wifi, WifiOff } from 'lucide-react';
import { springPresets } from '../animations';
import { Avatar, AvatarGroup } from './AvatarGroup';

// Types
interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  status: 'online' | 'away' | 'offline';
  activity?: 'viewing' | 'editing' | 'commenting' | 'idle';
  cursorPosition?: { x: number; y: number };
  selection?: { start: number; end: number };
}

// Presence indicator showing who's online
interface PresenceIndicatorProps {
  collaborators: Collaborator[];
  maxVisible?: number;
  showActivity?: boolean;
  onCollaboratorClick?: (collaborator: Collaborator) => void;
  className?: string;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  collaborators,
  maxVisible = 5,
  showActivity = true,
  onCollaboratorClick,
  className = '',
}) => {
  const onlineCollaborators = collaborators.filter(c => c.status !== 'offline');

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <AvatarGroup
        avatars={onlineCollaborators.map(c => ({
          src: c.avatar,
          name: c.name,
        }))}
        max={maxVisible}
        size="sm"
      />

      {showActivity && onlineCollaborators.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <Users size={12} />
          <span>{onlineCollaborators.length} online</span>
        </div>
      )}
    </div>
  );
};

// Live cursors overlay
interface LiveCursorsProps {
  collaborators: Collaborator[];
  currentUserId: string;
}

export const LiveCursors: React.FC<LiveCursorsProps> = ({
  collaborators,
  currentUserId,
}) => {
  const otherUsers = collaborators.filter(
    c => c.id !== currentUserId && c.cursorPosition && c.status === 'online'
  );

  return (
    <>
      {otherUsers.map((collaborator) => (
        <motion.div
          key={collaborator.id}
          className="fixed pointer-events-none z-50"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: collaborator.cursorPosition!.x,
            y: collaborator.cursorPosition!.y,
          }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: 'spring', damping: 30, stiffness: 500 }}
        >
          {/* Cursor */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={collaborator.color}
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
          >
            <path d="M5.65 3.15l12.7 12.7-5.35.9-.9 5.35z" />
          </svg>

          {/* Name tag */}
          <motion.div
            className="absolute left-4 top-5 px-2 py-0.5 rounded-full text-xs font-medium text-white whitespace-nowrap"
            style={{ backgroundColor: collaborator.color }}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {collaborator.name.split(' ')[0]}
          </motion.div>
        </motion.div>
      ))}
    </>
  );
};

// Activity feed for collaboration
interface Activity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'join' | 'leave' | 'edit' | 'comment' | 'select';
  target?: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
  className?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  maxItems = 5,
  className = '',
}) => {
  const recentActivities = activities.slice(0, maxItems);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'join': return <Users size={14} className="text-emerald-500" />;
      case 'leave': return <Users size={14} className="text-zinc-400" />;
      case 'edit': return <Edit3 size={14} className="text-indigo-500" />;
      case 'comment': return <MessageCircle size={14} className="text-amber-500" />;
      case 'select': return <Eye size={14} className="text-blue-500" />;
    }
  };

  const getActivityMessage = (activity: Activity) => {
    switch (activity.type) {
      case 'join': return 'joined';
      case 'leave': return 'left';
      case 'edit': return `edited ${activity.target || 'element'}`;
      case 'comment': return `commented on ${activity.target || 'element'}`;
      case 'select': return `is viewing ${activity.target || 'canvas'}`;
    }
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <AnimatePresence>
        {recentActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            className="flex items-center gap-2 text-sm"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ delay: index * 0.05 }}
          >
            {getActivityIcon(activity.type)}
            <span className="font-medium text-zinc-900 dark:text-white">
              {activity.userName}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {getActivityMessage(activity)}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-auto">
              {timeAgo(activity.timestamp)}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Typing indicator for collaborative editing
interface TypingIndicatorProps {
  users: Array<{ name: string; color: string }>;
  className?: string;
}

export const CollaboratorTyping: React.FC<TypingIndicatorProps> = ({
  users,
  className = '',
}) => {
  if (users.length === 0) return null;

  const message = users.length === 1
    ? `${users[0].name} is typing...`
    : users.length === 2
      ? `${users[0].name} and ${users[1].name} are typing...`
      : `${users[0].name} and ${users.length - 1} others are typing...`;

  return (
    <motion.div
      className={`flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 ${className}`}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
    >
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: users[0]?.color || '#6366f1' }}
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
      <span>{message}</span>
    </motion.div>
  );
};

// Connection status indicator
interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected';
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  className = '',
}) => {
  const config = {
    connected: {
      icon: <Wifi size={14} />,
      color: 'text-emerald-500',
      label: 'Connected',
    },
    connecting: {
      icon: <Wifi size={14} />,
      color: 'text-amber-500',
      label: 'Connecting...',
    },
    disconnected: {
      icon: <WifiOff size={14} />,
      color: 'text-red-500',
      label: 'Disconnected',
    },
  };

  const { icon, color, label } = config[status];

  return (
    <motion.div
      className={`flex items-center gap-1.5 text-xs ${color} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {status === 'connecting' ? (
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {icon}
        </motion.div>
      ) : (
        icon
      )}
      <span>{label}</span>
    </motion.div>
  );
};

// Lock indicator for elements being edited by others
interface ElementLockProps {
  lockedBy: { name: string; color: string } | null;
  className?: string;
}

export const ElementLock: React.FC<ElementLockProps> = ({
  lockedBy,
  className = '',
}) => {
  if (!lockedBy) return null;

  return (
    <motion.div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: `${lockedBy.color}20`, color: lockedBy.color }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <Lock size={12} />
      <span>{lockedBy.name} is editing</span>
    </motion.div>
  );
};

// Selection highlight for collaborator selections
interface SelectionHighlightProps {
  selections: Array<{
    userId: string;
    color: string;
    bounds: { x: number; y: number; width: number; height: number };
  }>;
  currentUserId: string;
}

export const SelectionHighlight: React.FC<SelectionHighlightProps> = ({
  selections,
  currentUserId,
}) => {
  const otherSelections = selections.filter(s => s.userId !== currentUserId);

  return (
    <>
      {otherSelections.map((selection) => (
        <motion.div
          key={selection.userId}
          className="absolute pointer-events-none"
          style={{
            left: selection.bounds.x,
            top: selection.bounds.y,
            width: selection.bounds.width,
            height: selection.bounds.height,
            border: `2px solid ${selection.color}`,
            backgroundColor: `${selection.color}10`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      ))}
    </>
  );
};

// Real-time notification toast for collaboration events
interface CollabNotificationProps {
  type: 'join' | 'leave' | 'mention' | 'comment';
  user: { name: string; avatar?: string };
  message?: string;
  onDismiss: () => void;
}

export const CollabNotification: React.FC<CollabNotificationProps> = ({
  type,
  user,
  message,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getNotificationContent = () => {
    switch (type) {
      case 'join':
        return { icon: <Users size={16} />, text: 'joined the session' };
      case 'leave':
        return { icon: <Users size={16} />, text: 'left the session' };
      case 'mention':
        return { icon: <Bell size={16} />, text: 'mentioned you' };
      case 'comment':
        return { icon: <MessageCircle size={16} />, text: 'commented' };
    }
  };

  const { icon, text } = getNotificationContent();

  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg border border-zinc-200 dark:border-zinc-700"
      initial={{ opacity: 0, y: -20, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -20, x: 20 }}
      transition={springPresets.snappy}
    >
      <Avatar src={user.avatar} name={user.name} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium text-zinc-900 dark:text-white">{user.name}</span>
          {' '}
          <span className="text-zinc-500 dark:text-zinc-400">{text}</span>
        </p>
        {message && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
            {message}
          </p>
        )}
      </div>
      <span className="text-zinc-400">{icon}</span>
    </motion.div>
  );
};

// Collaboration sidebar panel
interface CollaborationPanelProps {
  collaborators: Collaborator[];
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  collaborators,
  currentUserId,
  isOpen,
  onClose,
}) => {
  const onlineCollaborators = collaborators.filter(c => c.status === 'online');
  const awayCollaborators = collaborators.filter(c => c.status === 'away');
  const offlineCollaborators = collaborators.filter(c => c.status === 'offline');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-700 shadow-xl z-40"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={springPresets.smooth}
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
            <h2 className="font-semibold text-zinc-900 dark:text-white">Collaborators</h2>
            <motion.button
              onClick={onClose}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
              whileTap={{ scale: 0.95 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </motion.button>
          </div>

          <div className="p-4 space-y-6 overflow-y-auto h-full">
            {/* Online */}
            {onlineCollaborators.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase mb-2">
                  Online — {onlineCollaborators.length}
                </h3>
                <div className="space-y-2">
                  {onlineCollaborators.map((collaborator) => (
                    <CollaboratorRow
                      key={collaborator.id}
                      collaborator={collaborator}
                      isCurrentUser={collaborator.id === currentUserId}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Away */}
            {awayCollaborators.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase mb-2">
                  Away — {awayCollaborators.length}
                </h3>
                <div className="space-y-2">
                  {awayCollaborators.map((collaborator) => (
                    <CollaboratorRow key={collaborator.id} collaborator={collaborator} />
                  ))}
                </div>
              </div>
            )}

            {/* Offline */}
            {offlineCollaborators.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase mb-2">
                  Offline — {offlineCollaborators.length}
                </h3>
                <div className="space-y-2 opacity-50">
                  {offlineCollaborators.map((collaborator) => (
                    <CollaboratorRow key={collaborator.id} collaborator={collaborator} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Individual collaborator row
const CollaboratorRow: React.FC<{
  collaborator: Collaborator;
  isCurrentUser?: boolean;
}> = ({ collaborator, isCurrentUser }) => {
  const activityIcons = {
    viewing: <Eye size={12} />,
    editing: <Edit3 size={12} />,
    commenting: <MessageCircle size={12} />,
    idle: null,
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
      <div className="relative">
        <Avatar src={collaborator.avatar} name={collaborator.name} size="sm" />
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900
            ${collaborator.status === 'online' ? 'bg-emerald-500' :
              collaborator.status === 'away' ? 'bg-amber-500' : 'bg-zinc-400'}`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
          {collaborator.name}
          {isCurrentUser && (
            <span className="ml-1 text-xs text-zinc-400">(you)</span>
          )}
        </p>
        {collaborator.activity && collaborator.activity !== 'idle' && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            {activityIcons[collaborator.activity]}
            <span className="capitalize">{collaborator.activity}</span>
          </p>
        )}
      </div>

      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: collaborator.color }}
      />
    </div>
  );
};

export default PresenceIndicator;
