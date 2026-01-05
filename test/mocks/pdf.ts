// Mock PDF.js and pdf-lib for testing
import { vi } from 'vitest';

export interface MockPDFPage {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
  content: string;
}

export interface MockPDFDocument {
  numPages: number;
  pages: MockPDFPage[];
  fingerprint: string;
}

// Mock PDF.js document proxy
export const createMockPDFProxy = (pages: MockPDFPage[] = []): any => {
  const mockPages = pages.length > 0 ? pages : [
    { pageNumber: 1, width: 612, height: 792, rotation: 0, content: 'Page 1 content' },
    { pageNumber: 2, width: 612, height: 792, rotation: 0, content: 'Page 2 content' },
  ];

  return {
    numPages: mockPages.length,
    fingerprint: 'mock-fingerprint-12345',

    getPage: vi.fn(async (pageNum: number) => {
      const page = mockPages.find((p) => p.pageNumber === pageNum);
      if (!page) throw new Error(`Page ${pageNum} not found`);

      return {
        pageNumber: page.pageNumber,
        getViewport: vi.fn((options: { scale: number; rotation?: number }) => ({
          width: page.width * options.scale,
          height: page.height * options.scale,
          rotation: options.rotation || page.rotation,
          scale: options.scale,
          transform: [options.scale, 0, 0, options.scale, 0, 0],
        })),
        render: vi.fn(() => ({
          promise: Promise.resolve(),
        })),
        getTextContent: vi.fn(() =>
          Promise.resolve({
            items: [
              {
                str: page.content,
                transform: [12, 0, 0, 12, 100, 700],
                width: 200,
                height: 12,
                fontName: 'g_d0_f1',
              },
            ],
            styles: {
              g_d0_f1: {
                fontFamily: 'sans-serif',
                ascent: 0.75,
                descent: -0.25,
                vertical: false,
              },
            },
          })
        ),
        getAnnotations: vi.fn(() => Promise.resolve([])),
        cleanup: vi.fn(),
      };
    }),

    getMetadata: vi.fn(() =>
      Promise.resolve({
        info: {
          Title: 'Test PDF Document',
          Author: 'Test Author',
          Subject: 'Test Subject',
          Creator: 'Mock PDF Creator',
          Producer: 'Mock PDF Producer',
          CreationDate: 'D:20240101120000Z',
          ModDate: 'D:20240101120000Z',
          PDFFormatVersion: '1.7',
        },
        metadata: null,
      })
    ),

    getOutline: vi.fn(() => Promise.resolve(null)),

    getDestination: vi.fn((dest: string) => Promise.resolve(null)),

    getPageIndex: vi.fn((ref: unknown) => Promise.resolve(0)),

    destroy: vi.fn(),
  };
};

// Mock pdfjs-dist library
export const mockPdfjsLib = {
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  getDocument: vi.fn((config: { data: ArrayBuffer | Uint8Array }) => ({
    promise: Promise.resolve(createMockPDFProxy()),
  })),
};

