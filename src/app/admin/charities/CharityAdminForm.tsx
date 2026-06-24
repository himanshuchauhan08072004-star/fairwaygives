'use client'

import { useState } from 'react'
import type { Charity } from '@/lib/types'

export default function CharityAdminForm({ charities: initial }: { charities: Charity[] }) {
  const [charities, setCharities] = useState(initial)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [featured, setFeatured] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/admin/charities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, category, is_featured: featured }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(data.error)
      return
    }
    setCharities([data.charity, ...charities])
    setName(''); setDescription(''); setCategory(''); setFeatured(false)
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/charities/${id}`, { method: 'DELETE' })
    if (res.ok) setCharities(charities.filter((c) => c.id !== id))
  }

  async function toggleActive(id: string, isActive: boolean) {
    const res = await fetch(`/api/admin/charities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })
    if (res.ok) {
      setCharities(charities.map((c) => (c.id === id ? { ...c, is_active: !isActive } : c)))
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleAdd} className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h2 className="font-semibold">Add a charity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            placeholder="Name" required value={name} onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
          />
          <input
            placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
          />
        </div>
        <textarea
          placeholder="Description" required value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2"
          rows={3}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Feature on homepage
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit" disabled={saving}
          className="rounded-lg bg-amber-500 px-5 py-2 font-semibold text-neutral-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {saving ? 'Adding...' : 'Add charity'}
        </button>
      </form>

      <div className="space-y-3">
        {charities.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
            <div>
              <p className="font-medium">
                {c.name} {c.is_featured && <span className="text-xs text-amber-400">★ Featured</span>}
                {!c.is_active && <span className="ml-2 text-xs text-neutral-500">(inactive)</span>}
              </p>
              <p className="text-sm text-neutral-400">{c.category}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => toggleActive(c.id, c.is_active)} className="text-sm text-neutral-400 hover:text-neutral-200">
                {c.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => handleDelete(c.id)} className="text-sm text-red-400 hover:text-red-300">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
