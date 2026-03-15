import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { parseJsonField, serializeJsonField } from '@/lib/utils'

const updateDrillSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  objectives: z.array(z.string()).optional(),
  duration: z.number().int().positive().optional(),
  players: z.string().optional(),
  intensity: z.enum(['low', 'medium', 'high']).optional(),
  ageGroups: z.array(z.string()).optional(),
  positions: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  phases: z.array(z.string()).optional(),
  diagramData: z.string().optional().nullable(),
  videoUrl: z.string().url().optional().nullable().or(z.literal('')),
  imageUrl: z.string().optional().nullable().or(z.literal('')),
  isPublic: z.boolean().optional(),
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = params

    const drill = await prisma.drill.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true, teamName: true },
        },
        lastModifiedBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { likes: true },
        },
      },
    })

    if (!drill) {
      return NextResponse.json({ error: 'Drill not found' }, { status: 404 })
    }

    // Only allow access if drill is public or user is the author
    if (!drill.isPublic && drill.authorId !== session?.user?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(parseDrill(drill))
  } catch (error) {
    console.error('[DRILL GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const existing = await prisma.drill.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'Drill not found' }, { status: 404 })
    }

    if (existing.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateDrillSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      objectives,
      ageGroups,
      positions,
      skills,
      phases,
      videoUrl,
      imageUrl,
      ...rest
    } = parsed.data

    const updateData: Record<string, any> = {
      ...rest,
      lastModifiedById: session.user.id,
    }

    if (objectives !== undefined) updateData.objectives = serializeJsonField(objectives)
    if (ageGroups !== undefined) updateData.ageGroups = serializeJsonField(ageGroups)
    if (positions !== undefined) updateData.positions = serializeJsonField(positions)
    if (skills !== undefined) updateData.skills = serializeJsonField(skills)
    if (phases !== undefined) updateData.phases = serializeJsonField(phases)
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl || null
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null

    const updated = await prisma.drill.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, email: true, teamName: true },
        },
        lastModifiedBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { likes: true },
        },
      },
    })

    return NextResponse.json(parseDrill(updated))
  } catch (error) {
    console.error('[DRILL PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const existing = await prisma.drill.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'Drill not found' }, { status: 404 })
    }

    if (existing.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.drill.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DRILL DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
