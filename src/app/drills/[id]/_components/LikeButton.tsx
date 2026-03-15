'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  drillId: string
  initialLiked: boolean
  initialCount: number
}

export default function LikeButton({ drillId, initialLiked, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function handleLike() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/drills/${drillId}/like`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setLiked(data.liked)
        setCount(data.count)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={cn(
        'flex items-center gap-2 w-full border text-sm font-medium px-4 py-2.5 rounded-lg transition-all justify-center',
        liked
          ? 'bg-railers-red/10 border-railers-red/30 text-railers-red hover:bg-railers-red/20'
          : 'bg-white/5 border-white/10 text-gray-300 hover:border-railers-red/30 hover:text-railers-red',
        loading && 'opacity-60 cursor-not-allowed'
      )}
      aria-label={liked ? 'Unlike drill' : 'Like drill'}
    >
      <Heart size={15} className={liked ? 'fill-current' : ''} />
      {liked ? 'Liked' : 'Like'}
      {count > 0 && (
        <span className="ml-0.5 text-xs font-bold bg-railers-red/20 text-railers-red px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </button>
  )
}
