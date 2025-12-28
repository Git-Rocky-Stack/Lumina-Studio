
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { generateText, scanForSensitiveData, reflowDocumentText } from '../services/geminiService';
import CollaborationHeader from './CollaborationHeader';

interface DocBlock {
  id: string;
  type: 'heading' | 'body';
  content: string;
}

interface PDFState {
  blocks: DocBlock[];
  redactedTerms: string[];
  confirmedRedactions: string[];
  glyphSettings: {
    weight: number;
    kerning: number;
    stretch: number;
    opticalSize: number;
  };
}

const INITIAL_TEXT = "Lumina Studio provides an integrated workflow that allows seamless transitions from document drafting to rich media asset creation. This proposal outlines the integration of Gemini 3.0 series models into professional workspace environments. Our target for Q3 is to achieve 95% user retention across the creative professional segment. Contact director Sarah Jenkins at sarah.jenkins@lumina-corp.com or call +1-415-555-0199 for enterprise deployment details. Our main hub is located at 450 Market St, San Francisco.";

const PDFSuite: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [reflowing, setReflowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'privacy' | 'glyphs'>('edit');
  const [docState, setDocState] = useState<PDFState>({
    blocks: [{ id: '1', type: 'body', content: INITIAL_TEXT }],
    redactedTerms: [],
    confirmedRedactions: [],
    glyphSettings: {
      weight: 500,
      kerning: 0,
      stretch: 100,
      opticalSize: 12
    }
  });
  
  const [history, setHistory] = useState<PDFState[]>([]);
  const [future, setFuture] = useState<PDFState[]>([]);

  const saveToHistory = useCallback((newState: PDFState) => {
    setHistory(prev => [...prev, docState]);
    setFuture([]);
    setDocState(newState);
  }, [docState]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      setFuture(f => [docState, ...f]);
      setDocState(previous);
      return prev.slice(0, -1);
    });
  }, [docState]);

  const redo = useCallback(() => {
    setFuture(prev => {
      if (prev.length === 0) return prev;
      const next = prev[0];
      setHistory(h => [...h, docState]);
      setDocState(next);
      return prev.slice(1);
    });
  }, [docState]);

  useEffect(() => {
    const handleUndo = () => undo();
    const handleRedo = () => redo();
    window.addEventListener('lumina-undo', handleUndo);
    window.addEventListener('lumina-redo', handleRedo);
    return () => {
      window.removeEventListener('lumina-undo', handleUndo);
      window.removeEventListener('lumina-redo', handleRedo);
    };
  }, [undo, redo]);

  const handleReflow = async () => {
    setReflowing(true);
    const combinedText = docState.blocks.map(b => b.content).join('\n\n');
    try {
      const structured = await reflowDocumentText(combinedText);
      const newBlocks: DocBlock[] = structured.map((s: any, i: number) => ({
        id: `block-${Date.now()}-${i}`,
        type: s.type,
        content: s.content
      }));
      saveToHistory({ ...docState, blocks: newBlocks });
    } catch (e) {
      console.error(e);
    } finally {
      setReflowing(false);
    }
  };

  const handleScanPrivacy = async () => {
    setScanning(true);
    const combinedText = docState.blocks.map(b => b.content).join(' ');
    try {
      const terms = await scanForSensitiveData(combinedText);
      saveToHistory({ ...docState, redactedTerms: terms });
      setActiveTab('privacy');
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  const toggleConfirmedRedaction = (term: string) => {
    const current = [...docState.confirmedRedactions];
    const idx = current.indexOf(term);
    if (idx > -1) current.splice(idx, 1);
    else current.push(term);
    saveToHistory({ ...docState, confirmedRedactions: current });
  };

  const applyGlyphPreset = async (style: string) => {
    setLoading(true);
    try {
      const result = await generateText(`Suggest optimal variable font settings (weight 100-900, kerning -0.1 to 0.1, stretch 50-200) for a "${style}" aesthetic. Return as JSON with keys weight, kerning, stretch, opticalSize.`);
      const cleanJson = result.text?.replace(/```json|```/g, '') || "{}";
      const settings = JSON.parse(cleanJson);
      saveToHistory({
        ...docState,
        glyphSettings: {
          weight: settings.weight || 500,
          kerning: settings.kerning || 0,
          stretch: settings.stretch || 100,
          opticalSize: settings.opticalSize || 12
        }
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderContentWithRedactions = (content: string) => {
    if (docState.confirmedRedactions.length === 0 && docState.redactedTerms.length === 0) return content;
    
    let rendered = content;
    
    // Sort terms by length descending to prevent partial replacements of nested terms
    const allTerms = [...new Set([...docState.redactedTerms, ...docState.confirmedRedactions])].sort((a, b) => b.length - a.length);

    // Use React.ReactNode to avoid 'Cannot find namespace JSX' error
    const parts: (string | React.ReactNode)[] = [rendered];

    allTerms.forEach(term => {
      if (!term) return;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (typeof part === 'string') {
          const regex = new RegExp(`(${term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
          const subparts = part.split(regex);
          if (subparts.length > 1) {
            // Use React.ReactNode to avoid 'Cannot find namespace JSX' error
            const newParts: (string | React.ReactNode)[] = subparts.map((sp) => {
              if (sp.toLowerCase() === term.toLowerCase()) {
                const isConfirmed = docState.confirmedRedactions.includes(term);
                return (
                  <span 
                    key={Math.random()}
                    onClick={() => toggleConfirmedRedaction(term)}
                    className={`cursor-pointer transition-all duration-300 ${isConfirmed ? 'bg-slate-900 text-transparent rounded px-1' : 'bg-red-500/20 border-b-2 border-red-500 text-slate-900 px-1 hover:bg-red-500/40'}`}
                    title={isConfirmed ? "Click to reveal" : "Suggested Redaction - Click to confirm"}
                  >
                    {sp}
                  </span>
                );
              }
              return sp;
            });
            parts.splice(i, 1, ...newParts);
            i += newParts.length - 1;
          }
        }
      }
    });

    return parts;
  };

  const docStyle = {
    fontVariationSettings: `'wght' ${docState.glyphSettings.weight}, 'wdth' ${docState.glyphSettings.stretch}, 'opsz' ${docState.glyphSettings.opticalSize}`,
    letterSpacing: `${docState.glyphSettings.kerning}em`
  };

  return (
    <div className="h-full flex flex-col bg-[#F8F9FA] font-sans overflow-hidden">
      <CollaborationHeader title="Lumina_Document_Engine_Pro" />

      {/* Global Toolbar */}
      <div className="bg-white border-b border-slate-200 px-8 py-3 flex items-center gap-6 shadow-sm z-40">
        <div className="flex gap-2 mr-6 border-r border-slate-100 pr-6">
          <button onClick={undo} disabled={history.length === 0} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-50 disabled:opacity-20 transition-all text-slate-600 active:scale-90"><i className="fas fa-undo text-sm"></i></button>
          <button onClick={redo} disabled={future.length === 0} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-50 disabled:opacity-20 transition-all text-slate-600 active:scale-90"><i className="fas fa-redo text-sm"></i></button>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
           {['edit', 'privacy', 'glyphs'].map(tab => (
             <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 ${activeTab === tab ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {tab}
             </button>
           ))}
        </div>

        <div className="h-6 w-px bg-slate-200"></div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleReflow}
            disabled={reflowing}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:brightness-110 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {reflowing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wind"></i>}
            AI Reflow
          </button>
          <button 
            onClick={handleScanPrivacy}
            disabled={scanning}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {scanning ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-shield-halved"></i>}
            Scan Privacy
          </button>
        </div>

        <div className="flex-1"></div>

        <button className="px-8 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
          <i className="fas fa-file-pdf text-rose-500"></i>
          Commit Render
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-8 text-slate-300">
           <button className="text-indigo-600 hover:scale-125 transition-transform"><i className="fas fa-mouse-pointer"></i></button>
           <button className="hover:text-slate-900 transition-all hover:scale-125"><i className="fas fa-font"></i></button>
           <button className="hover:text-slate-900 transition-all hover:scale-125"><i className="fas fa-signature"></i></button>
           <button className="hover:text-slate-900 transition-all hover:scale-125"><i className="fas fa-draw-polygon"></i></button>
           <div className="w-8 h-px bg-slate-100"></div>
           <button className="hover:text-rose-500 transition-all hover:scale-125"><i className="fas fa-eraser"></i></button>
           <button className="hover:text-indigo-500 transition-all hover:scale-125"><i className="fas fa-comment-medical"></i></button>
        </div>

        {/* Workspace Canvas Area */}
        <div className="flex-1 overflow-y-auto p-12 bg-slate-200/30 flex justify-center scrollbar-hide relative">
          <div className="w-full max-w-[900px] aspect-[1/1.414] bg-white shadow-2xl p-24 relative overflow-hidden flex flex-col group/doc">
            <div className="absolute inset-0 border-[24px] border-transparent group-hover/doc:border-indigo-600/5 transition-all duration-700 pointer-events-none"></div>
            
            {/* Document Header Rendering */}
            <div className="mb-16 pb-8 border-b-2 border-slate-100 flex justify-between items-end">
               <div>
                 <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-2">Internal Protocol v3.1</p>
                 <h1 className="text-4xl font-black text-slate-900 tracking-tighter" style={docStyle}>Lumina Creative Suite</h1>
               </div>
               <div className="text-right">
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Authorized Access Only</p>
                 <p className="text-[10px] font-black text-slate-800">{new Date().toLocaleDateString()}</p>
               </div>
            </div>

            {/* Blocks Rendering */}
            <div className="space-y-10 flex-1">
              {docState.blocks.map((block) => (
                <div key={block.id} className="relative group/block animate-in fade-in slide-in-from-bottom-4 duration-500 hover:translate-x-1 transition-all">
                  {block.type === 'heading' ? (
                    <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tight leading-tight" style={docStyle}>
                      {renderContentWithRedactions(block.content)}
                    </h2>
                  ) : (
                    <p className="text-slate-600 text-lg leading-relaxed font-medium transition-all" style={docStyle}>
                      {renderContentWithRedactions(block.content)}
                    </p>
                  )}
                  
                  <div className="absolute -left-12 top-0 opacity-0 group-hover/block:opacity-100 transition-all flex flex-col gap-2 translate-x-2 group-hover/block:translate-x-0">
                     <button className="w-8 h-8 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:scale-110 active:scale-90"><i className="fas fa-pencil text-[10px]"></i></button>
                     <button className="w-8 h-8 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all hover:scale-110 active:scale-90"><i className="fas fa-trash text-[10px]"></i></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Document Footer */}
            <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center text-slate-300">
               <div className="flex gap-4">
                  <i className="fab fa-google-drive text-sm hover:text-accent transition-colors cursor-pointer"></i>
                  <i className="fas fa-shield-check text-sm text-emerald-500/40"></i>
               </div>
               <p className="text-[9px] font-black uppercase tracking-[0.3em]">Proprietary Workspace Engine</p>
               <p className="text-[9px] font-black text-slate-400">PAGE 01 / 01</p>
            </div>
          </div>
        </div>

        {/* Intelligence Side Panel */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-30">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
             <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm flex items-center gap-3">
                <i className={`fas ${activeTab === 'privacy' ? 'fa-user-shield text-rose-500' : activeTab === 'glyphs' ? 'fa-font text-indigo-500' : 'fa-brain text-accent'}`}></i>
                {activeTab === 'privacy' ? 'Privacy Shield' : activeTab === 'glyphs' ? 'Glyph Lab' : 'Block Intelligence'}
             </h3>
             <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-tighter text-slate-400">Gemini 3.0</span>
          </div>

          <div className="flex-1 overflow-y-auto p-8 scrollbar-hide space-y-10">
            {activeTab === 'edit' && (
              <div className="space-y-10">
                <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner relative overflow-hidden transition-all duration-500 hover:shadow-md">
                   <div className="absolute top-0 right-0 p-4 opacity-5">
                      <i className="fas fa-wind text-4xl"></i>
                   </div>
                   <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Structure Suggestions</h4>
                   <p className="text-xs text-slate-500 leading-relaxed font-medium mb-6">Gemini suggests breaking the main content into 3 tactical sub-blocks for better readability.</p>
                   <button onClick={handleReflow} className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm">
                     <i className="fas fa-magic text-indigo-400"></i> Auto-Segment Content
                   </button>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Block Sequence</h4>
                   <div className="space-y-3">
                      {docState.blocks.map((b, i) => (
                        <div key={b.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group cursor-grab hover:translate-x-1 transition-all">
                           <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-300 border border-slate-100 group-hover:bg-indigo-50 transition-colors">#{i+1}</div>
                           <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate">{b.type}</p>
                              <p className="text-[10px] text-slate-400 truncate opacity-60">{b.content}</p>
                           </div>
                           <i className="fas fa-grip-vertical text-slate-100 group-hover:text-slate-300 transition-colors"></i>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-8 animate-in slide-in-from-right-4">
                 <div className="p-8 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-rose-500/5">
                    <i className="fas fa-mask absolute -bottom-4 -right-4 text-7xl opacity-5 rotate-12 transition-transform duration-700 group-hover:rotate-45"></i>
                    <p className="text-[10px] text-rose-500 font-black uppercase mb-2 tracking-[0.2em]">Sanitization Engine</p>
                    <p className="text-xs text-slate-300 leading-relaxed italic opacity-80 mb-6">Detected {docState.redactedTerms.length} potential identity breaches in this document.</p>
                    <button onClick={handleScanPrivacy} className="w-full py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all">Re-Scan Data</button>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Privacy Findings</h4>
                    <div className="space-y-2">
                       {docState.redactedTerms.length > 0 ? docState.redactedTerms.map((term, i) => (
                         <div key={i} className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-300 group hover:translate-x-1 ${docState.confirmedRedactions.includes(term) ? 'bg-slate-900 border-slate-900 shadow-lg' : 'bg-slate-50 border-slate-100 hover:border-rose-200'}`}>
                            <span className={`text-[11px] font-bold ${docState.confirmedRedactions.includes(term) ? 'text-rose-500 line-through opacity-50' : 'text-slate-800'}`}>{term}</span>
                            <button 
                              onClick={() => toggleConfirmedRedaction(term)}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90 ${docState.confirmedRedactions.includes(term) ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-slate-300 border border-slate-100'}`}
                            >
                               <i className={`fas ${docState.confirmedRedactions.includes(term) ? 'fa-check' : 'fa-lock'}`}></i>
                            </button>
                         </div>
                       )) : (
                         <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] opacity-40">
                            <i className="fas fa-user-shield text-3xl text-slate-200 mb-4"></i>
                            <p className="text-[10px] font-black uppercase text-slate-400">Awaiting Privacy Sweep</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'glyphs' && (
              <div className="space-y-10 animate-in slide-in-from-right-4">
                 <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Intelligent Presets</h4>
                    <div className="grid grid-cols-2 gap-3">
                       {['Editorial', 'Corporate', 'Swiss', 'Brutalist'].map(style => (
                         <button 
                          key={style}
                          onClick={() => applyGlyphPreset(style)}
                          className="p-5 rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-widest hover:border-indigo-600 hover:bg-indigo-50 transition-all duration-300 text-slate-600 flex flex-col items-center gap-2 hover:scale-[1.03] active:scale-[0.97] hover:shadow-md"
                         >
                            <span className="text-xl font-serif">Aa</span>
                            {style}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-inner space-y-10 transition-all duration-500 hover:shadow-md">
                    <div className="space-y-4">
                       <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Font Weight</label>
                          <span className="text-[10px] font-black text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-sm">{docState.glyphSettings.weight}</span>
                       </div>
                       <input 
                        type="range" min="100" max="900" 
                        value={docState.glyphSettings.weight}
                        onChange={(e) => saveToHistory({ ...docState, glyphSettings: { ...docState.glyphSettings, weight: parseInt(e.target.value) } })}
                        className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-full appearance-none cursor-pointer"
                       />
                    </div>

                    <div className="space-y-4">
                       <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Character Expansion</label>
                          <span className="text-[10px] font-black text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-sm">{docState.glyphSettings.stretch}%</span>
                       </div>
                       <input 
                        type="range" min="50" max="200" 
                        value={docState.glyphSettings.stretch}
                        onChange={(e) => saveToHistory({ ...docState, glyphSettings: { ...docState.glyphSettings, stretch: parseInt(e.target.value) } })}
                        className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-full appearance-none cursor-pointer"
                       />
                    </div>

                    <div className="space-y-4">
                       <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Glyph Spacing</label>
                          <span className="text-[10px] font-black text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-sm">{docState.glyphSettings.kerning}em</span>
                       </div>
                       <input 
                        type="range" min="-0.1" max="0.3" step="0.01"
                        value={docState.glyphSettings.kerning}
                        onChange={(e) => saveToHistory({ ...docState, glyphSettings: { ...docState.glyphSettings, kerning: parseFloat(e.target.value) } })}
                        className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-full appearance-none cursor-pointer"
                       />
                    </div>
                 </div>

                 <div className="p-6 bg-indigo-900 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-indigo-500/10">
                    <i className="fas fa-sparkles absolute -top-4 -right-4 text-6xl opacity-10 rotate-12 transition-transform duration-1000 group-hover:rotate-45"></i>
                    <p className="text-[9px] font-black text-indigo-400 uppercase mb-3 tracking-widest">Aesthetic Optimization</p>
                    <p className="text-xs font-medium leading-relaxed italic opacity-80">"Gemini identifies a high level of lowercase 'j' and 'g' descenders. Increasing optical size by 2px will improve structural clarity."</p>
                 </div>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-slate-100 flex gap-4 bg-white sticky bottom-0 z-10 shadow-2xl">
             <button className="flex-1 py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl">Global Publish</button>
             <button className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:scale-110 active:scale-90 transition-all shadow-sm"><i className="fas fa-share-nodes text-sm"></i></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFSuite;
