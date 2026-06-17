import { cn } from '@/lib/utils'

interface DepartmentHealthProps {
  approvedCount: number
  totalCount: number
  className?: string
  showLabel?: boolean
}

export function DepartmentHealth({
  approvedCount,
  totalCount,
  className,
  showLabel = true,
}: DepartmentHealthProps) {
  const score = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0

  const barColor =
    score >= 80
      ? 'bg-[hsl(var(--success))]'
      : score >= 40
      ? 'bg-[hsl(var(--warning))]'
      : 'bg-[hsl(var(--danger))]'

  const labelColor =
    score >= 80
      ? 'text-[hsl(var(--success))]'
      : score >= 40
      ? 'text-[hsl(var(--warning))]'
      : 'text-[hsl(var(--danger))]'

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Health</span>
          <span className={cn('text-xs font-medium tabular', labelColor)}>
            {score}%
          </span>
        </div>
      )}
      <div
        className="h-1.5 w-full rounded-full bg-[hsl(var(--muted))] overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Health score: ${score}%`}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-[var(--duration-slow)]', barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
