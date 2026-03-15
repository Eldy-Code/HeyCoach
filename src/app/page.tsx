'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        setError('Invalid email or password. Please try again.')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-railers-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-railers-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-railers-black text-railers-white font-sans">
      {/* Header */}
      <header className="border-b border-railers-black-card px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-wider text-railers-white uppercase">
              Hey<span className="text-railers-red">Coach</span>
            </h1>
            <p className="text-railers-silver text-xs tracking-widest uppercase mt-0.5">
              Rail Dawgs Edition
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-railers-silver text-sm">
            <span className="w-2 h-2 rounded-full bg-railers-red inline-block animate-pulse-red" />
            Worcester Junior Railers
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative px-6 py-20 text-center overflow-hidden">
          {/* Background gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(200,16,46,0.18) 0%, transparent 70%)',
            }}
          />

          <div className="relative max-w-3xl mx-auto">
            <div className="text-7xl mb-6 select-none" role="img" aria-label="Hockey puck">
              🏒
            </div>
            <h2 className="font-display text-5xl sm:text-6xl font-bold uppercase tracking-tight text-railers-white leading-tight mb-4">
              Your Ice.{' '}
              <span className="text-railers-red">Your Drills.</span>{' '}
              Your Team.
            </h2>
            <p className="text-railers-silver text-lg sm:text-xl max-w-xl mx-auto mb-10">
              The all-in-one drill platform built for youth hockey coaches. Plan
              smarter. Practice harder. Win together.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-14">
              {[
                { icon: '📚', label: 'Drill Library' },
                { icon: '📋', label: 'Practice Plans' },
                { icon: '🤖', label: 'AI Coach Chat' },
                { icon: '🏒', label: 'Team Collaboration' },
              ].map(({ icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 bg-railers-black-card border border-railers-black-soft text-railers-silver px-4 py-2 rounded-full text-sm font-medium"
                >
                  <span>{icon}</span>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 pb-16">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: '📚',
                title: 'Drill Library',
                desc: 'Browse and save hundreds of youth hockey drills, searchable by skill and age group.',
              },
              {
                icon: '📋',
                title: 'Practice Plans',
                desc: 'Build complete practice plans with timed segments. Share them with your assistant coaches.',
              },
              {
                icon: '🤖',
                title: 'AI Coach Chat',
                desc: 'Ask your AI assistant for drill ideas, player development tips, and practice feedback.',
              },
              {
                icon: '🏒',
                title: 'Team Collaboration',
                desc: 'Invite coaches, share notes, and keep your whole staff aligned on player progress.',
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-railers-black-card border border-railers-black-soft rounded-xl p-5 flex flex-col gap-3 hover:border-railers-red transition-colors duration-200"
              >
                <span className="text-3xl">{icon}</span>
                <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-railers-white">
                  {title}
                </h3>
                <p className="text-railers-silver text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Login Form Section */}
        <section className="px-6 pb-20">
          <div className="max-w-md mx-auto">
            <div className="bg-railers-black-card border border-railers-black-soft rounded-2xl p-8 shadow-2xl">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-railers-white mb-1 text-center">
                Sign In
              </h2>
              <p className="text-railers-silver text-sm text-center mb-6">
                Welcome back, Coach
              </p>

              {error && (
                <div className="mb-4 rounded-lg bg-railers-red/10 border border-railers-red/30 px-4 py-3 text-railers-red text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-railers-silver text-xs uppercase tracking-widest font-medium"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="coach@example.com"
                    className="bg-railers-black-soft border border-railers-black-soft rounded-lg px-4 py-3 text-railers-white placeholder-railers-silver/50 text-sm focus:outline-none focus:border-railers-red focus:ring-1 focus:ring-railers-red transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="password"
                    className="text-railers-silver text-xs uppercase tracking-widest font-medium"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-railers-black-soft border border-railers-black-soft rounded-lg px-4 py-3 text-railers-white placeholder-railers-silver/50 text-sm focus:outline-none focus:border-railers-red focus:ring-1 focus:ring-railers-red transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 bg-railers-red hover:bg-railers-red-dark disabled:opacity-60 disabled:cursor-not-allowed text-railers-white font-display font-semibold uppercase tracking-widest text-sm py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-railers-white border-t-transparent rounded-full animate-spin" />
                      Signing In…
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-railers-silver text-sm">
                New to HeyCoach?{' '}
                <Link
                  href="/register"
                  className="text-railers-red hover:text-railers-red-light font-medium transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-railers-black-card px-6 py-6 text-center">
        <p className="text-railers-silver/60 text-xs tracking-wide">
          Powered by{' '}
          <span className="text-railers-red font-medium">Worcester Junior Railers</span>{' '}
          spirit &mdash; HeyCoach &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}
