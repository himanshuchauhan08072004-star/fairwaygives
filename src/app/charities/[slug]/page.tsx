import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function CharityProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: charity } = await supabase.from('charities').select('*').eq('slug', slug).single()
  if (!charity) notFound()

  const { data: events } = await supabase
    .from('charity_events')
    .select('*')
    .eq('charity_id', charity.id)
    .order('event_date', { ascending: true })

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      {charity.category && (
        <p className="text-sm uppercase tracking-wide text-emerald-400">{charity.category}</p>
      )}
      <h1 className="mt-2 text-3xl font-bold">{charity.name}</h1>
      <p className="mt-4 text-neutral-300">{charity.description}</p>

      {events && events.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Upcoming events</h2>
          <ul className="mt-4 space-y-3">
            {events.map((ev) => (
              <li key={ev.id} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                <p className="font-medium">{ev.title}</p>
                {ev.event_date && (
                  <p className="text-sm text-neutral-400">{new Date(ev.event_date).toLocaleDateString()}</p>
                )}
                {ev.description && <p className="mt-1 text-sm text-neutral-400">{ev.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  )
}
