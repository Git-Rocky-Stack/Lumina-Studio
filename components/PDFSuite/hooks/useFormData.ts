// ============================================
// useFormData Hook
// Manages form data import/export in multiple formats
// ============================================

import { useCallback } from 'react';
import type { PDFFormField } from '../types';

type FormDataValue = string | boolean | string[] | Date | null;
type FormDataRecord = Record<string, FormDataValue>;

interface ExportOptions {
  format: 'json' | 'csv' | 'xml' | 'fdf' | 'xfdf';
  includeEmptyFields?: boolean;
  includeMetadata?: boolean;
  dateFormat?: string;
}

interface ImportOptions {
  format: 'json' | 'csv' | 'xml' | 'fdf' | 'xfdf';
  mapFields?: Record<string, string>; // source field name -> target field name
}

interface UseFormDataReturn {
  // Export functions
  exportToJSON: (fields: PDFFormField[], data: FormDataRecord, options?: Partial<ExportOptions>) => string;
  exportToCSV: (fields: PDFFormField[], data: FormDataRecord, options?: Partial<ExportOptions>) => string;
  exportToXML: (fields: PDFFormField[], data: FormDataRecord, options?: Partial<ExportOptions>) => string;
  exportToFDF: (fields: PDFFormField[], data: FormDataRecord) => string;
  exportToXFDF: (fields: PDFFormField[], data: FormDataRecord) => string;

  // Import functions
  importFromJSON: (jsonString: string, options?: Partial<ImportOptions>) => FormDataRecord;
  importFromCSV: (csvString: string, options?: Partial<ImportOptions>) => FormDataRecord;
  importFromXML: (xmlString: string, options?: Partial<ImportOptions>) => FormDataRecord;

  // Download helpers
  downloadAsFile: (content: string, filename: string, mimeType: string) => void;
  downloadFormData: (fields: PDFFormField[], data: FormDataRecord, format: ExportOptions['format'], filename?: string) => void;

  // File upload helper
  readFileAsText: (file: File) => Promise<string>;
  parseUploadedFile: (file: File) => Promise<FormDataRecord>;

  // Merge/transform
  mergeData: (existing: FormDataRecord, incoming: FormDataRecord, strategy: 'overwrite' | 'keep' | 'merge') => FormDataRecord;
  transformData: (data: FormDataRecord, transforms: Record<string, (value: FormDataValue) => FormDataValue>) => FormDataRecord;

  // Validation
  validateImportedData: (data: FormDataRecord, fields: PDFFormField[]) => { valid: boolean; errors: string[] };
}

