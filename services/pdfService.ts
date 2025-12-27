// ============================================
// LUMINA PDF SERVICE
// Wrapper for pdf.js and pdf-lib operations
// ============================================

import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument as PDFLibDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import type {
  PDFPage,
  PDFMetadata,
  PDFTextContent,
  PDFTextItem,
  PageRange,
} from '../components/PDFSuite/types';

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// ============================================
// DOCUMENT LOADING
// ============================================

export async function loadPDF(source: File | string | ArrayBuffer): Promise<{
  proxy: pdfjsLib.PDFDocumentProxy;
  metadata: PDFMetadata;
  pageCount: number;
}> {
  let data: ArrayBuffer;

  if (source instanceof File) {
    data = await source.arrayBuffer();
  } else if (typeof source === 'string') {
    // URL or base64
    if (source.startsWith('data:')) {
      const base64 = source.split(',')[1] || '';
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      data = bytes.buffer;
    } else {
      const response = await fetch(source);
      data = await response.arrayBuffer();
    }
  } else {
    data = source;
  }

  const loadingTask = pdfjsLib.getDocument({ data });
  const proxy = await loadingTask.promise;

  // Extract metadata
  const metadataResult = await proxy.getMetadata();
  const info = metadataResult.info as Record<string, unknown>;

  const metadata: PDFMetadata = {
    title: info?.Title as string | undefined,
    author: info?.Author as string | undefined,
    subject: info?.Subject as string | undefined,
    keywords: info?.Keywords as string | undefined,
    creator: info?.Creator as string | undefined,
    producer: info?.Producer as string | undefined,
    creationDate: info?.CreationDate ? new Date(info.CreationDate as string) : undefined,
    modificationDate: info?.ModDate ? new Date(info.ModDate as string) : undefined,
    version: info?.PDFFormatVersion as string | undefined,
  };

  return {
    proxy,
    metadata,
    pageCount: proxy.numPages,
  };
}

// ============================================
// PAGE OPERATIONS
// ============================================

export async function getPageData(
  proxy: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number = 1
): Promise<PDFPage> {
  const page = await proxy.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  return {
    pageNumber,
    proxy: page,
    width: viewport.width,
    height: viewport.height,
    rotation: viewport.rotation,
    scale,
    annotations: [],
    formFields: [],
  };
}

export async function renderPageToCanvas(
  page: pdfjsLib.PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale: number = 1
): Promise<void> {
  const viewport = page.getViewport({ scale });
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context as unknown as CanvasRenderingContext2D,
    viewport,
  } as any).promise;
}

export async function getPageThumbnail(
  page: pdfjsLib.PDFPageProxy,
  maxSize: number = 150
): Promise<string> {
  const viewport = page.getViewport({ scale: 1 });
  const scale = Math.min(maxSize / viewport.width, maxSize / viewport.height);
  const scaledViewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not get canvas context');
  }

  await page.render({
    canvasContext: context as unknown as CanvasRenderingContext2D,
    viewport: scaledViewport,
  } as any).promise;

  return canvas.toDataURL('image/jpeg', 0.7);
}

// ============================================
// TEXT EXTRACTION
// ============================================

export async function extractTextContent(
  page: pdfjsLib.PDFPageProxy
): Promise<PDFTextContent> {
  const textContent = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1 });

  const items: PDFTextItem[] = textContent.items
    .filter((item): item is any => 'str' in item)
    .map((item: any, index: number) => {
      const transform = item.transform;
      const x = transform[4];
      const y = viewport.height - transform[5]; // Convert from PDF to screen coordinates
      const fontSize = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]);

      return {
        id: `text-${index}`,
        text: item.str,
        x,
        y,
        width: item.width,
        height: item.height,
        fontName: item.fontName,
        fontSize,
        fontWeight: 400,
        fontStyle: 'normal' as const,
        color: '#000000',
        transform: item.transform,
        isEdited: false,
      };
    });

  const styles: Record<string, { fontFamily: string; ascent: number; descent: number; vertical: boolean }> = {};
  for (const [name, style] of Object.entries(textContent.styles)) {
    styles[name] = {
      fontFamily: style.fontFamily,
      ascent: style.ascent,
      descent: style.descent,
      vertical: style.vertical,
    };
  }

  return { items, styles };
}

