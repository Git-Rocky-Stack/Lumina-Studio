// =============================================
// AI Assistant Components Index
// Export all AI design assistant UI components
// =============================================

export { AICommandBar } from './AICommandBar';
export { StylePresetsPanel } from './StylePresetsPanel';
export { AISuggestionsPanel } from './AISuggestionsPanel';

// Re-export types from service
export type {
  AICommand,
  CommandType,
  CommandContext,
  CommandResponse,
  DesignAction,
  CommandTemplate,
  DesignSuggestion,
  StylePreset,
} from '../../services/aiDesignAssistantService';
