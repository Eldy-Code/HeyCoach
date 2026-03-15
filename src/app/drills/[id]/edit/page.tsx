'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import DrillForm, { DrillFormData } from '@/components/drills/DrillForm'
import { Drill } from '@/types'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface PageProps {
  params: { id: string }
}

export default function EditDrillPage({ params }: PageProps) {
  const { id } = params
  const router = useRouter()

  const [drill, setDrill] = useState<Drill | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function fetchDrill() {
      try {
        const res = await fetch(`/api/drills/${id}`)
        if (res.status === 404) {
          setFetchError('Drill not found.')
          return
        }
        if (res.status === 403) {
          setFetchError('You do not have permission to edit this drill.')
          return
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error ?? `Server error (${res.status})`)
        }
        const data: Drill = await res.json()
        setDrill(data)
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Failed to load drill.')
      } finally {
        setLoading(false)
      }
    }

    fetchDrill()
  }, [id])

  async function handleSubmit(data: DrillFormData) {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch(`/api/drills/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Server error (${res.status})`)
      }

      router.push(`/drills/${id}`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <TopBar title="Edit Drill" />

      <div className="p-6 max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href={`/drills/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Back to Drill
        </Link>

        {/* Page heading */}
        <div className="mb-8">
          <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wide">
            Edit Drill
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Update the details below to modify this drill.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="text-railers-red animate-spin" />
              <p className="text-sm text-gray-500">Loading drill...</p>
            </div>
          </div>
        )}

        {/* Fetch error */}
        {!loading && fetchError && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-16 h-16 bg-railers-red/10 border border-railers-red/20 rounded-full flex items-center justify-center">
              <span className="text-railers-red text-2xl font-bold">!</span>
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-lg mb-1">
                Unable to Load Drill
              </h3>
              <p className="text-gray-500 text-sm">{fetchError}</p>
            </div>
            <Link
              href="/drills"
              className="inline-flex items-center gap-2 bg-railers-red hover:bg-railers-red-dark text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft size={15} />
              Back to Library
            </Link>
          </div>
        )}

        {/* Form */}
        {!loading && drill && (
          <>
            {/* Submit error banner */}
            {submitError && (
              <div className="mb-6 flex items-start gap-3 bg-railers-red/10 border border-railers-red/30 rounded-xl px-4 py-3 text-sm text-railers-red-light">
                <span className="font-semibold flex-shrink-0">Error:</span>
                <span>{submitError}</span>
              </div>
            )}

            <DrillForm
              initialData={drill}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </>
        )}
      </div>
    </div>
  )
}
