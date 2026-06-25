import { createAdminClient } from '@/lib/supabase/admin'
import UserRow from './UserRow'

export default async function AdminUsersPage() {
  const supabase = createAdminClient()
 const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*, subscriptions!subscriptions_user_id_fkey(status, plan)')
    .order('created_at', { ascending: false })

  if (error) console.error('Admin users query error:', error)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>
      <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-left text-neutral-400">
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Subscription</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((p: any) => (
              <UserRow key={p.id} profile={p} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
