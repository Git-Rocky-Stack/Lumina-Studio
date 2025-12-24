import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'update' | 'mention';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  avatar?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
  onClear: () => void;
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  onClear,
  className = '',
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications =
    filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  const typeConfig = {
    info: { icon: 'fa-info-circle', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    success: {
      icon: 'fa-check-circle',
      color: 'text-emerald-500',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    warning: {
      icon: 'fa-exclamation-triangle',
      color: 'text-amber-500',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
    error: { icon: 'fa-times-circle', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
    update: {
      icon: 'fa-arrow-up-circle',
      color: 'text-purple-500',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    mention: { icon: 'fa-at', color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <i className="fas fa-bell text-accent" />
            Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-accent text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-accent hover:underline"
              >
                Mark all read
              </button>
            )}
            <button onClick={onClear} className="text-xs text-slate-500 hover:text-red-500">
              Clear all
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'unread'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-accent text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {f === 'all' ? 'All' : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-[400px] overflow-y-auto">
        <AnimatePresence>
          {filteredNotifications.map((notification, index) => {
            const config = typeConfig[notification.type];
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                  !notification.read ? 'bg-accent/5' : ''
                }`}
                onClick={() => !notification.read && onMarkRead(notification.id)}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bg}`}
                  >
                    {notification.avatar ? (
                      <img
                        src={notification.avatar}
                        alt=""
                        className="w-full h-full rounded-full"
                      />
                    ) : (
                      <i className={`fas ${config.icon} ${config.color}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-sm text-slate-900 dark:text-white">
                          {notification.title}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-slate-400">
                          {formatTime(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-accent" />
                        )}
                      </div>
                    </div>

                    {/* Action button */}
                    {notification.action && (
                      <motion.button
                        onClick={e => {
                          e.stopPropagation();
                          notification.action?.onClick();
                        }}
                        className="mt-2 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {notification.action.label}
                      </motion.button>
                    )}
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onDismiss(notification.id);
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <i className="fas fa-times" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredNotifications.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            <i className="fas fa-bell-slash text-3xl mb-2 opacity-30" />
            <p>{filter === 'unread' ? 'No unread notifications' : 'No notifications'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Notification Bell with badge
interface NotificationBellProps {
  count: number;
  onClick: () => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  count,
  onClick,
  className = '',
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={`relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.i
        className="fas fa-bell text-slate-600 dark:text-slate-400"
        animate={count > 0 ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.5 }}
      />
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
        >
          {count > 9 ? '9+' : count}
        </motion.span>
      )}
    </motion.button>
  );
};

// Toast-style notification popup
interface ToastNotificationProps {
  notification: Notification;
  onDismiss: () => void;
  duration?: number;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  onDismiss,
  duration = 5000,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const typeConfig = {
    info: { icon: 'fa-info-circle', color: 'border-blue-500' },
    success: { icon: 'fa-check-circle', color: 'border-emerald-500' },
    warning: { icon: 'fa-exclamation-triangle', color: 'border-amber-500' },
    error: { icon: 'fa-times-circle', color: 'border-red-500' },
    update: { icon: 'fa-arrow-up-circle', color: 'border-purple-500' },
    mention: { icon: 'fa-at', color: 'border-pink-500' },
  };

  const config = typeConfig[notification.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={`fixed bottom-4 right-4 max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-l-4 ${config.color} overflow-hidden z-50`}
    >
      <div className="p-4 flex gap-3">
        <i className={`fas ${config.icon} text-lg mt-0.5`} />
        <div className="flex-1">
          <div className="font-medium text-slate-900 dark:text-white">{notification.title}</div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{notification.message}</p>
        </div>
        <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600">
          <i className="fas fa-times" />
        </button>
      </div>

      {/* Progress bar */}
      <motion.div
        className="h-1 bg-accent"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
};

export default NotificationCenter;
