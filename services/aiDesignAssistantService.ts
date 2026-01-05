// =============================================
// AI Design Assistant Service
// Natural language commands for design editing
// =============================================

import { supabase } from '../lib/supabase';

// =============================================
// Types
// =============================================

export interface AICommand {
  id: string;
  command_text: string;
  command_type: CommandType;
  context_data: CommandContext;
  response_data: CommandResponse;
  execution_status: 'pending' | 'processing' | 'completed' | 'failed';
  execution_time_ms?: number;
  tokens_used: number;
  created_at: string;
}

export type CommandType = 'generate' | 'edit' | 'style' | 'layout' | 'content';

export interface CommandContext {
  selectedElements?: string[];
  currentCanvasState?: any;
  projectId?: string;
  viewport?: { x: number; y: number; zoom: number };
}

export interface CommandResponse {
  actions: DesignAction[];
  explanation: string;
  suggestions?: string[];
  confidence: number;
}

export interface DesignAction {
  type: 'create' | 'update' | 'delete' | 'move' | 'style' | 'group';
  targetId?: string;
  properties: Record<string, any>;
}

export interface CommandTemplate {
  id: string;
  name: string;
  description: string;
  command_template: string;
  category: string;
  icon: string;
  usage_count: number;
}

export interface DesignSuggestion {
  id: string;
  suggestion_type: 'improvement' | 'alternative' | 'accessibility' | 'trend';
  target_element_id?: string;
  suggestion_data: {
    title: string;
    description: string;
    preview?: any;
    actions: DesignAction[];
  };
  confidence_score: number;
  is_dismissed: boolean;
  is_applied: boolean;
}

export interface StylePreset {
  id: string;
  name: string;
  description?: string;
  style_data: {
    colors: string[];
    fonts: string[];
    spacing: Record<string, number>;
    borderRadius: number;
    shadows: any[];
  };
  is_favorite: boolean;
  usage_count: number;
}

// =============================================
// Command Parser
// =============================================

interface ParsedCommand {
  intent: CommandType;
  action: string;
  targets: string[];
  modifiers: Record<string, any>;
  parameters: Record<string, any>;
}

function parseCommand(input: string): ParsedCommand {
  const normalizedInput = input.toLowerCase().trim();

  // Intent detection patterns
  const intents: Record<CommandType, RegExp[]> = {
    generate: [/^(create|add|generate|make|insert)/i],
    edit: [/^(change|modify|edit|update|set)/i],
    style: [/^(style|color|font|make.*bold|make.*italic)/i],
    layout: [/^(move|align|center|position|resize|arrange)/i],
    content: [/^(write|text|headline|copy|caption)/i],
  };

  let intent: CommandType = 'edit';
  for (const [type, patterns] of Object.entries(intents)) {
    if (patterns.some((p) => p.test(normalizedInput))) {
      intent = type as CommandType;
      break;
    }
  }

  // Extract targets
  const targetPatterns = [
    /(?:the\s+)?(\w+)\s+(?:element|layer|object|text|image|shape)/i,
    /(?:this|that|selected|current)\s+(\w+)/i,
    /(\w+)\s+(?:to|into|as)/i,
  ];

  const targets: string[] = [];
  for (const pattern of targetPatterns) {
    const match = normalizedInput.match(pattern);
    if (match) targets.push(match[1]);
  }

  // Extract modifiers
  const modifiers: Record<string, any> = {};

  // Color extraction
  const colorMatch = normalizedInput.match(
    /#[0-9a-f]{6}|#[0-9a-f]{3}|\b(red|blue|green|yellow|purple|orange|pink|black|white|gray|grey)\b/i
  );
  if (colorMatch) modifiers.color = colorMatch[0];

  // Size extraction
  const sizeMatch = normalizedInput.match(/(\d+)\s*(px|%|em|rem)/i);
  if (sizeMatch) modifiers.size = { value: parseInt(sizeMatch[1]), unit: sizeMatch[2] };

  // Direction extraction
  const directionMatch = normalizedInput.match(/\b(left|right|top|bottom|center|middle)\b/i);
  if (directionMatch) modifiers.direction = directionMatch[1].toLowerCase();

  // Amount extraction
  const amountMatch = normalizedInput.match(/\b(more|less|slightly|very|much)\b/i);
  if (amountMatch) modifiers.amount = amountMatch[1].toLowerCase();

  return {
    intent,
    action: normalizedInput.split(' ').slice(0, 2).join(' '),
    targets,
    modifiers,
    parameters: {},
  };
}

