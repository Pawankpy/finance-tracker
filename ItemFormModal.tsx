'use client';

import { useState, useRef } from 'react';
import { FinancialItem, FinancialItemInput, ITEM_TYPES, FREQUENCIES, ItemType, TYPE_STYLES } from '@/lib/types';
import { X, Upload, Loader2, Sparkles } from 'lucide-react';
import { createItem, updateItem, uploadDocument } from '@/lib/actions/items';

const emptyForm: FinancialItemInput = {
  type: 'Policy',
  name: '',
  institution: '',
  principal_amount: null,
  current_value: null,
  maturity_value: null,
  maturity_date: '',
  next_payment_date: '',
  payment_amount: null,
  frequency: 'Yearly',
  notes: '',
  document_path: null,
};

export default function ItemFormModal({
  item,
  onClose,
  onSaved,
}: {
  item: FinancialItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FinancialItemInput>(item ? { ...item } : emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractMsg, setExtractMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof FinancialItemInput>(key: K, value: FinancialItemInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleFileUpload(file: File) {
    setError('');
    setExtractMsg('');

    const isExcel = /\.(xlsx|xls|csv)$/i.test(file.name);
    if (isExcel) {
      setError('This looks like a spreadsheet — use the "Import from Excel" button on the main screen instead, which handles multiple rows at once.');
      return;
    }

    setExtracting(true);
    try {
      // 1. Upload the raw file to storage so it's kept as a record
      const path = await uploadDocument(file);
      set('document_path', path);

      // 2. Ask Claude to extract structured fields
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/extract-document', { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok) {
        setExtractMsg(json.error || 'Could not auto-extract — please fill in details manually.');
      } else {
        const ex = json.extracted;
        setForm((f) => ({
          ...f,
          type: (ex.type && ITEM_TYPES.includes(ex.type)) ? ex.type : f.type,
          name: ex.name || f.name,
          institution: ex.institution || f.institution,
          principal_amount: ex.principal_amount ?? f.principal_amount,
          maturity_value: ex.maturity_value ?? f.maturity_value,
          maturity_date: ex.maturity_date || f.maturity_date,
          next_payment_date: ex.next_payment_date || f.next_payment_date,
          payment_amount: ex.payment_amount ?? f.payment_amount,
          frequency: ex.frequency || f.frequency,
          notes: ex.notes || f.notes,
          document_path: path,
        }));
        setExtractMsg('Details pre-filled from the document — please review before saving.');
      }
    } catch (e) {
      setExtractMsg('Upload succeeded but auto-extraction failed. Please fill in details manually.');
    }
    setExtracting(false);
  }

  async function handleSubmit() {
    setError('');
    if (!form.name.trim()) {
      setError('Please enter a name for this item.');
      return;
    }
    if (!form.maturity_date && !form.next_payment_date) {
      setError('Please enter at least a maturity date or a next payment date.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        maturity_date: form.maturity_date || null,
        next_payment_date: form.next_payment_date || null,
      };
      if (item) {
        await updateItem(item.id, payload);
      } else {
        await createItem(payload);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Please try again.');
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/45 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-[#faf8f5] rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{item ? 'Edit Item' : 'Add New Item'}</h2>
          <button onClick={onClose} className="text-[#9a9184]"><X size={20} /></button>
        </div>

        <div className="font-sans flex flex-col gap-3.5 text-sm">
          {/* Document upload */}
          <div>
            <label className="block text-xs font-semibold text-[#6b6354] mb-1.5">
              Upload receipt / policy PDF / photo (optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={extracting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-[#ddd4c4] text-[#6b6354] text-xs font-medium"
            >
              {extracting ? (
                <><Loader2 size={14} className="animate-spin" /> Reading document…</>
              ) : (
                <><Upload size={14} /> Upload PDF or photo to auto-fill</>
              )}
            </button>
            {extractMsg && (
              <p className="text-[11px] text-[#8a7560] mt-1.5 flex items-start gap-1">
                <Sparkles size={12} className="mt-0.5 flex-shrink-0" /> {extractMsg}
              </p>
            )}
          </div>

          {/* Type selector */}
          <div>
            <label className="block text-xs font-semibold text-[#6b6354] mb-1.5">Type</label>
            <div className="flex gap-1.5 flex-wrap">
              {ITEM_TYPES.map((t) => {
                const style = TYPE_STYLES[t];
                const active = form.type === t;
                return (
                  <button
                    key={t}
                    onClick={() => set('type', t as ItemType)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                    style={{
                      borderColor: active ? style.color : '#ddd4c4',
                      background: active ? style.bg : '#fff',
                      color: active ? style.color : '#6b6354',
                      borderWidth: active ? 1.5 : 1,
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Name *" value={form.name} onChange={(v) => set('name', v)} placeholder="e.g. LIC Jeevan Anand, HDFC FD" />
          <Field label="Institution" value={form.institution || ''} onChange={(v) => set('institution', v)} placeholder="e.g. LIC, HDFC Bank, SBI Mutual Fund" />

          <div className="grid grid-cols-2 gap-2.5">
            <NumField label="Principal / Invested (₹)" value={form.principal_amount} onChange={(v) => set('principal_amount', v)} />
            <NumField label="Current Value (₹)" value={form.current_value} onChange={(v) => set('current_value', v)} />
          </div>
          <NumField label="Value at Maturity (₹)" value={form.maturity_value} onChange={(v) => set('maturity_value', v)} />

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-[#6b6354] mb-1.5">Maturity Date</label>
              <input
                type="date"
                value={form.maturity_date || ''}
                onChange={(e) => set('maturity_date', e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-[#ddd4c4] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6b6354] mb-1.5">Next Payment Date</label>
              <input
                type="date"
                value={form.next_payment_date || ''}
                onChange={(e) => set('next_payment_date', e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-[#ddd4c4] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <NumField label="Payment Amount (₹)" value={form.payment_amount} onChange={(v) => set('payment_amount', v)} />
            <div>
              <label className="block text-xs font-semibold text-[#6b6354] mb-1.5">Frequency</label>
              <select
                value={form.frequency || 'Yearly'}
                onChange={(e) => set('frequency', e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-[#ddd4c4] text-sm bg-white"
              >
                {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6b6354] mb-1.5">Notes</label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Policy number, account number, anything else"
              className="w-full px-2.5 py-2 rounded-lg border border-[#ddd4c4] text-sm resize-y"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2.5 mt-1.5">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-[#ddd4c4] bg-white font-semibold text-sm">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || extracting}
              className="flex-1 py-2.5 rounded-lg bg-[#3d3a32] text-[#faf8f5] font-semibold text-sm disabled:opacity-60"
            >
              {saving ? 'Saving…' : item ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#6b6354] mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2.5 py-2 rounded-lg border border-[#ddd4c4] text-sm"
      />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#6b6354] mb-1.5">{label}</label>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="w-full px-2.5 py-2 rounded-lg border border-[#ddd4c4] text-sm"
      />
    </div>
  );
}
