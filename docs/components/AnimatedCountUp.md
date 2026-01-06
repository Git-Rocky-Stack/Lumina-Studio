# AnimatedCountUp

Animated number counter with smooth count-up animation and formatting options.

## Import

```tsx
import {
  AnimatedCountUp,
  AnimatedCurrency,
  AnimatedPercentage,
  AnimatedCompactNumber,
  AnimatedStatCounter,
} from './design-system/components/animated/AnimatedCountUp';
```

## Overview

AnimatedCountUp provides smooth number animations for displaying statistics, metrics, and financial data. It supports various formatting options, intersection observer triggers, and respects user motion preferences.

## Basic Usage

```tsx
<AnimatedCountUp value={12345} />
```

## Animation Configuration

### Duration

```tsx
<AnimatedCountUp value={1000} duration={2} />  // 2 seconds
<AnimatedCountUp value={1000} duration={0.5} /> // 0.5 seconds
```

### Starting Value

```tsx
<AnimatedCountUp value={100} from={50} /> // Counts from 50 to 100
```

### Easing

```tsx
<AnimatedCountUp value={1000} easing="linear" />
<AnimatedCountUp value={1000} easing="easeIn" />
<AnimatedCountUp value={1000} easing="easeOut" />   // default
<AnimatedCountUp value={1000} easing="easeInOut" />
```

## Number Formatting

### Decimal Places

```tsx
<AnimatedCountUp value={99.99} decimals={2} /> // "99.99"
<AnimatedCountUp value={1234.5} decimals={0} /> // "1235"
```

### Thousands Separator

```tsx
<AnimatedCountUp value={1234567} separator="," /> // "1,234,567"
<AnimatedCountUp value={1234567} separator=" " /> // "1 234 567"
<AnimatedCountUp value={1234567} separator="" />  // "1234567"
```

### Decimal Separator

```tsx
<AnimatedCountUp value={1234.56} decimal="." decimals={2} /> // "1,234.56"
<AnimatedCountUp value={1234.56} decimal="," decimals={2} /> // "1.234,56"
```

### Prefix & Suffix

```tsx
<AnimatedCountUp value={99} prefix="$" />           // "$99"
<AnimatedCountUp value={50} suffix="%" />           // "50%"
<AnimatedCountUp value={1000} prefix="$" suffix=" USD" /> // "$1,000 USD"
```

## Trigger Options

### Trigger on View

Starts animation when element scrolls into view (default behavior):

```tsx
<AnimatedCountUp value={1000} triggerOnView />
```

### View Threshold

Control when animation triggers based on visibility:

```tsx
<AnimatedCountUp
  value={1000}
  triggerOnView
  viewThreshold={0.5} // Trigger when 50% visible
/>
```

### Immediate Animation

Start animation immediately, not on view:

```tsx
<AnimatedCountUp value={1000} triggerOnView={false} />
```

### Re-animate on Change

Animate when value changes:

```tsx
const [count, setCount] = useState(100);

<AnimatedCountUp
  value={count}
  animateOnChange // Re-animates when count changes
/>
```

## Labels

```tsx
<AnimatedCountUp
  value={1234}
  label="Total Users"
  labelPosition="bottom" // default
/>

<AnimatedCountUp
  value={1234}
  label="Users"
  labelPosition="top"
/>

<AnimatedCountUp
  value={1234}
  label="users"
  labelPosition="right"
/>
```

## Specialized Variants

### Currency

Format as currency with locale support:

```tsx
<AnimatedCurrency value={99.99} />                    // "$99.99"
<AnimatedCurrency value={99.99} currency="EUR" />     // "EUR99.99"
<AnimatedCurrency value={99.99} currency="GBP" locale="en-GB" /> // "GBP99.99"
```

### Percentage

Format as percentage:

```tsx
<AnimatedPercentage value={85.5} />                    // "85.5%"
<AnimatedPercentage value={12.3} showPlusSign />       // "+12.3%"
<AnimatedPercentage value={-5.2} showPlusSign />       // "-5.2%"
```

### Compact Number

Format large numbers with K, M, B suffixes:

```tsx
<AnimatedCompactNumber value={1500} />      // "1.5K"
<AnimatedCompactNumber value={2500000} />   // "2.5M"
<AnimatedCompactNumber value={3500000000} /> // "3.5B"

// Control decimal places
<AnimatedCompactNumber value={1234567} compactDecimals={2} /> // "1.23M"
```

### Stat Counter with Trend

Display value with trend indicator:

```tsx
<AnimatedStatCounter
  value={12543}
  previousValue={10234}
  showTrend
  label="Total Users"
/>

// Inverted trend (down is good)
<AnimatedStatCounter
  value={32}
  previousValue={45}
  showTrend
  invertTrend // Shows green for decrease
  label="Bounce Rate"
/>
```

