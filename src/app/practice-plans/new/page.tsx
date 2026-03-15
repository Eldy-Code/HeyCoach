'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { Drill, SKILLS, AGE_GROUPS } from '@/types'
import { formatDuration } from '@/lib/utils'
import {
  ArrowLeft,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Clock,
  Search,
  ClipboardList,
  Save,
  Loader2,
} from 'lucide-react'

interface SelectedDrill {
  drillId: string
  order: number
  duration: number
  notes: string
  drill: Drill
}

export default function NewPracticePlanPage() {
  const router = useRouter()

  // Plan metadata
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [teamNotes, setTeamNotes] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  // Drill selection
  const [selectedDrills, setSelectedDrills] = useState<SelectedDrill[]>([])
  const [allDrills, setAllDrills] = useState<Drill[]>([])
  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState('')

  // UI state
  const [isLoadingDrills, setIsLoadingDrills] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDrills() {
      try {
        const res = await fetch('/api/drills?limit=200')
        if (res.ok) {
          const data = await res.json()
          setAllDrills(data.drills ?? data)
        }
      } catch {
        // silently fail - user can still type
      } finally {
        setIsLoadingDrills(false)
      }
    }
    fetchDrills()
  }, [])

  const totalDuration = selectedDrills.reduce((sum, d) => sum + d.duration, 0)

  const filteredDrills = allDrills.filter((drill) => {
    const matchesSearch =
      !search ||
      drill.title.toLowerCase().includes(search.toLowerCase()) ||
      drill.description?.toLowerCase().includes(search.toLowerCase())
    const matchesSkill =
      !skillFilter || drill.skills.includes(skillFilter as Drill['skills'][number])
    // Don't show drills already added
    const notAdded = !selectedDrills.some((sd) => sd.drillId === drill.id)
    return matchesSearch && matchesSkill && notAdded
  })

  function addDrill(drill: Drill) {
    setSelectedDrills((prev) => [
      ...prev,
      {
        drillId: drill.id,
        order: prev.length + 1,
        duration: drill.duration,
        notes: '',
        drill,
      },
    ])
  }

  function removeDrill(drillId: string) {
    setSelectedDrills((prev) => {
      const updated = prev.filter((d) => d.drillId !== drillId)
      return updated.map((d, i) => ({ ...d, order: i + 1 }))
    })
  }

  function moveUp(index: number) {
    if (index === 0) return
    setSelectedDrills((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next.map((d, i) => ({ ...d, order: i + 1 }))
    })
  }

  function moveDown(index: number) {
    setSelectedDrills((prev) => {
      if (index === prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next.map((d, i) => ({ ...d, order: i + 1 }))
    })
  }

  function updateDrillDuration(drillId: string, value: string) {
    const num = parseInt(value, 10)
    if (isNaN(num) || num < 1) return
    setSelectedDrills((prev) =>
      prev.map((d) => (d.drillId === drillId ? { ...d, duration: num } : d)),
    )
  }

  function updateDrillNotes(drillId: string, value: string) {
    setSelectedDrills((prev) =>
      prev.map((d) => (d.drillId === drillId ? { ...d, notes: value } : d)),
    )
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Plan title is required.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        date: date || undefined,
        ageGroup: ageGroup || undefined,
        teamNotes: teamNotes.trim() || undefined,
        isPublic,
        drills: selectedDrills.map((d) => ({
          drillId: d.drillId,
          order: d.order,
          duration: d.duration,
          notes: d.notes || undefined,
        })),
      }

      const res = await fetch('/api/practice-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Server error (${res.status})`)
      }

      const plan = await res.json()
      router.push(`/practice-plans/${plan.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      <TopBar title="New Practice Plan" />

      <div className="p-6">
        {/* Back link */}
        <Link
          href="/practice-plans"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Back to Practice Plans
        </Link>

        {error && (
          <div className="mb-4 bg-red-900/30 border border-red-500/30 text-red-300 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Two-column layout */}
        <div className="flex gap-6 h-[calc(100vh-180px)]">
          {/* LEFT: Drill Library (2/5) */}
          <div className="w-2/5 flex flex-col bg-railers-black-card border border-white/5 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/5 space-y-3 shrink-0">
              <h2 className="font-display font-semibold text-white text-sm uppercase tracking-wide">
                Drill Library
              </h2>

              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search drills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-railers-black border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-railers-red/50"
                />
              </div>

              {/* Skill filter */}
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="w-full bg-railers-black border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-railers-red/50"
              >
                <option value="">All Skills</option>
                {SKILLS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Drill list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoadingDrills ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-railers-red" />
                </div>
              ) : filteredDrills.length === 0 ? (
                <div className="text-center py-10 text-gray-600 text-sm">
                  {search || skillFilter ? 'No drills match your filters.' : 'No drills available.'}
                </div>
              ) : (
                filteredDrills.map((drill) => (
                  <div
                    key={drill.id}
                    className="bg-railers-black border border-white/5 rounded-lg p-3 flex items-start gap-3 hover:border-white/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold leading-snug truncate">
                        {drill.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-gray-500 text-xs flex items-center gap-0.5">
                          <Clock size={10} />
                          {drill.duration}m
                        </span>
                        {drill.skills.slice(0, 2).map((sk) => (
                          <span
                            key={sk}
                            className="text-xs bg-railers-red/10 text-railers-red/80 px-1.5 py-0.5 rounded"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => addDrill(drill)}
                      className="shrink-0 w-7 h-7 bg-railers-red hover:bg-railers-red-dark text-white rounded-lg flex items-center justify-center transition-colors"
                      title="Add to plan"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: Plan Builder (3/5) */}
          <div className="flex-1 flex flex-col overflow-y-auto space-y-5">
            {/* Plan Details */}
            <div className="bg-railers-black-card border border-white/5 rounded-xl p-5 space-y-4 shrink-0">
              <h2 className="font-display font-semibold text-white text-sm uppercase tracking-wide">
                Plan Details
              </h2>

              {/* Title */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Title <span className="text-railers-red">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tuesday Power Skating Practice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-railers-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-railers-red/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <textarea
                  placeholder="Brief overview of this practice session..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-railers-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-railers-red/50 resize-none"
                />
              </div>

              {/* Date + Age Group row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Practice Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-railers-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-railers-red/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Age Group</label>
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className="w-full bg-railers-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-railers-red/50"
                  >
                    <option value="">Select age group</option>
                    {AGE_GROUPS.map((ag) => (
                      <option key={ag.value} value={ag.value}>
                        {ag.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Team Notes */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Team Notes</label>
                <textarea
                  placeholder="Notes for your team, focus points, reminders..."
                  value={teamNotes}
                  onChange={(e) => setTeamNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-railers-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-railers-red/50 resize-none"
                />
              </div>
            </div>

            {/* Plan Builder */}
            <div className="bg-railers-black-card border border-white/5 rounded-xl p-5 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                  <ClipboardList size={16} className="text-railers-red" />
                  Plan Builder
                </h2>
                {selectedDrills.length > 0 && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock size={12} className="text-railers-red/60" />
                    Total: <span className="text-white font-semibold">{formatDuration(totalDuration)}</span>
                  </span>
                )}
              </div>

              {selectedDrills.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
                  <ClipboardList size={28} className="text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">
                    Add drills from the library on the left.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDrills.map((sd, index) => (
                    <div
                      key={sd.drillId}
                      className="bg-railers-black border border-white/5 rounded-lg p-3"
                    >
                      <div className="flex items-start gap-3">
                        {/* Order number */}
                        <span className="shrink-0 w-6 h-6 bg-railers-red/10 text-railers-red text-xs font-bold rounded flex items-center justify-center mt-0.5">
                          {sd.order}
                        </span>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-white text-sm font-semibold truncate">
                              {sd.drill.title}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Move up/down */}
                              <button
                                onClick={() => moveUp(index)}
                                disabled={index === 0}
                                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-white/5 transition-colors"
                              >
                                <ChevronUp size={14} />
                              </button>
                              <button
                                onClick={() => moveDown(index)}
                                disabled={index === selectedDrills.length - 1}
                                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-white/5 transition-colors"
                              >
                                <ChevronDown size={14} />
                              </button>
                              {/* Remove */}
                              <button
                                onClick={() => removeDrill(sd.drillId)}
                                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-red-400 rounded hover:bg-white/5 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Skills */}
                          {sd.drill.skills.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {sd.drill.skills.slice(0, 3).map((sk) => (
                                <span
                                  key={sk}
                                  className="text-xs bg-railers-red/10 text-railers-red/70 px-1.5 py-0.5 rounded"
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Duration + Notes */}
                          <div className="flex gap-2">
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-gray-500 shrink-0" />
                              <input
                                type="number"
                                min={1}
                                value={sd.duration}
                                onChange={(e) => updateDrillDuration(sd.drillId, e.target.value)}
                                className="w-16 bg-railers-black-soft border border-white/10 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-railers-red/50"
                              />
                              <span className="text-xs text-gray-600">min</span>
                            </div>
                          </div>

                          <input
                            type="text"
                            placeholder="Optional notes for this drill..."
                            value={sd.notes}
                            onChange={(e) => updateDrillNotes(sd.drillId, e.target.value)}
                            className="w-full bg-railers-black-soft border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-railers-red/50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {selectedDrills.length} drill{selectedDrills.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <Clock size={14} className="text-railers-red" />
                      {formatDuration(totalDuration)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer: visibility + save */}
            <div className="bg-railers-black-card border border-white/5 rounded-xl p-4 flex items-center justify-between shrink-0">
              {/* Public toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-5 rounded-full transition-colors ${
                      isPublic ? 'bg-railers-red' : 'bg-white/10'
                    }`}
                  />
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      isPublic ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="text-sm text-gray-400">Make plan public</span>
              </label>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={isSaving || !title.trim()}
                className="flex items-center gap-2 bg-railers-red hover:bg-railers-red-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Save Plan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
