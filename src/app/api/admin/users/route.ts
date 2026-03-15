import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  if (session.user.role !== 'admin') return null
  return session
}

// GET /api/admin/users — list all users with stats
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      teamName: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          drills: true,
          practicePlans: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(users)
}

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['coach', 'admin']).default('coach'),
  teamName: z.string().optional().or(z.literal('')),
})

// POST /api/admin/users — create a new user
export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = createUserSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { name, email, password, role, teamName } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role,
      teamName: teamName || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      teamName: true,
      createdAt: true,
    },
  })

  return NextResponse.json(user, { status: 201 })
}
