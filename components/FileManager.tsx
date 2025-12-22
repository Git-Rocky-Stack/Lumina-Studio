
import React, { useState, useMemo } from 'react';

type AssetType = 'Design' | 'Document' | 'Video' | 'Image';
type FileStatus = 'Synced' | 'In Review' | 'Draft' | 'Locked';

interface FileItem {
  id: string;
  name: string;
  type: AssetType;
  date: string;
  timestamp: number;
  size: string;
  sizeBytes: number;
  icon: string;
  color: string;
  status: FileStatus;
  thumbnail?: string;
}

const FileManager: React.FC = () => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<AssetType | 'All'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'size'>('newest');

  const files: FileItem[] = useMemo(() => [
    { id: '1', name: 'Brand_Identity_v1.lum', type: 'Design', date: '2h ago', timestamp: Date.now() - 7200000, size: '1.2MB', sizeBytes: 1200000, icon: 'fa-file-signature', color: 'text-accent', status: 'In Review', thumbnail: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=80' },
    { id: '2', name: 'Marketing_Pitch.pdf', type: 'Document', date: '5h ago', timestamp: Date.now() - 18000000, size: '4.5MB', sizeBytes: 4500000, icon: 'fa-file-pdf', color: 'text-rose-500', status: 'Synced' },
    { id: '3', name: 'Campaign_Teaser.mp4', type: 'Video', date: 'Yesterday', timestamp: Date.now() - 86400000, size: '84MB', sizeBytes: 84000000, icon: 'fa-file-video', color: 'text-purple-500', status: 'Draft', thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80' },
    { id: '4', name: 'Studio_Stock_01.png', type: 'Image', date: 'Yesterday', timestamp: Date.now() - 90000000, size: '12MB', sizeBytes: 12000000, icon: 'fa-file-image', color: 'text-emerald-500', status: 'Synced', thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80' },
    { id: '5', name: 'Social_Toolkit.lum', type: 'Design', date: '3 days ago', timestamp: Date.now() - 259200000, size: '2.8MB', sizeBytes: 2800000, icon: 'fa-file-signature', color: 'text-accent', status: 'Locked' },
    { id: '6', name: 'Q4_Projections.pdf', type: 'Document', date: '4 days ago', timestamp: Date.now() - 345600000, size: '1.1MB', sizeBytes: 1100000, icon: 'fa-file-pdf', color: 'text-rose-500', status: 'Synced' },
    { id: '7', name: 'Hero_Loop_Cinematic.mp4', type: 'Video', date: '1 week ago', timestamp: Date.now() - 604800000, size: '124MB', sizeBytes: 124000000, icon: 'fa-file-video', color: 'text-purple-500', status: 'Synced', thumbnail: 'https://images.unsplash.com/photo-1635311850125-977209772c9a?w=400&q=80' },
  ], []);

  const stats = [
    { label: 'Creative Pulse', value: '98%', trend: '+4%', icon: 'fa-wave-square', color: 'text-accent', bg: 'bg-accent-soft' },
    { label: 'AI Efficiency', value: '82h', trend: 'Saved', icon: 'fa-bolt', color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Asset Velocity', value: '1.2k', trend: 'Files/mo', icon: 'fa-gauge-high', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Cloud Integrity', value: '100%', trend: 'Verified', icon: 'fa-shield-check', color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  const filteredAndSortedFiles = useMemo(() => {
    let result = files.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === 'All' || f.type === filterType;
      return matchesSearch && matchesFilter;
    });

    return result.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return b.sizeBytes - a.sizeBytes;
      return b.timestamp - a.timestamp;
    });
  }, [files, searchQuery, filterType, sortBy]);

  return (
    <div className="p-10 h-full overflow-y-auto bg-slate-50 scrollbar-hide">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Workspace instrumentation active</p>
            </div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Command Bay</h2>
            <p className="text-slate-500 text-lg font-medium">Real-time oversight of your creative production pipeline.</p>
          </div>
          <div className="flex gap-4">
             <button className="px-8 py-4 bg-white border border-slate-200 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-3">
                <i className="fas fa-plus text-accent"></i> Create New
             </button>
             <button className="px-8 py-4 bg-slate-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all flex items-center gap-3">
                <i className="fab fa-google-drive"></i> Workspace Sync
             </button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {stats.map((stat, i) => (
             <div key={stat.label} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative scroll-reveal" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <i className={`fas ${stat.icon} text-9xl`}></i>
                </div>
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} text-xl shadow-inner group-hover:scale-110 transition-transform`}>
                    <i className={`fas ${stat.icon}`}></i>
                  </div>
                  <span className={`text-[10px] font-black ${stat.color} ${stat.bg} px-2 py-1 rounded-lg`}>{stat.trend}</span>
                </div>
                <p className="text-4xl font-black text-slate-900 mb-1 tracking-tighter">{stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
             </div>
           ))}
        </div>

        <div className="space-y-8">
           <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm scroll-reveal">
              <div className="flex-1 w-full relative group">
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search project repository..."
                   className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-accent outline-none transition-all"
                 />
                 <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-accent transition-colors"></i>
              </div>

              <div className="flex items-center gap-6 w-full lg:w-auto">
                 <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    {(['All', 'Design', 'Document', 'Video', 'Image'] as const).map(type => (
                      <button 
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-white text-accent shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {type}
                      </button>
                    ))}
                 </div>

                 <div className="h-8 w-px bg-slate-100 hidden lg:block"></div>

                 <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-100 ml-auto lg:ml-0">
                    <button onClick={() => setView('grid')} className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${view === 'grid' ? 'bg-white shadow-md text-accent' : 'text-slate-400'}`}><i className="fas fa-grid-2 text-sm"></i></button>
                    <button onClick={() => setView('list')} className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${view === 'list' ? 'bg-white shadow-md text-accent' : 'text-slate-400'}`}><i className="fas fa-list text-sm"></i></button>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden min-h-[600px] flex flex-col scroll-reveal">
            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
               <div className="space-y-1">
                 <h3 className="font-black text-slate-800 uppercase tracking-tight">Production Stream</h3>
                 <p className="text-[10px] font-medium text-slate-400">Displaying {filteredAndSortedFiles.length} analyzed production assets</p>
               </div>
               <button className="text-[10px] font-black text-accent uppercase tracking-[0.2em] hover:underline">Batch Operations</button>
            </div>
            
            {view === 'grid' ? (
              <div className="flex-1 p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 overflow-y-auto scrollbar-hide">
                {filteredAndSortedFiles.map((file, i) => (
                  <div key={file.id} className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col overflow-hidden relative scroll-reveal" style={{ animationDelay: `${(i % 8) * 0.05}s` }}>
                    <div className="absolute top-4 right-4 z-10">
                       <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg border border-white/20 ${file.status === 'Synced' ? 'bg-emerald-500/90 text-white' : 'bg-slate-900/90 text-white'}`}>
                         {file.status}
                       </div>
                    </div>
                    
                    <div className="aspect-[4/3] w-full bg-slate-900 relative overflow-hidden flex items-center justify-center">
                       {file.thumbnail ? (
                         <img src={file.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={file.name} />
                       ) : (
                         <i className={`fas ${file.icon} text-4xl text-white/10 group-hover:scale-125 transition-transform duration-500`}></i>
                       )}
                       <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <button className="w-12 h-12 bg-white rounded-full text-slate-900 flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"><i className="fas fa-expand-alt"></i></button>
                          <button className="w-12 h-12 bg-accent text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"><i className="fas fa-pencil"></i></button>
                       </div>
                    </div>
                    
                    <div className="p-8 space-y-4">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{file.type} • {file.size}</p>
                          <h4 className="font-black text-slate-900 truncate uppercase tracking-tight text-sm pr-4">{file.name}</h4>
                       </div>
                       <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <span className="text-[10px] font-bold text-slate-400">{file.date}</span>
                          <button className="text-slate-300 hover:text-accent transition-colors"><i className="fas fa-ellipsis-h"></i></button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <th className="px-10 py-6">Asset Name</th>
                      <th className="px-10 py-6">Type Context</th>
                      <th className="px-10 py-6">Status</th>
                      <th className="px-10 py-6">Capacity</th>
                      <th className="px-10 py-6 text-right">Sequence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredAndSortedFiles.map((file, i) => (
                      <tr key={file.id} className="hover:bg-accent-soft/10 transition-colors group cursor-pointer scroll-reveal" style={{ animationDelay: `${i * 0.05}s` }}>
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl ${file.color} border border-slate-100 group-hover:bg-white transition-all shadow-inner`}>
                               {file.thumbnail ? <img src={file.thumbnail} className="w-10 h-10 rounded-lg object-cover" /> : <i className={`fas ${file.icon}`}></i>}
                            </div>
                            <div>
                              <span className="font-black text-slate-800 block mb-1 text-sm uppercase tracking-tight">{file.name}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{file.date}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                           <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">{file.type}</span>
                        </td>
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${file.status === 'Synced' ? 'bg-emerald-500' : file.status === 'Locked' ? 'bg-rose-500' : 'bg-amber-400'}`}></span>
                            <span className="text-[10px] font-black uppercase text-slate-500">{file.status}</span>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                           <span className="text-[10px] font-mono font-bold text-slate-400">{file.size}</span>
                        </td>
                        <td className="px-10 py-7 text-right">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button className="p-3 bg-white text-slate-400 rounded-xl hover:text-accent shadow-sm border border-slate-100 transition-all"><i className="fas fa-ellipsis-v"></i></button>
                              <button className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Load</button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-10 scroll-reveal">
             <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl">
                <i className="fas fa-wand-sparkles absolute top-[-20px] right-[-20px] text-[120px] opacity-5 rotate-12 transition-transform duration-1000 group-hover:rotate-45"></i>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <i className="fas fa-sparkles text-accent"></i>
                    <h4 className="text-xl font-black tracking-tighter text-white uppercase">Lumina Insight</h4>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                       <p className="text-[10px] font-black text-accent uppercase tracking-widest">Workflow Suggestion</p>
                       <p className="text-xs text-slate-300 leading-relaxed font-medium italic">
                         "Based on your 2 recent video projects, consider optimizing your export bitrate to 'Cinema Master' for Project Omega."
                       </p>
                    </div>
                    <button className="w-full py-5 bg-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-accent/20">
                      Generate Asset Audit
                    </button>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileManager;
