import { createAdminClient } from '@/lib/supabase/admin'
import WinnerRow from './WinnerRow'

export default async function AdminWinnersPage() {
  const supabase = createAdminClient()
const { data: winners, error } = await supabase
    .from('winners')
    .select('*, profiles!winners_user_id_fkey(full_name), draws!winners_draw_id_fkey(draw_month)')
    .order('created_at', { ascending: false })

  if (error) console.error('Admin winners query error:', error)
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Winners & Payouts</h1>
      <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-left text-neutral-400">
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Draw</th>
              <th className="px-6 py-3">Tier</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Proof</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(winners ?? []).map((w: any) => (
              <WinnerRow key={w.id} winner={w} />
            ))}
          </tbody>
        </table>
        {(winners ?? []).length === 0 && <p className="p-6 text-neutral-400">No winners yet.</p>}
      </div>
    </div>
  )
}
