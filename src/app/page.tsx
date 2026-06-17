export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Suspense } from 'react'
import prisma from '@/lib/db'
import { CatalogPage } from '@/components/catalog-page'

async function getCatalogData() {
  try {
    const [skills, departments] = await Promise.all([
      prisma.skill.findMany({
        include: {
          department: true,
          _count: { select: { connectionsFrom: true, connectionsTo: true, versions: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.department.findMany({
        orderBy: { name: 'asc' },
      }),
    ])
    return { skills, departments }
  } catch {
    return { skills: [], departments: [] }
  }
}

export default async function HomePage() {
  const { skills, departments } = await getCatalogData()

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-heading-lg font-semibold text-foreground">Skill Catalog</h1>
          <p className="text-body-md text-muted-foreground mt-1">
            Browse and discover all Claude Agent Skills in your organization.
          </p>
        </div>
        <Link
          href="/skill/new"
          data-testid="new-skill-button"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md text-body-sm font-medium bg-[hsl(var(--brand))] text-[hsl(var(--brand-foreground))] hover:bg-[hsl(var(--brand-deep))] transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:shadow-focus shrink-0"
        >
          + New Skill
        </Link>
      </div>

      {/* Catalog with search, facets, and skill cards */}
      <Suspense fallback={<div className="text-body-sm text-muted-foreground">Loading catalog…</div>}>
        <CatalogPage
          initialSkills={skills as any}
          departments={departments}
        />
      </Suspense>
    </div>
  )
}