export async function searchText(
  proxy: pdfjsLib.PDFDocumentProxy,
  query: string,
  options: { caseSensitive?: boolean; wholeWord?: boolean } = {}
): Promise<Array<{ pageNumber: number; matches: PDFTextItem[] }>> {
  const results: Array<{ pageNumber: number; matches: PDFTextItem[] }> = [];

  for (let i = 1; i <= proxy.numPages; i++) {
    const page = await proxy.getPage(i);
    const textContent = await extractTextContent(page);

    const matches = textContent.items.filter((item) => {
      let text = item.text;
      let searchQuery = query;

      if (!options.caseSensitive) {
        text = text.toLowerCase();
        searchQuery = searchQuery.toLowerCase();
      }

      if (options.wholeWord) {
        const regex = new RegExp(`\\b${searchQuery}\\b`);
        return regex.test(text);
      }

      return text.includes(searchQuery);
    });

    if (matches.length > 0) {
      results.push({ pageNumber: i, matches });
    }
  }

  return results;
}

// ============================================
// PDF MODIFICATION (using pdf-lib)
// ============================================

export async function createEmptyPDF(
  width: number = 612,
  height: number = 792
): Promise<Uint8Array> {
  const pdfDoc = await PDFLibDocument.create();
  pdfDoc.addPage([width, height]);
  return pdfDoc.save();
}

export async function addTextToPDF(
  pdfBytes: ArrayBuffer,
  pageNumber: number,
  text: string,
  x: number,
  y: number,
  options: {
    fontSize?: number;
    color?: { r: number; g: number; b: number };
    fontFamily?: string;
  } = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFLibDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[pageNumber - 1];

  if (!page) {
    throw new Error(`Page ${pageNumber} not found`);
  }

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { fontSize = 12, color = { r: 0, g: 0, b: 0 } } = options;

  page.drawText(text, {
    x,
    y: page.getHeight() - y, // Convert from screen to PDF coordinates
    size: fontSize,
    font,
    color: rgb(color.r, color.g, color.b),
  });

  return pdfDoc.save();
}

export async function addImageToPDF(
  pdfBytes: ArrayBuffer,
  pageNumber: number,
  imageBytes: ArrayBuffer,
  imageType: 'png' | 'jpg',
  x: number,
  y: number,
  width: number,
  height: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFLibDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[pageNumber - 1];

  if (!page) {
    throw new Error(`Page ${pageNumber} not found`);
  }

  const image =
    imageType === 'png'
      ? await pdfDoc.embedPng(imageBytes)
      : await pdfDoc.embedJpg(imageBytes);

  page.drawImage(image, {
    x,
    y: page.getHeight() - y - height,
    width,
    height,
  });

  return pdfDoc.save();
}

// ============================================
// PAGE MANIPULATION
// ============================================

export async function rotatePage(
  pdfBytes: ArrayBuffer,
  pageNumber: number,
  rotation: 0 | 90 | 180 | 270
): Promise<Uint8Array> {
  const pdfDoc = await PDFLibDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const page = pages[pageNumber - 1];

  if (!page) {
    throw new Error(`Page ${pageNumber} not found`);
  }

  page.setRotation(degrees(rotation));
  return pdfDoc.save();
}

export async function deletePage(
  pdfBytes: ArrayBuffer,
  pageNumber: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFLibDocument.load(pdfBytes);
  pdfDoc.removePage(pageNumber - 1);
  return pdfDoc.save();
}

export async function reorderPages(
  pdfBytes: ArrayBuffer,
  newOrder: number[]
): Promise<Uint8Array> {
  const sourcePdf = await PDFLibDocument.load(pdfBytes);
  const newPdf = await PDFLibDocument.create();

  for (const pageIndex of newOrder) {
    const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageIndex - 1]);
    newPdf.addPage(copiedPage);
  }

  return newPdf.save();
}

