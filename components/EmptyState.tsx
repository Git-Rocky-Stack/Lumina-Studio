import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateAction {
  label: string;
  icon?: string;
  onClick: () => void;
  primary?: boolean;
}

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  illustration?: 'files' | 'images' | 'design' | 'video' | 'search';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actions = [],
  illustration,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-16 px-8 max-w-md mx-auto"
    >
      {/* Illustration or Icon */}
      <div className="relative mb-8">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-full blur-3xl scale-150" />

        {/* Icon container */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shadow-2xl"
        >
          <i className={`fas ${icon} text-4xl text-slate-400`} aria-hidden="true" />

          {/* Decorative elements */}
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <i className="fas fa-plus text-xs text-white" aria-hidden="true" />
          </div>
        </motion.div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>

      {/* Description */}
      <p className="text-slate-400 mb-8 leading-relaxed">{description}</p>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                action.primary
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.02]'
                  : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white'
              } ${actions.length === 1 ? 'w-full sm:w-auto' : 'flex-1'}`}
            >
              {action.icon && <i className={`fas ${action.icon}`} aria-hidden="true" />}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Tips section */}
      <div className="mt-10 pt-8 border-t border-white/10 w-full">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-4">
          Quick Tips
        </p>
        <div className="space-y-3 text-left">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <kbd className="px-2 py-1 rounded bg-white/5 text-xs font-mono">Ctrl+K</kbd>
            <span>Open command palette</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <kbd className="px-2 py-1 rounded bg-white/5 text-xs font-mono">Drag & Drop</kbd>
            <span>Upload files quickly</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Pre-configured empty states for common scenarios
export const EmptyStates = {
  NoProjects: (props: { onCreate: () => void; onUpload: () => void }) => (
    <EmptyState
      icon="fa-folder-open"
      title="Your creative workspace awaits"
      description="Start a new project from scratch or upload existing files to get started."
      actions={[
        { label: 'Create Project', icon: 'fa-plus', onClick: props.onCreate, primary: true },
        { label: 'Upload Files', icon: 'fa-upload', onClick: props.onUpload },
      ]}
    />
  ),

  NoAssets: (props: { onUpload: () => void; onGenerate: () => void }) => (
    <EmptyState
      icon="fa-images"
      title="No assets yet"
      description="Upload images, videos, and documents, or generate AI-powered visuals."
      actions={[
        { label: 'Upload Assets', icon: 'fa-upload', onClick: props.onUpload, primary: true },
        { label: 'Generate with AI', icon: 'fa-wand-magic-sparkles', onClick: props.onGenerate },
      ]}
    />
  ),

  NoSearchResults: (props: { onClear: () => void }) => (
    <EmptyState
      icon="fa-search"
      title="No results found"
      description="Try adjusting your search terms or filters to find what you're looking for."
      actions={[{ label: 'Clear Search', icon: 'fa-times', onClick: props.onClear }]}
    />
  ),

  NoVideos: (props: { onCreate: () => void }) => (
    <EmptyState
      icon="fa-video"
      title="Create your first video"
      description="Turn your designs into stunning animated videos with our AI-powered video studio."
      actions={[{ label: 'Create Video', icon: 'fa-plus', onClick: props.onCreate, primary: true }]}
    />
  ),

  NoBrandKit: (props: { onCreate: () => void }) => (
    <EmptyState
      icon="fa-fingerprint"
      title="Set up your brand"
      description="Add your logo, colors, and fonts to maintain consistency across all your designs."
      actions={[
        { label: 'Create Brand Kit', icon: 'fa-plus', onClick: props.onCreate, primary: true },
      ]}
    />
  ),
};

export default EmptyState;
