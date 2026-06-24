import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { runDraw } from '@/lib/draws'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params

  try {
    const result = await runDraw(id)
    return NextResponse.json({
      winningNumbers: result.winningNumbers,
      scoredEntries: result.scoredEntries,
      payouts: result.payouts,
      jackpotRollsOver: result.jackpotRollsOver,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Simulation failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
