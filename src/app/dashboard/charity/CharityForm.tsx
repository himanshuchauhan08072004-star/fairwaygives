'use client'

import { useState } from 'react'
import type { Charity } from '@/lib/types'

export default function CharityForm({
  charities,
  currentCharityId,
  currentPct,
}: {
  charities: Charity[]
  currentCharityId: string | null
  currentPct: number
}) {
  const [selected, setSelected] = useState(currentCharityId ?? '')
  const [pct, setPct] = useState(currentPct)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    const res = await fetch('/api/charity/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ charity_id: selected, contribution_pct: pct }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error)
      return
    }
    setSaved(true)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {charities.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={`rounded-2xl border p-5 text-left transition ${
              selected === c.id
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-600'
            }`}
          >
            <h3 className="font-semibold">{c.name}</h3>
            <p className="mt-1 text-sm text-neutral-400 line-clamp-2">{c.description}</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
        <label className="block text-sm font-medium text-neutral-300">
          Contribution percentage: {pct}%
        </label>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={pct}
          onChange={(e) => setPct(Number(e.target.value))}
          className="mt-3 w-full"
        />
        <p className="mt-2 text-xs text-neutral-500">Minimum 10%. Increase anytime — no upper limit.</p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && <p className="text-sm text-emerald-400">Saved.</p>}

      <button
        onClick={handleSave}
        disabled={!selected || saving}
        className="rounded-lg bg-emerald-500 px-6 py-2 font-semibold text-neutral-950 hover:bg-emerald-400 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save selection'}
      </button>
    </div>
  )
}
