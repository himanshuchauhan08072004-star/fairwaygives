import { createAdminClient } from '@/lib/supabase/admin'
import DrawManager from './DrawManager'

export default async function AdminDrawsPage() {
  const supabase = createAdminClient()
  const { data: draws } = await supabase
    .from('draws')
    .select('*')
    .order('draw_month', { ascending: false })

  const { count: activeSubs } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Draw Management</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Create a draw for the current month, simulate it to preview outcomes, then publish.
        </p>
      </div>
      <DrawManager draws={draws ?? []} activeSubscriberCount={activeSubs ?? 0} />
    </div>
  )
}
