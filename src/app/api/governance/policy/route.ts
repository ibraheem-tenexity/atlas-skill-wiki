import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function PATCH(req: NextRequest) {
  try {
    const { requiredFields, allowedDepartments, reviewSlaDays } = await req.json()

    const existing = await prisma.policy.findFirst()
    const policy = existing
      ? await prisma.policy.update({
          where: { id: existing.id },
          data: { requiredFields, allowedDepartments, reviewSlaDays },
        })
      : await prisma.policy.create({
          data: { requiredFields, allowedDepartments, reviewSlaDays },
        })

    return NextResponse.json(policy)
  } catch (err) {
    console.error('Policy update error:', err)
    return NextResponse.json(
      { error: 'Failed to update policy' },
      { status: 500 },
    )
  }
}