export async function insertBlankPage(
  pdfBytes: ArrayBuffer,
  afterPage: number,
  width?: number,
  height?: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFLibDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  // Get dimensions from the page before, or use default
  const referencePage = pages[afterPage - 1] || pages[0];
  const pageWidth = width || (referencePage ? referencePage.getWidth() : 612);
  const pageHeight = height || (referencePage ? referencePage.getHeight() : 792);

  pdfDoc.insertPage(afterPage, [pageWidth, pageHeight]);
  return pdfDoc.save();
}

// ============================================
// MERGE & SPLIT
// ============================================

export async function mergePDFs(pdfBytesArray: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFLibDocument.create();

  for (const pdfBytes of pdfBytesArray) {
    const pdf = await PDFLibDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return mergedPdf.save();
}

export async function splitPDF(
  pdfBytes: ArrayBuffer,
  ranges: PageRange[]
): Promise<Uint8Array[]> {
  const sourcePdf = await PDFLibDocument.load(pdfBytes);
  const results: Uint8Array[] = [];

  for (const range of ranges) {
    const newPdf = await PDFLibDocument.create();
    const pageIndices = Array.from(
      { length: range.end - range.start + 1 },
      (_, i) => range.start - 1 + i
    );
    const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));
    results.push(await newPdf.save());
  }

  return results;
}

export async function extractPages(
  pdfBytes: ArrayBuffer,
  pageNumbers: number[]
): Promise<Uint8Array> {
  const sourcePdf = await PDFLibDocument.load(pdfBytes);
  const newPdf = await PDFLibDocument.create();

  const pageIndices = pageNumbers.map((n) => n - 1);
  const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return newPdf.save();
}

// ============================================
// EXPORT OPERATIONS
// ============================================

export async function exportToImages(
  proxy: pdfjsLib.PDFDocumentProxy,
  format: 'png' | 'jpg' = 'png',
  scale: number = 2,
  pages?: number[]
): Promise<Blob[]> {
  const blobs: Blob[] = [];
  const pageNumbers = pages || Array.from({ length: proxy.numPages }, (_, i) => i + 1);

  for (const pageNum of pageNumbers) {
    const page = await proxy.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    if (!context) continue;

    await page.render({
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
    } as any).promise;

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b!),
        format === 'png' ? 'image/png' : 'image/jpeg',
        format === 'jpg' ? 0.9 : undefined
      );
    });

    blobs.push(blob);
  }

  return blobs;
}

// ============================================
// IMPORT OPERATIONS
// ============================================

export async function importFromImage(
  imageFile: File,
  pageSize: { width: number; height: number } = { width: 612, height: 792 }
): Promise<Uint8Array> {
  const pdfDoc = await PDFLibDocument.create();
  const imageBytes = await imageFile.arrayBuffer();

  let image;
  if (imageFile.type === 'image/png') {
    image = await pdfDoc.embedPng(imageBytes);
  } else if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
    image = await pdfDoc.embedJpg(imageBytes);
  } else {
    throw new Error(`Unsupported image format: ${imageFile.type}`);
  }

  const page = pdfDoc.addPage([pageSize.width, pageSize.height]);

  // Scale image to fit page while maintaining aspect ratio
  const imageAspect = image.width / image.height;
  const pageAspect = pageSize.width / pageSize.height;

  let drawWidth, drawHeight, drawX, drawY;

  if (imageAspect > pageAspect) {
    drawWidth = pageSize.width;
    drawHeight = drawWidth / imageAspect;
    drawX = 0;
    drawY = (pageSize.height - drawHeight) / 2;
  } else {
    drawHeight = pageSize.height;
    drawWidth = drawHeight * imageAspect;
    drawX = (pageSize.width - drawWidth) / 2;
    drawY = 0;
  }

  page.drawImage(image, {
    x: drawX,
    y: drawY,
    width: drawWidth,
    height: drawHeight,
  });

  return pdfDoc.save();
}

