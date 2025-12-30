import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Project {
  id: string;
  name: string;
  thumbnail: string;
  type: 'design' | 'video' | 'photo' | 'document';
  lastModified: Date;
  starred?: boolean;
}

const STORAGE_KEY = 'lumina_recent_projects';

// Demo projects for new users
const demoProjects: Project[] = [
  {
    id: 'demo-1',
    name: 'Social Media Banner',
    thumbnail: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=300&h=200&fit=crop',
    type: 'design',
    lastModified: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
  },
  {
    id: 'demo-2',
    name: 'Product Showcase',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&h=200&fit=crop',
    type: 'design',
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: 'demo-3',
    name: 'Brand Introduction',
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=300&h=200&fit=crop',
    type: 'video',
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
];

interface RecentProjectsProps {
  onProjectClick?: (project: Project) => void;
  onNewProject?: () => void;
  maxItems?: number;
  className?: string;
}

const RecentProjects: React.FC<RecentProjectsProps> = ({
  onProjectClick,
  onNewProject,
  maxItems = 6,
  className = '',
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProjects(parsed.map((p: any) => ({
          ...p,
          lastModified: new Date(p.lastModified),
        })));
      } catch (e) {
        setProjects(demoProjects);
      }
    } else {
      setProjects(demoProjects);
    }
    setIsLoading(false);
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const typeIcons: Record<string, { icon: string; color: string }> = {
    design: { icon: 'fa-layer-group', color: 'text-indigo-400' },
    video: { icon: 'fa-video', color: 'text-violet-400' },
    photo: { icon: 'fa-image', color: 'text-emerald-400' },
    document: { icon: 'fa-file-pdf', color: 'text-amber-400' },
  };

  const toggleStar = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(projects.map(p =>
      p.id === projectId ? { ...p, starred: !p.starred } : p
    ));
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-xl bg-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="type-subsection text-white flex items-center gap-3">
          <i className="fas fa-clock-rotate-left text-slate-400" aria-hidden="true" />
          Recent Projects
        </h3>
        <button
          onClick={onNewProject}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white type-body-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <i className="fas fa-plus" aria-hidden="true" />
          New Project
        </button>
      </div>

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-white/5">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700 flex items-center justify-center">
            <i className="fas fa-folder-open text-2xl text-slate-500" aria-hidden="true" />
          </div>
          <p className="text-slate-400 mb-4">No recent projects</p>
          <button
            onClick={onNewProject}
            className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white type-body-sm font-semibold hover:bg-indigo-600 transition-colors"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {projects.slice(0, maxItems).map((project, index) => (
            <motion.button
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onProjectClick?.(project)}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-800 border border-white/5 hover:border-indigo-500/50 transition-all text-left"
            >
              {/* Thumbnail */}
              <img
                src={project.thumbnail}
                alt={project.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <i className={`fas ${typeIcons[project.type].icon} ${typeIcons[project.type].color} text-xs`} aria-hidden="true" />
                  <span className="text-xs text-slate-400">{formatTime(project.lastModified)}</span>
                </div>
                <p className="text-white font-medium text-sm truncate">{project.name}</p>
              </div>

              {/* Star button */}
              <button
                onClick={(e) => toggleStar(project.id, e)}
                aria-label={project.starred ? 'Remove from favorites' : 'Add to favorites'}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-slate-900/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-800"
              >
                <i
                  className={`fas fa-star text-sm ${project.starred ? 'text-amber-400' : 'text-slate-500'}`}
                  aria-hidden="true"
                />
              </button>

              {/* Hover actions */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="px-4 py-2 rounded-xl bg-indigo-500 text-white type-body-sm font-semibold shadow-lg shadow-indigo-500/30">
                  Open Project
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* View all link */}
      {projects.length > maxItems && (
        <div className="mt-6 text-center">
          <button className="text-indigo-400 hover:text-indigo-300 type-body-sm font-semibold transition-colors">
            View all projects ({projects.length}) →
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentProjects;
