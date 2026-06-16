/**
 * Client-safe auth helpers.
 *
 * These mirror the server helpers in auth.ts but accept the session object
 * directly — safe to call from 'use client' components.
 */

export function canEdit(session: any): boolean {
  const role = session?.user?.role
  return role === 'skill_author' || role === 'dept_lead' || role === 'gov_admin'
}

export function canApprove(session: any, departmentId?: string): boolean {
  const role = session?.user?.role
  if (role === 'gov_admin') return true
  if (role === 'dept_lead') {
    return !departmentId || session?.user?.departmentId === departmentId
  }
  return false
}

export function canDeploy(session: any): boolean {
  return session?.user?.role === 'agent_builder' || session?.user?.role === 'gov_admin'
}
