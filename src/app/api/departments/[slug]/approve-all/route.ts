import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/db'

export async function POST(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const session = await getServerSession(authOptions)
  const user = session?.user as any

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dept = await prisma.department.findUnique({
    where: { slug: params.slug },
    include: { skills: { where: { governanceStatus: 'InReview' }, select: { id: true } } },
  })

  if (!dept) {
    return NextResponse.json({ error: 'Department not found' }, { status: 404 })
  }

  // Only dept_lead for this dept or gov_admin may bulk-approve
  const isDeptLead =
    user.role === 'dept_lead' && user.departmentId === dept.id
  const isGovAdmin = user.role === 'gov_admin'

  if (!isDeptLead && !isGovAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const skillIds = dept.skills.map((s) => s.id)

  if (skillIds.length === 0) {
    return NextResponse.json({ updated: 0 })
  }

  const result = await prisma.skill.updateMany({
    where: { id: { in: skillIds } },
    data: { governanceStatus: 'Approved' },
  })

  // Audit each approval
  await prisma.auditLog.createMany({
    data: skillIds.map((skillId) => ({
      actorId: user.userId,
      action: 'bulk_approve',
      targetType: 'Skill',
      targetId: skillId,
      skillId,
      metadata: { source: 'dept_bulk_approve', departmentSlug: params.slug },
    })),
  })

  return NextResponse.json({ updated: result.count })
}
