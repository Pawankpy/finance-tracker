'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { saveApiKey } from '@/lib/actions/items';
import { createClient } from '@/lib/supabase/client';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    if (!apiKey.trim().startsWith('sk-ant-')) {
      setError('That doesn\'t look like a valid Anthropic API key (should start with "sk-ant-").');
      return;
    }
    setSaving(true);
    try {
      await saveApiKey(apiKey.trim());
      setSaved(true);
      setTimeout(onClose, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save key.');
    }
    setSaving(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="fixed inset-0 bg-black/45 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-[#faf8f5] rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 font-sans">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold font-serif">Settings</h2>
          <button onClick={onClose} className="text-[#9a9184]"><X size={20} /></button>
        </div>

        <label className="block text-xs font-semibold text-[#6b6354] mb-1.5">
          Anthropic API key (for document auto-extraction)
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          className="w-full px-2.5 py-2 rounded-lg border border-[#ddd4c4] text-sm mb-1.5"
        />
        <p className="text-[11px] text-[#9a9184] mb-3">
          Get a key at console.anthropic.com → API Keys. Stored securely and only used to read your uploaded receipts/PDFs.
        </p>

        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
        {saved && <p className="text-xs text-[#6b8a7a] mb-3">Saved!</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-[#3d3a32] text-[#faf8f5] font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2 mb-4"
        >
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Key'}
        </button>

        <div className="border-t border-[#ece6da] pt-4">
          <button onClick={handleSignOut} className="text-xs text-[#a14545] font-medium">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
