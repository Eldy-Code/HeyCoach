'use client'

import Link from 'next/link'
import { Drill } from '@/types'
import { formatDuration, cn } from '@/lib/utils'
import { Clock, Users, Flame, Heart, Share2, Pencil } from 'lucide-react'

interface DrillCardProps {
  drill: Drill
  currentUserId?: string
  onLike?: (drillId: string) => void
  compact?: boolean
}

const intensityConfig = {
  low: { label: 'Low', class: 'text-green-400', bg: 'bg-green-400/10' },
  medium: { label: 'Med', class: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  high: { label: 'High', class: 'text-red-400', bg: 'bg-red-400/10' },
}

const skillColors: Record<string, string> = {
  skating: 'bg-blue-500/20 text-blue-300',
  passing: 'bg-green-500/20 text-green-300',
  shooting: 'bg-red-500/20 text-red-300',
  'puck-handling': 'bg-yellow-500/20 text-yellow-300',
  defense: 'bg-orange-500/20 text-orange-300',
  goaltending: 'bg-purple-500/20 text-purple-300',
  conditioning: 'bg-pink-500/20 text-pink-300',
  systems: 'bg-cyan-500/20 text-cyan-300',
}

export function DrillCard({ drill, currentUserId, onLike, compact }: DrillCardProps) {
  const intensity = intensityConfig[drill.intensity] ?? intensityConfig.medium
  const isOwner = currentUserId === drill.authorId
  const likeCount = drill._count?.likes ?? 0

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault()
    if (onLike) onLike(drill.id)
  }

  return (
    <Link href={`/drills/${drill.id}`} className="block group">
      <div
        className={cn(
          'bg-railers-black-card border border-white/5 rounded-xl overflow-hidden',
          'hover:border-railers-red/30 transition-all duration-200 card-hover',
          compact && 'flex items-center gap-4 p-3'
        )}
      >
        {!compact && (
          <>
            {/* Color band */}
            <div className="h-1.5 bg-gradient-to-r from-railers-red via-railers-red/60 to-transparent" />

            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm leading-snug truncate group-hover:text-railers-red-light transition-colors">
                    {drill.title}
                  </h3>
                  {drill.author && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      {drill.author.name ?? drill.author.email}
                    </p>
                  )}
                </div>
                <div
                  className={cn(
                    'flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold',
                    intensity.class,
                    intensity.bg
                  )}
                >
                  <Flame size={10} className="inline mr-0.5" />
                  {intensity.label}
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                {drill.description}
              </p>

              {/* Skills */}
              {drill.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {drill.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded font-medium',
                        skillColors[skill] ?? 'bg-white/10 text-gray-400'
                      )}
                    >
                      {skill.replace('-', ' ')}
                    </span>
                  ))}
                  {drill.skills.length > 3 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-500">
                      +{drill.skills.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {formatDuration(drill.duration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {drill.players.replace('-', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {drill.isPublic && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        navigator.clipboard.writeText(`${window.location.origin}/drills/${drill.id}`)
                      }}
                      className="text-gray-600 hover:text-white transition-colors"
                      title="Copy link"
                    >
                      <Share2 size={13} />
                    </button>
                  )}
                  <button
                    onClick={handleLike}
                    className={cn(
                      'flex items-center gap-1 text-xs transition-colors',
                      likeCount > 0 ? 'text-railers-red' : 'text-gray-600 hover:text-railers-red'
                    )}
                    title="Like"
                  >
                    <Heart size={13} className={likeCount > 0 ? 'fill-current' : ''} />
                    {likeCount > 0 && <span>{likeCount}</span>}
                  </button>
                  {isOwner && (
                    <Link
                      href={`/drills/${drill.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-600 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {compact && (
          <>
            <div className="w-1 self-stretch bg-railers-red rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white text-sm truncate">{drill.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {formatDuration(drill.duration)} · {drill.skills[0] ?? 'General'}
              </div>
            </div>
            <div className={cn('text-[10px] font-bold', intensity.class)}>{intensity.label}</div>
          </>
        )}
      </div>
    </Link>
  )
}
