// ============================================================================
// DESIGN TOKENS SERVICE
// ============================================================================

import {
  generateTokenId,
  generateGroupId,
  generateCollectionId,
  tokenToCssVar,
  tokenValueToCss,
  formatTokenValue,
  DEFAULT_COLORS,
  DEFAULT_TYPOGRAPHY,
  DEFAULT_SPACING,
  DEFAULT_BORDERS,
  DEFAULT_SHADOWS,
  DEFAULT_ANIMATIONS
} from '../types/designTokens';
import type {
  DesignToken,
  TokenGroup,
  TokenCollection,
  TokenCategory,
  TokenValue,
  TokenExportOptions,
  TokenExportFormat,
  TokenImportResult,
  TokenChangeEvent
} from '../types/designTokens';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  TOKENS: 'lumina_design_tokens',
  GROUPS: 'lumina_token_groups',
  COLLECTIONS: 'lumina_token_collections',
  ACTIVE_COLLECTION: 'lumina_active_collection',
  ACTIVE_MODE: 'lumina_token_mode'
};

// ============================================================================
// DESIGN TOKENS MANAGER
// ============================================================================

class DesignTokensManager {
  private tokens: Map<string, DesignToken> = new Map();
  private groups: TokenGroup[] = [];
  private collections: TokenCollection[] = [];
  private activeCollectionId: string = 'default';
  private activeMode: string = 'default';
  private changeHistory: TokenChangeEvent[] = [];

  // Callbacks
  private onTokensChange: ((tokens: DesignToken[]) => void) | null = null;

