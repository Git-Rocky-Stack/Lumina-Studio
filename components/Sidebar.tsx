import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StudioMode } from '../types';
import LEDProgressBar from './LEDProgressBar';
import UserMenu from './UserMenu';
import { useAuthContext } from '../contexts/AuthContext';

interface SidebarProps {
  currentMode: StudioMode;
  setMode: (mode: StudioMode) => void;
  onOpenShortcuts: () => void;
  onDriveSync: () => void;
  isSyncing?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  setMode,
  onOpenShortcuts,
  onDriveSync,
  isSyncing = false
}) => {
  const [syncProgress, setSyncProgress] = useState(0);
  const { signOut } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  useEffect(() => {
    let interval: any;
    if (isSyncing) {
      setSyncProgress(0);
      interval = setInterval(() => {
        setSyncProgress(p => p < 100 ? p + 5 : 100);
      }, 100);
    } else {
      setSyncProgress(0);
    }
    return () => clearInterval(interval);
  }, [isSyncing]);

  const menuItems = [
    { id: StudioMode.WORKSPACE, icon: 'fa-house', label: 'Dashboard' },
    { id: StudioMode.ASSETS, icon: 'fa-boxes-stacked', label: 'Your Assets' },
    { id: StudioMode.CANVAS, icon: 'fa-layer-group', label: 'Canvas' },
    { id: StudioMode.TEMPLATES, icon: 'fa-wand-magic-sparkles', label: 'AI Templates' },
    { id: StudioMode.PRO_PHOTO, icon: 'fa-image-portrait', label: 'Pro Photo' },
    { id: StudioMode.VIDEO, icon: 'fa-video', label: 'Video Studio' },
    { id: StudioMode.STOCK, icon: 'fa-camera-retro', label: 'AI Stock' },
    { id: StudioMode.PDF, icon: 'fa-file-pdf', label: 'PDF Suite' },
    { id: StudioMode.BRANDING, icon: 'fa-fingerprint', label: 'Brand Hub' },
    { id: StudioMode.MARKETING, icon: 'fa-bullhorn', label: 'Marketing' },
    { id: StudioMode.ANALYTICS, icon: 'fa-chart-line', label: 'Analytics' },
    { id: StudioMode.ASSISTANT, icon: 'fa-microphone', label: 'AI Assistant' },
  ];

  return (
    <aside className="w-20 md:w-64 bg-slate-900 text-white h-screen flex flex-col border-r border-slate-800 transition-all duration-300 z-50">
      <div className="p-6 mb-8">
        {/* Typography: Custom brand lockup - matches type-section weight but smaller */}
        <Link to="/" className="flex items-center gap-2 group cursor-pointer" aria-label="Go to homepage">
          <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center type-micro shadow-elevated shadow-accent transition-all duration-500 group-hover:rotate-12 group-hover:scale-110">L</div>
          <span className="hidden md:flex items-center gap-2">
            <span className="text-[1.25rem] font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 group-hover:from-indigo-400 group-hover:to-violet-400 transition-all">Lumina Studio</span>
            <span className="px-1.5 py-0.5 type-micro bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg text-white">OS</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide" role="navigation" aria-label="Main navigation">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id)}
            aria-label={`Navigate to ${item.label}`}
            aria-current={currentMode === item.id ? 'page' : undefined}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98] ${
              currentMode === item.id
                ? 'bg-white/10 text-white border border-white/20 shadow-glow-subtle'
                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10'
            }`}
          >
            <i className={`fas ${item.icon} text-lg w-6 transition-transform duration-300 group-hover:rotate-6 ${currentMode === item.id ? 'text-accent' : 'group-hover:text-accent'}`} aria-hidden="true"></i>
            <span className="hidden md:block type-body font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800 space-y-4">
        <div className="px-2">
          <p className="type-micro text-slate-500 mb-2 flex items-center justify-between">
            System Logic <span>{isSyncing ? 'Linking...' : 'Ready'}</span>
          </p>
          <LEDProgressBar progress={isSyncing ? syncProgress : 100} segments={12} className="opacity-60" />
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setMode(StudioMode.FEATURES)}
            aria-label="View all features"
            aria-current={currentMode === StudioMode.FEATURES ? 'page' : undefined}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group hover:bg-white/5 ${
              currentMode === StudioMode.FEATURES ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 border border-transparent'
            }`}
          >
            <i className="fas fa-sparkles text-lg w-6 transition-transform group-hover:scale-110" aria-hidden="true"></i>
            <span className="hidden md:block type-body-sm">Features</span>
          </button>
          <button
            onClick={() => setMode(StudioMode.PERSONALIZATION)}
            aria-label="Open personalization settings"
            aria-current={currentMode === StudioMode.PERSONALIZATION ? 'page' : undefined}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group hover:bg-white/5 ${
              currentMode === StudioMode.PERSONALIZATION ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 border border-transparent'
            }`}
          >
            <i className="fas fa-sliders text-lg w-6 transition-transform group-hover:rotate-12" aria-hidden="true"></i>
            <span className="hidden md:block type-body-sm">Personalize</span>
          </button>
          <button
            onClick={onDriveSync}
            disabled={isSyncing}
            aria-label={isSyncing ? 'Syncing with Google Drive' : 'Sync with Google Drive'}
            aria-busy={isSyncing}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
              isSyncing ? 'text-accent bg-white/5' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <i className={`fab fa-google text-lg w-6 transition-all duration-500 ${isSyncing ? 'fa-spin text-accent' : 'group-hover:scale-110 group-hover:text-accent'}`} aria-hidden="true"></i>
            <span className="hidden md:block type-body-sm">{isSyncing ? 'Syncing...' : 'Drive Sync'}</span>
          </button>
        </div>

        {/* User profile menu */}
        <div className="pt-4 border-t border-slate-700/50">
          <UserMenu />
        </div>

        {/* Logout button */}
        <button
          onClick={handleSignOut}
          aria-label="Sign out of your account"
          className="w-full flex items-center gap-4 px-4 py-3 mt-2 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group border border-transparent hover:border-red-500/20"
        >
          <i className="fas fa-sign-out-alt text-lg w-6 transition-transform group-hover:-translate-x-0.5" aria-hidden="true"></i>
          <span className="hidden md:block type-body-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
