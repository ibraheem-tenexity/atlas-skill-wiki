import { NextResponse } from 'next/server'
import { DepartmentStore } from '@/lib/storage'

export async function GET() {
  const departments = await DepartmentStore.list()
  return NextResponse.json(departments)
}
