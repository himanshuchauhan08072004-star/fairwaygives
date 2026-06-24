import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { name, description, category, is_featured } = await req.json()
  if (!name || !description) {
    return NextResponse.json({ error: 'name and description are required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: charity, error } = await supabase
    .from('charities')
    .insert({ name, description, category, is_featured: !!is_featured, slug: slugify(name) })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ charity })
}
