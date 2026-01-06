import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { MoreVertical, Edit, Trash, Share } from 'lucide-react';
import { Card, CardHeader, CardBody, CardFooter } from '../design-system/components/Card';
import { Button } from '../design-system/components/Button';

/**
 * Card is a container component for displaying content and actions.
 *
 * ## Usage
 *
 * ```tsx
 * import { Card, CardHeader, CardBody, CardFooter } from './design-system/components/Card';
 *
 * <Card variant="elevated">
 *   <CardHeader title="Title" />
 *   <CardBody>Content</CardBody>
 *   <CardFooter>Actions</CardFooter>
 * </Card>
 * ```
 */
const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile container component for grouping related content and actions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined', 'ghost', 'interactive'],
      description: 'Visual style variant',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Internal padding',
    },
    radius: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl', 'full'],
      description: 'Border radius',
    },
    shadow: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Shadow depth',
    },
    hoverEffect: {
      control: 'boolean',
      description: 'Enable hover lift effect',
    },
    pressable: {
      control: 'boolean',
      description: 'Enable press animation',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// BASIC VARIANTS
// ============================================================================

/**
 * Default card with basic styling.
 */
export const Default: Story = {
  args: {
    variant: 'default',
    children: (
      <CardBody>
        <p className="text-zinc-600 dark:text-zinc-400">
          This is a default card with basic styling.
        </p>
      </CardBody>
    ),
  },
};

/**
 * Elevated card with shadow for emphasis.
 */
export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <CardBody>
        <p className="text-zinc-600 dark:text-zinc-400">
          This card has elevation to stand out from the background.
        </p>
      </CardBody>
    ),
  },
};

/**
 * Outlined card with border.
 */
export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: (
      <CardBody>
        <p className="text-zinc-600 dark:text-zinc-400">
          This card has a visible border outline.
        </p>
      </CardBody>
    ),
  },
};

/**
 * Ghost card with minimal styling.
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: (
      <CardBody>
        <p className="text-zinc-600 dark:text-zinc-400">
          This card has minimal styling, almost invisible.
        </p>
      </CardBody>
    ),
  },
};

/**
 * Interactive card for clickable items.
 */
export const Interactive: Story = {
  args: {
    variant: 'interactive',
    onClick: fn(),
    children: (
      <CardBody>
        <p className="text-zinc-600 dark:text-zinc-400">
          Click me! This card responds to interactions.
        </p>
      </CardBody>
    ),
  },
};

// ============================================================================
// WITH SECTIONS
// ============================================================================

/**
 * Card with header, body, and footer sections.
 */
export const WithSections: Story = {
  args: {
    variant: 'elevated',
    padding: 'none',
    children: (
      <>
        <CardHeader
          title="Project Overview"
          subtitle="Last updated 2 hours ago"
          bordered
        />
        <CardBody>
          <p className="text-zinc-600 dark:text-zinc-400">
            This card demonstrates the full structure with header,
            body, and footer sections.
          </p>
        </CardBody>
        <CardFooter bordered>
          <Button variant="ghost" size="sm">Cancel</Button>
          <Button variant="primary" size="sm">Save</Button>
        </CardFooter>
      </>
    ),
  },
};

/**
 * Card header with action button.
 */
export const HeaderWithAction: Story = {
  args: {
    variant: 'elevated',
    padding: 'none',
    children: (
      <>
        <CardHeader
          title="Team Settings"
          subtitle="Manage your team preferences"
          action={
            <Button variant="ghost" size="sm" aria-label="More options">
              <MoreVertical size={16} />
            </Button>
          }
          bordered
        />
        <CardBody>
          <p className="text-zinc-600 dark:text-zinc-400">
            Configure team settings and permissions here.
          </p>
        </CardBody>
      </>
    ),
  },
};

// ============================================================================
// PADDING OPTIONS
// ============================================================================

/**
 * Cards with different padding sizes.
 */
export const PaddingSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Card padding="sm" variant="outlined">
        <CardBody>Small padding</CardBody>
      </Card>
      <Card padding="md" variant="outlined">
        <CardBody>Medium padding (default)</CardBody>
      </Card>
      <Card padding="lg" variant="outlined">
        <CardBody>Large padding</CardBody>
      </Card>
      <Card padding="xl" variant="outlined">
        <CardBody>Extra large padding</CardBody>
      </Card>
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

// ============================================================================
// HOVER EFFECTS
// ============================================================================

/**
 * Card with hover lift effect.
 */
export const WithHoverEffect: Story = {
  args: {
    variant: 'elevated',
    hoverEffect: true,
    children: (
      <CardBody>
        <p className="text-zinc-600 dark:text-zinc-400">
          Hover over me to see the lift effect.
        </p>
      </CardBody>
    ),
  },
};

/**
 * Pressable card with click animation.
 */
export const Pressable: Story = {
  args: {
    variant: 'elevated',
    pressable: true,
    onClick: fn(),
    children: (
      <CardBody>
        <p className="text-zinc-600 dark:text-zinc-400">
          Click me to see the press animation.
        </p>
      </CardBody>
    ),
  },
};

// ============================================================================
// COMPLEX EXAMPLE
// ============================================================================

/**
 * Complex card example with all features.
 */
export const ComplexExample: Story = {
  args: {
    variant: 'elevated',
    padding: 'none',
    hoverEffect: true,
    children: (
      <>
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=200&fit=crop"
            alt="Abstract art"
            className="w-full h-40 object-cover rounded-t-lg"
          />
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 bg-indigo-500 text-white text-xs font-medium rounded-full">
              Featured
            </span>
          </div>
        </div>
        <CardHeader
          title="Design System Components"
          subtitle="A collection of reusable UI components"
        />
        <CardBody>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Build beautiful interfaces faster with our comprehensive
            design system. Includes buttons, cards, forms, and more.
          </p>
          <div className="flex gap-2 mt-4">
            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs rounded">
              React
            </span>
            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs rounded">
              TypeScript
            </span>
            <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs rounded">
              Tailwind
            </span>
          </div>
        </CardBody>
        <CardFooter bordered justify="between">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <Share size={14} />
            </Button>
            <Button variant="ghost" size="sm">
              <Edit size={14} />
            </Button>
          </div>
          <Button variant="primary" size="sm">
            View Details
          </Button>
        </CardFooter>
      </>
    ),
  },
};

// ============================================================================
// CARD GRID
// ============================================================================

/**
 * Cards arranged in a grid layout.
 */
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} variant="elevated" hoverEffect>
          <CardBody>
            <h3 className="font-semibold mb-2">Card {i}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Card content here.
            </p>
          </CardBody>
        </Card>
      ))}
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};
