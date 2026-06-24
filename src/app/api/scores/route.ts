import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addScore, getLatestScores, ScoreError } from '@/lib/scores'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const scores = await getLatestScores(user.id)
    return NextResponse.json({ scores })
  } catch (e) {
    const message = e instanceof ScoreError ? e.message : 'Failed to fetch scores'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { score, played_on } = body

  if (typeof score !== 'number' || !played_on) {
    return NextResponse.json({ error: 'score (number) and played_on (date) are required' }, { status: 400 })
  }

  try {
    const scores = await addScore(user.id, score, played_on)
    return NextResponse.json({ scores })
  } catch (e) {
    const message = e instanceof ScoreError ? e.message : 'Failed to add score'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
