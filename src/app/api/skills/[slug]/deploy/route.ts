import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// Stub connector behind stable interface
function generateInstallSnippet(surface: string, skillName: string, version: string): string {
  const surfaceMap: Record<string, string> = {
    'claude_code': `# Claude Code\nnpx skills add ${skillName.toLowerCase().replace(/\s+/g, '-')}@${version}`,
    'web_agent': `// Web Agent SDK\nimport { loadSkill } from '@anthropic/agent-sdk'\nconst skill = await loadSkill('${skillName.toLowerCase().replace(/\s+/g, '-')}', '${version}')`,
    'slack_bot': `# Slack Bot\nskills install ${skillName.toLowerCase().replace(/\s+/g, '-')}@${version} --surface slack`,
  }
  return surfaceMap[surface] || `# Install ${skillName} v${version} on ${surface}`
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const { surface, versionPin } = await req.json()

  const skill = await prisma.skill.findUnique({ where: { slug: params.slug } })
  if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (skill.governanceStatus !== 'Approved') {
    return NextResponse.json({ error: 'Only Approved skills can be deployed' }, { status: 400 })
  }

  // Find system user
  const systemUser =
    (await prisma.user.findFirst({ where: { email: 'builder@atlas.dev' } })) ||
    (await prisma.user.findFirst({ where: { email: 'author@atlas.dev' } })) ||
    (await prisma.user.findFirst())

  if (!systemUser) return NextResponse.json({ error: 'No user found' }, { status: 500 })

  const installSnippet = generateInstallSnippet(surface, skill.name, versionPin || skill.currentVersion)

  const deployment = await prisma.deployment.create({
    data: {
      skillId: skill.id,
      surface: surface as any,
      versionPin: versionPin || skill.currentVersion,
      installSnippet,
      createdById: systemUser.id,
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: systemUser.id,
      action: 'deploy',
      targetType: 'Skill',
      targetId: skill.id,
      skillId: skill.id,
      metadata: { surface, version: versionPin } as any,
    },
  })

  return NextResponse.json({
    id: deployment.id,
    installSnippet,
    surface,
    versionPin: deployment.versionPin,
  })
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const skill = await prisma.skill.findUnique({ where: { slug: params.slug } })
  if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const deployments = await prisma.deployment.findMany({
    where: { skillId: skill.id },
    include: { createdBy: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(deployments)
}
