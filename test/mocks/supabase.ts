// Mock Supabase client for testing
import { vi } from 'vitest';

export interface MockAnnotation {
  id: string;
  user_id: string;
  document_id: string;
  page_number: number;
  type: string;
  content: Record<string, unknown>;
  layer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MockLayer {
  id: string;
  document_id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  z_index: number;
  created_at: string;
}

export interface MockVoiceNote {
  id: string;
  annotation_id: string;
  audio_url: string;
  transcription?: string;
  duration: number;
  created_at: string;
}

export interface MockAISuggestion {
  id: string;
  annotation_id: string;
  suggestion_type: string;
  content: Record<string, unknown>;
  confidence: number;
  applied: boolean;
  created_at: string;
}

// In-memory storage for mock database
class MockDatabase {
  annotations: Map<string, MockAnnotation> = new Map();
  layers: Map<string, MockLayer> = new Map();
  voiceNotes: Map<string, MockVoiceNote> = new Map();
  aiSuggestions: Map<string, MockAISuggestion> = new Map();

  reset() {
    this.annotations.clear();
    this.layers.clear();
    this.voiceNotes.clear();
    this.aiSuggestions.clear();
  }
}

const mockDb = new MockDatabase();

// Mock query builder
class MockQueryBuilder<T> {
  private tableName: string;
  private filters: Array<{ column: string; operator: string; value: unknown }> = [];
  private orderByField?: string;
  private orderDirection: 'asc' | 'desc' = 'asc';
  private limitValue?: number;
  private selectFields: string = '*';

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields: string = '*') {
    this.selectFields = fields;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ column, operator: 'neq', value });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderByField = field;
    this.orderDirection = options?.ascending === false ? 'desc' : 'asc';
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  private getTableData(): Map<string, T> {
    switch (this.tableName) {
      case 'annotations':
        return mockDb.annotations as unknown as Map<string, T>;
      case 'layers':
        return mockDb.layers as unknown as Map<string, T>;
      case 'voice_notes':
        return mockDb.voiceNotes as unknown as Map<string, T>;
      case 'ai_suggestions':
        return mockDb.aiSuggestions as unknown as Map<string, T>;
      default:
        return new Map();
    }
  }

  private filterData(data: T[]): T[] {
    return data.filter((item) => {
      return this.filters.every((filter) => {
        const value = (item as Record<string, unknown>)[filter.column];
        switch (filter.operator) {
          case 'eq':
            return value === filter.value;
          case 'neq':
            return value !== filter.value;
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(value);
          default:
            return true;
        }
      });
    });
  }

  private sortData(data: T[]): T[] {
    if (!this.orderByField) return data;

    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[this.orderByField!];
      const bVal = (b as Record<string, unknown>)[this.orderByField!];

      if (aVal === bVal) return 0;

      const comparison = aVal < bVal ? -1 : 1;
      return this.orderDirection === 'asc' ? comparison : -comparison;
    });
  }

  async then<TResult1 = { data: T[] | null; error: Error | null }>(
    onfulfilled?: ((value: { data: T[] | null; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null
  ): Promise<TResult1> {
    const tableData = this.getTableData();
    let data = Array.from(tableData.values());

    data = this.filterData(data);
    data = this.sortData(data);

    if (this.limitValue) {
      data = data.slice(0, this.limitValue);
    }

    const result = { data, error: null };
    return onfulfilled ? onfulfilled(result) : (result as unknown as TResult1);
  }
}

// Mock insert builder
class MockInsertBuilder<T> {
  private tableName: string;
  private insertData: Partial<T> | Partial<T>[];

  constructor(tableName: string, data: Partial<T> | Partial<T>[]) {
    this.tableName = tableName;
    this.insertData = data;
  }

  select() {
    return this;
  }

  async then<TResult1 = { data: T | T[] | null; error: Error | null }>(
    onfulfilled?: ((value: { data: T | T[] | null; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null
  ): Promise<TResult1> {
    const tableData = this.getTableData();
    const isArray = Array.isArray(this.insertData);
    const dataArray = isArray ? this.insertData : [this.insertData];

    const inserted: T[] = [];

    for (const item of dataArray) {
      const id = (item as { id?: string }).id || `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      const record = {
        ...item,
        id,
        created_at: timestamp,
        updated_at: timestamp,
      } as T;

      tableData.set(id, record);
      inserted.push(record);
    }

    const result = {
      data: isArray ? inserted : inserted[0] || null,
      error: null,
    };

    return onfulfilled ? onfulfilled(result) : (result as unknown as TResult1);
  }

  private getTableData(): Map<string, T> {
    switch (this.tableName) {
      case 'annotations':
        return mockDb.annotations as unknown as Map<string, T>;
      case 'layers':
        return mockDb.layers as unknown as Map<string, T>;
      case 'voice_notes':
        return mockDb.voiceNotes as unknown as Map<string, T>;
      case 'ai_suggestions':
        return mockDb.aiSuggestions as unknown as Map<string, T>;
      default:
        return new Map();
    }
  }
}

// Mock update builder
class MockUpdateBuilder<T> {
  private tableName: string;
  private updateData: Partial<T>;
  private filters: Array<{ column: string; value: unknown }> = [];

  constructor(tableName: string, data: Partial<T>) {
    this.tableName = tableName;
    this.updateData = data;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  select() {
    return this;
  }

  async then<TResult1 = { data: T[] | null; error: Error | null }>(
    onfulfilled?: ((value: { data: T[] | null; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null
  ): Promise<TResult1> {
    const tableData = this.getTableData();
    const updated: T[] = [];

    for (const [id, record] of tableData) {
      const matches = this.filters.every((filter) => {
        return (record as Record<string, unknown>)[filter.column] === filter.value;
      });

      if (matches) {
        const updatedRecord = {
          ...record,
          ...this.updateData,
          updated_at: new Date().toISOString(),
        };
        tableData.set(id, updatedRecord);
        updated.push(updatedRecord);
      }
    }

    const result = { data: updated, error: null };
    return onfulfilled ? onfulfilled(result) : (result as unknown as TResult1);
  }

  private getTableData(): Map<string, T> {
    switch (this.tableName) {
      case 'annotations':
        return mockDb.annotations as unknown as Map<string, T>;
      case 'layers':
        return mockDb.layers as unknown as Map<string, T>;
      case 'voice_notes':
        return mockDb.voiceNotes as unknown as Map<string, T>;
      case 'ai_suggestions':
        return mockDb.aiSuggestions as unknown as Map<string, T>;
      default:
        return new Map();
    }
  }
}

// Mock delete builder
class MockDeleteBuilder {
  private tableName: string;
  private filters: Array<{ column: string; value: unknown }> = [];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  async then<TResult1 = { data: null; error: Error | null }>(
    onfulfilled?: ((value: { data: null; error: Error | null }) => TResult1 | PromiseLike<TResult1>) | null
  ): Promise<TResult1> {
    const tableData = this.getTableData();

    for (const [id, record] of tableData) {
      const matches = this.filters.every((filter) => {
        return (record as Record<string, unknown>)[filter.column] === filter.value;
      });

      if (matches) {
        tableData.delete(id);
      }
    }

    const result = { data: null, error: null };
    return onfulfilled ? onfulfilled(result) : (result as unknown as TResult1);
  }

  private getTableData(): Map<string, unknown> {
    switch (this.tableName) {
      case 'annotations':
        return mockDb.annotations;
      case 'layers':
        return mockDb.layers;
      case 'voice_notes':
        return mockDb.voiceNotes;
      case 'ai_suggestions':
        return mockDb.aiSuggestions;
      default:
        return new Map();
    }
  }
}

// Mock realtime channel
export const createMockRealtimeChannel = () => {
  const callbacks: Record<string, (payload: unknown) => void> = {};

  return {
    on: vi.fn((event: string, callback: (payload: unknown) => void) => {
      callbacks[event] = callback;
      return {
        subscribe: vi.fn(() => Promise.resolve()),
      };
    }),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    send: vi.fn(),
    // Helper to trigger events in tests
    trigger: (event: string, payload: unknown) => {
      callbacks[event]?.(payload);
    },
  };
};

// Main mock Supabase client
export const createMockSupabaseClient = () => {
  const mockClient = {
    from: vi.fn(<T>(tableName: string) => ({
      select: (fields?: string) => new MockQueryBuilder<T>(tableName).select(fields || '*'),
      insert: (data: Partial<T> | Partial<T>[]) => new MockInsertBuilder<T>(tableName, data),
      update: (data: Partial<T>) => new MockUpdateBuilder<T>(tableName, data),
      delete: () => new MockDeleteBuilder(tableName),
    })),

    channel: vi.fn((name: string) => createMockRealtimeChannel()),

    auth: {
      getSession: vi.fn(() => Promise.resolve({
        data: {
          session: {
            user: { id: 'test-user-id', email: 'test@example.com' },
            access_token: 'mock-token',
          },
        },
        error: null,
      })),
      getUser: vi.fn(() => Promise.resolve({
        data: {
          user: { id: 'test-user-id', email: 'test@example.com' },
        },
        error: null,
      })),
    },

    storage: {
      from: vi.fn((bucket: string) => ({
        upload: vi.fn(() => Promise.resolve({ data: { path: 'mock-path' }, error: null })),
        download: vi.fn(() => Promise.resolve({ data: new Blob(), error: null })),
        getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://example.com/${path}` } })),
        remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    },
  };

  return mockClient;
};

// Helper to seed test data
export const seedMockDatabase = {
  annotations: (annotations: MockAnnotation[]) => {
    annotations.forEach((ann) => {
      mockDb.annotations.set(ann.id, ann);
    });
  },
  layers: (layers: MockLayer[]) => {
    layers.forEach((layer) => {
      mockDb.layers.set(layer.id, layer);
    });
  },
  voiceNotes: (notes: MockVoiceNote[]) => {
    notes.forEach((note) => {
      mockDb.voiceNotes.set(note.id, note);
    });
  },
  aiSuggestions: (suggestions: MockAISuggestion[]) => {
    suggestions.forEach((sug) => {
      mockDb.aiSuggestions.set(sug.id, sug);
    });
  },
};

// Helper to clear all mock data
export const clearMockDatabase = () => {
  mockDb.reset();
};

// Export the mock database for direct access in tests
export { mockDb };
