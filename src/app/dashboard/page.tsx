import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

 const [
    { data: profile },
    { data: subscription, error: subError },
    { data: scores },
    { data: charity },
    { data: winnings },
  ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('scores').select('*').eq('user_id', user.id).order('played_on', { ascending: false }),
      supabase.from('profiles').select('charity_id, charity_contribution_pct, charities(name)').eq('id', user.id).single(),
      supabase.from('winners').select('*').eq('user_id', user.id),
    ])

  if (subError) console.error('Dashboard subscription query error:', subError)

  const isActive = subscription?.status === 'active'
  const totalWon = (winnings ?? []).reduce((sum, w) => sum + Number(w.amount), 0)
  const pendingPayouts = (winnings ?? []).filter((w) => w.status === 'pending').length

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Your Dashboard</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Subscription status */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
          <h2 className="text-sm font-medium text-neutral-400">Subscription</h2>
          <p className="mt-2 text-xl font-semibold">
            {subscription ? (
              <span className={isActive ? 'text-emerald-400' : 'text-amber-400'}>
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </span>
            ) : (
              <span className="text-neutral-500">No subscription</span>
            )}
          </p>
          {subscription?.current_period_end && (
            <p className="mt-1 text-sm text-neutral-400">
              Renews {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          )}
          {!isActive && (
            <Link href="/subscribe" className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:underline">
              {subscription ? 'Reactivate' : 'Subscribe now'} →
            </Link>
          )}
        </div>

        {/* Charity */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
          <h2 className="text-sm font-medium text-neutral-400">Your Charity</h2>
          <p className="mt-2 text-xl font-semibold">
            {(charity as any)?.charities?.name ?? 'Not selected'}
          </p>
          <p className="mt-1 text-sm text-neutral-400">
            Contributing {profile?.charity_contribution_pct ?? 10}% of your subscription
          </p>
          <Link href="/dashboard/charity" className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:underline">
            Manage →
          </Link>
        </div>

        {/* Scores */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
          <h2 className="text-sm font-medium text-neutral-400">Latest Scores</h2>
          <p className="mt-2 text-xl font-semibold">{scores?.length ?? 0} / 5 logged</p>
          <p className="mt-1 text-sm text-neutral-400">
            {scores && scores.length >= 5 ? 'You\u2019re entered in this month\u2019s draw' : 'Log 5 scores to enter the draw'}
          </p>
          <Link href="/dashboard/scores" className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:underline">
            Manage scores →
          </Link>
        </div>

        {/* Winnings */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
          <h2 className="text-sm font-medium text-neutral-400">Winnings</h2>
          <p className="mt-2 text-xl font-semibold text-emerald-400">${totalWon.toFixed(2)}</p>
          <p className="mt-1 text-sm text-neutral-400">
            {pendingPayouts > 0 ? `${pendingPayouts} payout(s) pending` : 'No pending payouts'}
          </p>
          <Link href="/dashboard/draws" className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:underline">
            View draws →
          </Link>
        </div>
      </div>
    </div>
  )
}
