'use client'

import { useState } from 'react'
import { Drill, AGE_GROUPS, POSITIONS, SKILLS, PHASES, INTENSITIES } from '@/types'
import { cn } from '@/lib/utils'
import { Plus, X, Eye, EyeOff } from 'lucide-react'

export interface DrillFormData {
  title: string
  description: string
  objectives: string[]
  duration: number
  players: string
  intensity: string
  ageGroups: string[]
  positions: string[]
  skills: string[]
  phases: string[]
  videoUrl?: string
  imageUrl?: string
  isPublic: boolean
}

interface DrillFormProps {
  initialData?: Partial<Drill>
  onSubmit: (data: DrillFormData) => Promise<void>
  isSubmitting: boolean
}

const PLAYERS_OPTIONS = [
  { value: 'full-team', label: 'Full Team' },
  { value: 'pairs', label: 'Pairs' },
  { value: 'individual', label: 'Individual' },
  { value: 'groups', label: 'Groups' },
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display font-semibold text-white uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
      <span className="w-1 h-4 bg-railers-red rounded-full inline-block" />
      {children}
    </h3>
  )
}

function InputBase({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full bg-railers-black-card border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600',
        'focus:outline-none focus:ring-2 focus:ring-railers-red/40 focus:border-railers-red/50 transition-all',
        className
      )}
      {...props}
    />
  )
}

function CheckboxItem({
  value,
  label,
  checked,
  onChange,
}: {
  value: string
  label: string
  checked: boolean
  onChange: (value: string, checked: boolean) => void
}) {
  return (
    <label
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm select-none',
        checked
          ? 'border-railers-red/60 bg-railers-red/10 text-white'
          : 'border-white/10 bg-railers-black-card text-gray-400 hover:border-white/20 hover:text-white'
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(value, e.target.checked)}
      />
      <span
        className={cn(
          'w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
          checked ? 'bg-railers-red border-railers-red' : 'border-white/30'
        )}
      >
        {checked && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </label>
  )
}

