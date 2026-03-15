import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { readFile } from 'fs/promises'
import { join } from 'path'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are an expert hockey coach assistant. Your job is to analyze images of hockey drill diagrams (whiteboard sketches, printed sheets, hand-drawn rink diagrams, etc.) and extract structured drill information from them.

Return ONLY valid JSON with the following structure — no markdown, no explanation:
{
  "title": "string (descriptive drill name, infer from diagram if not labeled)",
  "description": "string (2-4 sentences describing how the drill works, player movement, puck flow)",
  "objectives": ["string", "string", ...] (2-4 coaching objectives),
  "duration": number (suggested minutes, 5-20 range based on complexity),
  "players": "full-team" | "pairs" | "individual" | "groups",
  "intensity": "low" | "medium" | "high",
  "ageGroups": ["8u"|"10u"|"12u"|"14u"|"16u"|"18u"|"adult", ...] (suggest 1-3 appropriate age groups),
  "positions": ["all"|"forwards"|"defensemen"|"goalies"|"centers"|"wingers", ...] (which positions benefit),
  "skills": ["skating"|"passing"|"shooting"|"puck-handling"|"defense"|"goaltending"|"conditioning"|"systems"|"face-offs"|"power-play"|"penalty-kill", ...] (1-4 primary skills),
  "phases": ["warmup"|"skill-development"|"scrimmage"|"cooldown", ...] (which practice phases this fits),
  "confidence": number (0.0 to 1.0, how confident you are in the interpretation)
}

Guidelines:
- For ageGroups, if the drill looks basic/fundamental suggest younger groups; if it involves complex systems suggest older groups
- For skills, only list what is clearly practiced in this drill
- For phases, "skill-development" is the default for most drills; use "warmup" for conditioning/skating drills; "scrimmage" for game-situation drills
- If you cannot clearly see a drill diagram, still return valid JSON with your best guess and low confidence`

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { imageUrl } = body

  if (!imageUrl || typeof imageUrl !== 'string') {
    return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
  }

  let imageData: string
  let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

  if (imageUrl.startsWith('/uploads/')) {
    // Local file — read from disk and convert to base64
    const filePath = join(process.cwd(), 'public', imageUrl)
    const buffer = await readFile(filePath)
    imageData = buffer.toString('base64')
    const ext = imageUrl.split('.').pop()?.toLowerCase()
    const typeMap: Record<string, 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    }
    mediaType = typeMap[ext ?? 'jpg'] ?? 'image/jpeg'
  } else {
    return NextResponse.json({ error: 'Only local uploaded images are supported' }, { status: 400 })
  }

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageData,
            },
          },
          {
            type: 'text',
            text: 'Analyze this hockey drill diagram and extract all the structured information. Return JSON only.',
          },
        ],
      },
    ],
  })

  const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

  let parsed: Record<string, unknown>
  try {
    // Strip any accidental markdown code fences
    const clean = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    parsed = JSON.parse(clean)
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse AI response', raw: rawText },
      { status: 500 }
    )
  }

  return NextResponse.json({ drill: parsed })
}
