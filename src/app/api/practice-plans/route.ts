import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { parseJsonField } from '@/lib/utils'

const practicePlanDrillSchema = z.object({
  drillId: z.string().min(1, 'drillId is required'),
  order: z.number().int().nonnegative(),
  duration: z.number().int().positive('Duration must be positive'),
  notes: z.string().optional().nullable(),
})

const createPracticePlanSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable(),
  date: z.string().datetime().optional().nullable(),
  ageGroup: z.string().optional().nullable(),
  teamNotes: z.string().optional().nullable(),
  isPublic: z.boolean().default(false),
  drills: z.array(practicePlanDrillSchema).default([]),
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plans = await prisma.practicePlan.findMany({
      where: { authorId: session.user.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            teamName: true,
          },
        },
        drills: {
          orderBy: { order: 'asc' },
          include: {
            drill: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(plans.map(parsePlan))
  } catch (error) {
    console.error('[PRACTICE PLANS GET]', error)
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
    const parsed = createPracticePlanSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, description, date, ageGroup, teamNotes, isPublic, drills } =
      parsed.data

    const totalDuration = drills.reduce((sum, d) => sum + d.duration, 0)

    const plan = await prisma.practicePlan.create({
      data: {
        title,
        description: description ?? null,
        date: date ? new Date(date) : null,
        ageGroup: ageGroup ?? null,
        teamNotes: teamNotes ?? null,
        isPublic,
        totalDuration,
        authorId: session.user.id,
        drills: {
          create: drills.map((d) => ({
            drillId: d.drillId,
            order: d.order,
            duration: d.duration,
            notes: d.notes ?? null,
          })),
        },
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
        drills: {
          orderBy: { order: 'asc' },
          include: {
            drill: true,
          },
        },
      },
    })

    return NextResponse.json(parsePlan(plan), { status: 201 })
  } catch (error) {
    console.error('[PRACTICE PLANS POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
