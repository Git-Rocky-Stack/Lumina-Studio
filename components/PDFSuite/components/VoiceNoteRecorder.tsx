// ============================================
// VoiceNoteRecorder Component
// Voice note recording interface with waveform visualization
// ============================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Download,
  FileText,
  Volume2,
} from 'lucide-react';
import type { VoiceNote } from '../hooks/useEnhancedAnnotations';

interface VoiceNoteRecorderProps {
  annotationId: string;
  existingNotes: VoiceNote[];
  isRecording: boolean;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => Promise<VoiceNote | null>;
  onDeleteNote: (noteId: string) => void;
  onTranscribe: (noteId: string) => Promise<void>;
  className?: string;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  annotationId,
  existingNotes,
  isRecording,
  onStartRecording,
  onStopRecording,
  onDeleteNote,
  onTranscribe,
  className = '',
}) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(50).fill(0));
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Simulate audio levels
      const animate = () => {
        setAudioLevels((prev) => {
          const newLevels = [...prev.slice(1), Math.random() * 0.8 + 0.2];
          return newLevels;
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isRecording]);

  // Format time
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle start recording
  const handleStartRecording = useCallback(async () => {
    try {
      await onStartRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  }, [onStartRecording]);

  // Handle stop recording
  const handleStopRecording = useCallback(async () => {
    await onStopRecording();
  }, [onStopRecording]);

  return (
    <div className={`bg-white rounded-xl border border-slate-200 ${className}`}>
      {/* Recording Interface */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {isRecording ? (
            <>
              {/* Recording Indicator */}
              <div className="flex items-center gap-3 flex-1">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 rounded-full bg-rose-500 opacity-30"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 mb-1">Recording...</p>
                  <p className="text-xs text-slate-500">{formatTime(recordingTime)}</p>
                </div>
              </div>

              {/* Stop Button */}
              <button
                onClick={handleStopRecording}
                className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                aria-label="Stop recording"
              >
                <Square className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              {/* Start Recording */}
              <button
                onClick={handleStartRecording}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
                aria-label="Start recording"
              >
                <Mic className="w-5 h-5" />
                Record Voice Note
              </button>
            </>
          )}
        </div>

        {/* Waveform Visualization */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4"
          >
            <Waveform levels={audioLevels} isRecording={isRecording} />
          </motion.div>
        )}
      </div>

      {/* Existing Voice Notes */}
      <AnimatePresence>
        {existingNotes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 space-y-3"
          >
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
              Voice Notes ({existingNotes.length})
            </h4>

            {existingNotes.map((note) => (
              <VoiceNoteItem
                key={note.id}
                note={note}
                isExpanded={expandedNoteId === note.id}
                onToggleExpand={() =>
                  setExpandedNoteId(expandedNoteId === note.id ? null : note.id)
                }
                onDelete={() => onDeleteNote(note.id)}
                onTranscribe={() => onTranscribe(note.id)}
                formatTime={formatTime}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!isRecording && existingNotes.length === 0 && (
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3">
            <Mic className="w-8 h-8 text-indigo-600" />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">No voice notes yet</p>
          <p className="text-xs text-slate-500">
            Add a voice note to this annotation
          </p>
        </div>
      )}
    </div>
  );
};

// ============================================
// Waveform Component
// ============================================

interface WaveformProps {
  levels: number[];
  isRecording?: boolean;
}

const Waveform: React.FC<WaveformProps> = ({ levels, isRecording = false }) => (
  <div className="flex items-center gap-1 h-16 bg-slate-50 rounded-lg p-2">
    {levels.map((level, index) => (
      <motion.div
        key={index}
        className="flex-1 bg-gradient-to-t from-indigo-600 to-violet-600 rounded-full min-w-[2px]"
        style={{ height: `${level * 100}%` }}
        animate={
          isRecording && index >= levels.length - 5
            ? { scaleY: [1, 1.2, 1] }
            : undefined
        }
        transition={{ duration: 0.3 }}
      />
    ))}
  </div>
);

// ============================================
// VoiceNoteItem Component
// ============================================

interface VoiceNoteItemProps {
  note: VoiceNote;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onTranscribe: () => void;
  formatTime: (seconds: number) => string;
}

const VoiceNoteItem: React.FC<VoiceNoteItemProps> = ({
  note,
  isExpanded,
  onToggleExpand,
  onDelete,
  onTranscribe,
  formatTime,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<number>(0);

  // Initialize audio
  useEffect(() => {
    const audio = new Audio(URL.createObjectURL(note.audioBlob));
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      URL.revokeObjectURL(audio.src);
    };
  }, [note.audioBlob]);

  // Toggle play/pause
  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Handle transcribe
  const handleTranscribe = useCallback(async () => {
    setIsTranscribing(true);
    try {
      await onTranscribe();
    } finally {
      setIsTranscribing(false);
    }
  }, [onTranscribe]);

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const progress = audioRef.current
    ? (currentTime / (audioRef.current.duration || 1)) * 100
    : 0;

  return (
    <motion.div
      layout
      className="bg-slate-50 rounded-lg p-3 border border-slate-200"
    >
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayback}
          className="w-10 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        {/* Waveform/Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs font-medium text-slate-700">{note.author}</p>
            <span className="text-xs text-slate-400">•</span>
            <p className="text-xs text-slate-500">{formatDate(note.createdAt)}</p>
          </div>

          {/* Progress Bar */}
          <div className="relative h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-500">
              {formatTime(Math.floor(currentTime))} /{' '}
              {formatTime(Math.floor(note.duration))}
            </p>
            <button
              onClick={onToggleExpand}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-colors"
          aria-label="Delete voice note"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-slate-200"
          >
            {/* Mini Waveform */}
            <div className="mb-3">
              <Waveform levels={note.waveformData.slice(0, 40)} />
            </div>

            {/* Transcript */}
            {note.transcript ? (
              <div className="bg-white rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-medium text-slate-700">Transcript</p>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {note.transcript}
                </p>
              </div>
            ) : (
              <button
                onClick={handleTranscribe}
                disabled={isTranscribing}
                className="w-full px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mb-3"
              >
                <FileText className="w-4 h-4" />
                {isTranscribing ? 'Transcribing...' : 'Generate Transcript'}
              </button>
            )}

            {/* Download */}
            <button
              onClick={() => {
                const url = URL.createObjectURL(note.audioBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `voice-note-${note.id}.webm`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="w-full px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Audio
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VoiceNoteRecorder;
