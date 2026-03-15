'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn, getInitials, relativeTime } from '@/lib/utils'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Shield,
  User,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react'

interface UserRow {
  id: string
  name: string | null
  email: string
  role: string
  teamName: string | null
  createdAt: string
  updatedAt: string
  isSelf: boolean
  _count: { drills: number; practicePlans: number }
}

interface AdminUsersClientProps {
  users: UserRow[]
  currentUserId: string
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border',
        role === 'admin'
          ? 'bg-railers-red/15 text-railers-red border-railers-red/30'
          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      )}
    >
      {role === 'admin' ? <Shield size={10} /> : <User size={10} />}
      {role === 'admin' ? 'Admin' : 'Coach'}
    </span>
  )
}

function InputField({
  label,
  required,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean; error?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-railers-red">*</span>}
      </label>
      <input
        {...props}
        className={cn(
          'w-full bg-railers-black border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600',
          'focus:outline-none focus:ring-2 focus:ring-railers-red/40 focus:border-railers-red/50 transition-all',
          error ? 'border-railers-red/60' : 'border-white/10'
        )}
      />
      {error && <p className="mt-1 text-xs text-railers-red">{error}</p>}
    </div>
  )
}

// ── Create User Form ──────────────────────────────────────────────────────────

function CreateUserForm({ onCreated }: { onCreated: (user: UserRow) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [teamName, setTeamName] = useState('')
  const [role, setRole] = useState<'coach' | 'admin'>('coach')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  function reset() {
    setName(''); setEmail(''); setPassword(''); setTeamName('')
    setRole('coach'); setErrors({}); setServerError(null)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim() || name.trim().length < 2) e.name = 'Name must be at least 2 characters'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email required'
    if (!password || password.length < 8) e.password = 'Password must be at least 8 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setServerError(null)

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role, teamName: teamName.trim() || undefined }),
    })

    const body = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setServerError(body?.error ?? 'Something went wrong')
      return
    }

    onCreated({ ...body, isSelf: false, _count: { drills: 0, practicePlans: 0 } })
    reset()
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-railers-red hover:bg-railers-red-dark text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
      >
        <Plus size={15} /> Create User
      </button>
    )
  }

  return (
    <div className="bg-railers-black-card border border-railers-red/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-semibold text-white uppercase tracking-wider text-sm flex items-center gap-2">
          <span className="w-1 h-4 bg-railers-red rounded-full inline-block" />
          Create New User
        </h3>
        <button onClick={() => { reset(); setOpen(false) }} className="text-gray-600 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {serverError && (
        <div className="mb-4 flex items-center gap-2 bg-railers-red/10 border border-railers-red/30 rounded-lg px-3 py-2 text-sm text-railers-red">
          <AlertTriangle size={14} />
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField label="Full Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Coach Smith" error={errors.name} />
        <InputField label="Email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="coach@example.com" error={errors.email} />
        <InputField label="Team Name" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Worcester Jr. Railers" />

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'coach' | 'admin')}
            className="w-full bg-railers-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-railers-red/40 transition-all appearance-none cursor-pointer"
          >
            <option value="coach">Coach</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Password <span className="text-railers-red">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className={cn(
                'w-full bg-railers-black border rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder-gray-600',
                'focus:outline-none focus:ring-2 focus:ring-railers-red/40 transition-all',
                errors.password ? 'border-railers-red/60' : 'border-white/10'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-railers-red">{errors.password}</p>}
        </div>

        <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => { reset(); setOpen(false) }} className="text-sm text-gray-500 hover:text-white transition-colors px-4 py-2">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-railers-red hover:bg-railers-red-dark disabled:opacity-60 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {submitting ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Edit User Row ─────────────────────────────────────────────────────────────

function EditUserRow({
  user,
  onUpdated,
  onDeleted,
}: {
  user: UserRow
  onUpdated: (u: UserRow) => void
  onDeleted: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [name, setName] = useState(user.name ?? '')
  const [email, setEmail] = useState(user.email)
  const [role, setRole] = useState(user.role)
  const [teamName, setTeamName] = useState(user.teamName ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSubmitting(true)
    setError(null)

    const body: Record<string, unknown> = { name, email, role, teamName: teamName || null }
    if (newPassword) body.password = newPassword

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(data?.error ?? 'Update failed')
      return
    }

    onUpdated({ ...user, ...data })
    setEditing(false)
    setNewPassword('')
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    const data = await res.json()
    setDeleting(false)

    if (!res.ok) {
      setError(data?.error ?? 'Delete failed')
      setConfirmDelete(false)
      return
    }

    onDeleted(user.id)
  }

  const displayName = user.name ?? user.email.split('@')[0]

  if (editing) {
    return (
      <tr className="border-t border-white/5 bg-railers-black-soft/20">
        <td colSpan={6} className="px-5 py-4">
          <div className="space-y-3">
            {error && (
              <div className="flex items-center gap-2 text-sm text-railers-red bg-railers-red/10 border border-railers-red/30 rounded-lg px-3 py-2">
                <AlertTriangle size={14} /> {error}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InputField label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <InputField label="Team" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name" />
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={user.isSelf}
                  className="w-full bg-railers-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                >
                  <option value="coach">Coach</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="relative max-w-xs">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <KeyRound size={11} /> New Password <span className="text-gray-600 font-normal normal-case">(leave blank to keep)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password..."
                  className="w-full bg-railers-black border border-white/10 rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-railers-red/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={submitting}
                className="flex items-center gap-1.5 bg-railers-red hover:bg-railers-red-dark disabled:opacity-60 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Save Changes
              </button>
              <button
                onClick={() => { setEditing(false); setError(null); setNewPassword('') }}
                className="text-xs text-gray-500 hover:text-white transition-colors px-2 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-t border-white/5 hover:bg-white/[0.02] transition-colors group">
      {/* User */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-railers-red rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(user.name, user.email)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {displayName}
              {user.isSelf && (
                <span className="ml-2 text-[10px] bg-white/10 text-gray-400 border border-white/10 px-1.5 py-0.5 rounded">you</span>
              )}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-5 py-4">
        <RoleBadge role={user.role} />
      </td>

      {/* Team */}
      <td className="px-5 py-4">
        <span className="text-sm text-gray-400 truncate max-w-[140px] block">
          {user.teamName ?? <span className="text-gray-600 italic">—</span>}
        </span>
      </td>

      {/* Activity */}
      <td className="px-5 py-4">
        <div className="text-xs text-gray-500 space-y-0.5">
          <div>{user._count.drills} drill{user._count.drills !== 1 ? 's' : ''}</div>
          <div>{user._count.practicePlans} plan{user._count.practicePlans !== 1 ? 's' : ''}</div>
        </div>
      </td>

      {/* Joined */}
      <td className="px-5 py-4">
        <span className="text-xs text-gray-500">{relativeTime(user.createdAt)}</span>
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => { setEditing(true); setError(null) }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
            title="Edit user"
          >
            <Pencil size={14} />
          </button>

          {!user.isSelf && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-railers-red hover:bg-railers-red/10 transition-all"
              title="Delete user"
            >
              <Trash2 size={14} />
            </button>
          )}

          {confirmDelete && (
            <div className="flex items-center gap-1 bg-railers-red/10 border border-railers-red/30 rounded-lg px-2 py-1">
              <span className="text-xs text-railers-red mr-1">Delete?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs font-semibold text-railers-red hover:text-white transition-colors"
              >
                {deleting ? <Loader2 size={12} className="animate-spin" /> : 'Yes'}
              </button>
              <span className="text-gray-600 mx-1">·</span>
              <button onClick={() => { setConfirmDelete(false); setError(null) }} className="text-xs text-gray-500 hover:text-white transition-colors">
                No
              </button>
            </div>
          )}

          {error && !editing && (
            <span className="text-xs text-railers-red ml-2">{error}</span>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminUsersClient({ users: initial, currentUserId }: AdminUsersClientProps) {
  const [users, setUsers] = useState(initial)
  const [sortField, setSortField] = useState<'name' | 'role' | 'createdAt'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const router = useRouter()

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  const sorted = [...users].sort((a, b) => {
    let av: string, bv: string
    if (sortField === 'name') { av = a.name ?? a.email; bv = b.name ?? b.email }
    else if (sortField === 'role') { av = a.role; bv = b.role }
    else { av = a.createdAt; bv = b.createdAt }
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })

  function SortIcon({ field }: { field: typeof sortField }) {
    if (sortField !== field) return <ChevronDown size={12} className="text-gray-700" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-railers-red" />
      : <ChevronDown size={12} className="text-railers-red" />
  }

  function handleCreated(user: UserRow) {
    setUsers((prev) => [...prev, user])
  }

  function handleUpdated(updated: UserRow) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)))
    router.refresh()
  }

  function handleDeleted(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-white uppercase tracking-wider text-sm flex items-center gap-2">
          <span className="w-1 h-4 bg-railers-red rounded-full inline-block" />
          Users ({users.length})
        </h2>
        <CreateUserForm onCreated={handleCreated} />
      </div>

      {/* Table */}
      <div className="bg-railers-black-card border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {[
                { label: 'User', field: 'name' as const },
                { label: 'Role', field: 'role' as const },
                { label: 'Team', field: null },
                { label: 'Activity', field: null },
                { label: 'Joined', field: 'createdAt' as const },
                { label: '', field: null },
              ].map(({ label, field }) => (
                <th
                  key={label || 'actions'}
                  className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-widest"
                >
                  {field ? (
                    <button
                      onClick={() => toggleSort(field)}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      {label}
                      <SortIcon field={field} />
                    </button>
                  ) : label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((user) => (
              <EditUserRow
                key={user.id}
                user={user}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <p>No users found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
