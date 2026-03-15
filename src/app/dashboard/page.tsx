import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import Link from 'next/link'
import { formatDuration } from '@/lib/utils'
import { Dumbbell, ClipboardList, MessageSquare, Plus, ArrowRight, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const userId = session.user.id

  const [drillCount, planCount, recentDrills, recentPlans] = await Promise.all([
    prisma.drill.count({ where: { authorId: userId } }),
    prisma.practicePlan.count({ where: { authorId: userId } }),
    prisma.drill.findMany({
      where: { authorId: userId },
      orderBy: { updatedAt: 'desc' },
      take: 4,
    }),
    prisma.practicePlan.findMany({
      where: { authorId: userId },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      include: {
        drills: { select: { id: true } },
      },
    }),
  ])

  const publicDrillCount = await prisma.drill.count({ where: { isPublic: true } })

  return (
    <div className="min-h-screen">
      <TopBar title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-railers-red/20 via-railers-black-card to-railers-black-card border border-railers-red/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-white uppercase">
                Welcome back, Coach {session.user.name?.split(' ')[0] ?? ''} 🏒
              </h2>
              <p className="text-gray-400 mt-1 text-sm">
                Ready to build some great practices? Let&apos;s get to work.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/drills/new"
                className="flex items-center gap-2 bg-railers-red hover:bg-railers-red-dark text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <Plus size={16} />
                New Drill
              </Link>
              <Link
                href="/practice-plans/new"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <Plus size={16} />
                New Plan
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-railers-black-card border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-railers-red/20 rounded-lg flex items-center justify-center">
                <Dumbbell size={20} className="text-railers-red" />
              </div>
              <TrendingUp size={14} className="text-green-400" />
            </div>
            <div className="text-3xl font-display font-bold text-white">{drillCount}</div>
            <div className="text-sm text-gray-500 mt-1">My Drills</div>
          </div>

          <div className="bg-railers-black-card border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <ClipboardList size={20} className="text-blue-400" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold text-white">{planCount}</div>
            <div className="text-sm text-gray-500 mt-1">Practice Plans</div>
          </div>

          <div className="bg-railers-black-card border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <MessageSquare size={20} className="text-purple-400" />
              </div>
            </div>
            <div className="text-3xl font-display font-bold text-white">{publicDrillCount}</div>
            <div className="text-sm text-gray-500 mt-1">Public Drills in Library</div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/drills/new"
            className="bg-railers-black-card border border-white/5 hover:border-railers-red/30 rounded-xl p-5 flex items-center gap-4 transition-all group card-hover"
          >
            <div className="w-12 h-12 bg-railers-red/20 rounded-xl flex items-center justify-center group-hover:bg-railers-red/30 transition-colors">
              <Dumbbell size={22} className="text-railers-red" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">Create Drill</div>
              <div className="text-xs text-gray-500 mt-0.5">Add a new drill to your library</div>
            </div>
            <ArrowRight size={16} className="text-gray-600 group-hover:text-railers-red group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/practice-plans/new"
            className="bg-railers-black-card border border-white/5 hover:border-blue-500/30 rounded-xl p-5 flex items-center gap-4 transition-all group card-hover"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
              <ClipboardList size={22} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">Build Practice Plan</div>
              <div className="text-xs text-gray-500 mt-0.5">Select drills and create a plan</div>
            </div>
            <ArrowRight size={16} className="text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            href="/coach-chat"
            className="bg-railers-black-card border border-white/5 hover:border-purple-500/30 rounded-xl p-5 flex items-center gap-4 transition-all group card-hover"
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
              <MessageSquare size={22} className="text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">Chat with Claude</div>
              <div className="text-xs text-gray-500 mt-0.5">AI-powered coaching assistance</div>
            </div>
            <ArrowRight size={16} className="text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

        {/* Recent content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Drills */}
          <div className="bg-railers-black-card border border-white/5 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-display font-semibold text-white uppercase tracking-wide">Recent Drills</h3>
              <Link href="/drills" className="text-xs text-railers-red hover:text-railers-red-light flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {recentDrills.length === 0 ? (
                <div className="p-5 text-center text-gray-500 text-sm">
                  No drills yet.{' '}
                  <Link href="/drills/new" className="text-railers-red hover:underline">
                    Create your first drill!
                  </Link>
                </div>
              ) : (
                recentDrills.map((drill) => {
                  const skills = JSON.parse(drill.skills || '[]') as string[]
                  return (
                    <Link
                      key={drill.id}
                      href={`/drills/${drill.id}`}
                      className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="w-9 h-9 bg-railers-red/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Dumbbell size={16} className="text-railers-red" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm truncate">{drill.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {formatDuration(drill.duration)} · {skills[0] ?? 'General'}
                        </div>
                      </div>
                      {drill.isPublic && (
                        <span className="badge badge-green text-[10px]">Public</span>
                      )}
                    </Link>
                  )
                })
              )}
            </div>
          </div>

          {/* Recent Plans */}
          <div className="bg-railers-black-card border border-white/5 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-display font-semibold text-white uppercase tracking-wide">Recent Plans</h3>
              <Link href="/practice-plans" className="text-xs text-railers-red hover:text-railers-red-light flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {recentPlans.length === 0 ? (
                <div className="p-5 text-center text-gray-500 text-sm">
                  No practice plans yet.{' '}
                  <Link href="/practice-plans/new" className="text-railers-red hover:underline">
                    Build your first plan!
                  </Link>
                </div>
              ) : (
                recentPlans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/practice-plans/${plan.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ClipboardList size={16} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm truncate">{plan.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {plan.drills.length} drills · {formatDuration(plan.totalDuration)}
                      </div>
                    </div>
                    {plan.date && (
                      <span className="text-xs text-gray-500">
                        {new Date(plan.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
