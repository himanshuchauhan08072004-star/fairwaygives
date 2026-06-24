import { createClient } from '@/lib/supabase/server'
import CharityForm from './CharityForm'

export default async function CharityDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: charities }, { data: profile }] = await Promise.all([
    supabase.from('charities').select('*').eq('is_active', true).order('name'),
    supabase.from('profiles').select('charity_id, charity_contribution_pct').eq('id', user.id).single(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Charity</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Choose who benefits from your subscription. Minimum contribution is 10% — increase it any time.
        </p>
      </div>
      <CharityForm
        charities={charities ?? []}
        currentCharityId={profile?.charity_id ?? null}
        currentPct={profile?.charity_contribution_pct ?? 10}
      />
    </div>
  )
}
