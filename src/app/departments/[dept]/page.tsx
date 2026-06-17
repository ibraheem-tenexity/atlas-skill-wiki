export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/db'
import { SkillCard } from '@/components/skill-card'
import { DepartmentHealth } from '@/components/department-health'
import { DeptLeadActions } from '@/components/dept-lead-actions'

interface DepartmentDetailPageProps {
  params: { dept: string }
}

const STATUS_LABELS: Record<string, string> = {
  Draft: 'Draft',
  InReview: 'In Review',
  Approved: 'Approved',
  Deprecated: 'Deprecated',
}

export default async function DepartmentDetailPage({
  params,
}: DepartmentDetailPageProps) {
  const [dept, session] = await Promise.all([
    prisma.department.findUnique({
      where: { slug: params.dept },
      include: {
        lead: true,
        skills: {
          include: {
            owner: true,
            department: true,
            _count: { select: { connectionsFrom: true, connectionsTo: true, versions: true } },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    }),
    getServerSession(authOptions),
  ])

  if (!dept) notFound()

  const user = session?.user as any

  // Determine if the current user can perform lead actions for this dept
  const isDeptLead =
    user?.role === 'dept_lead' && user?.departmentId === dept.id
  const isGovAdmin = user?.role === 'gov_admin'
  const canLeadAction = isDeptLead || isGovAdmin

  // Governance counts
  const statusCounts = dept.skills.reduce<Record<string, number>>(
    (acc, skill) => {
      acc[skill.governanceStatus] = (acc[skill.governanceStatus] ?? 0) + 1
      return acc
    },
    {},
  )

  const totalCount = dept.skills.length
  const approvedCount = statusCounts['Approved'] ?? 0
  const inReviewCount = statusCounts['InReview'] ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="category-label mb-2">Department</p>
        <h1 className="text-heading-lg font-semibold text-foreground">{dept.name}</h1>
        {dept.description && (
          <p className="text-body-md text-muted-foreground mt-1">{dept.description}</p>
        )}
      </div>

      {/* Meta bar */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex flex-wrap gap-6">
          {/* Lead */}
          <div>
            <p className="category-label mb-1">Lead</p>
            <p className="text-body-sm font-medium text-foreground">
              {dept.lead ? dept.lead.name : <span className="text-muted-foreground italic">Unassigned</span>}
            </p>
          </div>

          {/* Skill count */}
          <div>
            <p className="category-label mb-1">Skills</p>
            <p className="text-body-sm font-medium text-foreground tabular">{totalCount}</p>
          </div>
        </div>

        {/* Health bar */}
        <DepartmentHealth
          approvedCount={approvedCount}
          totalCount={totalCount}
          className="max-w-xs"
        />
      </div>

      {/* Governance summary */}
      {totalCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['Draft', 'InReview', 'Approved', 'Deprecated'] as const).map((status) => (
            <div
              key={status}
              className="rounded-lg border border-border bg-card p-4 text-center"
            >
              <p className="text-heading-md font-semibold text-foreground tabular">
                {statusCounts[status] ?? 0}
              </p>
              <p className="text-body-sm text-muted-foreground mt-0.5">
                {STATUS_LABELS[status]}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Lead actions */}
      {canLeadAction && inReviewCount > 0 && (
        <DeptLeadActions deptSlug={dept.slug} inReviewCount={inReviewCount} />
      )}

      {/* Skills grid */}
      <div>
        <h2 className="text-heading-sm font-semibold text-foreground mb-4">Skills</h2>
        {dept.skills.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-sunken py-16">
            <p className="text-body-sm text-muted-foreground">
              No skills have been assigned to this department yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dept.skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill as any} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
