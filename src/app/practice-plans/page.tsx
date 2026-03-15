import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { formatDuration, relativeTime } from '@/lib/utils'
import Link from 'next/link'
import { ClipboardList, Plus, Clock, Dumbbell, CalendarDays, User } from 'lucide-react'

export default async function PracticePlansPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const userId = session.user.id

  const rawPlans = await prisma.practicePlan.findMany({
    where: {
      OR: [{ authorId: userId }, { isPublic: true }],
    },
    include: {
      author: { select: { id: true, name: true, email: true, teamName: true } },
      drills: { select: { id: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const plans = rawPlans.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    date: p.date ? p.date.toISOString() : null,
    drillCount: p.drills.length,
  }))

  return (
    <div className="min-h-screen">
      <TopBar
        title="Practice Plans"
        action={{ label: 'New Plan', href: '/practice-plans/new' }}
      />

      <div className="p-6 space-y-5">
        {/* Results header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {plans.length} plan{plans.length !== 1 ? 's' : ''}
          </p>
          <Link
            href="/practice-plans/new"
            className="md:hidden flex items-center gap-1.5 bg-railers-red text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
          >
            <Plus size={14} /> New Plan
          </Link>
        </div>

        {/* Grid or Empty State */}
        {plans.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-railers-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={32} className="text-railers-red/50" />
            </div>
            <h3 className="font-display font-semibold text-white text-lg mb-2">No practice plans yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Build your first practice plan by combining drills into a structured session.
            </p>
            <Link
              href="/practice-plans/new"
              className="inline-flex items-center gap-2 bg-railers-red hover:bg-railers-red-dark text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <Plus size={16} /> Create First Plan
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <Link
                key={plan.id}
                href={`/practice-plans/${plan.id}`}
                className="group block bg-railers-black-card border border-white/5 rounded-xl p-4 hover:border-railers-red/30 hover:bg-railers-black-soft transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-display font-semibold text-white text-sm leading-snug group-hover:text-railers-red transition-colors line-clamp-2">
                    {plan.title}
                  </h3>
                  {plan.isPublic && (
                    <span className="shrink-0 text-xs bg-railers-red/10 text-railers-red border border-railers-red/20 px-1.5 py-0.5 rounded font-medium">
                      Public
                    </span>
                  )}
                </div>

                {/* Description */}
                {plan.description && (
                  <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">
                    {plan.description}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Dumbbell size={12} className="text-railers-red/60" />
                    <span className="text-xs">{plan.drillCount} drill{plan.drillCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Clock size={12} className="text-railers-red/60" />
                    <span className="text-xs">{formatDuration(plan.totalDuration)}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  {plan.date ? (
                    <div className="flex items-center gap-1 text-gray-500">
                      <CalendarDays size={11} />
                      <span className="text-xs">
                        {new Date(plan.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600">{relativeTime(plan.updatedAt)}</span>
                  )}
                  <div className="flex items-center gap-1 text-gray-600">
                    <User size={11} />
                    <span className="text-xs truncate max-w-[80px]">
                      {plan.author?.name ?? plan.author?.email?.split('@')[0] ?? 'Unknown'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
