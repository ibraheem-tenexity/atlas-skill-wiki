import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DepartmentHealth } from '@/components/department-health'

interface DepartmentCardProps {
  department: {
    id: string
    name: string
    slug: string
    description?: string | null
    lead?: { id: string; name: string; email: string } | null
    _count: { skills: number }
    skills: { governanceStatus: string }[]
  }
  className?: string
}

export function DepartmentCard({ department, className }: DepartmentCardProps) {
  const approvedCount = department.skills.filter(
    (s) => s.governanceStatus === 'Approved',
  ).length
  const totalCount = department._count.skills

  return (
    <Link
      href={`/departments/${department.slug}`}
      data-testid={`dept-card-${department.slug}`}
      className={cn(
        'group flex flex-col gap-4 rounded-lg border border-border bg-card p-5',
        'shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)]',
        'transition-shadow duration-[var(--duration-fast)]',
        'focus-visible:outline-none focus-visible:shadow-focus',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--accent))]">
          <Building2
            className="h-4 w-4 text-[hsl(var(--accent-foreground))]"
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2
            className={cn(
              'text-body-md font-semibold text-foreground truncate',
              'group-hover:text-[hsl(var(--brand))] transition-colors duration-[var(--duration-fast)]',
            )}
          >
            {department.name}
          </h2>
          {department.lead ? (
            <p className="text-body-sm text-muted-foreground truncate">
              Lead: {department.lead.name}
            </p>
          ) : (
            <p className="text-body-sm text-muted-foreground italic">No lead assigned</p>
          )}
        </div>
      </div>

      {/* Skill count */}
      <div className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
        <span className="font-medium text-foreground tabular">{totalCount}</span>
        {totalCount === 1 ? 'skill' : 'skills'}
      </div>

      {/* Health bar */}
      <DepartmentHealth approvedCount={approvedCount} totalCount={totalCount} />
    </Link>
  )
}
