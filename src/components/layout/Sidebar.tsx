'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, getInitials } from '@/lib/utils'
import {
  LayoutDashboard,
  Dumbbell,
  ClipboardList,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Zap,
} from 'lucide-react'

const navItems = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    exact: true,
  },
  {
    href: '/drills',
    icon: Dumbbell,
    label: 'Drill Library',
  },
  {
    href: '/practice-plans',
    icon: ClipboardList,
    label: 'Practice Plans',
  },
  {
    href: '/coach-chat',
    icon: MessageSquare,
    label: 'AI Coach Chat',
    badge: 'AI',
  },
]

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-railers-black-soft border-r border-white/5 flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-railers-red rounded-lg flex items-center justify-center font-display font-bold text-white text-lg group-hover:bg-railers-red-dark transition-colors">
            HC
          </div>
          <div>
            <div className="font-display font-bold text-white text-lg leading-none">HeyCoach</div>
            <div className="text-[10px] text-railers-red font-medium tracking-widest uppercase mt-0.5">
              Rail Dawgs Ed.
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] text-gray-600 font-semibold tracking-widest uppercase px-3 mb-3">
          Menu
        </div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
              isActive(item.href, item.exact)
                ? 'bg-railers-red text-white shadow-lg shadow-railers-red/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            <item.icon size={18} className="flex-shrink-0" />
            <span className="font-medium text-sm flex-1">{item.label}</span>
            {item.badge && (
              <span className="text-[10px] bg-railers-red/20 text-railers-red border border-railers-red/30 px-1.5 py-0.5 rounded font-bold">
                {item.badge}
              </span>
            )}
            {!item.badge && isActive(item.href, item.exact) && (
              <ChevronRight size={14} className="opacity-60" />
            )}
          </Link>
        ))}

        <div className="pt-4">
          <div className="text-[10px] text-gray-600 font-semibold tracking-widest uppercase px-3 mb-3">
            Account
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <Settings size={18} />
            <span className="font-medium text-sm">Settings</span>
          </Link>
        </div>
      </nav>

      {/* Power-up banner */}
      <div className="mx-4 mb-4 p-3 bg-railers-red/10 border border-railers-red/20 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={14} className="text-railers-red" />
          <span className="text-xs font-semibold text-railers-red">AI-Powered</span>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Chat with Claude to build perfect practice plans for your team.
        </p>
        <Link
          href="/coach-chat"
          className="mt-2 text-[11px] text-railers-red hover:text-railers-red-light font-semibold flex items-center gap-1"
        >
          Open AI Chat <ChevronRight size={12} />
        </Link>
      </div>

      {/* User */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-railers-red rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(session?.user?.name, session?.user?.email ?? '')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {session?.user?.name ?? 'Coach'}
            </div>
            <div className="text-xs text-gray-500 truncate">{session?.user?.email}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-gray-500 hover:text-railers-red transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
