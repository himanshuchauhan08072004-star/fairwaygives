import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { runDraw } from '@/lib/draws'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const supabase = createAdminClient()

  try {
    const result = await runDraw(id)

    // Persist winning numbers + status on the draw
    await supabase
      .from('draws')
      .update({
        winning_numbers: result.winningNumbers,
        status: 'published',
        published_at: new Date().toISOString(),
        jackpot_claimed: !result.jackpotRollsOver,
      })
      .eq('id', id)

    // Persist match_count/tier on each entry
    for (const entry of result.scoredEntries) {
      await supabase
        .from('draw_entries')
        .update({ match_count: entry.match_count, tier: entry.tier })
        .eq('id', entry.id)
    }

    // Create winner + pending payout records
    if (result.payouts.length > 0) {
      await supabase.from('winners').insert(
        result.payouts.map((p) => ({
          draw_id: id,
          user_id: p.user_id,
          tier: p.tier,
          amount: p.amount,
          status: 'pending',
        }))
      )
    }

    return NextResponse.json({ ok: true, winningNumbers: result.winningNumbers, winnersCreated: result.payouts.length })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Publish failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
