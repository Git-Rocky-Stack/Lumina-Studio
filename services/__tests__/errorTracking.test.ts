import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { errorTracker, captureException } from '../errorTracking';

describe('ErrorTracker', () => {
  beforeEach(() => {
    // Clear stored errors before each test
    localStorage.clear();
    sessionStorage.clear();
    errorTracker.clearErrors();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should generate a unique session ID', () => {
      const sessionId = sessionStorage.getItem('lumina_session');
      expect(sessionId).toBeTruthy();
      expect(sessionId).toMatch(/^sess_\d+_[a-z0-9]+$/);
    });

    it('should reuse existing session ID', () => {
      const sessionId1 = sessionStorage.getItem('lumina_session');
      errorTracker.init();
      const sessionId2 = sessionStorage.getItem('lumina_session');
      expect(sessionId1).toBe(sessionId2);
    });
  });

  describe('Error Capturing', () => {
    it('should capture error with default type', () => {
      errorTracker.captureError({
        message: 'Test error',
        stack: 'Error stack trace',
      });

      const errors = errorTracker.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Test error');
      expect(errors[0].type).toBe('custom');
      expect(errors[0].stack).toBe('Error stack trace');
    });

    it('should capture custom error with metadata', () => {
      errorTracker.captureError({
        message: 'Custom error',
        type: 'error',
        metadata: { component: 'TestComponent', action: 'click' },
      });

      const errors = errorTracker.getErrors();
      expect(errors[0].metadata).toEqual({
        component: 'TestComponent',
        action: 'click',
      });
    });

    it('should generate unique error IDs', () => {
      errorTracker.captureError({ message: 'Error 1' });
      errorTracker.captureError({ message: 'Error 2' });

      const errors = errorTracker.getErrors();
      expect(errors[0].id).not.toBe(errors[1].id);
      expect(errors[0].id).toMatch(/^err_\d+_[a-z0-9]+$/);
    });

    it('should include window location and user agent', () => {
      errorTracker.captureError({ message: 'Test error' });

      const errors = errorTracker.getErrors();
      expect(errors[0].url).toBe(window.location.href);
      expect(errors[0].userAgent).toBe(navigator.userAgent);
    });

    it('should capture timestamp in ISO format', () => {
      const beforeTime = new Date();
      errorTracker.captureError({ message: 'Test error' });
      const afterTime = new Date();

      const errors = errorTracker.getErrors();
      const timestamp = new Date(errors[0].timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('captureMessage', () => {
    it('should capture message as custom error', () => {
      errorTracker.captureMessage('Info message', { level: 'info' });

      const errors = errorTracker.getErrors();
      expect(errors[0].message).toBe('Info message');
      expect(errors[0].type).toBe('custom');
      expect(errors[0].metadata).toEqual({ level: 'info' });
    });
  });

  describe('setUser', () => {
    it('should set userId on all errors', () => {
      errorTracker.captureError({ message: 'Error 1' });
      errorTracker.captureError({ message: 'Error 2' });
      errorTracker.setUser('user-123');

      const errors = errorTracker.getErrors();
      expect(errors[0].userId).toBe('user-123');
      expect(errors[1].userId).toBe('user-123');
    });
  });

  describe('Error Storage', () => {
    it('should store errors in localStorage', () => {
      errorTracker.captureError({ message: 'Stored error' });

      const stored = localStorage.getItem('lumina_errors');
      expect(stored).toBeTruthy();
      const parsedErrors = JSON.parse(stored!);
      expect(parsedErrors).toHaveLength(1);
      expect(parsedErrors[0].message).toBe('Stored error');
    });

    it('should limit stored errors to maxStoredErrors', () => {
      // Capture more errors than the limit
      for (let i = 0; i < 60; i++) {
        errorTracker.captureError({ message: `Error ${i}` });
      }

      const errors = errorTracker.getErrors();
      expect(errors.length).toBeLessThanOrEqual(50);
      // Should keep the most recent errors
      expect(errors[errors.length - 1].message).toBe('Error 59');
    });

    it('should load stored errors on initialization', () => {
      errorTracker.captureError({ message: 'Persisted error' });
      const errors1 = errorTracker.getErrors();

      // Create new instance (simulating page reload)
      const { errorTracker: newTracker } = await import('../errorTracking');
      const errors2 = newTracker.getErrors();

      expect(errors2.length).toBeGreaterThan(0);
      expect(errors2.some(e => e.message === 'Persisted error')).toBe(true);
    });
  });

  describe('clearErrors', () => {
    it('should clear all errors from memory and storage', () => {
      errorTracker.captureError({ message: 'Error 1' });
      errorTracker.captureError({ message: 'Error 2' });
      errorTracker.clearErrors();

      expect(errorTracker.getErrors()).toHaveLength(0);
      expect(localStorage.getItem('lumina_errors')).toBeNull();
    });
  });

  describe('Ignore Patterns', () => {
    it('should ignore errors matching ignore patterns', () => {
      errorTracker.captureError({ message: 'ResizeObserver loop limit exceeded' });
      errorTracker.captureError({ message: 'Script error' });
      errorTracker.captureError({ message: 'Loading chunk failed' });

      expect(errorTracker.getErrors()).toHaveLength(0);
    });

    it('should capture errors not matching ignore patterns', () => {
      errorTracker.captureError({ message: 'Legitimate error' });

      expect(errorTracker.getErrors()).toHaveLength(1);
    });
  });

  describe('Sample Rate', () => {
    it('should respect sample rate configuration', () => {
      // Mock Math.random to control sampling
      const mockRandom = vi.spyOn(Math, 'random');

      // Test with 0% sample rate
      mockRandom.mockReturnValue(0.99);
      const tracker1 = new (errorTracker.constructor as any)({ sampleRate: 0.5 });
      tracker1.captureError({ message: 'Test' });
      expect(tracker1.getErrors()).toHaveLength(0);

      // Test with 100% sample rate
      mockRandom.mockReturnValue(0.1);
      const tracker2 = new (errorTracker.constructor as any)({ sampleRate: 0.5 });
      tracker2.captureError({ message: 'Test' });
      expect(tracker2.getErrors()).toHaveLength(1);
    });
  });

  describe('Custom Event Dispatch', () => {
    it('should dispatch custom event on error capture', () => {
      const eventListener = vi.fn();
      window.addEventListener('lumina-error', eventListener);

      errorTracker.captureError({ message: 'Test error' });

      expect(eventListener).toHaveBeenCalledTimes(1);
      expect(eventListener.mock.calls[0][0].detail.message).toBe('Test error');

      window.removeEventListener('lumina-error', eventListener);
    });
  });

  describe('captureException helper', () => {
    it('should capture Error object', () => {
      const error = new Error('Test exception');
      captureException(error);

      const errors = errorTracker.getErrors();
      expect(errors[errors.length - 1].message).toBe('Test exception');
      expect(errors[errors.length - 1].type).toBe('error');
    });

    it('should capture Error with additional errorInfo', () => {
      const error = new Error('React error');
      const errorInfo = { componentStack: 'Component stack trace' };
      captureException(error, errorInfo);

      const errors = errorTracker.getErrors();
      expect(errors[errors.length - 1].metadata).toEqual(errorInfo);
    });
  });

  describe('Network Error Reporting', () => {
    it('should send error to endpoint when configured', async () => {
      const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
      } as Response);

      const trackerWithEndpoint = new (errorTracker.constructor as any)({
        endpoint: 'https://api.example.com/errors',
      });

      trackerWithEndpoint.captureError({ message: 'Network test error' });

      // Wait for async fetch
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/errors',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      fetchMock.mockRestore();
    });

    it('should handle network failures gracefully', async () => {
      const fetchMock = vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

      const trackerWithEndpoint = new (errorTracker.constructor as any)({
        endpoint: 'https://api.example.com/errors',
      });

      // Should not throw
      expect(() => {
        trackerWithEndpoint.captureError({ message: 'Test error' });
      }).not.toThrow();

      await new Promise(resolve => setTimeout(resolve, 10));
      fetchMock.mockRestore();
    });
  });

  describe('getErrors', () => {
    it('should return a copy of errors array', () => {
      errorTracker.captureError({ message: 'Original error' });
      const errors = errorTracker.getErrors();

      // Modify the returned array
      errors.push({} as any);
      errors[0].message = 'Modified';

      // Original should be unchanged
      const originalErrors = errorTracker.getErrors();
      expect(originalErrors).toHaveLength(1);
      expect(originalErrors[0].message).toBe('Original error');
    });
  });
});
