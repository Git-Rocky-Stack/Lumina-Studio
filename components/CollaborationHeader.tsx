import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthContext } from '../contexts/AuthContext';
import {
  collaborationManager,
  formatRelativeTime,
  getInitials
} from '../services/collaborationService';
import {
  PresencePanel,
  CommentsPanel,
  ActivityFeed,
  ShareModal
} from './Collaboration';
import type {
  UserPresence,
  CommentThread,
  ActivityItem,
  CollaboratorRole
} from '../types/collaboration';

interface CollaborationHeaderProps {
  title: string;
  projectId?: string;
  onPublish?: () => void;
}

const CollaborationHeader: React.FC<CollaborationHeaderProps> = ({
  title,
  projectId = 'demo-project',
  onPublish
}) => {
  const { userId, userName, userAvatar, isAuthenticated } = useAuthContext();

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'idle'>('idle');

  // Presence state
  const [activeUsers, setActiveUsers] = useState<Map<string, UserPresence>>(new Map());

  // Comments state
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [activeThread, setActiveThread] = useState<CommentThread | null>(null);

  // Activity state
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // UI state
  const [showPresence, setShowPresence] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareLink, setShareLink] = useState<string | undefined>();

  // Connect to collaboration channel
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const connect = async () => {
      setSyncStatus('syncing');

      try {
        await collaborationManager.connect(projectId, {
          id: userId,
          name: userName || 'Anonymous',
          avatar: userAvatar || undefined
        });

        // Set up callbacks
        collaborationManager.setOnPresenceUpdate((users) => {
          setActiveUsers(new Map(users));
        });

        collaborationManager.setOnActivityEvent((activity) => {
          setActivities(prev => [activity, ...prev].slice(0, 50));
        });

        collaborationManager.setOnConnectionChange((connected) => {
          setIsConnected(connected);
          setSyncStatus(connected ? 'synced' : 'idle');
        });

        collaborationManager.setOnCommentEvent((thread, action) => {
          if (action === 'create') {
            setThreads(prev => [thread, ...prev]);
          } else if (action === 'update') {
            setThreads(prev => prev.map(t => t.id === thread.id ? thread : t));
          } else if (action === 'delete') {
            setThreads(prev => prev.filter(t => t.id !== thread.id));
          }
        });
      } catch (error) {
        console.error('Failed to connect:', error);
        setSyncStatus('idle');
      }
    };

    connect();

    return () => {
      collaborationManager.disconnect();
    };
  }, [isAuthenticated, userId, userName, userAvatar, projectId]);

  // Simulated sync indicator (for demo when not authenticated)
  useEffect(() => {
    if (isAuthenticated) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setSyncStatus('syncing');
        setTimeout(() => setSyncStatus('synced'), 2000);
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Comment handlers
  const handleCreateThread = useCallback(async (content: string) => {
    const thread = await collaborationManager.createThread(undefined, content);
    setThreads(prev => [thread, ...prev]);
  }, []);

  const handleAddComment = useCallback(async (threadId: string, content: string) => {
    const comment = await collaborationManager.addComment(threadId, content);
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return { ...t, comments: [...t.comments, comment] };
      }
      return t;
    }));
  }, []);

  const handleResolveThread = useCallback(async (threadId: string) => {
    await collaborationManager.resolveThread(threadId);
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return { ...t, status: 'resolved' };
      }
      return t;
    }));
  }, []);

  // Share handlers
  const handleInvite = useCallback(async (email: string, role: CollaboratorRole) => {
    await collaborationManager.inviteUser(email, role);
    // In production, this would send an email invitation
  }, []);

  const handleGenerateLink = useCallback(async () => {
    const link = await collaborationManager.generateShareLink();
    setShareLink(link);
  }, []);

  // Display data
  const userArray = useMemo(() => Array.from(activeUsers.values()).slice(0, 3), [activeUsers]);
  const extraUsers = activeUsers.size - 3;
  const unresolvedCount = threads.filter(t => t.status === 'open').length;

  // Demo collaborators for non-authenticated users
  const demoCollaborators = [
    { name: 'Sarah L.', color: '#ef4444', initial: 'S' },
    { name: 'Marcus T.', color: '#22c55e', initial: 'M' },
  ];

  const displayCollaborators = isAuthenticated
    ? userArray.map(u => ({ name: u.name, color: u.color, initial: getInitials(u.name) }))
    : demoCollaborators;

  return (
    <>
      <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-30">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <h2 className="font-black text-slate-800 tracking-tight">{title}</h2>
          <div className="h-4 w-px bg-slate-100"></div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            {syncStatus === 'syncing' ? (
              <>
                <i className="fas fa-circle-notch fa-spin text-accent"></i>
                Linking Drive...
              </>
            ) : isConnected ? (
              <>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                Live Collaboration
              </>
            ) : (
              <>
                <i className="fas fa-check-circle text-emerald-500"></i>
                Cloud Synced
              </>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-6">
          {/* Collaborator avatars */}
          <div className="flex -space-x-2">
            {displayCollaborators.map((c, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-black shadow-sm cursor-pointer hover:z-10 hover:scale-110 transition-all"
                style={{ backgroundColor: c.color }}
                title={c.name}
                onClick={() => setShowPresence(true)}
              >
                {c.initial}
              </motion.div>
            ))}
            {/* Current user */}
            <div
              className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-black shadow-sm bg-accent"
              title="You"
            >
              Y
            </div>
            {extraUsers > 0 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                +{extraUsers}
              </div>
            )}
            <button
              onClick={() => setShowShare(true)}
              className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-slate-400 text-xs hover:bg-slate-100 transition-colors"
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {/* Comments */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="relative w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-accent transition-all"
            >
              <i className="fas fa-comment"></i>
              {unresolvedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {unresolvedCount}
                </span>
              )}
            </button>

            {/* Activity */}
            <button
              onClick={() => setShowActivity(!showActivity)}
              className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-accent transition-all"
            >
              <i className="fas fa-stream"></i>
            </button>

            {/* Export */}
            {onPublish && (
              <button
                onClick={onPublish}
                className="px-6 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 hover:brightness-110 transition-all"
              >
                Export
              </button>
            )}

            {/* Share */}
            <button
              onClick={() => setShowShare(true)}
              className="px-4 py-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
            >
              Share
            </button>

            {/* Google Drive */}
            <button className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl border border-slate-100 hover:text-accent transition-all">
              <i className="fab fa-google-drive"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Floating panels */}
      <AnimatePresence>
        {/* Presence Panel */}
        {showPresence && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-6 z-50"
          >
            <div className="relative">
              <button
                onClick={() => setShowPresence(false)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm z-10"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
              <PresencePanel
                users={activeUsers}
                currentUserId={userId || undefined}
                onInvite={() => { setShowPresence(false); setShowShare(true); }}
              />
            </div>
          </motion.div>
        )}

        {/* Comments Panel */}
        {showComments && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-20 right-6 z-50"
          >
            <div className="relative">
              <button
                onClick={() => setShowComments(false)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm z-10"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
              <CommentsPanel
                threads={threads}
                onCreateThread={handleCreateThread}
                onAddComment={handleAddComment}
                onResolveThread={handleResolveThread}
                activeThread={activeThread}
                onSelectThread={setActiveThread}
              />
            </div>
          </motion.div>
        )}

        {/* Activity Feed */}
        {showActivity && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-20 right-6 z-50"
          >
            <div className="relative">
              <button
                onClick={() => setShowActivity(false)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm z-10"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
              <ActivityFeed activities={activities} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        projectName={title}
        onInvite={handleInvite}
        shareLink={shareLink}
        onGenerateLink={handleGenerateLink}
      />
    </>
  );
};

export default CollaborationHeader;
