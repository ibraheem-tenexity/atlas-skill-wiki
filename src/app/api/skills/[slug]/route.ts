export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const skill = await prisma.skill.findUnique({
    where: { slug: params.slug },
    include: {
      department: true,
      owner: true,
      versions: { include: { author: true }, orderBy: { date: 'desc' } },
      connectionsFrom: { include: { toSkill: true } },
      connectionsTo: { include: { fromSkill: true } },
      deployments: { include: { createdBy: true } },
      auditLogs: { include: { actor: true }, orderBy: { timestamp: 'desc' }, take: 20 },
    }
  })

  if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(skill)
}
