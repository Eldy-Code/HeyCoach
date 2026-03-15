import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'HeyCoach – Youth Hockey Drill Platform',
  description: 'Create, share, and manage youth hockey drills and practice plans. Powered by AI coaching assistance.',
  keywords: 'hockey, drills, practice plans, youth hockey, coaching, worcester railers',
  openGraph: {
    title: 'HeyCoach',
    description: 'The ultimate hockey drill platform for coaches',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
