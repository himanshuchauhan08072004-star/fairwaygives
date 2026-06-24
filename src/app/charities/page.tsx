import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function CharitiesPage() {
  const supabase = await createClient()
  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('name')

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold">Charities</h1>
      <p className="mt-2 text-neutral-400">Every charity here is supported directly by FairwayGives subscribers.</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {(charities ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/charities/${c.slug}`}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 transition hover:border-emerald-500/50"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{c.name}</h2>
              {c.is_featured && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">Featured</span>
              )}
            </div>
            {c.category && <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">{c.category}</p>}
            <p className="mt-3 text-sm text-neutral-400">{c.description}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
