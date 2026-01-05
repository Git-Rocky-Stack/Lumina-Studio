// Component tests for PDFToolbar
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PDFToolbar from '../../components/PDFSuite/components/PDFToolbar';
import type { PDFTool, ViewMode, FitMode } from '../../components/PDFSuite/types';

describe('PDFToolbar', () => {
  const defaultProps = {
    documentName: 'test.pdf',
    isDocumentLoaded: true,
    isModified: false,
    currentPage: 1,
    totalPages: 10,
    onPageChange: vi.fn(),
    onNextPage: vi.fn(),
    onPreviousPage: vi.fn(),
    canGoNext: true,
    canGoPrevious: false,
    zoom: 1.0,
    onZoomChange: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    canZoomIn: true,
    canZoomOut: true,
    onRotateClockwise: vi.fn(),
    onRotateCounterClockwise: vi.fn(),
    viewMode: 'single' as ViewMode,
    onViewModeChange: vi.fn(),
    fitMode: 'page' as FitMode,
    onFitModeChange: vi.fn(),
    activeTool: 'select' as PDFTool,
    onToolChange: vi.fn(),
    canUndo: false,
    canRedo: false,
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onOpenFile: vi.fn(),
    onSave: vi.fn(),
    onPrint: vi.fn(),
    onSearch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render toolbar with document name', () => {
      render(<PDFToolbar {...defaultProps} />);
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    it('should show modified indicator when document is modified', () => {
      render(<PDFToolbar {...defaultProps} isModified={true} />);
      expect(screen.getByText(/unsaved/i)).toBeInTheDocument();
    });

    it('should disable controls when no document is loaded', () => {
      render(<PDFToolbar {...defaultProps} isDocumentLoaded={false} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it('should display current page and total pages', () => {
      render(<PDFToolbar {...defaultProps} />);
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
      expect(screen.getByText(/of 10/i)).toBeInTheDocument();
    });

    it('should display zoom percentage', () => {
      render(<PDFToolbar {...defaultProps} zoom={1.5} />);
      expect(screen.getByText(/150%/i)).toBeInTheDocument();
    });
  });

  describe('file operations', () => {
    it('should call onOpenFile when open button is clicked', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} />);

      const openButton = screen.getByRole('button', { name: /open/i });
      await user.click(openButton);

      expect(defaultProps.onOpenFile).toHaveBeenCalledTimes(1);
    });

    it('should call onSave when save button is clicked', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
    });

    it('should call onPrint when print button is clicked', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} />);

      const printButton = screen.getByRole('button', { name: /print/i });
      await user.click(printButton);

      expect(defaultProps.onPrint).toHaveBeenCalledTimes(1);
    });
  });

  describe('page navigation', () => {
    it('should call onNextPage when next button is clicked', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      expect(defaultProps.onNextPage).toHaveBeenCalledTimes(1);
    });

    it('should call onPreviousPage when previous button is clicked', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} currentPage={5} canGoPrevious={true} />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      await user.click(previousButton);

      expect(defaultProps.onPreviousPage).toHaveBeenCalledTimes(1);
    });

    it('should disable previous button on first page', () => {
      render(<PDFToolbar {...defaultProps} currentPage={1} canGoPrevious={false} />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      expect(previousButton).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      render(<PDFToolbar {...defaultProps} currentPage={10} canGoNext={false} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    it('should call onPageChange when page input is changed', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} />);

      const pageInput = screen.getByDisplayValue('1');
      await user.clear(pageInput);
      await user.type(pageInput, '5');
      await user.keyboard('{Enter}');

      expect(defaultProps.onPageChange).toHaveBeenCalledWith(5);
    });

    it('should not allow invalid page numbers', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} />);

      const pageInput = screen.getByDisplayValue('1');
      await user.clear(pageInput);
      await user.type(pageInput, '999');
      await user.keyboard('{Enter}');

      expect(defaultProps.onPageChange).not.toHaveBeenCalledWith(999);
    });
  });

  describe('zoom controls', () => {
    it('should call onZoomIn when zoom in button is clicked', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} />);

      const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
      await user.click(zoomInButton);

      expect(defaultProps.onZoomIn).toHaveBeenCalledTimes(1);
    });

    it('should call onZoomOut when zoom out button is clicked', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} />);

      const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });
      await user.click(zoomOutButton);

      expect(defaultProps.onZoomOut).toHaveBeenCalledTimes(1);
    });

    it('should disable zoom in button at maximum zoom', () => {
      render(<PDFToolbar {...defaultProps} zoom={3.0} canZoomIn={false} />);

      const zoomInButton = screen.getByRole('button', { name: /zoom in/i });
      expect(zoomInButton).toBeDisabled();
    });

    it('should disable zoom out button at minimum zoom', () => {
      render(<PDFToolbar {...defaultProps} zoom={0.25} canZoomOut={false} />);

      const zoomOutButton = screen.getByRole('button', { name: /zoom out/i });
      expect(zoomOutButton).toBeDisabled();
    });

    it('should call onZoomChange when zoom dropdown option is selected', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} />);

      const zoomSelect = screen.getByRole('combobox', { name: /zoom/i });
      await user.selectOptions(zoomSelect, '1.5');

      expect(defaultProps.onZoomChange).toHaveBeenCalledWith(1.5);
    });
  });

  describe('rotation controls', () => {
    it('should call onRotateClockwise when clockwise rotation button is clicked', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} />);

      const rotateButton = screen.getByRole('button', { name: /rotate clockwise/i });
      await user.click(rotateButton);

      expect(defaultProps.onRotateClockwise).toHaveBeenCalledTimes(1);
    });

    it('should call onRotateCounterClockwise when counter-clockwise rotation button is clicked', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} />);

      const rotateButton = screen.getByRole('button', { name: /rotate counter/i });
      await user.click(rotateButton);

      expect(defaultProps.onRotateCounterClockwise).toHaveBeenCalledTimes(1);
    });
  });

  describe('tool selection', () => {
    it('should highlight active tool', () => {
      render(<PDFToolbar {...defaultProps} activeTool="highlight" />);

      const highlightButton = screen.getByRole('button', { name: /highlight/i });
      expect(highlightButton).toHaveClass(/active|selected/i);
    });

    it('should call onToolChange when tool is selected', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} />);

      const highlightButton = screen.getByRole('button', { name: /highlight/i });
      await user.click(highlightButton);

      expect(defaultProps.onToolChange).toHaveBeenCalledWith('highlight');
    });

    it('should show all annotation tools', () => {
      render(<PDFToolbar {...defaultProps} />);

      expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /highlight/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /note/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /text/i })).toBeInTheDocument();
    });
  });

  describe('undo/redo', () => {
    it('should call onUndo when undo button is clicked', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} canUndo={true} />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      await user.click(undoButton);

      expect(defaultProps.onUndo).toHaveBeenCalledTimes(1);
    });

    it('should call onRedo when redo button is clicked', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} canRedo={true} />);

      const redoButton = screen.getByRole('button', { name: /redo/i });
      await user.click(redoButton);

      expect(defaultProps.onRedo).toHaveBeenCalledTimes(1);
    });

    it('should disable undo button when canUndo is false', () => {
      render(<PDFToolbar {...defaultProps} canUndo={false} />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).toBeDisabled();
    });

    it('should disable redo button when canRedo is false', () => {
      render(<PDFToolbar {...defaultProps} canRedo={false} />);

      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).toBeDisabled();
    });
  });

  describe('view modes', () => {
    it('should call onViewModeChange when view mode is changed', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} />);

      const viewModeButton = screen.getByRole('button', { name: /continuous/i });
      await user.click(viewModeButton);

      expect(defaultProps.onViewModeChange).toHaveBeenCalledWith('continuous');
    });

    it('should highlight current view mode', () => {
      render(<PDFToolbar {...defaultProps} viewMode="continuous" />);

      const continuousButton = screen.getByRole('button', { name: /continuous/i });
      expect(continuousButton).toHaveClass(/active|selected/i);
    });
  });

  describe('fit modes', () => {
    it('should call onFitModeChange when fit mode is changed', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} />);

      const fitWidthButton = screen.getByRole('button', { name: /fit width/i });
      await user.click(fitWidthButton);

      expect(defaultProps.onFitModeChange).toHaveBeenCalledWith('width');
    });
  });

  describe('keyboard shortcuts', () => {
    it('should show keyboard shortcut hints', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} />);

      const button = screen.getByRole('button', { name: /undo/i });
      await user.hover(button);

      // Tooltip should show keyboard shortcut
      expect(await screen.findByText(/ctrl.*z/i, {}, { timeout: 1000 })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<PDFToolbar {...defaultProps} />);

      expect(screen.getByRole('button', { name: /open file/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save document/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<PDFToolbar {...defaultProps} />);

      await user.tab();
      const firstButton = document.activeElement;
      expect(firstButton?.tagName).toBe('BUTTON');

      await user.keyboard('{Enter}');
      // Should trigger button action
    });

    it('should announce state changes to screen readers', () => {
      const { rerender } = render(<PDFToolbar {...defaultProps} currentPage={1} />);

      rerender(<PDFToolbar {...defaultProps} currentPage={2} />);

      // ARIA live region should announce page change
      expect(screen.getByText(/page 2 of 10/i)).toBeInTheDocument();
    });
  });
});
