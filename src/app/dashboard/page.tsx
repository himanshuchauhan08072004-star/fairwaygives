import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BackButton from './BackButton'

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
      <header className="border-b border-neutral-800 px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BackButton />
              <Link
                href="/"
                className="animate-fade-up bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-base font-extrabold tracking-tight text-transparent transition-transform hover:scale-105 sm:text-lg"
              >
                FairwayGives
              </Link>
            </div>
            <form action="/api/auth/signout" method="post">
              <button className="text-xs text-neutral-400 transition-colors hover:text-neutral-200 sm:text-sm">Sign out</button>
            </form>
          </div>

          <nav className="mt-3 flex gap-3 overflow-x-auto whitespace-nowrap text-xs scrollbar-hide sm:mt-0 sm:justify-end sm:gap-6 sm:text-sm">
            {[
              { href: '/dashboard', label: 'Overview' },
              { href: '/dashboard/scores', label: 'Scores' },
              { href: '/dashboard/draws', label: 'Draws' },
              { href: '/dashboard/charity', label: 'Charity' },
              { href: '/dashboard/winnings', label: 'Winnings' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative shrink-0 py-1 text-neutral-300 transition-colors hover:text-emerald-400 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-emerald-400 after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.label}
              </Link>
            ))}
            {profile?.role === 'admin' && (
              <Link
                href="/admin"
                className="relative shrink-0 py-1 text-amber-400 transition-colors hover:text-amber-300 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-amber-400 after:transition-all after:duration-300 hover:after:w-full"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  )
}