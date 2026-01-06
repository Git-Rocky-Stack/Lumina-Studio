import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { DollarSign, Users, TrendingUp, ShoppingCart, Activity, Server } from 'lucide-react';
import {
  DashboardWidget,
  StatWidget,
  ProgressWidget,
} from '../src/design-system/components/data-display/DashboardWidget/DashboardWidget';

/**
 * DashboardWidget displays metrics, statistics, and data visualizations.
 *
 * ## Usage
 *
 * ```tsx
 * import { DashboardWidget } from './design-system/components/data-display/DashboardWidget';
 *
 * <DashboardWidget
 *   title="Total Revenue"
 *   value={125430}
 *   icon={<DollarSign />}
 *   trend={{ direction: 'up', value: 12.5 }}
 * />
 * ```
 */
const meta: Meta<typeof DashboardWidget> = {
  title: 'Components/DashboardWidget',
  component: DashboardWidget,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile widget component for dashboards with support for stats, trends, sparklines, and real-time updates.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['stat', 'progress'],
      description: 'Widget display type',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Widget size',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'],
      description: 'Color scheme',
    },
    animation: {
      control: 'select',
      options: ['none', 'subtle', 'moderate', 'expressive'],
      description: 'Animation intensity',
    },
    showTrend: {
      control: 'boolean',
      description: 'Show trend indicator',
    },
    showSparkline: {
      control: 'boolean',
      description: 'Show sparkline chart',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state',
    },
    glassmorphism: {
      control: 'boolean',
      description: 'Glass effect',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// BASIC EXAMPLES
// ============================================================================

/**
 * Basic stat widget with value and title.
 */
export const Basic: Story = {
  args: {
    title: 'Total Users',
    value: 12543,
    icon: <Users className="w-5 h-5" />,
  },
};

/**
 * Widget with trend indicator.
 */
export const WithTrend: Story = {
  args: {
    title: 'Revenue',
    value: 125430,
    unit: 'USD',
    icon: <DollarSign className="w-5 h-5" />,
    color: 'success',
    trend: {
      direction: 'up',
      value: 12.5,
      comparisonLabel: 'vs last month',
    },
  },
};

/**
 * Widget with downward trend.
 */
export const DownwardTrend: Story = {
  args: {
    title: 'Bounce Rate',
    value: 32.5,
    unit: '%',
    icon: <Activity className="w-5 h-5" />,
    color: 'warning',
    trend: {
      direction: 'down',
      value: 8.2,
      invertColors: true, // Down is good for bounce rate
    },
  },
};

/**
 * Widget with sparkline chart.
 */
export const WithSparkline: Story = {
  args: {
    title: 'Weekly Visitors',
    value: 45200,
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'primary',
    showSparkline: true,
    sparklineData: [3200, 4100, 3800, 4500, 4200, 5100, 5800],
    trend: {
      direction: 'up',
      value: 15.3,
    },
  },
};

// ============================================================================
// COLOR SCHEMES
// ============================================================================

/**
 * Primary color scheme.
 */
export const ColorPrimary: Story = {
  args: {
    title: 'Primary',
    value: 1234,
    color: 'primary',
    icon: <Activity className="w-5 h-5" />,
  },
};

/**
 * Success color scheme.
 */
export const ColorSuccess: Story = {
  args: {
    title: 'Success',
    value: 98.5,
    unit: '%',
    color: 'success',
    icon: <TrendingUp className="w-5 h-5" />,
  },
};

/**
 * Warning color scheme.
 */
export const ColorWarning: Story = {
  args: {
    title: 'Warning',
    value: 75,
    unit: '%',
    color: 'warning',
    icon: <Server className="w-5 h-5" />,
  },
};

/**
 * Error color scheme.
 */
export const ColorError: Story = {
  args: {
    title: 'Error',
    value: 12,
    color: 'error',
    icon: <Activity className="w-5 h-5" />,
  },
};

// ============================================================================
// SIZES
// ============================================================================

/**
 * Small widget.
 */
export const SizeSmall: Story = {
  args: {
    title: 'Small Widget',
    value: 1234,
    size: 'sm',
    icon: <Users className="w-4 h-4" />,
  },
};

/**
 * Large widget.
 */
export const SizeLarge: Story = {
  args: {
    title: 'Large Widget',
    value: 125430,
    size: 'lg',
    icon: <DollarSign className="w-6 h-6" />,
    showSparkline: true,
    sparklineData: [100, 120, 115, 130, 140, 135, 150],
  },
};

/**
 * Extra large widget.
 */
export const SizeExtraLarge: Story = {
  args: {
    title: 'Extra Large Widget',
    value: 2500000,
    size: 'xl',
    icon: <TrendingUp className="w-7 h-7" />,
    trend: {
      direction: 'up',
      value: 25.8,
    },
  },
};

// ============================================================================
// PROGRESS WIDGET
// ============================================================================

/**
 * Progress widget showing completion.
 */
export const Progress: Story = {
  args: {
    type: 'progress',
    title: 'Storage Used',
    value: 75,
    progress: 75,
    progressConfig: {
      max: 100,
      showLabel: true,
    },
    color: 'warning',
    icon: <Server className="w-5 h-5" />,
  },
};

/**
 * Progress widget with custom max.
 */
export const ProgressCustomMax: Story = {
  args: {
    type: 'progress',
    title: 'Tasks Completed',
    value: 45,
    unit: 'tasks',
    progress: 45,
    progressConfig: {
      max: 60,
      showLabel: true,
    },
    color: 'primary',
  },
};

// ============================================================================
// STATES
// ============================================================================

/**
 * Loading state.
 */
export const Loading: Story = {
  args: {
    title: 'Loading Data',
    isLoading: true,
  },
};

/**
 * Error state.
 */
export const Error: Story = {
  args: {
    title: 'Failed to Load',
    error: new Error('Network error: Unable to fetch data'),
    onRefresh: fn(),
  },
};

/**
 * Stale data indicator.
 */
export const StaleData: Story = {
  args: {
    title: 'Cached Data',
    value: 8432,
    isStale: true,
    lastUpdated: new Date(Date.now() - 3600000), // 1 hour ago
    onRefresh: fn(),
    icon: <Users className="w-5 h-5" />,
  },
};

// ============================================================================
// INTERACTIVE
// ============================================================================

/**
 * Widget with refresh button.
 */
export const WithRefresh: Story = {
  args: {
    title: 'Live Data',
    value: 8432,
    icon: <Activity className="w-5 h-5" />,
    onRefresh: fn(),
    lastUpdated: new Date(),
  },
};

/**
 * Clickable widget.
 */
export const Clickable: Story = {
  args: {
    title: 'Orders',
    value: 156,
    icon: <ShoppingCart className="w-5 h-5" />,
    onClick: fn(),
    trend: {
      direction: 'up',
      value: 8.3,
    },
  },
};

/**
 * Widget with menu actions.
 */
export const WithMenuActions: Story = {
  args: {
    title: 'Sales',
    value: 89540,
    unit: 'USD',
    icon: <DollarSign className="w-5 h-5" />,
    menuActions: [
      { label: 'Export', onClick: fn() },
      { label: 'Share', onClick: fn() },
      { label: 'Delete', onClick: fn(), danger: true },
    ],
  },
};

// ============================================================================
// GLASSMORPHISM
// ============================================================================

/**
 * Glass effect widget.
 */
export const Glassmorphism: Story = {
  args: {
    title: 'Glass Widget',
    value: 12543,
    icon: <Users className="w-5 h-5" />,
    glassmorphism: true,
    trend: {
      direction: 'up',
      value: 5.2,
    },
  },
  decorators: [
    (Story) => (
      <div
        className="w-80 p-8 rounded-lg"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// ============================================================================
// DASHBOARD GRID
// ============================================================================

/**
 * Multiple widgets in a dashboard layout.
 */
export const DashboardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <DashboardWidget
        title="Total Revenue"
        value={125430}
        unit="USD"
        icon={<DollarSign className="w-5 h-5" />}
        color="success"
        trend={{ direction: 'up', value: 12.5 }}
      />
      <DashboardWidget
        title="Active Users"
        value={8432}
        icon={<Users className="w-5 h-5" />}
        color="primary"
        trend={{ direction: 'up', value: 8.2 }}
      />
      <DashboardWidget
        title="Orders"
        value={1234}
        icon={<ShoppingCart className="w-5 h-5" />}
        color="info"
        showSparkline
        sparklineData={[100, 120, 115, 130, 140, 135, 150]}
      />
      <ProgressWidget
        title="Server Load"
        value={65}
        progress={65}
        progressConfig={{ max: 100, showLabel: true }}
        icon={<Server className="w-5 h-5" />}
        color="warning"
      />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-[600px]">
        <Story />
      </div>
    ),
  ],
};
