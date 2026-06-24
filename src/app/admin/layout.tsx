import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/dashboard" className="font-bold text-amber-400">FairwayGives Admin</Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/admin" className="hover:text-amber-400">Overview</Link>
            <Link href="/admin/users" className="hover:text-amber-400">Users</Link>
            <Link href="/admin/draws" className="hover:text-amber-400">Draws</Link>
            <Link href="/admin/charities" className="hover:text-amber-400">Charities</Link>
            <Link href="/admin/winners" className="hover:text-amber-400">Winners</Link>
            <Link href="/dashboard" className="text-neutral-400 hover:text-neutral-200">← Back to app</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  )
}
