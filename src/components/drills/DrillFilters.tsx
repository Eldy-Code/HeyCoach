'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { AGE_GROUPS, POSITIONS, SKILLS, PHASES, INTENSITIES } from '@/types'
import { Filter, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function DrillFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/drills?${params.toString()}`)
  }

  function clearAll() {
    router.push('/drills')
  }

  const hasFilters = ['ageGroup', 'position', 'skill', 'phase', 'intensity', 'visibility'].some(
    (k) => searchParams.has(k)
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors',
            open ? 'bg-railers-red text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          )}
        >
          <Filter size={14} />
          Filters
          {hasFilters && (
            <span className="w-4 h-4 bg-white text-railers-red rounded-full text-[10px] font-bold flex items-center justify-center">
              !
            </span>
          )}
        </button>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-railers-red flex items-center gap-1 transition-colors"
          >
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {open && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-railers-black-card border border-white/5 rounded-xl animate-fade-in">
          {/* Age Group */}
          <div>
            <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5">
              Age Group
            </label>
            <select
              value={searchParams.get('ageGroup') ?? ''}
              onChange={(e) => setParam('ageGroup', e.target.value)}
              className="w-full bg-railers-black border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-railers-red/50"
            >
              <option value="">All ages</option>
              {AGE_GROUPS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {/* Position */}
          <div>
            <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5">
              Position
            </label>
            <select
              value={searchParams.get('position') ?? ''}
              onChange={(e) => setParam('position', e.target.value)}
              className="w-full bg-railers-black border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-railers-red/50"
            >
              <option value="">All positions</option>
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Skill */}
          <div>
            <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5">
              Skill
            </label>
            <select
              value={searchParams.get('skill') ?? ''}
              onChange={(e) => setParam('skill', e.target.value)}
              className="w-full bg-railers-black border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-railers-red/50"
            >
              <option value="">All skills</option>
              {SKILLS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Phase */}
          <div>
            <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5">
              Phase
            </label>
            <select
              value={searchParams.get('phase') ?? ''}
              onChange={(e) => setParam('phase', e.target.value)}
              className="w-full bg-railers-black border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-railers-red/50"
            >
              <option value="">All phases</option>
              {PHASES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1.5">
              Visibility
            </label>
            <select
              value={searchParams.get('visibility') ?? ''}
              onChange={(e) => setParam('visibility', e.target.value)}
              className="w-full bg-railers-black border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-railers-red/50"
            >
              <option value="">All</option>
              <option value="mine">My Drills</option>
              <option value="public">Public</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
