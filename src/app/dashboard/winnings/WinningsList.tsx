'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function WinningsList({ winners }: { winners: any[] }) {
  const supabase = createClient()
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localProofs, setLocalProofs] = useState<Record<string, string>>({})

  async function handleUpload(winnerId: string, file: File) {
    setUploading(winnerId)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const path = `${user.id}/${winnerId}-${Date.now()}-${file.name}`
    const { error: uploadErr } = await supabase.storage.from('winner-proofs').upload(path, file)

    if (uploadErr) {
      setUploading(null)
      setError(uploadErr.message)
      return
    }

    const { data: urlData } = supabase.storage.from('winner-proofs').getPublicUrl(path)

    const res = await fetch(`/api/winners/${winnerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof_url: urlData.publicUrl }),
    })

    setUploading(null)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error)
      return
    }
    setLocalProofs((prev) => ({ ...prev, [winnerId]: urlData.publicUrl }))
  }

  if (winners.length === 0) {
    return <p className="text-neutral-400">No winnings yet — keep logging scores and entering draws.</p>
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {winners.map((w) => {
        const proofUrl = localProofs[w.id] ?? w.proof_url
        return (
          <div key={w.id} className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
            <div>
              <p className="font-medium">
                {w.tier} — ${Number(w.amount).toFixed(2)}
              </p>
              <p className="text-sm text-neutral-400">
                {new Date(w.draws?.draw_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ·{' '}
                <span className={
                  w.status === 'paid' ? 'text-emerald-400' : w.status === 'rejected' ? 'text-red-400' : 'text-amber-400'
                }>
                  {w.status}
                </span>
              </p>
            </div>
            <div>
              {proofUrl ? (
                <a href={proofUrl} target="_blank" rel="noreferrer" className="text-sm text-emerald-400 hover:underline">
                  Proof uploaded
                </a>
              ) : (
                <label className="cursor-pointer rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:border-neutral-500">
                  {uploading === w.id ? 'Uploading...' : 'Upload proof'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(w.id, file)
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
