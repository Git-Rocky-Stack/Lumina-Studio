import React, { useState, useEffect } from 'react';
import { StudioMode } from '../types';
import LEDProgressBar from './LEDProgressBar';
import UserMenu from './UserMenu';

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
    { id: StudioMode.PRO_PHOTO, icon: 'fa-image-portrait', label: 'Pro Photo' },
    { id: StudioMode.VIDEO, icon: 'fa-video', label: 'Video Studio' },
    { id: StudioMode.STOCK, icon: 'fa-camera-retro', label: 'AI Stock' },
    { id: StudioMode.PDF, icon: 'fa-file-pdf', label: 'PDF Suite' },
    { id: StudioMode.BRANDING, icon: 'fa-fingerprint', label: 'Brand Hub' },
    { id: StudioMode.MARKETING, icon: 'fa-bullhorn', label: 'Marketing' },
    { id: StudioMode.ASSISTANT, icon: 'fa-microphone', label: 'AI Assistant' },
  ];

  return (
    <aside className="w-20 md:w-64 bg-slate-900 text-white h-screen flex flex-col border-r border-slate-800 transition-all duration-300 z-50">
      <div className="p-6 mb-8">
        <h1 className="text-xl md:text-2xl font-bold tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-sm shadow-lg shadow-accent transition-all duration-500 hover:rotate-12">L</div>
          <span className="hidden md:block bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Lumina Studio</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98] ${
              currentMode === item.id
                ? 'bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10'
            }`}
          >
            <i className={`fas ${item.icon} text-lg w-6 transition-transform duration-300 group-hover:rotate-6 ${currentMode === item.id ? 'text-accent' : 'group-hover:text-accent'}`}></i>
            <span className="hidden md:block font-medium tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800 space-y-4">
        <div className="px-2">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between">
            System Logic <span>{isSyncing ? 'Linking...' : 'Ready'}</span>
          </p>
          <LEDProgressBar progress={isSyncing ? syncProgress : 100} segments={12} className="opacity-60" />
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setMode(StudioMode.PERSONALIZATION)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group hover:bg-white/5 ${
              currentMode === StudioMode.PERSONALIZATION ? 'bg-white/10 text-white border border-white/10' : 'text-slate-400 border border-transparent'
            }`}
          >
            <i className="fas fa-sliders text-lg w-6 transition-transform group-hover:rotate-12"></i>
            <span className="hidden md:block text-sm">Personalize</span>
          </button>
          <button
            onClick={onDriveSync}
            disabled={isSyncing}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-sm group ${
              isSyncing ? 'text-accent bg-white/5' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <i className={`fab fa-google text-lg w-6 transition-all duration-500 ${isSyncing ? 'fa-spin text-accent' : 'group-hover:scale-110 group-hover:text-accent'}`}></i>
            <span className="hidden md:block">{isSyncing ? 'Syncing...' : 'Drive Sync'}</span>
          </button>
        </div>

        {/* User profile menu */}
        <div className="pt-4 border-t border-slate-700/50">
          <UserMenu />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
