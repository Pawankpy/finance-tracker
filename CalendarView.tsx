'use client';

import { useState, useMemo } from 'react';
import { FinancialItem, TYPE_STYLES } from '@/lib/types';
import { formatDate, daysUntil, urgencyLabel } from '@/lib/format';
import { ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';

interface CalEvent {
  item: FinancialItem;
  eventDate: string;
  eventType: 'Maturity' | 'Payment Due';
}

export default function CalendarView({
  items,
  onEdit,
}: {
  items: FinancialItem[];
  onEdit: (item: FinancialItem) => void;
}) {
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const events: CalEvent[] = useMemo(() => {
    const list: CalEvent[] = [];
    items.forEach((item) => {
      if (item.maturity_date) list.push({ item, eventDate: item.maturity_date, eventType: 'Maturity' });
      if (item.next_payment_date) list.push({ item, eventDate: item.next_payment_date, eventType: 'Payment Due' });
    });
    return list.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  }, [items]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {};
    events.forEach((e) => {
      if (!map[e.eventDate]) map[e.eventDate] = [];
      map[e.eventDate].push(e);
    });
    return map;
  }, [events]);

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const startWeekday = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function changeMonth(delta: number) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
    setSelectedDay(null);
  }

  const upcoming = events.filter((e) => daysUntil(e.eventDate) >= -3).slice(0, 8);

  return (
    <div>
      <div className="flex items-center justify-between mb-3.5">
        <button onClick={() => changeMonth(-1)} className="bg-white border border-[#ece6da] rounded-lg p-2"><ChevronLeft size={16} /></button>
        <span className="font-bold text-base">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
        <button onClick={() => changeMonth(1)} className="bg-white border border-[#ece6da] rounded-lg p-2"><ChevronRight size={16} /></button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1.5 font-sans">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[11px] font-semibold text-[#9a9184] py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, idx) => {
          if (d === null) return <div key={idx} />;
          const dateKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dayEvents = eventsByDate[dateKey] || [];
          const isToday = dateKey === todayStr;
          const isSelected = selectedDay === dateKey;

          return (
            <button
              key={idx}
              onClick={() => setSelectedDay(dayEvents.length ? dateKey : null)}
              className="min-h-[56px] rounded-lg p-1 text-left relative flex flex-col gap-0.5"
              style={{
                border: isToday ? '1.5px solid #6b8a7a' : '1px solid #ece6da',
                background: isSelected ? '#f4f1ec' : '#fff',
              }}
            >
              <span className="font-sans text-[11px]" style={{ color: isToday ? '#6b8a7a' : '#9a9184', fontWeight: isToday ? 700 : 500 }}>{d}</span>
              {dayEvents.slice(0, 3).map((e, i) => (
                <div key={i} className="w-[5px] h-[5px] rounded-full absolute" style={{ background: TYPE_STYLES[e.item.type].color, bottom: 5 + i * 7, left: 6 }} />
              ))}
              {dayEvents.length > 0 && (
                <span className="font-sans text-[9px] text-[#6b6354] mt-auto">{dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay && eventsByDate[selectedDay] && (
        <div className="mt-4 bg-white border border-[#ece6da] rounded-xl p-4">
          <div className="font-bold text-sm mb-2.5">{formatDate(selectedDay)}</div>
          {eventsByDate[selectedDay].map((e, i) => (
            <div key={i} className="flex justify-between items-center py-2" style={{ borderTop: i > 0 ? '1px solid #f0ebe1' : 'none' }}>
              <div>
                <span className="font-semibold text-[13.5px]">{e.item.name}</span>
                <span className="font-sans text-xs text-[#9a9184] ml-2">{e.eventType} · {e.item.type}</span>
              </div>
              <button onClick={() => onEdit(e.item)} style={{ color: TYPE_STYLES[e.item.type].color }}><Edit2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <div className="font-sans text-xs font-bold text-[#9a9184] uppercase tracking-wide mb-2.5">Upcoming</div>
        <div className="flex flex-col gap-2">
          {upcoming.map((e, i) => {
            const days = daysUntil(e.eventDate);
            const urgency = urgencyLabel(days);
            return (
              <div key={i} className="flex justify-between items-center bg-white border border-[#ece6da] rounded-lg px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-[7px] h-[7px] rounded-full" style={{ background: TYPE_STYLES[e.item.type].color }} />
                  <div>
                    <span className="font-semibold text-[13.5px]">{e.item.name}</span>
                    <span className="font-sans text-xs text-[#9a9184] ml-2">{e.eventType} · {formatDate(e.eventDate)}</span>
                  </div>
                </div>
                <span className="font-sans text-[11px] font-semibold" style={{ color: urgency.color }}>{urgency.text}</span>
              </div>
            );
          })}
          {upcoming.length === 0 && <p className="font-sans text-[13px] text-[#9a9184] py-2.5">No upcoming dates.</p>}
        </div>
      </div>
    </div>
  );
}
