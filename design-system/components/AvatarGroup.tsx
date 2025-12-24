import React from 'react';
import { motion } from 'framer-motion';
import { Plus, User } from 'lucide-react';
import { springPresets } from '../animations';
import { StatusIndicator } from './Badge';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'offline' | 'busy' | 'away' | 'dnd';
  showStatus?: boolean;
  shape?: 'circle' | 'square';
  fallback?: 'initials' | 'icon';
  className?: string;
  onClick?: () => void;
}

const sizeConfig = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', status: 'w-1.5 h-1.5', ring: 'ring-1' },
  sm: { container: 'w-8 h-8', text: 'text-xs', status: 'w-2 h-2', ring: 'ring-2' },
  md: { container: 'w-10 h-10', text: 'text-sm', status: 'w-2.5 h-2.5', ring: 'ring-2' },
  lg: { container: 'w-12 h-12', text: 'text-base', status: 'w-3 h-3', ring: 'ring-2' },
  xl: { container: 'w-16 h-16', text: 'text-lg', status: 'w-3.5 h-3.5', ring: 'ring-2' },
  '2xl': { container: 'w-20 h-20', text: 'text-xl', status: 'w-4 h-4', ring: 'ring-2' },
};

// Generate consistent color from name
const getColorFromName = (name: string): string => {
  const colors = [
    'bg-gradient-to-br from-indigo-400 to-indigo-600',
    'bg-gradient-to-br from-purple-400 to-purple-600',
    'bg-gradient-to-br from-pink-400 to-pink-600',
    'bg-gradient-to-br from-red-400 to-red-600',
    'bg-gradient-to-br from-orange-400 to-orange-600',
    'bg-gradient-to-br from-amber-400 to-amber-600',
    'bg-gradient-to-br from-emerald-400 to-emerald-600',
    'bg-gradient-to-br from-teal-400 to-teal-600',
    'bg-gradient-to-br from-cyan-400 to-cyan-600',
    'bg-gradient-to-br from-blue-400 to-blue-600',
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

// Get initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  status,
  showStatus = false,
  shape = 'circle',
  fallback = 'initials',
  className = '',
  onClick,
}) => {
  const [imgError, setImgError] = React.useState(false);
  const config = sizeConfig[size];
  const showImage = src && !imgError;
  const initials = name ? getInitials(name) : '';
  const bgColor = name ? getColorFromName(name) : 'bg-zinc-200 dark:bg-zinc-700';

  return (
    <motion.div
      className={`
        relative inline-flex items-center justify-center
        ${config.container}
        ${shape === 'circle' ? 'rounded-full' : 'rounded-lg'}
        ${onClick ? 'cursor-pointer' : ''}
        overflow-hidden
        ${className}
      `}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center ${bgColor}`}>
          {fallback === 'initials' && initials ? (
            <span className={`font-semibold text-white ${config.text}`}>
              {initials}
            </span>
          ) : (
            <User className="w-1/2 h-1/2 text-zinc-400 dark:text-zinc-500" />
          )}
        </div>
      )}

      {/* Status indicator */}
      {showStatus && status && (
        <div className={`
          absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4
          ${config.ring} ring-white dark:ring-zinc-900 rounded-full
        `}>
          <StatusIndicator status={status} size={size === 'xs' || size === 'sm' ? 'sm' : 'md'} />
        </div>
      )}
    </motion.div>
  );
};

// Avatar Group
interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    name?: string;
    alt?: string;
  }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showAddButton?: boolean;
  onAddClick?: () => void;
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 5,
  size = 'md',
  showAddButton = false,
  onAddClick,
  className = '',
}) => {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;
  const config = sizeConfig[size];

  const overlapConfig = {
    xs: '-ml-1.5',
    sm: '-ml-2',
    md: '-ml-2.5',
    lg: '-ml-3',
    xl: '-ml-4',
  };

  return (
    <div className={`flex items-center ${className}`}>
      {visibleAvatars.map((avatar, index) => (
        <motion.div
          key={index}
          className={`
            ${index > 0 ? overlapConfig[size] : ''}
            ${config.ring} ring-white dark:ring-zinc-900 rounded-full
          `}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05, ...springPresets.snappy }}
          whileHover={{ zIndex: 10, scale: 1.1 }}
          style={{ zIndex: visibleAvatars.length - index }}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            alt={avatar.alt}
            size={size}
          />
        </motion.div>
      ))}

      {/* Remaining count */}
      {remainingCount > 0 && (
        <motion.div
          className={`
            ${overlapConfig[size]}
            ${config.container}
            ${config.ring} ring-white dark:ring-zinc-900
            rounded-full bg-zinc-100 dark:bg-zinc-800
            flex items-center justify-center
            ${config.text} font-medium text-zinc-600 dark:text-zinc-400
          `}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springPresets.snappy}
        >
          +{remainingCount}
        </motion.div>
      )}

      {/* Add button */}
      {showAddButton && (
        <motion.button
          onClick={onAddClick}
          className={`
            ${overlapConfig[size]}
            ${config.container}
            ${config.ring} ring-white dark:ring-zinc-900
            rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-600
            flex items-center justify-center
            text-zinc-400 dark:text-zinc-500
            hover:border-indigo-500 hover:text-indigo-500
            transition-colors
          `}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-1/2 h-1/2" />
        </motion.button>
      )}
    </div>
  );
};

// Avatar with presence ring (for video calls, etc.)
interface PresenceAvatarProps extends AvatarProps {
  speaking?: boolean;
  muted?: boolean;
}

export const PresenceAvatar: React.FC<PresenceAvatarProps> = ({
  speaking = false,
  muted = false,
  ...props
}) => {
  const config = sizeConfig[props.size || 'md'];

  return (
    <div className="relative">
      {/* Speaking ring animation */}
      {speaking && !muted && (
        <motion.div
          className={`
            absolute inset-0 rounded-full
            border-2 border-emerald-500
          `}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.8, 0.4, 0.8],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      <Avatar {...props} />

      {/* Muted indicator */}
      {muted && (
        <div className={`
          absolute -bottom-1 -right-1
          w-5 h-5 rounded-full
          bg-red-500 flex items-center justify-center
          ${config.ring} ring-white dark:ring-zinc-900
        `}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </div>
      )}
    </div>
  );
};

// Collaborative cursor presence
interface CursorPresenceProps {
  users: Array<{
    id: string;
    name: string;
    color: string;
    x: number;
    y: number;
  }>;
}

export const CursorPresence: React.FC<CursorPresenceProps> = ({ users }) => {
  return (
    <>
      {users.map((user) => (
        <motion.div
          key={user.id}
          className="fixed pointer-events-none z-50"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: user.x,
            y: user.y,
          }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: 'spring', damping: 30, stiffness: 500 }}
        >
          {/* Cursor */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={user.color}
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
          >
            <path d="M5.65 3.15l12.7 12.7-5.35.9-.9 5.35z" />
          </svg>

          {/* Name tag */}
          <div
            className="absolute left-4 top-5 px-2 py-0.5 rounded-full text-xs font-medium text-white whitespace-nowrap"
            style={{ backgroundColor: user.color }}
          >
            {user.name}
          </div>
        </motion.div>
      ))}
    </>
  );
};

export default Avatar;
