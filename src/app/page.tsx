import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: featuredCharities } = await supabase
    .from('charities')
    .select('*')
    .eq('is_featured', true)
    .eq('is_active', true)
    .limit(3)

  return (
    <main className="min-h-screen overflow-hidden">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-neutral-950 to-neutral-950" />
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl animate-pulse-slow" />
        <div className="absolute -left-20 top-40 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -right-20 top-60 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-block animate-fade-up rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-400">
            ⛳ Every round you play gives back
          </p>
          <h1 className="animate-fade-up text-4xl font-bold tracking-tight sm:text-6xl" style={{ animationDelay: '0.1s' }}>
            Play your game.<br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-300 bg-clip-text text-transparent">
              Change someone's.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl animate-fade-up text-lg text-neutral-400" style={{ animationDelay: '0.2s' }}>
            Log your scores, enter the monthly draw, and turn every subscription
            into real support for a charity you choose. No clubhouse required.
          </p>
          <div className="mt-10 flex animate-fade-up justify-center gap-4" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/signup"
              className="group relative overflow-hidden rounded-full bg-emerald-500 px-8 py-3 font-semibold text-neutral-950 transition-transform hover:scale-105"
            >
              <span className="relative z-10">Get Started</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-emerald-400 to-amber-300 transition-transform duration-300 group-hover:translate-x-0" />
            </Link>
            <Link
              href="/charities"
              className="rounded-full border border-neutral-700 px-8 py-3 font-semibold text-neutral-200 transition-all hover:scale-105 hover:border-amber-400 hover:text-amber-300"
            >
              See the Charities
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold">How it works</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { step: '01', title: 'Subscribe', body: 'Pick monthly or yearly. A share of every payment funds the prize pool and your chosen charity.', color: 'emerald', icon: '💳' },
              { step: '02', title: 'Log your scores', body: 'Enter your last 5 rounds in Stableford format. That\u2019s your entry into the monthly draw.', color: 'sky', icon: '⛳' },
              { step: '03', title: 'Win & give', body: 'Match 3, 4, or 5 numbers to win a share of the pool — while your charity keeps earning too.', color: 'amber', icon: '🏆' },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`group rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-900/40 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-${item.color}-500/50 hover:shadow-lg hover:shadow-${item.color}-500/10`}
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm font-bold text-emerald-400">{item.step}</span>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                </div>
                <p className="mt-2 text-neutral-400">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured charities */}
      {featuredCharities && featuredCharities.length > 0 && (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold">Charities making an impact</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {featuredCharities.map((c) => (
                <Link
                  key={c.id}
                  href={`/charities/${c.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-900/40 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl transition-opacity group-hover:opacity-150" />
                  <h3 className="relative text-lg font-semibold transition-colors group-hover:text-emerald-400">{c.name}</h3>
                  <p className="relative mt-2 text-sm text-neutral-400 line-clamp-3">{c.description}</p>
                  <span className="relative mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100">
                    Learn more →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative px-6 py-24 text-center">
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <h2 className="relative text-3xl font-bold">Your next round could change a life.</h2>
        <Link
          href="/signup"
          className="relative mt-8 inline-block rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-8 py-3 font-semibold text-neutral-950 transition-transform hover:scale-105"
        >
          Join FairwayGives
        </Link>
      </section>
    </main>
  )
}
