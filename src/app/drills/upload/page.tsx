'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { TopBar } from '@/components/layout/TopBar'
import { cn } from '@/lib/utils'
import {
  AGE_GROUPS,
  POSITIONS,
  SKILLS,
  PHASES,
  INTENSITIES,
  AgeGroup,
  Position,
  Skill,
  Phase,
} from '@/types'
import {
  ArrowLeft,
  Upload,
  ImageIcon,
  Sparkles,
  Check,
  X,
  Plus,
  AlertCircle,
  Loader2,
  ChevronRight,
  RotateCcw,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface ParsedDrill {
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
  confidence: number
}

type Step = 'upload' | 'analyzing' | 'review' | 'saving'

// ── Small reusables ───────────────────────────────────────────────────────────

function InputBase({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full bg-railers-black border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600',
        'focus:outline-none focus:ring-2 focus:ring-railers-red/40 focus:border-railers-red/50 transition-all',
        className
      )}
      {...props}
    />
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display font-semibold text-white uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
      <span className="w-1 h-4 bg-railers-red rounded-full inline-block" />
      {children}
    </h3>
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
          : 'border-white/10 bg-railers-black text-gray-400 hover:border-white/20 hover:text-white'
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

// ── ConfidenceBadge ───────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100)
  const color =
    pct >= 80 ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
    pct >= 50 ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' :
                'text-orange-400 bg-orange-400/10 border-orange-400/20'
  const label =
    pct >= 80 ? 'High confidence' :
    pct >= 50 ? 'Medium confidence' : 'Low confidence — review carefully'

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', color)}>
      <Sparkles size={11} />
      {label} ({pct}%)
    </span>
  )
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ['Upload', 'AI Analysis', 'Review & Save']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-all',
                i < current
                  ? 'bg-railers-red border-railers-red text-white'
                  : i === current
                  ? 'bg-railers-red/20 border-railers-red text-railers-red'
                  : 'bg-white/5 border-white/10 text-gray-600'
              )}
            >
              {i < current ? <Check size={12} /> : i + 1}
            </div>
            <span
              className={cn(
                'text-xs font-medium hidden sm:block',
                i === current ? 'text-white' : i < current ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <ChevronRight size={14} className="text-white/10 mx-1" />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UploadDrillPage() {
  const router = useRouter()

  // Upload state
  const [step, setStep] = useState<Step>('upload')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parsed drill state
  const [parsed, setParsed] = useState<ParsedDrill | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  // Editable form state (filled from AI)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [objectives, setObjectives] = useState<string[]>([''])
  const [duration, setDuration] = useState(15)
  const [players, setPlayers] = useState('full-team')
  const [intensity, setIntensity] = useState('medium')
  const [ageGroups, setAgeGroups] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [phases, setPhases] = useState<string[]>([])
  const [isPublic, setIsPublic] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── Upload helpers ──────────────────────────────────────────────────────────

  async function uploadFile(file: File) {
    setUploadError(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error ?? `Upload failed (${res.status})`)
    }
    const { url } = await res.json()
    return url as string
  }

  async function analyzeImage(url: string) {
    setParseError(null)
    setStep('analyzing')

    const res = await fetch('/api/drills/parse-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: url }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.error ?? `Analysis failed (${res.status})`)
    }

    const { drill } = await res.json()
    return drill as ParsedDrill
  }

  function populateForm(drill: ParsedDrill) {
    setTitle(drill.title ?? '')
    setDescription(drill.description ?? '')
    setObjectives(drill.objectives?.length ? drill.objectives : [''])
    setDuration(typeof drill.duration === 'number' ? drill.duration : 15)
    setPlayers(drill.players ?? 'full-team')
    setIntensity(drill.intensity ?? 'medium')
    setAgeGroups(drill.ageGroups ?? [])
    setPositions(drill.positions ?? [])
    setSkills(drill.skills ?? [])
    setPhases(drill.phases ?? [])
  }

  async function handleFile(file: File) {
    try {
      const url = await uploadFile(file)
      setImageUrl(url)

      const drill = await analyzeImage(url)
      setParsed(drill)
      populateForm(drill)
      setStep('review')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      if (step === 'analyzing') {
        setParseError(msg)
        setStep('upload') // allow retry
      } else {
        setUploadError(msg)
      }
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  // ── Form helpers ────────────────────────────────────────────────────────────

  function toggleItem(
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
    checked: boolean
  ) {
    if (checked) setter((prev) => [...prev, value])
    else setter((prev) => prev.filter((v) => v !== value))
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaveError(null)
    setStep('saving')

    try {
      const res = await fetch('/api/drills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          objectives: objectives.map((o) => o.trim()).filter(Boolean),
          duration,
          players,
          intensity,
          ageGroups: ageGroups.length ? ageGroups : ['adult'],
          positions: positions.length ? positions : ['all'],
          skills: skills.length ? skills : ['skating'],
          phases: phases.length ? phases : ['skill-development'],
          imageUrl: imageUrl ?? undefined,
          isPublic,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Save failed (${res.status})`)
      }

      const drill = await res.json()
      router.push(`/drills/${drill.id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('review')
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const stepIndex = step === 'upload' || step === 'analyzing' ? 0 : step === 'review' ? 1 : 2

  return (
    <div className="min-h-screen">
      <TopBar title="Upload Drill Image" />

      <div className="p-6 max-w-3xl mx-auto">
        {/* Back */}
        <Link
          href="/drills"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Back to Drill Library
        </Link>

        {/* Heading */}
        <div className="mb-6">
          <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
            Upload Drill from Image
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Upload a photo of a drill diagram — whiteboard, printed sheet, or hand-drawn sketch — and Claude will extract and categorize it automatically.
          </p>
        </div>

        <StepIndicator current={stepIndex} />

        {/* ── Step 1: Upload ─────────────────────────────────────────────────── */}
        {(step === 'upload' || step === 'analyzing') && (
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              className={cn(
                'relative rounded-xl border-2 border-dashed transition-all',
                isDragging
                  ? 'border-railers-red bg-railers-red/5'
                  : 'border-white/10 bg-railers-black-card hover:border-white/20',
                step === 'analyzing' && 'pointer-events-none opacity-60'
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => step === 'upload' && fileInputRef.current?.click()}
              style={{ cursor: step === 'upload' ? 'pointer' : 'default' }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={onFileChange}
              />

              {imageUrl && step === 'analyzing' ? (
                // Preview while analyzing
                <div className="p-6 flex flex-col items-center gap-4">
                  <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-white/10">
                    <Image src={imageUrl} alt="Uploaded drill" fill className="object-contain" />
                  </div>
                  <div className="flex items-center gap-2 text-railers-red">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm font-medium">Claude is analyzing the diagram...</span>
                  </div>
                  <p className="text-xs text-gray-600">This usually takes 5–10 seconds</p>
                </div>
              ) : (
                // Upload prompt
                <div className="p-12 flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 bg-railers-red/10 border border-railers-red/20 rounded-full flex items-center justify-center">
                    <Upload size={28} className="text-railers-red" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Drop a drill image here</p>
                    <p className="text-gray-500 text-xs mt-1">or click to browse</p>
                  </div>
                  <div className="flex gap-2">
                    {['JPEG', 'PNG', 'WEBP', 'GIF'].map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-500 border border-white/10">
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">Max 10 MB</p>
                </div>
              )}
            </div>

            {/* Errors */}
            {(uploadError || parseError) && (
              <div className="flex items-start gap-2 bg-railers-red/10 border border-railers-red/30 rounded-xl px-4 py-3 text-sm text-railers-red-light">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Error: </span>
                  {uploadError ?? parseError}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-railers-black-card border border-white/5 rounded-xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tips for best results</p>
              <ul className="space-y-2 text-xs text-gray-500">
                <li className="flex items-start gap-2">
                  <span className="text-railers-red font-bold flex-shrink-0">•</span>
                  Make sure the rink diagram is clearly visible and not blurry
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-railers-red font-bold flex-shrink-0">•</span>
                  Include any labels, titles, or coaching notes in the image
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-railers-red font-bold flex-shrink-0">•</span>
                  Works with whiteboards, printed drill sheets, and hand-drawn diagrams
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-railers-red font-bold flex-shrink-0">•</span>
                  You'll be able to review and edit all fields before saving
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ── Step 2: Review ────────────────────────────────────────────────── */}
        {(step === 'review' || step === 'saving') && parsed && (
          <div className="space-y-6">
            {/* Image + confidence */}
            <div className="bg-railers-black-card border border-white/5 rounded-xl p-5 flex items-start gap-5">
              {imageUrl && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                  <Image src={imageUrl} alt="Uploaded drill" fill className="object-contain" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-railers-red" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    AI Extracted
                  </span>
                </div>
                <ConfidenceBadge confidence={parsed.confidence} />
                <p className="text-xs text-gray-600 mt-2">
                  Review the fields below. Claude&apos;s suggestions are pre-filled — edit anything before saving.
                </p>
                <button
                  type="button"
                  onClick={() => { setStep('upload'); setImageUrl(null); setParsed(null) }}
                  className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
                >
                  <RotateCcw size={12} /> Upload different image
                </button>
              </div>
            </div>

            {/* Error */}
            {saveError && (
              <div className="flex items-start gap-2 bg-railers-red/10 border border-railers-red/30 rounded-xl px-4 py-3 text-sm text-railers-red-light">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <div><span className="font-semibold">Error: </span>{saveError}</div>
              </div>
            )}

            {/* Basic Info */}
            <div className="bg-railers-black-card border border-white/5 rounded-xl p-6 space-y-4">
              <SectionHeading>Basic Info</SectionHeading>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Drill Title <span className="text-railers-red">*</span>
                </label>
                <InputBase
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Drill title"
                  maxLength={120}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Description <span className="text-railers-red">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe how this drill works..."
                  className={cn(
                    'w-full bg-railers-black border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 resize-y',
                    'focus:outline-none focus:ring-2 focus:ring-railers-red/40 focus:border-railers-red/50 transition-all'
                  )}
                />
              </div>
            </div>

            {/* Objectives */}
            <div className="bg-railers-black-card border border-white/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <SectionHeading>Objectives</SectionHeading>
                <button
                  type="button"
                  onClick={() => setObjectives((prev) => [...prev, ''])}
                  className="flex items-center gap-1.5 text-xs font-semibold text-railers-red hover:text-railers-red-light border border-railers-red/30 hover:border-railers-red/60 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus size={13} /> Add
                </button>
              </div>
              <div className="space-y-2">
                {objectives.map((obj, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-railers-red w-5 text-right flex-shrink-0">{i + 1}.</span>
                    <InputBase
                      type="text"
                      value={obj}
                      onChange={(e) => setObjectives((prev) => prev.map((o, j) => (j === i ? e.target.value : o)))}
                      placeholder={`Objective ${i + 1}...`}
                    />
                    {objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setObjectives((prev) => prev.filter((_, j) => j !== i))}
                        className="text-gray-600 hover:text-railers-red transition-colors flex-shrink-0"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="bg-railers-black-card border border-white/5 rounded-xl p-6">
              <SectionHeading>Settings</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Duration (min)
                  </label>
                  <InputBase
                    type="number"
                    min={1}
                    max={120}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Players
                  </label>
                  <select
                    value={players}
                    onChange={(e) => setPlayers(e.target.value)}
                    className={cn(
                      'w-full bg-railers-black border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white',
                      'focus:outline-none focus:ring-2 focus:ring-railers-red/40 focus:border-railers-red/50 transition-all appearance-none cursor-pointer'
                    )}
                  >
                    {[
                      { value: 'full-team', label: 'Full Team' },
                      { value: 'pairs', label: 'Pairs' },
                      { value: 'individual', label: 'Individual' },
                      { value: 'groups', label: 'Groups' },
                    ].map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Intensity
                  </label>
                  <select
                    value={intensity}
                    onChange={(e) => setIntensity(e.target.value)}
                    className={cn(
                      'w-full bg-railers-black border border-white/10 rounded-lg px-4 py-2.5 text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-railers-red/40 focus:border-railers-red/50 transition-all appearance-none cursor-pointer',
                      intensity === 'low' ? 'text-green-400' : intensity === 'high' ? 'text-red-400' : 'text-yellow-400'
                    )}
                  >
                    {INTENSITIES.map((opt) => (
                      <option key={opt.value} value={opt.value} className="text-white">{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-railers-black-card border border-white/5 rounded-xl p-6 space-y-6">
              <div className="flex items-center gap-2">
                <SectionHeading>Categories</SectionHeading>
                <span className="text-xs text-gray-500 -mt-4">(AI suggested — confirm before saving)</span>
              </div>

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

            {/* Visibility */}
            <div className="bg-railers-black-card border border-white/5 rounded-xl p-6">
              <SectionHeading>Visibility</SectionHeading>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{isPublic ? 'Public' : 'Private'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isPublic ? 'Other coaches can view this drill.' : 'Only you can see this drill.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic((p) => !p)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                    isPublic ? 'bg-railers-red' : 'bg-white/10'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                      isPublic ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Save footer */}
            <div className="flex items-center justify-end gap-3 pt-2 pb-8">
              <Link
                href="/drills"
                className="text-sm text-gray-500 hover:text-white transition-colors px-4 py-2.5"
              >
                Cancel
              </Link>
              <button
                type="button"
                disabled={step === 'saving' || !title.trim()}
                onClick={handleSave}
                className={cn(
                  'flex items-center gap-2 bg-railers-red hover:bg-railers-red-dark text-white font-semibold',
                  'px-6 py-2.5 rounded-lg transition-all text-sm shadow-lg shadow-railers-red/20',
                  'focus:outline-none focus:ring-2 focus:ring-railers-red/40',
                  (step === 'saving' || !title.trim()) && 'opacity-60 cursor-not-allowed'
                )}
              >
                {step === 'saving' ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    Save Drill
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
