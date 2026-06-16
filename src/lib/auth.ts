import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export async function requireSession() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return session
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireSession()
  if (!allowedRoles.includes((session.user as any).role)) {
    throw new Error('Unauthorized')
  }
  return session
}

export function canEdit(session: any) {
  const role = session?.user?.role
  return role === 'skill_author' || role === 'dept_lead' || role === 'gov_admin'
}

export function canApprove(session: any, departmentId?: string) {
  const role = session?.user?.role
  if (role === 'gov_admin') return true
  if (role === 'dept_lead') {
    return !departmentId || session?.user?.departmentId === departmentId
  }
  return false
}

export function canDeploy(session: any) {
  return session?.user?.role === 'agent_builder' || session?.user?.role === 'gov_admin'
}

export function isReader(session: any) {
  return session?.user?.role === 'reader'
}
