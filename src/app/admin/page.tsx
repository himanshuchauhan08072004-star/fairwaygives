import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminOverviewPage() {
  const supabase = createAdminClient()

  const [{ count: totalUsers }, { count: activeSubs }, { data: draws }, { data: donations }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('draws').select('total_pool, status'),
    supabase.from('donations').select('amount'),
  ])

  const totalPool = (draws ?? []).reduce((sum, d) => sum + Number(d.total_pool), 0)
  const charityTotal = (donations ?? []).reduce((sum, d) => sum + Number(d.amount), 0)
  const publishedDraws = (draws ?? []).filter((d) => d.status === 'published').length

  const stats = [
    { label: 'Total users', value: totalUsers ?? 0 },
    { label: 'Active subscribers', value: activeSubs ?? 0 },
    { label: 'Total prize pool (all-time)', value: `$${totalPool.toFixed(2)}` },
    { label: 'Charity contributions (all-time)', value: `$${charityTotal.toFixed(2)}` },
    { label: 'Published draws', value: publishedDraws },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin Overview</h1>
      <div className="grid gap-6 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
            <p className="text-sm text-neutral-400">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-amber-400">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
