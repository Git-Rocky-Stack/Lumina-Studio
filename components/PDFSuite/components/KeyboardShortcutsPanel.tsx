// ============================================
// KeyboardShortcutsPanel Component
// Displays all available keyboard shortcuts
// ============================================

import React from 'react';

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['←', '↑', 'Page Up'], description: 'Previous page' },
      { keys: ['→', '↓', 'Page Down'], description: 'Next page' },
      { keys: ['Home'], description: 'Go to first page' },
      { keys: ['End'], description: 'Go to last page' },
      { keys: ['Ctrl', 'G'], description: 'Go to page...' },
    ],
  },
  {
    title: 'Zoom',
    shortcuts: [
      { keys: ['Ctrl', '+'], description: 'Zoom in' },
      { keys: ['Ctrl', '-'], description: 'Zoom out' },
      { keys: ['Ctrl', '0'], description: 'Fit to page' },
      { keys: ['Ctrl', '1'], description: 'Actual size (100%)' },
      { keys: ['Ctrl', 'Scroll'], description: 'Zoom with mouse wheel' },
    ],
  },
  {
    title: 'File Operations',
    shortcuts: [
      { keys: ['Ctrl', 'O'], description: 'Open file' },
      { keys: ['Ctrl', 'S'], description: 'Save document' },
      { keys: ['Ctrl', 'Shift', 'S'], description: 'Save as...' },
      { keys: ['Ctrl', 'P'], description: 'Print' },
      { keys: ['Ctrl', 'W'], description: 'Close document' },
    ],
  },
  {
    title: 'Edit',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Y'], description: 'Redo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo (alternative)' },
      { keys: ['Ctrl', 'A'], description: 'Select all' },
      { keys: ['Ctrl', 'C'], description: 'Copy' },
      { keys: ['Ctrl', 'V'], description: 'Paste' },
      { keys: ['Delete'], description: 'Delete selection' },
    ],
  },
  {
    title: 'Find & Replace',
    shortcuts: [
      { keys: ['Ctrl', 'F'], description: 'Find text' },
      { keys: ['Ctrl', 'H'], description: 'Find and replace' },
      { keys: ['F3'], description: 'Find next' },
      { keys: ['Shift', 'F3'], description: 'Find previous' },
      { keys: ['Esc'], description: 'Close search' },
    ],
  },
  {
    title: 'Tools',
    shortcuts: [
      { keys: ['V'], description: 'Select tool' },
      { keys: ['H'], description: 'Hand (pan) tool' },
      { keys: ['T'], description: 'Text select tool' },
      { keys: ['N'], description: 'Add note' },
      { keys: ['L'], description: 'Highlight tool' },
      { keys: ['U'], description: 'Underline tool' },
      { keys: ['K'], description: 'Strikethrough tool' },
      { keys: ['R'], description: 'Rectangle tool' },
      { keys: ['E'], description: 'Ellipse tool' },
      { keys: ['I'], description: 'Ink (freehand) tool' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { keys: ['Ctrl', 'Shift', 'J'], description: 'Toggle sidebar' },
      { keys: ['Ctrl', 'Shift', 'G'], description: 'Toggle grid' },
      { keys: ['Ctrl', 'Shift', 'R'], description: 'Toggle rulers' },
      { keys: ['F11'], description: 'Full screen' },
      { keys: ['Esc'], description: 'Exit full screen' },
    ],
  },
  {
    title: 'Rotation',
    shortcuts: [
      { keys: ['Ctrl', 'Shift', '→'], description: 'Rotate clockwise' },
      { keys: ['Ctrl', 'Shift', '←'], description: 'Rotate counter-clockwise' },
    ],
  },
];

interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[800px] max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-keyboard text-indigo-600"></i>
            </div>
            <div>
              <h2 className="type-section text-slate-800">Keyboard Shortcuts</h2>
              <p className="type-caption text-slate-500">Quick reference for all available shortcuts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="grid grid-cols-2 gap-6">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.title} className="space-y-3">
                <h3 className="type-card text-slate-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-slate-600 text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-700 shadow-sm">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-slate-300 text-xs">+</span>
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
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-slate-500 text-sm">
            <i className="fas fa-info-circle mr-2"></i>
            Press <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-xs font-mono">?</kbd> anytime to show this panel
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsPanel;
