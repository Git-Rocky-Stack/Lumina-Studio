import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShortcutCategory {
  name: string;
  shortcuts: { keys: string[]; description: string }[];
}

const shortcutCategories: ShortcutCategory[] = [
  {
    name: 'General',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Open command palette' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Ctrl', 'S'], description: 'Save to cloud' },
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Esc'], description: 'Close modal / Deselect' },
    ],
  },
  {
    name: 'Canvas',
    shortcuts: [
      { keys: ['↑', '↓', '←', '→'], description: 'Move selected element (1px)' },
      { keys: ['Shift', '↑↓←→'], description: 'Move selected element (10px)' },
      { keys: ['Delete'], description: 'Delete selected element' },
      { keys: ['Ctrl', 'D'], description: 'Duplicate element' },
      { keys: ['Ctrl', '['], description: 'Send to back' },
      { keys: ['Ctrl', ']'], description: 'Bring to front' },
      { keys: ['Ctrl', 'A'], description: 'Select all elements' },
      { keys: ['Ctrl', 'G'], description: 'Group selected' },
    ],
  },
  {
    name: 'Navigation',
    shortcuts: [
      { keys: ['G', 'then', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'then', 'C'], description: 'Go to Canvas' },
      { keys: ['G', 'then', 'S'], description: 'Go to AI Stock' },
      { keys: ['G', 'then', 'V'], description: 'Go to Video Studio' },
      { keys: ['G', 'then', 'P'], description: 'Go to Pro Photo' },
    ],
  },
  {
    name: 'Tools',
    shortcuts: [
      { keys: ['V'], description: 'Select tool' },
      { keys: ['T'], description: 'Text tool' },
      { keys: ['R'], description: 'Rectangle tool' },
      { keys: ['O'], description: 'Ellipse tool' },
      { keys: ['L'], description: 'Line tool' },
      { keys: ['I'], description: 'Image tool' },
    ],
  },
  {
    name: 'Zoom & View',
    shortcuts: [
      { keys: ['Ctrl', '+'], description: 'Zoom in' },
      { keys: ['Ctrl', '-'], description: 'Zoom out' },
      { keys: ['Ctrl', '0'], description: 'Reset zoom (100%)' },
      { keys: ['Ctrl', '1'], description: 'Fit to screen' },
      { keys: ['Space', 'Drag'], description: 'Pan canvas' },
    ],
  },
];

interface KeyboardShortcutsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen: controlledIsOpen,
  onClose
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with ? key (Shift + /)
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (controlledIsOpen === undefined) {
          setInternalIsOpen(true);
        }
      }
      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        if (onClose) onClose();
        else setInternalIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, controlledIsOpen, onClose]);

  const handleClose = () => {
    if (onClose) onClose();
    else setInternalIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[85vh] bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 id="shortcuts-title" className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <i className="fas fa-keyboard text-white" aria-hidden="true" />
                  </div>
                  Keyboard Shortcuts
                </h2>
                <p className="text-slate-400 text-sm mt-1">Master Lumina Studio with these shortcuts</p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close shortcuts modal"
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <i className="fas fa-times" aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {shortcutCategories.map((category) => (
                  <div key={category.name}>
                    <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-4">
                      {category.name}
                    </h3>
                    <div className="space-y-3">
                      {category.shortcuts.map((shortcut, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <span className="text-slate-300 text-sm">{shortcut.description}</span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, keyIdx) => (
                              <React.Fragment key={keyIdx}>
                                {key === 'then' ? (
                                  <span className="text-slate-500 text-xs mx-1">then</span>
                                ) : (
                                  <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono min-w-[28px] text-center">
                                    {key}
                                  </kbd>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-white/10 bg-slate-900/50">
              <p className="text-center text-slate-500 text-sm">
                Press <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 text-xs font-mono mx-1">?</kbd> anytime to show this menu
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcutsModal;
