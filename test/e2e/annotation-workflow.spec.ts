// E2E tests for annotation workflow using Playwright
import { test, expect, type Page } from '@playwright/test';
import path from 'path';

test.describe('PDF Annotation Workflow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:5173/pdf-suite');

    // Wait for app to load
    await page.waitForSelector('[data-testid="pdf-suite"]', { timeout: 10000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Document Loading', () => {
    test('should load PDF document successfully', async () => {
      // Click open file button
      await page.click('[data-testid="open-file-button"]');

      // Upload PDF file
      const fileInput = await page.locator('input[type="file"]');
      const testPdfPath = path.join(__dirname, '../fixtures/pdfs/test-document.pdf');
      await fileInput.setInputFiles(testPdfPath);

      // Wait for document to load
      await page.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 15000 });

      // Verify document is loaded
      const documentName = await page.textContent('[data-testid="document-name"]');
      expect(documentName).toContain('test-document.pdf');

      // Verify page count is displayed
      const pageInfo = await page.textContent('[data-testid="page-info"]');
      expect(pageInfo).toMatch(/Page 1 of \d+/);
    });

    test('should show error for invalid file', async () => {
      await page.click('[data-testid="open-file-button"]');

      const fileInput = await page.locator('input[type="file"]');
      const invalidPath = path.join(__dirname, '../fixtures/invalid.txt');
      await fileInput.setInputFiles(invalidPath);

      // Wait for error message
      const errorMessage = await page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      await expect(errorMessage).toContainText(/invalid|failed/i);
    });

    test('should show loading progress', async () => {
      await page.click('[data-testid="open-file-button"]');

      const fileInput = await page.locator('input[type="file"]');
      const largePdfPath = path.join(__dirname, '../fixtures/pdfs/large-document.pdf');
      await fileInput.setInputFiles(largePdfPath);

      // Verify loading indicator appears
      const loadingIndicator = await page.locator('[data-testid="loading-progress"]');
      await expect(loadingIndicator).toBeVisible({ timeout: 2000 });

      // Wait for loading to complete
      await page.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 30000 });
    });
  });

  test.describe('Creating Annotations', () => {
    test.beforeEach(async () => {
      // Load test document before each annotation test
      await page.click('[data-testid="open-file-button"]');
      const fileInput = await page.locator('input[type="file"]');
      const testPdfPath = path.join(__dirname, '../fixtures/pdfs/test-document.pdf');
      await fileInput.setInputFiles(testPdfPath);
      await page.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 15000 });
    });

    test('should create highlight annotation', async () => {
      // Select highlight tool
      await page.click('[data-testid="tool-highlight"]');

      // Verify tool is selected
      const highlightTool = await page.locator('[data-testid="tool-highlight"]');
      await expect(highlightTool).toHaveClass(/active|selected/);

      // Click on PDF page to create highlight
      const pdfCanvas = await page.locator('[data-testid="pdf-canvas-page-1"]');
      await pdfCanvas.click({ position: { x: 200, y: 300 } });

      // Verify annotation was created
      const annotation = await page.locator('[data-testid^="annotation-highlight-"]').first();
      await expect(annotation).toBeVisible({ timeout: 2000 });

      // Verify annotation count updated
      const annotationCount = await page.textContent('[data-testid="annotation-count"]');
      expect(annotationCount).toContain('1');
    });

    test('should create note annotation with text', async () => {
      // Select note tool
      await page.click('[data-testid="tool-note"]');

      // Click to place note
      const pdfCanvas = await page.locator('[data-testid="pdf-canvas-page-1"]');
      await pdfCanvas.click({ position: { x: 150, y: 200 } });

      // Wait for note to appear
      const noteAnnotation = await page.locator('[data-testid^="annotation-note-"]').first();
      await expect(noteAnnotation).toBeVisible();

      // Double-click to edit
      await noteAnnotation.dblclick();

      // Type note content
      const noteInput = await page.locator('[data-testid="note-content-input"]');
      await noteInput.fill('This is a test note annotation');

      // Click outside to save
      await page.click('[data-testid="pdf-viewer"]');

      // Verify note content is saved
      await noteAnnotation.hover();
      const noteTooltip = await page.locator('[data-testid="note-tooltip"]');
      await expect(noteTooltip).toContainText('This is a test note annotation');
    });

    test('should create rectangle annotation via drag', async () => {
      // Select rectangle tool
      await page.click('[data-testid="tool-rectangle"]');

      // Drag to create rectangle
      const pdfCanvas = await page.locator('[data-testid="pdf-canvas-page-1"]');
      await pdfCanvas.hover({ position: { x: 100, y: 100 } });
      await page.mouse.down();
      await pdfCanvas.hover({ position: { x: 300, y: 250 } });
      await page.mouse.up();

      // Verify rectangle was created
      const rectangle = await page.locator('[data-testid^="annotation-rectangle-"]').first();
      await expect(rectangle).toBeVisible();

      // Verify rectangle dimensions are reasonable
      const bbox = await rectangle.boundingBox();
      expect(bbox?.width).toBeGreaterThan(100);
      expect(bbox?.height).toBeGreaterThan(50);
    });

    test('should create free text annotation', async () => {
      // Select free text tool
      await page.click('[data-testid="tool-freetext"]');

      // Click to create text box
      const pdfCanvas = await page.locator('[data-testid="pdf-canvas-page-1"]');
      await pdfCanvas.click({ position: { x: 200, y: 400 } });

      // Enter text
      const textInput = await page.locator('[data-testid="freetext-input"]');
      await expect(textInput).toBeFocused();
      await textInput.fill('Test free text annotation');

      // Click outside to finish
      await page.keyboard.press('Escape');

      // Verify text annotation is created
      const freeText = await page.locator('[data-testid^="annotation-freetext-"]').first();
      await expect(freeText).toContainText('Test free text annotation');
    });
  });

  test.describe('Editing Annotations', () => {
    test.beforeEach(async () => {
      // Load document and create test annotation
      await page.click('[data-testid="open-file-button"]');
      const fileInput = await page.locator('input[type="file"]');
      const testPdfPath = path.join(__dirname, '../fixtures/pdfs/test-document.pdf');
      await fileInput.setInputFiles(testPdfPath);
      await page.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 15000 });

      // Create a test annotation
      await page.click('[data-testid="tool-highlight"]');
      const pdfCanvas = await page.locator('[data-testid="pdf-canvas-page-1"]');
      await pdfCanvas.click({ position: { x: 200, y: 300 } });
      await page.waitForSelector('[data-testid^="annotation-highlight-"]');
    });

    test('should select annotation on click', async () => {
      const annotation = await page.locator('[data-testid^="annotation-highlight-"]').first();
      await annotation.click();

      // Verify annotation is selected
      await expect(annotation).toHaveClass(/selected/);

      // Verify properties panel shows annotation details
      const propertiesPanel = await page.locator('[data-testid="annotation-properties"]');
      await expect(propertiesPanel).toBeVisible();
    });

    test('should change annotation color', async () => {
      const annotation = await page.locator('[data-testid^="annotation-highlight-"]').first();
      await annotation.click();

      // Open color picker
      await page.click('[data-testid="color-picker-button"]');

      // Select red color
      await page.click('[data-testid="color-option-red"]');

      // Verify annotation color changed
      const computedStyle = await annotation.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(computedStyle).toContain('rgb(244, 67, 54)'); // Red color
    });

    test('should change annotation opacity', async () => {
      const annotation = await page.locator('[data-testid^="annotation-highlight-"]').first();
      await annotation.click();

      // Adjust opacity slider
      const opacitySlider = await page.locator('[data-testid="opacity-slider"]');
      await opacitySlider.fill('50');

      // Verify opacity changed
      const opacity = await annotation.evaluate((el) => window.getComputedStyle(el).opacity);
      expect(parseFloat(opacity)).toBeCloseTo(0.5, 1);
    });

    test('should move annotation via drag', async () => {
      const annotation = await page.locator('[data-testid^="annotation-highlight-"]').first();

      // Get initial position
      const initialBox = await annotation.boundingBox();
      const initialX = initialBox?.x || 0;
      const initialY = initialBox?.y || 0;

      // Drag annotation
      await annotation.hover();
      await page.mouse.down();
      await page.mouse.move(initialX + 100, initialY + 50);
      await page.mouse.up();

      // Get new position
      const newBox = await annotation.boundingBox();
      const newX = newBox?.x || 0;
      const newY = newBox?.y || 0;

      // Verify position changed
      expect(Math.abs(newX - initialX - 100)).toBeLessThan(10);
      expect(Math.abs(newY - initialY - 50)).toBeLessThan(10);
    });

    test('should resize annotation', async () => {
      const annotation = await page.locator('[data-testid^="annotation-rectangle-"]').first();
      await annotation.click();

      // Get resize handle
      const resizeHandle = await page.locator('[data-testid="resize-handle-se"]');
      await expect(resizeHandle).toBeVisible();

      // Drag resize handle
      await resizeHandle.hover();
      await page.mouse.down();
      await page.mouse.move(350, 300);
      await page.mouse.up();

      // Verify size changed
      const newBox = await annotation.boundingBox();
      expect(newBox?.width).toBeGreaterThan(200);
      expect(newBox?.height).toBeGreaterThan(150);
    });

    test('should delete annotation', async () => {
      const annotation = await page.locator('[data-testid^="annotation-highlight-"]').first();
      await annotation.click();

      // Click delete button
      await page.click('[data-testid="delete-annotation-button"]');

      // Confirm deletion
      await page.click('[data-testid="confirm-delete"]');

      // Verify annotation is removed
      await expect(annotation).not.toBeVisible();

      // Verify annotation count decreased
      const annotationCount = await page.textContent('[data-testid="annotation-count"]');
      expect(annotationCount).toContain('0');
    });
  });

  test.describe('Annotation Layers', () => {
    test.beforeEach(async () => {
      await page.click('[data-testid="open-file-button"]');
      const fileInput = await page.locator('input[type="file"]');
      const testPdfPath = path.join(__dirname, '../fixtures/pdfs/test-document.pdf');
      await fileInput.setInputFiles(testPdfPath);
      await page.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 15000 });
    });

    test('should create new layer', async () => {
      // Open layers panel
      await page.click('[data-testid="layers-panel-button"]');

      // Click add layer button
      await page.click('[data-testid="add-layer-button"]');

      // Enter layer name
      const layerNameInput = await page.locator('[data-testid="layer-name-input"]');
      await layerNameInput.fill('Review Notes');
      await page.keyboard.press('Enter');

      // Verify layer was created
      const newLayer = await page.locator('[data-testid^="layer-"]', { hasText: 'Review Notes' });
      await expect(newLayer).toBeVisible();
    });

    test('should toggle layer visibility', async () => {
      await page.click('[data-testid="layers-panel-button"]');

      // Create annotation on default layer
      await page.click('[data-testid="tool-highlight"]');
      const pdfCanvas = await page.locator('[data-testid="pdf-canvas-page-1"]');
      await pdfCanvas.click({ position: { x: 200, y: 300 } });

      const annotation = await page.locator('[data-testid^="annotation-highlight-"]').first();
      await expect(annotation).toBeVisible();

      // Toggle layer visibility off
      await page.click('[data-testid="layer-visibility-toggle"]');

      // Verify annotation is hidden
      await expect(annotation).not.toBeVisible();

      // Toggle back on
      await page.click('[data-testid="layer-visibility-toggle"]');
      await expect(annotation).toBeVisible();
    });

    test('should lock layer', async () => {
      await page.click('[data-testid="layers-panel-button"]');

      // Create annotation
      await page.click('[data-testid="tool-highlight"]');
      const pdfCanvas = await page.locator('[data-testid="pdf-canvas-page-1"]');
      await pdfCanvas.click({ position: { x: 200, y: 300 } });

      const annotation = await page.locator('[data-testid^="annotation-highlight-"]').first();

      // Lock layer
      await page.click('[data-testid="layer-lock-toggle"]');

      // Try to select annotation (should fail)
      await annotation.click();
      await expect(annotation).not.toHaveClass(/selected/);

      // Try to delete (should be disabled)
      const deleteButton = await page.locator('[data-testid="delete-annotation-button"]');
      await expect(deleteButton).toBeDisabled();
    });
  });

  test.describe('Saving and Loading', () => {
    test('should save annotations to document', async () => {
      // Load document
      await page.click('[data-testid="open-file-button"]');
      const fileInput = await page.locator('input[type="file"]');
      const testPdfPath = path.join(__dirname, '../fixtures/pdfs/test-document.pdf');
      await fileInput.setInputFiles(testPdfPath);
      await page.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 15000 });

      // Create multiple annotations
      await page.click('[data-testid="tool-highlight"]');
      const pdfCanvas = await page.locator('[data-testid="pdf-canvas-page-1"]');
      await pdfCanvas.click({ position: { x: 100, y: 200 } });
      await pdfCanvas.click({ position: { x: 200, y: 300 } });
      await pdfCanvas.click({ position: { x: 300, y: 400 } });

      // Save document
      await page.click('[data-testid="save-button"]');

      // Wait for save confirmation
      const saveMessage = await page.locator('[data-testid="save-notification"]');
      await expect(saveMessage).toBeVisible();
      await expect(saveMessage).toContainText(/saved|success/i);
    });

    test('should show unsaved changes indicator', async () => {
      await page.click('[data-testid="open-file-button"]');
      const fileInput = await page.locator('input[type="file"]');
      const testPdfPath = path.join(__dirname, '../fixtures/pdfs/test-document.pdf');
      await fileInput.setInputFiles(testPdfPath);
      await page.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 15000 });

      // Create annotation
      await page.click('[data-testid="tool-highlight"]');
      const pdfCanvas = await page.locator('[data-testid="pdf-canvas-page-1"]');
      await pdfCanvas.click({ position: { x: 200, y: 300 } });

      // Verify unsaved indicator appears
      const unsavedIndicator = await page.locator('[data-testid="unsaved-indicator"]');
      await expect(unsavedIndicator).toBeVisible();

      // Save and verify indicator disappears
      await page.click('[data-testid="save-button"]');
      await expect(unsavedIndicator).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test.beforeEach(async () => {
      await page.click('[data-testid="open-file-button"]');
      const fileInput = await page.locator('input[type="file"]');
      const testPdfPath = path.join(__dirname, '../fixtures/pdfs/test-document.pdf');
      await fileInput.setInputFiles(testPdfPath);
      await page.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 15000 });
    });

    test('should activate tool with keyboard shortcut', async () => {
      // Press 'H' to activate highlight tool
      await page.keyboard.press('h');

      const highlightTool = await page.locator('[data-testid="tool-highlight"]');
      await expect(highlightTool).toHaveClass(/active|selected/);
    });

    test('should save with Ctrl+S', async () => {
      // Create annotation
      await page.click('[data-testid="tool-highlight"]');
      const pdfCanvas = await page.locator('[data-testid="pdf-canvas-page-1"]');
      await pdfCanvas.click({ position: { x: 200, y: 300 } });

      // Press Ctrl+S
      await page.keyboard.press('Control+s');

      // Verify save was triggered
      const saveNotification = await page.locator('[data-testid="save-notification"]');
      await expect(saveNotification).toBeVisible({ timeout: 3000 });
    });

    test('should delete selected annotation with Delete key', async () => {
      await page.click('[data-testid="tool-highlight"]');
      const pdfCanvas = await page.locator('[data-testid="pdf-canvas-page-1"]');
      await pdfCanvas.click({ position: { x: 200, y: 300 } });

      const annotation = await page.locator('[data-testid^="annotation-highlight-"]').first();
      await annotation.click();

      // Press Delete key
      await page.keyboard.press('Delete');

      // Verify annotation is deleted
      await expect(annotation).not.toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async () => {
      await page.click('[data-testid="open-file-button"]');
      const fileInput = await page.locator('input[type="file"]');
      const testPdfPath = path.join(__dirname, '../fixtures/pdfs/test-document.pdf');
      await fileInput.setInputFiles(testPdfPath);
      await page.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 15000 });

      // Tab through toolbar
      await page.keyboard.press('Tab');
      let focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focused).toBeTruthy();

      // Continue tabbing
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Verify focus is moving through controls
      focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focused).toBeTruthy();
    });

    test('should have proper ARIA labels', async () => {
      await page.click('[data-testid="open-file-button"]');
      const fileInput = await page.locator('input[type="file"]');
      const testPdfPath = path.join(__dirname, '../fixtures/pdfs/test-document.pdf');
      await fileInput.setInputFiles(testPdfPath);
      await page.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 15000 });

      // Check toolbar buttons have aria-labels
      const highlightButton = await page.locator('[data-testid="tool-highlight"]');
      const ariaLabel = await highlightButton.getAttribute('aria-label');
      expect(ariaLabel).toContain('highlight');
    });

    test('should announce changes to screen readers', async () => {
      await page.click('[data-testid="open-file-button"]');
      const fileInput = await page.locator('input[type="file"]');
      const testPdfPath = path.join(__dirname, '../fixtures/pdfs/test-document.pdf');
      await fileInput.setInputFiles(testPdfPath);
      await page.waitForSelector('[data-testid="pdf-viewer"]', { timeout: 15000 });

      // Create annotation
      await page.click('[data-testid="tool-highlight"]');
      const pdfCanvas = await page.locator('[data-testid="pdf-canvas-page-1"]');
      await pdfCanvas.click({ position: { x: 200, y: 300 } });

      // Check for ARIA live region announcement
      const liveRegion = await page.locator('[aria-live="polite"]');
      await expect(liveRegion).toContainText(/annotation|added|created/i);
    });
  });
});
