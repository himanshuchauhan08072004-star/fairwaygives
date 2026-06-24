import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateScore, deleteScore, ScoreError } from '@/lib/scores'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { score } = body
  if (typeof score !== 'number') {
    return NextResponse.json({ error: 'score (number) is required' }, { status: 400 })
  }

  try {
    await updateScore(user.id, id, score)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof ScoreError ? e.message : 'Failed to update score'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await deleteScore(user.id, id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof ScoreError ? e.message : 'Failed to delete score'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
