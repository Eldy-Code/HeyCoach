'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    teamName: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data?.error ?? 'Registration failed. Please try again.')
        return
      }

      // Auto sign-in after successful registration
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Account created! Please sign in on the main page.')
        router.push('/')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-railers-black text-railers-white font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-railers-black-card px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="group">
            <h1 className="font-display text-3xl font-bold tracking-wider text-railers-white uppercase">
              Hey<span className="text-railers-red">Coach</span>
            </h1>
            <p className="text-railers-silver text-xs tracking-widest uppercase mt-0.5">
              Rail Dawgs Edition
            </p>
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-railers-silver text-sm">
            <span className="w-2 h-2 rounded-full bg-railers-red inline-block animate-pulse-red" />
            Worcester Junior Railers
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Top accent */}
        <div className="text-5xl mb-6 select-none" role="img" aria-label="Hockey">
          🏒
        </div>
        <h2 className="font-display text-4xl font-bold uppercase tracking-tight text-railers-white mb-2 text-center">
          Join <span className="text-railers-red">HeyCoach</span>
        </h2>
        <p className="text-railers-silver text-sm mb-10 text-center max-w-sm">
          Create your account and start building smarter practice plans for your team.
        </p>

        <div className="w-full max-w-md bg-railers-black-card border border-railers-black-soft rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-5 rounded-lg bg-railers-red/10 border border-railers-red/30 px-4 py-3 text-railers-red text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="name"
                className="text-railers-silver text-xs uppercase tracking-widest font-medium"
              >
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Coach Smith"
                className="bg-railers-black-soft border border-railers-black-soft rounded-lg px-4 py-3 text-railers-white placeholder-railers-silver/50 text-sm focus:outline-none focus:border-railers-red focus:ring-1 focus:ring-railers-red transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-railers-silver text-xs uppercase tracking-widest font-medium"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
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
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                className="bg-railers-black-soft border border-railers-black-soft rounded-lg px-4 py-3 text-railers-white placeholder-railers-silver/50 text-sm focus:outline-none focus:border-railers-red focus:ring-1 focus:ring-railers-red transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="teamName"
                className="text-railers-silver text-xs uppercase tracking-widest font-medium"
              >
                Team Name
              </label>
              <input
                id="teamName"
                name="teamName"
                type="text"
                autoComplete="organization"
                value={form.teamName}
                onChange={handleChange}
                placeholder="e.g. Rail Dawgs 12U"
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
                  Creating Account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-railers-silver text-sm">
            Already have an account?{' '}
            <Link
              href="/"
              className="text-railers-red hover:text-railers-red-light font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
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
