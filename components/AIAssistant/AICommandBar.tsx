// =============================================
// AI Command Bar Component
// Natural language input for design commands
// =============================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  History,
  Lightbulb,
  ChevronUp,
  ChevronDown,
  Loader2,
  X,
  Wand2,
  Palette,
  Layout,
  Type,
  Image,
  Zap,
} from 'lucide-react';
import { aiDesignAssistant, CommandContext, CommandResponse, AICommand } from '../../services/aiDesignAssistantService';

// =============================================
// Types
// =============================================

interface AICommandBarProps {
  context: CommandContext;
  onCommandExecuted?: (response: CommandResponse) => void;
  onActionApply?: (action: any) => void;
  className?: string;
}

interface QuickCommand {
  id: string;
  label: string;
  command: string;
  icon: React.ReactNode;
  category: string;
}

// =============================================
// Quick Commands
// =============================================

const quickCommands: QuickCommand[] = [
  { id: 'bold', label: 'Make Bold', command: 'make the text bold', icon: <Type className="w-3.5 h-3.5" />, category: 'style' },
  { id: 'center', label: 'Center', command: 'center align the element', icon: <Layout className="w-3.5 h-3.5" />, category: 'layout' },
  { id: 'shadow', label: 'Add Shadow', command: 'add a subtle shadow', icon: <Palette className="w-3.5 h-3.5" />, category: 'style' },
  { id: 'button', label: 'Add Button', command: 'create a call-to-action button', icon: <Zap className="w-3.5 h-3.5" />, category: 'generate' },
  { id: 'headline', label: 'Add Headline', command: 'add a headline text', icon: <Type className="w-3.5 h-3.5" />, category: 'generate' },
  { id: 'image', label: 'Add Image', command: 'add a placeholder image', icon: <Image className="w-3.5 h-3.5" />, category: 'generate' },
];

// =============================================
// AI Command Bar Component
// =============================================

export const AICommandBar: React.FC<AICommandBarProps> = ({
  context,
  onCommandExecuted,
  onActionApply,
  className = '',
}) => {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [commandHistory, setCommandHistory] = useState<AICommand[]>([]);
  const [lastResponse, setLastResponse] = useState<CommandResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // =============================================
  // Load Command History
  // =============================================

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await aiDesignAssistant.getCommandHistory(10);
      setCommandHistory(history);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  // =============================================
  // Voice Recognition
  // =============================================

  const initVoiceRecognition = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    initVoiceRecognition();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [initVoiceRecognition]);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      setError('Voice recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setError(null);
    }
  };

  // =============================================
  // Command Execution
  // =============================================

  const executeCommand = async (commandText: string) => {
    if (!commandText.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    setLastResponse(null);

    try {
      const response = await aiDesignAssistant.executeCommand(commandText, context);
      setLastResponse(response);
      setInput('');

      // Apply actions if handler provided
      if (onActionApply && response.actions.length > 0) {
        response.actions.forEach(action => onActionApply(action));
      }

      onCommandExecuted?.(response);
      loadHistory();
    } catch (err: any) {
      setError(err.message || 'Failed to execute command');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand(input);
  };

  const handleQuickCommand = (command: QuickCommand) => {
    executeCommand(command.command);
  };

  const handleHistorySelect = (command: AICommand) => {
    setInput(command.command_text);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  // =============================================
  // Keyboard Shortcuts
  // =============================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsExpanded(true);
      }
      // Escape to collapse
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // =============================================
  // Render
  // =============================================

  return (
    <div className={`ai-command-bar ${className}`}>
      {/* Main Input Bar */}
      <div
        className={`
          relative bg-gradient-to-r from-violet-500/10 to-indigo-500/10
          border border-violet-500/20 rounded-2xl
          transition-all duration-300 ease-out
          ${isExpanded ? 'shadow-lg shadow-violet-500/10' : 'shadow-md'}
        `}
      >
        {/* Header with expand toggle */}
        <div
          className="flex items-center justify-between px-4 py-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-zinc-200">AI Design Assistant</span>
            <span className="text-xs text-zinc-500 hidden sm:inline">⌘K</span>
          </div>
          <button className="p-1 hover:bg-white/5 rounded-lg transition-colors">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            )}
          </button>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3">
            {/* Command Input */}
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative flex items-center">
                <Wand2 className="absolute left-3 w-4 h-4 text-violet-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe what you want to create or change..."
                  className="
                    w-full pl-10 pr-24 py-3 rounded-xl
                    bg-zinc-900/50 border border-zinc-700/50
                    text-zinc-100 placeholder-zinc-500
                    focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
                    transition-all duration-200
                  "
                  disabled={isProcessing}
                />
                <div className="absolute right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={`
                      p-2 rounded-lg transition-all duration-200
                      ${isListening
                        ? 'bg-red-500/20 text-red-400 animate-pulse'
                        : 'hover:bg-white/5 text-zinc-400 hover:text-zinc-300'
                      }
                    `}
                    title={isListening ? 'Stop listening' : 'Voice input'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button
                    type="submit"
                    disabled={!input.trim() || isProcessing}
                    className="
                      p-2 rounded-lg bg-violet-500 text-white
                      hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200
                    "
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <X className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}

            {/* Last Response */}
            {lastResponse && (
              <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm text-emerald-400">{lastResponse.explanation}</p>
                {lastResponse.suggestions && lastResponse.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {lastResponse.suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(suggestion)}
                        className="
                          px-2 py-1 text-xs rounded-full
                          bg-emerald-500/10 text-emerald-300
                          hover:bg-emerald-500/20 transition-colors
                        "
                      >
                        <Lightbulb className="w-3 h-3 inline mr-1" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Commands */}
            {showSuggestions && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Quick Actions
                  </span>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`
                      flex items-center gap-1 px-2 py-1 text-xs rounded-lg
                      transition-colors
                      ${showHistory
                        ? 'bg-violet-500/20 text-violet-400'
                        : 'hover:bg-white/5 text-zinc-500'
                      }
                    `}
                  >
                    <History className="w-3 h-3" />
                    History
                  </button>
                </div>

                {showHistory ? (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {commandHistory.length === 0 ? (
                      <p className="text-xs text-zinc-500 text-center py-4">
                        No command history yet
                      </p>
                    ) : (
                      commandHistory.map((cmd) => (
                        <button
                          key={cmd.id}
                          onClick={() => handleHistorySelect(cmd)}
                          className="
                            w-full flex items-center gap-2 px-3 py-2 rounded-lg
                            bg-zinc-800/50 hover:bg-zinc-800 text-left
                            transition-colors group
                          "
                        >
                          <History className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="flex-1 text-sm text-zinc-300 truncate">
                            {cmd.command_text}
                          </span>
                          <span className="text-xs text-zinc-600 group-hover:text-zinc-500">
                            {new Date(cmd.created_at).toLocaleDateString()}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {quickCommands.map((cmd) => (
                      <button
                        key={cmd.id}
                        onClick={() => handleQuickCommand(cmd)}
                        disabled={isProcessing}
                        className="
                          flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                          bg-zinc-800/50 hover:bg-zinc-800
                          text-sm text-zinc-300 hover:text-zinc-100
                          border border-zinc-700/50 hover:border-zinc-600/50
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-200
                        "
                      >
                        {cmd.icon}
                        {cmd.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AICommandBar;
