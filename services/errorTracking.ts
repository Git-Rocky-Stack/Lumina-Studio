/**
 * Error Tracking Service
 *
 * Lightweight error tracking without external dependencies.
 * Captures errors, stores them locally, and can send to an endpoint.
 */

interface ErrorEvent {
  id: string;
  message: string;
  stack?: string;
  type: 'error' | 'unhandledrejection' | 'console' | 'custom';
  url: string;
  timestamp: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

interface ErrorTrackingConfig {
  enabled: boolean;
  endpoint?: string;
  maxStoredErrors: number;
  sampleRate: number; // 0-1, percentage of errors to capture
  ignorePatterns: RegExp[];
}

const defaultConfig: ErrorTrackingConfig = {
  enabled: true,
  maxStoredErrors: 50,
  sampleRate: 1.0,
  ignorePatterns: [
    /ResizeObserver loop/,
    /Script error/,
    /Loading chunk/,
    /Network Error/,
  ],
};

class ErrorTracker {
  private config: ErrorTrackingConfig;
  private sessionId: string;
  private errors: ErrorEvent[] = [];
  private initialized = false;

  constructor(config: Partial<ErrorTrackingConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.sessionId = this.generateSessionId();
  }

  init() {
    if (this.initialized || !this.config.enabled) return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        type: 'error',
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        type: 'unhandledrejection',
      });
    });

    // Console error override
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.captureError({
        message: args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '),
        type: 'console',
      });
      originalConsoleError.apply(console, args);
    };

    // Load stored errors
    this.loadStoredErrors();

    this.initialized = true;
    console.log('[ErrorTracker] Initialized');
  }

  captureError(data: Partial<ErrorEvent>) {
    if (!this.config.enabled) return;

    // Sample rate check
    if (Math.random() > this.config.sampleRate) return;

    // Check ignore patterns
    if (this.config.ignorePatterns.some(pattern =>
      pattern.test(data.message || '')
    )) return;

    const error: ErrorEvent = {
      id: this.generateId(),
      message: data.message || 'Unknown error',
      stack: data.stack,
      type: data.type || 'custom',
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      metadata: data.metadata,
    };

    this.errors.push(error);
    this.storeErrors();

    // Send to endpoint if configured
    if (this.config.endpoint) {
      this.sendError(error);
    }

    // Dispatch custom event for UI feedback
    window.dispatchEvent(new CustomEvent('lumina-error', { detail: error }));
  }

  captureMessage(message: string, metadata?: Record<string, any>) {
    this.captureError({
      message,
      type: 'custom',
      metadata,
    });
  }

  setUser(userId: string) {
    this.errors.forEach(error => {
      error.userId = userId;
    });
  }

  private async sendError(error: ErrorEvent) {
    if (!this.config.endpoint) return;

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error),
      });
    } catch (e) {
      // Silently fail - don't cause more errors
    }
  }

  private storeErrors() {
    // Keep only recent errors
    if (this.errors.length > this.config.maxStoredErrors) {
      this.errors = this.errors.slice(-this.config.maxStoredErrors);
    }

    try {
      localStorage.setItem('lumina_errors', JSON.stringify(this.errors));
    } catch (e) {
      // Storage full or disabled
    }
  }

  private loadStoredErrors() {
    try {
      const stored = localStorage.getItem('lumina_errors');
      if (stored) {
        this.errors = JSON.parse(stored);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  getErrors(): ErrorEvent[] {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
    localStorage.removeItem('lumina_errors');
  }

  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    let sessionId = sessionStorage.getItem('lumina_session');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('lumina_session', sessionId);
    }
    return sessionId;
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// React Error Boundary helper
export function captureException(error: Error, errorInfo?: any) {
  errorTracker.captureError({
    message: error.message,
    stack: error.stack,
    type: 'error',
    metadata: errorInfo,
  });
}

export default errorTracker;
