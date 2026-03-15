import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseJsonField, formatDuration, relativeTime } from '@/lib/utils'
import { TopBar } from '@/components/layout/TopBar'
import { Drill } from '@/types'
import {
  ArrowLeft,
  Clock,
  Users,
  Flame,
  Pencil,
  Target,
  Tag,
  Play,
  Image as ImageIcon,
  Code2,
} from 'lucide-react'
import LikeButton from './_components/LikeButton'
import ShareButton from './_components/ShareButton'

interface PageProps {
  params: { id: string }
}

const intensityConfig = {
  low: { label: 'Low Intensity', class: 'text-green-400 bg-green-400/10 border-green-400/20' },
  medium: { label: 'Medium Intensity', class: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  high: { label: 'High Intensity', class: 'text-red-400 bg-red-400/10 border-red-400/20' },
}

const skillColors: Record<string, string> = {
  skating: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  passing: 'bg-green-500/20 text-green-300 border-green-500/20',
  shooting: 'bg-red-500/20 text-red-300 border-red-500/20',
  'puck-handling': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20',
  defense: 'bg-orange-500/20 text-orange-300 border-orange-500/20',
  goaltending: 'bg-purple-500/20 text-purple-300 border-purple-500/20',
  conditioning: 'bg-pink-500/20 text-pink-300 border-pink-500/20',
  systems: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/20',
  'face-offs': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/20',
  'power-play': 'bg-amber-500/20 text-amber-300 border-amber-500/20',
  'penalty-kill': 'bg-rose-500/20 text-rose-300 border-rose-500/20',
}

function Tag_({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${className ?? 'bg-white/5 text-gray-400 border-white/10'}`}
    >
      {children}
    </span>
  )
}

export default async function DrillDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/')

  const userId = session.user.id
  const { id } = params

  const rawDrill = await prisma.drill.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true, teamName: true } },
      _count: { select: { likes: true } },
      likes: { where: { userId }, select: { id: true } },
    },
  })

  if (!rawDrill) notFound()

  // Access control: must be public or owner
  if (!rawDrill.isPublic && rawDrill.authorId !== userId) {
    redirect('/drills')
  }

  const drill = {
    ...rawDrill,
    objectives: parseJsonField<string[]>(rawDrill.objectives, []),
    ageGroups: parseJsonField<string[]>(rawDrill.ageGroups, []) as Drill['ageGroups'],
    positions: parseJsonField<string[]>(rawDrill.positions, []) as Drill['positions'],
    skills: parseJsonField<string[]>(rawDrill.skills, []) as Drill['skills'],
    phases: parseJsonField<string[]>(rawDrill.phases, []) as Drill['phases'],
    intensity: rawDrill.intensity as Drill['intensity'],
    players: rawDrill.players as Drill['players'],
    createdAt: rawDrill.createdAt.toISOString(),
    updatedAt: rawDrill.updatedAt.toISOString(),
  }

  const isOwner = drill.authorId === userId
  const likeCount = drill._count?.likes ?? 0
  const hasLiked = rawDrill.likes.length > 0
  const intensity = intensityConfig[drill.intensity] ?? intensityConfig.medium
  const authorName = drill.author?.name ?? drill.author?.email ?? 'Unknown Coach'

  return (
    <div className="min-h-screen">
      <TopBar
        title="Drill Detail"
        action={isOwner ? { label: 'Edit Drill', href: `/drills/${id}/edit` } : undefined}
      />

      <div className="p-6 max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/drills"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Back to Drill Library
        </Link>

        {/* Hero card */}
        <div className="bg-railers-black-card border border-white/5 rounded-xl overflow-hidden mb-6">
          {/* Red accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-railers-red via-railers-red/60 to-transparent" />

          <div className="p-6 md:p-8">
            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="font-display font-bold text-3xl md:text-4xl text-white uppercase tracking-wide leading-tight">
                  {drill.title}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-5 h-5 bg-railers-red rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0">
                    {authorName[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-400">
                    by <span className="text-gray-300">{authorName}</span>
                  </span>
                  {drill.author?.teamName && (
                    <span className="text-xs text-gray-600">· {drill.author.teamName}</span>
                  )}
                  <span className="text-xs text-gray-600">· {relativeTime(drill.updatedAt)}</span>
                </div>
              </div>

              {/* Visibility badge */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`text-xs px-2 py-1 rounded-full border font-semibold ${
                    drill.isPublic
                      ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                      : 'bg-white/5 text-gray-500 border-white/10'
                  }`}
                >
                  {drill.isPublic ? 'Public' : 'Private'}
                </span>
              </div>
            </div>

            {/* Meta badges row */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex items-center gap-1.5 text-sm text-gray-300 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                <Clock size={14} className="text-railers-red" />
                <span>{formatDuration(drill.duration)}</span>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-gray-300 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                <Users size={14} className="text-railers-red" />
                <span className="capitalize">{drill.players.replace('-', ' ')}</span>
              </div>

              <div
                className={`flex items-center gap-1.5 text-sm rounded-lg px-3 py-1.5 border ${intensity.class}`}
              >
                <Flame size={14} />
                <span>{intensity.label}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">
              {drill.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Objectives */}
            {drill.objectives.length > 0 && (
              <div className="bg-railers-black-card border border-white/5 rounded-xl p-6">
                <h2 className="font-display font-semibold text-white uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-railers-red rounded-full inline-block" />
                  <Target size={15} className="text-railers-red" />
                  Objectives
                </h2>
                <ol className="space-y-2">
                  {drill.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                      <span className="w-5 h-5 rounded bg-railers-red/20 text-railers-red text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {obj}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Diagram data */}
            {drill.diagramData && (
              <div className="bg-railers-black-card border border-white/5 rounded-xl p-6">
                <h2 className="font-display font-semibold text-white uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-railers-red rounded-full inline-block" />
                  <Code2 size={15} className="text-railers-red" />
                  Diagram Data
                </h2>
                <pre className="text-xs text-gray-400 bg-railers-black rounded-lg p-4 overflow-x-auto border border-white/5 whitespace-pre-wrap break-all">
                  {drill.diagramData}
                </pre>
              </div>
            )}

            {/* Media */}
            {(drill.videoUrl || drill.imageUrl) && (
              <div className="bg-railers-black-card border border-white/5 rounded-xl p-6">
                <h2 className="font-display font-semibold text-white uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-railers-red rounded-full inline-block" />
                  Media
                </h2>
                <div className="space-y-3">
                  {drill.videoUrl && (
                    <a
                      href={drill.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-railers-black border border-white/5 rounded-lg hover:border-railers-red/30 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-railers-red/10 border border-railers-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Play size={14} className="text-railers-red" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                          Video Reference
                        </p>
                        <p className="text-xs text-gray-600 truncate">{drill.videoUrl}</p>
                      </div>
                    </a>
                  )}
                  {drill.imageUrl && (
                    <a
                      href={drill.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-railers-black border border-white/5 rounded-lg hover:border-railers-red/30 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ImageIcon size={14} className="text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                          Diagram Image
                        </p>
                        <p className="text-xs text-gray-600 truncate">{drill.imageUrl}</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right column — sidebar info */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-railers-black-card border border-white/5 rounded-xl p-5">
              <h2 className="font-display font-semibold text-white uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
                <span className="w-1 h-3 bg-railers-red rounded-full inline-block" />
                Actions
              </h2>
              <div className="flex flex-col gap-2">
                {isOwner && (
                  <Link
                    href={`/drills/${id}/edit`}
                    className="flex items-center gap-2 w-full bg-railers-red hover:bg-railers-red-dark text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors justify-center"
                  >
                    <Pencil size={15} />
                    Edit Drill
                  </Link>
                )}

                <LikeButton drillId={id} initialLiked={hasLiked} initialCount={likeCount} />

                {drill.isPublic && <ShareButton drillId={id} />}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-railers-black-card border border-white/5 rounded-xl p-5">
              <h2 className="font-display font-semibold text-white uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
                <span className="w-1 h-3 bg-railers-red rounded-full inline-block" />
                <Tag size={12} className="text-railers-red" />
                Categories
              </h2>

              <div className="space-y-4">
                {drill.skills.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-2">
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {drill.skills.map((skill) => (
                        <Tag_
                          key={skill}
                          className={skillColors[skill] ?? 'bg-white/5 text-gray-400 border-white/10'}
                        >
                          {skill.replace(/-/g, ' ')}
                        </Tag_>
                      ))}
                    </div>
                  </div>
                )}

                {drill.positions.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-2">
                      Positions
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {drill.positions.map((pos) => (
                        <Tag_ key={pos} className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
                          {pos}
                        </Tag_>
                      ))}
                    </div>
                  </div>
                )}

                {drill.ageGroups.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-2">
                      Age Groups
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {drill.ageGroups.map((ag) => (
                        <Tag_ key={ag} className="bg-teal-500/10 text-teal-300 border-teal-500/20">
                          {ag}
                        </Tag_>
                      ))}
                    </div>
                  </div>
                )}

                {drill.phases.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-2">
                      Practice Phase
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {drill.phases.map((phase) => (
                        <Tag_ key={phase} className="bg-violet-500/10 text-violet-300 border-violet-500/20">
                          {phase.replace(/-/g, ' ')}
                        </Tag_>
                      ))}
                    </div>
                  </div>
                )}

                {drill.skills.length === 0 &&
                  drill.positions.length === 0 &&
                  drill.ageGroups.length === 0 &&
                  drill.phases.length === 0 && (
                    <p className="text-xs text-gray-600 italic">No categories assigned.</p>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
