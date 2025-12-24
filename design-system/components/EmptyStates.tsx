/**
 * Empty States Component
 * Beautiful illustrated empty states for various scenarios
 */

import React from 'react';

interface EmptyStateProps {
  type: 'projects' | 'assets' | 'search' | 'favorites' | 'history' | 'comments' | 'notifications' | 'team' | 'uploads' | 'ai-results';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const illustrations: Record<EmptyStateProps['type'], React.ReactNode> = {
  projects: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <rect x="30" y="40" width="140" height="100" rx="12" fill="currentColor" className="text-slate-100" />
      <rect x="40" y="50" width="60" height="40" rx="8" fill="currentColor" className="text-slate-200" />
      <rect x="110" y="50" width="50" height="18" rx="4" fill="currentColor" className="text-accent/20" />
      <rect x="110" y="75" width="50" height="8" rx="2" fill="currentColor" className="text-slate-200" />
      <rect x="110" y="88" width="30" height="8" rx="2" fill="currentColor" className="text-slate-200" />
      <rect x="40" y="100" width="120" height="30" rx="6" fill="currentColor" className="text-slate-50" />
      <circle cx="55" cy="115" r="8" fill="currentColor" className="text-accent/30" />
      <rect x="70" y="110" width="40" height="4" rx="2" fill="currentColor" className="text-slate-200" />
      <rect x="70" y="118" width="60" height="4" rx="2" fill="currentColor" className="text-slate-100" />
      <circle cx="160" cy="30" r="20" fill="currentColor" className="text-accent/10" />
      <path d="M155 30L160 35L168 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-accent" />
    </svg>
  ),
  assets: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <rect x="20" y="30" width="70" height="55" rx="10" fill="currentColor" className="text-slate-100" />
      <rect x="30" y="40" width="50" height="35" rx="6" fill="currentColor" className="text-emerald-100" />
      <circle cx="45" cy="52" r="6" fill="currentColor" className="text-emerald-300" />
      <path d="M30 65L45 55L60 65L80 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-emerald-400" />
      <rect x="110" y="30" width="70" height="55" rx="10" fill="currentColor" className="text-slate-100" />
      <rect x="120" y="40" width="50" height="35" rx="6" fill="currentColor" className="text-violet-100" />
      <rect x="130" y="50" width="30" height="3" rx="1.5" fill="currentColor" className="text-violet-300" />
      <rect x="130" y="57" width="20" height="3" rx="1.5" fill="currentColor" className="text-violet-200" />
      <rect x="130" y="64" width="25" height="3" rx="1.5" fill="currentColor" className="text-violet-200" />
      <rect x="65" y="95" width="70" height="55" rx="10" fill="currentColor" className="text-slate-100" />
      <rect x="75" y="105" width="50" height="35" rx="6" fill="currentColor" className="text-amber-100" />
      <polygon points="100,115 90,130 110,130" fill="currentColor" className="text-amber-400" />
      <circle cx="85" cy="118" r="4" fill="currentColor" className="text-amber-300" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <circle cx="90" cy="70" r="40" fill="currentColor" className="text-slate-100" strokeWidth="8" stroke="currentColor" />
      <circle cx="90" cy="70" r="35" fill="currentColor" className="text-slate-50" />
      <line x1="120" y1="100" x2="150" y2="130" stroke="currentColor" strokeWidth="12" strokeLinecap="round" className="text-slate-200" />
      <line x1="122" y1="102" x2="148" y2="128" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-accent/40" />
      <path d="M75 60C75 60 80 50 90 50C100 50 105 60 105 60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-slate-300" />
      <circle cx="80" cy="72" r="3" fill="currentColor" className="text-slate-300" />
      <circle cx="100" cy="72" r="3" fill="currentColor" className="text-slate-300" />
      <path d="M82 82C82 82 86 88 90 88C94 88 98 82 98 82" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-300" />
    </svg>
  ),
  favorites: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <path d="M100 30L115 65L155 70L125 98L133 138L100 118L67 138L75 98L45 70L85 65L100 30Z" fill="currentColor" className="text-amber-100" />
      <path d="M100 40L112 68L145 72L120 95L127 130L100 113L73 130L80 95L55 72L88 68L100 40Z" fill="currentColor" stroke="currentColor" strokeWidth="2" className="text-amber-400" />
      <circle cx="45" cy="45" r="8" fill="currentColor" className="text-amber-200" />
      <circle cx="155" cy="45" r="6" fill="currentColor" className="text-amber-100" />
      <circle cx="160" cy="120" r="10" fill="currentColor" className="text-amber-100" />
      <path d="M156 120L160 124L168 116" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <circle cx="100" cy="80" r="50" fill="currentColor" className="text-slate-100" />
      <circle cx="100" cy="80" r="45" fill="currentColor" className="text-slate-50" />
      <circle cx="100" cy="80" r="4" fill="currentColor" className="text-accent" />
      <line x1="100" y1="80" x2="100" y2="50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-accent" />
      <line x1="100" y1="80" x2="120" y2="90" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-slate-400" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
        <line
          key={i}
          x1={100 + 40 * Math.cos((deg * Math.PI) / 180)}
          y1={80 + 40 * Math.sin((deg * Math.PI) / 180)}
          x2={100 + 45 * Math.cos((deg * Math.PI) / 180)}
          y2={80 + 45 * Math.sin((deg * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth={deg % 90 === 0 ? 3 : 1}
          className="text-slate-300"
        />
      ))}
      <path d="M40 60C30 80 30 100 40 120" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-accent/40" strokeDasharray="4 4" />
      <polygon points="35,55 45,55 40,65" fill="currentColor" className="text-accent/40" />
    </svg>
  ),
  comments: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <rect x="40" y="30" width="120" height="80" rx="16" fill="currentColor" className="text-slate-100" />
      <path d="M60 110L80 90H40V110L60 110Z" fill="currentColor" className="text-slate-100" />
      <rect x="55" y="50" width="60" height="6" rx="3" fill="currentColor" className="text-slate-200" />
      <rect x="55" y="62" width="80" height="6" rx="3" fill="currentColor" className="text-slate-200" />
      <rect x="55" y="74" width="40" height="6" rx="3" fill="currentColor" className="text-slate-200" />
      <circle cx="145" cy="45" r="15" fill="currentColor" className="text-accent/20" />
      <path d="M140 45L144 49L152 41" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent" />
      <circle cx="160" cy="120" r="20" fill="currentColor" className="text-emerald-100" />
      <rect x="150" y="115" width="20" height="3" rx="1.5" fill="currentColor" className="text-emerald-300" />
      <rect x="150" y="122" width="14" height="3" rx="1.5" fill="currentColor" className="text-emerald-200" />
    </svg>
  ),
  notifications: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <path d="M100 20C75 20 55 40 55 65V95L45 110H155L145 95V65C145 40 125 20 100 20Z" fill="currentColor" className="text-slate-100" />
      <ellipse cx="100" cy="130" rx="15" ry="10" fill="currentColor" className="text-slate-200" />
      <circle cx="130" cy="40" r="18" fill="currentColor" className="text-rose-100" />
      <text x="130" y="46" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="bold" className="text-rose-500">0</text>
      <path d="M85 75H115M85 90H105" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-slate-200" />
      <circle cx="60" cy="55" r="4" fill="currentColor" className="text-accent/30" />
      <circle cx="140" cy="85" r="3" fill="currentColor" className="text-accent/20" />
    </svg>
  ),
  team: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <circle cx="100" cy="50" r="25" fill="currentColor" className="text-accent/20" />
      <circle cx="100" cy="45" r="12" fill="currentColor" className="text-accent/40" />
      <ellipse cx="100" cy="70" rx="18" ry="10" fill="currentColor" className="text-accent/40" />
      <circle cx="55" cy="70" r="20" fill="currentColor" className="text-slate-100" />
      <circle cx="55" cy="66" r="10" fill="currentColor" className="text-slate-200" />
      <ellipse cx="55" cy="82" rx="14" ry="8" fill="currentColor" className="text-slate-200" />
      <circle cx="145" cy="70" r="20" fill="currentColor" className="text-slate-100" />
      <circle cx="145" cy="66" r="10" fill="currentColor" className="text-slate-200" />
      <ellipse cx="145" cy="82" rx="14" ry="8" fill="currentColor" className="text-slate-200" />
      <rect x="40" y="100" width="120" height="40" rx="8" fill="currentColor" className="text-slate-50" />
      <rect x="50" y="110" width="100" height="4" rx="2" fill="currentColor" className="text-slate-200" />
      <rect x="50" y="120" width="60" height="4" rx="2" fill="currentColor" className="text-slate-100" />
    </svg>
  ),
  uploads: (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <rect x="40" y="50" width="120" height="90" rx="12" fill="currentColor" className="text-slate-100" strokeWidth="3" stroke="currentColor" strokeDasharray="8 4" />
      <circle cx="100" cy="90" r="25" fill="currentColor" className="text-accent/10" />
      <path d="M100 75L100 105" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-accent" />
      <path d="M88 87L100 75L112 87" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-accent" />
      <rect x="75" y="120" width="50" height="8" rx="4" fill="currentColor" className="text-slate-200" />
      <circle cx="155" cy="40" r="15" fill="currentColor" className="text-emerald-100" />
      <path d="M150 40L154 44L162 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500" />
    </svg>
  ),
  'ai-results': (
    <svg viewBox="0 0 200 160" fill="none" className="w-full h-full">
      <rect x="30" y="40" width="140" height="100" rx="16" fill="currentColor" className="text-slate-100" />
      <circle cx="100" cy="80" r="30" fill="currentColor" className="text-violet-100" />
      <circle cx="100" cy="80" r="20" fill="currentColor" className="text-violet-200" />
      <circle cx="100" cy="80" r="10" fill="currentColor" className="text-violet-300" />
      <circle cx="100" cy="80" r="4" fill="currentColor" className="text-accent" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
        <circle
          key={i}
          cx={100 + 35 * Math.cos((deg * Math.PI) / 180)}
          cy={80 + 35 * Math.sin((deg * Math.PI) / 180)}
          r="4"
          fill="currentColor"
          className="text-accent/40"
        />
      ))}
      <path d="M55 120H85M115 120H145" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-slate-200" />
      <circle cx="165" cy="35" r="12" fill="currentColor" className="text-amber-100" />
      <path d="M165 30L165 40M160 35L170 35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-400" />
    </svg>
  ),
};

