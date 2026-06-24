'use client'

import { useEffect, useState } from 'react'
function formatDate(dateStr: string) {
     const [year, month, day] = dateStr.split('-').map(Number)
     return `${day}/${month}/${year}`
   }

interface ScoreRow {
  id: string
  score: number
  played_on: string
}

export default function ScoresPage() {
  const [scores, setScores] = useState<ScoreRow[]>([])
  const [newScore, setNewScore] = useState('')
  const [newDate, setNewDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/scores')
    const data = await res.json()
    if (res.ok) setScores(data.scores)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: Number(newScore), played_on: newDate }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      return
    }
    setScores(data.scores)
    setNewScore('')
    setNewDate('')
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/scores/${id}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  async function handleEditSave(id: string) {
    const res = await fetch(`/api/scores/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: Number(editValue) }),
    })
    if (res.ok) {
      setEditingId(null)
      load()
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Your Scores</h1>
        <p className="mt-1 text-sm text-neutral-400">
         Log your last 5 rounds (Stableford, 1-45). Adding a 6th score automatically drops your oldest. One score per date.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
        <div>
         <label className="block text-sm text-neutral-400">Score (1-45)</label>
          <input
            type="number"
            min={1}
            max={45}
            required
            value={newScore}
            onChange={(e) => setNewScore(e.target.value)}
            className="mt-1 w-28 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400">Date played</label>
          <input
            type="date"
            required
            value={newDate}
            max={new Date().toISOString().slice(0, 10)}
            min="2020-01-01"
            onChange={(e) => setNewDate(e.target.value)}
            className="mt-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:border-emerald-500"
          />
        </div>
        <button type="submit" className="rounded-lg bg-emerald-500 px-5 py-2 font-semibold text-neutral-950 hover:bg-emerald-400">
          Add score
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50">
        {loading ? (
          <p className="p-6 text-neutral-400">Loading...</p>
        ) : scores.length === 0 ? (
          <p className="p-6 text-neutral-400">No scores logged yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800 text-left text-sm text-neutral-400">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s) => (
                <tr key={s.id} className="border-b border-neutral-800/50">
                  <td className="px-6 py-3">{formatDate(s.played_on)}</td>
                  <td className="px-6 py-3">
                    {editingId === s.id ? (
                      <input
                        type="number"
                        min={1}
                        max={45}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-20 rounded border border-neutral-700 bg-neutral-900 px-2 py-1"
                      />
                    ) : (
                      s.score
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    {editingId === s.id ? (
                      <button onClick={() => handleEditSave(s.id)} className="text-sm text-emerald-400 hover:underline">
                        Save
                      </button>
                    ) : (
                      <div className="flex justify-end gap-4">
                        <button
                          onClick={() => { setEditingId(s.id); setEditValue(String(s.score)) }}
                          className="text-sm text-neutral-400 hover:text-neutral-200"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="text-sm text-red-400 hover:text-red-300">
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
