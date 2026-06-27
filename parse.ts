import * as XLSX from 'xlsx';

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, unknown>[];
}

export async function parseExcelFile(file: File): Promise<ParsedSheet> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  const headers = json.length > 0 ? Object.keys(json[0]) : [];

  return { headers, rows: json };
}

// Try to turn an Excel cell value (could be a JS Date, a string, or a number
// serial) into a clean YYYY-MM-DD string.
export function normalizeExcelDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  return null;
}

export function normalizeExcelNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(String(value).replace(/[₹,\s]/g, ''));
  return isNaN(num) ? null : num;
}
