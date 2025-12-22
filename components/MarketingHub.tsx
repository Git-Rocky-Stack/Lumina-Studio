
import React, { useState, useMemo } from 'react';
import { generateText } from '../services/geminiService';

interface CampaignDraft {
  id: string;
  platform: string;
  headline: string;
  body: string;
  hashtags: string[];
  sentiment: 'positive' | 'neutral' | 'bold';
  audienceProfile: string;
}

type CampaignStatus = 'draft' | 'scheduled' | 'live' | 'completed' | 'empty';

interface CalendarDay {
  id: string;
  day: string;
  date: string;
  event: string | null;
  status: CampaignStatus;
  platform?: string;
}

const MarketingHub: React.FC = () => {
  const [platform, setPlatform] = useState('Instagram');
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<CampaignDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'strategy' | 'calendar' | 'analytics'>('strategy');
  
  // Dynamic Calendar State
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([
    { id: 'd1', day: 'Mon', date: '12', event: 'Brand Launch', status: 'live', platform: 'Instagram' },
    { id: 'd2', day: 'Tue', date: '13', event: null, status: 'empty' },
    { id: 'd3', day: 'Wed', date: '14', event: 'Product Demo', status: 'draft', platform: 'LinkedIn' },
    { id: 'd4', day: 'Thu', date: '15', event: 'UGC Content', status: 'scheduled', platform: 'TikTok' },
    { id: 'd5', day: 'Fri', date: '16', event: 'Weekly Recap', status: 'completed', platform: 'Twitter' },
  ]);

  const [draggedDayId, setDraggedDayId] = useState<string | null>(null);
  const [dragOverDayId, setDragOverDayId] = useState<string | null>(null);

  const platforms = [
    { id: 'Instagram', icon: 'fa-instagram', color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' },
    { id: 'LinkedIn', icon: 'fa-linkedin-in', color: 'bg-[#0077b5]' },
    { id: 'TikTok', icon: 'fa-tiktok', color: 'bg-black' },
    { id: 'Twitter', icon: 'fa-x-twitter', color: 'bg-slate-900' }
  ];

  const getStatusConfig = (status: CampaignStatus) => {
    switch (status) {
      case 'live': return { label: 'Live', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', accent: 'bg-emerald-500', icon: 'fa-tower-broadcast' };
      case 'scheduled': return { label: 'Scheduled', color: 'text-indigo-600 bg-indigo-50 border-indigo-100', accent: 'bg-indigo-500', icon: 'fa-calendar-check' };
      case 'draft': return { label: 'Draft', color: 'text-amber-600 bg-amber-50 border-amber-100', accent: 'bg-amber-500', icon: 'fa-file-signature' };
      case 'completed': return { label: 'Completed', color: 'text-slate-500 bg-slate-100 border-slate-200', accent: 'bg-slate-400', icon: 'fa-check-double' };
      default: return { label: 'Empty', color: 'text-slate-300', accent: 'bg-slate-200', icon: 'fa-plus' };
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedDayId(id);
  };

  const handleDragEnter = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverDayId(id);
  };

  const handleDragLeave = () => {
    setDragOverDayId(null);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedDayId || draggedDayId === targetId) {
      setDragOverDayId(null);
      setDraggedDayId(null);
      return;
    }

    const newDays = [...calendarDays];
    const sourceIdx = newDays.findIndex(d => d.id === draggedDayId);
    const targetIdx = newDays.findIndex(d => d.id === targetId);

    const sourceEvent = { 
      event: newDays[sourceIdx].event, 
      status: newDays[sourceIdx].status, 
      platform: newDays[sourceIdx].platform 
    };
    const targetEvent = { 
      event: newDays[targetIdx].event, 
      status: newDays[targetIdx].status, 
      platform: newDays[targetIdx].platform 
    };

    newDays[sourceIdx] = { ...newDays[sourceIdx], ...targetEvent };
    newDays[targetIdx] = { ...newDays[targetIdx], ...sourceEvent };

    setCalendarDays(newDays);
    setDraggedDayId(null);
    setDragOverDayId(null);
  };

  const generateCampaign = async () => {
    if (!topic) return;
    setLoading(true);
    setResult(null);
    try {
      const prompt = `Act as a world-class growth marketer. Create a comprehensive ${platform} campaign for: "${topic}". Return JSON with keys: headline, body, hashtags (array), audienceProfile, sentiment (positive/neutral/bold).`;
      const res = await generateText(prompt, { think: true });
      const data = JSON.parse(res.text || '{}');
      setResult({
        id: Date.now().toString(),
        platform,
        headline: data.headline || 'Generated Strategy',
        body: data.body || 'Strategy content...',
        hashtags: data.hashtags || [],
        sentiment: data.sentiment || 'positive',
        audienceProfile: data.audienceProfile || 'General audience'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 h-full overflow-y-auto bg-slate-50 scrollbar-hide">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in duration-700">
          <div className="space-y-2">
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Growth Hub</h2>
            <p className="text-slate-500 text-lg font-medium">Orchestrate viral campaigns across your social ecosystem.</p>
          </div>
        </header>

        {activeTab === 'strategy' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-8 scroll-reveal">
               <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Select Channel</label>
                    <div className="grid grid-cols-2 gap-4">
                       {platforms.map((p, i) => (
                         <button 
                          key={p.id}
                          onClick={() => setPlatform(p.id)}
                          className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all duration-300 hover:scale-[1.03] scroll-reveal ${platform === p.id ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                          style={{ animationDelay: `${i * 0.05}s` }}
                         >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl ${p.color} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                               <i className={`fab ${p.icon}`}></i>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{p.id}</span>
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Campaign Core Topic</label>
                    <textarea 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. New minimalist furniture line..."
                      className="w-full h-32 bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-sm focus:ring-2 focus:ring-indigo-600 transition-all resize-none"
                    />
                  </div>

                  <button 
                    onClick={generateCampaign}
                    disabled={loading || !topic}
                    className="w-full py-5 bg-slate-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                  >
                    Synthesize Strategy
                  </button>
               </div>
            </div>

            <div className="lg:col-span-8 scroll-reveal" style={{ animationDelay: '0.2s' }}>
               {result && (
                 <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden animate-in slide-in-from-right-10 duration-500">
                    <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                       <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg">{result.headline}</h3>
                    </div>
                    <div className="p-10">
                       <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 text-sm leading-relaxed text-slate-700 font-medium">
                         {result.body}
                       </div>
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-2xl animate-in fade-in duration-500 scroll-reveal">
             <div className="grid grid-cols-5 gap-6">
                {calendarDays.map((day, i) => {
                  const statusCfg = getStatusConfig(day.status);
                  return (
                    <div 
                      key={day.id} 
                      className={`p-8 rounded-[2.5rem] border transition-all duration-300 h-80 flex flex-col relative group overflow-hidden scroll-reveal ${
                        day.status === 'empty' 
                        ? 'bg-slate-50/50 border-dashed border-slate-200' 
                        : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px]'
                      }`}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                       <div className="flex justify-between items-start mb-6">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day.day}</span>
                            <span className="text-lg font-black text-slate-900">{day.date}</span>
                          </div>
                       </div>
                       {day.event && (
                         <div className="flex-1 flex flex-col justify-between">
                            <p className="text-sm font-black text-slate-800 leading-tight line-clamp-2 uppercase tracking-tight">{day.event}</p>
                         </div>
                       )}
                    </div>
                  );
                })}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingHub;
