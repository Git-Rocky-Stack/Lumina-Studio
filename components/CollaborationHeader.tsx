
import React, { useState, useEffect } from 'react';

interface CollaborationHeaderProps {
  title: string;
  onPublish?: () => void;
}

const CollaborationHeader: React.FC<CollaborationHeaderProps> = ({ title, onPublish }) => {
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'idle'>('synced');
  
  const simulateSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => setSyncStatus('synced'), 2000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) simulateSync();
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const collaborators = [
    { name: 'Sarah L.', color: 'bg-rose-400', initial: 'S' },
    { name: 'Marcus T.', color: 'bg-emerald-400', initial: 'M' },
    { name: 'You', color: 'bg-accent', initial: 'Y' },
  ];

  return (
    <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-30">
      <div className="flex items-center gap-4">
        <h2 className="font-black text-slate-800 tracking-tight">{title}</h2>
        <div className="h-4 w-px bg-slate-100"></div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          {syncStatus === 'syncing' ? (
            <><i className="fas fa-circle-notch fa-spin text-accent"></i> Linking Drive...</>
          ) : (
            <><i className="fas fa-check-circle text-emerald-500"></i> Cloud Synced</>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex -space-x-2">
          {collaborators.map((c, i) => (
            <div 
              key={i} 
              className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-black ${c.color} shadow-sm cursor-pointer hover:z-10 transition-all`}
              title={c.name}
            >
              {c.initial}
            </div>
          ))}
          <button className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-slate-400 text-xs hover:bg-slate-100 transition-colors">
            <i className="fas fa-plus"></i>
          </button>
        </div>
        
        <div className="flex gap-3">
          {onPublish && (
            <button 
              onClick={onPublish}
              className="px-6 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 hover:brightness-110 transition-all"
            >
              Export
            </button>
          )}
          <button className="px-4 py-2 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
            Share
          </button>
          <button className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl border border-slate-100 hover:text-accent transition-all">
            <i className="fab fa-google-drive"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollaborationHeader;
