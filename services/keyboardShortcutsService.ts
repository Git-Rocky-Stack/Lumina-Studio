// =============================================
// Keyboard Shortcuts V2 Service
// Vim-style commands, custom keybindings, macro recording
// =============================================

import { supabase } from '../lib/supabase';

// =============================================
// Types
// =============================================

export interface KeyboardShortcut {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: 'general' | 'editing' | 'navigation' | 'tools' | 'vim' | 'custom';
  key_combo: string;
  key_code?: string;
  modifiers: string[];
  action_type: 'command' | 'macro' | 'vim_command' | 'script';
  action_data: Record<string, any>;
  is_enabled: boolean;
  is_global: boolean;
  requires_selection: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface RecordedMacro {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  steps: MacroStep[];
  recorded_duration_ms?: number;
  playback_speed: number;
  loop_count: number;
  times_used: number;
  last_used_at?: string;
  shortcut_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MacroStep {
  id: string;
  type: 'command' | 'keypress' | 'mouse' | 'wait';
  data: Record<string, any>;
  timestamp: number;
}

export type KeyModifier = 'ctrl' | 'shift' | 'alt' | 'meta';

interface VimState {
  mode: 'normal' | 'insert' | 'visual' | 'command';
  buffer: string;
  count: number;
  register: string;
  lastCommand?: string;
  visualStart?: { x: number; y: number };
}

type CommandHandler = (args?: Record<string, any>) => void | Promise<void>;

// =============================================
// Default Shortcuts
// =============================================

const DEFAULT_SHORTCUTS: Partial<KeyboardShortcut>[] = [
  // Editing
  { name: 'Select All', category: 'editing', key_combo: 'ctrl+a', modifiers: ['ctrl'], action_type: 'command', action_data: { command: 'selectAll' } },
  { name: 'Copy', category: 'editing', key_combo: 'ctrl+c', modifiers: ['ctrl'], action_type: 'command', action_data: { command: 'copy' } },
  { name: 'Paste', category: 'editing', key_combo: 'ctrl+v', modifiers: ['ctrl'], action_type: 'command', action_data: { command: 'paste' } },
  { name: 'Cut', category: 'editing', key_combo: 'ctrl+x', modifiers: ['ctrl'], action_type: 'command', action_data: { command: 'cut' } },
  { name: 'Undo', category: 'editing', key_combo: 'ctrl+z', modifiers: ['ctrl'], action_type: 'command', action_data: { command: 'undo' } },
  { name: 'Redo', category: 'editing', key_combo: 'ctrl+shift+z', modifiers: ['ctrl', 'shift'], action_type: 'command', action_data: { command: 'redo' } },
  { name: 'Delete', category: 'editing', key_combo: 'delete', modifiers: [], action_type: 'command', action_data: { command: 'delete' } },
  { name: 'Duplicate', category: 'editing', key_combo: 'ctrl+d', modifiers: ['ctrl'], action_type: 'command', action_data: { command: 'duplicate' } },
  { name: 'Group', category: 'editing', key_combo: 'ctrl+g', modifiers: ['ctrl'], action_type: 'command', action_data: { command: 'group' } },
  { name: 'Ungroup', category: 'editing', key_combo: 'ctrl+shift+g', modifiers: ['ctrl', 'shift'], action_type: 'command', action_data: { command: 'ungroup' } },

  // Navigation
  { name: 'Zoom In', category: 'navigation', key_combo: 'ctrl+=', modifiers: ['ctrl'], action_type: 'command', action_data: { command: 'zoomIn' }, is_global: true },
  { name: 'Zoom Out', category: 'navigation', key_combo: 'ctrl+-', modifiers: ['ctrl'], action_type: 'command', action_data: { command: 'zoomOut' }, is_global: true },
  { name: 'Fit to Screen', category: 'navigation', key_combo: 'ctrl+0', modifiers: ['ctrl'], action_type: 'command', action_data: { command: 'fitToScreen' }, is_global: true },

  // Tools
  { name: 'Select Tool', category: 'tools', key_combo: 'v', modifiers: [], action_type: 'command', action_data: { command: 'setTool', tool: 'select' } },
  { name: 'Rectangle Tool', category: 'tools', key_combo: 'r', modifiers: [], action_type: 'command', action_data: { command: 'setTool', tool: 'rect' } },
  { name: 'Ellipse Tool', category: 'tools', key_combo: 'o', modifiers: [], action_type: 'command', action_data: { command: 'setTool', tool: 'ellipse' } },
  { name: 'Text Tool', category: 'tools', key_combo: 't', modifiers: [], action_type: 'command', action_data: { command: 'setTool', tool: 'text' } },
  { name: 'Line Tool', category: 'tools', key_combo: 'l', modifiers: [], action_type: 'command', action_data: { command: 'setTool', tool: 'line' } },
  { name: 'Pan Tool', category: 'tools', key_combo: 'h', modifiers: [], action_type: 'command', action_data: { command: 'setTool', tool: 'pan' } },

  // Vim-style
  { name: 'Vim: Go to Top', category: 'vim', key_combo: 'g g', modifiers: [], action_type: 'vim_command', action_data: { command: 'goToTop' } },
  { name: 'Vim: Go to Bottom', category: 'vim', key_combo: 'G', modifiers: ['shift'], action_type: 'vim_command', action_data: { command: 'goToBottom' } },
  { name: 'Vim: Delete', category: 'vim', key_combo: 'd d', modifiers: [], action_type: 'vim_command', action_data: { command: 'delete' } },
  { name: 'Vim: Yank', category: 'vim', key_combo: 'y y', modifiers: [], action_type: 'vim_command', action_data: { command: 'yank' } },
  { name: 'Vim: Paste', category: 'vim', key_combo: 'p', modifiers: [], action_type: 'vim_command', action_data: { command: 'paste' } },
  { name: 'Vim: Undo', category: 'vim', key_combo: 'u', modifiers: [], action_type: 'vim_command', action_data: { command: 'undo' } },
  { name: 'Vim: Redo', category: 'vim', key_combo: 'ctrl+r', modifiers: ['ctrl'], action_type: 'vim_command', action_data: { command: 'redo' } },
];

// =============================================
// Keyboard Shortcuts Service
// =============================================

class KeyboardShortcutsService {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private commandHandlers: Map<string, CommandHandler> = new Map();
  private macros: Map<string, RecordedMacro> = new Map();
  private isRecording = false;
  private recordedSteps: MacroStep[] = [];
  private recordingStartTime = 0;
  private vimMode = false;
  private vimState: VimState = {
    mode: 'normal',
    buffer: '',
    count: 1,
    register: '"',
  };
  private keySequence: string[] = [];
  private keySequenceTimeout: NodeJS.Timeout | null = null;
  private listeners: Set<(event: KeyboardEvent, shortcut?: KeyboardShortcut) => void> = new Set();

  // =============================================
  // Initialization
  // =============================================

  async init(): Promise<void> {
    await this.loadShortcuts();
    await this.loadMacros();
    this.setupGlobalListener();
  }

  private setupGlobalListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  destroy(): void {
    if (typeof window === 'undefined') return;

    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }

  // =============================================
  // Shortcut Management
  // =============================================

  async loadShortcuts(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Load defaults for non-authenticated users
      DEFAULT_SHORTCUTS.forEach((shortcut, index) => {
        const id = `default-${index}`;
        this.shortcuts.set(id, {
          ...shortcut,
          id,
          user_id: '',
          is_enabled: true,
          is_global: shortcut.is_global || false,
          requires_selection: false,
          priority: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as KeyboardShortcut);
      });
      return;
    }

    const { data, error } = await supabase
      .from('keyboard_shortcuts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_enabled', true)
      .order('priority', { ascending: false });

    if (error) {
      console.error('Failed to load shortcuts:', error);
      return;
    }

    this.shortcuts.clear();
    (data || []).forEach(shortcut => {
      this.shortcuts.set(shortcut.id, shortcut);
    });

    // Add defaults if user has none
    if (this.shortcuts.size === 0) {
      DEFAULT_SHORTCUTS.forEach((shortcut, index) => {
        const id = `default-${index}`;
        this.shortcuts.set(id, {
          ...shortcut,
          id,
          user_id: user.id,
          is_enabled: true,
          is_global: shortcut.is_global || false,
          requires_selection: false,
          priority: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as KeyboardShortcut);
      });
    }
  }

  async createShortcut(shortcut: Partial<KeyboardShortcut>): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('keyboard_shortcuts')
      .insert({
        user_id: user.id,
        name: shortcut.name,
        description: shortcut.description,
        category: shortcut.category || 'custom',
        key_combo: shortcut.key_combo,
        key_code: shortcut.key_code,
        modifiers: shortcut.modifiers || [],
        action_type: shortcut.action_type || 'command',
        action_data: shortcut.action_data || {},
        is_enabled: true,
        is_global: shortcut.is_global || false,
        requires_selection: shortcut.requires_selection || false,
        priority: shortcut.priority || 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create shortcut:', error);
      return null;
    }

    await this.loadShortcuts();
    return data?.id;
  }

  async updateShortcut(id: string, updates: Partial<KeyboardShortcut>): Promise<boolean> {
    const { error } = await supabase
      .from('keyboard_shortcuts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Failed to update shortcut:', error);
      return false;
    }

    await this.loadShortcuts();
    return true;
  }

  async deleteShortcut(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('keyboard_shortcuts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete shortcut:', error);
      return false;
    }

    this.shortcuts.delete(id);
    return true;
  }

  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcutsByCategory(category: string): KeyboardShortcut[] {
    return this.getShortcuts().filter(s => s.category === category);
  }

  // =============================================
  // Command Registration
  // =============================================

  registerCommand(name: string, handler: CommandHandler): void {
    this.commandHandlers.set(name, handler);
  }

  unregisterCommand(name: string): void {
    this.commandHandlers.delete(name);
  }

  async executeCommand(name: string, args?: Record<string, any>): Promise<void> {
    const handler = this.commandHandlers.get(name);
    if (handler) {
      await handler(args);
    } else {
      console.warn(`Unknown command: ${name}`);
    }
  }

  // =============================================
  // Key Handling
  // =============================================

  private handleKeyDown(event: KeyboardEvent): void {
    // Ignore if typing in input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      if (!this.vimMode || this.vimState.mode !== 'normal') {
        return;
      }
    }

