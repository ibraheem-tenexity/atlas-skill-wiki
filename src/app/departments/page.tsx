export const dynamic = 'force-dynamic'

import { Building2 } from 'lucide-react'
import prisma from '@/lib/db'
import { DepartmentCard } from '@/components/department-card'

export default async function DepartmentsPage() {
  const departments = await prisma.department.findMany({
    include: {
      lead: true,
      _count: { select: { skills: true } },
      skills: { select: { governanceStatus: true } },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-lg font-semibold text-foreground">Departments</h1>
        <p className="text-body-md text-muted-foreground mt-1">
          View skills organized by department.
        </p>
      </div>

      {departments.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-sunken py-20">
          <div className="flex flex-col items-center gap-3 text-center">
            <Building2 className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-body-md font-medium text-foreground">No departments yet</p>
            <p className="text-body-sm text-muted-foreground">
              Departments will appear here once skills are assigned to them.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <DepartmentCard key={dept.id} department={dept} />
          ))}
        </div>
      )}
    </div>
  )
}
