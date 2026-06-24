import { createAdminClient } from '@/lib/supabase/admin'
import CharityAdminForm from './CharityAdminForm'

export default async function AdminCharitiesPage() {
  const supabase = createAdminClient()
  const { data: charities } = await supabase.from('charities').select('*').order('name')

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Charity Management</h1>
      <CharityAdminForm charities={charities ?? []} />
    </div>
  )
}
