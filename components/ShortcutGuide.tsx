
import React from 'react';

interface ShortcutGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutGuide: React.FC<ShortcutGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sections = [
    {
      title: 'Navigation',
      shortcuts: [
        { key: '⌘ + D', label: 'Command Bay (Dashboard)' },
        { key: '⌘ + A', label: 'Asset Hub' },
        { key: '⌘ + 1', label: 'Design Canvas' },
        { key: '⌘ + 2', label: 'Video Studio' },
        { key: '⌘ + S', label: 'AI Stock Gen' },
        { key: '⌘ + P', label: 'PDF Suite' },
        { key: '⌘ + B', label: 'Brand Hub' },
        { key: '⌘ + M', label: 'Marketing Hub' },
      ],
    },
    {
      title: 'AI & Intelligence',
      shortcuts: [
        { key: '⌘ + K', label: 'Summon AI Assistant' },
        { key: '⌘ + G', label: 'Generate / Synthesize (Contextual)' },
        { key: '⌘ + I', label: 'AI Asset Audit' },
        { key: '⌘ + Shift + V', label: 'Toggle Voice Mode' },
      ],
    },
    {
      title: 'Global Actions',
      shortcuts: [
        { key: '⌘ + Enter', label: 'Quick Export / Publish' },
        { key: '⌘ + S (Hold)', label: 'Force Cloud Sync' },
        { key: '⌘ + /', label: 'Toggle This Guide' },
        { key: 'Esc', label: 'Close Modals / Overlays' },
      ],
    },
    {
      title: 'Editor (Canvas/Video)',
      shortcuts: [
        { key: '⌘ + Z', label: 'Undo Last Action' },
        { key: '⌘ + Y', label: 'Redo Last Action' },
        { key: 'Backspace', label: 'Delete Selected Element' },
        { key: 'L', label: 'Toggle Element Lock' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-5xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500 border border-slate-100">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-accent via-purple-500 to-rose-500"></div>
        
        <header className="p-12 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Command Reference</h2>
            <p className="text-slate-500 font-medium text-sm tracking-widest uppercase mt-2">Lumina Studio Control Protocols</p>
          </div>
          <button 
            onClick={onClose}
            className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:rotate-90 transition-all border border-slate-100 shadow-sm"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </header>

        <div className="p-12 overflow-y-auto max-h-[70vh] scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12">
            {sections.map((section) => (
              <div key={section.title} className="space-y-6">
                <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.4em] pb-2 border-b border-accent/10">
                  {section.title}
                </h3>
                <div className="space-y-4">
                  {section.shortcuts.map((s) => (
                    <div key={s.label} className="flex items-center justify-between group">
                      <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                        {s.label}
                      </span>
                      <kbd className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest min-w-[100px] text-center shadow-lg border border-white/10 group-hover:scale-105 transition-transform">
                        {s.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="p-10 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Press <kbd className="bg-white border border-slate-200 px-2 py-1 rounded text-slate-900">Esc</kbd> or <kbd className="bg-white border border-slate-200 px-2 py-1 rounded text-slate-900">⌘ /</kbd> to dismiss this protocol.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ShortcutGuide;
