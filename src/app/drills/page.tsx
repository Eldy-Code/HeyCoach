import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TopBar } from '@/components/layout/TopBar'
import { DrillCard } from '@/components/drills/DrillCard'
import { DrillFilters } from '@/components/drills/DrillFilters'
import { Drill } from '@/types'
import Link from 'next/link'
import { Dumbbell, Plus, Upload } from 'lucide-react'

interface SearchParams {
  search?: string
  ageGroup?: string
  position?: string
  skill?: string
  phase?: string
  visibility?: string
}

export default async function DrillsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const userId = session.user.id
  const { search, ageGroup, position, skill, phase, visibility } = searchParams

  const where: Record<string, unknown> = {}

  // Visibility filter
  if (visibility === 'mine') {
    where.authorId = userId
  } else if (visibility === 'public') {
    where.isPublic = true
  } else {
    where.OR = [{ authorId: userId }, { isPublic: true }]
  }

  // Text search
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ]
  }

  const rawDrills = await prisma.drill.findMany({
    where,
    include: {
      author: { select: { id: true, name: true, email: true, teamName: true } },
      _count: { select: { likes: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Parse JSON fields and apply array filters
  const drills = rawDrills
    .map((d) => ({
      ...d,
      objectives: JSON.parse(d.objectives || '[]') as string[],
      ageGroups: JSON.parse(d.ageGroups || '[]') as string[],
      positions: JSON.parse(d.positions || '[]') as string[],
      skills: JSON.parse(d.skills || '[]') as string[],
      phases: JSON.parse(d.phases || '[]') as string[],
      players: d.players as Drill['players'],
      intensity: d.intensity as Drill['intensity'],
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }))
    .filter((d) => {
      if (ageGroup && !d.ageGroups.includes(ageGroup as never)) return false
      if (position && !d.positions.includes(position as never) && !d.positions.includes('all')) return false
      if (skill && !d.skills.includes(skill as never)) return false
      if (phase && !d.phases.includes(phase as never)) return false
      return true
    })

  return (
    <div className="min-h-screen">
      <TopBar
        title="Drill Library"
        action={{ label: 'New Drill', href: '/drills/new' }}
      />

      <div className="p-6 space-y-5">
        {/* Filters */}
        <DrillFilters />

        {/* Results header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {drills.length} drill{drills.length !== 1 ? 's' : ''}
            {search && ` for "${search}"`}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/drills/upload"
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Upload size={13} /> Upload Image
            </Link>
            <Link
              href="/drills/new"
              className="md:hidden flex items-center gap-1.5 bg-railers-red text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              <Plus size={14} /> New Drill
            </Link>
          </div>
        </div>

        {/* Grid */}
        {drills.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-railers-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Dumbbell size={32} className="text-railers-red/50" />
            </div>
            <h3 className="font-display font-semibold text-white text-lg mb-2">No drills found</h3>
            <p className="text-gray-500 text-sm mb-6">
              {search ? `No drills match "${search}"` : "You haven't created any drills yet."}
            </p>
            <Link
              href="/drills/new"
              className="inline-flex items-center gap-2 bg-railers-red hover:bg-railers-red-dark text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <Plus size={16} /> Create First Drill
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {drills.map((drill) => (
              <DrillCard key={drill.id} drill={drill as Drill} currentUserId={userId} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
