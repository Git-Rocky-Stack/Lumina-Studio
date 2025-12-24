/**
 * Skeleton Loading Components
 *
 * Content-aware skeleton placeholders with shimmer animation.
 * Designed to match the exact layout of final content for seamless loading.
 */

import React from 'react';
import { motion } from 'framer-motion';

// ============================================================================
// BASE SKELETON
// ============================================================================

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  animate?: boolean;
}

const roundedMap = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md',
  animate = true,
}) => {
  return (
    <div
      className={`
        relative overflow-hidden
        bg-slate-200 dark:bg-slate-700
        ${roundedMap[rounded]}
        ${className}
      `}
      style={{ width, height }}
      aria-hidden="true"
    >
      {animate && (
        <motion.div
          className="absolute inset-0 -translate-x-full"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          }}
          animate={{
            translateX: ['−100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );
};

// ============================================================================
// SKELETON TEXT
// ============================================================================

interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className = '',
  lastLineWidth = '60%',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          className={i === lines - 1 ? '' : 'w-full'}
          style={{ width: i === lines - 1 ? lastLineWidth : '100%' } as any}
        />
      ))}
    </div>
  );
};

// ============================================================================
// SKELETON AVATAR
// ============================================================================

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const avatarSizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 'md',
  className = '',
}) => {
  return (
    <Skeleton
      rounded="full"
      className={`${avatarSizes[size]} ${className}`}
    />
  );
};

// ============================================================================
// SKELETON CARD
// ============================================================================

interface SkeletonCardProps {
  hasImage?: boolean;
  imageHeight?: number;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  hasImage = true,
  imageHeight = 200,
  className = '',
}) => {
  return (
    <div className={`rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
      {hasImage && (
        <Skeleton height={imageHeight} rounded="none" />
      )}
      <div className="p-4 space-y-3">
        <Skeleton height={20} width="70%" rounded="md" />
        <SkeletonText lines={2} />
        <div className="flex items-center gap-2 pt-2">
          <SkeletonAvatar size="sm" />
          <Skeleton height={14} width={100} rounded="md" />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SKELETON TABLE ROW
// ============================================================================

interface SkeletonTableRowProps {
  columns?: number;
  className?: string;
}

export const SkeletonTableRow: React.FC<SkeletonTableRowProps> = ({
  columns = 4,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-4 py-3 px-4 ${className}`}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          className={i === 0 ? 'w-[30%]' : 'flex-1'}
          rounded="md"
        />
      ))}
    </div>
  );
};

// ============================================================================
// SKELETON LIST ITEM
// ============================================================================

interface SkeletonListItemProps {
  hasAvatar?: boolean;
  hasSubtitle?: boolean;
  hasAction?: boolean;
  className?: string;
}

export const SkeletonListItem: React.FC<SkeletonListItemProps> = ({
  hasAvatar = true,
  hasSubtitle = true,
  hasAction = false,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-3 py-3 ${className}`}>
      {hasAvatar && <SkeletonAvatar size="md" />}
      <div className="flex-1 space-y-2">
        <Skeleton height={16} width="60%" rounded="md" />
        {hasSubtitle && <Skeleton height={12} width="40%" rounded="md" />}
      </div>
      {hasAction && <Skeleton height={32} width={80} rounded="lg" />}
    </div>
  );
};

// ============================================================================
// SKELETON BUTTON
// ============================================================================

interface SkeletonButtonProps {
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  className?: string;
}

const buttonSizes = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
};

export const SkeletonButton: React.FC<SkeletonButtonProps> = ({
  size = 'md',
  width = 100,
  className = '',
}) => {
  return (
    <Skeleton
      width={width}
      className={`${buttonSizes[size]} ${className}`}
      rounded="lg"
    />
  );
};

// ============================================================================
// SKELETON IMAGE
// ============================================================================

interface SkeletonImageProps {
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2' | '21:9';
  className?: string;
}

const aspectRatioMap = {
  '1:1': 'aspect-square',
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '3:2': 'aspect-[3/2]',
  '21:9': 'aspect-[21/9]',
};

export const SkeletonImage: React.FC<SkeletonImageProps> = ({
  aspectRatio = '16:9',
  className = '',
}) => {
  return (
    <Skeleton
      className={`w-full ${aspectRatioMap[aspectRatio]} ${className}`}
      rounded="xl"
    />
  );
};

// ============================================================================
// SKELETON STATS CARD
// ============================================================================

interface SkeletonStatsCardProps {
  className?: string;
}

export const SkeletonStatsCard: React.FC<SkeletonStatsCardProps> = ({
  className = '',
}) => {
  return (
    <div className={`p-4 rounded-xl border border-slate-200 dark:border-slate-700 ${className}`}>
      <Skeleton height={12} width={80} rounded="md" className="mb-2" />
      <Skeleton height={32} width={100} rounded="md" className="mb-1" />
      <Skeleton height={10} width={60} rounded="md" />
    </div>
  );
};

// ============================================================================
// SKELETON FILE MANAGER CARD (Specific to Lumina)
// ============================================================================

export const SkeletonFileCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
      <Skeleton height={160} rounded="none" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton width={24} height={24} rounded="md" />
          <Skeleton height={16} width="60%" rounded="md" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton height={12} width={80} rounded="md" />
          <Skeleton height={12} width={60} rounded="md" />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SKELETON CANVAS LAYER (Specific to Lumina)
// ============================================================================

export const SkeletonCanvasLayer: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${className}`}>
      <Skeleton width={40} height={40} rounded="lg" />
      <div className="flex-1 space-y-2">
        <Skeleton height={14} width="70%" rounded="md" />
        <Skeleton height={10} width="40%" rounded="md" />
      </div>
      <div className="flex gap-1">
        <Skeleton width={24} height={24} rounded="md" />
        <Skeleton width={24} height={24} rounded="md" />
      </div>
    </div>
  );
};

// ============================================================================
// SKELETON TEMPLATE CARD (Specific to Lumina)
// ============================================================================

export const SkeletonTemplateCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <Skeleton className="aspect-[4/5] w-full" rounded="none" />
      <div className="p-3 space-y-2">
        <Skeleton height={14} width="80%" rounded="md" />
        <div className="flex gap-2">
          <Skeleton height={20} width={50} rounded="full" />
          <Skeleton height={20} width={40} rounded="full" />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STAGGERED SKELETON GROUP
// ============================================================================

interface StaggeredSkeletonProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const StaggeredSkeleton: React.FC<StaggeredSkeletonProps> = ({
  children,
  staggerDelay = 0.1,
  className = '',
}) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.3 }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonListItem,
  SkeletonButton,
  SkeletonImage,
  SkeletonStatsCard,
  SkeletonFileCard,
  SkeletonCanvasLayer,
  SkeletonTemplateCard,
  StaggeredSkeleton,
};