    // Record if recording
    if (this.isRecording) {
      this.recordKeypress(event);
    }

    // Build key combo string
    const combo = this.buildKeyCombo(event);

    // Handle Vim mode
    if (this.vimMode) {
      const handled = this.handleVimKey(event, combo);
      if (handled) {
        event.preventDefault();
        return;
      }
    }

    // Handle key sequences (like 'g g')
    this.keySequence.push(combo);
    if (this.keySequenceTimeout) {
      clearTimeout(this.keySequenceTimeout);
    }
    this.keySequenceTimeout = setTimeout(() => {
      this.keySequence = [];
    }, 500);

    // Check for sequence match
    const sequenceCombo = this.keySequence.join(' ');
    let matchedShortcut = this.findShortcutByCombo(sequenceCombo);

    // If no sequence match, try single key
    if (!matchedShortcut) {
      matchedShortcut = this.findShortcutByCombo(combo);
    }

    if (matchedShortcut && matchedShortcut.is_enabled) {
      event.preventDefault();
      this.executeShortcut(matchedShortcut);
      this.keySequence = [];

      // Notify listeners
      this.listeners.forEach(listener => listener(event, matchedShortcut));
    }
  }

  private handleKeyUp(_event: KeyboardEvent): void {
    // Can be used for modifier key release tracking
  }

  private buildKeyCombo(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');

    // Get key
    let key = event.key.toLowerCase();
    if (key === ' ') key = 'space';
    if (key === 'escape') key = 'esc';

    // Don't add modifier keys themselves
    if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
      parts.push(key);
    }

    return parts.join('+');
  }

  private findShortcutByCombo(combo: string): KeyboardShortcut | undefined {
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.key_combo.toLowerCase() === combo.toLowerCase()) {
        return shortcut;
      }
    }
    return undefined;
  }

  private async executeShortcut(shortcut: KeyboardShortcut): Promise<void> {
    switch (shortcut.action_type) {
      case 'command':
        await this.executeCommand(
          shortcut.action_data.command,
          shortcut.action_data
        );
        break;

      case 'macro':
        const macro = this.macros.get(shortcut.action_data.macroId);
        if (macro) {
          await this.playMacro(macro);
        }
        break;

      case 'vim_command':
        this.executeVimCommand(shortcut.action_data.command);
        break;

      case 'script':
        // Execute custom script (sandboxed)
        try {
          const fn = new Function('api', shortcut.action_data.script);
          fn(this.getScriptAPI());
        } catch (error) {
          console.error('Script execution error:', error);
        }
        break;
    }
  }

  // =============================================
  // Vim Mode
  // =============================================

  enableVimMode(): void {
    this.vimMode = true;
    this.vimState = {
      mode: 'normal',
      buffer: '',
      count: 1,
      register: '"',
    };
  }

  disableVimMode(): void {
    this.vimMode = false;
  }

  isVimModeEnabled(): boolean {
    return this.vimMode;
  }

  getVimState(): VimState {
    return { ...this.vimState };
  }

  private handleVimKey(event: KeyboardEvent, combo: string): boolean {
    const key = event.key;

    // Handle mode switches
    if (this.vimState.mode === 'normal') {
      if (key === 'i') {
        this.vimState.mode = 'insert';
        return true;
      }
      if (key === 'v') {
        this.vimState.mode = 'visual';
        return true;
      }
      if (key === ':') {
        this.vimState.mode = 'command';
        this.vimState.buffer = ':';
        return true;
      }

      // Handle count prefix
      if (/^[1-9]$/.test(key) && this.vimState.buffer === '') {
        this.vimState.count = parseInt(key);
        this.vimState.buffer = key;
        return true;
      }
      if (/^[0-9]$/.test(key) && /^[1-9]/.test(this.vimState.buffer)) {
        this.vimState.count = parseInt(this.vimState.buffer + key);
        this.vimState.buffer += key;
        return true;
      }

      // Build buffer for multi-key commands
      this.vimState.buffer += key;

      // Check for vim shortcuts
      for (const shortcut of this.shortcuts.values()) {
        if (shortcut.category === 'vim' && shortcut.action_type === 'vim_command') {
          const vimCombo = shortcut.key_combo.replace(/ /g, '');
          if (this.vimState.buffer === vimCombo) {
            for (let i = 0; i < this.vimState.count; i++) {
              this.executeVimCommand(shortcut.action_data.command);
            }
            this.resetVimState();
            return true;
          }
        }
      }

      // Clear buffer on ESC
      if (key === 'Escape') {
        this.resetVimState();
        return true;
      }

      // If buffer doesn't match any prefix, clear it
      const hasPrefix = Array.from(this.shortcuts.values()).some(s => {
        if (s.category !== 'vim') return false;
        const vimCombo = s.key_combo.replace(/ /g, '');
        return vimCombo.startsWith(this.vimState.buffer);
      });

      if (!hasPrefix) {
        this.resetVimState();
      }

      return this.vimState.buffer.length > 0;
    }

    if (this.vimState.mode === 'insert') {
      if (key === 'Escape') {
        this.vimState.mode = 'normal';
        return true;
      }
      return false; // Let normal typing through
    }

    if (this.vimState.mode === 'visual') {
      if (key === 'Escape') {
        this.vimState.mode = 'normal';
        return true;
      }
      if (key === 'd' || key === 'x') {
        this.executeCommand('delete');
        this.vimState.mode = 'normal';
        return true;
      }
      if (key === 'y') {
        this.executeCommand('copy');
        this.vimState.mode = 'normal';
        return true;
      }
    }

    if (this.vimState.mode === 'command') {
      if (key === 'Escape') {
        this.resetVimState();
        return true;
      }
      if (key === 'Enter') {
        this.executeVimCommandLine(this.vimState.buffer.slice(1));
        this.resetVimState();
        return true;
      }
      if (key === 'Backspace') {
        this.vimState.buffer = this.vimState.buffer.slice(0, -1);
        if (this.vimState.buffer === '') {
          this.vimState.mode = 'normal';
        }
        return true;
      }
      this.vimState.buffer += key;
      return true;
    }

    return false;
  }

  private resetVimState(): void {
    this.vimState = {
      mode: 'normal',
      buffer: '',
      count: 1,
      register: '"',
    };
  }

  private executeVimCommand(command: string): void {
    switch (command) {
      case 'goToTop':
        this.executeCommand('goToTop');
        break;
      case 'goToBottom':
        this.executeCommand('goToBottom');
        break;
      case 'delete':
        this.executeCommand('delete');
        break;
      case 'yank':
        this.executeCommand('copy');
        break;
      case 'paste':
        this.executeCommand('paste');
        break;
      case 'undo':
        this.executeCommand('undo');
        break;
      case 'redo':
        this.executeCommand('redo');
        break;
    }
  }

  private executeVimCommandLine(command: string): void {
    const parts = command.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    switch (cmd) {
      case 'w':
      case 'write':
        this.executeCommand('save');
        break;
      case 'q':
      case 'quit':
        this.executeCommand('close');
        break;
      case 'wq':
        this.executeCommand('save');
        this.executeCommand('close');
        break;
      case 'e':
      case 'edit':
        if (args[0]) {
          this.executeCommand('openFile', { path: args[0] });
        }
        break;
      case 'set':
        // Handle settings
        break;
    }
  }

  // =============================================
  // Macro Recording
  // =============================================

  async loadMacros(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('recorded_macros')
      .select('*')
      .eq('user_id', user.id)
      .order('last_used_at', { ascending: false });

    if (error) {
      console.error('Failed to load macros:', error);
      return;
    }

    this.macros.clear();
    (data || []).forEach(macro => {
      this.macros.set(macro.id, macro);
    });
  }

  startRecording(): void {
    this.isRecording = true;
    this.recordedSteps = [];
    this.recordingStartTime = Date.now();
  }

  stopRecording(): MacroStep[] {
    this.isRecording = false;
    const steps = [...this.recordedSteps];
    this.recordedSteps = [];
    return steps;
  }

  isRecordingMacro(): boolean {
    return this.isRecording;
  }

  recordStep(step: Omit<MacroStep, 'id' | 'timestamp'>): void {
    if (!this.isRecording) return;

    this.recordedSteps.push({
      ...step,
      id: `step-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now() - this.recordingStartTime,
    });
  }

  private recordKeypress(event: KeyboardEvent): void {
    this.recordStep({
      type: 'keypress',
      data: {
        key: event.key,
        code: event.code,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
      },
    });
  }

  async saveMacro(
    name: string,
    steps: MacroStep[],
    options?: {
      description?: string;
      icon?: string;
      color?: string;
      shortcut?: string;
    }
  ): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const duration = steps.length > 0
      ? steps[steps.length - 1].timestamp
      : 0;

    const { data, error } = await supabase
      .from('recorded_macros')
      .insert({
        user_id: user.id,
        name,
        description: options?.description,
        icon: options?.icon,
        color: options?.color || '#6366f1',
        steps,
        recorded_duration_ms: duration,
        playback_speed: 1.0,
        loop_count: 1,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to save macro:', error);
      return null;
    }

    // Create shortcut if requested
    if (options?.shortcut && data) {
      await this.createShortcut({
        name: `Macro: ${name}`,
        category: 'custom',
        key_combo: options.shortcut,
        action_type: 'macro',
        action_data: { macroId: data.id },
      });
    }

    await this.loadMacros();
    return data?.id;
  }

  async deleteMacro(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('recorded_macros')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete macro:', error);
      return false;
    }

    this.macros.delete(id);
    return true;
  }

  getMacros(): RecordedMacro[] {
    return Array.from(this.macros.values());
  }

  async playMacro(macro: RecordedMacro): Promise<void> {
    for (let loop = 0; loop < macro.loop_count; loop++) {
      for (const step of macro.steps) {
        // Wait for timing
        if (step.timestamp > 0 && macro.playback_speed > 0) {
          await new Promise(resolve =>
            setTimeout(resolve, step.timestamp / macro.playback_speed)
          );
        }

        // Execute step
        switch (step.type) {
          case 'command':
            await this.executeCommand(step.data.command, step.data.args);
            break;
          case 'keypress':
            // Simulate keypress by finding matching shortcut
            const combo = this.buildKeyComboFromData(step.data);
            const shortcut = this.findShortcutByCombo(combo);
            if (shortcut) {
              await this.executeShortcut(shortcut);
            }
            break;
          case 'wait':
            await new Promise(resolve => setTimeout(resolve, step.data.duration));
            break;
        }
      }
    }

    // Update usage stats
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('recorded_macros')
        .update({
          times_used: macro.times_used + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', macro.id);
    }
  }

  private buildKeyComboFromData(data: Record<string, any>): string {
    const parts: string[] = [];
    if (data.ctrlKey || data.metaKey) parts.push('ctrl');
    if (data.shiftKey) parts.push('shift');
    if (data.altKey) parts.push('alt');
    parts.push(data.key.toLowerCase());
    return parts.join('+');
  }

  // =============================================
  // Event Listeners
  // =============================================

  onShortcutExecuted(
    listener: (event: KeyboardEvent, shortcut?: KeyboardShortcut) => void
  ): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // =============================================
  // Script API (for custom scripts)
  // =============================================

  private getScriptAPI() {
    return {
      executeCommand: this.executeCommand.bind(this),
      getSelection: () => null, // Implement based on canvas
      setSelection: (_ids: string[]) => { }, // Implement based on canvas
      createElement: (_type: string, _props: any) => { }, // Implement based on canvas
      getElement: (_id: string) => null, // Implement based on canvas
      updateElement: (_id: string, _props: any) => { }, // Implement based on canvas
      deleteElement: (_id: string) => { }, // Implement based on canvas
    };
  }

  // =============================================
  // Utility Methods
  // =============================================

  getCategories(): Array<{ id: string; name: string; icon: string }> {
    return [
      { id: 'general', name: 'General', icon: 'keyboard' },
      { id: 'editing', name: 'Editing', icon: 'edit' },
      { id: 'navigation', name: 'Navigation', icon: 'move' },
      { id: 'tools', name: 'Tools', icon: 'tool' },
      { id: 'vim', name: 'Vim Commands', icon: 'terminal' },
      { id: 'custom', name: 'Custom', icon: 'star' },
    ];
  }

  formatKeyCombo(combo: string): string {
    return combo
      .split('+')
      .map(key => {
        switch (key.toLowerCase()) {
          case 'ctrl': return '⌘';
          case 'shift': return '⇧';
          case 'alt': return '⌥';
          case 'meta': return '⌘';
          case 'space': return '␣';
          case 'enter': return '↵';
          case 'escape':
          case 'esc': return 'Esc';
          case 'delete': return '⌫';
          case 'backspace': return '⌫';
          default: return key.toUpperCase();
        }
      })
      .join('');
  }
}

// =============================================
// Export Singleton
// =============================================

export const keyboardShortcuts = new KeyboardShortcutsService();
export default keyboardShortcuts;
