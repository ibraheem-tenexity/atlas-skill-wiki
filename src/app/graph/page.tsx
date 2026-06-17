import prisma from '@/lib/db'
import { GraphPageClient } from '@/components/graph-page-client'

export default async function GraphPage() {
  const [skills, connections] = await Promise.all([
    prisma.skill.findMany({ include: { department: true } }),
    prisma.connection.findMany({
      include: {
        fromSkill: true,
        toSkill: { include: { department: true } },
      },
    }),
  ])

  return <GraphPageClient skills={skills} connections={connections} />
}
