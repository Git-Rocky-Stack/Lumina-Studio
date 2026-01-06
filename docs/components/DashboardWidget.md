# DashboardWidget

Real-time stat cards and data visualization widgets for dashboards.

## Import

```tsx
import {
  DashboardWidget,
  StatWidget,
  ProgressWidget,
} from './design-system/components/data-display/DashboardWidget';
```

## Overview

DashboardWidget is a versatile component for displaying metrics, statistics, and data visualizations. It supports real-time updates, trend indicators, sparkline charts, and multiple display types.

## Basic Usage

```tsx
<DashboardWidget
  title="Total Revenue"
  value={125430}
  icon={<DollarIcon />}
/>
```

## Widget Types

### Stat Widget

Display a single metric with optional trend.

```tsx
<DashboardWidget
  type="stat"
  title="Active Users"
  value={8432}
  trend={{ direction: 'up', value: 12.5 }}
/>

// Or use the simplified StatWidget
<StatWidget
  title="Total Sales"
  value={1234}
  unit="USD"
  previousValue={1100}
/>
```

### Progress Widget

Display progress towards a goal.

```tsx
<ProgressWidget
  title="Storage Used"
  value={75}
  progress={75}
  progressConfig={{ max: 100, showLabel: true }}
  color="warning"
/>
```

## Trend Indicators

### Automatic Trend Calculation

Provide `previousValue` to auto-calculate trend:

```tsx
<DashboardWidget
  title="Monthly Sales"
  value={15000}
  previousValue={12000}
  showTrend
/>
// Shows: +25% up trend
```

### Manual Trend

Specify trend data directly:

```tsx
<DashboardWidget
  title="Bounce Rate"
  value={32.5}
  unit="%"
  trend={{
    direction: 'down',
    value: 8.2,
    invertColors: true, // Down is good for bounce rate
    comparisonLabel: 'vs last month',
  }}
/>
```

## Sparkline Charts

Add a mini line chart to visualize trends:

```tsx
<DashboardWidget
  title="Weekly Visitors"
  value={45200}
  showSparkline
  sparklineData={[
    3200, 4100, 3800, 4500, 4200, 5100, 5800
  ]}
/>
```

## Color Schemes

```tsx
<DashboardWidget color="primary" title="Primary" value={100} />
<DashboardWidget color="success" title="Success" value={200} />
<DashboardWidget color="warning" title="Warning" value={300} />
<DashboardWidget color="error" title="Error" value={400} />
<DashboardWidget color="info" title="Info" value={500} />
<DashboardWidget color="neutral" title="Neutral" value={600} />
```

## Sizes

```tsx
<DashboardWidget size="sm" title="Small" value={100} />
<DashboardWidget size="md" title="Medium" value={200} />
<DashboardWidget size="lg" title="Large" value={300} />
<DashboardWidget size="xl" title="Extra Large" value={400} />
```

## Loading & Error States

### Loading

```tsx
<DashboardWidget
  title="Loading Data"
  isLoading
/>
```

### Error

```tsx
<DashboardWidget
  title="Failed to Load"
  error={new Error('Network error')}
  onRefresh={handleRetry}
/>
```

### Stale Data

```tsx
<DashboardWidget
  title="Cached Data"
  value={oldValue}
  isStale
  lastUpdated={cacheTime}
/>
```

## Interactive Features

### Refresh Button

```tsx
<DashboardWidget
  title="Live Data"
  value={currentValue}
  onRefresh={async () => {
    const newData = await fetchData();
    setValue(newData);
  }}
/>
```

### Expandable

```tsx
<DashboardWidget
  title="Summary"
  value={total}
  expandable
  onExpand={() => setShowDetails(true)}
/>
```

### Clickable

```tsx
<DashboardWidget
  title="Orders"
  value={orderCount}
  onClick={() => navigate('/orders')}
/>
```

### Menu Actions

```tsx
<DashboardWidget
  title="Sales"
  value={salesTotal}
  menuActions={[
    { label: 'Export', icon: <DownloadIcon />, onClick: handleExport },
    { label: 'Share', icon: <ShareIcon />, onClick: handleShare },
    { label: 'Delete', icon: <TrashIcon />, onClick: handleDelete, danger: true },
  ]}
/>
```

## Real-Time Data

Use with the `useRealTimeData` hook:

