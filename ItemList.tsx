'use client';

import { FinancialItem, TYPE_STYLES } from '@/lib/types';
import { formatCurrency, formatDate, daysUntil, urgencyLabel } from '@/lib/format';
import { Shield, PiggyBank, TrendingUp, BarChart3, Edit2, Trash2, Paperclip } from 'lucide-react';
import { deleteItem } from '@/lib/actions/items';

const ICONS = { Policy: Shield, FD: PiggyBank, RD: TrendingUp, 'Mutual Fund': BarChart3 };

export default function ItemList({
  items,
  onEdit,
  onDeleted,
}: {
  items: FinancialItem[];
  onEdit: (item: FinancialItem) => void;
  onDeleted: () => void;
}) {
  async function handleDelete(id: string) {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    await deleteItem(id);
    onDeleted();
  }

  const sorted = [...items].sort((a, b) => {
    const da = a.next_payment_date || a.maturity_date || '9999-12-31';
    const db = b.next_payment_date || b.maturity_date || '9999-12-31';
    return da.localeCompare(db);
  });

  return (
    <div className="flex flex-col gap-2.5">
      {sorted.map((item) => {
        const Icon = ICONS[item.type];
        const style = TYPE_STYLES[item.type];
        const nextDate = item.next_payment_date || item.maturity_date;
        const days = nextDate ? daysUntil(nextDate) : null;
        const urgency = days !== null ? urgencyLabel(days) : null;

        return (
          <div key={item.id} className="bg-white border border-[#ece6da] rounded-xl p-4 flex justify-between items-start gap-3">
            <div className="flex gap-3 flex-1 min-w-0">
              <div
                className="rounded-lg w-9 h-9 flex items-center justify-center flex-shrink-0"
                style={{ background: style.bg, color: style.color }}
              >
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">{item.name}</span>
                  {urgency && (
                    <span
                      className="font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: urgency.color, background: `${urgency.color}14` }}
                    >
                      {urgency.text}
                    </span>
                  )}
                  {item.document_path && <Paperclip size={11} className="text-[#9a9184]" />}
                </div>
                <div className="font-sans text-xs text-[#9a9184] mt-0.5">
                  {item.institution && <span>{item.institution} · </span>}
                  {item.type}
                  {(item.current_value || item.principal_amount) && (
                    <span> · {formatCurrency(item.current_value || item.principal_amount)}</span>
                  )}
                </div>
                <div className="font-sans text-xs text-[#6b6354] mt-1.5 flex gap-4 flex-wrap">
                  {item.maturity_date && <span>Maturity: <strong>{formatDate(item.maturity_date)}</strong>{item.maturity_value ? ` (${formatCurrency(item.maturity_value)})` : ''}</span>}
                  {item.next_payment_date && (
                    <span>Next payment: <strong>{formatDate(item.next_payment_date)}</strong>{item.payment_amount ? ` (${formatCurrency(item.payment_amount)})` : ''}</span>
                  )}
                </div>
                {item.notes && <div className="font-sans text-[11px] text-[#9a9184] mt-1.5 italic">{item.notes}</div>}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => onEdit(item)} className="p-1.5 text-[#9a9184]"><Edit2 size={14} /></button>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 text-[#c47a7a]"><Trash2 size={14} /></button>
            </div>
          </div>
        );
      })}
      {sorted.length === 0 && (
        <p className="font-sans text-sm text-[#9a9184] text-center py-10">No items match this filter.</p>
      )}
    </div>
  );
}
