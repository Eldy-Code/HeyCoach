import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// GET /api/chat - list sessions for current user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessions = await prisma.chatSession.findMany({
    where: { userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(sessions)
}

// POST /api/chat - create new session or send message
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { sessionId, message, planId, createSession } = body

  // Create a new chat session
  if (createSession) {
    const chatSession = await prisma.chatSession.create({
      data: {
        userId: session.user.id,
        planId: planId ?? null,
        title: 'New Chat',
      },
      include: { messages: true },
    })
    return NextResponse.json(chatSession)
  }

  if (!sessionId || !message) {
    return NextResponse.json({ error: 'sessionId and message required' }, { status: 400 })
  }

  // Verify session belongs to user
  const chatSession = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      plan: {
        include: {
          drills: {
            include: { drill: true },
            orderBy: { order: 'asc' },
          },
        },
      },
    },
  })

  if (!chatSession) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // Save user message
  await prisma.chatMessage.create({
    data: { sessionId, role: 'user', content: message },
  })

  // Update session title from first message
  if (chatSession.messages.length === 0) {
    const title = message.slice(0, 60) + (message.length > 60 ? '...' : '')
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { title },
    })
  }

  // Build context about the practice plan if one is attached
  let planContext = ''
  if (chatSession.plan) {
    const plan = chatSession.plan
    const drillList = plan.drills
      .map((pd) => {
        const skills = JSON.parse(pd.drill.skills || '[]').join(', ')
        return `  ${pd.order + 1}. ${pd.drill.title} (${pd.duration} min) - Skills: ${skills}`
      })
      .join('\n')

    planContext = `
## Current Practice Plan: "${plan.title}"
- Total Duration: ${plan.totalDuration} minutes
- Age Group: ${plan.ageGroup ?? 'Not specified'}
- Description: ${plan.description ?? 'None'}

### Drills in this plan:
${drillList || 'No drills added yet'}

Team Notes: ${plan.teamNotes ?? 'None'}
`
  }

  // Build message history for Claude
  const messageHistory = chatSession.messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))
  messageHistory.push({ role: 'user', content: message })

  const systemPrompt = `You are HeyCoach AI, an expert youth hockey coaching assistant for the Worcester Junior Railers / Rail Dawgs program. You help coaches create, review, and optimize practice plans and drills.

Your expertise includes:
- Youth hockey development across all age groups (8U through 18U)
- Drill design for skating, passing, shooting, puck-handling, defense, goaltending, and conditioning
- Practice plan structure and time management
- Age-appropriate skill progression
- Team systems: power play, penalty kill, zone entries/exits
- Player development best practices
- The Rail Dawgs team philosophy and development approach

Communication style:
- Be enthusiastic and supportive of coaches
- Use hockey terminology naturally
- Give specific, actionable suggestions
- When suggesting drills, describe them clearly: name, setup, execution, coaching points
- When reviewing practice plans, comment on flow, balance, and age-appropriateness
- Reference the Rail Dawgs / Worcester Junior Railers culture when relevant
- Format responses clearly with headers, bullet points, and numbered lists when helpful

${planContext ? `\nContext about the current practice plan:\n${planContext}\n` : ''}

If a coach asks you to suggest a drill, provide:
1. Drill name
2. Objective/purpose
3. Setup (rink zones, number of players, equipment)
4. Execution (step-by-step)
5. Coaching points/cues
6. Variations or progressions`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messageHistory,
    })

    const assistantContent = response.content[0].type === 'text' ? response.content[0].text : ''

    // Save assistant response
    const assistantMessage = await prisma.chatMessage.create({
      data: { sessionId, role: 'assistant', content: assistantContent },
    })

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({
      message: assistantMessage,
      usage: response.usage,
    })
  } catch (err) {
    console.error('Claude API error:', err)
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 })
  }
}
