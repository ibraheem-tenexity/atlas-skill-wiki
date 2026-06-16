'use client'

import { useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { ChevronDown, User } from 'lucide-react'

const DEMO_USERS = [
  {
    label: 'Skill Author',
    email: 'author@atlas.dev',
    password: 'demo-author-2024',
    role: 'skill_author',
  },
  {
    label: 'Dept Lead',
    email: 'lead@atlas.dev',
    password: 'demo-lead-2024',
    role: 'dept_lead',
  },
  {
    label: 'Gov Admin',
    email: 'admin@atlas.dev',
    password: 'demo-admin-2024',
    role: 'gov_admin',
  },
  {
    label: 'Agent Builder',
    email: 'builder@atlas.dev',
    password: 'demo-builder-2024',
    role: 'agent_builder',
  },
  {
    label: 'Reader',
    email: 'reader@atlas.dev',
    password: 'demo-reader-2024',
    role: 'reader',
  },
] as const

function roleDisplayName(role: string | undefined) {
  if (!role) return 'Not signed in'
  const found = DEMO_USERS.find((u) => u.role === role)
  return found ? found.label : role
}

export function RoleSwitcher() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const currentRole = (session?.user as any)?.role as string | undefined

  async function switchTo(email: string, password: string) {
    setOpen(false)
    setLoading(true)
    // Sign out first, then sign in as the new demo user
    await signOut({ redirect: false })
    await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    // Reload to pick up new session
    window.location.reload()
  }

  async function handleSignOut() {
    setOpen(false)
    await signOut({ redirect: false })
    window.location.reload()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-body-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors disabled:opacity-50"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <User className="w-3.5 h-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="flex-1 text-left truncate">
          {loading ? 'Switching…' : session ? (session.user?.name ?? session.user?.email ?? 'User') : 'Sign in'}
        </span>
        {session && (
          <span className="text-caption text-muted-foreground truncate max-w-[80px]">
            {roleDisplayName(currentRole)}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform duration-fast ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div
            role="listbox"
            aria-label="Sign in as"
            className="absolute bottom-full left-0 right-0 mb-1 bg-raised border border-border rounded-lg shadow-lg py-1 z-20"
          >
            <p className="px-3 py-1 text-caption font-medium text-muted-foreground uppercase tracking-wide">
              Dev: Sign in as…
            </p>
            {DEMO_USERS.map((user) => (
              <button
                key={user.role}
                role="option"
                aria-selected={currentRole === user.role}
                onClick={() => switchTo(user.email, user.password)}
                className={[
                  'flex items-center gap-2 w-full px-3 py-1.5 text-body-sm text-left transition-colors',
                  currentRole === user.role
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-foreground hover:bg-muted',
                ].join(' ')}
              >
                <span className="flex-1">{user.label}</span>
                <span className="text-caption text-muted-foreground">{user.email}</span>
              </button>
            ))}

            {session && (
              <>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-body-sm text-left text-[hsl(var(--danger))] hover:bg-[hsl(var(--danger-soft))] transition-colors"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
