import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import {
  AnimatedCountUp,
  AnimatedCurrency,
  AnimatedPercentage,
  AnimatedCompactNumber,
  AnimatedStatCounter,
} from '../src/design-system/components/animated/AnimatedCountUp';
import { Card, CardBody } from '../design-system/components/Card';

/**
 * AnimatedCountUp provides smooth number animations for statistics and metrics.
 *
 * ## Usage
 *
 * ```tsx
 * import { AnimatedCountUp } from './design-system/components/animated/AnimatedCountUp';
 *
 * <AnimatedCountUp value={12345} duration={2} />
 * ```
 */
const meta: Meta<typeof AnimatedCountUp> = {
  title: 'Components/Animated/AnimatedCountUp',
  component: AnimatedCountUp,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Animated number counter with smooth count-up animation, formatting options, and intersection observer triggers.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'number',
      description: 'Target value to count to',
    },
    from: {
      control: 'number',
      description: 'Starting value',
    },
    duration: {
      control: { type: 'range', min: 0.5, max: 5, step: 0.5 },
      description: 'Animation duration in seconds',
    },
    easing: {
      control: 'select',
      options: ['linear', 'easeIn', 'easeOut', 'easeInOut'],
      description: 'Easing function',
    },
    decimals: {
      control: { type: 'range', min: 0, max: 4 },
      description: 'Number of decimal places',
    },
    prefix: {
      control: 'text',
      description: 'Value prefix',
    },
    suffix: {
      control: 'text',
      description: 'Value suffix',
    },
    separator: {
      control: 'text',
      description: 'Thousands separator',
    },
    triggerOnView: {
      control: 'boolean',
      description: 'Start animation when element is in view',
    },
    animateOnChange: {
      control: 'boolean',
      description: 'Re-animate when value changes',
    },
    label: {
      control: 'text',
      description: 'Display label',
    },
    labelPosition: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Label position',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// BASIC EXAMPLES
// ============================================================================

/**
 * Basic count up animation.
 */
export const Basic: Story = {
  args: {
    value: 12345,
    triggerOnView: false, // For demo purposes
  },
};

/**
 * Count up with formatting.
 */
export const WithFormatting: Story = {
  args: {
    value: 1234567,
    separator: ',',
    triggerOnView: false,
  },
};

/**
 * Count up with prefix and suffix.
 */
export const WithPrefixSuffix: Story = {
  args: {
    value: 99.99,
    prefix: '$',
    suffix: ' USD',
    decimals: 2,
    triggerOnView: false,
  },
};

// ============================================================================
// DURATION & EASING
// ============================================================================

/**
 * Fast animation (0.5 seconds).
 */
export const FastAnimation: Story = {
  args: {
    value: 1000,
    duration: 0.5,
    triggerOnView: false,
  },
};

/**
 * Slow animation (3 seconds).
 */
export const SlowAnimation: Story = {
  args: {
    value: 1000,
    duration: 3,
    triggerOnView: false,
  },
};

/**
 * Different easing functions.
 */
export const EasingComparison: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8">
      <div className="text-center">
        <AnimatedCountUp value={1000} duration={2} easing="linear" triggerOnView={false} />
        <p className="text-sm text-zinc-500 mt-2">Linear</p>
      </div>
      <div className="text-center">
        <AnimatedCountUp value={1000} duration={2} easing="easeIn" triggerOnView={false} />
        <p className="text-sm text-zinc-500 mt-2">Ease In</p>
      </div>
      <div className="text-center">
        <AnimatedCountUp value={1000} duration={2} easing="easeOut" triggerOnView={false} />
        <p className="text-sm text-zinc-500 mt-2">Ease Out</p>
      </div>
      <div className="text-center">
        <AnimatedCountUp value={1000} duration={2} easing="easeInOut" triggerOnView={false} />
        <p className="text-sm text-zinc-500 mt-2">Ease In Out</p>
      </div>
    </div>
  ),
};

// ============================================================================
// LABELS
// ============================================================================

/**
 * With label at bottom.
 */
export const WithLabelBottom: Story = {
  args: {
    value: 8432,
    label: 'Active Users',
    labelPosition: 'bottom',
    triggerOnView: false,
  },
};

/**
 * With label at top.
 */
export const WithLabelTop: Story = {
  args: {
    value: 125430,
    prefix: '$',
    label: 'Total Revenue',
    labelPosition: 'top',
    separator: ',',
    triggerOnView: false,
  },
};

/**
 * With label on right.
 */
