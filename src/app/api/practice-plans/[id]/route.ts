import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { parseJsonField } from '@/lib/utils'

const practicePlanDrillSchema = z.object({
  drillId: z.string().min(1, 'drillId is required'),
  order: z.number().int().nonnegative(),
  duration: z.number().int().positive('Duration must be positive'),
  notes: z.string().optional().nullable(),
})

const updatePracticePlanSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional().nullable(),
  date: z.string().datetime().optional().nullable(),
  ageGroup: z.string().optional().nullable(),
  teamNotes: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  drills: z.array(practicePlanDrillSchema).optional(),
})

function parseDrillFields(drill: any) {
  return {
    ...drill,
    objectives: parseJsonField<string[]>(drill.objectives, []),
    ageGroups: parseJsonField<string[]>(drill.ageGroups, []),
    positions: parseJsonField<string[]>(drill.positions, []),
    skills: parseJsonField<string[]>(drill.skills, []),
    phases: parseJsonField<string[]>(drill.phases, []),
  }
}

function parsePlan(plan: any) {
  return {
    ...plan,
    drills: plan.drills?.map((pd: any) => ({
      ...pd,
      drill: pd.drill ? parseDrillFields(pd.drill) : pd.drill,
    })) ?? [],
  }
}

const planInclude = {
  author: {
    select: {
      id: true,
      name: true,
      email: true,
      teamName: true,
    },
  },
  drills: {
    orderBy: { order: 'asc' as const },
    include: {
      drill: true,
    },
  },
} as const

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = params

    const plan = await prisma.practicePlan.findUnique({
      where: { id },
      include: planInclude,
    })

    if (!plan) {
      return NextResponse.json({ error: 'Practice plan not found' }, { status: 404 })
    }

    // Only allow access if plan is public or user is the author
    if (!plan.isPublic && plan.authorId !== session?.user?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(parsePlan(plan))
  } catch (error) {
    console.error('[PRACTICE PLAN GET]', error)
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

    const existing = await prisma.practicePlan.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'Practice plan not found' }, { status: 404 })
    }

    if (existing.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updatePracticePlanSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, description, date, ageGroup, teamNotes, isPublic, drills } =
      parsed.data

    const updateData: Record<string, any> = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description ?? null
    if (date !== undefined) updateData.date = date ? new Date(date) : null
    if (ageGroup !== undefined) updateData.ageGroup = ageGroup ?? null
    if (teamNotes !== undefined) updateData.teamNotes = teamNotes ?? null
    if (isPublic !== undefined) updateData.isPublic = isPublic

    // If drills array is provided, recalculate totalDuration and recreate PracticePlanDrill records
    if (drills !== undefined) {
      const totalDuration = drills.reduce((sum, d) => sum + d.duration, 0)
      updateData.totalDuration = totalDuration

      // Delete existing plan drills and recreate them in a transaction
      const plan = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.practicePlanDrill.deleteMany({ where: { planId: id } })

        return tx.practicePlan.update({
          where: { id },
          data: {
            ...updateData,
            drills: {
              create: drills.map((d) => ({
                drillId: d.drillId,
                order: d.order,
                duration: d.duration,
                notes: d.notes ?? null,
              })),
            },
          },
          include: planInclude,
        })
      })

      return NextResponse.json(parsePlan(plan))
    }

    const plan = await prisma.practicePlan.update({
      where: { id },
      data: updateData,
      include: planInclude,
    })

    return NextResponse.json(parsePlan(plan))
  } catch (error) {
    console.error('[PRACTICE PLAN PATCH]', error)
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

    const existing = await prisma.practicePlan.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: 'Practice plan not found' }, { status: 404 })
    }

    if (existing.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.practicePlan.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PRACTICE PLAN DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
