'use client'

import { useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SkillForDeploy {
  slug: string
  name: string
  currentVersion: string
  governanceStatus: string
}

interface DeployResult {
  id: string
  installSnippet: string
  surface: string
  versionPin: string
}

interface DeployModalProps {
  skill: SkillForDeploy
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SURFACE_OPTIONS = [
  { value: 'claude_code', label: 'Claude Code' },
  { value: 'web_agent', label: 'Web Agent' },
  { value: 'slack_bot', label: 'Slack Bot' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DeployModal({ skill, onClose }: DeployModalProps) {
  const [surface, setSurface] = useState('claude_code')
  const [versionPin, setVersionPin] = useState(skill.currentVersion)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DeployResult | null>(null)
  const [copied, setCopied] = useState(false)

  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const firstFocusRef = useRef<HTMLInputElement | null>(null)

  // Focus trap: move focus into modal on open
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    firstFocusRef.current?.focus()

    return () => {
      previousFocus?.focus()
    }
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }

      // Focus trap: keep focus inside modal
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleDeploy = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/skills/${skill.slug}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surface, versionPin }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Deployment failed')
      } else {
        setResult(data)
      }
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result?.installSnippet) return
    try {
      await navigator.clipboard.writeText(result.installSnippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
    }
  }

  return (
    /* Backdrop */
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deploy-modal-title"
        className="relative w-full max-w-lg rounded-xl border border-border bg-raised shadow-xl p-6 space-y-5 mx-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="deploy-modal-title"
              className="text-heading-sm font-semibold text-foreground"
            >
              Deploy Skill
            </h2>
            <p className="text-body-sm text-muted-foreground mt-0.5">
              {skill.name} &mdash; v{skill.currentVersion}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close deploy modal"
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-sunken transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Success state */}
        {result ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3">
              <p className="text-body-sm font-medium text-success">Deployment created</p>
              <p className="text-caption text-muted-foreground mt-0.5 tabular">
                ID: {result.id}
              </p>
            </div>

            <div>
              <p className="text-body-sm font-medium text-foreground mb-1.5">Install snippet</p>
              <div className="relative">
                <pre className="rounded-lg bg-sunken px-4 py-3 text-body-sm font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                  <code>{result.installSnippet}</code>
                </pre>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="absolute top-2 right-2 rounded-md border border-border bg-raised px-2 py-1 text-caption text-muted-foreground hover:text-foreground hover:bg-sunken transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-md border border-border bg-raised px-4 py-2 text-body-sm font-medium text-foreground hover:bg-sunken transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form state */
          <div className="space-y-4">
            {/* Surface picker */}
            <fieldset>
              <legend className="text-body-sm font-medium text-foreground mb-2">
                Target surface
              </legend>
              <div className="space-y-2">
                {SURFACE_OPTIONS.map((option, index) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2.5 cursor-pointer rounded-md border border-border px-3 py-2.5 hover:bg-sunken transition-colors duration-fast has-[:checked]:border-brand has-[:checked]:bg-accent/30"
                  >
                    <input
                      ref={index === 0 ? firstFocusRef : undefined}
                      type="radio"
                      name="surface"
                      value={option.value}
                      checked={surface === option.value}
                      onChange={() => setSurface(option.value)}
                      className="accent-brand"
                    />
                    <span className="text-body-sm text-foreground">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Version pin */}
            <div>
              <label
                htmlFor="deploy-version-pin"
                className="block text-body-sm font-medium text-foreground mb-1.5"
              >
                Version pin
              </label>
              <input
                id="deploy-version-pin"
                type="text"
                value={versionPin}
                onChange={(e) => setVersionPin(e.target.value)}
                placeholder={skill.currentVersion}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors duration-fast"
              />
            </div>

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="rounded-md border border-error/30 bg-error/10 px-3 py-2 text-body-sm text-error"
              >
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-md border border-border bg-raised px-4 py-2 text-body-sm font-medium text-foreground hover:bg-sunken transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeploy}
                disabled={loading || !versionPin.trim()}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-body-sm font-medium text-primary-foreground hover:bg-brand-deep transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deploying…' : 'Confirm Deploy'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
