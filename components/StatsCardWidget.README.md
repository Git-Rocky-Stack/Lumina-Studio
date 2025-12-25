# StatsCardWidget Component

A comprehensive, production-ready dashboard widget component for displaying real-time statistics with interactive controls, animations, and full accessibility support.

## Features

### Core Functionality
- **Real-time Updates**: Auto-refresh data at configurable intervals (default: 5 seconds)
- **Interactive Controls**: Manual refresh, pause/resume auto-refresh, time period selection
- **Loading States**: Skeleton cards during data fetching
- **Error Handling**: Graceful error states with retry capability and toast notifications
- **Responsive Design**: Adaptive grid layout (1/2/4 columns for mobile/tablet/desktop)
- **Dark Mode**: Full dark mode support with proper contrast ratios
- **Animations**: Smooth Framer Motion animations with staggered card entrance
- **Accessibility**: Complete ARIA labels, keyboard navigation, screen reader support

## Installation

The component is already integrated with Lumina Studio's design system. No additional dependencies required.

## Usage

### Basic Usage

```tsx
import { StatsCardWidget } from './components/StatsCardWidget';

function Dashboard() {
  const metrics = [
    {
      id: 'revenue',
      label: 'Total Revenue',
      icon: <DollarSign className="w-4 h-4" />,
      formatter: (value) => `$${value.toLocaleString()}`,
      color: 'text-emerald-500'
    },
    {
      id: 'users',
      label: 'Active Users',
      icon: <Users className="w-4 h-4" />,
      formatter: (value) => value.toLocaleString(),
      color: 'text-blue-500'
    },
    {
      id: 'conversion',
      label: 'Conversion Rate',
      icon: <TrendingUp className="w-4 h-4" />,
      formatter: (value) => `${value.toFixed(2)}%`,
      color: 'text-violet-500'
    },
    {
      id: 'sessions',
      label: 'Sessions',
      icon: <Activity className="w-4 h-4" />,
      formatter: (value) => value.toLocaleString(),
      color: 'text-amber-500'
    }
  ];

  return (
    <StatsCardWidget
      title="Dashboard Metrics"
      metrics={metrics}
      refreshInterval={10000} // 10 seconds
      initialPeriod="24h"
      onError={(error) => console.error('Metrics error:', error)}
    />
  );
}
```

### Advanced Usage with Custom Data Fetcher

```tsx
import { StatsCardWidget, fetchMetrics } from './components/StatsCardWidget';

// Override the default data fetcher
window.fetchMetrics = async (metrics, period) => {
  const response = await fetch(`/api/metrics?period=${period}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metrics: metrics.map(m => m.id) })
  });

  if (!response.ok) throw new Error('Failed to fetch metrics');

  return response.json();
};