## Custom Rendering

```tsx
<AnimatedCountUp
  value={1234}
  renderValue={(formattedValue) => (
    <span className="text-4xl font-bold text-indigo-600">
      {formattedValue}
    </span>
  )}
/>
```

## Callbacks

```tsx
<AnimatedCountUp
  value={1000}
  onComplete={() => {
    console.log('Animation complete!');
    // Trigger next animation, show success message, etc.
  }}
/>
```

## Styling

```tsx
<AnimatedCountUp
  value={1234}
  className="p-4 bg-zinc-100 rounded-lg"
  valueClassName="text-3xl font-bold text-indigo-600"
  labelClassName="text-sm text-zinc-500"
  label="Total"
/>
```

## Complete Example

```tsx
function StatsGrid() {
  return (
    <ResponsiveGrid minWidth={250} gap={24}>
      <Card padding="lg">
        <AnimatedCountUp
          value={125430}
          prefix="$"
          separator=","
          duration={2}
          label="Total Revenue"
          labelPosition="top"
          valueClassName="text-4xl font-bold text-zinc-900 dark:text-white"
        />
      </Card>

      <Card padding="lg">
        <AnimatedStatCounter
          value={8432}
          previousValue={7821}
          showTrend
          label="Active Users"
          valueClassName="text-4xl font-bold"
        />
      </Card>

      <Card padding="lg">
        <AnimatedPercentage
          value={94.5}
          duration={1.5}
          label="Satisfaction Rate"
          labelPosition="top"
          valueClassName="text-4xl font-bold text-green-600"
        />
      </Card>

      <Card padding="lg">
        <AnimatedCompactNumber
          value={2500000}
          label="Page Views"
          labelPosition="top"
          valueClassName="text-4xl font-bold"
        />
      </Card>
    </ResponsiveGrid>
  );
}
```

## Props

### AnimatedCountUp Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | - | Target value to count to |
| `from` | `number` | `0` | Starting value |
| `duration` | `number` | `1` | Animation duration (seconds) |
| `easing` | `'linear' \| 'easeIn' \| 'easeOut' \| 'easeInOut'` | `'easeOut'` | Easing function |
| `decimals` | `number` | `0` | Decimal places |
| `prefix` | `string` | - | Value prefix |
| `suffix` | `string` | - | Value suffix |
| `separator` | `string` | `','` | Thousands separator |
| `decimal` | `string` | `'.'` | Decimal separator |
| `triggerOnView` | `boolean` | `true` | Trigger on scroll into view |
| `viewThreshold` | `number` | `0.3` | Intersection threshold |
| `animateOnChange` | `boolean` | `true` | Re-animate when value changes |
| `onComplete` | `() => void` | - | Animation complete callback |
| `renderValue` | `(value: string) => ReactNode` | - | Custom render function |
| `className` | `string` | - | Container class |
| `valueClassName` | `string` | - | Value class |
| `label` | `string` | - | Display label |
| `labelPosition` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Label position |
| `labelClassName` | `string` | - | Label class |

### AnimatedCurrency Props

Extends AnimatedCountUp minus `prefix`/`suffix`:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currency` | `string` | `'USD'` | Currency code |
| `locale` | `string` | `'en-US'` | Locale for formatting |

### AnimatedPercentage Props

Extends AnimatedCountUp minus `suffix`:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showPlusSign` | `boolean` | `false` | Show + for positive values |

### AnimatedCompactNumber Props

Extends AnimatedCountUp minus `suffix`/`decimals`:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `compactDecimals` | `number` | `1` | Decimal places for compact notation |

### AnimatedStatCounter Props

Extends AnimatedCountUp plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `previousValue` | `number` | - | Previous value for trend |
| `showTrend` | `boolean` | `true` | Show trend indicator |
| `invertTrend` | `boolean` | `false` | Invert trend colors |

## Accessibility

- Respects `prefers-reduced-motion` - shows final value immediately
- Uses semantic markup
- Screen reader friendly formatted output
- Proper ARIA attributes

## Performance

- Uses `requestAnimationFrame` for smooth animation
- Memoized component prevents unnecessary re-renders
- Intersection observer efficiently handles trigger-on-view
- Cleanup prevents memory leaks on unmount

## Best Practices

### Do

- Use appropriate duration for the value magnitude
- Match decimal places to the data precision
- Provide labels for context
- Use specialized variants for currencies and percentages

### Don't

- Animate too many counters simultaneously
- Use very long durations that delay information
- Forget to handle reduced motion preferences
- Use count-up for values that change frequently

## Related Components

- [DashboardWidget](./DashboardWidget.md) - Uses count-up for stat values
- [AnimatedList](./AnimatedList.md) - Staggered list animations
- [AnimatedCard](./AnimatedCard.md) - Card with entrance animations
