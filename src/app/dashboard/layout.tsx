import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="font-bold text-emerald-400">FairwayGives</Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/dashboard" className="hover:text-emerald-400">Overview</Link>
            <Link href="/dashboard/scores" className="hover:text-emerald-400">Scores</Link>
            <Link href="/dashboard/draws" className="hover:text-emerald-400">Draws</Link>
            <Link href="/dashboard/charity" className="hover:text-emerald-400">Charity</Link>
            <Link href="/dashboard/winnings" className="hover:text-emerald-400">Winnings</Link>
            {profile?.role === 'admin' && (
              <Link href="/admin" className="text-amber-400 hover:text-amber-300">Admin</Link>
            )}
          </nav>
          <form action="/api/auth/signout" method="post">
            <button className="text-sm text-neutral-400 hover:text-neutral-200">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  )
}