export function useFormData(): UseFormDataReturn {
  // Export to JSON
  const exportToJSON = useCallback((
    fields: PDFFormField[],
    data: FormDataRecord,
    options: Partial<ExportOptions> = {}
  ): string => {
    const { includeEmptyFields = false, includeMetadata = false } = options;

    const exportData: Record<string, unknown> = {};

    fields.forEach((field) => {
      const value = data[field.name];

      if (!includeEmptyFields && (value === null || value === undefined || value === '')) {
        return;
      }

      if (includeMetadata) {
        exportData[field.name] = {
          value,
          type: field.type,
          label: field.label,
          required: field.required,
        };
      } else {
        exportData[field.name] = value;
      }
    });

    return JSON.stringify(exportData, null, 2);
  }, []);

  // Export to CSV
  const exportToCSV = useCallback((
    fields: PDFFormField[],
    data: FormDataRecord,
    options: Partial<ExportOptions> = {}
  ): string => {
    const { includeEmptyFields = false } = options;

    const headers: string[] = [];
    const values: string[] = [];

    fields.forEach((field) => {
      const value = data[field.name];

      if (!includeEmptyFields && (value === null || value === undefined || value === '')) {
        return;
      }

      headers.push(`"${field.label || field.name}"`);

      let csvValue = '';
      if (value instanceof Date) {
        csvValue = value.toISOString();
      } else if (Array.isArray(value)) {
        csvValue = value.join('; ');
      } else if (value !== null && value !== undefined) {
        csvValue = String(value).replace(/"/g, '""');
      }
      values.push(`"${csvValue}"`);
    });

    return `${headers.join(',')}\n${values.join(',')}`;
  }, []);

  // Export to XML
  const exportToXML = useCallback((
    fields: PDFFormField[],
    data: FormDataRecord,
    options: Partial<ExportOptions> = {}
  ): string => {
    const { includeEmptyFields = false, includeMetadata = false } = options;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<form>\n';

    fields.forEach((field) => {
      const value = data[field.name];

      if (!includeEmptyFields && (value === null || value === undefined || value === '')) {
        return;
      }

      const escapedName = field.name.replace(/[<>&'"]/g, (c) => {
        const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };
        return map[c] || c;
      });

      let xmlValue = '';
      if (value instanceof Date) {
        xmlValue = value.toISOString();
      } else if (Array.isArray(value)) {
        xmlValue = value.map((v) => `<item>${v}</item>`).join('');
        xml += `  <field name="${escapedName}"${includeMetadata ? ` type="${field.type}"` : ''}>\n    ${xmlValue}\n  </field>\n`;
        return;
      } else if (value !== null && value !== undefined) {
        xmlValue = String(value).replace(/[<>&]/g, (c) => {
          const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;' };
          return map[c] || c;
        });
      }

      if (includeMetadata) {
        xml += `  <field name="${escapedName}" type="${field.type}" required="${field.required}">${xmlValue}</field>\n`;
      } else {
        xml += `  <field name="${escapedName}">${xmlValue}</field>\n`;
      }
    });

    xml += '</form>';
    return xml;
  }, []);

  // Export to FDF (Forms Data Format - simplified)
  const exportToFDF = useCallback((
    fields: PDFFormField[],
    data: FormDataRecord
  ): string => {
    let fdf = '%FDF-1.2\n1 0 obj\n<< /FDF << /Fields [\n';

    fields.forEach((field) => {
      const value = data[field.name];
      if (value === null || value === undefined) return;

      let fdfValue = '';
      if (typeof value === 'boolean') {
        fdfValue = value ? '/Yes' : '/Off';
      } else if (value instanceof Date) {
        fdfValue = `(${value.toISOString()})`;
      } else {
        fdfValue = `(${String(value).replace(/[()\\]/g, '\\$&')})`;
      }

      fdf += `<< /T (${field.name}) /V ${fdfValue} >>\n`;
    });

    fdf += '] >> >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF';
    return fdf;
  }, []);

  // Export to XFDF (XML Forms Data Format)
  const exportToXFDF = useCallback((
    fields: PDFFormField[],
    data: FormDataRecord
  ): string => {
    let xfdf = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xfdf += '<xfdf xmlns="http://ns.adobe.com/xfdf/" xml:space="preserve">\n';
    xfdf += '  <fields>\n';

    fields.forEach((field) => {
      const value = data[field.name];
      if (value === null || value === undefined) return;

      const escapedName = field.name.replace(/[<>&'"]/g, (c) => {
        const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };
        return map[c] || c;
      });

      let xfdfValue = '';
      if (typeof value === 'boolean') {
        xfdfValue = value ? 'Yes' : 'Off';
      } else if (value instanceof Date) {
        xfdfValue = value.toISOString();
      } else if (Array.isArray(value)) {
        xfdf += `    <field name="${escapedName}">\n`;
        value.forEach((v) => {
          xfdf += `      <value>${String(v).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c))}</value>\n`;
        });
        xfdf += '    </field>\n';
        return;
      } else {
        xfdfValue = String(value).replace(/[<>&]/g, (c) => {
          const map: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;' };
          return map[c] || c;
        });
      }

      xfdf += `    <field name="${escapedName}"><value>${xfdfValue}</value></field>\n`;
    });

    xfdf += '  </fields>\n</xfdf>';
    return xfdf;
  }, []);

  // Import from JSON
  const importFromJSON = useCallback((
    jsonString: string,
    options: Partial<ImportOptions> = {}
  ): FormDataRecord => {
    const { mapFields = {} } = options;
    const parsed = JSON.parse(jsonString);
    const result: FormDataRecord = {};

    Object.entries(parsed).forEach(([key, value]) => {
      const targetKey = mapFields[key] || key;

      // Handle metadata format
      if (value && typeof value === 'object' && 'value' in value) {
        result[targetKey] = (value as { value: FormDataValue }).value;
      } else {
        result[targetKey] = value as FormDataValue;
      }
    });

    return result;
  }, []);

  // Import from CSV
  const importFromCSV = useCallback((
    csvString: string,
    options: Partial<ImportOptions> = {}
  ): FormDataRecord => {
    const { mapFields = {} } = options;
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return {};

    const headers = lines[0]!.split(',').map((h) => h.replace(/^"|"$/g, '').trim());
    const values = lines[1]!.split(',').map((v) => v.replace(/^"|"$/g, '').trim());

    const result: FormDataRecord = {};
    headers.forEach((header, index) => {
      const targetKey = mapFields[header] || header;
      result[targetKey] = values[index] || '';
    });

    return result;
  }, []);

  // Import from XML
  const importFromXML = useCallback((
    xmlString: string,
    options: Partial<ImportOptions> = {}
  ): FormDataRecord => {
    const { mapFields = {} } = options;
    const result: FormDataRecord = {};

    // Simple XML parsing using regex (for browser compatibility without DOM parser)
    const fieldRegex = /<field[^>]*name="([^"]*)"[^>]*>([^<]*)<\/field>/g;
    let match;

    while ((match = fieldRegex.exec(xmlString)) !== null) {
      const [, name, value] = match;
      if (name) {
        const targetKey = mapFields[name] || name;
        result[targetKey] = value || '';
      }
    }

    return result;
  }, []);

  // Download helper
  const downloadAsFile = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Download form data in specified format
  const downloadFormData = useCallback((
    fields: PDFFormField[],
    data: FormDataRecord,
    format: ExportOptions['format'],
    filename?: string
  ) => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const baseName = filename || `form-data-${timestamp}`;

    let content: string;
    let extension: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = exportToJSON(fields, data);
        extension = 'json';
        mimeType = 'application/json';
        break;
      case 'csv':
        content = exportToCSV(fields, data);
        extension = 'csv';
        mimeType = 'text/csv';
        break;
      case 'xml':
        content = exportToXML(fields, data);
        extension = 'xml';
        mimeType = 'application/xml';
        break;
      case 'fdf':
        content = exportToFDF(fields, data);
        extension = 'fdf';
        mimeType = 'application/vnd.fdf';
        break;
      case 'xfdf':
        content = exportToXFDF(fields, data);
        extension = 'xfdf';
        mimeType = 'application/vnd.adobe.xfdf';
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    downloadAsFile(content, `${baseName}.${extension}`, mimeType);
  }, [exportToJSON, exportToCSV, exportToXML, exportToFDF, exportToXFDF, downloadAsFile]);

  // Read file as text
  const readFileAsText = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  // Parse uploaded file
  const parseUploadedFile = useCallback(async (file: File): Promise<FormDataRecord> => {
    const content = await readFileAsText(file);
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'json':
        return importFromJSON(content);
      case 'csv':
        return importFromCSV(content);
      case 'xml':
      case 'xfdf':
        return importFromXML(content);
      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }
  }, [readFileAsText, importFromJSON, importFromCSV, importFromXML]);

  // Merge data
  const mergeData = useCallback((
    existing: FormDataRecord,
    incoming: FormDataRecord,
    strategy: 'overwrite' | 'keep' | 'merge'
  ): FormDataRecord => {
    const result = { ...existing };

    Object.entries(incoming).forEach(([key, value]) => {
      switch (strategy) {
        case 'overwrite':
          result[key] = value;
          break;
        case 'keep':
          if (!(key in result) || result[key] === null || result[key] === '') {
            result[key] = value;
          }
          break;
        case 'merge':
          if (Array.isArray(result[key]) && Array.isArray(value)) {
            result[key] = [...new Set([...(result[key] as string[]), ...value])];
          } else if (result[key] === null || result[key] === '') {
            result[key] = value;
          }
          break;
      }
    });

    return result;
  }, []);

  // Transform data
  const transformData = useCallback((
    data: FormDataRecord,
    transforms: Record<string, (value: FormDataValue) => FormDataValue>
  ): FormDataRecord => {
    const result = { ...data };

    Object.entries(transforms).forEach(([key, transform]) => {
      if (key in result) {
        result[key] = transform(result[key]);
      }
    });

    return result;
  }, []);

  // Validate imported data
  const validateImportedData = useCallback((
    data: FormDataRecord,
    fields: PDFFormField[]
  ): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const fieldNames = new Set(fields.map((f) => f.name));
    const requiredFields = fields.filter((f) => f.required).map((f) => f.name);

    // Check for unknown fields
    Object.keys(data).forEach((key) => {
      if (!fieldNames.has(key)) {
        errors.push(`Unknown field: ${key}`);
      }
    });

    // Check for missing required fields
    requiredFields.forEach((fieldName) => {
      if (!(fieldName in data) || data[fieldName] === null || data[fieldName] === '') {
        errors.push(`Missing required field: ${fieldName}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }, []);

  return {
    // Export functions
    exportToJSON,
    exportToCSV,
    exportToXML,
    exportToFDF,
    exportToXFDF,

    // Import functions
    importFromJSON,
    importFromCSV,
    importFromXML,

    // Download helpers
    downloadAsFile,
    downloadFormData,

    // File upload helper
    readFileAsText,
    parseUploadedFile,

    // Merge/transform
    mergeData,
    transformData,

    // Validation
    validateImportedData,
  };
}

export default useFormData;
