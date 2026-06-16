import { notFound } from 'next/navigation'
import prisma from '@/lib/db'
import { SkillDetailClient } from '@/components/skill-detail-client'

interface SkillDetailPageProps {
  params: { slug: string }
}

export default async function SkillDetailPage({ params }: SkillDetailPageProps) {
  const skill = await prisma.skill.findUnique({
    where: { slug: params.slug },
    include: {
      department: true,
      owner: true,
      versions: { include: { author: true }, orderBy: { date: 'desc' } },
      connectionsFrom: { include: { toSkill: { include: { department: true } } } },
      connectionsTo: { include: { fromSkill: { include: { department: true } } } },
      deployments: { include: { createdBy: true } },
      auditLogs: { include: { actor: true }, orderBy: { timestamp: 'desc' }, take: 20 },
    },
  })

  if (!skill) notFound()

  return <SkillDetailClient skill={skill} />
}