export const WithLabelRight: Story = {
  args: {
    value: 1234,
    label: 'items',
    labelPosition: 'right',
    triggerOnView: false,
  },
};

// ============================================================================
// SPECIALIZED VARIANTS
// ============================================================================

/**
 * Currency format.
 */
export const Currency: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <AnimatedCurrency value={1234.56} triggerOnView={false} />
        <p className="text-sm text-zinc-500">USD (default)</p>
      </div>
      <div>
        <AnimatedCurrency value={1234.56} currency="EUR" triggerOnView={false} />
        <p className="text-sm text-zinc-500">EUR</p>
      </div>
      <div>
        <AnimatedCurrency value={1234.56} currency="GBP" triggerOnView={false} />
        <p className="text-sm text-zinc-500">GBP</p>
      </div>
    </div>
  ),
};

/**
 * Percentage format.
 */
export const Percentage: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <AnimatedPercentage value={85.5} triggerOnView={false} />
        <p className="text-sm text-zinc-500">Standard</p>
      </div>
      <div>
        <AnimatedPercentage value={12.3} showPlusSign triggerOnView={false} />
        <p className="text-sm text-zinc-500">With plus sign (positive)</p>
      </div>
      <div>
        <AnimatedPercentage value={-5.2} showPlusSign triggerOnView={false} />
        <p className="text-sm text-zinc-500">Negative value</p>
      </div>
    </div>
  ),
};

/**
 * Compact number format (K, M, B).
 */
export const CompactNumber: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <AnimatedCompactNumber value={1500} triggerOnView={false} />
        <p className="text-sm text-zinc-500">1.5K</p>
      </div>
      <div>
        <AnimatedCompactNumber value={2500000} triggerOnView={false} />
        <p className="text-sm text-zinc-500">2.5M</p>
      </div>
      <div>
        <AnimatedCompactNumber value={3500000000} triggerOnView={false} />
        <p className="text-sm text-zinc-500">3.5B</p>
      </div>
    </div>
  ),
};

/**
 * Stat counter with trend.
 */
export const StatCounter: Story = {
  render: () => (
    <div className="space-y-6">
      <AnimatedStatCounter
        value={12543}
        previousValue={10234}
        showTrend
        label="Total Users"
        triggerOnView={false}
      />
      <AnimatedStatCounter
        value={32}
        previousValue={45}
        showTrend
        invertTrend
        label="Bounce Rate"
        triggerOnView={false}
      />
    </div>
  ),
};

// ============================================================================
// STYLING
// ============================================================================

/**
 * Custom styled counter.
 */
export const CustomStyling: Story = {
  args: {
    value: 125430,
    prefix: '$',
    separator: ',',
    valueClassName: 'text-4xl font-bold text-indigo-600',
    label: 'Revenue',
    labelPosition: 'top',
    labelClassName: 'text-sm font-medium text-zinc-500',
    triggerOnView: false,
  },
};

// ============================================================================
// IN CONTEXT
// ============================================================================

/**
 * Stats dashboard example.
 */
export const StatsDashboard: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 w-[500px]">
      <Card padding="lg">
        <CardBody className="text-center">
          <AnimatedCountUp
            value={125430}
            prefix="$"
            separator=","
            duration={2}
            label="Total Revenue"
            labelPosition="top"
            valueClassName="text-3xl font-bold text-zinc-900 dark:text-white"
            triggerOnView={false}
          />
        </CardBody>
      </Card>

      <Card padding="lg">
        <CardBody className="text-center">
          <AnimatedStatCounter
            value={8432}
            previousValue={7821}
            showTrend
            label="Active Users"
            valueClassName="text-3xl font-bold"
            triggerOnView={false}
          />
        </CardBody>
      </Card>

      <Card padding="lg">
        <CardBody className="text-center">
          <AnimatedPercentage
            value={94.5}
            duration={1.5}
            label="Satisfaction Rate"
            labelPosition="top"
            valueClassName="text-3xl font-bold text-green-600"
            triggerOnView={false}
          />
        </CardBody>
      </Card>

      <Card padding="lg">
        <CardBody className="text-center">
          <AnimatedCompactNumber
            value={2500000}
            label="Page Views"
            labelPosition="top"
            valueClassName="text-3xl font-bold"
            triggerOnView={false}
          />
        </CardBody>
      </Card>
    </div>
  ),
};

/**
 * Counter with callback.
 */
export const WithCallback: Story = {
  args: {
    value: 100,
    duration: 1,
    onComplete: fn(),
    triggerOnView: false,
  },
};
