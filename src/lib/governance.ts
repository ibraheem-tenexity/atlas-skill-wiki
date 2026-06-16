export type GovernanceStatus = 'Draft' | 'InReview' | 'Approved' | 'Deprecated'

export const ALLOWED_TRANSITIONS: Record<GovernanceStatus, GovernanceStatus[]> = {
  Draft: ['InReview', 'Approved'],
  InReview: ['Approved', 'Draft'],
  Approved: ['Deprecated', 'InReview'],
  Deprecated: ['InReview'],
}

export function canTransition(from: GovernanceStatus, to: GovernanceStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

export function getStatusLabel(status: GovernanceStatus): string {
  const labels: Record<GovernanceStatus, string> = {
    Draft: 'Draft',
    InReview: 'In Review',
    Approved: 'Approved',
    Deprecated: 'Deprecated',
  }
  return labels[status] ?? status
}

export function getStatusIcon(status: GovernanceStatus): string {
  const icons: Record<GovernanceStatus, string> = {
    Draft: '✏️',
    InReview: '🔍',
    Approved: '✅',
    Deprecated: '⚠️',
  }
  return icons[status] ?? '•'
}
