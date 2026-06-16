'use client'

import { useState } from 'react'
import { StatusBadge } from '@/components/status-badge'

// ─── Types ────────────────────────────────────────────────────────────────────

type Skill = {
  id: string
  name: string
  slug: string
  description: string
  governanceStatus: string
  updatedAt: Date | string
  createdAt: Date | string
  ownerId: string
  departmentId: string
  tags: string[]
  frontmatter: Record<string, unknown>
  department: { id: string; name: string; slug: string }
  owner: { id: string; name: string; email: string } | null
}

type Department = {
  id: string
  name: string
  slug: string
  _count: { skills: number }
}

type AuditLog = {
  id: string
  action: string
  targetType: string
  targetId: string
  metadata: Record<string, unknown>
  timestamp: Date | string
  actor: { id: string; name: string; email: string }
  skill: { id: string; name: string; slug: string } | null
}

type Policy = {
  id: string
  requiredFields: string[]
  allowedDepartments: string[]
  reviewSlaDays: number
  updatedAt: Date | string
} | null

type Props = {
  skills: Skill[]
  departments: Department[]
  auditLogs: AuditLog[]
  policy: Policy
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysSince(date: Date | string): number {
  const ms = Date.now() - new Date(date).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: 'brand' | 'warning' | 'danger' | 'success'
}) {
  const colorMap = {
    brand: 'text-[hsl(var(--brand))]',
    warning: 'text-[hsl(var(--warning))]',
    danger: 'text-[hsl(var(--danger))]',
    success: 'text-[hsl(var(--success))]',
  }
  const numColor = accent ? colorMap[accent] : 'text-[hsl(var(--brand))]'
  return (
    <div
      className="flex flex-col gap-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
        {label}
      </span>
      <span className={`text-3xl font-semibold tabular-nums ${numColor}`}>{value}</span>
    </div>
  )
}

// ─── Health badge ─────────────────────────────────────────────────────────────

function HealthBadge({ pct }: { pct: number }) {
  let cls = 'bg-[hsl(var(--success-soft))] text-[hsl(var(--success))]'
  if (pct < 50) cls = 'bg-[hsl(var(--danger-soft))] text-[hsl(var(--danger))]'
  else if (pct < 80) cls = 'bg-[hsl(var(--warning-soft))] text-[hsl(var(--warning))]'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {pct}%
    </span>
  )
}

// ─── Department Table ─────────────────────────────────────────────────────────

function DepartmentChart({
  departments,
  skills,
}: {
  departments: Department[]
  skills: Skill[]
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
        By Department
      </h2>
      <div
        className="overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--sunken))]">
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
                Department
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
                Skills
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
                Health
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
                Bar
              </th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept, i) => {
              const deptSkills = skills.filter((s) => s.departmentId === dept.id)
              const approved = deptSkills.filter((s) => s.governanceStatus === 'Approved').length
              const total = deptSkills.length
              const pct = total > 0 ? Math.round((approved / total) * 100) : 0
              const maxCount = Math.max(...departments.map((d) => d._count.skills), 1)
              const barPct = Math.round((total / maxCount) * 100)
              return (
                <tr
                  key={dept.id}
                  className={i % 2 === 1 ? 'bg-[hsl(var(--sunken)/0.4)]' : ''}
                >
                  <td className="px-4 py-3 font-medium text-[hsl(var(--text-primary))]">
                    {dept.name}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[hsl(var(--text-secondary))]">
                    {total}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <HealthBadge pct={pct} />
                  </td>
                  <td className="px-4 py-3 w-40">
                    <div className="h-2 w-full rounded-full bg-[hsl(var(--sunken))]">
                      <div
                        className="h-2 rounded-full bg-[hsl(var(--brand))]"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {departments.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-[hsl(var(--text-tertiary))]">
            No departments found.
          </p>
        )}
      </div>
    </section>
  )
}

// ─── Review Queue ─────────────────────────────────────────────────────────────

