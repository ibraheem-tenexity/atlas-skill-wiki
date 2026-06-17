'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeptLeadActionsProps {
  deptSlug: string
  inReviewCount: number
}

export function DeptLeadActions({ deptSlug, inReviewCount }: DeptLeadActionsProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [result, setResult] = useState<{ updated: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (inReviewCount === 0) return null

  async function handleApproveAll() {
    setIsPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/departments/${deptSlug}/approve-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Failed to approve skills')
      } else {
        const data = await res.json()
        setResult(data)
        router.refresh()
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="rounded-lg border border-[hsl(var(--warning-soft))] bg-[hsl(var(--warning-soft))] p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-body-sm font-medium text-foreground">
          {inReviewCount} {inReviewCount === 1 ? 'skill is' : 'skills are'} awaiting review
        </p>
        {result && (
          <p className="text-body-sm text-[hsl(var(--success))] mt-0.5">
            {result.updated} {result.updated === 1 ? 'skill' : 'skills'} approved successfully.
          </p>
        )}
        {error && (
          <p className="text-body-sm text-[hsl(var(--danger))] mt-0.5">{error}</p>
        )}
      </div>
      <button
        onClick={handleApproveAll}
        disabled={isPending || result !== null}
        className={cn(
          'inline-flex items-center gap-2 h-9 px-4 rounded-md text-body-sm font-medium shrink-0',
          'bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]',
          'hover:opacity-90 transition-opacity duration-[var(--duration-fast)]',
          'focus-visible:outline-none focus-visible:shadow-focus',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        <CheckCheck className="w-4 h-4" aria-hidden="true" />
        {isPending ? 'Approving…' : 'Approve all In Review'}
      </button>
    </div>
  )
}
