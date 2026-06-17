'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Search, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { SkillCard, type SkillWithDept } from '@/components/skill-card'
import { cn } from '@/lib/utils'

interface Department {
  id: string
  name: string
  slug: string
  _count?: { skills: number }
}

interface CatalogPageProps {
  initialSkills: SkillWithDept[]
  departments: Department[]
}

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'Draft', label: 'Draft' },
  { value: 'InReview', label: 'In Review' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Deprecated', label: 'Deprecated' },
]

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'status', label: 'Status' },
]

// Skeleton card for loading state
function SkillCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-5 bg-[hsl(var(--muted))] rounded w-2/3" />
        <div className="h-5 bg-[hsl(var(--muted))] rounded w-16" />
      </div>
      <div className="flex gap-2">
        <div className="h-4 bg-[hsl(var(--muted))] rounded-full w-20" />
        <div className="h-4 bg-[hsl(var(--muted))] rounded-full w-14" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 bg-[hsl(var(--muted))] rounded w-full" />
        <div className="h-3 bg-[hsl(var(--muted))] rounded w-4/5" />
      </div>
    </div>
  )
}

export function CatalogPage({ initialSkills, departments }: CatalogPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const { data: session } = useSession()

  // Hide New Skill button when explicitly logged in as reader; show for unauthenticated / other roles
  const isReader = session?.user && (session.user as any).role === 'reader'
  const showNewSkillButton = !isReader

  // Derive state from URL
  const searchQuery = searchParams.get('search') ?? ''
  const activeDept = searchParams.get('department') ?? ''
  const activeStatus = searchParams.get('status') ?? ''
  const activeSort = searchParams.get('sort') ?? 'newest'
  const activeTag = searchParams.get('tag') ?? ''

  // Local search input (debounced before pushing to URL)
  const [searchInput, setSearchInput] = useState(searchQuery)
  const [skills, setSkills] = useState<SkillWithDept[]>(initialSkills)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Update URL params helper
  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [pathname, router, searchParams],
  )

  // Debounce search input -> URL
  useEffect(() => {
    const id = setTimeout(() => {
      if (searchInput !== searchQuery) {
        pushParams({ search: searchInput })
      }
    }, 300)
    return () => clearTimeout(id)
  }, [searchInput, searchQuery, pushParams])

  // Fetch skills whenever URL params change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (activeDept) params.set('department', activeDept)
    if (activeStatus) params.set('status', activeStatus)
    if (activeSort) params.set('sort', activeSort)
    if (activeTag) params.set('tag', activeTag)

    setIsLoading(true)
    fetch(`/api/skills?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        // API returns array or object with skills key
        setSkills(Array.isArray(data) ? data : (data.skills ?? []))
      })
      .catch(() => {
        // Fall back to initial skills on error
        setSkills(initialSkills)
      })
      .finally(() => setIsLoading(false))
  }, [searchQuery, activeDept, activeStatus, activeSort, activeTag]) // eslint-disable-line react-hooks/exhaustive-deps

  // Compute all unique tags from skills for tag filter
  const allTags = Array.from(new Set(initialSkills.flatMap((s) => s.tags ?? []))).sort()

  // Count skills per department for facet counts
  const deptCounts = departments.reduce<Record<string, number>>((acc, d) => {
    acc[d.name] = initialSkills.filter((s) => s.department?.name === d.name).length
    return acc
  }, {})

  const hasActiveFilters = !!(activeDept || activeStatus || activeTag || searchQuery)

  function clearFilters() {
    setSearchInput('')
    startTransition(() => {
      router.push(pathname, { scroll: false })
    })
  }

  return (
    <div className="flex gap-6 min-h-0">
      {/* ── Left rail: department facets ── */}
      <aside
        className="w-52 shrink-0 space-y-1"
        aria-label="Department filters"
      >
        <p className="category-label mb-3 px-2">Departments</p>

        <button
          onClick={() => pushParams({ department: '' })}
          className={cn(
            'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-body-sm transition-colors duration-[var(--duration-fast)]',
            !activeDept
              ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-medium'
              : 'text-muted-foreground hover:bg-[hsl(var(--muted))] hover:text-foreground',
          )}
        >
          <span>All</span>
          <span className="text-xs tabular">{initialSkills.length}</span>
        </button>

        {departments.map((dept) => (
          <button
            key={dept.id}
            onClick={() =>
              pushParams({ department: activeDept === dept.name ? '' : dept.name })
            }
            className={cn(
              'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-body-sm transition-colors duration-[var(--duration-fast)]',
              activeDept === dept.name
                ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-medium'
                : 'text-muted-foreground hover:bg-[hsl(var(--muted))] hover:text-foreground',
            )}
          >
            <span className="truncate">{dept.name}</span>
            <span className="text-xs tabular ml-2 shrink-0">{deptCounts[dept.name] ?? 0}</span>
          </button>
        ))}
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Top bar: search + filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search skills…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={cn(
                'w-full h-9 pl-9 pr-3 rounded-md border border-[hsl(var(--input))]',
                'bg-background text-body-sm text-foreground placeholder:text-muted-foreground',
                'focus-visible:outline-none focus-visible:shadow-focus',
                'transition-shadow duration-[var(--duration-fast)]',
              )}
              aria-label="Search skills"
            />
          </div>

          {/* Status filter */}
          <select
            value={activeStatus}
            onChange={(e) => pushParams({ status: e.target.value })}
            className={cn(
              'h-9 px-2 rounded-md border border-[hsl(var(--input))]',
              'bg-background text-body-sm text-foreground',
              'focus-visible:outline-none focus-visible:shadow-focus',
            )}
            aria-label="Filter by status"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <select
              value={activeTag}
              onChange={(e) => pushParams({ tag: e.target.value })}
              className={cn(
                'h-9 px-2 rounded-md border border-[hsl(var(--input))]',
                'bg-background text-body-sm text-foreground',
                'focus-visible:outline-none focus-visible:shadow-focus',
              )}
              aria-label="Filter by tag"
            >
              <option value="">All Tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}

          {/* Sort */}
          <select
            value={activeSort}
            onChange={(e) => pushParams({ sort: e.target.value })}
            className={cn(
              'h-9 px-2 rounded-md border border-[hsl(var(--input))]',
              'bg-background text-body-sm text-foreground',
              'focus-visible:outline-none focus-visible:shadow-focus',
            )}
            aria-label="Sort skills"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <div
            className="flex items-center rounded-md border border-[hsl(var(--border))] overflow-hidden"
            role="group"
            aria-label="View mode"
          >
            <button
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              className={cn(
                'flex items-center justify-center w-9 h-9 transition-colors duration-[var(--duration-fast)]',
                viewMode === 'grid'
                  ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                  : 'bg-background text-muted-foreground hover:bg-[hsl(var(--muted))]',
              )}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={cn(
                'flex items-center justify-center w-9 h-9 transition-colors duration-[var(--duration-fast)]',
                viewMode === 'list'
                  ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                  : 'bg-background text-muted-foreground hover:bg-[hsl(var(--muted))]',
              )}
              title="List view"
            >
              <List className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* New Skill CTA */}
          <Link
            href="/skill/new"
            data-testid="new-skill-button"
            className={cn(
              'inline-flex items-center gap-2 h-9 px-4 rounded-md text-body-sm font-medium',
              'bg-[hsl(var(--brand))] text-[hsl(var(--brand-foreground))]',
              'hover:bg-[hsl(var(--brand-deep))]',
              'transition-colors duration-[var(--duration-fast)]',
              'focus-visible:outline-none focus-visible:shadow-focus',
            )}
          >
            + New Skill
          </Link>
        </div>

        {/* Result count + clear filters */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-body-sm text-muted-foreground">
            {isLoading || isPending ? (
              'Loading…'
            ) : (
              <>
                Showing{' '}
                <span className="font-medium text-foreground">{skills.length}</span>{' '}
                {skills.length === 1 ? 'skill' : 'skills'}
                {activeDept && (
                  <> in <span className="font-medium text-foreground">{activeDept}</span></>
                )}
              </>
            )}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-body-sm text-muted-foreground hover:text-foreground transition-colors duration-[var(--duration-fast)]"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              Clear filters
            </button>
          )}
        </div>

        {/* Skill grid / list */}
        {isLoading || isPending ? (
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'flex flex-col gap-3',
            )}
            aria-busy="true"
            aria-label="Loading skills"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <SkillCardSkeleton key={i} />
            ))}
          </div>
        ) : skills.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-sunken py-20">
            <div className="flex flex-col items-center gap-3 text-center">
              <SlidersHorizontal className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-body-md font-medium text-foreground">No skills found</p>
              <p className="text-body-sm text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your filters or search query.'
                  : 'Skills will appear here once they are added to the registry.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-body-sm text-[hsl(var(--brand))] hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'flex flex-col gap-3',
            )}
          >
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
