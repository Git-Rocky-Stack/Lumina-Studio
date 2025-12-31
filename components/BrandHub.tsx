
import React, { useState } from 'react';

const BrandHub: React.FC = () => {
  const [personality, setPersonality] = useState('Minimalist, elegant, and professional.');
  
  return (
    <div className="p-10 h-full overflow-y-auto bg-white">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 type-micro mb-4">Brand Intelligence</div>
          <h2 className="type-page text-slate-900 mb-2">Brand Hub</h2>
          <p className="type-body text-slate-500 text-lg">Define how Gemini perceives your creative voice. This context is used in every generation.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="lumina-card card-spacious rounded-3xl scroll-reveal">
              <h3 className="type-subsection mb-6 flex items-center gap-2">
                <i className="fas fa-brain text-indigo-500"></i>
                Brand Personality
              </h3>
              <textarea
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="Describe your brand voice... (e.g., 'Energetic, youth-focused, using slang and bright colors')"
                className="lumina-input w-full h-48 rounded-2xl p-6 text-lg leading-relaxed"
              />
              <p className="mt-4 type-body-sm text-slate-400 italic">Gemini will use this to guide AI Stock generation and marketing copy.</p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="lumina-card card-spacious rounded-3xl scroll-reveal" style={{ animationDelay: '0.1s' }}>
                <h3 className="type-subsection mb-6">Color Palette</h3>
                <div className="flex flex-wrap gap-4">
                  {['#0F172A', '#6366F1', '#A855F7', '#F8FAFC'].map((color, i) => (
                    <div key={color} className="group relative scroll-reveal" style={{ animationDelay: `${0.2 + (i * 0.05)}s` }}>
                      <div className="w-16 h-16 rounded-2xl shadow-elevated cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: color }}></div>
                      <span className="absolute -bottom-6 left-0 type-mono text-slate-400 opacity-0 group-hover:opacity-100">{color}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="lumina-card card-spacious rounded-3xl scroll-reveal" style={{ animationDelay: '0.15s' }}>
                <h3 className="type-subsection mb-6">Typography</h3>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="type-label text-slate-400 mb-1">HEADINGS</p>
                    <p className="text-lg font-black font-sans">Inter Tight Black</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="type-label text-slate-400 mb-1">BODY</p>
                    <p className="text-lg font-medium font-sans">Inter Regular</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-indigo-600 rounded-4xl card-spacious text-white shadow-prominent shadow-indigo-200 relative overflow-hidden scroll-reveal" style={{ animationDelay: '0.2s' }}>
              <i className="fas fa-sparkles absolute top-[-20px] right-[-20px] text-8xl opacity-10 rotate-12 transition-transform hover:rotate-45 duration-700"></i>
              <h4 className="type-subsection mb-4 relative z-10">AI Brand Sync</h4>
              <p className="type-body-sm text-indigo-100 leading-relaxed mb-6 relative z-10">
                Your brand identity is currently synced across Video, Image, and PDF modules.
              </p>
              <button className="lumina-btn-primary w-full bg-white text-indigo-600 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors relative z-10">
                Generate Style Guide
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BrandHub;
