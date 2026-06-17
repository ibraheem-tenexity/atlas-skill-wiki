import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const skill = await prisma.skill.findUnique({ where: { slug: params.slug } })
  if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const versions = await prisma.skillVersion.findMany({
    where: { skillId: skill.id },
    include: { author: true },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(versions)
}
