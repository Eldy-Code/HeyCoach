import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/')

  return (
    <div className="flex min-h-screen bg-railers-black">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        {children}
      </div>
    </div>
  )
}
