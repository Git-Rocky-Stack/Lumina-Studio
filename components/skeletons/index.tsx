import React from 'react';

/**
 * Base skeleton component with shimmer animation
 */
export const SkeletonBase: React.FC<{
  className?: string;
  children?: React.ReactNode;
}> = ({ className = '', children }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] ${className}`}
    style={{
      animation: 'shimmer 1.5s infinite linear',
    }}
  >
    {children}
    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
);

/**
 * Skeleton for text content
 */
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBase
        key={i}
        className={`h-4 rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
);

/**
 * Skeleton for card content
 */
export const SkeletonCard: React.FC<{
  className?: string;
  showImage?: boolean;
  showActions?: boolean;
}> = ({ className = '', showImage = true, showActions = true }) => (
  <div
    className={`bg-white rounded-2xl border border-slate-100 overflow-hidden ${className}`}
  >
    {showImage && (
      <SkeletonBase className="w-full h-48" />
    )}
    <div className="p-6 space-y-4">
      <SkeletonBase className="h-6 w-3/4 rounded" />
      <SkeletonText lines={2} />
      {showActions && (
        <div className="flex gap-3 pt-2">
          <SkeletonBase className="h-10 w-24 rounded-xl" />
          <SkeletonBase className="h-10 w-24 rounded-xl" />
        </div>
      )}
    </div>
  </div>
);

/**
 * Skeleton for list items
 */
export const SkeletonListItem: React.FC<{
  className?: string;
  showAvatar?: boolean;
}> = ({ className = '', showAvatar = true }) => (
  <div className={`flex items-center gap-4 p-4 ${className}`}>
    {showAvatar && (
      <SkeletonBase className="w-12 h-12 rounded-xl flex-shrink-0" />
    )}
    <div className="flex-1 space-y-2">
      <SkeletonBase className="h-4 w-3/4 rounded" />
      <SkeletonBase className="h-3 w-1/2 rounded" />
    </div>
    <SkeletonBase className="w-8 h-8 rounded-lg flex-shrink-0" />
  </div>
);

/**
 * Skeleton for asset grid
 */
export const SkeletonAssetGrid: React.FC<{
  count?: number;
  columns?: number;
  className?: string;
}> = ({ count = 6, columns = 3, className = '' }) => (
  <div
    className={`grid gap-4 ${className}`}
    style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="aspect-square">
        <SkeletonBase className="w-full h-full rounded-2xl" />
      </div>
    ))}
  </div>
);

/**
 * Skeleton for sidebar navigation
 */
export const SkeletonSidebar: React.FC<{
  itemCount?: number;
  className?: string;
}> = ({ itemCount = 8, className = '' }) => (
  <div className={`space-y-4 p-4 ${className}`}>
    <SkeletonBase className="h-12 w-12 rounded-2xl mx-auto mb-8" />
    {Array.from({ length: itemCount }).map((_, i) => (
      <SkeletonBase key={i} className="h-10 w-10 rounded-xl mx-auto" />
    ))}
  </div>
);

/**
 * Skeleton for canvas/editor area
 */
