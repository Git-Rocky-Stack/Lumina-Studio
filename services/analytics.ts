/**
 * Analytics & Funnel Tracking Service
 *
 * Tracks user behavior, conversion funnels, and feature usage.
 * Privacy-focused with cookie consent integration.
 */

// Event types
export type EventName =
  // Page views
  | 'page_view'
  // Funnel steps
  | 'funnel_landing_view'
  | 'funnel_signup_start'
  | 'funnel_signup_complete'
  | 'funnel_first_design'
  | 'funnel_first_export'
  | 'funnel_upgrade_view'
  | 'funnel_upgrade_complete'
  // Feature usage
  | 'feature_canvas_open'
  | 'feature_ai_generate'
  | 'feature_template_use'
  | 'feature_export'
  | 'feature_share'
  // Engagement
  | 'session_start'
  | 'session_end'
  | 'time_on_page'
  // UI interactions
  | 'cta_click'
  | 'modal_open'
  | 'modal_close'
  // Errors
  | 'error_occurred';

interface AnalyticsEvent {
  name: EventName;
  properties?: Record<string, any>;
  timestamp: string;
  sessionId: string;
  userId?: string;
  page: string;
}

interface FunnelStep {
  name: string;
  eventName: EventName;
  completed: boolean;
  timestamp?: string;
}

interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  endpoint?: string;
  batchSize: number;
  flushInterval: number; // ms
}

const defaultConfig: AnalyticsConfig = {
  enabled: true,
  debug: false,
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
};

class Analytics {
  private config: AnalyticsConfig;
  private sessionId: string;
  private userId?: string;
  private eventQueue: AnalyticsEvent[] = [];
  private sessionStartTime: number;
  private pageStartTime: number;
  private flushInterval?: number;
  private consentGiven = false;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.sessionId = this.getOrCreateSessionId();
    this.sessionStartTime = Date.now();
    this.pageStartTime = Date.now();
  }

  init() {
    // Check for cookie consent
    this.checkConsent();

    // Listen for consent changes
    window.addEventListener('cookie-consent-updated', (e: any) => {
      this.consentGiven = e.detail?.analytics ?? false;
    });

    // Track session start
    this.track('session_start');

    // Track page views on navigation
    this.trackPageView();

    // Set up flush interval
    this.flushInterval = window.setInterval(() => {
      this.flush();
    }, this.config.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.trackTimeOnPage();
      this.track('session_end', {
        duration: Date.now() - this.sessionStartTime,
      });
      this.flush(true);
    });

    // Track route changes (for SPAs)
    window.addEventListener('popstate', () => {
      this.trackPageView();
    });

    if (this.config.debug) {
      console.log('[Analytics] Initialized', { sessionId: this.sessionId });
    }
  }

  private checkConsent() {
    try {
      const consent = localStorage.getItem('lumina_cookie_consent');
      if (consent) {
        const parsed = JSON.parse(consent);
        this.consentGiven = parsed.analytics ?? false;
      }
    } catch (e) {
      // No consent given
    }
  }

  track(name: EventName, properties?: Record<string, any>) {
    if (!this.config.enabled) return;

    // Only track if consent given (except for essential events)
    const essentialEvents: EventName[] = ['session_start', 'session_end', 'error_occurred'];
    if (!this.consentGiven && !essentialEvents.includes(name)) {
      return;
    }

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      page: window.location.pathname,
    };

    this.eventQueue.push(event);

    if (this.config.debug) {
      console.log('[Analytics] Track:', name, properties);
    }

    // Auto-flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  trackPageView(page?: string) {
    this.trackTimeOnPage();
    this.pageStartTime = Date.now();

    this.track('page_view', {
      path: page || window.location.pathname,
      referrer: document.referrer,
      title: document.title,
    });
  }

  private trackTimeOnPage() {
    const timeOnPage = Date.now() - this.pageStartTime;
    if (timeOnPage > 1000) { // Only track if > 1 second
      this.track('time_on_page', {
        duration: timeOnPage,
        path: window.location.pathname,
      });
    }
  }

  identify(userId: string, traits?: Record<string, any>) {
    this.userId = userId;

    if (this.config.debug) {
      console.log('[Analytics] Identify:', userId, traits);
    }
  }

  // Conversion funnel tracking
  private funnelSteps: FunnelStep[] = [
    { name: 'Landing View', eventName: 'funnel_landing_view', completed: false },
    { name: 'Signup Start', eventName: 'funnel_signup_start', completed: false },
    { name: 'Signup Complete', eventName: 'funnel_signup_complete', completed: false },
    { name: 'First Design', eventName: 'funnel_first_design', completed: false },
    { name: 'First Export', eventName: 'funnel_first_export', completed: false },
    { name: 'Upgrade View', eventName: 'funnel_upgrade_view', completed: false },
    { name: 'Upgrade Complete', eventName: 'funnel_upgrade_complete', completed: false },
  ];

  trackFunnelStep(step: EventName, properties?: Record<string, any>) {
    const funnelStep = this.funnelSteps.find(s => s.eventName === step);
    if (funnelStep && !funnelStep.completed) {
      funnelStep.completed = true;
      funnelStep.timestamp = new Date().toISOString();

      this.track(step, {
        ...properties,
        funnelPosition: this.funnelSteps.indexOf(funnelStep) + 1,
        previousStepsCompleted: this.funnelSteps.filter(s => s.completed).length - 1,
      });
    }
  }

  getFunnelProgress(): FunnelStep[] {
    return [...this.funnelSteps];
  }

  // Feature usage tracking
  trackFeature(feature: string, action?: string, properties?: Record<string, any>) {
    const eventName = `feature_${feature}` as EventName;
    this.track(eventName, { action, ...properties });
  }

  // CTA tracking
  trackCTA(ctaName: string, location: string, destination?: string) {
    this.track('cta_click', {
      cta: ctaName,
      location,
      destination,
    });
  }

  private async flush(sync = false) {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    if (this.config.endpoint) {
      const sendEvents = async () => {
        try {
          await fetch(this.config.endpoint!, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events }),
            keepalive: sync, // Important for beforeunload
          });
        } catch (e) {
          // Re-queue failed events
          this.eventQueue.unshift(...events);
        }
      };

      if (sync) {
        // Use sendBeacon for sync flush (beforeunload)
        const blob = new Blob([JSON.stringify({ events })], { type: 'application/json' });
        navigator.sendBeacon?.(this.config.endpoint, blob);
      } else {
        sendEvents();
      }
    }

    if (this.config.debug) {
      console.log('[Analytics] Flushed', events.length, 'events');
    }
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('lumina_analytics_session');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('lumina_analytics_session', sessionId);
    }
    return sessionId;
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush(true);
  }
}

// Singleton instance
export const analytics = new Analytics({
  debug: import.meta.env?.DEV ?? false,
});

export default analytics;
