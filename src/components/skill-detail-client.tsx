'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { StatusBadge } from '@/components/status-badge'
import { canEdit, canApprove, canDeploy } from '@/lib/auth-client'
import type {
  Skill,
  Department,
  User,
  SkillVersion,
  Connection,
  Deployment,
  AuditLog,
} from '@prisma/client'

// ---------------------------------------------------------------------------
// Types — composed from Prisma includes
// ---------------------------------------------------------------------------

type SkillWithRelations = Skill & {
  department: Department
  owner: User
  versions: (SkillVersion & { author: User })[]
  connectionsFrom: (Connection & { toSkill: Skill & { department: Department } })[]
  connectionsTo: (Connection & { fromSkill: Skill & { department: Department } })[]
  deployments: (Deployment & { createdBy: User })[]
  auditLogs: (AuditLog & { actor: User })[]
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'connections', label: 'Connections' },
  { id: 'versions', label: 'Versions' },
  { id: 'deployments', label: 'Deployments' },
  { id: 'governance', label: 'Governance' },
] as const

type TabId = (typeof TABS)[number]['id']

// ---------------------------------------------------------------------------
// Surface label helper
// ---------------------------------------------------------------------------

const SURFACE_LABELS: Record<string, string> = {
  'claude-code': 'Claude Code',
  'web-agent': 'Web Agent',
  'slack-bot': 'Slack Bot',
}

// ---------------------------------------------------------------------------
// Connection type label helper
// ---------------------------------------------------------------------------

