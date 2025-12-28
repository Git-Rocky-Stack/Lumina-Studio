
import React, { useState, useEffect } from 'react';
import { ThemeColor } from '../types';
import aistudio, { KeyStatus } from '../services/aistudio';

interface PersonalizationProps {
  currentTheme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
}

const Personalization: React.FC<PersonalizationProps> = ({ currentTheme, setTheme }) => {
  const [keyStatus, setKeyStatus] = useState<KeyStatus>({ isValid: false, lastChecked: 0, source: 'none' });
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  // Load key status on mount
  useEffect(() => {
    setKeyStatus(aistudio.getKeyStatus());
  }, []);

  const handleAddKey = async () => {
    await aistudio.openSelectKey();
    setKeyStatus(aistudio.getKeyStatus());
  };

  const handleRemoveKey = () => {
    aistudio.clearApiKey();
    setKeyStatus(aistudio.getKeyStatus());
    setValidationMessage(null);
  };

  const handleTestKey = async () => {
    const key = aistudio.getApiKey();
    if (!key) return;

    setIsValidating(true);
    setValidationMessage(null);

    const result = await aistudio.validateApiKey(key);
    setIsValidating(false);

    if (result.valid) {
      setValidationMessage('API key is valid and working!');
      setKeyStatus(prev => ({ ...prev, isValid: true, lastChecked: Date.now() }));
    } else {
      setValidationMessage(result.error || 'Validation failed');
    }
  };

  const themes: { id: ThemeColor, label: string, color: string }[] = [
    { id: 'indigo', label: 'Default Indigo', color: 'bg-indigo-600' },
    { id: 'emerald', label: 'Emerald Forest', color: 'bg-emerald-600' },
    { id: 'rose', label: 'Rose Velvet', color: 'bg-rose-600' },
    { id: 'amber', label: 'Amber Glow', color: 'bg-amber-600' },
    { id: 'violet', label: 'Violet Aura', color: 'bg-violet-600' },
    { id: 'slate', label: 'Slate Pro', color: 'bg-slate-700' },
  ];

  return (
    <div className="p-10 h-full overflow-y-auto bg-white">
      <div className="max-w-5xl mx-auto">
        <header className="mb-16">
          <div className="inline-block px-4 py-1 rounded-full bg-accent-soft text-accent text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-accent/10">Engine Preferences</div>
          <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">Command & Personality</h2>
          <p className="text-slate-500 text-xl leading-relaxed max-w-2xl">Modify the visual and cognitive parameters of Lumina Studio to match your professional workflow.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <section className="space-y-10">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-white shadow-xl shadow-accent/20">
                 <i className="fas fa-palette text-xl"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Studio Identity</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {themes.map(t => (
                <button 
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`p-6 rounded-[3rem] border-2 transition-all group relative overflow-hidden flex flex-col items-center gap-4 ${currentTheme === t.id ? 'border-accent bg-accent-soft ring-4 ring-accent/5' : 'border-slate-100 hover:border-slate-300 bg-slate-50'}`}
                >
                  <div className={`w-16 h-16 rounded-[2rem] ${t.color} shadow-2xl transition-transform group-hover:scale-110`}></div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${currentTheme === t.id ? 'text-accent' : 'text-slate-400'}`}>
                    {t.label}
                  </span>
                  {currentTheme === t.id && (
                    <div className="absolute top-4 right-4 text-accent animate-in zoom-in">
                       <i className="fas fa-check-circle"></i>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-10">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
                 <i className="fas fa-brain text-xl"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cognitive Settings</h3>
            </div>

            <div className="bg-slate-50 p-10 rounded-[4rem] border border-slate-100 space-y-8 shadow-sm">
               {[
                 { id: 'thinking', label: 'Always enable Thinking Budget', desc: 'Slower but significantly smarter creative reasoning', enabled: true },
                 { id: 'storage', label: 'Real-time Drive Mirroring', desc: 'Instant backup for every pixel modification', enabled: true },
                 { id: 'search', label: 'Search Grounding', desc: 'Validate all AI claims with Google Search', enabled: true },
                 { id: 'voice', label: 'Voice Command Shortcut', desc: 'Hold Spacebar to initiate Lumina Voice', enabled: false },
               ].map(widget => (
                 <div key={widget.id} className="flex items-center justify-between group">
                   <div className="max-w-[70%]">
                     <p className="text-sm font-black text-slate-800 tracking-tight">{widget.label}</p>
                     <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{widget.desc}</p>
                   </div>
                   <div className={`w-14 h-7 rounded-full p-1.5 transition-all cursor-pointer ${widget.enabled ? 'bg-accent shadow-lg shadow-accent/20' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${widget.enabled ? 'translate-x-7' : 'translate-x-0'}`}></div>
                   </div>
                 </div>
               ))}
            </div>

            <div className="p-8 bg-gradient-to-br from-slate-950 to-slate-900 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 p-8 opacity-10 blur-sm">
                  <i className="fas fa-shield-halved text-[120px]"></i>
               </div>
               <p className="text-[9px] font-black uppercase text-accent tracking-[0.3em] mb-4">Security Protocol</p>
               <h4 className="text-xl font-bold mb-4 tracking-tight">Enterprise Compliance</h4>
               <p className="text-slate-400 text-xs leading-relaxed mb-8">All generated content is scanned for brand compliance and PII leakage using Gemini's safety filters.</p>
               <button className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all">
                  Audit Activity Logs
               </button>
            </div>
          </section>
        </div>

        {/* BYOK API Key Management Section */}
        <section className="mt-16 space-y-10">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <i className="fas fa-key text-xl"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Bring Your Own Key (BYOK)</h3>
              <p className="text-slate-500 text-sm">Use your own Google AI API key for unlimited generation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Status Card */}
            <div className={`p-8 rounded-[3rem] border-2 transition-all ${
              keyStatus.source === 'byok'
                ? 'bg-emerald-50 border-emerald-200'
                : keyStatus.source === 'platform'
                ? 'bg-indigo-50 border-indigo-200'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-4 h-4 rounded-full animate-pulse ${
                  keyStatus.source === 'byok'
                    ? 'bg-emerald-500'
                    : keyStatus.source === 'platform'
                    ? 'bg-indigo-500'
                    : 'bg-slate-400'
                }`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  {keyStatus.source === 'byok' ? 'Your API Key Active' :
                   keyStatus.source === 'platform' ? 'Using Platform Credits' :
                   'No Key Configured'}
                </span>
              </div>

              {keyStatus.source === 'byok' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <code className="flex-1 px-4 py-3 bg-white rounded-xl text-sm font-mono text-slate-600 border border-slate-200">
                      {keyStatus.maskedKey || '••••••••'}
                    </code>
                    <button
                      onClick={handleTestKey}
                      disabled={isValidating}
                      className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                      {isValidating ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-check-circle"></i>
                      )}
                    </button>
                  </div>

                  {validationMessage && (
                    <p className={`text-xs font-medium ${
                      validationMessage.includes('valid') ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      <i className={`fas ${validationMessage.includes('valid') ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2`}></i>
                      {validationMessage}
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleAddKey}
                      className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      Update Key
                    </button>
                    <button
                      onClick={handleRemoveKey}
                      className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-100 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {keyStatus.source === 'platform' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    You're using included platform credits. Add your own API key to unlock <strong>unlimited</strong> AI generation.
                  </p>
                  <button
                    onClick={handleAddKey}
                    className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add Your API Key
                  </button>
                </div>
              )}

              {keyStatus.source === 'none' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    No API key configured. Add your Google AI API key to start generating.
                  </p>
                  <button
                    onClick={handleAddKey}
                    className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add Your API Key
                  </button>
                </div>
              )}
            </div>

            {/* Benefits Card */}
            <div className="p-8 bg-gradient-to-br from-violet-950 to-indigo-950 rounded-[3rem] text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <i className="fas fa-infinity text-[100px]"></i>
              </div>

              <h4 className="text-xl font-bold mb-6 tracking-tight">BYOK Benefits</h4>

              <ul className="space-y-4 relative z-10">
                <li className="flex items-start gap-3">
                  <i className="fas fa-check-circle text-emerald-400 mt-0.5"></i>
                  <span className="text-sm text-white/90"><strong>Unlimited</strong> AI image & video generation</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-check-circle text-emerald-400 mt-0.5"></i>
                  <span className="text-sm text-white/90">Pay only for what you use (Google pricing)</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-check-circle text-emerald-400 mt-0.5"></i>
                  <span className="text-sm text-white/90">No monthly limits or rate throttling</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-check-circle text-emerald-400 mt-0.5"></i>
                  <span className="text-sm text-white/90">Your key, your control, your data</span>
                </li>
              </ul>

              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center gap-2 text-sm text-violet-300 hover:text-white transition-colors"
              >
                Get a free API key from Google AI Studio
                <i className="fas fa-external-link text-xs"></i>
              </a>
            </div>
          </div>
        </section>

        <div className="mt-24 p-12 bg-accent-soft rounded-[4rem] border border-accent/10 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="space-y-3">
             <h4 className="text-3xl font-black text-slate-900 tracking-tighter">Cloud Preference Sync</h4>
             <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-xl">Lumina uses Google Accounts to preserve your creative environment across all devices and sessions.</p>
           </div>
           <button className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-4">
             <i className="fas fa-cloud-arrow-up"></i>
             PERSIST TO WORKSPACE
           </button>
        </div>
      </div>
    </div>
  );
};

export default Personalization;