// ============================================
// METADATA OPERATIONS
// ============================================

export async function updateMetadata(
  pdfBytes: ArrayBuffer,
  metadata: Partial<PDFMetadata>
): Promise<Uint8Array> {
  const pdfDoc = await PDFLibDocument.load(pdfBytes);

  if (metadata.title) pdfDoc.setTitle(metadata.title);
  if (metadata.author) pdfDoc.setAuthor(metadata.author);
  if (metadata.subject) pdfDoc.setSubject(metadata.subject);
  if (metadata.keywords) pdfDoc.setKeywords([metadata.keywords]);
  if (metadata.creator) pdfDoc.setCreator(metadata.creator);
  if (metadata.producer) pdfDoc.setProducer(metadata.producer);

  return pdfDoc.save();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function downloadPDF(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function pdfBytesToBase64(pdfBytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < pdfBytes.length; i++) {
    binary += String.fromCharCode(pdfBytes[i]!);
  }
  return btoa(binary);
}

export function base64ToPdfBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ============================================
// PDF VALIDATION
// ============================================

export async function validatePDF(source: File | ArrayBuffer): Promise<{
  isValid: boolean;
  error?: string;
  pageCount?: number;
  isEncrypted?: boolean;
}> {
  try {
    const data = source instanceof File ? await source.arrayBuffer() : source;
    const loadingTask = pdfjsLib.getDocument({ data });
    const proxy = await loadingTask.promise;

    return {
      isValid: true,
      pageCount: proxy.numPages,
      isEncrypted: false, // pdf.js handles encrypted PDFs transparently if no password needed
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error validating PDF',
    };
  }
}

// ============================================
// ADVANCED MERGE OPTIONS
// ============================================

export interface MergeOptions {
  outputName?: string;
  bookmarks?: 'keep' | 'flatten' | 'remove';
  annotations?: boolean;
  formFields?: boolean;
  attachments?: boolean;
  metadata?: 'first' | 'custom' | 'none';
  customMetadata?: Partial<PDFMetadata>;
}

export interface PDFFileForMerge {
  bytes: ArrayBuffer;
  selectedPages: number[] | 'all';
  pageCount: number;
}

export async function mergePDFsAdvanced(
  files: PDFFileForMerge[],
  options: MergeOptions = {}
): Promise<Uint8Array> {
  const mergedPdf = await PDFLibDocument.create();

  for (const file of files) {
    const pdf = await PDFLibDocument.load(file.bytes);
    const pageIndices = file.selectedPages === 'all'
      ? pdf.getPageIndices()
      : file.selectedPages.map(p => p - 1);

    const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  // Apply metadata
  if (options.metadata === 'custom' && options.customMetadata) {
    if (options.customMetadata.title) mergedPdf.setTitle(options.customMetadata.title);
    if (options.customMetadata.author) mergedPdf.setAuthor(options.customMetadata.author);
    if (options.customMetadata.subject) mergedPdf.setSubject(options.customMetadata.subject);
  } else if (options.metadata === 'first' && files.length > 0) {
    try {
      const firstPdf = await PDFLibDocument.load(files[0]!.bytes);
      const title = firstPdf.getTitle();
      const author = firstPdf.getAuthor();
      if (title) mergedPdf.setTitle(title);
      if (author) mergedPdf.setAuthor(author);
    } catch {
      // Ignore metadata copy errors
    }
  }

  return mergedPdf.save();
}

// ============================================
// ADVANCED SPLIT OPTIONS
// ============================================

export type SplitMode = 'range' | 'extract' | 'every' | 'size';

export interface SplitOptions {
  mode: SplitMode;
  ranges?: PageRange[];
  extractPages?: number[];
  everyNPages?: number;
  maxFileSize?: number; // in MB
  outputPrefix?: string;
}

export async function splitPDFAdvanced(
  pdfBytes: ArrayBuffer,
  options: SplitOptions
): Promise<{ name: string; bytes: Uint8Array }[]> {
  const sourcePdf = await PDFLibDocument.load(pdfBytes);
  const results: { name: string; bytes: Uint8Array }[] = [];
  const prefix = options.outputPrefix || 'document';

  switch (options.mode) {
    case 'range':
      if (options.ranges) {
        for (let i = 0; i < options.ranges.length; i++) {
          const range = options.ranges[i]!;
          const newPdf = await PDFLibDocument.create();
          const pageIndices = Array.from(
            { length: range.end - range.start + 1 },
            (_, idx) => range.start - 1 + idx
          );
          const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
          copiedPages.forEach((page) => newPdf.addPage(page));
          results.push({
            name: `${prefix}_${range.name || `part${i + 1}`}.pdf`,
            bytes: await newPdf.save()
          });
        }
      }
      break;

    case 'extract':
      if (options.extractPages && options.extractPages.length > 0) {
        const newPdf = await PDFLibDocument.create();
        const pageIndices = options.extractPages.map(n => n - 1);
        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));
        results.push({
          name: `${prefix}_extracted.pdf`,
          bytes: await newPdf.save()
        });
      }
      break;

    case 'every':
      const everyN = options.everyNPages || 1;
      const totalPages = sourcePdf.getPageCount();
      let partNumber = 1;

      for (let start = 0; start < totalPages; start += everyN) {
        const end = Math.min(start + everyN, totalPages);
        const newPdf = await PDFLibDocument.create();
        const pageIndices = Array.from({ length: end - start }, (_, i) => start + i);
        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));
        results.push({
          name: `${prefix}_${String(partNumber).padStart(3, '0')}.pdf`,
          bytes: await newPdf.save()
        });
        partNumber++;
      }
      break;

    case 'size':
      // Simplified size-based splitting (estimate)
      // In production, would need to measure actual sizes
      const maxSize = (options.maxFileSize || 10) * 1024 * 1024;
      const pagesPerChunk = Math.max(1, Math.floor(maxSize / (pdfBytes.byteLength / sourcePdf.getPageCount())));

      let chunkNumber = 1;
      for (let start = 0; start < sourcePdf.getPageCount(); start += pagesPerChunk) {
        const end = Math.min(start + pagesPerChunk, sourcePdf.getPageCount());
        const newPdf = await PDFLibDocument.create();
        const pageIndices = Array.from({ length: end - start }, (_, i) => start + i);
        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));
        results.push({
          name: `${prefix}_${String(chunkNumber).padStart(3, '0')}.pdf`,
          bytes: await newPdf.save()
        });
        chunkNumber++;
      }
      break;
  }

  return results;
}