const CONNECTION_TYPE_LABELS: Record<string, string> = {
  'depends-on': 'depends on',
  supersedes: 'supersedes',
  'related-to': 'related to',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SkillDetailClient({ skill }: { skill: SkillWithRelations }) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Keyboard navigation for ARIA tabs (WCAG 2.1 §4.1.2)
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      let nextIndex: number | null = null

      if (e.key === 'ArrowRight') {
        nextIndex = (index + 1) % TABS.length
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (index - 1 + TABS.length) % TABS.length
      } else if (e.key === 'Home') {
        nextIndex = 0
      } else if (e.key === 'End') {
        nextIndex = TABS.length - 1
      }

      if (nextIndex !== null) {
        e.preventDefault()
        setActiveTab(TABS[nextIndex].id)
        tabRefs.current[nextIndex]?.focus()
      }
    },
    [],
  )

  // Sync ref array length whenever TABS changes (static here, but defensive)
  useEffect(() => {
    tabRefs.current = tabRefs.current.slice(0, TABS.length)
  }, [])

  const frontmatter = skill.frontmatter as Record<string, unknown>

  // Role-gated actions
  const showEdit = canEdit(session)
  const showApprove = canApprove(session, skill.departmentId)
  const showDeploy = canDeploy(session)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ------------------------------------------------------------------ */}
      {/* Page header                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-3">
        <p className="category-label">Skill</p>

        <div className="flex items-start gap-3 flex-wrap">
          <h1
            data-testid="skill-detail-title"
            className="text-heading-lg font-semibold text-foreground leading-tight"
          >
            {skill.name}
          </h1>

          <div className="flex items-center gap-2 flex-wrap pt-0.5">
            {/* Department badge */}
            <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
              {skill.department.name}
            </span>

            {/* Version badge */}
            <span className="inline-flex items-center rounded-full bg-sunken border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground tabular">
              v{skill.currentVersion}
            </span>

            {/* Governance status badge */}
            <StatusBadge status={skill.governanceStatus} />
          </div>
        </div>

        {skill.description && (
          <p className="text-body-md text-muted-foreground">{skill.description}</p>
        )}

        {/* Role-gated actions */}
        {(showEdit || showApprove || showDeploy) && (
          <div className="flex items-center gap-2 pt-1">
            {showEdit && (
              <a
                href={`/skill/${skill.slug}/edit`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-raised px-3 py-1.5 text-body-sm font-medium text-foreground hover:bg-sunken transition-colors duration-fast"
              >
                Edit
              </a>
            )}
            {showApprove && skill.governanceStatus === 'InReview' && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-body-sm font-medium text-success-foreground hover:opacity-90 transition-opacity duration-fast"
              >
                Approve
              </button>
            )}
            {showDeploy && skill.governanceStatus === 'Approved' && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-body-sm font-medium text-primary-foreground hover:bg-brand-deep transition-colors duration-fast"
              >
                Deploy
              </button>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* ARIA Tab navigation                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div
        role="tablist"
        aria-label="Skill sections"
        className="flex gap-0 border-b border-border"
      >
        {TABS.map((tab, index) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              role="tab"
              id={`tab-btn-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`tab-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              className={[
                'px-4 py-2.5 text-body-sm font-medium border-b-2 transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus',
                isActive
                  ? 'border-brand text-brand'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border-default',
              ].join(' ')}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Tab panels                                                          */}
      {/* ------------------------------------------------------------------ */}

      {/* Overview */}
      <div
        id="tab-panel-overview"
        role="tabpanel"
        aria-labelledby="tab-btn-overview"
        hidden={activeTab !== 'overview'}
      >
        <div className="flex gap-8 items-start">
          {/* Left: rendered SKILL.md body */}
          <div className="flex-1 min-w-0">
            {skill.body ? (
              <div className="prose-skill">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                  components={{
                    // Downshift heading hierarchy: skill body h1 → rendered as h2
                    h1: ({ children }) => (
                      <h2 className="text-heading-md font-semibold text-foreground mt-6 mb-3">
                        {children}
                      </h2>
                    ),
                    h2: ({ children }) => (
                      <h3 className="text-heading-sm font-semibold text-foreground mt-5 mb-2">
                        {children}
                      </h3>
                    ),
                    h3: ({ children }) => (
                      <h4 className="text-body-lg font-semibold text-foreground mt-4 mb-2">
                        {children}
                      </h4>
                    ),
                    p: ({ children }) => (
                      <p className="text-body-md text-foreground mb-3 leading-relaxed">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside text-body-md text-foreground mb-3 space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside text-body-md text-foreground mb-3 space-y-1">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-body-md text-foreground">{children}</li>
                    ),
                    code: ({ children, className }) => {
                      const isBlock = className?.startsWith('language-')
                      return isBlock ? (
                        <code className="block bg-sunken rounded-md px-4 py-3 text-body-sm font-mono text-foreground overflow-x-auto mb-3">
                          {children}
                        </code>
                      ) : (
                        <code className="bg-sunken rounded px-1.5 py-0.5 text-body-sm font-mono text-foreground">
                          {children}
                        </code>
                      )
                    },
                    pre: ({ children }) => (
                      <pre className="bg-sunken rounded-lg mb-3 overflow-x-auto">{children}</pre>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-brand pl-4 text-body-md text-muted-foreground italic mb-3">
                        {children}
                      </blockquote>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-brand hover:text-brand-deep underline underline-offset-2"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-3">
                        <table className="w-full text-body-sm border-collapse">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-sunken border-b border-border">{children}</thead>
                    ),
                    th: ({ children }) => (
                      <th className="px-3 py-2 text-left font-medium text-foreground">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-2 border-b border-border text-foreground">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {skill.body}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-body-md text-muted-foreground italic">
                No documentation yet. Edit this skill to add a SKILL.md body.
              </p>
            )}
          </div>

          {/* Right rail: frontmatter metadata panel */}
          <aside className="w-64 shrink-0 rounded-lg border border-border bg-raised p-4 space-y-3 sticky top-4">
            <h2 className="text-body-sm font-semibold text-foreground uppercase tracking-wide">
              Metadata
            </h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-caption text-muted-foreground">Owner</dt>
                <dd className="text-body-sm text-foreground">{skill.owner.name}</dd>
              </div>
              <div>
                <dt className="text-caption text-muted-foreground">Department</dt>
                <dd className="text-body-sm text-foreground">{skill.department.name}</dd>
              </div>
              <div>
                <dt className="text-caption text-muted-foreground">Version</dt>
                <dd className="text-body-sm text-foreground tabular">v{skill.currentVersion}</dd>
              </div>
              <div>
                <dt className="text-caption text-muted-foreground">Status</dt>
                <dd className="text-body-sm text-foreground">{skill.governanceStatus}</dd>
              </div>
              <div>
                <dt className="text-caption text-muted-foreground">Visibility</dt>
                <dd className="text-body-sm text-foreground capitalize">{skill.visibility}</dd>
              </div>
              <div>
                <dt className="text-caption text-muted-foreground">Created</dt>
                <dd className="text-body-sm text-foreground tabular">
                  {new Date(skill.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-caption text-muted-foreground">Updated</dt>
                <dd className="text-body-sm text-foreground tabular">
                  {new Date(skill.updatedAt).toLocaleDateString()}
                </dd>
              </div>

              {/* Tags */}
              {skill.tags.length > 0 && (
                <div>
                  <dt className="text-caption text-muted-foreground">Tags</dt>
                  <dd className="flex flex-wrap gap-1 mt-0.5">
                    {skill.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-full bg-sunken px-2 py-0.5 text-caption text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              )}

              {/* Extra frontmatter fields */}
              {Object.entries(frontmatter)
                .filter(([k]) => !['name', 'version', 'department', 'owner'].includes(k))
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-caption text-muted-foreground capitalize">{k}</dt>
                    <dd className="text-body-sm text-foreground">
                      {Array.isArray(v)
                        ? v.join(', ')
                        : typeof v === 'object' && v !== null
                          ? JSON.stringify(v)
                          : String(v)}
                    </dd>
                  </div>
                ))}
            </dl>
          </aside>
        </div>
      </div>

      {/* Connections */}
      <div
        id="tab-panel-connections"
        role="tabpanel"
        aria-labelledby="tab-btn-connections"
        hidden={activeTab !== 'connections'}
      >
        {skill.connectionsFrom.length === 0 && skill.connectionsTo.length === 0 ? (
          <p className="text-body-md text-muted-foreground">No connections defined yet.</p>
        ) : (
          <div className="space-y-4">
            {skill.connectionsFrom.length > 0 && (
              <div>
                <h2 className="text-body-sm font-semibold text-foreground mb-2">
                  Outgoing connections
                </h2>
                <ul className="space-y-2">
                  {skill.connectionsFrom.map((conn) => (
                    <li
                      key={conn.id}
                      className="flex items-center gap-2 text-body-sm text-foreground"
                    >
                      <span className="text-muted-foreground capitalize">
                        {CONNECTION_TYPE_LABELS[conn.type] ?? conn.type}
                      </span>
                      <a
                        href={`/skill/${conn.toSkill.slug}`}
                        className="text-brand hover:text-brand-deep underline underline-offset-2"
                      >
                        {conn.toSkill.name}
                      </a>
                      <span className="text-caption text-muted-foreground">
                        ({conn.toSkill.department.name})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {skill.connectionsTo.length > 0 && (
              <div>
                <h2 className="text-body-sm font-semibold text-foreground mb-2">
                  Incoming connections
                </h2>
                <ul className="space-y-2">
                  {skill.connectionsTo.map((conn) => (
                    <li
                      key={conn.id}
                      className="flex items-center gap-2 text-body-sm text-foreground"
                    >
                      <a
                        href={`/skill/${conn.fromSkill.slug}`}
                        className="text-brand hover:text-brand-deep underline underline-offset-2"
                      >
                        {conn.fromSkill.name}
                      </a>
                      <span className="text-muted-foreground capitalize">
                        {CONNECTION_TYPE_LABELS[conn.type] ?? conn.type}
                      </span>
                      <span className="text-caption text-muted-foreground">this skill</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Versions */}
      <div
        id="tab-panel-versions"
        role="tabpanel"
        aria-labelledby="tab-btn-versions"
        hidden={activeTab !== 'versions'}
      >
        {skill.versions.length === 0 ? (
          <p className="text-body-md text-muted-foreground">No versions yet.</p>
        ) : (
          <ul className="space-y-2">
            {skill.versions.map((v) => (
              <li
                key={v.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-raised px-4 py-3"
              >
                <span className="tabular text-body-sm font-medium text-foreground">
                  v{v.semver}
                </span>
                <span className="text-caption text-muted-foreground capitalize">{v.status}</span>
                <span className="ml-auto text-body-sm text-foreground">{v.author.name}</span>
                <span className="text-caption text-muted-foreground tabular">
                  {new Date(v.date).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Deployments */}
      <div
        id="tab-panel-deployments"
        role="tabpanel"
        aria-labelledby="tab-btn-deployments"
        hidden={activeTab !== 'deployments'}
      >
        {skill.deployments.length === 0 ? (
          <p className="text-body-md text-muted-foreground">No deployments yet.</p>
        ) : (
          <ul className="space-y-2">
            {skill.deployments.map((dep) => (
              <li
                key={dep.id}
                className="rounded-lg border border-border bg-raised px-4 py-3 space-y-1"
              >
                <div className="flex items-center gap-3">
                  <span className="text-body-sm font-medium text-foreground">
                    {SURFACE_LABELS[dep.surface] ?? dep.surface}
                  </span>
                  <span className="tabular text-caption text-muted-foreground">
                    pin: v{dep.versionPin}
                  </span>
                  <span className="ml-auto text-caption text-muted-foreground">
                    {dep.createdBy.name} &middot; {new Date(dep.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {dep.installSnippet && (
                  <pre className="mt-1 rounded bg-sunken px-3 py-2 text-body-sm font-mono text-foreground overflow-x-auto">
                    <code>{dep.installSnippet}</code>
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Governance */}
      <div
        id="tab-panel-governance"
        role="tabpanel"
        aria-labelledby="tab-btn-governance"
        hidden={activeTab !== 'governance'}
      >
        <div className="space-y-4">
          <h2 className="text-heading-sm font-semibold text-foreground">Audit log</h2>
          {skill.auditLogs.length === 0 ? (
            <p className="text-body-md text-muted-foreground">No audit events yet.</p>
          ) : (
            <ul className="space-y-1">
              {skill.auditLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-body-sm text-foreground hover:bg-sunken transition-colors duration-fast"
                >
                  <span className="font-medium">{log.actor.name}</span>
                  <span className="text-muted-foreground">&mdash;</span>
                  <span className="text-muted-foreground capitalize">{log.action}</span>
                  <span className="ml-auto tabular text-caption text-muted-foreground">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
