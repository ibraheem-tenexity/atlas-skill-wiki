import Link from 'next/link'
import { StatusBadge } from '@/components/status-badge'
import { cn } from '@/lib/utils'

export interface SkillWithDept {
  id: string
  name: string
  slug: string
  description: string
  currentVersion: string
  governanceStatus: string
  tags: string[]
  department: { id: string; name: string; slug: string }
  _count?: { connectionsFrom: number; connectionsTo: number; versions: number }
  createdAt?: string | Date
  updatedAt?: string | Date
}

interface SkillCardProps {
  skill: SkillWithDept
  className?: string
}

export function SkillCard({ skill, className }: SkillCardProps) {
  const connectionCount =
    (skill._count?.connectionsFrom ?? 0) + (skill._count?.connectionsTo ?? 0)

  return (
    <article
      data-testid={`skill-card-${skill.slug}`}
      className={cn(
        'group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4',
        'shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)]',
        'transition-shadow duration-[var(--duration-fast)]',
        className,
      )}
    >
      {/* Header row: title + status */}
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/skill/${skill.slug}`}
          className="flex-1 min-w-0 focus-visible:outline-none focus-visible:shadow-focus rounded"
        >
          <h3 className="text-body-md font-semibold text-foreground truncate group-hover:text-[hsl(var(--brand))] transition-colors duration-[var(--duration-fast)]">
            {skill.name}
          </h3>
        </Link>
        <StatusBadge status={skill.governanceStatus} />
      </div>

      {/* Department + version badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
          {skill.department.name}
        </span>
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] font-mono tabular">
          v{skill.currentVersion}
        </span>
        {connectionCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <svg
              className="w-3 h-3"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <circle cx="3" cy="8" r="2" />
              <circle cx="13" cy="4" r="2" />
              <circle cx="13" cy="12" r="2" />
              <path d="M5 8h3.5M8.5 8L11 4.5M8.5 8L11 11.5" />
            </svg>
            {connectionCount} {connectionCount === 1 ? 'connection' : 'connections'}
          </span>
        )}
      </div>

      {/* Description */}
      {skill.description && (
        <p className="text-body-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {skill.description}
        </p>
      )}

      {/* Tags */}
      {skill.tags && skill.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto">
          {skill.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-[hsl(var(--sunken))] text-[hsl(var(--text-secondary))]"
            >
              {tag}
            </span>
          ))}
          {skill.tags.length > 4 && (
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs text-muted-foreground">
              +{skill.tags.length - 4} more
            </span>
          )}
        </div>
      )}
    </article>
  )
}
