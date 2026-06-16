/**
 * Minimal seed: default Policy record + default Departments.
 * Full seed data is handled in Ticket 16.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Default departments
  const departments = [
    { name: 'Engineering', slug: 'engineering', description: 'Software engineering teams' },
    { name: 'Product', slug: 'product', description: 'Product management and design' },
    { name: 'Operations', slug: 'operations', description: 'Business operations and support' },
    { name: 'Finance', slug: 'finance', description: 'Finance and accounting' },
    { name: 'Legal', slug: 'legal', description: 'Legal and compliance' },
  ]

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { slug: dept.slug },
      update: {},
      create: dept,
    })
  }
  console.log(`Seeded ${departments.length} departments.`)

  // Default governance policy
  const existing = await prisma.policy.findFirst()
  if (!existing) {
    await prisma.policy.create({
      data: {
        requiredFields: ['name', 'description', 'departmentId', 'ownerId'],
        allowedDepartments: departments.map((d) => d.slug),
        reviewSlaDays: 7,
      },
    })
    console.log('Seeded default Policy record.')
  } else {
    console.log('Policy already exists, skipping.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
