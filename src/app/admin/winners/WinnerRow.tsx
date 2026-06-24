'use client'

import { useState } from 'react'

export default function WinnerRow({ winner }: { winner: any }) {
  const [status, setStatus] = useState(winner.status)
  const [saving, setSaving] = useState(false)

  async function updateStatus(newStatus: string) {
    setSaving(true)
    const res = await fetch(`/api/winners/${winner.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setSaving(false)
    if (res.ok) setStatus(newStatus)
  }

  return (
    <tr className="border-b border-neutral-800/50">
      <td className="px-6 py-3">{winner.profiles?.full_name || '—'}</td>
      <td className="px-6 py-3">
        {new Date(winner.draws?.draw_month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
      </td>
      <td className="px-6 py-3">{winner.tier}</td>
      <td className="px-6 py-3">${Number(winner.amount).toFixed(2)}</td>
      <td className="px-6 py-3">
        {winner.proof_url ? (
          <a href={winner.proof_url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
            View
          </a>
        ) : (
          <span className="text-neutral-500">None</span>
        )}
      </td>
      <td className="px-6 py-3">
        <span className={
          status === 'paid' ? 'text-emerald-400' : status === 'rejected' ? 'text-red-400' : 'text-amber-400'
        }>
          {status}
        </span>
      </td>
      <td className="px-6 py-3 text-right">
        {status === 'pending' && (
          <div className="flex justify-end gap-3">
            <button disabled={saving} onClick={() => updateStatus('paid')} className="text-xs text-emerald-400 hover:underline disabled:opacity-50">
              Mark paid
            </button>
            <button disabled={saving} onClick={() => updateStatus('rejected')} className="text-xs text-red-400 hover:underline disabled:opacity-50">
              Reject
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}
