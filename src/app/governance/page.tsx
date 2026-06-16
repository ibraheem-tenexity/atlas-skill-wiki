import prisma from '@/lib/db'
import GovernanceDashboard from '@/components/governance-dashboard'

export default async function GovernancePage() {
  const [skills, depts, auditLogs, policy] = await Promise.all([
    prisma.skill.findMany({ include: { department: true, owner: true } }),
    prisma.department.findMany({ include: { _count: { select: { skills: true } } } }),
    prisma.auditLog.findMany({
      include: { actor: true, skill: true },
      orderBy: { timestamp: 'desc' },
      take: 50,
    }),
    prisma.policy.findFirst(),
  ])
  return (
    <GovernanceDashboard
      skills={skills}
      departments={depts}
      auditLogs={auditLogs}
      policy={policy}
    />
  )
}