// =============================================
// AI Design Assistant Service
// =============================================

class AIDesignAssistantService {
  private apiKey: string | null = null;

  // =============================================
  // Command Execution
  // =============================================

  async executeCommand(
    commandText: string,
    context: CommandContext
  ): Promise<CommandResponse> {
    const startTime = Date.now();

    try {
      // Parse the command locally first
      const parsed = parseCommand(commandText);

      // Generate actions based on parsed command
      const actions = await this.generateActions(parsed, context);

      // Create history record
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('ai_command_history').insert({
          user_id: user.id,
          command_text: commandText,
          command_type: parsed.intent,
          context_data: context,
          response_data: { actions, explanation: '', confidence: 0.85 },
          execution_status: 'completed',
          execution_time_ms: Date.now() - startTime,
          tokens_used: Math.ceil(commandText.length / 4),
        });
      }

      return {
        actions,
        explanation: this.generateExplanation(parsed, actions),
        suggestions: this.generateSuggestions(parsed),
        confidence: 0.85,
      };
    } catch (error) {
      console.error('AI command execution failed:', error);
      throw error;
    }
  }

  private async generateActions(
    parsed: ParsedCommand,
    context: CommandContext
  ): Promise<DesignAction[]> {
    const actions: DesignAction[] = [];
    const selectedIds = context.selectedElements || [];

    switch (parsed.intent) {
      case 'style':
        if (parsed.modifiers.color) {
          for (const id of selectedIds) {
            actions.push({
              type: 'style',
              targetId: id,
              properties: { fill: parsed.modifiers.color },
            });
          }
        }
        if (parsed.action.includes('bold')) {
          for (const id of selectedIds) {
            actions.push({
              type: 'style',
              targetId: id,
              properties: { fontWeight: 'bold' },
            });
          }
        }
        if (parsed.action.includes('shadow')) {
          for (const id of selectedIds) {
            actions.push({
              type: 'style',
              targetId: id,
              properties: {
                shadow: {
                  color: 'rgba(0,0,0,0.2)',
                  blur: 10,
                  offsetX: 0,
                  offsetY: 4,
                },
              },
            });
          }
        }
        break;

      case 'layout':
        if (parsed.modifiers.direction === 'center') {
          for (const id of selectedIds) {
            actions.push({
              type: 'move',
              targetId: id,
              properties: { align: 'center' },
            });
          }
        }
        break;

      case 'generate':
        if (parsed.action.includes('button') || parsed.action.includes('cta')) {
          actions.push({
            type: 'create',
            properties: {
              type: 'button',
              text: 'Click Here',
              fill: parsed.modifiers.color || '#6366f1',
              width: 160,
              height: 48,
              borderRadius: 8,
            },
          });
        }
        if (parsed.action.includes('text') || parsed.action.includes('headline')) {
          actions.push({
            type: 'create',
            properties: {
              type: 'text',
              text: 'New Headline',
              fontSize: 32,
              fontWeight: 'bold',
            },
          });
        }
        break;

      case 'content':
        // Generate text content
        const generatedText = await this.generateText(parsed.action);
        for (const id of selectedIds) {
          actions.push({
            type: 'update',
            targetId: id,
            properties: { text: generatedText },
          });
        }
        break;
    }

    return actions;
  }

  private generateExplanation(parsed: ParsedCommand, actions: DesignAction[]): string {
    if (actions.length === 0) {
      return "I couldn't understand that command. Try being more specific.";
    }

    const actionDescriptions = actions.map((a) => {
      switch (a.type) {
        case 'style':
          return `Updated styling${a.targetId ? ` for element` : ''}`;
        case 'move':
          return `Repositioned element`;
        case 'create':
          return `Created new ${a.properties.type || 'element'}`;
        case 'update':
          return `Modified content`;
        default:
          return `Applied ${a.type}`;
      }
    });

    return actionDescriptions.join('. ') + '.';
  }

  private generateSuggestions(parsed: ParsedCommand): string[] {
    const suggestions: string[] = [];

    if (parsed.intent === 'style') {
      suggestions.push('Try "add a subtle shadow" for depth');
      suggestions.push('Say "make it more minimal" for a cleaner look');
    }

    if (parsed.intent === 'generate') {
      suggestions.push('Try "add a headline about [topic]"');
      suggestions.push('Say "create a social media post layout"');
    }

    return suggestions.slice(0, 3);
  }

  private async generateText(prompt: string): Promise<string> {
    // Simple text generation - in production, use actual AI
    const templates: Record<string, string> = {
      headline: 'Discover Something Amazing Today',
      cta: 'Get Started Now',
      caption: 'Your journey begins here.',
      default: 'Sample text content',
    };

    for (const [key, value] of Object.entries(templates)) {
      if (prompt.includes(key)) return value;
    }

    return templates.default;
  }

  // =============================================
  // Command Templates
  // =============================================

  async getCommandTemplates(category?: string): Promise<CommandTemplate[]> {
    let query = supabase
      .from('ai_command_templates')
      .select('*')
      .order('usage_count', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Failed to fetch templates:', error);
      return [];
    }

    return data || [];
  }

  async useTemplate(templateId: string, variables: Record<string, string>): Promise<string> {
    const { data } = await supabase
      .from('ai_command_templates')
      .select('command_template')
      .eq('id', templateId)
      .single();

    if (!data) return '';

    // Replace variables in template
    let command = data.command_template;
    for (const [key, value] of Object.entries(variables)) {
      command = command.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    // Increment usage count
    await supabase.rpc('increment', { row_id: templateId, table_name: 'ai_command_templates' });

    return command;
  }

  // =============================================
  // Design Suggestions
  // =============================================

  async getSuggestions(projectId?: string): Promise<DesignSuggestion[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('ai_design_suggestions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_dismissed', false)
      .order('confidence_score', { ascending: false })
      .limit(10);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Failed to fetch suggestions:', error);
      return [];
    }

    return data || [];
  }

  async dismissSuggestion(suggestionId: string): Promise<void> {
    await supabase
      .from('ai_design_suggestions')
      .update({ is_dismissed: true })
      .eq('id', suggestionId);
  }

  async applySuggestion(suggestionId: string): Promise<DesignAction[]> {
    const { data } = await supabase
      .from('ai_design_suggestions')
      .select('suggestion_data')
      .eq('id', suggestionId)
      .single();

    if (!data) return [];

    await supabase
      .from('ai_design_suggestions')
      .update({ is_applied: true })
      .eq('id', suggestionId);

    return data.suggestion_data?.actions || [];
  }

  // =============================================
  // Style Presets
  // =============================================

  async getStylePresets(): Promise<StylePreset[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('ai_style_presets')
      .select('*')
      .eq('user_id', user.id)
      .order('is_favorite', { ascending: false })
      .order('usage_count', { ascending: false });

    if (error) {
      console.error('Failed to fetch presets:', error);
      return [];
    }

    return data || [];
  }

  async saveStylePreset(name: string, styleData: StylePreset['style_data']): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('ai_style_presets')
      .insert({
        user_id: user.id,
        name,
        style_data: styleData,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to save preset:', error);
      return null;
    }

    return data?.id;
  }

  async applyStylePreset(presetId: string): Promise<StylePreset['style_data'] | null> {
    const { data } = await supabase
      .from('ai_style_presets')
      .select('style_data')
      .eq('id', presetId)
      .single();

    if (!data) return null;

    // Increment usage
    await supabase
      .from('ai_style_presets')
      .update({ usage_count: supabase.rpc('increment_value', { x: 1 }) })
      .eq('id', presetId);

    return data.style_data;
  }

  // =============================================
  // Command History
  // =============================================

  async getCommandHistory(limit = 20): Promise<AICommand[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('ai_command_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch history:', error);
      return [];
    }

    return data || [];
  }

  async rateCommand(commandId: string, rating: number, feedback?: string): Promise<void> {
    await supabase
      .from('ai_command_history')
      .update({
        feedback_rating: rating,
        feedback_text: feedback,
      })
      .eq('id', commandId);
  }
}

// Export singleton
export const aiDesignAssistant = new AIDesignAssistantService();
