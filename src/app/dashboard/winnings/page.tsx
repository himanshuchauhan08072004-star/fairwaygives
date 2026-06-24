import { createClient } from '@/lib/supabase/server'
import WinningsList from './WinningsList'

export default async function WinningsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: winners } = await supabase
    .from('winners')
    .select('*, draws(draw_month)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Winnings</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Upload a screenshot of your scores as proof to speed up payout verification.
        </p>
      </div>
      <WinningsList winners={winners ?? []} />
    </div>
  )
}
