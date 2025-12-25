/**
 * Observability Service - Sentry Integration & Web Vitals Monitoring
 *
 * This module provides:
 * - Error tracking with Sentry-compatible API
 * - Web Vitals monitoring (LCP, FID, CLS, FCP, TTFB)
 * - Performance monitoring
 * - User session tracking
 */

// Types for Web Vitals
interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

interface PerformanceEntry {
  name: string;
  duration: number;
  startTime: number;
  entryType: string;
}

// Sentry-compatible error tracking
interface SentryOptions {
  dsn?: string;
  environment?: string;
  release?: string;
  sampleRate?: number;
  tracesSampleRate?: number;
  debug?: boolean;
}

interface BreadcrumbData {
  category: string;
  message: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
  timestamp?: number;
}

interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
  fingerprint?: string[];
}

// Web Vitals thresholds (based on Google's recommendations)
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

class ObservabilityService {
  private initialized = false;
  private options: SentryOptions = {};
  private breadcrumbs: BreadcrumbData[] = [];
  private maxBreadcrumbs = 100;
  private user: ErrorContext['user'] = undefined;
  private vitalsReported: Set<string> = new Set();
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize the observability service
   */
  init(options: SentryOptions = {}): void {
    if (this.initialized) {
      console.warn('Observability service already initialized');
      return;
    }

    this.options = {
      environment: options.environment || (import.meta.env.MODE === 'production' ? 'production' : 'development'),
      release: options.release || import.meta.env.VITE_APP_VERSION || '0.1.0',
      sampleRate: options.sampleRate ?? 1.0,
      tracesSampleRate: options.tracesSampleRate ?? 0.1,
      debug: options.debug ?? import.meta.env.MODE !== 'production',
      ...options,
    };

    // Set up global error handlers
    this.setupGlobalHandlers();

    // Start Web Vitals monitoring
    this.initWebVitals();

    // Expose for error boundary integration
    (window as any).__LUMINA_ERROR_TRACKER__ = {
      captureError: this.captureException.bind(this),
      addBreadcrumb: this.addBreadcrumb.bind(this),
    };

    this.initialized = true;

    if (this.options.debug) {
      console.log('[Observability] Initialized with options:', this.options);
    }
  }

  /**
   * Set up global error and promise rejection handlers
   */
  private setupGlobalHandlers(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureException(event.error || new Error(event.message), {
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

      this.captureException(error, {
        tags: { type: 'unhandled_promise_rejection' },
      });
    });
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private initWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Use PerformanceObserver for Core Web Vitals
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();
    this.observeINP();
  }

