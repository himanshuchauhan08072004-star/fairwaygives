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
  const scoreCount = scores?.length ?? 0

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}</h1>
        <p className="mt-1 text-neutral-400">Here's where things stand today.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Subscription status */}
        <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-900/40 p-6 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl transition-opacity group-hover:opacity-150" />
          <div className="relative flex items-start justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-medium text-neutral-400">
                <span className="text-base">💳</span> Subscription
              </h2>
              <p className="mt-3 text-2xl font-bold">
                {subscription ? (
                  <span className={isActive ? 'text-emerald-400' : 'text-amber-400'}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </span>
                ) : (
                  <span className="text-neutral-500">None yet</span>
                )}
              </p>
            </div>
            {isActive && (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
                ● Active
              </span>
            )}
          </div>
          {subscription?.current_period_end && (
            <p className="relative mt-2 text-sm text-neutral-500">
              Renews {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          )}
          {!isActive && (
            <Link href="/subscribe" className="relative mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-400 transition-transform hover:translate-x-0.5">
              {subscription ? 'Reactivate' : 'Subscribe now'} <span aria-hidden>→</span>
            </Link>
          )}
        </div>

        {/* Charity */}
        <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-900/40 p-6 transition-all duration-300 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl transition-opacity group-hover:opacity-150" />
          <h2 className="relative flex items-center gap-2 text-sm font-medium text-neutral-400">
            <span className="text-base">❤️</span> Your Charity
          </h2>
          <p className="relative mt-3 text-2xl font-bold">
            {(charity as any)?.charities?.name ?? <span className="text-neutral-500">Not selected</span>}
          </p>
          <p className="relative mt-2 text-sm text-neutral-500">
            Giving <span className="font-semibold text-amber-400">{profile?.charity_contribution_pct ?? 10}%</span> of your subscription
          </p>
          <Link href="/dashboard/charity" className="relative mt-4 inline-flex items-center gap-1 text-sm font-medium text-amber-400 transition-transform hover:translate-x-0.5">
            Manage <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Scores */}
        <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-900/40 p-6 transition-all duration-300 hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/5">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-500/10 blur-2xl transition-opacity group-hover:opacity-150" />
          <h2 className="relative flex items-center gap-2 text-sm font-medium text-neutral-400">
            <span className="text-base">⛳</span> Latest Scores
          </h2>
          <div className="relative mt-3 flex items-end gap-2">
            <p className="text-2xl font-bold">{scoreCount}<span className="text-base font-normal text-neutral-500"> / 5 logged</span></p>
          </div>
          <div className="relative mt-3 flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i < scoreCount ? 'bg-sky-400' : 'bg-neutral-800'}`}
              />
            ))}
          </div>
          <p className="relative mt-3 text-sm text-neutral-500">
            {scoreCount >= 5 ? "You're entered in this month's draw" : 'Log 5 scores to enter the draw'}
          </p>
          <Link href="/dashboard/scores" className="relative mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky-400 transition-transform hover:translate-x-0.5">
            Manage scores <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Winnings */}
        <div className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-900/40 p-6 transition-all duration-300 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl transition-opacity group-hover:opacity-150" />
          <h2 className="relative flex items-center gap-2 text-sm font-medium text-neutral-400">
            <span className="text-base">🏆</span> Winnings
          </h2>
          <p className="relative mt-3 text-2xl font-bold text-violet-400">${totalWon.toFixed(2)}</p>
          <p className="relative mt-2 text-sm text-neutral-500">
            {pendingPayouts > 0 ? `${pendingPayouts} payout${pendingPayouts > 1 ? 's' : ''} pending` : 'No pending payouts'}
          </p>
          <Link href="/dashboard/draws" className="relative mt-4 inline-flex items-center gap-1 text-sm font-medium text-violet-400 transition-transform hover:translate-x-0.5">
            View draws <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}