function AdvancedDashboard() {
  const metrics = [
    // ... metric configurations
  ];

  return (
    <StatsCardWidget
      title="Performance Analytics"
      metrics={metrics}
      refreshInterval={5000}
      initialPeriod="1h"
      onError={(error) => {
        // Custom error handling
        logToAnalytics('metrics_error', { error: error.message });
      }}
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | Yes | - | Widget title displayed at the top |
| `metrics` | `MetricConfig[]` | Yes | - | Array of metric configurations |
| `refreshInterval` | `number` | No | `5000` | Auto-refresh interval in milliseconds |
| `initialPeriod` | `'1h' \| '24h' \| '7d' \| '30d'` | No | `'24h'` | Initial time period selection |
| `onError` | `(error: Error) => void` | No | - | Error callback function |

### MetricConfig Interface

```typescript
interface MetricConfig {
  id: string;                          // Unique identifier
  label: string;                       // Display label
  icon?: React.ReactNode;              // Optional icon component
  formatter?: (value: number) => string; // Value formatter function
  color?: string;                      // Icon color class (e.g., 'text-blue-500')
}
```

## Interactive Controls

### Refresh Button
- **Icon**: RefreshCw
- **Action**: Manually triggers data refresh
- **Loading State**: Shows spinner during refresh
- **Keyboard**: Enter/Space to activate

### Pause/Resume Toggle
- **Icons**: Pause (when running) / Play (when paused)
- **Action**: Toggles auto-refresh on/off
- **State Persistence**: Maintains pause state across refreshes
- **Keyboard**: Enter/Space to toggle

### Time Period Selector
- **Options**: 1h, 24h, 7d, 30d
- **Action**: Changes data time range and refreshes
- **Visual Feedback**: Active period highlighted
- **Keyboard**: Tab to navigate, Enter/Space to select

## Accessibility Features

### ARIA Support
- `aria-label` on all interactive elements
- `aria-live="polite"` for loading announcements
- `aria-busy` during data fetching
- `role="region"` with `aria-label` for stats grid
- `aria-pressed` for toggle buttons

### Keyboard Navigation
- Full keyboard support for all controls
- Tab order follows visual layout
- Enter/Space activates buttons
- Focus visible indicators

### Screen Reader Support
- Loading states announced
- Error messages announced
- Value changes announced
- Button states clearly communicated

## Styling & Theming

### Responsive Breakpoints
- **Mobile** (< 768px): 1 column
- **Tablet** (768px - 1024px): 2 columns
- **Desktop** (> 1024px): 4 columns

### Dark Mode Classes
- Automatic dark mode detection
- Proper contrast ratios maintained
- Uses Tailwind's `dark:` prefix

### Animation Variants
- Card entrance: Fade up with spring physics
- Value changes: Smooth number transitions
- Staggered delays: 50ms between cards
- Hover effects: Subtle scale on cards

## Performance Optimizations

### Implemented Optimizations
- `React.memo` for preventing unnecessary re-renders
- `useMemo` for expensive computations
- Cleanup of timers on unmount
- Debounced period changes
- Loading state prevents duplicate fetches

### Best Practices
- Use reasonable refresh intervals (5-30 seconds)
- Implement server-side caching for metrics
- Consider WebSocket for real-time data
- Batch metric requests when possible

## Testing

The component includes comprehensive test coverage:
- 55 total tests
- Unit tests for all features
- Accessibility tests
- Error scenario tests
- Performance tests

Run tests:
```bash
npm test -- src/components/StatsCardWidget.test.tsx
```

## Troubleshooting

### Common Issues

1. **Data not loading**: Check that `fetchMetrics` function is properly implemented
2. **Toast not showing**: Ensure toast provider is wrapped around the app
3. **Dark mode not working**: Verify Tailwind dark mode configuration
4. **Animations stuttering**: Check for performance bottlenecks in data fetching

### Debug Mode

Enable debug logging:
```tsx
<StatsCardWidget
  {...props}
  onError={(error) => {
    console.error('[StatsCardWidget]', error);
    // Additional debug info
    console.log('Current metrics:', metrics);
    console.log('Current period:', period);
  }}
/>
```

## Examples

### Financial Dashboard
```tsx
const financialMetrics = [
  {
    id: 'revenue',
    label: 'Revenue',
    icon: <DollarSign />,
    formatter: (v) => `$${(v/1000).toFixed(1)}K`,
    color: 'text-emerald-500'
  },
  {
    id: 'profit',
    label: 'Profit',
    icon: <TrendingUp />,
    formatter: (v) => `$${(v/1000).toFixed(1)}K`,
    color: 'text-green-500'
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: <CreditCard />,
    formatter: (v) => `$${(v/1000).toFixed(1)}K`,
    color: 'text-red-500'
  },
  {
    id: 'margin',
    label: 'Margin',
    icon: <Percent />,
    formatter: (v) => `${v.toFixed(1)}%`,
    color: 'text-blue-500'
  }
];
```

### Analytics Dashboard
```tsx
const analyticsMetrics = [
  {
    id: 'pageviews',
    label: 'Page Views',
    icon: <Eye />,
    formatter: (v) => v > 1000 ? `${(v/1000).toFixed(1)}K` : v.toString(),
    color: 'text-indigo-500'
  },
  {
    id: 'bounce_rate',
    label: 'Bounce Rate',
    icon: <ArrowDownRight />,
    formatter: (v) => `${v.toFixed(1)}%`,
    color: 'text-orange-500'
  },
  {
    id: 'session_duration',
    label: 'Avg Duration',
    icon: <Clock />,
    formatter: (v) => `${Math.floor(v/60)}:${(v%60).toString().padStart(2, '0')}`,
    color: 'text-purple-500'
  },
  {
    id: 'conversion',
    label: 'Conversion',
    icon: <Target />,
    formatter: (v) => `${v.toFixed(2)}%`,
    color: 'text-green-500'
  }
];
```

## Contributing

When modifying this component:
1. Maintain TDD approach - write tests first
2. Ensure all accessibility features remain intact
3. Test across different screen sizes
4. Verify dark mode compatibility
5. Update this documentation

## License

Part of Lumina Studio - All rights reserved.