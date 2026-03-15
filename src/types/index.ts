export type AgeGroup = '8u' | '10u' | '12u' | '14u' | '16u' | '18u' | 'adult'
export type Position = 'all' | 'forwards' | 'defensemen' | 'goalies' | 'centers' | 'wingers'
export type Skill = 'skating' | 'passing' | 'shooting' | 'puck-handling' | 'defense' | 'goaltending' | 'conditioning' | 'systems' | 'face-offs' | 'power-play' | 'penalty-kill'
export type Phase = 'warmup' | 'skill-development' | 'scrimmage' | 'cooldown'
export type Intensity = 'low' | 'medium' | 'high'
export type Players = 'full-team' | 'pairs' | 'individual' | 'groups'

export interface Drill {
  id: string
  title: string
  description: string
  objectives: string[]
  duration: number
  players: Players
  intensity: Intensity
  ageGroups: AgeGroup[]
  positions: Position[]
  skills: Skill[]
  phases: Phase[]
  diagramData?: string | null
  videoUrl?: string | null
  imageUrl?: string | null
  isPublic: boolean
  authorId: string
  author?: {
    id: string
    name?: string | null
    email: string
    teamName?: string | null
  }
  likes?: DrillLike[]
  _count?: { likes: number }
  createdAt: string
  updatedAt: string
}

export interface DrillLike {
  id: string
  drillId: string
  userId: string
}

export interface PracticePlanDrill {
  id: string
  planId: string
  drillId: string
  order: number
  duration: number
  notes?: string | null
  drill: Drill
}

export interface PracticePlan {
  id: string
  title: string
  description?: string | null
  date?: string | null
  totalDuration: number
  ageGroup?: string | null
  teamNotes?: string | null
  isPublic: boolean
  authorId: string
  author?: {
    id: string
    name?: string | null
    email: string
    teamName?: string | null
  }
  drills: PracticePlanDrill[]
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export interface ChatSession {
  id: string
  title: string
  userId: string
  planId?: string | null
  messages: ChatMessage[]
  plan?: PracticePlan | null
  createdAt: string
  updatedAt: string
}

export const AGE_GROUPS: { value: AgeGroup; label: string }[] = [
  { value: '8u', label: '8U (Mites)' },
  { value: '10u', label: '10U (Squirts)' },
  { value: '12u', label: '12U (Peewees)' },
  { value: '14u', label: '14U (Bantams)' },
  { value: '16u', label: '16U (Midgets Minor)' },
  { value: '18u', label: '18U (Midgets Major)' },
  { value: 'adult', label: 'Adult' },
]

export const POSITIONS: { value: Position; label: string }[] = [
  { value: 'all', label: 'All Positions' },
  { value: 'forwards', label: 'Forwards' },
  { value: 'defensemen', label: 'Defensemen' },
  { value: 'goalies', label: 'Goalies' },
  { value: 'centers', label: 'Centers' },
  { value: 'wingers', label: 'Wingers' },
]

export const SKILLS: { value: Skill; label: string; icon: string }[] = [
  { value: 'skating', label: 'Skating', icon: '⛸️' },
  { value: 'passing', label: 'Passing', icon: '🏒' },
  { value: 'shooting', label: 'Shooting', icon: '🥅' },
  { value: 'puck-handling', label: 'Puck Handling', icon: '🏒' },
  { value: 'defense', label: 'Defense', icon: '🛡️' },
  { value: 'goaltending', label: 'Goaltending', icon: '🧤' },
  { value: 'conditioning', label: 'Conditioning', icon: '💪' },
  { value: 'systems', label: 'Team Systems', icon: '📋' },
  { value: 'face-offs', label: 'Face-offs', icon: '🏒' },
  { value: 'power-play', label: 'Power Play', icon: '⚡' },
  { value: 'penalty-kill', label: 'Penalty Kill', icon: '🚫' },
]

export const PHASES: { value: Phase; label: string }[] = [
  { value: 'warmup', label: 'Warm-up' },
  { value: 'skill-development', label: 'Skill Development' },
  { value: 'scrimmage', label: 'Scrimmage' },
  { value: 'cooldown', label: 'Cool-down' },
]

export const INTENSITIES: { value: Intensity; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-green-400' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
  { value: 'high', label: 'High', color: 'text-red-400' },
]
