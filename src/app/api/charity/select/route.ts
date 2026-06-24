import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { charity_id, contribution_pct } = await req.json()

  if (contribution_pct !== undefined && (contribution_pct < 10 || contribution_pct > 100)) {
    return NextResponse.json({ error: 'Contribution must be between 10% and 100%' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (charity_id) update.charity_id = charity_id
  if (contribution_pct !== undefined) update.charity_contribution_pct = contribution_pct

  const { error } = await supabase.from('profiles').update(update).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
