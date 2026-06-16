import { cn } from '@/lib/utils'
import { getStatusLabel, getStatusIcon } from '@/lib/governance'
import type { GovernanceStatus } from '@/lib/governance'

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
  InReview: 'bg-[hsl(var(--warning-soft))] text-[hsl(var(--warning))]',
  Approved: 'bg-[hsl(var(--success-soft))] text-[hsl(var(--success))]',
  Deprecated: 'bg-[hsl(var(--danger-soft))] text-[hsl(var(--danger))]',
}

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.Draft
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        color,
      )}
    >
      <span aria-hidden="true">{getStatusIcon(status as GovernanceStatus)}</span>
      {getStatusLabel(status as GovernanceStatus)}
    </span>
  )
}
