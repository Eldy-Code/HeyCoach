import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { formatDuration, parseJsonField, relativeTime } from '@/lib/utils'
import { Skill } from '@/types'
import {
  ArrowLeft,
  Clock,
  CalendarDays,
  Users,
  FileText,
  Edit,
  Share2,
  MessageSquare,
  ClipboardList,
  User,
} from 'lucide-react'

interface PageProps {
  params: { id: string }
}

export default async function PracticePlanDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const plan = await prisma.practicePlan.findFirst({
    where: {
      id: params.id,
      OR: [{ authorId: session.user.id }, { isPublic: true }],
    },
    include: {
      author: { select: { id: true, name: true, email: true, teamName: true } },
      drills: {
        include: {
          drill: true,
        },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!plan) notFound()

  const isOwner = plan.authorId === session.user.id

  // Parse JSON fields on each nested drill
  const drillsWithParsed = plan.drills.map((pd) => ({
    ...pd,
    drill: {
      ...pd.drill,
      objectives: parseJsonField<string[]>(pd.drill.objectives as unknown as string, []),
      ageGroups: parseJsonField<string[]>(pd.drill.ageGroups as unknown as string, []),
      positions: parseJsonField<string[]>(pd.drill.positions as unknown as string, []),
      skills: parseJsonField<Skill[]>(pd.drill.skills as unknown as string, []),
      phases: parseJsonField<string[]>(pd.drill.phases as unknown as string, []),
    },
  }))

  const formattedDate = plan.date
    ? new Date(plan.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const authorName =
    plan.author?.name ?? plan.author?.email?.split('@')[0] ?? 'Unknown'

  return (
    <div className="min-h-screen">
      <TopBar
        title="Practice Plan"
        action={
          isOwner
            ? { label: 'Edit Plan', href: `/practice-plans/${plan.id}/edit` }
            : undefined
        }
      />

      <div className="p-6 max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/practice-plans"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Back to Practice Plans
        </Link>

        {/* Plan header */}
        <div className="bg-railers-black-card border border-white/5 rounded-xl p-6 mb-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-display font-bold text-2xl text-white uppercase tracking-wide leading-tight">
                  {plan.title}
                </h1>
                {plan.isPublic && (
                  <span className="text-xs bg-railers-red/10 text-railers-red border border-railers-red/20 px-2 py-0.5 rounded font-medium shrink-0">
                    Public
                  </span>
                )}
              </div>
              {plan.description && (
                <p className="text-gray-400 text-sm leading-relaxed mt-2">{plan.description}</p>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-400 border-t border-white/5 pt-4">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-railers-red/60" />
              <span className="text-white font-semibold">{formatDuration(plan.totalDuration)}</span>
              <span className="text-gray-600">total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ClipboardList size={14} className="text-railers-red/60" />
              <span className="text-white font-semibold">{plan.drills.length}</span>
              <span className="text-gray-600">drill{plan.drills.length !== 1 ? 's' : ''}</span>
            </div>
            {formattedDate && (
              <div className="flex items-center gap-1.5">
                <CalendarDays size={14} className="text-railers-red/60" />
                <span>{formattedDate}</span>
              </div>
            )}
            {plan.ageGroup && (
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-railers-red/60" />
                <span>{plan.ageGroup.toUpperCase()}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              <User size={14} className="text-gray-600" />
              <span className="text-gray-500">{authorName}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main: drill timeline */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="font-display font-semibold text-white text-sm uppercase tracking-wide mb-3">
              Practice Timeline
            </h2>

            {drillsWithParsed.length === 0 ? (
              <div className="bg-railers-black-card border border-white/5 rounded-xl p-8 text-center text-gray-600 text-sm">
                No drills have been added to this plan yet.
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-6 bottom-6 w-px bg-railers-red/20" />

                <div className="space-y-3">
                  {drillsWithParsed.map((pd, index) => (
                    <div key={pd.id} className="flex gap-4">
                      {/* Order bubble */}
                      <div className="shrink-0 w-10 h-10 bg-railers-red text-white rounded-full flex items-center justify-center font-display font-bold text-sm z-10">
                        {pd.order}
                      </div>

                      {/* Card */}
                      <div className="flex-1 bg-railers-black-card border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <Link
                              href={`/drills/${pd.drillId}`}
                              className="text-white font-semibold text-sm hover:text-railers-red transition-colors"
                            >
                              {pd.drill.title}
                            </Link>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={11} className="text-railers-red/50" />
                                {pd.duration}m
                              </span>
                              {pd.drill.intensity && (
                                <span
                                  className={`text-xs font-medium ${
                                    pd.drill.intensity === 'high'
                                      ? 'text-red-400'
                                      : pd.drill.intensity === 'medium'
                                      ? 'text-yellow-400'
                                      : 'text-green-400'
                                  }`}
                                >
                                  {pd.drill.intensity}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-gray-600 shrink-0">
                            #{index + 1} of {drillsWithParsed.length}
                          </span>
                        </div>

                        {/* Skills */}
                        {pd.drill.skills.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap mb-2">
                            {pd.drill.skills.map((sk: Skill) => (
                              <span
                                key={sk}
                                className="text-xs bg-railers-red/10 text-railers-red/80 border border-railers-red/10 px-2 py-0.5 rounded"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Drill-level notes */}
                        {pd.notes && (
                          <p className="text-xs text-gray-500 italic border-t border-white/5 pt-2 mt-2">
                            {pd.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: team notes + actions */}
          <div className="space-y-4">
            {/* Team notes */}
            {plan.teamNotes && (
              <div className="bg-railers-black-card border border-white/5 rounded-xl p-4">
                <h3 className="font-display font-semibold text-white text-xs uppercase tracking-wide flex items-center gap-2 mb-3">
                  <FileText size={13} className="text-railers-red" />
                  Team Notes
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                  {plan.teamNotes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="bg-railers-black-card border border-white/5 rounded-xl p-4 space-y-2">
              <h3 className="font-display font-semibold text-white text-xs uppercase tracking-wide mb-3">
                Actions
              </h3>

              {isOwner && (
                <Link
                  href={`/practice-plans/${plan.id}/edit`}
                  className="w-full flex items-center gap-2.5 bg-railers-black hover:bg-railers-black-soft border border-white/10 hover:border-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                >
                  <Edit size={15} className="text-railers-red/70" />
                  Edit Plan
                </Link>
              )}

              <button
                className="w-full flex items-center gap-2.5 bg-railers-black hover:bg-railers-black-soft border border-white/10 hover:border-white/20 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(window.location.href)
                  }
                }}
              >
                <Share2 size={15} className="text-railers-red/70" />
                Copy Link
              </button>

              <Link
                href={`/coach-chat?planId=${plan.id}`}
                className="w-full flex items-center gap-2.5 bg-railers-red hover:bg-railers-red-dark text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
              >
                <MessageSquare size={15} />
                Chat with Claude
              </Link>
            </div>

            {/* Quick stats */}
            <div className="bg-railers-black-card border border-white/5 rounded-xl p-4">
              <h3 className="font-display font-semibold text-white text-xs uppercase tracking-wide mb-3">
                Quick Stats
              </h3>
              <dl className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-gray-500">Duration</dt>
                  <dd className="text-white font-semibold">{formatDuration(plan.totalDuration)}</dd>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-gray-500">Drills</dt>
                  <dd className="text-white font-semibold">{plan.drills.length}</dd>
                </div>
                {plan.ageGroup && (
                  <div className="flex items-center justify-between text-sm">
                    <dt className="text-gray-500">Age Group</dt>
                    <dd className="text-white font-semibold uppercase">{plan.ageGroup}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-gray-500">Created</dt>
                  <dd className="text-gray-400">{relativeTime(plan.createdAt.toISOString())}</dd>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-gray-500">Updated</dt>
                  <dd className="text-gray-400">{relativeTime(plan.updatedAt.toISOString())}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
