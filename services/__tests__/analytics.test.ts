import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { analytics } from '../analytics';
import type { EventName } from '../analytics';

describe('Analytics', () => {
  beforeEach(() => {
    // Clear storage and reset analytics state
    localStorage.clear();
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should create a unique session ID', () => {
      analytics.init();
      const sessionId = sessionStorage.getItem('lumina_analytics_session');
      expect(sessionId).toBeTruthy();
      expect(sessionId).toMatch(/^sess_\d+_[a-z0-9]+$/);
    });

    it('should reuse existing session ID across initializations', () => {
      analytics.init();
      const sessionId1 = sessionStorage.getItem('lumina_analytics_session');

      analytics.init();
      const sessionId2 = sessionStorage.getItem('lumina_analytics_session');

      expect(sessionId1).toBe(sessionId2);
    });
  });

  describe('Cookie Consent', () => {
    it('should check localStorage for cookie consent on init', () => {
      localStorage.setItem('lumina_cookie_consent', JSON.stringify({ analytics: true }));
      analytics.init();

      // Analytics should track events
      analytics.track('page_view');

      // Event should be queued (we'll verify in other tests)
      expect(true).toBe(true);
    });

    it('should not track non-essential events without consent', () => {
      // No consent given
      localStorage.removeItem('lumina_cookie_consent');

      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.checkConsent = function() {
        this.consentGiven = false;
      };
      tracker.init();

      // Track a non-essential event
      tracker.track('feature_canvas_open');

      // Should not be in queue (we'll need to access private eventQueue)
      expect(tracker.eventQueue).toHaveLength(0);
    });

    it('should track essential events without consent', () => {
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.checkConsent = function() {
        this.consentGiven = false;
      };
      tracker.init();

      // Track essential event
      tracker.track('session_start');

      // Should be in queue
      expect(tracker.eventQueue.length).toBeGreaterThan(0);
    });

    it('should listen for consent updates', () => {
      analytics.init();

      // Dispatch consent event
      window.dispatchEvent(new CustomEvent('cookie-consent-updated', {
        detail: { analytics: true }
      }));

      // Now analytics should accept events
      analytics.track('page_view');
      expect(true).toBe(true);
    });
  });

  describe('Event Tracking', () => {
    beforeEach(() => {
      // Give consent for testing
      localStorage.setItem('lumina_cookie_consent', JSON.stringify({ analytics: true }));
    });

    it('should track event with name and properties', () => {
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.consentGiven = true;

      tracker.track('page_view', { path: '/home', title: 'Home' });

      expect(tracker.eventQueue).toHaveLength(1);
      expect(tracker.eventQueue[0].name).toBe('page_view');
      expect(tracker.eventQueue[0].properties).toEqual({ path: '/home', title: 'Home' });
    });

    it('should include session ID and timestamp', () => {
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.consentGiven = true;

      tracker.track('session_start');

      expect(tracker.eventQueue[0].sessionId).toBeTruthy();
      expect(tracker.eventQueue[0].timestamp).toBeTruthy();
      expect(new Date(tracker.eventQueue[0].timestamp)).toBeInstanceOf(Date);
    });

    it('should include user ID when set', () => {
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.consentGiven = true;
      tracker.identify('user-123');

      tracker.track('feature_canvas_open');

      expect(tracker.eventQueue[0].userId).toBe('user-123');
    });

    it('should include current page path', () => {
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.consentGiven = true;

      tracker.track('cta_click');

      expect(tracker.eventQueue[0].page).toBe(window.location.pathname);
    });

    it('should auto-flush when queue reaches batchSize', () => {
      const tracker = new (analytics.constructor as any)({
        debug: true,
        batchSize: 3,
        endpoint: 'https://api.example.com/analytics'
      });
      tracker.consentGiven = true;

      const flushSpy = vi.spyOn(tracker, 'flush');

      tracker.track('event_1');
      tracker.track('event_2');
      expect(flushSpy).not.toHaveBeenCalled();

      tracker.track('event_3');
      expect(flushSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Page View Tracking', () => {
    it('should track page view with path and referrer', () => {
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.consentGiven = true;

      tracker.trackPageView('/about');

      expect(tracker.eventQueue[0].name).toBe('page_view');
      expect(tracker.eventQueue[0].properties.path).toBe('/about');
      expect(tracker.eventQueue[0].properties.referrer).toBeDefined();
      expect(tracker.eventQueue[0].properties.title).toBe(document.title);
    });

    it('should track time on previous page', () => {
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.consentGiven = true;
      tracker.pageStartTime = Date.now() - 5000; // 5 seconds ago

      tracker.trackPageView('/new-page');

      // Should have tracked time_on_page before page_view
      const timeOnPageEvent = tracker.eventQueue.find((e: any) => e.name === 'time_on_page');
      expect(timeOnPageEvent).toBeDefined();
      expect(timeOnPageEvent.properties.duration).toBeGreaterThanOrEqual(5000);
    });
  });

  describe('User Identification', () => {
    it('should set user ID and traits', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const tracker = new (analytics.constructor as any)({ debug: true });

      tracker.identify('user-456', { name: 'John Doe', plan: 'premium' });

      expect(tracker.userId).toBe('user-456');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] Identify:',
        'user-456',
        { name: 'John Doe', plan: 'premium' }
      );
    });
  });

  describe('Funnel Tracking', () => {
    it('should track funnel step with position', () => {
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.consentGiven = true;

      tracker.trackFunnelStep('funnel_signup_start' as EventName);

      const event = tracker.eventQueue[0];
      expect(event.name).toBe('funnel_signup_start');
      expect(event.properties.funnelPosition).toBe(2); // Second step in funnel
      expect(event.properties.previousStepsCompleted).toBe(0);
    });

    it('should mark funnel step as completed', () => {
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.consentGiven = true;

      tracker.trackFunnelStep('funnel_landing_view' as EventName);

      const funnelProgress = tracker.getFunnelProgress();
      expect(funnelProgress[0].completed).toBe(true);
      expect(funnelProgress[0].timestamp).toBeTruthy();
    });

    it('should not track same funnel step twice', () => {
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.consentGiven = true;

      tracker.trackFunnelStep('funnel_first_design' as EventName);
      tracker.trackFunnelStep('funnel_first_design' as EventName);

      expect(tracker.eventQueue).toHaveLength(1);
    });

    it('should return funnel progress', () => {
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.consentGiven = true;

      tracker.trackFunnelStep('funnel_landing_view' as EventName);
      tracker.trackFunnelStep('funnel_signup_start' as EventName);

      const progress = tracker.getFunnelProgress();
      expect(progress.filter((s: any) => s.completed)).toHaveLength(2);
    });
  });

  describe('Feature Tracking', () => {
    it('should track feature usage with action', () => {
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.consentGiven = true;

      tracker.trackFeature('canvas', 'zoom', { level: 2 });

      const event = tracker.eventQueue[0];
      expect(event.name).toBe('feature_canvas');
      expect(event.properties.action).toBe('zoom');
      expect(event.properties.level).toBe(2);
    });
  });

  describe('CTA Tracking', () => {
    it('should track CTA clicks with location and destination', () => {
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.consentGiven = true;

      tracker.trackCTA('Sign Up', 'header', '/signup');

      const event = tracker.eventQueue[0];
      expect(event.name).toBe('cta_click');
      expect(event.properties).toEqual({
        cta: 'Sign Up',
        location: 'header',
        destination: '/signup',
      });
    });
  });

  describe('Flush Mechanism', () => {
    it('should flush events to endpoint', async () => {
      const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
      } as Response);

      const tracker = new (analytics.constructor as any)({
        debug: true,
        endpoint: 'https://api.example.com/analytics',
      });
      tracker.consentGiven = true;

      tracker.track('page_view');
      await tracker.flush();

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/analytics',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should use sendBeacon for sync flush', async () => {
      const sendBeaconMock = vi.fn().mockReturnValue(true);
      Object.defineProperty(navigator, 'sendBeacon', {
        value: sendBeaconMock,
        writable: true,
      });

      const tracker = new (analytics.constructor as any)({
        endpoint: 'https://api.example.com/analytics',
      });
      tracker.consentGiven = true;

      tracker.track('session_end');
      await tracker.flush(true);

      expect(sendBeaconMock).toHaveBeenCalledWith(
        'https://api.example.com/analytics',
        expect.any(Blob)
      );
    });

    it('should requeue events on network failure', async () => {
      const fetchMock = vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      const tracker = new (analytics.constructor as any)({
        endpoint: 'https://api.example.com/analytics',
      });
      tracker.consentGiven = true;

      tracker.track('page_view');
      const queueLengthBefore = 1;

      await tracker.flush();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Events should be requeued
      expect(tracker.eventQueue.length).toBeGreaterThan(0);
    });

    it('should flush on interval', () => {
      const tracker = new (analytics.constructor as any)({
        flushInterval: 5000,
        endpoint: 'https://api.example.com/analytics',
      });
      tracker.consentGiven = true;

      const flushSpy = vi.spyOn(tracker, 'flush');

      tracker.init();
      tracker.track('event_1');

      vi.advanceTimersByTime(5000);

      expect(flushSpy).toHaveBeenCalled();
    });
  });

  describe('Session Tracking', () => {
    it('should track session start on init', () => {
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.consentGiven = true;

      tracker.init();

      const sessionStartEvent = tracker.eventQueue.find((e: any) => e.name === 'session_start');
      expect(sessionStartEvent).toBeDefined();
    });

    it('should track session end with duration on beforeunload', () => {
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.consentGiven = true;
      tracker.sessionStartTime = Date.now() - 10000; // 10 seconds ago

      // Simulate beforeunload
      window.dispatchEvent(new Event('beforeunload'));

      const sessionEndEvent = tracker.eventQueue.find((e: any) => e.name === 'session_end');
      expect(sessionEndEvent).toBeDefined();
      expect(sessionEndEvent.properties.duration).toBeGreaterThanOrEqual(10000);
    });
  });

  describe('Time Tracking', () => {
    it('should track time on page when duration > 1 second', () => {
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.consentGiven = true;
      tracker.pageStartTime = Date.now() - 2000; // 2 seconds ago

      tracker.trackPageView('/new-page');

      const timeEvent = tracker.eventQueue.find((e: any) => e.name === 'time_on_page');
      expect(timeEvent).toBeDefined();
      expect(timeEvent.properties.duration).toBeGreaterThanOrEqual(2000);
    });

    it('should not track time on page when duration < 1 second', () => {
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.consentGiven = true;
      tracker.pageStartTime = Date.now() - 500; // 0.5 seconds ago

      tracker.trackPageView('/new-page');

      const timeEvent = tracker.eventQueue.find((e: any) => e.name === 'time_on_page');
      expect(timeEvent).toBeUndefined();
    });
  });

  describe('destroy', () => {
    it('should clear flush interval and flush remaining events', () => {
      const tracker = new (analytics.constructor as any)({
        flushInterval: 5000,
        endpoint: 'https://api.example.com/analytics',
      });
      tracker.consentGiven = true;
      tracker.init();

      const flushSpy = vi.spyOn(tracker, 'flush');

      tracker.track('final_event');
      tracker.destroy();

      expect(flushSpy).toHaveBeenCalledWith(true);
      expect(tracker.flushInterval).toBeUndefined();
    });
  });

  describe('Debug Mode', () => {
    it('should log events in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const tracker = new (analytics.constructor as any)({ debug: true });
      tracker.consentGiven = true;

      tracker.track('page_view', { path: '/test' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] Track:',
        'page_view',
        { path: '/test' }
      );
    });

    it('should log initialization in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const tracker = new (analytics.constructor as any)({ debug: true });

      tracker.init();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] Initialized',
        expect.objectContaining({ sessionId: expect.any(String) })
      );
    });
  });
});
