'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import * as Diff from 'diff'
import type { SkillVersion, User } from '@prisma/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VersionWithAuthor = SkillVersion & { author: User }

// ---------------------------------------------------------------------------
// Diff renderer
// ---------------------------------------------------------------------------

function renderDiff(oldText: string, newText: string) {
  const changes = Diff.diffLines(oldText, newText)
  return changes.map((part, i) => (
    <pre
      key={i}
      className={
        part.added
          ? 'bg-[hsl(var(--success-soft))] text-[hsl(var(--success))]'
          : part.removed
            ? 'bg-[hsl(var(--danger-soft))] text-[hsl(var(--danger))]'
            : 'text-[hsl(var(--foreground))]'
      }
    >
      {part.added ? '+ ' : part.removed ? '- ' : '  '}
      {part.value}
    </pre>
  ))
}

// ---------------------------------------------------------------------------
// Status badge helper
// ---------------------------------------------------------------------------

function VersionStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    draft: 'bg-sunken text-muted-foreground',
    active: 'bg-success/10 text-success',
    deprecated: 'bg-warning/10 text-warning',
    archived: 'bg-border text-muted-foreground',
  }
  const cls = colorMap[status] ?? 'bg-sunken text-muted-foreground'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium capitalize ${cls}`}
    >
      {status}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Validation log display
// ---------------------------------------------------------------------------

function ValidationLog({ log }: { log: unknown }) {
  const entries = Array.isArray(log) ? log : []
  if (entries.length === 0) {
    return <p className="text-body-sm text-muted-foreground italic">No validation log entries.</p>
  }
  return (
    <ul className="space-y-1 font-mono text-body-sm">
      {entries.map((entry, i) => {
        const e = entry as Record<string, unknown>
        const level = String(e.level ?? 'info')
        const levelColor =
          level === 'error'
            ? 'text-danger'
            : level === 'warn'
              ? 'text-warning'
              : 'text-muted-foreground'
        return (
          <li key={i} className="flex gap-2">
            <span className={`uppercase font-semibold w-12 shrink-0 ${levelColor}`}>{level}</span>
            <span className="text-foreground">{String(e.message ?? JSON.stringify(entry))}</span>
          </li>
        )
      })}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface VersionsTabProps {
  skillSlug: string
  initialVersions: VersionWithAuthor[]
}

export function VersionsTab({ skillSlug, initialVersions }: VersionsTabProps) {
  const { data: session } = useSession()
  const [versions, setVersions] = useState<VersionWithAuthor[]>(initialVersions)
  const [loading, setLoading] = useState(false)
  const [selectedOld, setSelectedOld] = useState<string | null>(null)
  const [selectedNew, setSelectedNew] = useState<string | null>(null)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const isGovAdmin = session?.user?.role === 'gov_admin'

  // Refresh versions from API (in case data is stale)
  useEffect(() => {
    setLoading(true)
    fetch(`/api/skills/${skillSlug}/versions`)
      .then((r) => r.json())
      .then((data: VersionWithAuthor[]) => {
        if (Array.isArray(data)) setVersions(data)
      })
      .catch(() => {
        // Fall back to initial versions on network error
      })
      .finally(() => setLoading(false))
  }, [skillSlug])

  // Default selection: latest vs previous
  useEffect(() => {
    if (versions.length >= 2 && !selectedNew && !selectedOld) {
      setSelectedNew(versions[0].id)
      setSelectedOld(versions[1].id)
    } else if (versions.length === 1 && !selectedNew) {
      setSelectedNew(versions[0].id)
    }
  }, [versions, selectedNew, selectedOld])

  const versionById = (id: string | null) => versions.find((v) => v.id === id) ?? null

  const oldVersion = versionById(selectedOld)
  const newVersion = versionById(selectedNew)

  // Build the full SKILL.md text for a version
  function buildSkillMd(v: VersionWithAuthor): string {
    const fm = v.frontmatterSnapshot
    const frontmatter =
      fm && typeof fm === 'object' && !Array.isArray(fm)
        ? `---\n${Object.entries(fm as Record<string, unknown>)
            .map(([k, val]) => `${k}: ${JSON.stringify(val)}`)
            .join('\n')}\n---\n\n`
        : ''
    return frontmatter + v.bodySnapshot
  }

  // Stub promote/rollback actions
  function handlePromote(versionId: string) {
    setActionMessage(`Promote stub fired for version ${versionId}. (Not yet implemented.)`)
    setTimeout(() => setActionMessage(null), 3000)
  }

  function handleRollback(versionId: string) {
    setActionMessage(`Rollback stub fired for version ${versionId}. (Not yet implemented.)`)
    setTimeout(() => setActionMessage(null), 3000)
  }

  if (versions.length === 0) {
    return <p className="text-body-md text-muted-foreground">No versions yet.</p>
  }

  return (
    <div className="space-y-8">
      {/* Action feedback */}
      {actionMessage && (
        <div className="rounded-md border border-border bg-raised px-4 py-2 text-body-sm text-foreground">
          {actionMessage}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Semver timeline                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="versions-timeline-heading">
        <h2
          id="versions-timeline-heading"
          className="text-body-sm font-semibold text-foreground uppercase tracking-wide mb-3"
        >
          Version timeline
        </h2>

        {loading && (
          <p className="text-body-sm text-muted-foreground mb-2">Refreshing versions…</p>
        )}

        <ul className="space-y-2">
          {versions.map((v) => {
            const isSelOld = selectedOld === v.id
            const isSelNew = selectedNew === v.id
            const hasLog = Array.isArray(v.validationLog)
              ? (v.validationLog as unknown[]).length > 0
              : false

            return (
              <li
                key={v.id}
                className={[
                  'rounded-lg border px-4 py-3 space-y-2 transition-colors duration-fast',
                  isSelNew
                    ? 'border-brand bg-brand/5'
                    : isSelOld
                      ? 'border-border-default bg-sunken'
                      : 'border-border bg-raised',
                ].join(' ')}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Version number */}
                  <span className="tabular text-body-sm font-semibold text-foreground">
                    v{v.semver}
                  </span>

                  <VersionStatusBadge status={v.status} />

                  <span className="text-body-sm text-muted-foreground">{v.author.name}</span>

                  <span className="tabular text-caption text-muted-foreground ml-auto">
                    {new Date(v.date).toLocaleDateString()}
                  </span>

                  {/* Compare selectors */}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNew(v.id)
                        if (selectedOld === v.id) setSelectedOld(null)
                      }}
                      aria-pressed={isSelNew}
                      className={[
                        'rounded px-2 py-0.5 text-caption font-medium border transition-colors duration-fast',
                        isSelNew
                          ? 'border-brand bg-brand text-primary-foreground'
                          : 'border-border text-muted-foreground hover:border-brand hover:text-brand',
                      ].join(' ')}
                    >
                      New
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOld(v.id)
                        if (selectedNew === v.id) setSelectedNew(null)
                      }}
                      aria-pressed={isSelOld}
                      className={[
                        'rounded px-2 py-0.5 text-caption font-medium border transition-colors duration-fast',
                        isSelOld
                          ? 'border-border-default bg-sunken text-foreground'
                          : 'border-border text-muted-foreground hover:border-border-default hover:text-foreground',
                      ].join(' ')}
                    >
                      Old
                    </button>
                  </div>

                  {/* gov_admin actions */}
                  {isGovAdmin && (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePromote(v.id)}
                        className="rounded px-2 py-0.5 text-caption font-medium border border-success text-success hover:bg-success/10 transition-colors duration-fast"
                      >
                        Promote
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRollback(v.id)}
                        className="rounded px-2 py-0.5 text-caption font-medium border border-danger text-danger hover:bg-danger/10 transition-colors duration-fast"
                      >
                        Rollback
                      </button>
                    </div>
                  )}
                </div>

                {/* Validation log toggle */}
                {hasLog && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setExpandedLog(expandedLog === v.id ? null : v.id)}
                      className="text-caption text-brand hover:text-brand-deep underline underline-offset-2 transition-colors duration-fast"
                      aria-expanded={expandedLog === v.id}
                    >
                      {expandedLog === v.id ? 'Hide' : 'Show'} validation log
                    </button>

                    {expandedLog === v.id && (
                      <div className="mt-2 rounded-md bg-sunken border border-border px-3 py-2">
                        <ValidationLog log={v.validationLog} />
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Side-by-side diff                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section aria-labelledby="versions-diff-heading">
        <h2
          id="versions-diff-heading"
          className="text-body-sm font-semibold text-foreground uppercase tracking-wide mb-3"
        >
          SKILL.md diff
        </h2>

        {!selectedNew && !selectedOld ? (
          <p className="text-body-md text-muted-foreground">Select versions above to compare.</p>
        ) : !selectedOld || !selectedNew ? (
          <p className="text-body-md text-muted-foreground">
            Select both an &ldquo;Old&rdquo; and a &ldquo;New&rdquo; version to see the diff.
          </p>
        ) : selectedOld === selectedNew ? (
          <p className="text-body-md text-muted-foreground">
            Select two different versions to compare.
          </p>
        ) : (
          <div className="space-y-2">
            {/* Diff header */}
            <div className="flex gap-4 text-body-sm text-muted-foreground">
              <span>
                Old:{' '}
                <span className="font-medium text-foreground">v{oldVersion?.semver}</span>
              </span>
              <span>&rarr;</span>
              <span>
                New:{' '}
                <span className="font-medium text-foreground">v{newVersion?.semver}</span>
              </span>
            </div>

            {/* Diff output */}
            <div className="rounded-lg border border-border bg-raised overflow-x-auto p-3 text-body-sm font-mono">
              {renderDiff(
                buildSkillMd(oldVersion!),
                buildSkillMd(newVersion!),
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
