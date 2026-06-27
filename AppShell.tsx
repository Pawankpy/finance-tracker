'use client';

import { useState, useEffect, useCallback } from 'react';
import { FinancialItem } from '@/lib/types';
import { getItems } from '@/lib/actions/items';
import SummaryDashboard from '@/components/SummaryDashboard';
import ItemList from '@/components/ItemList';
import CalendarView from '@/components/CalendarView';
import ItemFormModal from '@/components/ItemFormModal';
import ExcelImportModal from '@/components/ExcelImportModal';
import SettingsModal from '@/components/SettingsModal';
import { Plus, List, Calendar as CalendarIcon, FileSpreadsheet, Settings, Wallet } from 'lucide-react';

export default function AppShell() {
  const [items, setItems] = useState<FinancialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [filterType, setFilterType] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialItem | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getItems();
      setItems(data as FinancialItem[]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  function openAdd() {
    setEditingItem(null);
    setShowForm(true);
  }

  function openEdit(item: FinancialItem) {
    setEditingItem(item);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingItem(null);
  }

  async function handleSaved() {
    closeForm();
    await refresh();
  }

  const filteredItems = filterType === 'All' ? items : items.filter((i) => i.type === filterType);

  return (
    <div className="font-serif min-h-screen bg-[#faf8f5] text-[#2b2620]">
      <div className="max-w-3xl mx-auto px-5 py-8 pb-24">
        {/* Header */}
        <div className="flex justify-between items-start mb-7 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3d3a32] flex items-center justify-center flex-shrink-0">
              <Wallet size={18} className="text-[#faf8f5]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">My Financial Calendar</h1>
              <p className="font-sans text-[12px] text-[#8a8175]">Policies, FDs, RDs &amp; Mutual Funds in one place</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(true)} className="bg-white border border-[#ece6da] rounded-lg p-2.5 text-[#6b6354]">
              <Settings size={16} />
            </button>
            <button onClick={() => setShowExcelImport(true)} className="font-sans flex items-center gap-1.5 bg-white border border-[#ece6da] rounded-lg px-3 py-2.5 text-xs font-semibold text-[#6b6354]">
              <FileSpreadsheet size={14} /> Import Excel
            </button>
            <button onClick={openAdd} className="font-sans flex items-center gap-1.5 bg-[#3d3a32] text-[#faf8f5] rounded-lg px-3.5 py-2.5 text-xs font-semibold">
              <Plus size={14} /> Add
            </button>
          </div>
        </div>

        {!loading && <SummaryDashboard items={items} filterType={filterType} onFilterChange={setFilterType} />}

        {/* View toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="font-sans flex gap-1 bg-[#efe9dd] rounded-lg p-0.5">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-semibold"
              style={{ background: view === 'list' ? '#fff' : 'transparent', color: view === 'list' ? '#3d3a32' : '#9a9184' }}
            >
              <List size={14} /> List
            </button>
            <button
              onClick={() => setView('calendar')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-semibold"
              style={{ background: view === 'calendar' ? '#fff' : 'transparent', color: view === 'calendar' ? '#3d3a32' : '#9a9184' }}
            >
              <CalendarIcon size={14} /> Calendar
            </button>
          </div>
          {filterType !== 'All' && (
            <button onClick={() => setFilterType('All')} className="font-sans text-xs text-[#8a8175] underline">
              Clear filter ({filterType})
            </button>
          )}
        </div>

        {loading ? (
          <div className="font-sans text-center py-16 text-[#9a9184]">Loading your data…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 px-5 bg-white rounded-2xl border border-dashed border-[#ddd4c4]">
            <p className="font-sans text-sm text-[#8a8175] mb-4">Nothing tracked yet. Add your first item or import from Excel.</p>
            <button onClick={openAdd} className="font-sans bg-[#3d3a32] text-[#faf8f5] rounded-lg px-4 py-2.5 text-sm font-semibold">
              + Add Item
            </button>
          </div>
        ) : view === 'list' ? (
          <ItemList items={filteredItems} onEdit={openEdit} onDeleted={refresh} />
        ) : (
          <CalendarView items={filteredItems} onEdit={openEdit} />
        )}
      </div>

      {showForm && <ItemFormModal item={editingItem} onClose={closeForm} onSaved={handleSaved} />}
      {showExcelImport && <ExcelImportModal onClose={() => setShowExcelImport(false)} onImported={() => { setShowExcelImport(false); refresh(); }} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