  constructor() {
    this.loadFromStorage();
    this.initializeDefaults();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private loadFromStorage(): void {
    try {
      const tokensJson = localStorage.getItem(STORAGE_KEYS.TOKENS);
      const groupsJson = localStorage.getItem(STORAGE_KEYS.GROUPS);
      const collectionsJson = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      const activeCollection = localStorage.getItem(STORAGE_KEYS.ACTIVE_COLLECTION);
      const activeMode = localStorage.getItem(STORAGE_KEYS.ACTIVE_MODE);

      if (tokensJson) {
        const tokens = JSON.parse(tokensJson) as DesignToken[];
        tokens.forEach(t => this.tokens.set(t.id, t));
      }

      if (groupsJson) {
        this.groups = JSON.parse(groupsJson);
      }

      if (collectionsJson) {
        this.collections = JSON.parse(collectionsJson);
      }

      if (activeCollection) {
        this.activeCollectionId = activeCollection;
      }

      if (activeMode) {
        this.activeMode = activeMode;
      }
    } catch (error) {
      console.error('Failed to load design tokens:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        STORAGE_KEYS.TOKENS,
        JSON.stringify(Array.from(this.tokens.values()))
      );
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(this.groups));
      localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(this.collections));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_COLLECTION, this.activeCollectionId);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_MODE, this.activeMode);
    } catch (error) {
      console.error('Failed to save design tokens:', error);
    }
  }

  private initializeDefaults(): void {
    if (this.tokens.size === 0) {
      // Create default tokens
      const now = new Date().toISOString();

      [...DEFAULT_COLORS, ...DEFAULT_TYPOGRAPHY, ...DEFAULT_SPACING, ...DEFAULT_BORDERS, ...DEFAULT_SHADOWS, ...DEFAULT_ANIMATIONS].forEach(def => {
        const token: DesignToken = {
          ...def,
          id: generateTokenId(),
          createdAt: now,
          updatedAt: now
        };
        this.tokens.set(token.id, token);
      });

      // Create default groups
      const categories: TokenCategory[] = ['colors', 'typography', 'spacing', 'borders', 'shadows', 'animations'];
      categories.forEach((category, index) => {
        const tokens = this.getTokensByCategory(category);
        this.groups.push({
          id: generateGroupId(),
          name: category.charAt(0).toUpperCase() + category.slice(1),
          category,
          tokenIds: tokens.map(t => t.id),
          order: index
        });
      });

      // Create default collection
      this.collections.push({
        id: 'default',
        name: 'Default System',
        version: '1.0.0',
        description: 'Lumina Studio default design tokens',
        tokens: this.tokens,
        groups: this.groups,
        modes: ['default', 'dark'],
        defaultMode: 'default',
        createdAt: now,
        updatedAt: now
      });

      this.saveToStorage();
    }
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  /**
   * Get all tokens
   */
  getAllTokens(): DesignToken[] {
    return Array.from(this.tokens.values());
  }

  /**
   * Get token by ID
   */
  getToken(id: string): DesignToken | undefined {
    return this.tokens.get(id);
  }

  /**
   * Get tokens by category
   */
  getTokensByCategory(category: TokenCategory): DesignToken[] {
    return this.getAllTokens().filter(t => t.category === category);
  }

  /**
   * Get tokens by tags
   */
  getTokensByTags(tags: string[]): DesignToken[] {
    return this.getAllTokens().filter(t =>
      t.tags && tags.some(tag => t.tags!.includes(tag))
    );
  }

  /**
   * Search tokens
   */
  searchTokens(query: string): DesignToken[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTokens().filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery) ||
      t.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Create a new token
   */
  createToken(
    name: string,
    category: TokenCategory,
    value: TokenValue,
    options?: {
      description?: string;
      tags?: string[];
      modes?: Record<string, TokenValue>;
    }
  ): DesignToken {
    const now = new Date().toISOString();

    const token: DesignToken = {
      id: generateTokenId(),
      name,
      category,
      value,
      description: options?.description,
      tags: options?.tags,
      modes: options?.modes,
      createdAt: now,
      updatedAt: now
    };

    this.tokens.set(token.id, token);

    // Add to category group
    const group = this.groups.find(g => g.category === category);
    if (group) {
      group.tokenIds.push(token.id);
    }

    this.recordChange({ type: 'create', token, timestamp: Date.now() });
    this.saveToStorage();
    this.notifyChange();

    return token;
  }

  /**
   * Update a token
   */
  updateToken(
    id: string,
    updates: Partial<Pick<DesignToken, 'name' | 'description' | 'value' | 'tags' | 'modes' | 'deprecated' | 'deprecationMessage'>>
  ): DesignToken | null {
    const token = this.tokens.get(id);
    if (!token) return null;

    const previousValue = { ...token.value };

    Object.assign(token, updates);
    token.updatedAt = new Date().toISOString();

    this.recordChange({ type: 'update', token, previousValue, timestamp: Date.now() });
    this.saveToStorage();
    this.notifyChange();

    return token;
  }

  /**
   * Delete a token
   */
  deleteToken(id: string): boolean {
    const token = this.tokens.get(id);
    if (!token) return false;

    this.tokens.delete(id);

    // Remove from groups
    this.groups.forEach(group => {
      const index = group.tokenIds.indexOf(id);
      if (index !== -1) {
        group.tokenIds.splice(index, 1);
      }
    });

    this.recordChange({ type: 'delete', token, timestamp: Date.now() });
    this.saveToStorage();
    this.notifyChange();

    return true;
  }

  /**
   * Duplicate a token
   */
  duplicateToken(id: string, newName?: string): DesignToken | null {
    const token = this.tokens.get(id);
    if (!token) return null;

    return this.createToken(
      newName || `${token.name} Copy`,
      token.category,
      { ...token.value },
      {
        description: token.description,
        tags: token.tags ? [...token.tags] : undefined,
        modes: token.modes ? { ...token.modes } : undefined
      }
    );
  }

  // ============================================================================
  // TOKEN VALUE RESOLUTION
  // ============================================================================

  /**
   * Resolve token value (handles aliases)
   */
  resolveValue(token: DesignToken, mode?: string): TokenValue {
    // Check for mode-specific value
    if (mode && token.modes && token.modes[mode]) {
      return token.modes[mode];
    }

    // Check for alias
    if (token.aliasOf) {
      const aliasedToken = this.tokens.get(token.aliasOf);
      if (aliasedToken) {
        return this.resolveValue(aliasedToken, mode);
      }
    }

    return token.value;
  }

  /**
   * Get CSS variable value
   */
  getCssValue(id: string, mode?: string): string {
    const token = this.tokens.get(id);
    if (!token) return '';

    const value = this.resolveValue(token, mode);
    return tokenValueToCss(value);
  }

  // ============================================================================
  // GROUP MANAGEMENT
  // ============================================================================

  /**
   * Get all groups
   */
  getGroups(): TokenGroup[] {
    return this.groups;
  }

  /**
   * Create a group
   */
  createGroup(name: string, category: TokenCategory, tokenIds: string[] = []): TokenGroup {
    const group: TokenGroup = {
      id: generateGroupId(),
      name,
      category,
      tokenIds,
      order: this.groups.length
    };

    this.groups.push(group);
    this.saveToStorage();

    return group;
  }

  /**
   * Update a group
   */
  updateGroup(id: string, updates: Partial<Omit<TokenGroup, 'id'>>): TokenGroup | null {
    const group = this.groups.find(g => g.id === id);
    if (!group) return null;

    Object.assign(group, updates);
    this.saveToStorage();

    return group;
  }

  /**
   * Delete a group
   */
  deleteGroup(id: string): boolean {
    const index = this.groups.findIndex(g => g.id === id);
    if (index === -1) return false;

    this.groups.splice(index, 1);
    this.saveToStorage();

    return true;
  }

  // ============================================================================
  // COLLECTION MANAGEMENT
  // ============================================================================

  /**
   * Get all collections
   */
  getCollections(): TokenCollection[] {
    return this.collections;
  }

  /**
   * Get active collection
   */
  getActiveCollection(): TokenCollection | undefined {
    return this.collections.find(c => c.id === this.activeCollectionId);
  }

  /**
   * Set active collection
   */
  setActiveCollection(id: string): boolean {
    const collection = this.collections.find(c => c.id === id);
    if (!collection) return false;

    this.activeCollectionId = id;
    this.tokens = collection.tokens;
    this.groups = collection.groups;

    this.saveToStorage();
    this.notifyChange();

    return true;
  }

  /**
   * Get active mode
   */
  getActiveMode(): string {
    return this.activeMode;
  }

  /**
   * Set active mode
   */
  setActiveMode(mode: string): void {
    this.activeMode = mode;
    this.saveToStorage();
    this.notifyChange();
  }

  // ============================================================================
  // EXPORT
  // ============================================================================

  /**
   * Export tokens
   */
  exportTokens(options: TokenExportOptions): string {
    const tokens = this.getFilteredTokens(options);

    switch (options.format) {
      case 'css':
        return this.exportToCss(tokens, options);
      case 'scss':
        return this.exportToScss(tokens, options);
      case 'json':
        return this.exportToJson(tokens, options);
      case 'js':
        return this.exportToJs(tokens, options);
      case 'ts':
        return this.exportToTs(tokens, options);
      case 'style-dictionary':
        return this.exportToStyleDictionary(tokens, options);
      default:
        return this.exportToJson(tokens, options);
    }
  }

  private getFilteredTokens(options: TokenExportOptions): DesignToken[] {
    let tokens = this.getAllTokens();

    if (options.categories && options.categories.length > 0) {
      tokens = tokens.filter(t => options.categories!.includes(t.category));
    }

    if (!options.includeDeprecated) {
      tokens = tokens.filter(t => !t.deprecated);
    }

    return tokens;
  }

  private exportToCss(tokens: DesignToken[], options: TokenExportOptions): string {
    const prefix = options.prefix || 'lumina';
    const lines: string[] = [':root {'];

    tokens.forEach(token => {
      const varName = tokenToCssVar(token.name, prefix);
      const value = this.getCssValue(token.id, options.mode);

      if (options.includeDescriptions && token.description) {
        lines.push(`  /* ${token.description} */`);
      }
      lines.push(`  ${varName}: ${value};`);
    });

    lines.push('}');

    return lines.join('\n');
  }

  private exportToScss(tokens: DesignToken[], options: TokenExportOptions): string {
    const prefix = options.prefix || 'lumina';
    const lines: string[] = [];

    // Group by category
    const grouped = new Map<TokenCategory, DesignToken[]>();
    tokens.forEach(token => {
      if (!grouped.has(token.category)) {
        grouped.set(token.category, []);
      }
      grouped.get(token.category)!.push(token);
    });

    grouped.forEach((categoryTokens, category) => {
      lines.push(`// ${category.toUpperCase()}`);
      lines.push('// ' + '-'.repeat(60));

      categoryTokens.forEach(token => {
        const varName = `$${prefix}-${token.name.toLowerCase().replace(/\s+/g, '-')}`;
        const value = this.getCssValue(token.id, options.mode);

        if (options.includeDescriptions && token.description) {
          lines.push(`// ${token.description}`);
        }
        lines.push(`${varName}: ${value};`);
      });

      lines.push('');
    });

    return lines.join('\n');
  }

  private exportToJson(tokens: DesignToken[], options: TokenExportOptions): string {
    const output: Record<string, any> = {};

    tokens.forEach(token => {
      const value = this.resolveValue(token, options.mode);
      output[token.name] = {
        value: formatTokenValue(value),
        type: value.type,
        category: token.category,
        ...(options.includeDescriptions && token.description ? { description: token.description } : {})
      };
    });

    return JSON.stringify(output, null, 2);
  }

  private exportToJs(tokens: DesignToken[], options: TokenExportOptions): string {
    const prefix = options.prefix || 'tokens';
    const lines: string[] = ['const ' + prefix + ' = {'];

    tokens.forEach(token => {
      const key = token.name.replace(/\s+/g, '').replace(/^./, c => c.toLowerCase());
      const value = this.getCssValue(token.id, options.mode);

      if (options.includeDescriptions && token.description) {
        lines.push(`  // ${token.description}`);
      }
      lines.push(`  ${key}: '${value}',`);
    });

    lines.push('};');
    lines.push('');
    lines.push('export default ' + prefix + ';');

    return lines.join('\n');
  }

  private exportToTs(tokens: DesignToken[], options: TokenExportOptions): string {
    const prefix = options.prefix || 'tokens';
    const lines: string[] = [];

    // Type definition
    lines.push('export interface DesignTokens {');
    tokens.forEach(token => {
      const key = token.name.replace(/\s+/g, '').replace(/^./, c => c.toLowerCase());
      lines.push(`  ${key}: string;`);
    });
    lines.push('}');
    lines.push('');

    // Values
    lines.push('export const ' + prefix + ': DesignTokens = {');

    tokens.forEach(token => {
      const key = token.name.replace(/\s+/g, '').replace(/^./, c => c.toLowerCase());
      const value = this.getCssValue(token.id, options.mode);

      if (options.includeDescriptions && token.description) {
        lines.push(`  /** ${token.description} */`);
      }
      lines.push(`  ${key}: '${value}',`);
    });

    lines.push('};');

    return lines.join('\n');
  }

  private exportToStyleDictionary(tokens: DesignToken[], options: TokenExportOptions): string {
    const output: Record<string, any> = {};

    tokens.forEach(token => {
      const path = token.category + '/' + token.name.toLowerCase().replace(/\s+/g, '-');
      const pathParts = path.split('/');

      let current = output;
      pathParts.forEach((part, index) => {
        if (index === pathParts.length - 1) {
          current[part] = {
            value: this.getCssValue(token.id, options.mode),
            type: token.value.type,
            ...(token.description ? { comment: token.description } : {})
          };
        } else {
          current[part] = current[part] || {};
          current = current[part];
        }
      });
    });

    return JSON.stringify(output, null, 2);
  }

  // ============================================================================
  // IMPORT
  // ============================================================================

  /**
   * Import tokens from JSON
   */
  importTokens(jsonData: string): TokenImportResult {
    const result: TokenImportResult = {
      success: true,
      tokensImported: 0,
      errors: [],
      warnings: []
    };

    try {
      const data = JSON.parse(jsonData);

      Object.entries(data).forEach(([name, tokenData]: [string, any]) => {
        try {
          // Determine category and value
          let category: TokenCategory = 'custom';
          let value: TokenValue;

          if (tokenData.type) {
            // Style Dictionary format
            switch (tokenData.type) {
              case 'color':
                category = 'colors';
                value = { type: 'color', value: tokenData.value };
                break;
              case 'dimension':
              case 'spacing':
                category = tokenData.category || 'spacing';
                const match = String(tokenData.value).match(/^(\d+(?:\.\d+)?)(px|rem|em|%)?$/);
                if (match) {
                  value = { type: 'dimension', value: parseFloat(match[1]), unit: (match[2] || 'px') as any };
                } else {
                  value = { type: 'string', value: tokenData.value };
                }
                break;
              default:
                value = { type: 'string', value: String(tokenData.value) };
            }
          } else if (typeof tokenData === 'string') {
            // Simple format
            if (tokenData.startsWith('#') || tokenData.startsWith('rgb')) {
              category = 'colors';
              value = { type: 'color', value: tokenData };
            } else {
              value = { type: 'string', value: tokenData };
            }
          } else if (typeof tokenData === 'object' && tokenData.value) {
            value = { type: 'string', value: String(tokenData.value) };
            category = tokenData.category || 'custom';
          } else {
            result.warnings.push(`Skipped token "${name}": unsupported format`);
            return;
          }

          this.createToken(name, category, value, {
            description: tokenData.description || tokenData.comment
          });

          result.tokensImported++;
        } catch (error) {
          result.errors.push(`Failed to import token "${name}": ${error}`);
        }
      });
    } catch (error) {
      result.success = false;
      result.errors.push(`Failed to parse JSON: ${error}`);
    }

    return result;
  }

  // ============================================================================
  // CSS INJECTION
  // ============================================================================

  /**
   * Inject tokens as CSS variables
   */
  injectCssVariables(): void {
    const styleId = 'lumina-design-tokens';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = this.exportTokens({
      format: 'css',
      mode: this.activeMode
    });
  }

  /**
   * Remove injected CSS
   */
  removeCssVariables(): void {
    const styleEl = document.getElementById('lumina-design-tokens');
    if (styleEl) {
      styleEl.remove();
    }
  }

  // ============================================================================
  // HISTORY
  // ============================================================================

  private recordChange(event: TokenChangeEvent): void {
    this.changeHistory.push(event);

    // Keep only last 100 changes
    if (this.changeHistory.length > 100) {
      this.changeHistory.shift();
    }
  }

  /**
   * Get change history
   */
  getHistory(): TokenChangeEvent[] {
    return [...this.changeHistory];
  }

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  setOnTokensChange(callback: (tokens: DesignToken[]) => void): void {
    this.onTokensChange = callback;
  }

  private notifyChange(): void {
    this.onTokensChange?.(this.getAllTokens());
  }

  // ============================================================================
  // CLOUD SYNC (SUPABASE INTEGRATION)
  // ============================================================================

  /**
   * Sync tokens to Supabase cloud
   */
  async syncToCloud(): Promise<boolean> {
    try {
      // Dynamic import to avoid circular deps
      const { supabase } = await import('../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const collection = this.getActiveCollection();
      if (!collection) return false;

      const tokens = this.getAllTokens();
      const tokenData = {
        name: collection.name,
        version: collection.version,
        tokens: this.exportToJson(tokens, { format: 'json' }),
        color_tokens: this.exportToJson(this.getTokensByCategory('colors'), { format: 'json' }),
        typography_tokens: this.exportToJson(this.getTokensByCategory('typography'), { format: 'json' }),
        spacing_tokens: this.exportToJson(this.getTokensByCategory('spacing'), { format: 'json' }),
        shadow_tokens: this.exportToJson(this.getTokensByCategory('shadows'), { format: 'json' }),
        border_tokens: this.exportToJson(this.getTokensByCategory('borders'), { format: 'json' }),
        css_output: this.exportToCss(tokens, { format: 'css' }),
        scss_output: this.exportToScss(tokens, { format: 'scss' }),
      };

      const { error } = await supabase
        .from('design_tokens')
        .upsert({
          user_id: user.id,
          ...tokenData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,name'
        });

      if (error) {
        console.error('Failed to sync tokens to cloud:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Cloud sync error:', error);
      return false;
    }
  }

  /**
   * Load tokens from Supabase cloud
   */
  async loadFromCloud(tokenSetId?: string): Promise<boolean> {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      let query = supabase
        .from('design_tokens')
        .select('*')
        .eq('user_id', user.id);

      if (tokenSetId) {
        query = query.eq('id', tokenSetId);
      } else {
        query = query.order('updated_at', { ascending: false }).limit(1);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        console.error('Failed to load tokens from cloud:', error);
        return false;
      }

      // Import the tokens
      if (data.tokens) {
        const result = this.importTokens(
          typeof data.tokens === 'string' ? data.tokens : JSON.stringify(data.tokens)
        );
        return result.success;
      }

      return false;
    } catch (error) {
      console.error('Cloud load error:', error);
      return false;
    }
  }

  /**
   * Get all cloud token sets
   */
  async getCloudTokenSets(): Promise<Array<{ id: string; name: string; version: string; updated_at: string }>> {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('design_tokens')
        .select('id, name, version, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch cloud token sets:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get cloud token sets:', error);
      return [];
    }
  }

  /**
   * Export to Tailwind config format
   */
  exportToTailwind(tokens?: DesignToken[]): object {
    const allTokens = tokens || this.getAllTokens();
    const config: any = {
      theme: {
        extend: {
          colors: {},
          spacing: {},
          fontSize: {},
          fontFamily: {},
          borderRadius: {},
          boxShadow: {},
        },
      },
    };

    // Colors
    this.getTokensByCategory('colors').forEach(token => {
      const key = token.name.toLowerCase().replace(/\s+/g, '-');
      config.theme.extend.colors[key] = this.getCssValue(token.id);
    });

    // Spacing
    this.getTokensByCategory('spacing').forEach(token => {
      const key = token.name.toLowerCase().replace(/\s+/g, '-');
      config.theme.extend.spacing[key] = this.getCssValue(token.id);
    });

    // Typography
    this.getTokensByCategory('typography').forEach(token => {
      const key = token.name.toLowerCase().replace(/\s+/g, '-');
      const value = token.value;
      if (value.type === 'dimension') {
        config.theme.extend.fontSize[key] = this.getCssValue(token.id);
      } else if (value.type === 'font-family') {
        config.theme.extend.fontFamily[key] = [value.value];
      }
    });

    // Borders
    this.getTokensByCategory('borders').forEach(token => {
      const key = token.name.toLowerCase().replace(/\s+/g, '-');
      config.theme.extend.borderRadius[key] = this.getCssValue(token.id);
    });

    // Shadows
    this.getTokensByCategory('shadows').forEach(token => {
      const key = token.name.toLowerCase().replace(/\s+/g, '-');
      config.theme.extend.boxShadow[key] = this.getCssValue(token.id);
    });

    return config;
  }

  /**
   * Export to Figma Tokens format
   */
  exportToFigmaTokens(): object {
    const output: any = {};

    const categories: TokenCategory[] = ['colors', 'typography', 'spacing', 'borders', 'shadows'];

    categories.forEach(category => {
      output[category] = {};
      this.getTokensByCategory(category).forEach(token => {
        const key = token.name.replace(/\s+/g, '-');
        output[category][key] = {
          value: this.getCssValue(token.id),
          type: this.mapCategoryToFigmaType(category),
          description: token.description || '',
        };
      });
    });

    return output;
  }

  private mapCategoryToFigmaType(category: TokenCategory): string {
    const map: Record<string, string> = {
      colors: 'color',
      typography: 'fontSizes',
      spacing: 'spacing',
      borders: 'borderRadius',
      shadows: 'boxShadow',
    };
    return map[category] || 'other';
  }

  /**
   * Download tokens as file
   */
  downloadTokens(format: TokenExportFormat, filename?: string): void {
    let content: string;
    let extension: string;
    let mimeType: string;

    switch (format) {
      case 'css':
        content = this.exportTokens({ format: 'css' });
        extension = 'css';
        mimeType = 'text/css';
        break;
      case 'scss':
        content = this.exportTokens({ format: 'scss' });
        extension = 'scss';
        mimeType = 'text/plain';
        break;
      case 'ts':
        content = this.exportTokens({ format: 'ts' });
        extension = 'ts';
        mimeType = 'text/typescript';
        break;
      case 'js':
        content = this.exportTokens({ format: 'js' });
        extension = 'js';
        mimeType = 'text/javascript';
        break;
      case 'style-dictionary':
        content = this.exportTokens({ format: 'style-dictionary' });
        extension = 'json';
        mimeType = 'application/json';
        break;
      case 'json':
      default:
        content = this.exportTokens({ format: 'json' });
        extension = 'json';
        mimeType = 'application/json';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename || 'design-tokens'}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate tokens from brand kit
   */
  async generateFromBrandKit(brandKitId: string): Promise<boolean> {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: brandKit, error } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('id', brandKitId)
        .single();

      if (error || !brandKit) {
        console.error('Failed to load brand kit:', error);
        return false;
      }

      // Clear existing tokens
      this.getAllTokens().forEach(t => this.deleteToken(t.id));

      // Create color tokens
      this.createToken('Primary', 'colors', { type: 'color', value: brandKit.primary_color });
      if (brandKit.secondary_color) {
        this.createToken('Secondary', 'colors', { type: 'color', value: brandKit.secondary_color });
      }
      if (brandKit.accent_color) {
        this.createToken('Accent', 'colors', { type: 'color', value: brandKit.accent_color });
      }
      this.createToken('Background', 'colors', { type: 'color', value: brandKit.background_color || '#ffffff' });
      this.createToken('Text', 'colors', { type: 'color', value: brandKit.text_color || '#111827' });

      // Create typography tokens
      this.createToken('Heading Font', 'typography', { type: 'font-family', value: brandKit.heading_font || 'Inter' });
      this.createToken('Body Font', 'typography', { type: 'font-family', value: brandKit.body_font || 'Inter' });

      // Create spacing tokens based on spacing unit
      const baseUnit = brandKit.spacing_unit || 8;
      [1, 2, 3, 4, 5, 6, 8, 10, 12, 16].forEach(multiplier => {
        this.createToken(`Space ${multiplier}`, 'spacing', {
          type: 'dimension',
          value: baseUnit * multiplier,
          unit: 'px'
        });
      });

      // Create border radius tokens
      const radius = brandKit.border_radius || 8;
      this.createToken('Radius SM', 'borders', { type: 'dimension', value: radius / 2, unit: 'px' });
      this.createToken('Radius MD', 'borders', { type: 'dimension', value: radius, unit: 'px' });
      this.createToken('Radius LG', 'borders', { type: 'dimension', value: radius * 1.5, unit: 'px' });
      this.createToken('Radius XL', 'borders', { type: 'dimension', value: radius * 2, unit: 'px' });
      this.createToken('Radius Full', 'borders', { type: 'dimension', value: 9999, unit: 'px' });

      return true;
    } catch (error) {
      console.error('Failed to generate from brand kit:', error);
      return false;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const designTokensManager = new DesignTokensManager();
export default designTokensManager;
