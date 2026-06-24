import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FairwayGives — Play. Win. Give Back.',
  description: 'Track your golf scores, enter monthly draws, and support a charity you care about.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100 antialiased">{children}</body>
    </html>
  )
}
