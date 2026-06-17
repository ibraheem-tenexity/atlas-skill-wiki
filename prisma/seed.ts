/**
 * Ticket 16: Comprehensive seed data across departments including Finance.
 * Idempotent — uses upsert throughout so it can be re-run safely.
 *
 * IMPORTANT: invoice-summarizer slug is intentionally NOT seeded (reserved for AC-1 test).
 */
import { PrismaClient, Role, GovernanceStatus, Visibility, ConnectionType, VersionStatus, Surface } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL!
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function skillBody(name: string, description: string, department: string, version: string, tags: string[]): string {
  return `---
name: ${name}
version: ${version}
department: ${department}
tags: [${tags.join(', ')}]
---

# ${name}

${description}

## Overview

This skill is maintained by the **${department}** department and provides automated assistance to streamline workflows. It is designed to be reliable, auditable, and easy to integrate.

## Usage

Invoke this skill through the Atlas platform by navigating to the skill detail page and selecting **Deploy**. Choose the appropriate surface (Claude Code, Web Agent, or Slack Bot) and follow the integration guide.

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`input\`  | string | Yes | Primary input text or document |
| \`context\`| string | No  | Additional context to guide the skill |

## Outputs

Returns a structured JSON response with the following fields:
- \`result\`: The main skill output
- \`confidence\`: Confidence score (0–1)
- \`metadata\`: Additional processing metadata

## Governance

- **Status**: Reviewed and approved by department lead
- **Review SLA**: 7 days
- **Audit**: All invocations are logged to the Atlas audit trail

## Changelog

### ${version}
- Initial release
`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('Starting seed...')

  // -------------------------------------------------------------------------
  // 1. Upsert departments
  // -------------------------------------------------------------------------
  const departmentDefs = [
    { name: 'Finance',     slug: 'finance',     description: 'Finance and accounting' },
    { name: 'Engineering', slug: 'engineering', description: 'Software engineering teams' },
    { name: 'Legal',       slug: 'legal',       description: 'Legal and compliance' },
    { name: 'Marketing',   slug: 'marketing',   description: 'Marketing and growth' },
    { name: 'Operations',  slug: 'operations',  description: 'Business operations and support' },
    { name: 'HR',          slug: 'hr',          description: 'Human resources and people ops' },
  ]

  for (const dept of departmentDefs) {
    await prisma.department.upsert({
      where:  { slug: dept.slug },
      update: { name: dept.name, description: dept.description },
      create: dept,
    })
  }
  console.log(`Seeded ${departmentDefs.length} departments.`)

  // Fetch department records for later use
  const depts = Object.fromEntries(
    await Promise.all(
      departmentDefs.map(async d => [d.slug, await prisma.department.findUniqueOrThrow({ where: { slug: d.slug } })])
    )
  )

  // -------------------------------------------------------------------------
  // 2. Upsert users (one per role, bcrypt-hashed passwords)
  // -------------------------------------------------------------------------
  const SALT_ROUNDS = 10

  const userDefs = [
    { email: 'author@atlas.dev',  name: 'Demo Author',    role: Role.skill_author,  password: 'demo-author-2024',  deptSlug: 'engineering' },
    { email: 'lead@atlas.dev',    name: 'Finance Lead',   role: Role.dept_lead,     password: 'demo-lead-2024',    deptSlug: 'finance'     },
    { email: 'admin@atlas.dev',   name: 'Platform Admin', role: Role.gov_admin,     password: 'demo-admin-2024',   deptSlug: null          },
    { email: 'builder@atlas.dev', name: 'Agent Builder',  role: Role.agent_builder, password: 'demo-builder-2024', deptSlug: 'engineering' },
    { email: 'reader@atlas.dev',  name: 'Read-only User', role: Role.reader,        password: 'demo-reader-2024',  deptSlug: null          },
  ]

  for (const u of userDefs) {
    const hashed = await bcrypt.hash(u.password, SALT_ROUNDS)
    await prisma.user.upsert({
      where:  { email: u.email },
      update: { name: u.name, role: u.role, password: hashed, departmentId: u.deptSlug ? depts[u.deptSlug].id : null },
      create: {
        email:        u.email,
        name:         u.name,
        role:         u.role,
        password:     hashed,
        departmentId: u.deptSlug ? depts[u.deptSlug].id : null,
      },
    })
  }
  console.log(`Seeded ${userDefs.length} users.`)

  // Fetch user records for later use
  const users = Object.fromEntries(
    await Promise.all(
      userDefs.map(async u => [u.email, await prisma.user.findUniqueOrThrow({ where: { email: u.email } })])
    )
  )

  // -------------------------------------------------------------------------
  // 3. Set Finance department lead to lead@atlas.dev
  // -------------------------------------------------------------------------
  await prisma.department.update({
    where: { slug: 'finance' },
    data:  { leadId: users['lead@atlas.dev'].id },
  })
  console.log('Set Finance lead.')

  // -------------------------------------------------------------------------
  // 4. Upsert skills with body / frontmatter / tags
  // -------------------------------------------------------------------------
  const skillDefs = [
    {
      slug:             'contract-reviewer',
      name:             'Contract Reviewer',
      description:      'Reviews contracts for standard clauses and flags anomalies for legal review.',
      deptSlug:         'legal',
      governanceStatus: GovernanceStatus.Approved,
      visibility:       Visibility.internal,
      tags:             ['legal', 'contracts', 'compliance', 'review'],
      ownerEmail:       'author@atlas.dev',
    },
    {
      slug:             'expense-report-processor',
      name:             'Expense Report Processor',
      description:      'Processes and categorizes expense reports submitted by employees.',
      deptSlug:         'finance',
      governanceStatus: GovernanceStatus.Approved,
      visibility:       Visibility.internal,
      tags:             ['finance', 'expenses', 'automation'],
      ownerEmail:       'lead@atlas.dev',
    },
    {
      slug:             'onboarding-checklist',
      name:             'Onboarding Checklist',
      description:      'Generates a personalized onboarding checklist for new employees.',
      deptSlug:         'hr',
      governanceStatus: GovernanceStatus.Draft,
      visibility:       Visibility.internal,
      tags:             ['hr', 'onboarding', 'checklist'],
      ownerEmail:       'author@atlas.dev',
    },
    {
      slug:             'code-review-assistant',
      name:             'Code Review Assistant',
      description:      'Analyzes pull requests and provides structured code review feedback.',
      deptSlug:         'engineering',
      governanceStatus: GovernanceStatus.Approved,
      visibility:       Visibility.internal,
      tags:             ['engineering', 'code-review', 'pull-request', 'quality'],
      ownerEmail:       'author@atlas.dev',
    },
    {
      slug:             'campaign-brief-writer',
      name:             'Campaign Brief Writer',
      description:      'Drafts marketing campaign briefs from product specs and audience data.',
      deptSlug:         'marketing',
      governanceStatus: GovernanceStatus.InReview,
      visibility:       Visibility.internal,
      tags:             ['marketing', 'campaigns', 'copywriting'],
      ownerEmail:       'author@atlas.dev',
    },
    {
      slug:             'vendor-invoice-matcher',
      name:             'Vendor Invoice Matcher',
      description:      'Matches incoming vendor invoices against purchase orders in the ERP.',
      deptSlug:         'finance',
      governanceStatus: GovernanceStatus.Approved,
      visibility:       Visibility.internal,
      tags:             ['finance', 'invoices', 'erp', 'matching'],
      ownerEmail:       'lead@atlas.dev',
    },
    {
      slug:             'incident-summarizer',
      name:             'Incident Summarizer',
      description:      'Summarizes incident reports into executive-ready status updates.',
      deptSlug:         'operations',
      governanceStatus: GovernanceStatus.Draft,
      visibility:       Visibility.internal,
      tags:             ['operations', 'incidents', 'reporting'],
      ownerEmail:       'author@atlas.dev',
    },
    {
      slug:             'policy-qa',
      name:             'Policy Q&A',
      description:      'Answers employee questions about company policies from the policy handbook.',
      deptSlug:         'legal',
      governanceStatus: GovernanceStatus.Approved,
      visibility:       Visibility.internal,
      tags:             ['legal', 'policy', 'qa', 'handbook'],
      ownerEmail:       'author@atlas.dev',
    },
    {
      slug:             'budget-variance-analyzer',
      name:             'Budget Variance Analyzer',
      description:      'Analyzes budget vs actual spend and explains key variances.',
      deptSlug:         'finance',
      governanceStatus: GovernanceStatus.InReview,
      visibility:       Visibility.internal,
      tags:             ['finance', 'budget', 'analytics', 'variance'],
      ownerEmail:       'lead@atlas.dev',
    },
  ]

  for (const s of skillDefs) {
    const body = skillBody(s.name, s.description, depts[s.deptSlug].name, '1.0.0', s.tags)
    const frontmatter = {
      name:       s.name,
      version:    '1.0.0',
      department: depts[s.deptSlug].name,
      tags:       s.tags,
      status:     s.governanceStatus,
    }

    await prisma.skill.upsert({
      where:  { slug: s.slug },
      update: {
        name:             s.name,
        description:      s.description,
        departmentId:     depts[s.deptSlug].id,
        tags:             s.tags,
        visibility:       s.visibility,
        governanceStatus: s.governanceStatus,
        ownerId:          users[s.ownerEmail].id,
        frontmatter,
        body,
      },
      create: {
        slug:             s.slug,
        name:             s.name,
        description:      s.description,
        departmentId:     depts[s.deptSlug].id,
        tags:             s.tags,
        visibility:       s.visibility,
        currentVersion:   '1.0.0',
        governanceStatus: s.governanceStatus,
        ownerId:          users[s.ownerEmail].id,
        frontmatter,
        body,
      },
    })
  }
  console.log(`Seeded ${skillDefs.length} skills.`)

  // Fetch skill records for later use
  const skills = Object.fromEntries(
    await Promise.all(
      skillDefs.map(async s => [s.slug, await prisma.skill.findUniqueOrThrow({ where: { slug: s.slug } })])
    )
  )

  // -------------------------------------------------------------------------
  // 5. Create SkillVersions (semver 1.0.0, status published)
  //    Use upsert-by-skillId+semver if we can; Connection has no unique on that
  //    so we check first and skip if it exists.
  // -------------------------------------------------------------------------
  for (const s of skillDefs) {
    const skill = skills[s.slug]
    const existing = await prisma.skillVersion.findFirst({
      where: { skillId: skill.id, semver: '1.0.0' },
    })
    if (!existing) {
      await prisma.skillVersion.create({
        data: {
          skillId:             skill.id,
          semver:              '1.0.0',
          authorId:            users[s.ownerEmail].id,
          status:              VersionStatus.published,
          bodySnapshot:        skill.body,
          frontmatterSnapshot: skill.frontmatter as object,
          validationLog:       [],
          diff:                null,
        },
      })
    }
  }
  console.log('Seeded SkillVersions.')

  // -------------------------------------------------------------------------
  // 6. Create Connections (idempotent check-before-create)
  // -------------------------------------------------------------------------
  const connectionDefs = [
    { from: 'contract-reviewer',         to: 'policy-qa',                  type: ConnectionType.depends_on  },
    { from: 'expense-report-processor',  to: 'vendor-invoice-matcher',     type: ConnectionType.related_to  },
    { from: 'code-review-assistant',     to: 'incident-summarizer',        type: ConnectionType.related_to  },
    { from: 'budget-variance-analyzer',  to: 'expense-report-processor',   type: ConnectionType.depends_on  },
  ]

  for (const c of connectionDefs) {
    const existing = await prisma.connection.findFirst({
      where: {
        fromSkillId: skills[c.from].id,
        toSkillId:   skills[c.to].id,
        type:        c.type,
      },
    })
    if (!existing) {
      await prisma.connection.create({
        data: {
          fromSkillId: skills[c.from].id,
          toSkillId:   skills[c.to].id,
          type:        c.type,
        },
      })
    }
  }
  console.log(`Seeded ${connectionDefs.length} connections.`)

  // -------------------------------------------------------------------------
  // 7. Upsert Policy (singleton — find or create)
  // -------------------------------------------------------------------------
  const existingPolicy = await prisma.policy.findFirst()
  if (!existingPolicy) {
    await prisma.policy.create({
      data: {
        requiredFields:     ['name', 'description', 'department'],
        allowedDepartments: ['Finance', 'Engineering', 'Legal', 'Marketing', 'Operations', 'HR'],
        reviewSlaDays:      7,
        updatedById:        users['admin@atlas.dev'].id,
      },
    })
    console.log('Seeded Policy.')
  } else {
    await prisma.policy.update({
      where: { id: existingPolicy.id },
      data:  {
        requiredFields:     ['name', 'description', 'department'],
        allowedDepartments: ['Finance', 'Engineering', 'Legal', 'Marketing', 'Operations', 'HR'],
        reviewSlaDays:      7,
        updatedById:        users['admin@atlas.dev'].id,
      },
    })
    console.log('Updated existing Policy.')
  }

  // -------------------------------------------------------------------------
  // 8. Create a Deployment for code-review-assistant (idempotent check)
  // -------------------------------------------------------------------------
  const codeReviewSkill = skills['code-review-assistant']
  const existingDeployment = await prisma.deployment.findFirst({
    where: { skillId: codeReviewSkill.id, surface: Surface.claude_code },
  })
  if (!existingDeployment) {
    await prisma.deployment.create({
      data: {
        skillId:        codeReviewSkill.id,
        surface:        Surface.claude_code,
        versionPin:     '1.0.0',
        installSnippet: `npx skills add atlas/code-review-assistant@1.0.0`,
        createdById:    users['builder@atlas.dev'].id,
      },
    })
    console.log('Seeded Deployment for code-review-assistant.')
  }

  // -------------------------------------------------------------------------
  // 9. Create AuditLog entries for approved skills
  // -------------------------------------------------------------------------
  const approvedSkills = skillDefs.filter(s => s.governanceStatus === GovernanceStatus.Approved)
  for (const s of approvedSkills) {
    const skill = skills[s.slug]
    const existing = await prisma.auditLog.findFirst({
      where: { skillId: skill.id, action: 'skill.published' },
    })
    if (!existing) {
      await prisma.auditLog.create({
        data: {
          actorId:    users['admin@atlas.dev'].id,
          action:     'skill.published',
          targetType: 'Skill',
          targetId:   skill.id,
          skillId:    skill.id,
          metadata:   { version: '1.0.0', status: 'Approved' },
        },
      })
    }
  }
  console.log(`Seeded AuditLog entries for ${approvedSkills.length} approved skills.`)

  console.log('\nSeed complete!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
