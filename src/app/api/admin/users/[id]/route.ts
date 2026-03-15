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

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['coach', 'admin']).optional(),
  teamName: z.string().optional().nullable(),
  password: z.string().min(8).optional().or(z.literal('')),
})

// PATCH /api/admin/users/[id] — update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = params

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await request.json()
  const parsed = updateUserSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { password, ...rest } = parsed.data
  const updateData: Record<string, unknown> = { ...rest }

  if (password) {
    updateData.password = await bcrypt.hash(password, 12)
  }

  // Prevent removing the last admin
  if (rest.role === 'coach' && existing.role === 'admin') {
    const adminCount = await prisma.user.count({ where: { role: 'admin' } })
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot demote the last admin account' },
        { status: 400 }
      )
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      teamName: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/admin/users/[id] — delete user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = params

  // Prevent self-deletion
  if (id === session.user.id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Prevent deleting the last admin
  if (existing.role === 'admin') {
    const adminCount = await prisma.user.count({ where: { role: 'admin' } })
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last admin account' },
        { status: 400 }
      )
    }
  }

  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
