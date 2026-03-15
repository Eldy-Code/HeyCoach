'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Bell, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TopBarProps {
  title: string
  action?: {
    label: string
    href: string
    icon?: React.ReactNode
  }
}

export function TopBar({ title, action }: TopBarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [search, setSearch] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/drills?search=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-railers-black-soft/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h1 className="font-display font-bold text-xl text-white uppercase tracking-wide">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search drills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-railers-black-card border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-railers-red/50 focus:border-railers-red/30 w-48 transition-all"
          />
        </form>

        {/* Action button */}
        {action && (
          <Link
            href={action.href}
            className="flex items-center gap-2 bg-railers-red hover:bg-railers-red-dark text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            {action.icon ?? <Plus size={16} />}
            <span className="hidden sm:inline">{action.label}</span>
          </Link>
        )}

        {/* Notifications placeholder */}
        <button className="relative text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-railers-red rounded-full" />
        </button>
      </div>
    </header>
  )
}
