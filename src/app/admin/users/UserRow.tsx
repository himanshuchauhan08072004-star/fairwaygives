'use client'

import { useState } from 'react'

export default function UserRow({ profile }: { profile: any }) {
  const [role, setRole] = useState(profile.role)
  const [saving, setSaving] = useState(false)

  async function toggleRole() {
    const newRole = role === 'admin' ? 'subscriber' : 'admin'
    setSaving(true)
    const res = await fetch(`/api/admin/users/${profile.id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    setSaving(false)
    if (res.ok) setRole(newRole)
  }

  const sub = profile.subscriptions?.[0]

  return (
    <tr className="border-b border-neutral-800/50">
      <td className="px-6 py-3">{profile.full_name || '—'}</td>
      <td className="px-6 py-3">
        <span className={role === 'admin' ? 'text-amber-400' : 'text-neutral-300'}>{role}</span>
      </td>
      <td className="px-6 py-3">
        {sub ? `${sub.plan} (${sub.status})` : 'None'}
      </td>
      <td className="px-6 py-3 text-right">
        <button
          onClick={toggleRole}
          disabled={saving}
          className="text-xs text-neutral-400 hover:text-amber-400 disabled:opacity-50"
        >
          {role === 'admin' ? 'Revoke admin' : 'Make admin'}
        </button>
      </td>
    </tr>
  )
}
