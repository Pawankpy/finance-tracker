'use client';

import { useState, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { parseExcelFile, normalizeExcelDate, normalizeExcelNumber, ParsedSheet } from '@/lib/excel/parse';
import { ITEM_TYPES, ItemType } from '@/lib/types';
import { createItem } from '@/lib/actions/items';

const FIELD_OPTIONS = [
  { key: 'name', label: 'Name *' },
  { key: 'institution', label: 'Institution' },
  { key: 'principal_amount', label: 'Principal / Invested' },
  { key: 'current_value', label: 'Current Value' },
  { key: 'maturity_value', label: 'Value at Maturity' },
  { key: 'maturity_date', label: 'Maturity Date' },
  { key: 'next_payment_date', label: 'Next Payment Date' },
  { key: 'payment_amount', label: 'Payment Amount' },
  { key: 'notes', label: 'Notes' },
  { key: '__ignore', label: '(Ignore this column)' },
];

export default function ExcelImportModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [defaultType, setDefaultType] = useState<ItemType>('Mutual Fund');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError('');
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.rows.length === 0) {
        setError('No rows found in this file.');
        return;
      }
      setSheet(parsed);
      // Try to guess sensible default mappings from header names
      const guessed: Record<string, string> = {};
      parsed.headers.forEach((h) => {
        const lower = h.toLowerCase();
        if (lower.includes('name') || lower.includes('scheme') || lower.includes('fund')) guessed[h] = 'name';
        else if (lower.includes('institution') || lower.includes('bank') || lower.includes('amc')) guessed[h] = 'institution';
        else if (lower.includes('maturity') && lower.includes('date')) guessed[h] = 'maturity_date';
        else if (lower.includes('maturity')) guessed[h] = 'maturity_value';
        else if (lower.includes('current') || lower.includes('value') || lower.includes('nav')) guessed[h] = 'current_value';
        else if (lower.includes('principal') || lower.includes('invest') || lower.includes('amount')) guessed[h] = 'principal_amount';
        else if (lower.includes('next') && lower.includes('date')) guessed[h] = 'next_payment_date';
        else if (lower.includes('note') || lower.includes('remark')) guessed[h] = 'notes';
        else guessed[h] = '__ignore';
      });
      setMapping(guessed);
    } catch (e) {
      setError('Could not read this file. Please make sure it is a valid .xlsx, .xls, or .csv file.');
    }
  }

  async function handleImport() {
    if (!sheet) return;
    const nameCol = Object.entries(mapping).find(([, v]) => v === 'name')?.[0];
    if (!nameCol) {
      setError('Please map at least one column to "Name" before importing.');
      return;
    }

    setImporting(true);
    setError('');
    let successCount = 0;

    for (let i = 0; i < sheet.rows.length; i++) {
      const row = sheet.rows[i];
      const item: Record<string, unknown> = {
        type: defaultType,
        name: '',
        institution: null,
        principal_amount: null,
        current_value: null,
        maturity_value: null,
        maturity_date: null,
        next_payment_date: null,
        payment_amount: null,
        frequency: 'Yearly',
        notes: null,
        document_path: null,
      };

      Object.entries(mapping).forEach(([col, field]) => {
        if (field === '__ignore') return;
        const raw = row[col];
        if (field.includes('date')) {
          item[field] = normalizeExcelDate(raw);
        } else if (field.includes('amount') || field.includes('value')) {
          item[field] = normalizeExcelNumber(raw);
        } else {
          item[field] = raw ? String(raw) : null;
        }
      });

      if (!item.name || !(item.maturity_date || item.next_payment_date)) {
        continue; // skip rows missing required info rather than failing the whole import
      }

      try {
        await createItem(item as never);
        successCount++;
      } catch {
        // continue importing remaining rows even if one fails
      }
      setProgress(Math.round(((i + 1) / sheet.rows.length) * 100));
    }

    setImporting(false);
    setDone(true);
    if (successCount > 0) {
      setTimeout(() => onImported(), 1200);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/45 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-[#faf8f5] rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 font-sans">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold font-serif">Import from Excel</h2>
          <button onClick={onClose} className="text-[#9a9184]"><X size={20} /></button>
        </div>

        {!sheet ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-8 rounded-xl border border-dashed border-[#ddd4c4] text-[#6b6354] text-sm font-medium"
            >
              <Upload size={16} /> Choose .xlsx, .xls or .csv file
            </button>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          </>
        ) : done ? (
          <div className="text-center py-8">
            <p className="text-sm font-semibold text-[#6b8a7a]">Import complete!</p>
            <p className="text-xs text-[#9a9184] mt-1">Closing automatically…</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#8a8175] mb-3">
              Found {sheet.rows.length} rows. Match each column to a field below — rows missing a name or date will be skipped.
            </p>

            <div className="mb-3">
              <label className="block text-xs font-semibold text-[#6b6354] mb-1.5">Default type for all imported rows</label>
              <select
                value={defaultType}
                onChange={(e) => setDefaultType(e.target.value as ItemType)}
                className="w-full px-2.5 py-2 rounded-lg border border-[#ddd4c4] text-sm bg-white"
              >
                {ITEM_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2 mb-4 max-h-64 overflow-y-auto">
              {sheet.headers.map((h) => (
                <div key={h} className="flex items-center gap-2">
                  <span className="text-xs text-[#6b6354] flex-1 truncate" title={h}>{h}</span>
                  <select
                    value={mapping[h] || '__ignore'}
                    onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value }))}
                    className="text-xs px-2 py-1.5 rounded-lg border border-[#ddd4c4] bg-white flex-1"
                  >
                    {FIELD_OPTIONS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

            {importing && (
              <div className="mb-3">
                <div className="w-full bg-[#ece6da] rounded-full h-1.5">
                  <div className="bg-[#6b8a7a] h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[11px] text-[#9a9184] mt-1 text-center">{progress}%</p>
              </div>
            )}

            <div className="flex gap-2.5">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-[#ddd4c4] bg-white font-semibold text-sm">
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 py-2.5 rounded-lg bg-[#3d3a32] text-[#faf8f5] font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {importing ? <><Loader2 size={14} className="animate-spin" /> Importing…</> : 'Import'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
