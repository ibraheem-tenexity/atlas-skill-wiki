import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import prisma from '@/lib/db'
import { canTransition } from '@/lib/governance'

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action } = await req.json() // 'approve' | 'request_changes' | 'deprecate'
  const userRole = (session.user as any).role
  const userDeptId = (session.user as any).departmentId

  const skill = await prisma.skill.findUnique({
    where: { slug: params.slug },
    include: { department: true },
  })
  if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Role check: gov_admin can do anything; dept_lead can only act on their dept
  const isAdmin = userRole === 'gov_admin'
  const isLeadOfDept = userRole === 'dept_lead' && userDeptId === skill.departmentId
  if (!isAdmin && !isLeadOfDept) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const targetStatus =
    action === 'approve'
      ? 'Approved'
      : action === 'request_changes'
        ? 'InReview'
        : action === 'deprecate'
          ? 'Deprecated'
          : null

  if (!targetStatus) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  if (!canTransition(skill.governanceStatus as any, targetStatus as any)) {
    return NextResponse.json(
      { error: `Cannot transition from ${skill.governanceStatus} to ${targetStatus}` },
      { status: 400 },
    )
  }

  const updated = await prisma.skill.update({
    where: { slug: params.slug },
    data: { governanceStatus: targetStatus as any },
  })

  // Get or create actor user
  const actorEmail = (session.user as any).email || 'admin@atlas.dev'
  const actor = await prisma.user.findFirst({ where: { email: actorEmail } })

  if (actor) {
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action,
        targetType: 'Skill',
        targetId: skill.id,
        skillId: skill.id,
        metadata: { from: skill.governanceStatus, to: targetStatus } as any,
      },
    })
  }

  return NextResponse.json({ governanceStatus: updated.governanceStatus })
}