// Mock pdf-lib library
export const createMockPDFLibDocument = () => {
  const mockPages: any[] = [];

  return {
    getPages: vi.fn(() => mockPages),
    getPageCount: vi.fn(() => mockPages.length),
    addPage: vi.fn((dimensions?: [number, number]) => {
      const page = {
        getWidth: vi.fn(() => dimensions?.[0] || 612),
        getHeight: vi.fn(() => dimensions?.[1] || 792),
        getRotation: vi.fn(() => ({ angle: 0 })),
        setRotation: vi.fn(),
        drawText: vi.fn(),
        drawImage: vi.fn(),
        drawRectangle: vi.fn(),
        drawEllipse: vi.fn(),
        drawLine: vi.fn(),
        getSize: vi.fn(() => ({ width: dimensions?.[0] || 612, height: dimensions?.[1] || 792 })),
      };
      mockPages.push(page);
      return page;
    }),
    insertPage: vi.fn((index: number, dimensions?: [number, number]) => {
      const page = {
        getWidth: vi.fn(() => dimensions?.[0] || 612),
        getHeight: vi.fn(() => dimensions?.[1] || 792),
        getRotation: vi.fn(() => ({ angle: 0 })),
        setRotation: vi.fn(),
      };
      mockPages.splice(index, 0, page);
      return page;
    }),
    removePage: vi.fn((index: number) => {
      mockPages.splice(index, 1);
    }),
    copyPages: vi.fn(async (srcDoc: any, indices: number[]) => {
      return indices.map(() => ({
        getWidth: vi.fn(() => 612),
        getHeight: vi.fn(() => 792),
        getRotation: vi.fn(() => ({ angle: 0 })),
      }));
    }),
    embedPng: vi.fn(async () => ({
      width: 200,
      height: 200,
      embed: vi.fn(),
    })),
    embedJpg: vi.fn(async () => ({
      width: 200,
      height: 200,
      embed: vi.fn(),
    })),
    embedFont: vi.fn(async () => ({
      widthOfTextAtSize: vi.fn(() => 100),
      heightAtSize: vi.fn(() => 12),
    })),
    setTitle: vi.fn(),
    setAuthor: vi.fn(),
    setSubject: vi.fn(),
    setKeywords: vi.fn(),
    setProducer: vi.fn(),
    setCreator: vi.fn(),
    getTitle: vi.fn(() => 'Test Document'),
    getAuthor: vi.fn(() => 'Test Author'),
    getSubject: vi.fn(() => ''),
    getCreator: vi.fn(() => ''),
    getProducer: vi.fn(() => ''),
    save: vi.fn(async () => new Uint8Array([0x25, 0x50, 0x44, 0x46])), // PDF header
  };
};

export const mockPdfLib = {
  PDFDocument: {
    create: vi.fn(async () => createMockPDFLibDocument()),
    load: vi.fn(async () => createMockPDFLibDocument()),
  },
  StandardFonts: {
    Helvetica: 'Helvetica',
    TimesRoman: 'Times-Roman',
    Courier: 'Courier',
  },
  rgb: vi.fn((r: number, g: number, b: number) => ({ r, g, b })),
  degrees: vi.fn((angle: number) => ({ angle })),
};

// Mock canvas for rendering
export const createMockCanvas = () => {
  const mockContext = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '12px sans-serif',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 7 })),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    rect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    transform: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
    })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1,
    })),
  };

  const mockCanvas = {
    width: 800,
    height: 600,
    getContext: vi.fn(() => mockContext),
    toDataURL: vi.fn(() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
    toBlob: vi.fn((callback: (blob: Blob) => void) => {
      callback(new Blob(['mock'], { type: 'image/png' }));
    }),
  };

  return { canvas: mockCanvas, context: mockContext };
};

// Helper to create mock PDF file
export const createMockPDFFile = (name: string = 'test.pdf', size: number = 1024): File => {
  const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]); // %PDF-1.7
  const content = new Uint8Array(size);
  content.set(pdfHeader);

  return new File([content], name, { type: 'application/pdf' });
};

// Helper to create mock text content
export const createMockTextContent = (pageNumber: number, text: string) => ({
  items: [
    {
      id: `text-${pageNumber}-1`,
      text,
      x: 100,
      y: 700,
      width: 200,
      height: 12,
      fontName: 'Helvetica',
      fontSize: 12,
      fontWeight: 400,
      fontStyle: 'normal' as const,
      color: '#000000',
      transform: [12, 0, 0, 12, 100, 700],
      isEdited: false,
    },
  ],
  styles: {
    Helvetica: {
      fontFamily: 'Helvetica',
      ascent: 0.75,
      descent: -0.25,
      vertical: false,
    },
  },
});

// Mock for URL.createObjectURL
export const mockCreateObjectURL = vi.fn(() => 'blob:http://localhost:3000/mock-blob-url');

// Mock for URL.revokeObjectURL
export const mockRevokeObjectURL = vi.fn();

// Setup all PDF mocks
export const setupPDFMocks = () => {
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;

  // Mock HTMLCanvasElement
  if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => createMockCanvas().context);
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock');
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback: (blob: Blob) => void) => {
      callback(new Blob(['mock'], { type: 'image/png' }));
    });
  }
};

// Cleanup PDF mocks
export const cleanupPDFMocks = () => {
  vi.clearAllMocks();
};
