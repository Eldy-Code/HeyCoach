import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) redirect('/')
  if (session.user.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-railers-black">
      <Sidebar />
      <main className="flex-1 ml-64">{children}</main>
    </div>
  )
}