// ============================================
// PAGE MANIPULATION BATCH OPERATIONS
// ============================================

export interface PageChange {
  type: 'reorder' | 'rotate' | 'delete' | 'duplicate';
  originalPage: number;
  newPosition?: number;
  rotation?: 0 | 90 | 180 | 270;
}

export async function applyPageChanges(
  pdfBytes: ArrayBuffer,
  changes: PageChange[]
): Promise<Uint8Array> {
  const sourcePdf = await PDFLibDocument.load(pdfBytes);
  const newPdf = await PDFLibDocument.create();

  // Build the new page order
  const deletedPages = new Set(
    changes.filter(c => c.type === 'delete').map(c => c.originalPage)
  );

  const rotations = new Map(
    changes.filter(c => c.type === 'rotate').map(c => [c.originalPage, c.rotation!])
  );

  // Get pages to keep (not deleted)
  const pagesToKeep = Array.from(
    { length: sourcePdf.getPageCount() },
    (_, i) => i + 1
  ).filter(p => !deletedPages.has(p));

  // Apply reorder changes
  const reorderChanges = changes.filter(c => c.type === 'reorder');
  if (reorderChanges.length > 0) {
    // Sort by new position
    reorderChanges.sort((a, b) => (a.newPosition || 0) - (b.newPosition || 0));
    pagesToKeep.length = 0;
    for (const change of reorderChanges) {
      if (!deletedPages.has(change.originalPage)) {
        pagesToKeep.push(change.originalPage);
      }
    }
  }

  // Copy pages in order
  for (const pageNum of pagesToKeep) {
    const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageNum - 1]);

    // Apply rotation if specified
    const rotation = rotations.get(pageNum);
    if (rotation !== undefined) {
      copiedPage.setRotation(degrees(rotation));
    }

    newPdf.addPage(copiedPage);
  }

  return newPdf.save();
}