```tsx
function LiveWidget() {
  const { data, isLoading, error, isStale, lastUpdated, refetch } = useRealTimeData({
    fetchFn: () => fetchMetrics(),
    interval: 30000, // Refresh every 30 seconds
  });

  return (
    <DashboardWidget
      title="Active Sessions"
      value={data?.sessions ?? 0}
      isLoading={isLoading}
      error={error}
      isStale={isStale}
      lastUpdated={lastUpdated}
      onRefresh={refetch}
    />
  );
}
```

## Animation Control

```tsx
// No animations
<DashboardWidget animation="none" title="Static" value={100} />

// Subtle animations
<DashboardWidget animation="subtle" title="Subtle" value={200} />

// Standard animations (default)
<DashboardWidget animation="moderate" title="Moderate" value={300} />

// Expressive animations
<DashboardWidget animation="expressive" title="Expressive" value={400} />
```

## Glassmorphism Effect

```tsx
<DashboardWidget
  title="Glass Widget"
  value={1234}
  glassmorphism
/>
```

## Custom Content

```tsx
<DashboardWidget
  title="Custom Widget"
  customHeader={<CustomHeader />}
  footer={<Button size="sm">View Details</Button>}
>
  <MyCustomChart data={chartData} />
</DashboardWidget>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Widget title |
| `subtitle` | `string` | - | Widget subtitle |
| `value` | `number \| string` | - | Main value to display |
| `unit` | `string` | - | Value unit (e.g., "USD", "%") |
| `icon` | `ReactNode` | - | Widget icon |
| `type` | `'stat' \| 'progress' \| 'chart' \| 'list'` | `'stat'` | Widget type |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Widget size |
| `color` | `WidgetColor` | `'neutral'` | Color scheme |
| `animation` | `'none' \| 'subtle' \| 'moderate' \| 'expressive'` | `'moderate'` | Animation level |
| `trend` | `TrendData` | - | Trend indicator data |
| `previousValue` | `number` | - | For auto trend calculation |
| `showTrend` | `boolean` | `true` | Show trend indicator |
| `showSparkline` | `boolean` | `false` | Show sparkline chart |
| `sparklineData` | `number[]` | - | Sparkline data points |
| `progress` | `number` | - | Progress value (for progress type) |
| `progressConfig` | `ProgressConfig` | - | Progress configuration |
| `isLoading` | `boolean` | `false` | Loading state |
| `error` | `Error` | - | Error state |
| `isStale` | `boolean` | `false` | Data stale state |
| `lastUpdated` | `Date` | - | Last update timestamp |
| `onRefresh` | `() => void` | - | Refresh handler |
| `onExpand` | `() => void` | - | Expand handler |
| `expandable` | `boolean` | `false` | Enable expand button |
| `onClick` | `() => void` | - | Click handler |
| `menuActions` | `MenuAction[]` | - | Menu dropdown actions |
| `glassmorphism` | `boolean` | `false` | Glass effect |
| `headerActions` | `ReactNode` | - | Custom header actions |
| `footer` | `ReactNode` | - | Footer content |
| `customHeader` | `ReactNode` | - | Replace default header |

## Types

```typescript
interface TrendData {
  direction: 'up' | 'down' | 'neutral';
  value: number;
  comparisonLabel?: string;
  invertColors?: boolean;
}

interface ProgressConfig {
  max?: number;
  showLabel?: boolean;
  variant?: 'linear' | 'circular';
}

interface MenuAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

type WidgetColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
```

## Accessibility

- Uses semantic `<article>` element
- Clickable widgets are keyboard accessible
- Loading state announced via `aria-busy`
- Screen reader friendly value announcements
- Proper heading hierarchy in header

## Performance

- Memoized to prevent unnecessary re-renders
- Animation respects `prefers-reduced-motion`
- Sparkline uses efficient SVG path rendering
- Value animation uses `requestAnimationFrame`

## Best Practices

### Do

- Use appropriate colors for the metric type (success for positive, error for negative)
- Provide loading states for async data
- Show last updated time for real-time data
- Use sparklines to show trends over time

### Don't

- Overcrowd widgets with too much information
- Use animations that distract from the data
- Forget to handle error states
- Mix different color schemes in the same dashboard section

## Related Components

- [AnimatedCountUp](./AnimatedCountUp.md) - Animated number counter
- [Card](./Card.md) - Container component
- [ResponsiveGrid](./ResponsiveGrid.md) - Grid layout for widgets
