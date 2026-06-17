export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { validateSkill } from '@/lib/validator'
import prisma from '@/lib/db'

export async function POST(req: NextRequest) {
  const { name, description, department, body, existingSlug } = await req.json()

  const result = await validateSkill({
    name,
    description,
    department,
    body,
    existingSlug,
    checkUniqueness: async (slug: string) => {
      const existing = await prisma.skill.findUnique({ where: { slug } })
      return !!existing
    },
  })

  return NextResponse.json(result)
}