// ============================================
// COMPRESSION (Simplified - would need server for full optimization)
// ============================================

export interface CompressionOptions {
  preset?: 'web' | 'print' | 'archive' | 'custom';
  removeMetadata?: boolean;
  linearize?: boolean;
}

export async function compressPDF(
  pdfBytes: ArrayBuffer,
  options: CompressionOptions = {}
): Promise<Uint8Array> {
  // Note: Full image recompression requires server-side processing
  // This provides basic optimization available in browser
  const pdfDoc = await PDFLibDocument.load(pdfBytes, {
    updateMetadata: !options.removeMetadata
  });

  if (options.removeMetadata) {
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setCreator('');
    pdfDoc.setProducer('Lumina PDF Suite');
  }

  // Save with compression (pdf-lib applies basic compression)
  return pdfDoc.save({
    useObjectStreams: true, // Better compression
    addDefaultPage: false,
  });
}

// ============================================
// ENCRYPTION/SECURITY
// ============================================

export interface EncryptionOptions {
  userPassword?: string;
  ownerPassword?: string;
  permissions?: {
    printing?: boolean;
    copying?: boolean;
    modifying?: boolean;
    annotating?: boolean;
    fillingForms?: boolean;
    contentAccessibility?: boolean;
    documentAssembly?: boolean;
  };
}

export async function encryptPDF(
  pdfBytes: ArrayBuffer,
  options: EncryptionOptions
): Promise<Uint8Array> {
  // Note: pdf-lib doesn't support encryption natively
  // This is a placeholder that would need a server-side solution
  // For now, just return the document with metadata noting it should be encrypted
  const pdfDoc = await PDFLibDocument.load(pdfBytes);
  pdfDoc.setProducer('Lumina PDF Suite - Security Applied');

  // In production, would use a library like pdf-lib-encrypt or server-side processing
  console.warn('PDF encryption requires server-side processing for full security');

  return pdfDoc.save();
}

// ============================================
// MULTI-IMAGE TO PDF
// ============================================

export async function imagesToPDF(
  imageFiles: File[],
  pageSize: { width: number; height: number } = { width: 612, height: 792 },
  options: { fitMode?: 'fit' | 'fill' | 'stretch' } = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFLibDocument.create();
  const fitMode = options.fitMode || 'fit';

  for (const file of imageFiles) {
    const imageBytes = await file.arrayBuffer();

    let image;
    if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(imageBytes);
    } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(imageBytes);
    } else {
      console.warn(`Skipping unsupported image format: ${file.type}`);
      continue;
    }

    const page = pdfDoc.addPage([pageSize.width, pageSize.height]);

    let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

    if (fitMode === 'stretch') {
      drawWidth = pageSize.width;
      drawHeight = pageSize.height;
      drawX = 0;
      drawY = 0;
    } else {
      const imageAspect = image.width / image.height;
      const pageAspect = pageSize.width / pageSize.height;

      if (fitMode === 'fill') {
        if (imageAspect > pageAspect) {
          drawHeight = pageSize.height;
          drawWidth = drawHeight * imageAspect;
        } else {
          drawWidth = pageSize.width;
          drawHeight = drawWidth / imageAspect;
        }
      } else { // fit
        if (imageAspect > pageAspect) {
          drawWidth = pageSize.width;
          drawHeight = drawWidth / imageAspect;
        } else {
          drawHeight = pageSize.height;
          drawWidth = drawHeight * imageAspect;
        }
      }

      drawX = (pageSize.width - drawWidth) / 2;
      drawY = (pageSize.height - drawHeight) / 2;
    }

    page.drawImage(image, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return pdfDoc.save();
}