export default function DrillForm({ initialData, onSubmit, isSubmitting }: DrillFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [objectives, setObjectives] = useState<string[]>(initialData?.objectives ?? [''])
  const [duration, setDuration] = useState<number>(initialData?.duration ?? 15)
  const [players, setPlayers] = useState<'full-team' | 'pairs' | 'individual' | 'groups'>(initialData?.players ?? 'full-team')
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>(initialData?.intensity ?? 'medium')
  const [ageGroups, setAgeGroups] = useState<string[]>(initialData?.ageGroups ?? [])
  const [positions, setPositions] = useState<string[]>(initialData?.positions ?? [])
  const [skills, setSkills] = useState<string[]>(initialData?.skills ?? [])
  const [phases, setPhases] = useState<string[]>(initialData?.phases ?? [])
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl ?? '')
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? '')
  const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Objectives helpers
  function addObjective() {
    setObjectives((prev) => [...prev, ''])
  }

  function updateObjective(index: number, value: string) {
    setObjectives((prev) => prev.map((o, i) => (i === index ? value : o)))
  }

  function removeObjective(index: number) {
    setObjectives((prev) => prev.filter((_, i) => i !== index))
  }

  // Multi-select toggle helpers
  function toggleItem(
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
    checked: boolean
  ) {
    if (checked) {
      setter((prev) => [...prev, value])
    } else {
      setter((prev) => prev.filter((v) => v !== value))
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!title.trim()) newErrors.title = 'Title is required'
    if (!description.trim()) newErrors.description = 'Description is required'
    if (duration < 1) newErrors.duration = 'Duration must be at least 1 minute'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const data: DrillFormData = {
      title: title.trim(),
      description: description.trim(),
      objectives: objectives.map((o) => o.trim()).filter(Boolean),
      duration,
      players,
      intensity,
      ageGroups,
      positions,
      skills,
      phases,
      videoUrl: videoUrl.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      isPublic,
    }

    await onSubmit(data)
  }

  const intensityColors: Record<string, string> = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-red-400',
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Section 1: Basic Info ── */}
      <div className="bg-railers-black-card border border-white/5 rounded-xl p-6">
        <SectionHeading>Basic Info</SectionHeading>
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Drill Title <span className="text-railers-red">*</span>
            </label>
            <InputBase
              type="text"
              placeholder="e.g. 2-on-1 Rush Drill"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
            {errors.title && <p className="mt-1 text-xs text-railers-red">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Description <span className="text-railers-red">*</span>
            </label>
            <textarea
              placeholder="Describe how this drill is run, setup, and any coaching cues..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={cn(
                'w-full bg-railers-black-card border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 resize-y',
                'focus:outline-none focus:ring-2 focus:ring-railers-red/40 focus:border-railers-red/50 transition-all'
              )}
            />
            {errors.description && <p className="mt-1 text-xs text-railers-red">{errors.description}</p>}
          </div>
        </div>
      </div>

      {/* ── Section 2: Objectives ── */}
      <div className="bg-railers-black-card border border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <SectionHeading>Objectives</SectionHeading>
          <button
            type="button"
            onClick={addObjective}
            className="flex items-center gap-1.5 text-xs font-semibold text-railers-red hover:text-railers-red-light transition-colors border border-railers-red/30 hover:border-railers-red/60 px-3 py-1.5 rounded-lg"
          >
            <Plus size={13} />
            Add Objective
          </button>
        </div>

        <div className="space-y-2">
          {objectives.length === 0 && (
            <p className="text-sm text-gray-600 italic">
              No objectives yet. Click &ldquo;Add Objective&rdquo; to add one.
            </p>
          )}
          {objectives.map((obj, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs font-bold text-railers-red w-5 flex-shrink-0 text-right">
                {index + 1}.
              </span>
              <InputBase
                type="text"
                placeholder={`Objective ${index + 1}...`}
                value={obj}
                onChange={(e) => updateObjective(index, e.target.value)}
              />
              {objectives.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeObjective(index)}
                  className="text-gray-600 hover:text-railers-red transition-colors flex-shrink-0"
                  title="Remove objective"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 3: Settings ── */}
      <div className="bg-railers-black-card border border-white/5 rounded-xl p-6">
        <SectionHeading>Settings</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Duration (minutes)
            </label>
            <InputBase
              type="number"
              min={1}
              max={120}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10) || 1)}
            />
            {errors.duration && <p className="mt-1 text-xs text-railers-red">{errors.duration}</p>}
          </div>

          {/* Players */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Players
            </label>
            <select
              value={players}
              onChange={(e) => setPlayers(e.target.value as 'full-team' | 'pairs' | 'individual' | 'groups')}
              className={cn(
                'w-full bg-railers-black-card border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white',
                'focus:outline-none focus:ring-2 focus:ring-railers-red/40 focus:border-railers-red/50 transition-all',
                'appearance-none cursor-pointer'
              )}
            >
              {PLAYERS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Intensity */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Intensity
            </label>
            <select
              value={intensity}
              onChange={(e) => setIntensity(e.target.value as 'low' | 'medium' | 'high')}
              className={cn(
                'w-full bg-railers-black-card border border-white/10 rounded-lg px-4 py-2.5 text-sm transition-all',
                'focus:outline-none focus:ring-2 focus:ring-railers-red/40 focus:border-railers-red/50',
                'appearance-none cursor-pointer',
                intensityColors[intensity] ?? 'text-white'
              )}
            >
              {INTENSITIES.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 4: Categories ── */}
      <div className="bg-railers-black-card border border-white/5 rounded-xl p-6 space-y-6">
        <SectionHeading>Categories</SectionHeading>

        {/* Age Groups */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Age Groups</p>
          <div className="flex flex-wrap gap-2">
            {AGE_GROUPS.map((ag) => (
              <CheckboxItem
                key={ag.value}
                value={ag.value}
                label={ag.label}
                checked={ageGroups.includes(ag.value)}
                onChange={(v, c) => toggleItem(ageGroups, setAgeGroups, v, c)}
              />
            ))}
          </div>
        </div>

        {/* Positions */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Positions</p>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map((pos) => (
              <CheckboxItem
                key={pos.value}
                value={pos.value}
                label={pos.label}
                checked={positions.includes(pos.value)}
                onChange={(v, c) => toggleItem(positions, setPositions, v, c)}
              />
            ))}
          </div>
        </div>

        {/* Skills */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Skills</p>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((skill) => (
              <CheckboxItem
                key={skill.value}
                value={skill.value}
                label={`${skill.icon} ${skill.label}`}
                checked={skills.includes(skill.value)}
                onChange={(v, c) => toggleItem(skills, setSkills, v, c)}
              />
            ))}
          </div>
        </div>

        {/* Phases */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Practice Phase</p>
          <div className="flex flex-wrap gap-2">
            {PHASES.map((phase) => (
              <CheckboxItem
                key={phase.value}
                value={phase.value}
                label={phase.label}
                checked={phases.includes(phase.value)}
                onChange={(v, c) => toggleItem(phases, setPhases, v, c)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 5: Media ── */}
      <div className="bg-railers-black-card border border-white/5 rounded-xl p-6">
        <SectionHeading>Media</SectionHeading>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Video URL <span className="text-gray-600 font-normal normal-case">(optional)</span>
            </label>
            <InputBase
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Image URL <span className="text-gray-600 font-normal normal-case">(optional)</span>
            </label>
            <InputBase
              type="url"
              placeholder="https://example.com/drill-diagram.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Section 6: Visibility ── */}
      <div className="bg-railers-black-card border border-white/5 rounded-xl p-6">
        <SectionHeading>Visibility</SectionHeading>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">
              {isPublic ? 'Public' : 'Private'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {isPublic
                ? 'Other coaches can view this drill in the library.'
                : 'Only you can see this drill.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic((prev) => !prev)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-railers-red/40 focus:ring-offset-2 focus:ring-offset-railers-black',
              isPublic ? 'bg-railers-red' : 'bg-white/10'
            )}
            aria-label="Toggle visibility"
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                isPublic ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          {isPublic ? (
            <Eye size={13} className="text-railers-red" />
          ) : (
            <EyeOff size={13} />
          )}
          <span>{isPublic ? 'Visible to all coaches' : 'Hidden from public library'}</span>
        </div>
      </div>

      {/* ── Submit ── */}
      <div className="flex items-center justify-end gap-3 pt-2 pb-8">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'flex items-center gap-2 bg-railers-red hover:bg-railers-red-dark text-white font-semibold',
            'px-6 py-2.5 rounded-lg transition-all text-sm shadow-lg shadow-railers-red/20',
            'focus:outline-none focus:ring-2 focus:ring-railers-red/40 focus:ring-offset-2 focus:ring-offset-railers-black',
            isSubmitting && 'opacity-60 cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Saving...
            </>
          ) : (
            'Save Drill'
          )}
        </button>
      </div>
    </form>
  )
}
