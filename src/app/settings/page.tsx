import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/')

  return (
    <div className="flex min-h-screen bg-railers-black">
      <Sidebar />
      <div className="flex-1 ml-64">
        <TopBar title="Settings" />
        <div className="p-6 max-w-2xl">
          <div className="bg-railers-black-card border border-white/5 rounded-xl p-6 space-y-6">
            <div>
              <h2 className="font-display font-bold text-white text-lg uppercase tracking-wide mb-1">
                Account Settings
              </h2>
              <p className="text-gray-500 text-sm">Manage your HeyCoach profile and preferences.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
                  Name
                </label>
                <input
                  type="text"
                  defaultValue={session.user?.name ?? ''}
                  className="w-full input-dark text-sm"
                  disabled
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={session.user?.email ?? ''}
                  className="w-full input-dark text-sm"
                  disabled
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <h3 className="font-semibold text-white text-sm mb-2">API Configuration</h3>
              <p className="text-xs text-gray-500">
                To enable AI Chat, set the <code className="text-railers-red bg-black/40 px-1 py-0.5 rounded">ANTHROPIC_API_KEY</code> environment variable in your <code className="text-railers-red bg-black/40 px-1 py-0.5 rounded">.env.local</code> file.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
