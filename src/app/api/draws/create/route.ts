import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculatePrizePool } from '@/lib/draws'
import { deriveDrawNumbers } from '@/lib/scores'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { logic_type, pool_per_subscriber } = await req.json()
  if (logic_type !== 'random' && logic_type !== 'algorithmic') {
    return NextResponse.json({ error: 'logic_type must be "random" or "algorithmic"' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const now = new Date()
  const drawMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

  // Check for unclaimed jackpot rollover from the most recent published draw
  const { data: lastDraw } = await supabase
    .from('draws')
    .select('*')
    .eq('status', 'published')
    .order('draw_month', { ascending: false })
    .limit(1)
    .maybeSingle()

  const rollover = lastDraw && !lastDraw.jackpot_claimed ? Number(lastDraw.pool_5match) : 0

  const { count: activeSubs } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const pools = calculatePrizePool(activeSubs ?? 0, Number(pool_per_subscriber) || 0, rollover)

  const { data: draw, error } = await supabase
    .from('draws')
    .insert({
      draw_month: drawMonth,
      logic_type,
      status: 'draft',
      ...pools,
      jackpot_rollover: rollover,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A draw already exists for this month.' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Auto-enter every active subscriber who has 5 scores logged
  const { data: activeSubscriptions } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('status', 'active')

  const entries: { draw_id: string; user_id: string; entry_numbers: number[] }[] = []
  for (const sub of activeSubscriptions ?? []) {
    const numbers = await deriveDrawNumbers(sub.user_id)
    if (numbers) entries.push({ draw_id: draw.id, user_id: sub.user_id, entry_numbers: numbers })
  }

  if (entries.length > 0) {
    await supabase.from('draw_entries').insert(entries)
  }

  return NextResponse.json({ draw, entriesCreated: entries.length })
}
