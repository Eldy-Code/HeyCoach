import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { parseJsonField, serializeJsonField } from '@/lib/utils'

const createDrillSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  objectives: z.array(z.string()).min(1, 'At least one objective is required'),
  duration: z.number().int().positive('Duration must be a positive integer'),
  players: z.string().min(1, 'Players field is required'),
  intensity: z.enum(['low', 'medium', 'high']),
  ageGroups: z.array(z.string()).min(1, 'At least one age group is required'),
  positions: z.array(z.string()).min(1, 'At least one position is required'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  phases: z.array(z.string()).min(1, 'At least one phase is required'),
  diagramData: z.string().optional().nullable(),
  videoUrl: z.string().url().optional().nullable().or(z.literal('')),
  isPublic: z.boolean().default(false),
})

function parseDrill(drill: any) {
  return {
    ...drill,
    objectives: parseJsonField<string[]>(drill.objectives, []),
    ageGroups: parseJsonField<string[]>(drill.ageGroups, []),
    positions: parseJsonField<string[]>(drill.positions, []),
    skills: parseJsonField<string[]>(drill.skills, []),
    phases: parseJsonField<string[]>(drill.phases, []),
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search')
    const ageGroup = searchParams.get('ageGroup')
    const position = searchParams.get('position')
    const skill = searchParams.get('skill')
    const phase = searchParams.get('phase')
    const isPublicParam = searchParams.get('isPublic')

    const where: any = {
      OR: [
        ...(session?.user?.id ? [{ authorId: session.user.id }] : []),
        { isPublic: true },
      ],
    }

    if (search) {
      where.AND = [
        ...(where.AND ?? []),
        {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
          ],
        },
      ]
    }

    if (isPublicParam === 'true') {
      where.isPublic = true
    } else if (isPublicParam === 'false' && session?.user?.id) {
      where.OR = [{ authorId: session.user.id }]
    }

    const drills = await prisma.drill.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            teamName: true,
          },
        },
        _count: {
          select: { likes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Apply JSON-parsed filter for array fields (ageGroup, position, skill, phase)
    let results = drills.map(parseDrill)

    if (ageGroup) {
      results = results.filter((d) => d.ageGroups.includes(ageGroup))
    }
    if (position) {
      results = results.filter((d) => d.positions.includes(position))
    }
    if (skill) {
      results = results.filter((d) => d.skills.includes(skill))
    }
    if (phase) {
      results = results.filter((d) => d.phases.includes(phase))
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('[DRILLS GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createDrillSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      title,
      description,
      objectives,
      duration,
      players,
      intensity,
      ageGroups,
      positions,
      skills,
      phases,
      diagramData,
      videoUrl,
      isPublic,
    } = parsed.data

    const drill = await prisma.drill.create({
      data: {
        title,
        description,
        objectives: serializeJsonField(objectives),
        duration,
        players,
        intensity,
        ageGroups: serializeJsonField(ageGroups),
        positions: serializeJsonField(positions),
        skills: serializeJsonField(skills),
        phases: serializeJsonField(phases),
        diagramData: diagramData ?? null,
        videoUrl: videoUrl || null,
        isPublic,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            teamName: true,
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    })

    return NextResponse.json(parseDrill(drill), { status: 201 })
  } catch (error) {
    console.error('[DRILLS POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
