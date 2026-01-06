import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Plus, ArrowRight, Download, ChevronDown, Settings, Trash, Heart } from 'lucide-react';
import { Button } from '../design-system/components/Button';

/**
 * Button is the primary interactive element used for triggering actions.
 *
 * ## Usage
 *
 * ```tsx
 * import { Button } from './design-system/components/Button';
 *
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile button component with multiple variants, sizes, and states for all user interactions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'success'],
      description: 'Visual style variant',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Button size',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'md' },
      },
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
    loadingText: {
      control: 'text',
      description: 'Text to show while loading',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the button',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make button full width',
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
  },
  args: {
    onClick: fn(),
    children: 'Button',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// BASIC VARIANTS
// ============================================================================

/**
 * The primary button is used for the main call-to-action.
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

/**
 * Secondary buttons are used for less prominent actions.
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

/**
 * Outline buttons provide a lighter visual weight.
 */
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

/**
 * Ghost buttons are used for the least prominent actions.
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

/**
 * Destructive buttons are used for dangerous actions like deleting.
 */
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

/**
 * Success buttons indicate positive actions.
 */
export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Approve',
  },
};

// ============================================================================
// SIZES
// ============================================================================

/**
 * Buttons come in 5 sizes to fit different contexts.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 flex-wrap">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};

// ============================================================================
// STATES
// ============================================================================

/**
 * Loading state shows a spinner and optional loading text.
 */
export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Submit',
  },
};

/**
 * Loading with custom text.
 */
export const LoadingWithText: Story = {
  args: {
    isLoading: true,
    loadingText: 'Saving...',
    children: 'Save Changes',
  },
};

/**
 * Disabled state prevents interaction.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};

// ============================================================================
// WITH ICONS
// ============================================================================

/**
 * Buttons can have icons on the left side.
 */
export const WithLeftIcon: Story = {
  args: {
    leftIcon: <Plus size={16} />,
    children: 'Add Item',
  },
};

/**
 * Buttons can have icons on the right side.
 */
export const WithRightIcon: Story = {
  args: {
    rightIcon: <ArrowRight size={16} />,
    children: 'Continue',
  },
};

/**
 * Buttons can have icons on both sides.
 */
export const WithBothIcons: Story = {
  args: {
    leftIcon: <Download size={16} />,
    rightIcon: <ChevronDown size={16} />,
    children: 'Download',
  },
};

/**
 * Icon-only buttons should have an aria-label for accessibility.
 */
export const IconOnly: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button variant="ghost" aria-label="Settings">
        <Settings size={20} />
      </Button>
      <Button variant="ghost" aria-label="Delete">
        <Trash size={20} />
      </Button>
      <Button variant="ghost" aria-label="Favorite">
        <Heart size={20} />
      </Button>
    </div>
  ),
};

// ============================================================================
// LAYOUT
// ============================================================================

/**
 * Full width buttons take the entire container width.
 */
export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Full Width Button',
  },
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

// ============================================================================
// ALL VARIANTS
// ============================================================================

/**
 * All button variants displayed together for comparison.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 flex-wrap">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="success">Success</Button>
      </div>
      <div className="flex gap-4 flex-wrap">
        <Button variant="primary" disabled>Primary</Button>
        <Button variant="secondary" disabled>Secondary</Button>
        <Button variant="outline" disabled>Outline</Button>
        <Button variant="ghost" disabled>Ghost</Button>
        <Button variant="destructive" disabled>Destructive</Button>
        <Button variant="success" disabled>Success</Button>
      </div>
    </div>
  ),
};

// ============================================================================
// AS LINK
// ============================================================================

/**
 * Button can be rendered as a link using the `as` prop.
 */
export const AsLink: Story = {
  args: {
    as: 'a',
    href: '#',
    children: 'Link Button',
  },
};