  private observeLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        if (lastEntry) {
          this.reportWebVital({
            name: 'LCP',
            value: lastEntry.startTime,
            rating: this.getRating('LCP', lastEntry.startTime),
            delta: lastEntry.startTime,
            id: this.generateId(),
            navigationType: this.getNavigationType(),
          });
        }
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // Browser doesn't support this observer
    }
  }

  private observeFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as (PerformanceEntry & { processingStart: number; startTime: number })[];
        entries.forEach((entry) => {
          const value = entry.processingStart - entry.startTime;
          this.reportWebVital({
            name: 'FID',
            value,
            rating: this.getRating('FID', value),
            delta: value,
            id: this.generateId(),
            navigationType: this.getNavigationType(),
          });
        });
      });
      observer.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      // Browser doesn't support this observer
    }
  }

  private observeCLS(): void {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as (PerformanceEntry & { hadRecentInput: boolean; value: number })[];
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
      });
      observer.observe({ type: 'layout-shift', buffered: true });

      // Report CLS on page hide
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && !this.vitalsReported.has('CLS')) {
          this.reportWebVital({
            name: 'CLS',
            value: clsValue,
            rating: this.getRating('CLS', clsValue),
            delta: clsValue,
            id: this.generateId(),
            navigationType: this.getNavigationType(),
          });
          this.vitalsReported.add('CLS');
        }
      });
    } catch (e) {
      // Browser doesn't support this observer
    }
  }

  private observeFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.reportWebVital({
            name: 'FCP',
            value: fcpEntry.startTime,
            rating: this.getRating('FCP', fcpEntry.startTime),
            delta: fcpEntry.startTime,
            id: this.generateId(),
            navigationType: this.getNavigationType(),
          });
        }
      });
      observer.observe({ type: 'paint', buffered: true });
    } catch (e) {
      // Browser doesn't support this observer
    }
  }

  private observeTTFB(): void {
    try {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        this.reportWebVital({
          name: 'TTFB',
          value: ttfb,
          rating: this.getRating('TTFB', ttfb),
          delta: ttfb,
          id: this.generateId(),
          navigationType: this.getNavigationType(),
        });
      }
    } catch (e) {
      // Browser doesn't support this
    }
  }

  private observeINP(): void {
    try {
      let maxINP = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as (PerformanceEntry & { duration: number })[];
        entries.forEach((entry) => {
          if (entry.duration > maxINP) {
            maxINP = entry.duration;
          }
        });
      });
      observer.observe({ type: 'event', buffered: true });

      // Report INP on page hide
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && !this.vitalsReported.has('INP') && maxINP > 0) {
          this.reportWebVital({
            name: 'INP',
            value: maxINP,
            rating: this.getRating('INP', maxINP),
            delta: maxINP,
            id: this.generateId(),
            navigationType: this.getNavigationType(),
          });
          this.vitalsReported.add('INP');
        }
      });
    } catch (e) {
      // Browser doesn't support this observer
    }
  }

  private getRating(metric: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = THRESHOLDS[metric];
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  private reportWebVital(metric: WebVitalMetric): void {
    if (this.options.debug) {
      console.log(`[Web Vital] ${metric.name}:`, {
        value: metric.value.toFixed(2),
        rating: metric.rating,
      });
    }

    // Add as breadcrumb
    this.addBreadcrumb({
      category: 'web-vital',
      message: `${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
      level: metric.rating === 'poor' ? 'warning' : 'info',
      data: metric,
    });

    // Send to analytics endpoint if configured
    if (this.options.dsn) {
      this.sendToEndpoint('vitals', metric);
    }
  }

  /**
   * Capture an exception and send to error tracking
   */
  captureException(error: Error, context: ErrorContext = {}): string {
    const eventId = this.generateId();

    const payload = {
      eventId,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      environment: this.options.environment,
      release: this.options.release,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      user: this.user || context.user,
      tags: context.tags,
      extra: context.extra,
      fingerprint: context.fingerprint,
      breadcrumbs: this.breadcrumbs.slice(-20), // Last 20 breadcrumbs
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
    };

    if (this.options.debug) {
      console.error('[Observability] Captured exception:', payload);
    }

    // Store in localStorage for session recovery
    this.storeError(payload);

    // Send to endpoint if configured
    if (this.options.dsn && Math.random() < (this.options.sampleRate || 1)) {
      this.sendToEndpoint('errors', payload);
    }

    return eventId;
  }

  /**
   * Capture a message (non-error event)
   */
  captureMessage(message: string, level: BreadcrumbData['level'] = 'info'): string {
    const eventId = this.generateId();

    this.addBreadcrumb({
      category: 'message',
      message,
      level,
    });

    if (this.options.debug) {
      console.log(`[Observability] Message (${level}):`, message);
    }

    return eventId;
  }

  /**
   * Add a breadcrumb for debugging context
   */
  addBreadcrumb(breadcrumb: BreadcrumbData): void {
    this.breadcrumbs.push({
      ...breadcrumb,
      timestamp: breadcrumb.timestamp || Date.now(),
    });

    // Keep only the last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(user: ErrorContext['user']): void {
    this.user = user;
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    this.user = undefined;
  }

  /**
   * Start a performance transaction
   */
  startTransaction(name: string, op: string = 'navigation'): { finish: () => void } {
    const startTime = performance.now();

    this.addBreadcrumb({
      category: 'transaction',
      message: `Started: ${name}`,
      level: 'info',
      data: { op },
    });

    return {
      finish: () => {
        const duration = performance.now() - startTime;

        this.addBreadcrumb({
          category: 'transaction',
          message: `Finished: ${name} (${duration.toFixed(2)}ms)`,
          level: 'info',
          data: { op, duration },
        });

        if (this.options.debug) {
          console.log(`[Observability] Transaction "${name}" completed in ${duration.toFixed(2)}ms`);
        }
      },
    };
  }

  /**
   * Get all stored errors (for session recovery UI)
   */
  getStoredErrors(): any[] {
    try {
      const stored = localStorage.getItem('lumina_errors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear stored errors
   */
  clearStoredErrors(): void {
    localStorage.removeItem('lumina_errors');
  }

  private storeError(payload: any): void {
    try {
      const errors = this.getStoredErrors();
      errors.push(payload);
      // Keep only last 10 errors
      const trimmed = errors.slice(-10);
      localStorage.setItem('lumina_errors', JSON.stringify(trimmed));
    } catch {
      // localStorage might be full or disabled
    }
  }

  private sendToEndpoint(type: 'errors' | 'vitals', payload: any): void {
    // If DSN is configured, send to the error tracking endpoint
    if (!this.options.dsn) return;

    try {
      // Use sendBeacon for reliability on page unload
      const data = JSON.stringify({ type, payload });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(this.options.dsn, data);
      } else {
        fetch(this.options.dsn, {
          method: 'POST',
          body: data,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        }).catch(() => {
          // Silent fail
        });
      }
    } catch {
      // Silent fail
    }
  }

  private generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    const stored = sessionStorage.getItem('lumina_session_id');
    if (stored) return stored;

    const newId = this.generateId();
    sessionStorage.setItem('lumina_session_id', newId);
    return newId;
  }

  private getNavigationType(): string {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navEntry?.type || 'navigate';
  }
}

// Export singleton instance
export const observability = new ObservabilityService();

// Convenience exports
export const captureException = (error: Error, context?: ErrorContext) =>
  observability.captureException(error, context);

export const captureMessage = (message: string, level?: BreadcrumbData['level']) =>
  observability.captureMessage(message, level);

export const addBreadcrumb = (breadcrumb: BreadcrumbData) =>
  observability.addBreadcrumb(breadcrumb);

export const setUser = (user: ErrorContext['user']) =>
  observability.setUser(user);

export default observability;
