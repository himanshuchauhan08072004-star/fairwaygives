'use client'

import { useState } from 'react'
import type { Draw } from '@/lib/types'

export default function DrawManager({
  draws,
  activeSubscriberCount,
}: {
  draws: Draw[]
  activeSubscriberCount: number
}) {
  const [logicType, setLogicType] = useState<'random' | 'algorithmic'>('random')
  const [poolPerSub, setPoolPerSub] = useState(3) // $ contributed to pool per subscriber
  const [creating, setCreating] = useState(false)
  const [simResult, setSimResult] = useState<any | null>(null)
  const [simLoading, setSimLoading] = useState<string | null>(null)
  const [publishLoading, setPublishLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setCreating(true)
    setError(null)
    const res = await fetch('/api/draws/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logic_type: logicType, pool_per_subscriber: poolPerSub }),
    })
    const data = await res.json()
    setCreating(false)
    if (!res.ok) {
      setError(data.error)
      return
    }
    window.location.reload()
  }

  async function handleSimulate(drawId: string) {
    setSimLoading(drawId)
    setError(null)
    const res = await fetch(`/api/draws/${drawId}/simulate`, { method: 'POST' })
    const data = await res.json()
    setSimLoading(null)
    if (!res.ok) {
      setError(data.error)
      return
    }
    setSimResult({ drawId, ...data })
  }

  async function handlePublish(drawId: string) {
    setPublishLoading(drawId)
    setError(null)
    const res = await fetch(`/api/draws/${drawId}/publish`, { method: 'POST' })
    const data = await res.json()
    setPublishLoading(null)
    if (!res.ok) {
      setError(data.error)
      return
    }
    window.location.reload()
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="font-semibold">Create this month's draw</h2>
        <p className="mt-1 text-sm text-neutral-400">{activeSubscriberCount} active subscribers will be eligible.</p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm text-neutral-400">Logic</label>
            <select
              value={logicType}
              onChange={(e) => setLogicType(e.target.value as 'random' | 'algorithmic')}
              className="mt-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
            >
              <option value="random">Random</option>
              <option value="algorithmic">Algorithmic (weighted by frequency)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-400">Pool $ per subscriber</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={poolPerSub}
              onChange={(e) => setPoolPerSub(Number(e.target.value))}
              className="mt-1 w-32 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="rounded-lg bg-amber-500 px-5 py-2 font-semibold text-neutral-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create draw'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-4">
        {draws.map((draw) => (
          <div key={draw.id} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  {new Date(draw.draw_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <p className="text-sm text-neutral-400">
                  {draw.logic_type} · {draw.status} · pool ${Number(draw.total_pool).toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2">
                {draw.status !== 'published' && (
                  <button
                    onClick={() => handleSimulate(draw.id)}
                    disabled={simLoading === draw.id}
                    className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500 disabled:opacity-50"
                  >
                    {simLoading === draw.id ? 'Simulating...' : 'Simulate'}
                  </button>
                )}
                {draw.status !== 'published' && (
                  <button
                    onClick={() => handlePublish(draw.id)}
                    disabled={publishLoading === draw.id}
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {publishLoading === draw.id ? 'Publishing...' : 'Publish'}
                  </button>
                )}
              </div>
            </div>

            {draw.status === 'published' && draw.winning_numbers.length > 0 && (
              <div className="mt-3 flex gap-2">
                {draw.winning_numbers.map((n) => (
                  <span key={n} className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm text-emerald-400">
                    {n}
                  </span>
                ))}
              </div>
            )}

            {simResult?.drawId === draw.id && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <p className="text-sm font-medium text-amber-400">Simulation preview (not saved)</p>
                <p className="mt-2 text-sm">Winning numbers: {simResult.winningNumbers.join(', ')}</p>
                <p className="text-sm">Entries scored: {simResult.scoredEntries.length}</p>
                <p className="text-sm">Payouts: {simResult.payouts.length}</p>
                {simResult.jackpotRollsOver && (
                  <p className="text-sm text-amber-400">No 5-match winner — jackpot will roll over.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
