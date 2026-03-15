import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { relativeTime } from '@/lib/utils'
import AdminUsersClient from './_components/AdminUsersClient'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  const [users, stats] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamName: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { drills: true, practicePlans: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true },
    }),
  ])

  const totalUsers = users.length
  const adminCount = stats.find((s) => s.role === 'admin')?._count._all ?? 0
  const coachCount = stats.find((s) => s.role === 'coach')?._count._all ?? 0

  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    isSelf: u.id === session!.user.id,
  }))

  return (
    <div className="min-h-screen">
      <TopBar title="Admin Console" />

      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Users', value: totalUsers, color: 'text-white' },
            { label: 'Coaches', value: coachCount, color: 'text-blue-400' },
            { label: 'Admins', value: adminCount, color: 'text-railers-red' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-railers-black-card border border-white/5 rounded-xl p-5 flex flex-col gap-1"
            >
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{label}</p>
              <p className={`font-display font-bold text-3xl ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Client component handles create, edit, delete */}
        <AdminUsersClient users={serialized} currentUserId={session!.user.id} />
      </div>
    </div>
  )
}
