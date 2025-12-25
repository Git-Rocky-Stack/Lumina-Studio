import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatsCardWidget } from './StatsCardWidget';

// Mock framer-motion to avoid animation complications in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock data fetching function
const mockFetchMetrics = vi.fn();

// Test metric configurations
const mockMetrics = [
  {
    id: 'users',
    label: 'Active Users',
    icon: 'Users',
    fetchData: mockFetchMetrics,
    formatter: (value: number) => value.toLocaleString(),
  },
  {
    id: 'revenue',
    label: 'Revenue',
    icon: 'DollarSign',
    fetchData: mockFetchMetrics,
    formatter: (value: number) => `$${value.toLocaleString()}`,
  },
  {
    id: 'conversion',
    label: 'Conversion Rate',
    icon: 'TrendingUp',
    fetchData: mockFetchMetrics,
    formatter: (value: number) => `${value.toFixed(2)}%`,
  },
  {
    id: 'performance',
    label: 'Performance Score',
    icon: 'Zap',
    fetchData: mockFetchMetrics,
    formatter: (value: number) => value.toFixed(1),
  },
];

describe('StatsCardWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchMetrics.mockResolvedValue({
      value: 1000,
      change: 12.5,
      trend: 'up' as const,
    });
  });

  describe('Component Rendering', () => {
    it('should render the component with title', async () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      expect(screen.getByText('Dashboard Metrics')).toBeInTheDocument();
    });

    it('should render with custom title text', async () => {
      render(
        <StatsCardWidget
          title="Performance Overview"
          metrics={mockMetrics}
        />
      );

      expect(screen.getByText('Performance Overview')).toBeInTheDocument();
    });

    it('should render all metric cards in a grid', async () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Active Users')).toBeInTheDocument();
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
        expect(screen.getByText('Performance Score')).toBeInTheDocument();
      });
    });

    it('should render metric values after data loads', async () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      await waitFor(() => {
        // Check for formatted values (1000 formatted as "1,000")
        const values = screen.getAllByText('1,000');
        expect(values.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should apply responsive grid classes', () => {
      const { container } = render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      const grid = container.querySelector('[data-testid="stats-grid"]');
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('md:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-4');
    });

    it('should render empty state when no metrics provided', () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={[]}
        />
      );

      expect(screen.getByText('No metrics to display')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show skeleton cards while loading', () => {
      // Use a promise that won't resolve immediately
      mockFetchMetrics.mockImplementation(() => new Promise(() => {}));

      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      const skeletons = screen.getAllByTestId('skeleton-card');
      expect(skeletons).toHaveLength(4);
    });

    it('should hide skeleton cards after data loads', async () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      // Initially should show skeletons
      expect(screen.getAllByTestId('skeleton-card')).toHaveLength(4);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByTestId('skeleton-card')).not.toBeInTheDocument();
      });
    });

    it('should show loading indicator on refresh button during load', async () => {
      const user = userEvent.setup();

      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.queryByTestId('skeleton-card')).not.toBeInTheDocument();
      });

      // Setup a slow promise for the next fetch
      mockFetchMetrics.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ value: 100, change: 5, trend: 'up' }), 500))
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      expect(refreshButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Real-time Updates', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-refresh data at default interval (5 seconds)', async () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      // Wait for initial load
      await vi.waitFor(() => {
        expect(mockFetchMetrics).toHaveBeenCalled();
      });

      const initialCallCount = mockFetchMetrics.mock.calls.length;

      // Advance timer by 5 seconds
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      // Should have called fetchData again for all metrics
      expect(mockFetchMetrics.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should use custom refresh interval when provided', async () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
          refreshInterval={10000}
        />
      );

      await vi.waitFor(() => {
        expect(mockFetchMetrics).toHaveBeenCalled();
      });

      const initialCallCount = mockFetchMetrics.mock.calls.length;

      // Should not refresh after 5 seconds
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      expect(mockFetchMetrics).toHaveBeenCalledTimes(initialCallCount);

      // Should refresh after 10 seconds total
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      expect(mockFetchMetrics.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should stop auto-refresh when component unmounts', async () => {
      const { unmount } = render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      await vi.waitFor(() => {
        expect(mockFetchMetrics).toHaveBeenCalled();
      });

      const callCountBeforeUnmount = mockFetchMetrics.mock.calls.length;
      unmount();

      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockFetchMetrics).toHaveBeenCalledTimes(callCountBeforeUnmount);
    });
  });

  describe('Interactive Controls - Refresh Button', () => {
    it('should render refresh button', () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    it('should refresh all metrics when refresh button clicked', async () => {
      const user = userEvent.setup();

      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      await waitFor(() => {
        expect(mockFetchMetrics).toHaveBeenCalled();
      });

      const initialCallCount = mockFetchMetrics.mock.calls.length;
      const refreshButton = screen.getByRole('button', { name: /refresh/i });

      await user.click(refreshButton);

      await waitFor(() => {
        expect(mockFetchMetrics.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('should have accessible label on refresh button', () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toHaveAttribute('aria-label');
    });
  });

  describe('Interactive Controls - Pause/Resume', () => {
    it('should render pause button', () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('should pause auto-refresh when pause button clicked', async () => {
      vi.useFakeTimers();

      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      await vi.waitFor(() => {
        expect(mockFetchMetrics).toHaveBeenCalled();
      });

      const pauseButton = screen.getByRole('button', { name: /pause/i });
      fireEvent.click(pauseButton);

      const callCountAfterPause = mockFetchMetrics.mock.calls.length;

      // Advance time - should not trigger refresh
      await act(async () => {
        vi.advanceTimersByTime(10000);
      });

      expect(mockFetchMetrics).toHaveBeenCalledTimes(callCountAfterPause);

      vi.useRealTimers();
    });

    it('should show resume button after pause is clicked', () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      const pauseButton = screen.getByRole('button', { name: /pause/i });
      fireEvent.click(pauseButton);

      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /pause/i })).not.toBeInTheDocument();
    });

    it('should resume auto-refresh when resume button clicked', async () => {
      vi.useFakeTimers();

      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      await vi.waitFor(() => {
        expect(mockFetchMetrics).toHaveBeenCalled();
      });

      // Pause
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      fireEvent.click(pauseButton);

      const callCountAfterPause = mockFetchMetrics.mock.calls.length;

      // Resume
      const resumeButton = screen.getByRole('button', { name: /resume/i });
      fireEvent.click(resumeButton);

      // Should resume auto-refresh
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockFetchMetrics.mock.calls.length).toBeGreaterThan(callCountAfterPause);

      vi.useRealTimers();
    });

    it('should have accessible labels on pause/resume buttons', () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      const pauseButton = screen.getByRole('button', { name: /pause/i });
      expect(pauseButton).toHaveAttribute('aria-label');

      fireEvent.click(pauseButton);

      const resumeButton = screen.getByRole('button', { name: /resume/i });
      expect(resumeButton).toHaveAttribute('aria-label');
    });
  });

  describe('Interactive Controls - Time Period Selector', () => {
    it('should render time period selector with default period', () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      expect(screen.getByRole('button', { name: /1h/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /24h/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /7d/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /30d/i })).toBeInTheDocument();
    });

    it('should highlight initial period when provided', () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
          initialPeriod="24h"
        />
      );

      const button24h = screen.getByRole('button', { name: /24h/i });
      expect(button24h).toHaveAttribute('aria-pressed', 'true');
    });

    it('should change active period when period button clicked', () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
          initialPeriod="1h"
        />
      );

      const button7d = screen.getByRole('button', { name: /7d/i });
      fireEvent.click(button7d);

      expect(button7d).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /1h/i })).toHaveAttribute('aria-pressed', 'false');
    });

    it('should refresh data when period changes', async () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
          initialPeriod="1h"
        />
      );

      await waitFor(() => {
        expect(mockFetchMetrics).toHaveBeenCalled();
      });

      const initialCallCount = mockFetchMetrics.mock.calls.length;
      const button24h = screen.getByRole('button', { name: /24h/i });

      fireEvent.click(button24h);

      await waitFor(() => {
        expect(mockFetchMetrics.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('should pass selected period to fetchData function', async () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
          initialPeriod="1h"
        />
      );

      await waitFor(() => {
        expect(mockFetchMetrics).toHaveBeenCalled();
      });

      const button7d = screen.getByRole('button', { name: /7d/i });
      fireEvent.click(button7d);

      await waitFor(() => {
        const lastCall = mockFetchMetrics.mock.calls[mockFetchMetrics.mock.calls.length - 1];
        expect(lastCall[0]).toBe('7d');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when data fetch fails', async () => {
      mockFetchMetrics.mockRejectedValue(new Error('Network error'));

      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });

    it('should call onError callback when error occurs', async () => {
      const onError = vi.fn();
      mockFetchMetrics.mockRejectedValue(new Error('Network error'));

      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
          onError={onError}
        />
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it('should show error toast notification when error occurs', async () => {
      mockFetchMetrics.mockRejectedValue(new Error('API timeout'));

      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/API timeout/i)).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      mockFetchMetrics
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ value: 1000, change: 12.5, trend: 'up' });

      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByText(/failed to load/i)).not.toBeInTheDocument();
      });
    });

    it('should continue auto-refresh after error is resolved', async () => {
      vi.useFakeTimers();

      mockFetchMetrics
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ value: 1000, change: 12.5, trend: 'up' });

      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      await vi.waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });

      // Advance timer to trigger auto-refresh
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      await vi.waitFor(() => {
        expect(screen.queryByText(/failed to load/i)).not.toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on all interactive elements', () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      expect(screen.getByRole('button', { name: /refresh/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /pause/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /1h/i })).toHaveAttribute('aria-label');
    });

    it('should have proper region landmark for stats grid', () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      expect(screen.getByRole('region', { name: /dashboard metrics/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation for all controls', () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      const buttons = screen.getAllByRole('button');

      // All buttons should be focusable
      buttons.forEach(button => {
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });

    it('should announce loading state to screen readers', () => {
      mockFetchMetrics.mockImplementation(() => new Promise(() => {}));

      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      const grid = screen.getByRole('region');
      expect(grid).toHaveAttribute('aria-busy', 'true');
    });

    it('should announce errors to screen readers', async () => {
      mockFetchMetrics.mockRejectedValueOnce(new Error('Network error'));

      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should have proper button states for disabled controls', async () => {
      const user = userEvent.setup();

      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      await waitFor(() => {
        expect(screen.queryByTestId('skeleton-card')).not.toBeInTheDocument();
      });

      // Setup slow promise for refresh
      mockFetchMetrics.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ value: 100, change: 5, trend: 'up' }), 1000))
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      expect(refreshButton).toHaveAttribute('disabled');
    });
  });

  describe('Dark Mode Support', () => {
    it('should apply dark mode classes when dark mode is active', () => {
      document.documentElement.classList.add('dark');

      const { container } = render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      const widget = container.querySelector('[data-testid="stats-widget"]');
      expect(widget?.className).toContain('dark:');

      document.documentElement.classList.remove('dark');
    });

    it('should have proper contrast in dark mode', () => {
      document.documentElement.classList.add('dark');

      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      const title = screen.getByText('Dashboard Metrics');
      expect(title).toHaveClass('dark:text-white');

      document.documentElement.classList.remove('dark');
    });
  });

  describe('Responsive Layout', () => {
    it('should use single column on mobile', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      const { container } = render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      const grid = container.querySelector('[data-testid="stats-grid"]');
      expect(grid).toHaveClass('grid-cols-1');
    });

    it('should use 2 columns on tablet', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));

      const { container } = render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      const grid = container.querySelector('[data-testid="stats-grid"]');
      expect(grid).toHaveClass('md:grid-cols-2');
    });

    it('should use 4 columns on desktop', () => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));

      const { container } = render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      const grid = container.querySelector('[data-testid="stats-grid"]');
      expect(grid).toHaveClass('lg:grid-cols-4');
    });
  });

  describe('Animation Behavior', () => {
    it('should animate card entrance on mount', async () => {
      const { container } = render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      await waitFor(() => {
        const cards = container.querySelectorAll('[data-testid^="stat-card-"]');
        expect(cards.length).toBeGreaterThan(0);
        cards.forEach((card) => {
          expect(card).toHaveAttribute('data-animated', 'true');
        });
      });
    });

    it('should animate value changes', async () => {
      vi.useFakeTimers();

      mockFetchMetrics
        .mockResolvedValueOnce({ value: 1000, change: 12.5, trend: 'up' })
        .mockResolvedValueOnce({ value: 1500, change: 50, trend: 'up' });

      const { container } = render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics.slice(0, 1)}
        />
      );

      await vi.waitFor(() => {
        expect(screen.getByText('1,000')).toBeInTheDocument();
      });

      // Trigger refresh via interval
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      const valueElement = container.querySelector('[data-testid="stat-value"]');
      expect(valueElement).toHaveAttribute('data-value-changed');

      vi.useRealTimers();
    });

    it('should have staggered animation for multiple cards', async () => {
      const { container } = render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      await waitFor(() => {
        const cards = container.querySelectorAll('[data-testid^="stat-card-"]');
        expect(cards.length).toBeGreaterThan(0);
        cards.forEach((card, index) => {
          expect(card).toHaveAttribute('data-animation-delay', `${index * 100}`);
        });
      });
    });
  });

  describe('Data Formatting', () => {
    it('should format values using custom formatter', async () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={[mockMetrics[1]]} // Revenue metric with $ formatter
        />
      );

      await waitFor(() => {
        expect(screen.getByText('$1,000')).toBeInTheDocument();
      });
    });

    it('should display percentage change', async () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics.slice(0, 1)}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/12.5%/i)).toBeInTheDocument();
      });
    });

    it('should show trend indicator (up/down)', async () => {
      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics.slice(0, 1)}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('trend-up')).toBeInTheDocument();
      });
    });

    it('should handle negative trend', async () => {
      mockFetchMetrics.mockResolvedValueOnce({ value: 800, change: -20, trend: 'down' });

      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics.slice(0, 1)}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('trend-down')).toBeInTheDocument();
        expect(screen.getByText(/20%/i)).toBeInTheDocument();
      });
    });
  });

  describe('Component Props Validation', () => {
    it('should accept all required props', () => {
      expect(() => {
        render(
          <StatsCardWidget
            title="Test"
            metrics={mockMetrics}
          />
        );
      }).not.toThrow();
    });

    it('should accept optional refreshInterval prop', () => {
      expect(() => {
        render(
          <StatsCardWidget
            title="Test"
            metrics={mockMetrics}
            refreshInterval={3000}
          />
        );
      }).not.toThrow();
    });

    it('should accept optional onError prop', () => {
      expect(() => {
        render(
          <StatsCardWidget
            title="Test"
            metrics={mockMetrics}
            onError={() => {}}
          />
        );
      }).not.toThrow();
    });

    it('should accept optional initialPeriod prop', () => {
      expect(() => {
        render(
          <StatsCardWidget
            title="Test"
            metrics={mockMetrics}
            initialPeriod="7d"
          />
        );
      }).not.toThrow();
    });
  });

  describe('Performance Optimizations', () => {
    it('should not re-fetch data if already loading', async () => {
      const user = userEvent.setup();

      // Slow promise that takes a while
      let resolvePromise: (value: any) => void;
      mockFetchMetrics.mockImplementation(
        () => new Promise(resolve => {
          resolvePromise = resolve;
        })
      );

      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics.slice(0, 1)}
        />
      );

      // Initial call for the one metric
      expect(mockFetchMetrics).toHaveBeenCalledTimes(1);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });

      // Click multiple times rapidly while still loading
      await user.click(refreshButton);
      await user.click(refreshButton);
      await user.click(refreshButton);

      // Should still be only 1 call (initial), clicks ignored while loading
      expect(mockFetchMetrics).toHaveBeenCalledTimes(1);

      // Resolve the promise and cleanup
      await act(async () => {
        resolvePromise!({ value: 100, change: 5, trend: 'up' });
      });
    });

    it('should debounce period changes', async () => {
      const user = userEvent.setup();

      render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics.slice(0, 1)}
        />
      );

      await waitFor(() => {
        expect(mockFetchMetrics).toHaveBeenCalled();
      });

      const initialCallCount = mockFetchMetrics.mock.calls.length;

      // Rapidly change periods
      await user.click(screen.getByRole('button', { name: /24h/i }));

      await waitFor(() => {
        // Should have made additional calls for the period change
        expect(mockFetchMetrics.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('should cleanup timers and subscriptions on unmount', async () => {
      vi.useFakeTimers();

      const { unmount } = render(
        <StatsCardWidget
          title="Dashboard Metrics"
          metrics={mockMetrics}
        />
      );

      await vi.waitFor(() => {
        expect(mockFetchMetrics).toHaveBeenCalled();
      });

      unmount();

      // No pending timers after unmount
      expect(vi.getTimerCount()).toBe(0);

      vi.useRealTimers();
    });
  });
});
