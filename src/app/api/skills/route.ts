import { NextRequest, NextResponse } from 'next/server'
import matter from 'gray-matter'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/db'

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, description, department: departmentName, tags, visibility, body: skillBody, isDraft } = body

  if (!name || !description || !departmentName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const slug = slugify(name)

  const existing = await prisma.skill.findUnique({ where: { slug } })
  if (existing && !isDraft) {
    return NextResponse.json({ error: 'A skill with this name already exists', slug: existing.slug }, { status: 409 })
  }

  let dept = await prisma.department.findFirst({ where: { name: departmentName } })
  if (!dept) {
    const deptSlug = slugify(departmentName)
    dept = await prisma.department.create({
      data: { name: departmentName, slug: deptSlug, description: `${departmentName} department` }
    })
  }

  let systemUser = await prisma.user.findFirst({ where: { email: 'author@atlas.dev' } })
  if (!systemUser) {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('demo-author-2024', 10)
    systemUser = await prisma.user.create({
      data: {
        email: 'author@atlas.dev',
        name: 'Demo Author',
        password: hash,
        role: 'skill_author',
        departmentId: dept.id,
      }
    })
  }

  let frontmatter: Prisma.InputJsonValue = {}
  try {
    const parsed = matter(skillBody || '')
    frontmatter = parsed.data as Prisma.InputJsonValue
  } catch {
    // ignore parse errors
  }

  const tagList = typeof tags === 'string'
    ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    : Array.isArray(tags) ? tags : []

  const version = '1.0.0'

  const skill = existing
    ? await prisma.skill.update({
        where: { slug },
        data: {
          name, description, tags: tagList,
          visibility: (visibility || 'internal') as 'public' | 'internal' | 'restricted',
          body: skillBody || '',
          frontmatter,
          updatedAt: new Date(),
        }
      })
    : await prisma.skill.create({
        data: {
          name, slug, description,
          departmentId: dept.id,
          tags: tagList,
          visibility: (visibility || 'internal') as 'public' | 'internal' | 'restricted',
          currentVersion: version,
          governanceStatus: 'Draft',
          ownerId: systemUser.id,
          frontmatter,
          body: skillBody || '',
        }
      })

  await prisma.skillVersion.create({
    data: {
      skillId: skill.id,
      semver: version,
      authorId: systemUser.id,
      status: isDraft ? 'draft' : 'published',
      bodySnapshot: skillBody || '',
      frontmatterSnapshot: frontmatter,
      validationLog: [] as unknown as Prisma.InputJsonValue,
    }
  })

  await prisma.auditLog.create({
    data: {
      actorId: systemUser.id,
      action: isDraft ? 'save_draft' : 'publish',
      targetType: 'Skill',
      targetId: skill.id,
      skillId: skill.id,
      metadata: { version, name } as Prisma.InputJsonValue,
    }
  })

  return NextResponse.json({ slug: skill.slug, id: skill.id, version })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dept = searchParams.get('department')
  const search = searchParams.get('search')
  const status = searchParams.get('status')

  const where: Prisma.SkillWhereInput = {}
  if (dept && dept !== 'all') where.department = { name: dept }
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { description: { contains: search, mode: 'insensitive' } },
    { tags: { has: search } },
  ]
  if (status) where.governanceStatus = status as 'Draft' | 'InReview' | 'Approved' | 'Deprecated'

  const skills = await prisma.skill.findMany({
    where,
    include: {
      department: true,
      owner: true,
      _count: { select: { connectionsFrom: true, connectionsTo: true, versions: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(skills)
}
