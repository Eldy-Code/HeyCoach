'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import DrillForm, { DrillFormData } from '@/components/drills/DrillForm'
import { ArrowLeft } from 'lucide-react'

export default function NewDrillPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(data: DrillFormData) {
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/drills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Server error (${res.status})`)
      }

      const drill = await res.json()
      router.push(`/drills/${drill.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <TopBar title="New Drill" />

      <div className="p-6 max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/drills"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Back to Drill Library
        </Link>

        {/* Page heading */}
        <div className="mb-8">
          <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
            Create a New Drill
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Fill in the details below to add a drill to your library.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-railers-red/10 border border-railers-red/30 rounded-xl px-4 py-3 text-sm text-railers-red-light">
            <span className="font-semibold flex-shrink-0">Error:</span>
            <span>{error}</span>
          </div>
        )}

        <DrillForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  )
}
