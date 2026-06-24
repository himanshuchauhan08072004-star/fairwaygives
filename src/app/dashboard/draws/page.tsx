import { createClient } from '@/lib/supabase/server'

export default async function DrawsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: publishedDraws } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'published')
    .order('draw_month', { ascending: false })
    .limit(12)

  const { data: myEntries } = await supabase
    .from('draw_entries')
    .select('*, draws(draw_month, winning_numbers, status)')
    .eq('user_id', user.id)

  const entryByDraw = new Map((myEntries ?? []).map((e) => [e.draw_id, e]))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Monthly Draws</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Log 5 scores each month to automatically enter. Your draw numbers come from your latest scores.
        </p>
      </div>

      <div className="space-y-4">
        {(publishedDraws ?? []).length === 0 && (
          <p className="text-neutral-400">No draws have been published yet.</p>
        )}
        {(publishedDraws ?? []).map((draw) => {
          const myEntry = entryByDraw.get(draw.id)
          return (
            <div key={draw.id} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {new Date(draw.draw_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <span className="text-sm text-neutral-400">Pool: ${Number(draw.total_pool).toFixed(2)}</span>
              </div>
              <div className="mt-3 flex gap-2">
                {draw.winning_numbers.map((n: number) => (
                  <span key={n} className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-medium text-emerald-400">
                    {n}
                  </span>
                ))}
              </div>
              {myEntry ? (
                <p className="mt-3 text-sm text-neutral-300">
                  Your numbers: {myEntry.entry_numbers.join(', ')} —{' '}
                  {myEntry.tier ? (
                    <span className="font-medium text-emerald-400">{myEntry.match_count} matches, {myEntry.tier}!</span>
                  ) : (
                    <span>{myEntry.match_count} matches</span>
                  )}
                </p>
              ) : (
                <p className="mt-3 text-sm text-neutral-500">You weren't entered in this draw.</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
