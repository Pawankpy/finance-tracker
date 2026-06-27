'use client';

import { FinancialItem, ITEM_TYPES, TYPE_STYLES } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { Shield, PiggyBank, TrendingUp, BarChart3 } from 'lucide-react';

const ICONS = { Policy: Shield, FD: PiggyBank, RD: TrendingUp, 'Mutual Fund': BarChart3 };

export default function SummaryDashboard({
  items,
  filterType,
  onFilterChange,
}: {
  items: FinancialItem[];
  filterType: string;
  onFilterChange: (type: string) => void;
}) {
  const totals = ITEM_TYPES.map((type) => {
    const typeItems = items.filter((i) => i.type === type);
    const principal = typeItems.reduce((sum, i) => sum + (i.principal_amount || 0), 0);
    const current = typeItems.reduce((sum, i) => sum + (i.current_value || 0), 0);
    const maturity = typeItems.reduce((sum, i) => sum + (i.maturity_value || 0), 0);
    return { type, count: typeItems.length, principal, current, maturity };
  });

  const grandPrincipal = items.reduce((sum, i) => sum + (i.principal_amount || 0), 0);
  const grandCurrent = items.reduce((sum, i) => sum + (i.current_value || 0), 0);
  const grandMaturity = items.reduce((sum, i) => sum + (i.maturity_value || 0), 0);

  return (
    <div className="mb-6">
      {/* Grand total banner */}
      <div className="bg-[#3d3a32] rounded-2xl p-5 mb-4 text-[#faf8f5]">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-[11px] text-[#bdb6a8] font-sans uppercase tracking-wide">Invested</div>
            <div className="text-lg font-bold mt-1">{formatCurrency(grandPrincipal)}</div>
          </div>
          <div>
            <div className="text-[11px] text-[#bdb6a8] font-sans uppercase tracking-wide">Current Value</div>
            <div className="text-lg font-bold mt-1">{formatCurrency(grandCurrent || grandPrincipal)}</div>
          </div>
          <div>
            <div className="text-[11px] text-[#bdb6a8] font-sans uppercase tracking-wide">At Maturity</div>
            <div className="text-lg font-bold mt-1">{formatCurrency(grandMaturity)}</div>
          </div>
        </div>
      </div>

      {/* Per-type cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {totals.map(({ type, count, principal, current, maturity }) => {
          const Icon = ICONS[type as keyof typeof ICONS];
          const style = TYPE_STYLES[type];
          const active = filterType === type;
          return (
            <button
              key={type}
              onClick={() => onFilterChange(active ? 'All' : type)}
              className="text-left rounded-xl p-3.5 border transition-colors"
              style={{
                background: active ? style.bg : '#fff',
                borderColor: active ? style.color : '#ece6da',
                borderWidth: active ? 1.5 : 1,
              }}
            >
              <div className="flex items-center gap-1.5 mb-2" style={{ color: style.color }}>
                <Icon size={15} />
                <span className="text-xs font-semibold font-sans">{type}</span>
              </div>
              <div className="text-base font-bold">{count}</div>
              <div className="text-[11px] text-[#9a9184] font-sans mt-1">
                {formatCurrency(current || principal)}
                {maturity > 0 && <span> → {formatCurrency(maturity)}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
