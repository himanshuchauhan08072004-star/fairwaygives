'use client'

import { useState } from 'react'

export default function SubscribePage() {
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubscribe(plan: 'monthly' | 'yearly') {
    setLoading(plan)
    setError(null)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      setLoading(null)
      return
    }
    window.location.href = data.url
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-20">
      <h1 className="text-3xl font-bold">Choose your plan</h1>
      <p className="mt-2 text-neutral-400">Cancel anytime. A share of every payment funds the prize pool and your charity.</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8">
          <h2 className="text-lg font-semibold">Monthly</h2>
          <p className="mt-4 text-3xl font-bold">$9<span className="text-base text-neutral-400">/mo</span></p>
          <button
            onClick={() => handleSubscribe('monthly')}
            disabled={loading !== null}
            className="mt-6 w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-neutral-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading === 'monthly' ? 'Redirecting...' : 'Subscribe monthly'}
          </button>
        </div>

        <div className="rounded-2xl border border-emerald-500/50 bg-emerald-500/5 p-8">
          <h2 className="text-lg font-semibold">Yearly <span className="text-sm text-emerald-400">Save 20%</span></h2>
          <p className="mt-4 text-3xl font-bold">$86<span className="text-base text-neutral-400">/yr</span></p>
          <button
            onClick={() => handleSubscribe('yearly')}
            disabled={loading !== null}
            className="mt-6 w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-neutral-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading === 'yearly' ? 'Redirecting...' : 'Subscribe yearly'}
          </button>
        </div>
      </div>

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}
    </main>
  )
}