function ReviewQueue({ skills }: { skills: Skill[] }) {
  const queue = skills.filter((s) => s.governanceStatus === 'InReview')
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
        Review Queue
        {queue.length > 0 && (
          <span className="ml-2 inline-flex items-center rounded-full bg-[hsl(var(--warning-soft))] px-1.5 py-0.5 text-xs font-medium text-[hsl(var(--warning))]">
            {queue.length}
          </span>
        )}
      </h2>
      <div
        className="overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        {queue.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[hsl(var(--text-tertiary))]">
            No skills pending review.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--sunken))]">
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
                  Skill
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
                  Department
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
                  Owner
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
                  Days in Review
                </th>
              </tr>
            </thead>
            <tbody>
              {queue.map((skill, i) => {
                const days = daysSince(skill.updatedAt)
                return (
                  <tr
                    key={skill.id}
                    className={i % 2 === 1 ? 'bg-[hsl(var(--sunken)/0.4)]' : ''}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-[hsl(var(--text-primary))]">
                        {skill.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--text-secondary))]">
                      {skill.department.name}
                    </td>
                    <td className="px-4 py-3 text-[hsl(var(--text-secondary))]">
                      {skill.owner?.name ?? <span className="text-[hsl(var(--text-tertiary))]">Unowned</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span
                        className={
                          days > 7
                            ? 'font-semibold text-[hsl(var(--danger))]'
                            : 'text-[hsl(var(--text-secondary))]'
                        }
                      >
                        {days}d
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

// ─── Audit Trail ─────────────────────────────────────────────────────────────

const AUDIT_ACTION_FILTERS = ['all', 'publish', 'approve', 'deprecate', 'deploy'] as const
type AuditFilter = (typeof AUDIT_ACTION_FILTERS)[number]

function AuditTrail({ auditLogs }: { auditLogs: AuditLog[] }) {
  const [filter, setFilter] = useState<AuditFilter>('all')

  const filtered =
    filter === 'all'
      ? auditLogs
      : auditLogs.filter((log) => log.action.toLowerCase().includes(filter))

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
          Audit Trail
        </h2>
        <div className="flex items-center gap-1">
          {AUDIT_ACTION_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-[hsl(var(--brand))] text-white'
                  : 'bg-[hsl(var(--sunken))] text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--border))]'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div
        className="overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[hsl(var(--text-tertiary))]">
            No audit events found.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--sunken))]">
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
                  Timestamp
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
                  Actor
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
                  Action
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
                  Skill
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <tr
                  key={log.id}
                  className={i % 2 === 1 ? 'bg-[hsl(var(--sunken)/0.4)]' : ''}
                >
                  <td className="px-4 py-3 tabular-nums text-[hsl(var(--text-tertiary))] whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-[hsl(var(--text-secondary))]">
                    {log.actor.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-[hsl(var(--brand-soft))] px-2 py-0.5 text-xs font-medium text-[hsl(var(--brand-deep))]">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[hsl(var(--text-secondary))]">
                    {log.skill?.name ?? (
                      <span className="text-[hsl(var(--text-tertiary))]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[hsl(var(--text-tertiary))] max-w-xs truncate">
                    {typeof log.metadata === 'object' && log.metadata !== null
                      ? Object.entries(log.metadata)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ') || '—'
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

// ─── Policy Editor ────────────────────────────────────────────────────────────

function PolicyEditor({ policy }: { policy: Policy }) {
  const [requiredFields, setRequiredFields] = useState(
    policy?.requiredFields?.join(', ') ?? '',
  )
  const [allowedDepartments, setAllowedDepartments] = useState(
    policy?.allowedDepartments?.join(', ') ?? '',
  )
  const [reviewSlaDays, setReviewSlaDays] = useState(
    String(policy?.reviewSlaDays ?? 7),
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch('/api/governance/policy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requiredFields: requiredFields
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          allowedDepartments: allowedDepartments
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          reviewSlaDays: parseInt(reviewSlaDays, 10) || 7,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save policy')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--text-tertiary))]">
        Policy Editor
      </h2>
      <div
        className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <form onSubmit={handleSave} className="space-y-5 max-w-xl">
          <div className="space-y-1.5">
            <label
              htmlFor="requiredFields"
              className="block text-sm font-medium text-[hsl(var(--text-primary))]"
            >
              Required Fields
            </label>
            <p className="text-xs text-[hsl(var(--text-tertiary))]">
              Comma-separated list of frontmatter fields every skill must have.
            </p>
            <input
              id="requiredFields"
              type="text"
              value={requiredFields}
              onChange={(e) => setRequiredFields(e.target.value)}
              placeholder="e.g. description, tags, owner"
              className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 py-2 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="allowedDepartments"
              className="block text-sm font-medium text-[hsl(var(--text-primary))]"
            >
              Allowed Departments
            </label>
            <p className="text-xs text-[hsl(var(--text-tertiary))]">
              Comma-separated list of department names permitted to publish skills.
            </p>
            <input
              id="allowedDepartments"
              type="text"
              value={allowedDepartments}
              onChange={(e) => setAllowedDepartments(e.target.value)}
              placeholder="e.g. Engineering, Design, Product"
              className="w-full rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 py-2 text-sm text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="reviewSlaDays"
              className="block text-sm font-medium text-[hsl(var(--text-primary))]"
            >
              Review SLA (days)
            </label>
            <p className="text-xs text-[hsl(var(--text-tertiary))]">
              Maximum days a skill may stay in review before it is considered overdue.
            </p>
            <input
              id="reviewSlaDays"
              type="number"
              min="1"
              max="365"
              value={reviewSlaDays}
              onChange={(e) => setReviewSlaDays(e.target.value)}
              className="w-28 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 py-2 text-sm text-[hsl(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
            />
          </div>

          {error && (
            <p className="rounded-md bg-[hsl(var(--danger-soft))] px-3 py-2 text-sm text-[hsl(var(--danger))]">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-[hsl(var(--brand))] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Policy'}
            </button>
            {saved && (
              <span className="text-sm font-medium text-[hsl(var(--success))]">
                Saved!
              </span>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function GovernanceDashboard({ skills, departments, auditLogs, policy }: Props) {
  const now = Date.now()
  const ninety = 90 * 24 * 60 * 60 * 1000

  const total = skills.length
  const unowned = skills.filter((s) => !s.owner).length
  const stale = skills.filter(
    (s) => now - new Date(s.updatedAt).getTime() > ninety,
  ).length
  const pendingReview = skills.filter((s) => s.governanceStatus === 'InReview').length

  // Policy violations: skills missing required fields from policy.requiredFields
  const requiredFields = policy?.requiredFields ?? []
  const violations = requiredFields.length > 0
    ? skills.filter((skill) => {
        const fm = (skill.frontmatter ?? {}) as Record<string, unknown>
        return requiredFields.some((field) => {
          const val = fm[field]
          return val === undefined || val === null || val === ''
        })
      }).length
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[hsl(var(--text-primary))]">
          Governance
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--text-secondary))]">
          Registry health, review queue, audit trail, and policy management.
        </p>
      </div>

      {/* Rollup cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Skills" value={total} accent="brand" />
        <StatCard label="Unowned" value={unowned} accent={unowned > 0 ? 'warning' : 'success'} />
        <StatCard label="Stale (90d+)" value={stale} accent={stale > 0 ? 'warning' : 'success'} />
        <StatCard
          label="Pending Review"
          value={pendingReview}
          accent={pendingReview > 0 ? 'warning' : 'success'}
        />
        <StatCard
          label="Policy Violations"
          value={violations}
          accent={violations > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Department chart */}
      <DepartmentChart departments={departments} skills={skills} />

      {/* Review queue */}
      <ReviewQueue skills={skills} />

      {/* Audit trail */}
      <AuditTrail auditLogs={auditLogs} />

      {/* Policy editor */}
      <PolicyEditor policy={policy} />
    </div>
  )
}
