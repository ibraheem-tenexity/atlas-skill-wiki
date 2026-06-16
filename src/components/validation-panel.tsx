'use client'

import type { ValidationResult, RuleResult } from '@/lib/validator'

type Props = {
  result: ValidationResult | null
  loading: boolean
}

function RuleIcon({ severity }: { severity: RuleResult['severity'] }) {
  if (severity === 'pass') return <span aria-label="pass">✅</span>
  if (severity === 'error') return <span aria-label="error">❌</span>
  return <span aria-label="warn">⚠️</span>
}

function statusLabel(status: ValidationResult['status']): string {
  if (status === 'passed') return 'Validation passed'
  if (status === 'failed') return 'Validation failed'
  return 'Validation passed with warnings'
}

export function ValidationPanel({ result, loading }: Props) {
  if (loading) {
    return (
      <div
        data-testid="validation-status"
        data-status="loading"
        className="rounded-lg border border-border bg-card p-4 space-y-2"
      >
        <p className="text-body-sm text-muted-foreground animate-pulse">Running validation…</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div
        data-testid="validation-status"
        data-status="idle"
        className="rounded-lg border border-border bg-card p-4"
      >
        <p className="text-body-sm text-muted-foreground">
          Click <strong>Validate</strong> to check your skill definition.
        </p>
      </div>
    )
  }

  const { status, rules } = result

  const panelClass = {
    passed: 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950',
    warn: 'border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950',
    failed: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950',
  }[status]

  const headingClass = {
    passed: 'text-green-800 dark:text-green-200',
    warn: 'text-yellow-800 dark:text-yellow-200',
    failed: 'text-red-800 dark:text-red-200',
  }[status]

  return (
    <div
      data-testid="validation-status"
      data-status={status}
      className={`rounded-lg border p-4 space-y-3 ${panelClass}`}
    >
      {/* Summary heading */}
      <p className={`text-body-sm font-semibold ${headingClass}`}>
        {statusLabel(status)}
      </p>

      {/* Per-rule list */}
      <ul className="space-y-1.5">
        {rules.map((rule) => (
          <li
            key={rule.id}
            data-rule-id={rule.id}
            data-rule-severity={rule.severity}
            className="flex items-start gap-2 text-body-sm"
          >
            <span className="shrink-0 leading-5">
              <RuleIcon severity={rule.severity} />
            </span>
            <span className="flex-1">
              <span className="font-medium">{rule.label}</span>
              {' — '}
              <span className="text-muted-foreground">{rule.message}</span>
              {rule.line !== undefined && (
                <span className="ml-1 text-caption text-muted-foreground">(line {rule.line})</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
