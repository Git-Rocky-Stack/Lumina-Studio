import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../src/design-system/components/overlays/Modal/Modal';
import { Dialog, ConfirmationDialog, AlertDialog } from '../src/design-system/components/overlays/Dialog/Dialog';
import { Button } from '../design-system/components/Button';

/**
 * Modal is an overlay dialog component for focused interactions.
 *
 * ## Usage
 *
 * ```tsx
 * import { Modal } from './design-system/components/overlays/Modal';
 *
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Modal Title"
 * >
 *   Content here
 * </Modal>
 * ```
 */
const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An accessible modal dialog with focus trap, keyboard navigation, and smooth animations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls modal visibility',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', 'full'],
      description: 'Modal width',
    },
    closeOnBackdrop: {
      control: 'boolean',
      description: 'Close when clicking outside',
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Close on Escape key',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Show close button in header',
    },
    glassmorphism: {
      control: 'boolean',
      description: 'Enable glass effect',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component for interactive stories
function ModalDemo({
  children,
  buttonText = 'Open Modal',
  ...props
}: {
  children?: React.ReactNode;
  buttonText?: string;
} & Partial<React.ComponentProps<typeof Modal>>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>{buttonText}</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        {...props}
      >
        {children || (
          <p className="text-zinc-600 dark:text-zinc-400">
            This is the modal content. You can put any content here.
          </p>
        )}
      </Modal>
    </>
  );
}

// ============================================================================
// BASIC EXAMPLES
// ============================================================================

/**
 * Basic modal with title and content.
 */
export const Basic: Story = {
  render: () => (
    <ModalDemo
      title="Basic Modal"
      description="This is a basic modal example"
    >
      <p className="text-zinc-600 dark:text-zinc-400">
        Modal content goes here. This modal can be closed by clicking
        the X button, clicking outside, or pressing Escape.
      </p>
    </ModalDemo>
  ),
};

/**
 * Modal with footer actions.
 */
export const WithFooter: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal with Footer</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Save Changes"
          description="Your changes will be saved permanently"
          footer={
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setIsOpen(false)}>
                Save
              </Button>
            </div>
          }
        >
          <p className="text-zinc-600 dark:text-zinc-400">
            Are you sure you want to save these changes?
          </p>
        </Modal>
      </>
    );
  },
};

// ============================================================================
// SIZES
// ============================================================================

/**
 * Extra small modal (320px).
 */
export const ExtraSmall: Story = {
  render: () => (
    <ModalDemo title="Extra Small Modal" size="xs">
      <p className="text-zinc-600 dark:text-zinc-400">
        This is an extra small modal, perfect for quick confirmations.
      </p>
    </ModalDemo>
  ),
};

/**
 * Small modal (400px).
 */
export const Small: Story = {
  render: () => (
    <ModalDemo title="Small Modal" size="sm">
      <p className="text-zinc-600 dark:text-zinc-400">
        This is a small modal, good for simple forms.
      </p>
    </ModalDemo>
  ),
};

/**
 * Medium modal (500px) - default.
 */
export const Medium: Story = {
  render: () => (
    <ModalDemo title="Medium Modal" size="md">
      <p className="text-zinc-600 dark:text-zinc-400">
        This is the default medium size modal, suitable for most content.
      </p>
    </ModalDemo>
  ),
};

/**
 * Large modal (640px).
 */
export const Large: Story = {
  render: () => (
    <ModalDemo title="Large Modal" size="lg">
      <p className="text-zinc-600 dark:text-zinc-400">
        This is a large modal, good for complex forms or detailed content.
      </p>
    </ModalDemo>
  ),
};

/**
 * Extra large modal (800px).
 */
export const ExtraLarge: Story = {
  render: () => (
    <ModalDemo title="Extra Large Modal" size="xl">
      <p className="text-zinc-600 dark:text-zinc-400">
        This is an extra large modal, perfect for dashboards or tables.
      </p>
    </ModalDemo>
  ),
};

/**
 * Full screen modal.
 */
export const FullScreen: Story = {
  render: () => (
    <ModalDemo title="Full Screen Modal" size="full">
      <div className="min-h-[300px]">
        <p className="text-zinc-600 dark:text-zinc-400">
          This modal takes up the full viewport. Useful for immersive experiences.
        </p>
      </div>
    </ModalDemo>
  ),
};

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * Glassmorphism effect modal.
 */
export const Glassmorphism: Story = {
  render: () => (
    <ModalDemo title="Glass Modal" glassmorphism>
      <p className="text-zinc-600 dark:text-zinc-400">
        This modal has a frosted glass effect background.
      </p>
    </ModalDemo>
  ),
};

/**
 * Modal with custom header.
 */
export const CustomHeader: Story = {
  render: () => (
    <ModalDemo
      header={
        <div className="flex items-center gap-3 p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="font-semibold text-zinc-900 dark:text-white">
              Custom Header
            </h2>
            <p className="text-sm text-zinc-500">With custom styling</p>
          </div>
        </div>
      }
    >
      <p className="text-zinc-600 dark:text-zinc-400">
        This modal has a completely custom header.
      </p>
    </ModalDemo>
  ),
};

// ============================================================================
// DIALOG VARIANTS
// ============================================================================

/**
 * Confirmation dialog for user decisions.
 */
export const Confirmation: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="destructive" onClick={() => setIsOpen(true)}>
          Delete Item
        </Button>
        <ConfirmationDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Delete Item"
          onConfirm={() => {
            console.log('Deleted!');
            setIsOpen(false);
          }}
          destructive
        >
          Are you sure you want to delete this item? This action cannot be undone.
        </ConfirmationDialog>
      </>
    );
  },
};

/**
 * Alert dialog for notifications.
 */
export const Alert: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Show Alert</Button>
        <AlertDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Success!"
          variant="success"
        >
          Your changes have been saved successfully.
        </AlertDialog>
      </>
    );
  },
};

/**
 * Warning dialog.
 */
export const Warning: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="secondary" onClick={() => setIsOpen(true)}>
          Show Warning
        </Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Warning"
          variant="warning"
          primaryAction={{
            label: 'I Understand',
            onClick: () => setIsOpen(false),
          }}
        >
          Please review your changes before proceeding.
        </Dialog>
      </>
    );
  },
};

/**
 * Error dialog.
 */
export const Error: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button variant="destructive" onClick={() => setIsOpen(true)}>
          Show Error
        </Button>
        <Dialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Error"
          variant="error"
          primaryAction={{
            label: 'Try Again',
            onClick: () => setIsOpen(false),
          }}
          secondaryAction={{
            label: 'Cancel',
            onClick: () => setIsOpen(false),
          }}
        >
          Something went wrong. Please try again later.
        </Dialog>
      </>
    );
  },
};

// ============================================================================
// BEHAVIOR
// ============================================================================

/**
 * Modal that doesn't close on backdrop click.
 */
export const NoBackdropClose: Story = {
  render: () => (
    <ModalDemo
      title="Persistent Modal"
      closeOnBackdrop={false}
    >
      <p className="text-zinc-600 dark:text-zinc-400">
        This modal won't close when you click outside. You must use the close
        button or press Escape.
      </p>
    </ModalDemo>
  ),
};

/**
 * Modal without close button.
 */
export const NoCloseButton: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="No Close Button"
          showCloseButton={false}
          footer={
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          }
        >
          <p className="text-zinc-600 dark:text-zinc-400">
            This modal has no X button. Close it using the button below.
          </p>
        </Modal>
      </>
    );
  },
};