const defaultContent: Record<EmptyStateProps['type'], { title: string; description: string }> = {
  projects: {
    title: 'No projects yet',
    description: 'Create your first project to get started with Lumina Studio.',
  },
  assets: {
    title: 'No assets found',
    description: 'Upload images, videos, or documents to build your asset library.',
  },
  search: {
    title: 'No results found',
    description: 'Try adjusting your search terms or filters to find what you need.',
  },
  favorites: {
    title: 'No favorites yet',
    description: 'Star your favorite projects and assets for quick access.',
  },
  history: {
    title: 'No version history',
    description: 'Changes to your project will be tracked here automatically.',
  },
  comments: {
    title: 'No comments yet',
    description: 'Start a conversation by leaving a comment on the canvas.',
  },
  notifications: {
    title: 'All caught up!',
    description: 'You have no new notifications at this time.',
  },
  team: {
    title: 'No team members',
    description: 'Invite collaborators to work together on this project.',
  },
  uploads: {
    title: 'Drop files here',
    description: 'Drag and drop files or click to browse from your device.',
  },
  'ai-results': {
    title: 'No AI results yet',
    description: 'Generate content using AI to see results here.',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}) => {
  const content = defaultContent[type];
  const illustration = illustrations[type];

  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in-95 duration-500 ${className}`}>
      <div className="w-48 h-36 mb-8 opacity-80">
        {illustration}
      </div>

      <h3 className="text-lg font-bold text-slate-700 mb-2">
        {title || content.title}
      </h3>

      <p className="text-sm text-slate-500 max-w-xs mb-6 leading-relaxed">
        {description || content.description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-accent text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-accent/20 flex items-center gap-2 hover:scale-105 active:scale-95"
        >
          {action.icon && <i className={`fas ${action.icon}`} />}
          {action.label}
        </button>
      )}

      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          className="mt-3 text-sm text-slate-500 hover:text-accent transition-colors font-medium"
        >
          {secondaryAction.label}
        </button>
      )}
    </div>
  );
};

// Compact variant for sidebars/panels
export const EmptyStateCompact: React.FC<Omit<EmptyStateProps, 'secondaryAction'>> = ({
  type,
  title,
  description,
  action,
  className = '',
}) => {
  const content = defaultContent[type];
  const illustration = illustrations[type];

  return (
    <div className={`flex flex-col items-center justify-center text-center p-4 ${className}`}>
      <div className="w-24 h-20 mb-4 opacity-60">
        {illustration}
      </div>

      <h4 className="text-sm font-semibold text-slate-600 mb-1">
        {title || content.title}
      </h4>

      <p className="text-xs text-slate-400 max-w-[200px] mb-4">
        {description || content.description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-accent hover:text-white transition-all flex items-center gap-1.5"
        >
          {action.icon && <i className={`fas ${action.icon} text-[10px]`} />}
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