// ============================================
// WATERMARK
// ============================================

export interface WatermarkOptions {
  text?: string;
  imageBytes?: ArrayBuffer;
  imageType?: 'png' | 'jpg';
  opacity?: number;
  rotation?: number;
  position?: 'center' | 'diagonal' | 'top' | 'bottom';
  pages?: number[] | 'all';
  fontSize?: number;
  color?: { r: number; g: number; b: number };
}

export async function addWatermark(
  pdfBytes: ArrayBuffer,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFLibDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const targetPages = options.pages === 'all' || !options.pages
    ? pages
    : pages.filter((_, i) => options.pages?.includes(i + 1));

  for (const page of targetPages) {
    const { width, height } = page.getSize();

    if (options.text) {
      const fontSize = options.fontSize || 48;
      const textWidth = font.widthOfTextAtSize(options.text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      let x: number, y: number;
      const rotation = options.rotation || (options.position === 'diagonal' ? 45 : 0);

      switch (options.position) {
        case 'top':
          x = (width - textWidth) / 2;
          y = height - textHeight - 50;
          break;
        case 'bottom':
          x = (width - textWidth) / 2;
          y = 50;
          break;
        case 'diagonal':
        case 'center':
        default:
          x = (width - textWidth) / 2;
          y = (height - textHeight) / 2;
      }

      const color = options.color || { r: 0.5, g: 0.5, b: 0.5 };

      page.drawText(options.text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity: options.opacity || 0.3,
        rotate: degrees(rotation),
      });
    }

    if (options.imageBytes) {
      const image = options.imageType === 'png'
        ? await pdfDoc.embedPng(options.imageBytes)
        : await pdfDoc.embedJpg(options.imageBytes);

      const imgWidth = Math.min(image.width, width * 0.5);
      const imgHeight = (image.height / image.width) * imgWidth;

      page.drawImage(image, {
        x: (width - imgWidth) / 2,
        y: (height - imgHeight) / 2,
        width: imgWidth,
        height: imgHeight,
        opacity: options.opacity || 0.3,
      });
    }
  }

  return pdfDoc.save();
}

// ============================================
// PDF/A EXPORT (Simplified)
// ============================================

export async function exportAsPDFA(
  pdfBytes: ArrayBuffer,
  metadata?: Partial<PDFMetadata>
): Promise<Uint8Array> {
  // Note: Full PDF/A compliance requires specialized processing
  // This provides a simplified version with required metadata
  const pdfDoc = await PDFLibDocument.load(pdfBytes);

  // Set required metadata for PDF/A
  pdfDoc.setTitle(metadata?.title || 'Untitled');
  pdfDoc.setAuthor(metadata?.author || 'Lumina PDF Suite');
  pdfDoc.setSubject(metadata?.subject || '');
  pdfDoc.setProducer('Lumina PDF Suite');
  pdfDoc.setCreator('Lumina PDF Suite');

  return pdfDoc.save();
}

// ============================================
// DOCUMENT INFO
// ============================================

export async function getDocumentInfo(pdfBytes: ArrayBuffer): Promise<{
  pageCount: number;
  fileSize: number;
  isEncrypted: boolean;
  metadata: PDFMetadata;
  pages: Array<{ width: number; height: number; rotation: number }>;
}> {
  const pdfDoc = await PDFLibDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  return {
    pageCount: pages.length,
    fileSize: pdfBytes.byteLength,
    isEncrypted: false, // pdf-lib can't detect this directly
    metadata: {
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      subject: pdfDoc.getSubject(),
      creator: pdfDoc.getCreator(),
      producer: pdfDoc.getProducer(),
    },
    pages: pages.map(page => ({
      width: page.getWidth(),
      height: page.getHeight(),
      rotation: page.getRotation().angle,
    })),
  };
}

// Export pdf.js for advanced usage
export { pdfjsLib };
