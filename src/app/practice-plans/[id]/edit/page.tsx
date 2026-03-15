'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { Drill, SKILLS, AGE_GROUPS } from '@/types'
import { formatDuration, cn } from '@/lib/utils'
import {
  ArrowLeft,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  Clock,
  Search,
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

export default function EditPracticePlanPage() {
  const router = useRouter()
  const params = useParams()
  const planId = params.id as string

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [teamNotes, setTeamNotes] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [selectedDrills, setSelectedDrills] = useState<SelectedDrill[]>([])
  const [allDrills, setAllDrills] = useState<Drill[]>([])
  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const [planRes, drillsRes] = await Promise.all([
          fetch(`/api/practice-plans/${planId}`),
          fetch('/api/drills'),
        ])
        const [planData, drillsData] = await Promise.all([planRes.json(), drillsRes.json()])

        setTitle(planData.title ?? '')
        setDescription(planData.description ?? '')
        setDate(planData.date ? planData.date.slice(0, 10) : '')
        setAgeGroup(planData.ageGroup ?? '')
        setTeamNotes(planData.teamNotes ?? '')
        setIsPublic(planData.isPublic ?? false)

        const loaded: SelectedDrill[] = (planData.drills ?? []).map((pd: any) => ({
          drillId: pd.drillId,
          order: pd.order,
          duration: pd.duration,
          notes: pd.notes ?? '',
          drill: pd.drill,
        }))
        setSelectedDrills(loaded)
        setAllDrills(Array.isArray(drillsData) ? drillsData : [])
      } catch {
        setError('Failed to load plan')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [planId])

  const totalDuration = selectedDrills.reduce((sum, d) => sum + d.duration, 0)

  const filteredDrills = allDrills.filter((d) => {
    const matchSearch =
      !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase())
    const matchSkill = !skillFilter || d.skills.includes(skillFilter as any)
    const alreadySelected = selectedDrills.some((s) => s.drillId === d.id)
    return matchSearch && matchSkill && !alreadySelected
  })

  function addDrill(drill: Drill) {
    setSelectedDrills((prev) => [
      ...prev,
      {
        drillId: drill.id,
        order: prev.length,
        duration: drill.duration,
        notes: '',
        drill,
      },
    ])
  }

  function removeDrill(drillId: string) {
    setSelectedDrills((prev) => {
      const filtered = prev.filter((d) => d.drillId !== drillId)
      return filtered.map((d, i) => ({ ...d, order: i }))
    })
  }

  function moveDrill(idx: number, dir: -1 | 1) {
    setSelectedDrills((prev) => {
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]]
      return next.map((d, i) => ({ ...d, order: i }))
    })
  }

  function updateDrill(drillId: string, field: 'duration' | 'notes', value: string | number) {
    setSelectedDrills((prev) =>
      prev.map((d) => (d.drillId === drillId ? { ...d, [field]: value } : d))
    )
  }

  async function handleSave() {
    if (!title.trim()) return setError('Plan title is required')
    if (selectedDrills.length === 0) return setError('Add at least one drill')
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/practice-plans/${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          date: date || null,
          ageGroup: ageGroup || null,
          teamNotes: teamNotes.trim() || null,
          isPublic,
          drills: selectedDrills.map((d) => ({
            drillId: d.drillId,
            order: d.order,
            duration: d.duration,
            notes: d.notes.trim() || null,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to update plan')
        return
      }

      router.push(`/practice-plans/${planId}`)
    } catch {
      setError('Failed to update plan. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <TopBar title="Edit Practice Plan" />
      <div className="p-6">
        <Link
          href={`/practice-plans/${planId}`}
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Plan
        </Link>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-5 gap-6">
          {/* Left: Drill library */}
          <div className="col-span-2 space-y-4">
            <div className="bg-railers-black-card border border-white/5 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <h3 className="font-display font-bold text-white uppercase text-sm tracking-wide mb-3">
                  Drill Library
                </h3>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search drills..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-railers-black border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-railers-red/50"
                  />
                </div>
                <select
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="w-full bg-railers-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-railers-red/50"
                >
                  <option value="">All skills</option>
                  {SKILLS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
                {filteredDrills.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    {allDrills.length === 0 ? 'No drills found. Create some first!' : 'No more drills to add.'}
                  </div>
                ) : (
                  filteredDrills.map((drill) => (
                    <div
                      key={drill.id}
                      className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{drill.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {formatDuration(drill.duration)} · {drill.skills[0] ?? 'General'}
                        </div>
                      </div>
                      <button
                        onClick={() => addDrill(drill)}
                        className="flex-shrink-0 w-7 h-7 bg-railers-red/20 hover:bg-railers-red text-railers-red hover:text-white rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Plan builder */}
          <div className="col-span-3 space-y-4">
            {/* Plan details */}
            <div className="bg-railers-black-card border border-white/5 rounded-xl p-5 space-y-4">
              <h3 className="font-display font-bold text-white uppercase text-sm tracking-wide">
                Plan Details
              </h3>

              <div>
                <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Tuesday Bantam Practice"
                  className="w-full input-dark text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full input-dark text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1.5">
                    Age Group
                  </label>
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className="w-full input-dark text-sm"
                  >
                    <option value="">Select age group</option>
                    {AGE_GROUPS.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Practice focus, goals, notes..."
                  rows={2}
                  className="w-full input-dark text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1.5">
                  Team Notes
                </label>
                <textarea
                  value={teamNotes}
                  onChange={(e) => setTeamNotes(e.target.value)}
                  placeholder="Notes to share with players or assistants..."
                  rows={2}
                  className="w-full input-dark text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors',
                    isPublic ? 'bg-railers-red' : 'bg-white/10'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-all',
                      isPublic ? 'left-6' : 'left-1'
                    )}
                  />
                </button>
                <span className="text-sm text-gray-400">
                  {isPublic ? 'Public – visible to all coaches' : 'Private – only you can see this'}
                </span>
              </div>
            </div>

            {/* Selected drills */}
            <div className="bg-railers-black-card border border-white/5 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <h3 className="font-display font-bold text-white uppercase text-sm tracking-wide">
                  Drills ({selectedDrills.length})
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Clock size={14} className="text-railers-red" />
                  <span className="font-display font-bold text-white">{formatDuration(totalDuration)}</span>
                  <span>total</span>
                </div>
              </div>

              {selectedDrills.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Add drills from the library on the left.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {selectedDrills.map((sd, idx) => (
                    <div key={sd.drillId} className="p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => moveDrill(idx, -1)}
                            disabled={idx === 0}
                            className="text-gray-600 hover:text-white disabled:opacity-20 transition-colors"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={() => moveDrill(idx, 1)}
                            disabled={idx === selectedDrills.length - 1}
                            className="text-gray-600 hover:text-white disabled:opacity-20 transition-colors"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>

                        <div className="w-6 h-6 bg-railers-red/20 rounded flex items-center justify-center text-railers-red text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{sd.drill.title}</div>
                          <div className="text-xs text-gray-500">{sd.drill.skills?.[0] ?? 'General'}</div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={sd.duration}
                              onChange={(e) => updateDrill(sd.drillId, 'duration', parseInt(e.target.value) || 0)}
                              min={1}
                              max={60}
                              className="w-14 bg-railers-black border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-railers-red/50"
                            />
                            <span className="text-xs text-gray-600">min</span>
                          </div>
                          <button
                            onClick={() => removeDrill(sd.drillId)}
                            className="text-gray-600 hover:text-red-400 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={sd.notes}
                        onChange={(e) => updateDrill(sd.drillId, 'notes', e.target.value)}
                        placeholder="Coaching notes for this drill..."
                        className="w-full bg-railers-black border border-white/10 rounded px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-railers-red/30"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving || !title.trim() || selectedDrills.length === 0}
              className={cn(
                'w-full flex items-center justify-center gap-2 font-display font-bold uppercase tracking-wide py-3 rounded-xl transition-all text-sm',
                saving || !title.trim() || selectedDrills.length === 0
                  ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                  : 'bg-railers-red hover:bg-railers-red-dark text-white shadow-lg shadow-railers-red/20'
              )}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
