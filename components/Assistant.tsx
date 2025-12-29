
import React, { useState, useRef, useCallback } from 'react';
import { Modality, LiveServerMessage } from "@google/genai";
import { 
  getAIClient, 
  decodeBase64, 
  encodeBase64, 
  decodeAudioToBuffer, 
  analyzeMedia, 
  generateText,
  generateSpeech,
  transcribeAudio,
  analyzeVideoContent
} from '../services/geminiService';

interface Message {
  role: string;
  text: string;
  type?: 'analysis' | 'thought' | 'transcription' | 'video';
  mediaUrl?: string;
  mimeType?: string;
}

const Assistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcriptions, setTranscriptions] = useState<Message[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mode, setMode] = useState<'voice' | 'chat' | 'speech'>('voice');
  const [chatInput, setChatInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Puck' | 'Zephyr'>('Kore');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close?.();
      sessionRef.current = null;
    }
    setIsActive(false);
  }, []);

  const playBase64Audio = async (base64: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputNodeRef.current = audioContextRef.current.createGain();
      outputNodeRef.current.connect(audioContextRef.current.destination);
    }
    const ctx = audioContextRef.current;
    const buffer = await decodeAudioToBuffer(decodeBase64(base64), ctx, 24000, 1);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(outputNodeRef.current!);
    source.start();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const localUrl = URL.createObjectURL(file);
    setThinking(true);
    
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        if (file.type.startsWith('image/')) {
          const prompt = "Act as a professional creative director. Analyze this image deeply. Provide a breakdown of its composition, color theory, and aesthetic quality.";
          const analysis = await analyzeMedia(prompt, {
            data: base64,
            mimeType: file.type
          });
          
          setTranscriptions(prev => [...prev, 
            { role: 'user', text: `[Analyzed Image: ${file.name}]`, mediaUrl: localUrl, mimeType: file.type },
            { role: 'model', text: analysis || "Analysis synthesis failed.", type: 'analysis' }
          ]);
        } else if (file.type.startsWith('video/')) {
          const analysis = await analyzeVideoContent(base64, "Analyze this video. Describe cinematic style and key events.", file.type);
          setTranscriptions(prev => [...prev, 
            { role: 'user', text: `[Analyzed Video: ${file.name}]`, mediaUrl: localUrl, mimeType: file.type },
            { role: 'model', text: analysis || "Video analysis synthesis failed.", type: 'video' }
          ]);
        } else if (file.type.startsWith('audio/')) {
          const text = await transcribeAudio(base64, file.type);
          setTranscriptions(prev => [...prev, 
            { role: 'user', text: `[Transcribing Audio: ${file.name}]` },
            { role: 'model', text: text || "Transcription failed.", type: 'transcription' }
          ]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setThinking(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSpeechGen = async () => {
    if (!chatInput.trim()) return;
    setThinking(true);
    try {
      const base64 = await generateSpeech(chatInput, selectedVoice);
      if (base64) {
        await playBase64Audio(base64);
        setTranscriptions(prev => [...prev, { role: 'model', text: `Spoken: "${chatInput}"`, type: 'thought' }]);
        setChatInput('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setThinking(false);
    }
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (mode === 'speech') { handleSpeechGen(); return; }
    if (!chatInput.trim()) return;
    const input = chatInput;
    setChatInput('');
    setThinking(true);
    setTranscriptions(prev => [...prev, { role: 'user', text: input }]);
    
    try {
      const result = await generateText(input, { fast: true, useSearch: true });
      setTranscriptions(prev => [...prev, { role: 'model', text: result.text || "No response received.", type: 'thought' }]);
    } catch (err) {
      console.error(err);
    } finally {
      setThinking(false);
    }
  };

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = getAIClient();
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        outputNodeRef.current = audioContextRef.current.createGain();
        outputNodeRef.current.connect(audioContextRef.current.destination);
      }
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) { int16[i] = inputData[i] * 32768; }
              const pcmBlob = { data: encodeBase64(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscriptions(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'model' && !last.type) return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                return [...prev, { role: 'model', text }];
              });
            }
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && audioContextRef.current && outputNodeRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioToBuffer(decodeBase64(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputNodeRef.current);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Gemini Live API Error:', e);
            setIsActive(false);
          },
          onclose: () => setIsActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are Lumina. Multi-modal creative assistant.",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{ googleSearch: {} }]
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden relative">
      <div className="h-16 border-b border-white/5 px-8 flex items-center justify-between bg-white/5 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
          <span className="type-label text-white">High-Speed Intelligence</span>
        </div>
        <div className="flex bg-slate-800 rounded-full p-1 border border-white/5 shadow-inner-subtle">
          {(['voice', 'chat', 'speech'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-1.5 rounded-full type-micro transition-all duration-300 hover:scale-110 active:scale-95 ${mode === m ? 'bg-accent text-white shadow-elevated' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-12 space-y-10 scrollbar-hide">
        <div className="max-w-4xl mx-auto space-y-10">
          {transcriptions.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} transition-all duration-500`}>
              {msg.mediaUrl && msg.mimeType?.startsWith('image/') && (
                <div className="mb-4 max-w-sm rounded-3xl overflow-hidden border-4 border-white/10 shadow-prominent animate-in zoom-in duration-500 hover:scale-[1.02] transition-transform cursor-pointer">
                  <img src={msg.mediaUrl} alt="User Upload" className="w-full h-auto" />
                </div>
              )}
              {msg.mediaUrl && msg.mimeType?.startsWith('video/') && (
                <div className="mb-4 max-w-sm rounded-3xl overflow-hidden border-4 border-white/10 shadow-prominent transition-transform hover:scale-[1.02] cursor-pointer">
                  <video src={msg.mediaUrl} className="w-full h-auto" controls />
                </div>
              )}
              <div className={`p-8 rounded-4xl max-w-2xl shadow-prominent relative group transition-all duration-500 hover:translate-y-[-2px] ${msg.role === 'user' ? 'bg-accent text-white rounded-tr-none' : 'bg-slate-800 text-slate-100 border border-white/10 rounded-tl-none'}`}>
                {msg.type === 'analysis' && (
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-indigo-600 text-white type-micro rounded-full flex items-center gap-2 shadow-elevated">
                    <i className="fas fa-microscope"></i> Visual Audit
                  </div>
                )}
                {msg.type === 'video' && <div className="absolute -top-3 left-6 px-3 py-1 bg-amber-600 text-white type-micro rounded-full shadow-elevated">Video Insight</div>}
                {msg.type === 'transcription' && <div className="absolute -top-3 left-6 px-3 py-1 bg-purple-500 text-white type-micro rounded-full shadow-elevated">Audio Trace</div>}
                <p className={`type-body-sm leading-relaxed ${msg.type === 'analysis' ? 'italic' : ''}`}>{msg.text}</p>
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex justify-start">
               <div className="bg-slate-800/50 px-8 py-5 rounded-full border border-white/5 flex items-center gap-4 transition-all animate-in fade-in slide-in-from-left-4">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce delay-150"></div>
                  <span className="type-label text-slate-500">Processing...</span>
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-10 bg-gradient-to-t from-slate-950 to-transparent">
        <div className="max-w-3xl mx-auto space-y-6">
          {mode === 'speech' && (
            <div className="flex justify-center gap-4 animate-in slide-in-from-bottom-2">
               {(['Kore', 'Puck', 'Zephyr'] as const).map(v => (
                 <button key={v} onClick={() => setSelectedVoice(v)} className={`px-4 py-2 rounded-xl type-micro border transition-all duration-300 hover:scale-110 active:scale-95 ${selectedVoice === v ? 'bg-white text-slate-900 shadow-elevated' : 'bg-slate-800 text-slate-400 border-white/10 hover:bg-slate-700'}`}>Voice: {v}</button>
               ))}
            </div>
          )}
          <div className="flex gap-4 items-center">
            <label className="flex-shrink-0 w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 cursor-pointer border border-white/10 hover:bg-slate-700 transition-all hover:scale-110 active:scale-90 shadow-elevated group">
               <i className="fas fa-camera transition-transform group-hover:rotate-12"></i>
               <input type="file" className="hidden" accept="image/*,audio/*,video/*" onChange={handleFileUpload} />
            </label>
            <div className="flex-1 relative group">
              <input
                type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                placeholder={mode === 'voice' ? (isActive ? "Lumina is listening..." : "Activate Voice Command...") : mode === 'speech' ? "Enter text to speak..." : "Ask Gemini 3 Flash..."}
                className="w-full bg-slate-800/50 border border-white/10 rounded-4xl px-8 py-6 text-white type-body-sm focus:ring-2 focus:ring-accent outline-none transition-all placeholder:text-slate-600 group-hover:bg-slate-800 focus:bg-slate-800 shadow-inner-subtle"
              />
              <button
                onClick={isActive ? stopSession : (mode === 'voice' ? startSession : handleChatSubmit)}
                className={`absolute right-3 top-3 bottom-3 w-14 rounded-3xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90 ${isActive ? 'bg-red-500 shadow-elevated shadow-red-500/20' : 'bg-accent shadow-elevated shadow-accent/20'}`}
              >
                <i className={`fas ${isActive ? 'fa-stop' : (mode === 'voice' ? 'fa-microphone' : 'fa-paper-plane')} transition-transform group-hover:scale-110`}></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
