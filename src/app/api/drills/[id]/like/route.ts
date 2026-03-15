import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: drillId } = params
    const userId = session.user.id

    // Verify the drill exists
    const drill = await prisma.drill.findUnique({ where: { id: drillId } })

    if (!drill) {
      return NextResponse.json({ error: 'Drill not found' }, { status: 404 })
    }

    // Check if the user has already liked this drill
    const existingLike = await prisma.drillLike.findUnique({
      where: {
        drillId_userId: { drillId, userId },
      },
    })

    let liked: boolean

    if (existingLike) {
      // Unlike: remove the existing like
      await prisma.drillLike.delete({
        where: { id: existingLike.id },
      })
      liked = false
    } else {
      // Like: create a new like
      await prisma.drillLike.create({
        data: { drillId, userId },
      })
      liked = true
    }

    const count = await prisma.drillLike.count({ where: { drillId } })

    return NextResponse.json({ liked, count })
  } catch (error) {
    console.error('[DRILL LIKE POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