export const SkeletonCanvas: React.FC<{
  className?: string;
}> = ({ className = '' }) => (
  <div className={`flex flex-col h-full ${className}`}>
    {/* Toolbar skeleton */}
    <div className="h-14 bg-white border-b border-slate-100 px-8 flex items-center gap-6">
      <div className="flex gap-4">
        <SkeletonBase className="w-10 h-10 rounded-xl" />
        <SkeletonBase className="w-10 h-10 rounded-xl" />
        <SkeletonBase className="w-10 h-10 rounded-xl" />
      </div>
      <div className="flex-1" />
      <div className="flex gap-4">
        <SkeletonBase className="w-32 h-10 rounded-xl" />
        <SkeletonBase className="w-32 h-10 rounded-xl" />
      </div>
    </div>

    {/* Main content skeleton */}
    <div className="flex-1 flex">
      {/* Side panel skeleton */}
      <div className="w-20 bg-white border-r border-slate-100 p-4">
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBase key={i} className="w-12 h-12 rounded-2xl mx-auto" />
          ))}
        </div>
      </div>

      {/* Canvas area skeleton */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-12">
        <SkeletonBase className="w-[500px] h-[700px] rounded-3xl" />
      </div>

      {/* Right panel skeleton */}
      <div className="w-80 bg-white border-l border-slate-100 p-8">
        <SkeletonBase className="h-6 w-3/4 rounded mb-6" />
        <div className="space-y-4">
          <SkeletonBase className="h-24 w-full rounded-2xl" />
          <SkeletonBase className="h-12 w-full rounded-xl" />
          <SkeletonBase className="h-12 w-full rounded-xl" />
          <SkeletonBase className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Skeleton for video studio
 */
export const SkeletonVideoStudio: React.FC<{
  className?: string;
}> = ({ className = '' }) => (
  <div className={`flex flex-col h-full bg-[#050505] ${className}`}>
    {/* Header skeleton */}
    <div className="h-16 border-b border-white/5 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SkeletonBase className="w-10 h-10 rounded-2xl bg-slate-800" />
        <SkeletonBase className="w-48 h-6 rounded bg-slate-800" />
      </div>
      <div className="flex gap-4">
        <SkeletonBase className="w-32 h-10 rounded-2xl bg-slate-800" />
        <SkeletonBase className="w-32 h-10 rounded-2xl bg-slate-800" />
      </div>
    </div>

    {/* Main content */}
    <div className="flex-1 flex">
      {/* Left sidebar */}
      <div className="w-80 bg-[#0A0A0B] border-r border-white/5 p-8 space-y-8">
        <SkeletonBase className="h-6 w-1/2 rounded bg-slate-800" />
        <SkeletonBase className="h-14 w-full rounded-2xl bg-slate-800" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBase key={i} className="h-16 w-full rounded-3xl bg-slate-800" />
          ))}
        </div>
      </div>

      {/* Center viewport */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-12">
          <SkeletonBase className="w-full max-w-4xl aspect-video rounded-3xl bg-slate-800" />
        </div>
        {/* Timeline */}
        <div className="h-64 border-t border-white/5 p-6">
          <SkeletonBase className="h-6 w-48 rounded mb-6 bg-slate-800" />
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBase key={i} className="w-40 h-32 rounded-2xl bg-slate-800" />
            ))}
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-80 bg-[#0A0A0B] border-l border-white/5 p-8 space-y-6">
        <SkeletonBase className="h-6 w-3/4 rounded bg-slate-800" />
        <SkeletonBase className="h-24 w-full rounded-2xl bg-slate-800" />
        <SkeletonBase className="h-12 w-full rounded-xl bg-slate-800" />
        <SkeletonBase className="h-12 w-full rounded-xl bg-slate-800" />
      </div>
    </div>
  </div>
);

/**
 * Skeleton for dashboard/workspace
 */
export const SkeletonWorkspace: React.FC<{
  className?: string;
}> = ({ className = '' }) => (
  <div className={`p-8 space-y-8 ${className}`}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <SkeletonBase className="h-8 w-64 rounded mb-2" />
        <SkeletonBase className="h-4 w-48 rounded" />
      </div>
      <div className="flex gap-4">
        <SkeletonBase className="h-10 w-32 rounded-xl" />
        <SkeletonBase className="h-10 w-32 rounded-xl" />
      </div>
    </div>

    {/* Stats cards */}
    <div className="grid grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100">
          <SkeletonBase className="h-4 w-24 rounded mb-4" />
          <SkeletonBase className="h-8 w-16 rounded" />
        </div>
      ))}
    </div>

    {/* Recent projects */}
    <div>
      <SkeletonBase className="h-6 w-48 rounded mb-6" />
      <div className="grid grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  </div>
);

/**
 * Full page loading skeleton
 */
export const SkeletonFullPage: React.FC<{
  message?: string;
}> = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-screen bg-slate-50">
    <div className="text-center space-y-6">
      <div className="relative w-20 h-20 mx-auto">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-accent animate-spin"></div>
      </div>
      <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">
        {message}
      </p>
    </div>
  </div>
);

export default {
  Base: SkeletonBase,
  Text: SkeletonText,
  Card: SkeletonCard,
  ListItem: SkeletonListItem,
  AssetGrid: SkeletonAssetGrid,
  Sidebar: SkeletonSidebar,
  Canvas: SkeletonCanvas,
  VideoStudio: SkeletonVideoStudio,
  Workspace: SkeletonWorkspace,
  FullPage: SkeletonFullPage,
};
