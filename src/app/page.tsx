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
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-neutral-950 to-neutral-950" />
        <div className="relative mx-auto max-w-3xl text-center animate-fade-up">
          <p className="mb-4 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-400">
            Every round you play gives back
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Play your game.<br />
            <span className="text-emerald-400">Change someone's.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-400">
            Log your scores, enter the monthly draw, and turn every subscription
            into real support for a charity you choose. No clubhouse required.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-emerald-500 px-8 py-3 font-semibold text-neutral-950 transition hover:bg-emerald-400"
            >
              Get Started
            </Link>
            <Link
              href="/charities"
              className="rounded-full border border-neutral-700 px-8 py-3 font-semibold text-neutral-200 transition hover:border-neutral-500"
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
              { step: '01', title: 'Subscribe', body: 'Pick monthly or yearly. A share of every payment funds the prize pool and your chosen charity.' },
              { step: '02', title: 'Log your scores', body: 'Enter your last 5 rounds in Stableford format. That\u2019s your entry into the monthly draw.' },
              { step: '03', title: 'Win & give', body: 'Match 3, 4, or 5 numbers to win a share of the pool — while your charity keeps earning too.' },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
                <span className="text-sm font-bold text-emerald-400">{item.step}</span>
                <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
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
                  className="group rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 transition hover:border-emerald-500/50"
                >
                  <h3 className="text-lg font-semibold group-hover:text-emerald-400">{c.name}</h3>
                  <p className="mt-2 text-sm text-neutral-400 line-clamp-3">{c.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <h2 className="text-3xl font-bold">Your next round could change a life.</h2>
        <Link
          href="/signup"
          className="mt-8 inline-block rounded-full bg-emerald-500 px-8 py-3 font-semibold text-neutral-950 transition hover:bg-emerald-400"
        >
          Join FairwayGives
        </Link>
      </section>
    </main>
  )
}
