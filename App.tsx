
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import VideoStudio from './components/VideoStudio';
import AIStockGen from './components/AIStockGen';
import PDFSuite from './components/PDFSuite';
import ProPhoto from './components/ProPhoto';
import Assistant from './components/Assistant';
import BrandHub from './components/BrandHub';
import MarketingHub from './components/MarketingHub';
import FileManager from './components/FileManager';
import AssetHub from './components/AssetHub';
import TutorialOverlay from './components/TutorialOverlay';
import Personalization from './components/Personalization';
import ShortcutGuide from './components/ShortcutGuide';
import { StudioMode, ThemeColor } from './types';
import { syncToGoogleDrive } from './services/exportService';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<StudioMode>(StudioMode.WORKSPACE);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [theme, setTheme] = useState<ThemeColor>('indigo');
  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);

  const THEME_MAP: Record<ThemeColor, string> = {
    indigo: '#6366f1',
    emerald: '#10b981',
    rose: '#f43f5e',
    amber: '#f59e0b',
    violet: '#8b5cf6',
    slate: '#475569'
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', THEME_MAP[theme]);
    root.style.setProperty('--accent-soft', `${THEME_MAP[theme]}20`);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowShortcuts(false);
        return;
      }

      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              window.dispatchEvent(new CustomEvent('lumina-redo'));
            } else {
              window.dispatchEvent(new CustomEvent('lumina-undo'));
            }
            break;
          case 'y':
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('lumina-redo'));
            break;
          case 'd':
            e.preventDefault();
            setCurrentMode(StudioMode.WORKSPACE);
            break;
          case 'a':
            e.preventDefault();
            setCurrentMode(StudioMode.ASSETS);
            break;
          case '1':
            e.preventDefault();
            setCurrentMode(StudioMode.CANVAS);
            break;
          case '2':
            e.preventDefault();
            setCurrentMode(StudioMode.VIDEO);
            break;
          case 's':
            if (!e.shiftKey) {
               e.preventDefault();
               setCurrentMode(StudioMode.STOCK);
            }
            break;
          case 'p':
            e.preventDefault();
            setCurrentMode(StudioMode.PDF);
            break;
          case 'b':
            e.preventDefault();
            setCurrentMode(StudioMode.BRANDING);
            break;
          case 'm':
            e.preventDefault();
            setCurrentMode(StudioMode.MARKETING);
            break;
          case 'k':
            e.preventDefault();
            setCurrentMode(StudioMode.ASSISTANT);
            break;
          case '/':
            e.preventDefault();
            setShowShortcuts(prev => !prev);
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [theme]);

  const handleGlobalDriveSync = async () => {
    setIsGlobalSyncing(true);
    try {
      await syncToGoogleDrive({ mode: currentMode, timestamp: Date.now() }, "Lumina_Global_Sync");
    } catch (error) {
      console.error("Global sync failed", error);
    } finally {
      setTimeout(() => setIsGlobalSyncing(false), 2000);
    }
  };

  const renderContent = () => {
    switch (currentMode) {
      case StudioMode.WORKSPACE: return <FileManager />;
      case StudioMode.ASSETS: return <AssetHub />;
      case StudioMode.CANVAS: return <Canvas />;
      case StudioMode.VIDEO: return <VideoStudio />;
      case StudioMode.STOCK: return <AIStockGen />;
      case StudioMode.PDF: return <PDFSuite />;
      case StudioMode.PRO_PHOTO: return <ProPhoto />;
      case StudioMode.BRANDING: return <BrandHub />;
      case StudioMode.MARKETING: return <MarketingHub />;
      case StudioMode.ASSISTANT: return <Assistant />;
      case StudioMode.PERSONALIZATION: return <Personalization currentTheme={theme} setTheme={setTheme} />;
      default: return <FileManager />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900 antialiased font-sans">
      <style>{`
        .bg-accent { background-color: var(--accent); }
        .text-accent { color: var(--accent); }
        .border-accent { border-color: var(--accent); }
        .ring-accent { --tw-ring-color: var(--accent); }
        .bg-accent-soft { background-color: var(--accent-soft); }
        .shadow-accent { --tw-shadow: 0 10px 15px -3px var(--accent-soft), 0 4px 6px -4px var(--accent-soft); shadow: var(--tw-shadow); }
        
        @keyframes led-glow {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px var(--accent)); }
          50% { opacity: 0.6; filter: drop-shadow(0 0 8px var(--accent)); }
        }

        .led-track {
          background: rgba(0,0,0,0.05);
          display: flex;
          gap: 4px;
          padding: 4px;
          border-radius: 8px;
        }

        .led-dot {
          width: 8px;
          height: 8px;
          border-radius: 2px;
          background: rgba(0,0,0,0.1);
          transition: all 0.2s ease;
        }

        .led-dot.active {
          background: var(--accent);
          box-shadow: 0 0 10px var(--accent);
          animation: led-glow 2s infinite ease-in-out;
        }

        /* --- Scroll Animation Logic --- */
        @keyframes lumina-reveal {
          from { opacity: 0; transform: translateY(30px) scale(0.98); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        .scroll-reveal {
          animation: lumina-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-timeline: view();
          animation-range: entry 10% cover 30%;
        }

        /* Support for browsers without animation-timeline */
        @supports not (animation-timeline: view()) {
          .scroll-reveal {
            animation: lumina-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
        }

        .dark .led-track { background: rgba(255,255,255,0.05); }
        .dark .led-dot { background: rgba(255,255,255,0.1); }

        @keyframes lumina-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lumina-slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lumina-selection-glow {
          0% { box-shadow: 0 0 5px var(--accent-soft), 0 0 0 1px var(--accent); }
          50% { box-shadow: 0 0 15px var(--accent-soft), 0 0 0 2px var(--accent); }
          100% { box-shadow: 0 0 5px var(--accent-soft), 0 0 0 1px var(--accent); }
        }

        @keyframes lumina-dash-march {
          to { stroke-dashoffset: -10; }
        }
      `}</style>
      
      <Sidebar 
        currentMode={currentMode} 
        setMode={setCurrentMode} 
        onOpenShortcuts={() => setShowShortcuts(true)} 
        onDriveSync={handleGlobalDriveSync}
        isSyncing={isGlobalSyncing}
      />
      
      <main className="flex-1 h-full overflow-hidden relative">
        {renderContent()}
      </main>
      
      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
      <ShortcutGuide isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
};

export default App;
